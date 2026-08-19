/**
 * Supabase 데이터 소스 구현.
 *
 * services/*.ts 는 이 모듈과 mock 경로 중 하나를 고른다 (lib/env.ts#dataSource).
 * 화면이 필요로 하는 형태(TodayScreenData 등)로 조립하는 책임까지 여기서 진다 —
 * 페이지는 어느 소스에서 왔는지 알 필요가 없다.
 */

import {
  DailyCheckin,
  JourneyArchiveEntry,
  WearableSnapshot,
  RecoveryAlert,
  RecoveryScreenData,
  TodayScreenData,
  User,
  VitalsScreenData,
  WearableSource,
} from '@/types';
import type {
  ClinicResponseRow,
  DailyCheckinRow,
  EnvironmentSnapshotRow,
  JourneyArchiveRow,
  ProfileRow,
  RecoveryAlertRow,
  RecoveryJourneyRow,
  WearableSnapshotRow,
} from '@/lib/supabase/database.types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  toAlert,
  toArchiveEntry,
  toCheckin,
  toEnvironment,
  toJourney,
  toUser,
  toWearable,
  fromCheckin,
} from '@/lib/supabase/mappers';
import {
  buildCurveSeries,
  computeDeviationScore,
  computeRecoveryModifier,
  computeRecoveryProgress,
  detectDeviation,
  getPhase,
  judgeStatus,
  pearson,
} from '@/lib/recovery';
import { generateCareCard } from '@/lib/careCard';
import { getProtocol, mockCorrelations, mockEnvironments } from '@/mock/data';
import { addDays, todayKST } from '@/lib/utils';
import { ApiError } from './client';
import type { CheckinInput, CheckinResult } from './checkin';

function client() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new ApiError('NO_CLIENT', 'Supabase 클라이언트를 사용할 수 없습니다.');
  return supabase;
}

async function requireUserId(): Promise<string> {
  const { data, error } = await client().auth.getUser();
  if (error || !data.user) {
    throw new ApiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);
  }
  return data.user.id;
}

async function fetchProfile(userId: string): Promise<User> {
  const { data, error } = await client()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<ProfileRow>();
  if (error || !data) throw new ApiError('PROFILE_NOT_FOUND', '프로필을 찾을 수 없습니다.', 404);
  return toUser(data);
}

async function fetchCurrentJourney(userId: string): Promise<RecoveryJourneyRow> {
  const { data, error } = await client()
    .from('recovery_journeys')
    .select('*')
    .eq('user_id', userId)
    .is('completed_at', null)
    .order('procedure_date', { ascending: false })
    .limit(1)
    .maybeSingle<RecoveryJourneyRow>();
  if (error) throw new ApiError('QUERY_FAILED', error.message);
  if (!data) throw new ApiError('JOURNEY_NOT_FOUND', '진행 중인 회복 여정이 없습니다.', 404);
  return data;
}

async function fetchCheckinRows(journeyId: string): Promise<DailyCheckinRow[]> {
  const { data, error } = await client()
    .from('daily_checkins')
    .select('*')
    .eq('journey_id', journeyId)
    .order('day', { ascending: true });
  if (error) throw new ApiError('QUERY_FAILED', error.message);
  return (data ?? []) as DailyCheckinRow[];
}

async function fetchWearables(userId: string, from: string): Promise<WearableSnapshotRow[]> {
  const { data, error } = await client()
    .from('wearable_snapshots')
    .select('*')
    .eq('user_id', userId)
    .gte('date', from)
    .order('date', { ascending: true });
  if (error) throw new ApiError('QUERY_FAILED', error.message);
  return (data ?? []) as WearableSnapshotRow[];
}

async function fetchEnvironments(from: string): Promise<EnvironmentSnapshotRow[]> {
  const { data, error } = await client()
    .from('environment_snapshots')
    .select('*')
    .eq('region', 'seoul')
    .gte('date', from)
    .order('date', { ascending: true });
  if (error) throw new ApiError('QUERY_FAILED', error.message);
  return (data ?? []) as EnvironmentSnapshotRow[];
}

async function fetchAlerts(journeyId: string): Promise<RecoveryAlert[]> {
  const { data, error } = await client()
    .from('recovery_alerts')
    .select('*, clinic_responses(*)')
    .eq('journey_id', journeyId)
    .order('day', { ascending: false });
  if (error) throw new ApiError('QUERY_FAILED', error.message);

  return ((data ?? []) as (RecoveryAlertRow & { clinic_responses: ClinicResponseRow[] })[]).map(
    (row) => toAlert(row, row.clinic_responses?.[0] ?? null)
  );
}

// ---------------------------------------------------------------------------
// 화면 단위 조회
// ---------------------------------------------------------------------------

export const supabaseRepo = {
  async getCurrentUser(): Promise<User> {
    return fetchProfile(await requireUserId());
  },

  async getToday(): Promise<TodayScreenData> {
    const today = todayKST();
    const userId = await requireUserId();
    const [user, journeyRow] = await Promise.all([
      fetchProfile(userId),
      fetchCurrentJourney(userId),
    ]);

    const journey = toJourney(journeyRow, today);
    const protocol = getProtocol(journeyRow.protocol_id);
    const windowStart = addDays(journeyRow.procedure_date, 0);

    const [checkinRows, wearableRows, envRows, alerts] = await Promise.all([
      fetchCheckinRows(journey.id),
      fetchWearables(userId, windowStart),
      fetchEnvironments(windowStart),
      fetchAlerts(journey.id),
    ]);

    const checkins = checkinRows.map((r) => toCheckin(r));
    const wearables = wearableRows.map(toWearable);
    const environments = envRows.map(toEnvironment);
    const environment =
      environments.find((e) => e.date === today) ??
      environments[environments.length - 1] ??
      mockEnvironments[mockEnvironments.length - 1];

    const modifier = computeRecoveryModifier(wearables);
    const series = buildCurveSeries(protocol, checkins, journey.currentDay, modifier);
    const deviationScore = computeDeviationScore(series);
    const latest = checkins.length ? checkins[checkins.length - 1] : null;

    journey.recoveryProgress = computeRecoveryProgress(protocol, latest, journey.currentDay);
    journey.deviationScore = deviationScore;
    journey.status = judgeStatus(deviationScore, journey.currentDay, protocol.totalRecoveryDays);

    const phase = getPhase(protocol, journey.currentDay);
    const todayCheckin = checkins.find((c) => c.day === journey.currentDay) ?? null;
    const yesterday = checkins.find((c) => c.day === journey.currentDay - 1) ?? null;

    const careCard = await fetchCareCard({
      journeyId: journey.id,
      date: today,
      day: journey.currentDay,
      protocolId: protocol.id,
      yesterdayCheckin: yesterday,
      wearables,
      environment,
      phaseKey: phase.key,
    });

    const totalDays = journey.currentDay + 1;

    return {
      user,
      journey,
      protocol,
      currentPhase: phase,
      careCard,
      todayCheckin,
      streak: {
        current: computeStreak(checkins, journey.currentDay),
        longest: computeLongestStreak(checkins),
        totalCheckins: checkins.length,
        completionRate: Math.round((checkins.length / totalDays) * 100),
      },
      activeAlert: alerts.find((a) => a.level !== 'info') ?? null,
      wearable: wearables[wearables.length - 1] ?? null,
      environment,
    };
  },

  async getRecovery(): Promise<RecoveryScreenData> {
    const today = todayKST();
    const userId = await requireUserId();
    const journeyRow = await fetchCurrentJourney(userId);
    const journey = toJourney(journeyRow, today);
    const protocol = getProtocol(journeyRow.protocol_id);

    const [checkinRows, wearableRows, alerts] = await Promise.all([
      fetchCheckinRows(journey.id),
      fetchWearables(userId, journeyRow.procedure_date),
      fetchAlerts(journey.id),
    ]);

    const checkins = checkinRows.map((r) => toCheckin(r));
    const modifier = computeRecoveryModifier(wearableRows.map(toWearable));
    const series = buildCurveSeries(protocol, checkins, journey.currentDay, modifier);
    const deviationScore = computeDeviationScore(series);
    const latest = checkins.length ? checkins[checkins.length - 1] : null;

    journey.recoveryProgress = computeRecoveryProgress(protocol, latest, journey.currentDay);
    journey.deviationScore = deviationScore;
    journey.status = judgeStatus(deviationScore, journey.currentDay, protocol.totalRecoveryDays);

    return { journey, protocol, series, checkins, alerts };
  },

  async getAlerts(): Promise<RecoveryAlert[]> {
    const userId = await requireUserId();
    const journeyRow = await fetchCurrentJourney(userId);
    return fetchAlerts(journeyRow.id);
  },

  async shareAlertWithClinic(alertId: string): Promise<RecoveryAlert> {
    const { data, error } = await client()
      .from('recovery_alerts')
      .update({ shared_with_clinic: true })
      .eq('id', alertId)
      .select('*, clinic_responses(*)')
      .single<RecoveryAlertRow & { clinic_responses: ClinicResponseRow[] }>();

    if (error) {
      // DB 트리거가 동의 없는 공유를 막는다 (CONSENT_REQUIRED).
      if (error.message.includes('CONSENT_REQUIRED')) {
        throw new ApiError('CONSENT_REQUIRED', '설정에서 클리닉 공유 동의를 먼저 켜주세요.', 403);
      }
      throw new ApiError('QUERY_FAILED', error.message);
    }
    return toAlert(data, data.clinic_responses?.[0] ?? null);
  },

  async getCheckins(): Promise<DailyCheckin[]> {
    const userId = await requireUserId();
    const journeyRow = await fetchCurrentJourney(userId);
    const rows = await fetchCheckinRows(journeyRow.id);
    return rows.map((r) => toCheckin(r));
  },

  async submitCheckin(input: CheckinInput): Promise<CheckinResult> {
    const today = todayKST();
    const userId = await requireUserId();
    const journeyRow = await fetchCurrentJourney(userId);
    const journey = toJourney(journeyRow, today);
    const protocol = getProtocol(journeyRow.protocol_id);

    const payload = fromCheckin({
      journeyId: journey.id,
      userId,
      date: today,
      day: journey.currentDay,
      symptoms: input.symptoms,
      moodNote: input.moodNote,
      photoPath: input.photoUrl,
      followedRestrictions: input.followedRestrictions,
      durationSeconds: input.durationSeconds,
    });

    const { data, error } = await client()
      .from('daily_checkins')
      .upsert(payload, { onConflict: 'journey_id,date' })
      .select('*')
      .single<DailyCheckinRow>();
    if (error || !data) throw new ApiError('CHECKIN_FAILED', error?.message ?? '기록 저장 실패');

    const checkin = toCheckin(data);

    const [wearableRows, previousRows] = await Promise.all([
      fetchWearables(userId, journeyRow.procedure_date),
      fetchCheckinRows(journey.id),
    ]);
    const modifier = computeRecoveryModifier(wearableRows.map(toWearable));
    const draft = detectDeviation(protocol, checkin, modifier);

    let newAlert: RecoveryAlert | null = null;
    if (draft) {
      const { data: alertRow, error: alertError } = await client()
        .from('recovery_alerts')
        .upsert(
          {
            journey_id: journey.id,
            user_id: userId,
            date: today,
            day: journey.currentDay,
            level: draft.level,
            title: draft.title,
            detail: draft.detail,
            triggered_by: draft.triggeredBy,
            recommended_action: draft.recommendedAction,
          },
          { onConflict: 'journey_id,date' }
        )
        .select('*')
        .single<RecoveryAlertRow>();
      if (!alertError && alertRow) newAlert = toAlert(alertRow, null);
    }

    const yesterday = previousRows
      .map((r) => toCheckin(r))
      .find((c) => c.day === journey.currentDay - 1);
    const improved = yesterday
      ? (Object.keys(input.symptoms) as (keyof typeof input.symptoms)[]).filter(
          (k) => input.symptoms[k] < yesterday.symptoms[k]
        )
      : [];

    return { checkin, newAlert, improved };
  },

  async backfillCheckin(day: number, symptoms: Record<string, number>): Promise<DailyCheckin> {
    const userId = await requireUserId();
    const journeyRow = await fetchCurrentJourney(userId);
    const date = addDays(journeyRow.procedure_date, day);

    const { data, error } = await client()
      .from('daily_checkins')
      .upsert(
        {
          journey_id: journeyRow.id,
          user_id: userId,
          date,
          day,
          swelling: symptoms.swelling,
          redness: symptoms.redness,
          pain: symptoms.pain,
          peeling: symptoms.peeling,
          tightness: symptoms.tightness,
          followed_restrictions: true,
          duration_seconds: 0,
        },
        { onConflict: 'journey_id,date' }
      )
      .select('*')
      .single<DailyCheckinRow>();
    if (error || !data) throw new ApiError('CHECKIN_FAILED', error?.message ?? '기록 저장 실패');
    return toCheckin(data);
  },

  async saveManualVitals(input: {
    date: string;
    sleepHours: number;
    restingHr?: number;
    hrvMs?: number;
  }): Promise<WearableSnapshot> {
    const userId = await requireUserId();
    const { data, error } = await client()
      .from('wearable_snapshots')
      .upsert(
        {
          user_id: userId,
          date: input.date,
          source: 'manual',
          sleep_hours: input.sleepHours,
          sleep_quality: Math.round(Math.min(100, input.sleepHours * 12)),
          hrv_ms: input.hrvMs ?? null,
          resting_hr: input.restingHr ?? null,
          steps: null,
        },
        { onConflict: 'user_id,date' }
      )
      .select('*')
      .single<WearableSnapshotRow>();
    if (error || !data) throw new ApiError('QUERY_FAILED', error?.message ?? '저장 실패');
    return toWearable(data);
  },

  async getVitals(): Promise<VitalsScreenData> {
    const userId = await requireUserId();
    const [user, journeyRow] = await Promise.all([
      fetchProfile(userId),
      fetchCurrentJourney(userId),
    ]);

    const [wearableRows, envRows, checkinRows] = await Promise.all([
      fetchWearables(userId, journeyRow.procedure_date),
      fetchEnvironments(journeyRow.procedure_date),
      fetchCheckinRows(journeyRow.id),
    ]);

    const wearables = wearableRows.map(toWearable);
    const environments = envRows.map(toEnvironment);
    const checkins = checkinRows.map((r) => toCheckin(r));

    const sleepPairs: [number, number][] = [];
    const humidityPairs: [number, number][] = [];
    checkins.forEach((c) => {
      const w = wearables[c.day - 1];
      if (w) sleepPairs.push([w.sleepHours, c.symptoms.swelling]);
      const e = environments[c.day];
      if (e) humidityPairs.push([e.humidity, c.symptoms.tightness]);
    });

    const correlations = mockCorrelations.map((base) => {
      if (base.id === 'corr-001') {
        return {
          ...base,
          coefficient: pearson(sleepPairs.map((p) => p[0]), sleepPairs.map((p) => p[1])),
          sampleDays: sleepPairs.length,
        };
      }
      if (base.id === 'corr-003') {
        return {
          ...base,
          coefficient: pearson(
            humidityPairs.map((p) => p[0]),
            humidityPairs.map((p) => p[1])
          ),
          sampleDays: humidityPairs.length,
        };
      }
      return base;
    });

    return {
      wearables,
      environments,
      correlations,
      connected: Boolean(user.connectedWearable),
      source: user.connectedWearable,
    };
  },

  async connectWearable(source: WearableSource) {
    const userId = await requireUserId();
    const { error } = await client()
      .from('profiles')
      .update({ connected_wearable: source })
      .eq('id', userId);
    if (error) throw new ApiError('QUERY_FAILED', error.message);
    return { connected: true as const, source };
  },

  async completeJourney(input: {
    satisfactionScore: number;
    note?: string;
  }): Promise<JourneyArchiveEntry> {
    const today = todayKST();
    const userId = await requireUserId();
    const journeyRow = await fetchCurrentJourney(userId);
    const journey = toJourney(journeyRow, today);

    const { error: updateError } = await client()
      .from('recovery_journeys')
      .update({ status: 'completed', completed_at: new Date(`${today}T00:00:00+09:00`).toISOString() })
      .eq('id', journeyRow.id);
    if (updateError) throw new ApiError('QUERY_FAILED', updateError.message);

    const { data, error } = await client()
      .from('journey_archives')
      .upsert(
        {
          journey_id: journeyRow.id,
          user_id: userId,
          completed_day: journey.currentDay,
          satisfaction_score: input.satisfactionScore,
          learned_insight: input.note?.trim() ?? '',
        },
        { onConflict: 'journey_id' }
      )
      .select('*')
      .single<JourneyArchiveRow>();
    if (error || !data) throw new ApiError('QUERY_FAILED', error?.message ?? '아카이브 저장 실패');

    return toArchiveEntry(data, {
      procedure_name: journeyRow.procedure_name,
      clinic_name: journeyRow.clinic_name,
      procedure_date: journeyRow.procedure_date,
      status: 'completed',
    });
  },

  async getArchive(): Promise<JourneyArchiveEntry[]> {
    const userId = await requireUserId();
    const { data, error } = await client()
      .from('journey_archives')
      .select('*, recovery_journeys(procedure_name, clinic_name, procedure_date, status)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new ApiError('QUERY_FAILED', error.message);

    return ((data ?? []) as (JourneyArchiveRow & {
      recovery_journeys: Pick<
        RecoveryJourneyRow,
        'procedure_name' | 'clinic_name' | 'procedure_date' | 'status'
      >;
    })[]).map((row) => toArchiveEntry(row, row.recovery_journeys));
  },
};

// ---------------------------------------------------------------------------
// 케어 카드 — 서버 라우트에 위임 (LLM 키는 서버에만 존재)
// ---------------------------------------------------------------------------

async function fetchCareCard(params: {
  journeyId: string;
  date: string;
  day: number;
  protocolId: string;
  yesterdayCheckin: DailyCheckin | null;
  wearables: ReturnType<typeof toWearable>[];
  environment: ReturnType<typeof toEnvironment>;
  phaseKey: string;
}) {
  const protocol = getProtocol(params.protocolId);
  const phase = getPhase(protocol, params.day);

  const localCard = generateCareCard({
    journeyId: params.journeyId,
    date: params.date,
    day: params.day,
    protocol,
    phase,
    yesterdayCheckin: params.yesterdayCheckin,
    wearables: params.wearables,
    environment: params.environment,
  });

  try {
    const res = await fetch('/api/care-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        journeyId: params.journeyId,
        date: params.date,
        day: params.day,
        protocolId: params.protocolId,
        yesterdayCheckin: params.yesterdayCheckin,
        wearables: params.wearables,
        environment: params.environment,
      }),
    });
    if (!res.ok) return localCard;
    const json = await res.json();
    if (!json?.data) return localCard;
    return json.data;
  } catch {
    // 네트워크/LLM 실패 시에도 빈 카드를 보여주지 않는다.
    return localCard;
  }
}

// ---------------------------------------------------------------------------

function computeStreak(checkins: DailyCheckin[], today: number): number {
  const days = new Set(checkins.map((c) => c.day));
  let streak = 0;
  for (let d = today; d >= 0; d--) {
    if (days.has(d)) streak++;
    else if (d !== today) break;
  }
  return streak;
}

function computeLongestStreak(checkins: DailyCheckin[]): number {
  const days = Array.from(new Set(checkins.map((c) => c.day))).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = -2;
  days.forEach((d) => {
    run = d === prev + 1 ? run + 1 : 1;
    prev = d;
    if (run > best) best = run;
  });
  return best;
}
