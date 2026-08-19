import { RecoveryCorrelation, VitalsScreenData, WearableSnapshot, WearableSource } from '@/types';
import {
  mockCorrelations,
  mockEnvironments,
  mockUser,
  mockWearables,
} from '@/mock/data';
import { pearson } from '@/lib/recovery';
import { isSupabase } from '@/lib/env';
import { request } from './client';
import { session } from './session';

/**
 * 웨어러블 스냅샷 저장소.
 *
 * 웹에서는 Apple HealthKit / Galaxy Health에 직접 접근할 수 없다.
 * 따라서 두 경로를 모두 지원한다.
 *  1) 연동(네이티브 앱/헬스 커넥트) — 데모에서는 시드 데이터로 대체
 *  2) 수동 입력 — 연동 없이도 회복 속도 보정이 동작하도록
 */
let snapshots: WearableSnapshot[] = session.isDemoSeed ? [...mockWearables] : [];
let syncedVersion = session.seedVersion;

function sync() {
  if (syncedVersion === session.seedVersion) return;
  syncedVersion = session.seedVersion;
  snapshots = session.isDemoSeed ? [...mockWearables] : [];
}

export const wearableStore = {
  all(): WearableSnapshot[] {
    sync();
    return [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  },
  upsert(snapshot: WearableSnapshot) {
    sync();
    const i = snapshots.findIndex((s) => s.date === snapshot.date);
    if (i >= 0) snapshots[i] = snapshot;
    else snapshots.push(snapshot);
  },
};

/** 실제 기록으로 상관계수를 다시 계산한다. 고정 숫자를 보여주지 않는다. */
function recomputeCorrelations(
  checkins: { day: number; symptoms: { swelling: number; tightness: number } }[]
): RecoveryCorrelation[] {
  const wearables = wearableStore.all();
  const sleepPairs: [number, number][] = [];
  const humidityPairs: [number, number][] = [];

  checkins.forEach((c) => {
    const wearable = wearables[c.day - 1];
    if (wearable) sleepPairs.push([wearable.sleepHours, c.symptoms.swelling]);
    const env = mockEnvironments[c.day];
    if (env) humidityPairs.push([env.humidity, c.symptoms.tightness]);
  });

  const sleepCoef = pearson(
    sleepPairs.map((p) => p[0]),
    sleepPairs.map((p) => p[1])
  );
  const humidityCoef = pearson(
    humidityPairs.map((p) => p[0]),
    humidityPairs.map((p) => p[1])
  );

  return mockCorrelations.map((c) => {
    if (c.id === 'corr-001') {
      return { ...c, coefficient: sleepCoef, sampleDays: sleepPairs.length };
    }
    if (c.id === 'corr-003') {
      return { ...c, coefficient: humidityCoef, sampleDays: humidityPairs.length };
    }
    return c;
  });
}

export interface ManualVitalsInput {
  date: string;
  sleepHours: number;
  restingHr?: number;
  hrvMs?: number;
}

export const vitalsService = {
  async getVitals(): Promise<VitalsScreenData> {
    if (isSupabase) {
      const { supabaseRepo } = await import('./supabase-repo');
      return supabaseRepo.getVitals();
    }
    return request({
      path: '/vitals',
      latency: 450,
      mock: async () => {
        const { checkinStore } = await import('./checkin');
        return {
          wearables: wearableStore.all(),
          environments: mockEnvironments,
          correlations: recomputeCorrelations(checkinStore.all()),
          connected: Boolean(mockUser.connectedWearable) && wearableStore.all().length > 0,
          source: mockUser.connectedWearable,
        };
      },
    });
  },

  async connectWearable(
    source: WearableSource
  ): Promise<{ connected: true; source: WearableSource }> {
    if (isSupabase) {
      const { supabaseRepo } = await import('./supabase-repo');
      return supabaseRepo.connectWearable(source);
    }
    return request({
      path: '/vitals/connect',
      method: 'POST',
      body: { source },
      latency: 900,
      mock: () => {
        mockUser.connectedWearable = source;
        // 연동이 켜지면 시드 스냅샷을 불러온 것으로 본다.
        if (wearableStore.all().length === 0) {
          mockWearables.forEach((w) => wearableStore.upsert({ ...w, source }));
        }
        return { connected: true as const, source };
      },
    });
  },

  /** 웨어러블 없이 수면만 직접 입력해도 회복 속도 보정이 동작한다. */
  async saveManualVitals(input: ManualVitalsInput): Promise<WearableSnapshot> {
    if (isSupabase) {
      const { supabaseRepo } = await import('./supabase-repo');
      return supabaseRepo.saveManualVitals(input);
    }
    return request({
      path: '/vitals/manual',
      method: 'POST',
      body: input,
      latency: 400,
      mock: () => {
        const snapshot: WearableSnapshot = {
          date: input.date,
          source: 'manual',
          sleepHours: input.sleepHours,
          sleepQuality: Math.round(Math.min(100, input.sleepHours * 12)),
          hrvMs: input.hrvMs ?? 0,
          restingHr: input.restingHr ?? 0,
          steps: 0,
        };
        wearableStore.upsert(snapshot);
        mockUser.connectedWearable = mockUser.connectedWearable ?? 'manual';
        return snapshot;
      },
    });
  },
};
