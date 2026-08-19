import { detectDeviation, computeRecoveryModifier } from '@/lib/recovery';
import { DailyCheckin, RecoveryAlert, SymptomKey } from '@/types';
import { getProtocol, mockAlerts, mockCheckins } from '@/mock/data';
import { isSupabase } from '@/lib/env';
import { addDays } from '@/lib/utils';
import { request } from './client';
import { session } from './session';
import { wearableStore } from './vitals';

/**
 * 세션 동안 유지되는 체크인 저장소.
 * 데모 시드일 때는 11일치 시나리오로 시작하고,
 * 사용자가 자기 여정을 시작하면 비운다.
 */
// 초기값도 세션을 본다. 온보딩을 마친 뒤 이 모듈이 처음 로드되는 경우가 있기 때문이다.
let records: DailyCheckin[] = session.isDemoSeed ? [...mockCheckins] : [];
let alerts: RecoveryAlert[] = session.isDemoSeed ? [...mockAlerts] : [];
let syncedVersion = session.seedVersion;

/** 여정이 바뀌었으면 저장소를 그 여정에 맞게 다시 채운다. */
function sync() {
  if (syncedVersion === session.seedVersion) return;
  syncedVersion = session.seedVersion;
  records = session.isDemoSeed ? [...mockCheckins] : [];
  alerts = session.isDemoSeed ? [...mockAlerts] : [];
}

export const checkinStore = {
  all(): DailyCheckin[] {
    sync();
    return [...records].sort((a, b) => a.day - b.day);
  },
  byDay(day: number): DailyCheckin | undefined {
    sync();
    return records.find((c) => c.day === day);
  },
  alerts(): RecoveryAlert[] {
    sync();
    return [...alerts].sort((a, b) => b.day - a.day);
  },
  updateAlert(alert: RecoveryAlert) {
    sync();
    const i = alerts.findIndex((a) => a.id === alert.id);
    if (i >= 0) alerts[i] = alert;
    else alerts.unshift(alert);
  },
  currentStreak(today: number): number {
    sync();
    let streak = 0;
    for (let d = today; d >= 0; d--) {
      if (records.some((c) => c.day === d)) streak++;
      else if (d !== today) break; // 오늘 미기록은 스트릭을 끊지 않는다
    }
    return streak;
  },
  longestStreak(): number {
    sync();
    const days = Array.from(new Set(records.map((c) => c.day))).sort((a, b) => a - b);
    let best = 0;
    let run = 0;
    let prev = -2;
    days.forEach((d) => {
      run = d === prev + 1 ? run + 1 : 1;
      prev = d;
      if (run > best) best = run;
    });
    return best;
  },
};

export interface CheckinInput {
  symptoms: Record<SymptomKey, number>;
  moodNote?: string;
  photoUrl?: string;
  followedRestrictions: boolean;
  durationSeconds: number;
}

export interface CheckinResult {
  checkin: DailyCheckin;
  /** 이번 기록으로 새로 감지된 이탈. 없으면 null */
  newAlert: RecoveryAlert | null;
  /** 어제 대비 좋아진 증상 키 배열. 즉시 피드백에 쓴다. */
  improved: string[];
}

export const checkinService = {
  async getCheckins(): Promise<DailyCheckin[]> {
    if (isSupabase) {
      const { supabaseRepo } = await import('./supabase-repo');
      return supabaseRepo.getCheckins();
    }
    return request({
      path: '/checkins',
      latency: 300,
      mock: () => checkinStore.all(),
    });
  },

  async submitCheckin(input: CheckinInput): Promise<CheckinResult> {
    if (isSupabase) {
      const { supabaseRepo } = await import('./supabase-repo');
      return supabaseRepo.submitCheckin(input);
    }
    return request({
      path: '/checkins',
      method: 'POST',
      body: input,
      latency: 800,
      mock: () => {
        checkinStore.all(); // 여정 변경 반영
        const journey = session.journey;
        const protocol = getProtocol(journey.protocolId);
        const day = journey.currentDay;

        const checkin: DailyCheckin = {
          id: `checkin-${day}`,
          journeyId: journey.id,
          date: session.today,
          day,
          symptoms: input.symptoms,
          moodNote: input.moodNote,
          photoUrl: input.photoUrl,
          followedRestrictions: input.followedRestrictions,
          durationSeconds: input.durationSeconds,
          createdAt: `${session.today}T21:30:00+09:00`,
        };

        const existing = records.findIndex((c) => c.day === day);
        if (existing >= 0) records[existing] = checkin;
        else records.push(checkin);

        const modifier = computeRecoveryModifier(wearableStore.all());
        const draft = detectDeviation(protocol, checkin, modifier);

        let newAlert: RecoveryAlert | null = null;
        if (draft) {
          newAlert = {
            id: `alert-${day}`,
            journeyId: journey.id,
            date: session.today,
            day,
            sharedWithClinic: false,
            ...draft,
          };
          checkinStore.updateAlert(newAlert);
        }

        const yesterday = records.find((c) => c.day === day - 1);
        const improved = yesterday
          ? (Object.keys(input.symptoms) as SymptomKey[]).filter(
              (k) => input.symptoms[k] < yesterday.symptoms[k]
            )
          : [];

        return { checkin, newAlert, improved };
      },
    });
  },

  /**
   * 지난 날짜 채워넣기.
   * 시술 후 며칠 지나 앱을 알게 된 사용자가 기억나는 만큼만 소급 입력한다.
   */
  async backfillCheckin(day: number, symptoms: Record<SymptomKey, number>): Promise<DailyCheckin> {
    if (isSupabase) {
      const { supabaseRepo } = await import('./supabase-repo');
      return supabaseRepo.backfillCheckin(day, symptoms);
    }
    return request({
      path: `/checkins/backfill`,
      method: 'POST',
      body: { day, symptoms },
      latency: 500,
      mock: () => {
        checkinStore.all(); // 여정 변경 반영
        const journey = session.journey;
        const dateStr = addDays(journey.procedureDate, day);

        const checkin: DailyCheckin = {
          id: `checkin-${day}`,
          journeyId: journey.id,
          date: dateStr,
          day,
          symptoms,
          followedRestrictions: true,
          durationSeconds: 0,
          createdAt: `${session.today}T00:00:00+09:00`,
        };
        const existing = records.findIndex((c) => c.day === day);
        if (existing >= 0) records[existing] = checkin;
        else records.push(checkin);
        return checkin;
      },
    });
  },
};
