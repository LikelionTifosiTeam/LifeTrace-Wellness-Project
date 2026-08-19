'use client';

import {
  DailyCareCard,
  DailyVitals,
  EnvironmentSnapshot,
  RecoveryAlert,
  RecoveryScreenData,
  TodayScreenData,
} from '@/types';
import type {
  ClinicResponseRow,
  DailyCheckinRow,
  DailyVitalsRow,
  EnvironmentSnapshotRow,
  ProfileRow,
  RecoveryAlertRow,
  RecoveryJourneyRow,
} from '@/lib/supabase/database.types';
import {
  firstOf,
  toAlert,
  toCheckin,
  toEnvironment,
  toJourney,
  toUser,
  toVitals,
} from '@/lib/supabase/mappers';
import {
  buildCurveSeries,
  computeDeviationScore,
  computeRecoveryModifier,
  computeRecoveryProgress,
  getPhase,
  judgeStatus,
} from '@/lib/recovery';
import { generateCareCard } from '@/lib/careCard';
import { getProtocol } from '@/mock/protocols';
import { fallbackEnvironment } from '@/mock/reference';
import { todayKST } from '@/lib/utils';
import { ApiError, db, requireUserId } from './supabase';

// ---------------------------------------------------------------------------
// 조회 헬퍼
// ---------------------------------------------------------------------------

export async function fetchCurrentJourneyRow(userId: string): Promise<RecoveryJourneyRow> {
  const { data, error } = await db()
    .from('recovery_journeys')
    .select('*')
    .eq('user_id', userId)
    .is('completed_at', null)
    .order('procedure_date', { ascending: false })
    .limit(1)
    .maybeSingle<RecoveryJourneyRow>();
  if (error) throw new ApiError('QUERY_FAILED', '여정을 불러오지 못했습니다.');
  if (!data) throw new ApiError('JOURNEY_NOT_FOUND', '진행 중인 회복 여정이 없습니다.', 404);
  return data;
}

async function fetchCheckinRows(journeyId: string): Promise<DailyCheckinRow[]> {
  const { data, error } = await db()
    .from('daily_checkins')
    .select('*')
    .eq('journey_id', journeyId)
    .order('day', { ascending: true });
  if (error) throw new ApiError('QUERY_FAILED', '기록을 불러오지 못했습니다.');
  return (data ?? []) as DailyCheckinRow[];
}

export async function fetchVitals(userId: string, from: string): Promise<DailyVitals[]> {
  const { data, error } = await db()
    .from('daily_vitals')
    .select('*')
    .eq('user_id', userId)
    .gte('date', from)
    .order('date', { ascending: true });
  if (error) throw new ApiError('QUERY_FAILED', '컨디션 기록을 불러오지 못했습니다.');
  return ((data ?? []) as DailyVitalsRow[]).map(toVitals);
}

export async function fetchEnvironments(from: string): Promise<EnvironmentSnapshot[]> {
  const { data, error } = await db()
    .from('environment_snapshots')
    .select('*')
    .eq('region', 'seoul')
    .gte('date', from)
    .order('date', { ascending: true });
  if (error) return [];
  return ((data ?? []) as EnvironmentSnapshotRow[]).map(toEnvironment);
}

async function fetchAlerts(journeyId: string): Promise<RecoveryAlert[]> {
  const { data, error } = await db()
    .from('recovery_alerts')
    .select('*, clinic_responses(*)')
    .eq('journey_id', journeyId)
    .order('day', { ascending: false });
  if (error) throw new ApiError('QUERY_FAILED', '알림을 불러오지 못했습니다.');

  return (
    (data ?? []) as (RecoveryAlertRow & {
      clinic_responses: ClinicResponseRow | ClinicResponseRow[] | null;
    })[]
  ).map((row) => toAlert(row, firstOf(row.clinic_responses)));
}

function pickEnvironment(list: EnvironmentSnapshot[], date: string): EnvironmentSnapshot {
  return (
    list.find((e) => e.date === date) ?? list[list.length - 1] ?? fallbackEnvironment(date)
  );
}

function computeStreak(days: Set<number>, today: number): number {
  let streak = 0;
  for (let d = today; d >= 0; d--) {
    if (days.has(d)) streak++;
    else if (d !== today) break; // 오늘 미기록은 스트릭을 끊지 않는다
  }
  return streak;
}

function computeLongestStreak(days: Set<number>): number {
  const sorted = Array.from(days).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = -2;
  sorted.forEach((d) => {
    run = d === prev + 1 ? run + 1 : 1;
    prev = d;
    if (run > best) best = run;
  });
  return best;
}

/**
 * 케어 카드 문장을 서버 라우트에서 받는다.
 * ANTHROPIC_API_KEY가 있으면 LLM 문장, 없으면 서버가 로컬 생성기 결과를 돌려준다.
 * 어느 쪽이든 카드가 비는 일은 없다.
 */
async function fetchCareCardSentences(payload: unknown): Promise<DailyCareCard | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/care-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 화면 단위 조회
// ---------------------------------------------------------------------------

export const journeyService = {
  async getToday(): Promise<TodayScreenData> {
    const today = todayKST();
    const userId = await requireUserId();

    const [{ data: profile }, journeyRow] = await Promise.all([
      db().from('profiles').select('*').eq('id', userId).single<ProfileRow>(),
      fetchCurrentJourneyRow(userId),
    ]);
    if (!profile) throw new ApiError('PROFILE_NOT_FOUND', '프로필을 찾을 수 없습니다.', 404);

    const journey = toJourney(journeyRow, today);
    const protocol = getProtocol(journeyRow.protocol_id);

    const [checkinRows, vitals, environments, alerts] = await Promise.all([
      fetchCheckinRows(journey.id),
      fetchVitals(userId, journeyRow.procedure_date),
      fetchEnvironments(journeyRow.procedure_date),
      fetchAlerts(journey.id),
    ]);

    const checkins = checkinRows.map((r) => toCheckin(r));
    const environment = pickEnvironment(environments, today);
    const modifier = computeRecoveryModifier(vitals);
    const series = buildCurveSeries(protocol, checkins, journey.currentDay, modifier);
    const deviationScore = computeDeviationScore(series);
    const latest = checkins.length ? checkins[checkins.length - 1] : null;

    journey.recoveryProgress = computeRecoveryProgress(protocol, latest, journey.currentDay);
    journey.deviationScore = deviationScore;
    journey.status =
      journeyRow.status === 'completed'
        ? 'completed'
        : judgeStatus(deviationScore, journey.currentDay, protocol.totalRecoveryDays);

    const phase = getPhase(protocol, journey.currentDay);
    const todayCheckin = checkins.find((c) => c.day === journey.currentDay) ?? null;
    const yesterday = checkins.find((c) => c.day === journey.currentDay - 1) ?? null;

    const localCard = generateCareCard({
      journeyId: journey.id,
      date: today,
      day: journey.currentDay,
      protocol,
      phase,
      yesterdayCheckin: yesterday,
      vitals,
      environment,
    });

    const remoteCard = await fetchCareCardSentences({
      journeyId: journey.id,
      date: today,
      day: journey.currentDay,
      protocolId: protocol.id,
      yesterdayCheckin: yesterday,
      vitals,
      environment,
    });

    const days = new Set(checkins.map((c) => c.day));

    return {
      user: toUser(profile),
      journey,
      protocol,
      currentPhase: phase,
      careCard: remoteCard ?? localCard,
      todayCheckin,
      streak: {
        current: computeStreak(days, journey.currentDay),
        longest: computeLongestStreak(days),
        totalCheckins: checkins.length,
        completionRate: Math.round((checkins.length / (journey.currentDay + 1)) * 100),
      },
      activeAlert: alerts.find((a) => a.level !== 'info') ?? null,
      vitals: vitals.find((v) => v.date === today) ?? vitals[vitals.length - 1] ?? null,
      environment,
    };
  },

  async getRecovery(): Promise<RecoveryScreenData> {
    const today = todayKST();
    const userId = await requireUserId();
    const journeyRow = await fetchCurrentJourneyRow(userId);
    const journey = toJourney(journeyRow, today);
    const protocol = getProtocol(journeyRow.protocol_id);

    const [checkinRows, vitals, alerts] = await Promise.all([
      fetchCheckinRows(journey.id),
      fetchVitals(userId, journeyRow.procedure_date),
      fetchAlerts(journey.id),
    ]);

    const checkins = checkinRows.map((r) => toCheckin(r));
    const modifier = computeRecoveryModifier(vitals);
    const series = buildCurveSeries(protocol, checkins, journey.currentDay, modifier);
    const deviationScore = computeDeviationScore(series);
    const latest = checkins.length ? checkins[checkins.length - 1] : null;

    journey.recoveryProgress = computeRecoveryProgress(protocol, latest, journey.currentDay);
    journey.deviationScore = deviationScore;
    journey.status =
      journeyRow.status === 'completed'
        ? 'completed'
        : judgeStatus(deviationScore, journey.currentDay, protocol.totalRecoveryDays);

    return { journey, protocol, series, checkins, alerts };
  },

  async getAlerts(): Promise<RecoveryAlert[]> {
    const userId = await requireUserId();
    const journeyRow = await fetchCurrentJourneyRow(userId);
    return fetchAlerts(journeyRow.id);
  },

  /** 사용자가 명시적으로 동의할 때만 클리닉에 공유한다. DB 트리거가 최종 방어선이다. */
  async shareAlertWithClinic(alertId: string): Promise<RecoveryAlert> {
    const { data, error } = await db()
      .from('recovery_alerts')
      .update({ shared_with_clinic: true })
      .eq('id', alertId)
      .select('*, clinic_responses(*)')
      .single<
        RecoveryAlertRow & { clinic_responses: ClinicResponseRow | ClinicResponseRow[] | null }
      >();

    if (error) {
      if (error.message.includes('CONSENT_REQUIRED')) {
        throw new ApiError('CONSENT_REQUIRED', '설정에서 클리닉 공유 동의를 먼저 켜주세요.', 403);
      }
      throw new ApiError('QUERY_FAILED', '공유하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
    return toAlert(data, firstOf(data.clinic_responses));
  },
};
