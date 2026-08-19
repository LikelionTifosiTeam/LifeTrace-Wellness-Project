import { JourneyArchiveEntry } from '@/types';
import { getProtocol, mockArchive } from '@/mock/data';
import { isSupabase } from '@/lib/env';
import { request } from './client';
import { supabaseRepo } from './supabase-repo';
import { session } from './session';
import { checkinStore } from './checkin';
import { wearableStore } from './vitals';
import { computeRecoveryModifier, SYMPTOM_LABELS, buildCurveSeries } from '@/lib/recovery';
import { round } from '@/lib/utils';

export interface CompleteJourneyInput {
  satisfactionScore: number; // 1~5
  note?: string;
}

/** 세션 동안 쌓이는 아카이브. 데모 시드 2건으로 시작한다. */
let entries: JourneyArchiveEntry[] = session.isDemoSeed ? [...mockArchive] : [];
let syncedVersion = session.seedVersion;

function syncEntries() {
  if (syncedVersion === session.seedVersion) return;
  syncedVersion = session.seedVersion;
  entries = session.isDemoSeed ? [...mockArchive] : [];
}

/**
 * 이번 여정에서 배운 것을 기록에서 뽑아낸다.
 *
 * 다음 시술을 계획할 때 쓰이는 문장이라 감상이 아니라 데이터에서 나와야 한다.
 * (수면이 짧았던 구간, 곡선을 벗어난 증상, 금기 미준수 횟수)
 */
function deriveInsight(): string {
  const checkins = checkinStore.all();
  const wearables = wearableStore.all();
  if (checkins.length === 0) {
    return '기록이 없어 이번 여정에서 뽑아낼 패턴이 없습니다. 다음 시술에서는 초기 2주만이라도 기록해 보세요.';
  }

  const parts: string[] = [];

  const shortSleepDays = wearables.filter((w) => w.sleepHours < 6).length;
  if (shortSleepDays >= 2) {
    parts.push(
      `수면이 6시간 미만이었던 날이 ${shortSleepDays}일 있었고, 그 구간에서 회복이 느려졌습니다. 다음 시술은 업무 성수기를 피해 잡는 것을 권장합니다.`
    );
  }

  const violations = checkins.filter((c) => !c.followedRestrictions).length;
  if (violations > 0) {
    parts.push(`금기를 지키지 못한 날이 ${violations}일 기록되었습니다.`);
  }

  const protocol = getProtocol(session.journey.protocolId);
  const series = buildCurveSeries(
    protocol,
    checkins,
    session.journey.currentDay,
    computeRecoveryModifier(wearables)
  );
  const worst = series.reduce((a, b) => (b.recentDeviation > a.recentDeviation ? b : a));
  if (worst.recentDeviation > 0.3) {
    parts.push(
      `${SYMPTOM_LABELS[worst.symptom]}가 예상 곡선보다 평균 ${round(
        worst.recentDeviation
      )} 높게 유지되었습니다. 다음 상담에서 이 부분을 짚어보세요.`
    );
  }

  if (parts.length === 0) {
    parts.push(
      `${checkins.length}일치 기록이 모두 예상 회복 범위 안에 있었습니다. 이번 루틴을 다음 시술에도 그대로 적용하면 됩니다.`
    );
  }

  return parts.join(' ');
}

export const archiveService = {
  async getArchive(): Promise<JourneyArchiveEntry[]> {
    if (isSupabase) return supabaseRepo.getArchive();
    return request({
      path: '/journeys/archive',
      latency: 380,
      mock: () => {
        syncEntries();
        return entries;
      },
    });
  },

  async getArchiveEntry(id: string): Promise<JourneyArchiveEntry | undefined> {
    if (isSupabase) return (await supabaseRepo.getArchive()).find((a) => a.id === id);
    return request({
      path: `/journeys/archive/${id}`,
      latency: 300,
      mock: () => {
        syncEntries();
        return entries.find((a) => a.id === id);
      },
    });
  },

  /**
   * 여정 마무리.
   * 회복 기록을 아카이브로 옮기고, 다음 시술의 개인화 입력이 될 인사이트를 남긴다.
   */
  async completeJourney(input: CompleteJourneyInput): Promise<JourneyArchiveEntry> {
    if (isSupabase) return supabaseRepo.completeJourney(input);
    return request({
      path: '/journeys/current/complete',
      method: 'POST',
      body: input,
      latency: 800,
      mock: () => {
        syncEntries();
        const journey = session.journey;
        const entry: JourneyArchiveEntry = {
          id: `archive-${journey.id}`,
          journeyId: journey.id,
          procedureName: journey.procedureName,
          clinicName: journey.clinicName,
          procedureDate: journey.procedureDate,
          completedDay: journey.currentDay,
          finalStatus: 'completed',
          satisfactionScore: input.satisfactionScore,
          learnedInsight: input.note?.trim()
            ? `${deriveInsight()} 사용자 메모: ${input.note.trim()}`
            : deriveInsight(),
        };
        entries = [entry, ...entries.filter((e) => e.journeyId !== journey.id)];
        session.completeCurrentJourney();
        return entry;
      },
    });
  },
};
