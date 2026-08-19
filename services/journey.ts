import {
  DailyCareCard,
  RecoveryAlert,
  RecoveryScreenData,
  TodayScreenData,
} from '@/types';
import { getProtocol, mockEnvironments, mockUser } from '@/mock/data';
import {
  buildCurveSeries,
  computeDeviationScore,
  computeRecoveryModifier,
  computeRecoveryProgress,
  getPhase,
  judgeStatus,
} from '@/lib/recovery';
import { generateCareCard } from '@/lib/careCard';
import { isSupabase } from '@/lib/env';
import { request } from './client';
import { supabaseRepo } from './supabase-repo';
import { session } from './session';
import { checkinStore } from './checkin';
import { wearableStore } from './vitals';

function envForDate(date: string) {
  return (
    mockEnvironments.find((e) => e.date === date) ??
    mockEnvironments[mockEnvironments.length - 1]
  );
}

/** 엔진을 돌려 여정의 파생 필드를 채운다. mock/서버 어느 쪽이든 같은 결과가 나와야 한다. */
function hydrate() {
  const journey = session.journey;
  const protocol = getProtocol(journey.protocolId);
  const checkins = checkinStore.all();
  const modifier = computeRecoveryModifier(wearableStore.all());
  const series = buildCurveSeries(protocol, checkins, journey.currentDay, modifier);
  const latest = checkins.length ? checkins[checkins.length - 1] : null;
  const deviationScore = computeDeviationScore(series);

  return {
    protocol,
    series,
    checkins,
    journey: {
      ...journey,
      recoveryProgress: computeRecoveryProgress(protocol, latest, journey.currentDay),
      deviationScore,
      status:
        journey.status === 'completed'
          ? 'completed'
          : judgeStatus(deviationScore, journey.currentDay, protocol.totalRecoveryDays),
    },
  };
}

/** 케어 카드 문장을 서버 라우트에서 받아 덮어쓴다. 실패하면 로컬 카드를 유지한다. */
async function enhanceCareCard(screen: TodayScreenData): Promise<DailyCareCard | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/care-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        journeyId: screen.journey.id,
        date: screen.careCard.date,
        day: screen.journey.currentDay,
        protocolId: screen.protocol.id,
        yesterdayCheckin: null,
        wearables: wearableStore.all(),
        environment: screen.environment,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export const journeyService = {
  async getToday(): Promise<TodayScreenData> {
    if (isSupabase) return supabaseRepo.getToday();

    const screen = await request<TodayScreenData>({
      path: '/journeys/current/today',
      latency: 420,
      mock: () => {
        const { journey, protocol, checkins } = hydrate();
        const day = journey.currentDay;
        const phase = getPhase(protocol, day);
        const yesterday = checkins.find((c) => c.day === day - 1) ?? null;
        const todayCheckin = checkins.find((c) => c.day === day) ?? null;
        const environment = envForDate(session.today);

        const careCard = generateCareCard({
          journeyId: journey.id,
          date: session.today,
          day,
          protocol,
          phase,
          yesterdayCheckin: yesterday,
          wearables: wearableStore.all(),
          environment,
        });

        const wearables = wearableStore.all();

        return {
          user: mockUser,
          journey,
          protocol,
          currentPhase: phase,
          careCard,
          todayCheckin,
          streak: {
            current: checkinStore.currentStreak(day),
            longest: checkinStore.longestStreak(),
            totalCheckins: checkins.length,
            completionRate: Math.round((checkins.length / (day + 1)) * 100),
          },
          activeAlert: checkinStore.alerts().find((a) => a.level !== 'info') ?? null,
          wearable: wearables[wearables.length - 1] ?? null,
          environment,
        };
      },
    });

    // 목데이터 모드에서도 케어 카드 문장은 서버 라우트를 거친다.
    // ANTHROPIC_API_KEY가 실제 값이면 LLM 문장으로, 목업 키면 로컬 생성기로 폴백된다.
    const card = await enhanceCareCard(screen);
    return card ? { ...screen, careCard: card } : screen;
  },

  async getRecovery(): Promise<RecoveryScreenData> {
    if (isSupabase) return supabaseRepo.getRecovery();
    return request({
      path: '/journeys/current/recovery',
      latency: 480,
      mock: () => {
        const { journey, protocol, series, checkins } = hydrate();
        return { journey, protocol, series, checkins, alerts: checkinStore.alerts() };
      },
    });
  },

  async getAlerts(): Promise<RecoveryAlert[]> {
    if (isSupabase) return supabaseRepo.getAlerts();
    return request({
      path: '/journeys/current/alerts',
      latency: 300,
      mock: () => checkinStore.alerts(),
    });
  },

  /** 사용자가 명시적으로 동의할 때만 클리닉에 공유한다. */
  async shareAlertWithClinic(alertId: string): Promise<RecoveryAlert> {
    if (isSupabase) return supabaseRepo.shareAlertWithClinic(alertId);
    return request({
      path: `/alerts/${alertId}/share`,
      method: 'POST',
      latency: 700,
      mock: () => {
        if (!mockUser.clinicSharingConsent) {
          throw new Error('설정에서 클리닉 공유 동의를 먼저 켜주세요.');
        }
        const alert = checkinStore.alerts().find((a) => a.id === alertId);
        if (!alert) throw new Error('알림을 찾을 수 없습니다.');
        const updated = { ...alert, sharedWithClinic: true };
        checkinStore.updateAlert(updated);
        return updated;
      },
    });
  },
};
