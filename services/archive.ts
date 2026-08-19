'use client';

import { JourneyArchiveEntry } from '@/types';
import type {
  JourneyArchiveRow,
  RecoveryJourneyRow,
} from '@/lib/supabase/database.types';
import { firstOf, toArchiveEntry } from '@/lib/supabase/mappers';
import { buildCurveSeries, computeRecoveryModifier, SYMPTOM_LABELS } from '@/lib/recovery';
import { getProtocol } from '@/mock/protocols';
import { daysBetween, round, todayKST } from '@/lib/utils';
import { ApiError, db, requireUserId } from './supabase';
import { fetchCurrentJourneyRow, fetchVitals } from './journey';
import { checkinService } from './checkin';

export interface CompleteJourneyInput {
  satisfactionScore: number; // 1~5
  note?: string;
}

export const archiveService = {
  async getArchive(): Promise<JourneyArchiveEntry[]> {
    const userId = await requireUserId();
    const { data, error } = await db()
      .from('journey_archives')
      .select('*, recovery_journeys(procedure_name, clinic_name, procedure_date, status)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new ApiError('QUERY_FAILED', '지난 여정을 불러오지 못했습니다.');

    type JoinedJourney = Pick<
      RecoveryJourneyRow,
      'procedure_name' | 'clinic_name' | 'procedure_date' | 'status'
    >;
    type ArchiveWithJourney = JourneyArchiveRow & {
      recovery_journeys: JoinedJourney | JoinedJourney[] | null;
    };

    const entries: JourneyArchiveEntry[] = [];
    for (const row of (data ?? []) as ArchiveWithJourney[]) {
      const journey = firstOf(row.recovery_journeys);
      if (journey) entries.push(toArchiveEntry(row, journey));
    }
    return entries;
  },

  /**
   * 여정 마무리.
   *
   * 남기는 인사이트는 감상이 아니라 기록에서 계산한다.
   * (수면이 짧았던 날, 금기 미준수 횟수, 곡선을 가장 크게 벗어난 증상)
   * 이 문장이 다음 시술의 개인화 입력이 된다.
   */
  async completeJourney(input: CompleteJourneyInput): Promise<JourneyArchiveEntry> {
    const today = todayKST();
    const userId = await requireUserId();
    const journeyRow = await fetchCurrentJourneyRow(userId);
    const protocol = getProtocol(journeyRow.protocol_id);
    const currentDay = Math.max(0, daysBetween(journeyRow.procedure_date, today));

    const [checkins, vitals] = await Promise.all([
      checkinService.getCheckins(),
      fetchVitals(userId, journeyRow.procedure_date),
    ]);

    const parts: string[] = [];

    const shortSleepDays = vitals.filter((v) => v.sleepHours < 6).length;
    if (shortSleepDays >= 2) {
      parts.push(
        `수면이 6시간 미만이었던 날이 ${shortSleepDays}일 있었고, 그 구간에서 회복이 느려졌습니다. 다음 시술은 업무 성수기를 피해 잡는 것을 권장합니다.`
      );
    }

    const violations = checkins.filter((c) => !c.followedRestrictions).length;
    if (violations > 0) {
      parts.push(`금기를 지키지 못한 날이 ${violations}일 기록되었습니다.`);
    }

    if (checkins.length > 0) {
      const series = buildCurveSeries(
        protocol,
        checkins,
        currentDay,
        computeRecoveryModifier(vitals)
      );
      const worst = series.reduce((a, b) => (b.recentDeviation > a.recentDeviation ? b : a));
      if (worst.recentDeviation > 0.3) {
        parts.push(
          `${SYMPTOM_LABELS[worst.symptom]}가 예상 곡선보다 평균 ${round(
            worst.recentDeviation
          )} 높게 유지되었습니다. 다음 상담에서 이 부분을 짚어보세요.`
        );
      }
    }

    if (parts.length === 0) {
      parts.push(
        checkins.length > 0
          ? `${checkins.length}일치 기록이 모두 예상 회복 범위 안에 있었습니다. 이번 루틴을 다음 시술에도 그대로 적용하면 됩니다.`
          : '기록이 없어 이번 여정에서 뽑아낼 패턴이 없습니다. 다음 시술에서는 초기 2주만이라도 기록해 보세요.'
      );
    }
    if (input.note?.trim()) parts.push(`사용자 메모: ${input.note.trim()}`);

    const { error: updateError } = await db()
      .from('recovery_journeys')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', journeyRow.id);
    if (updateError) throw new ApiError('QUERY_FAILED', '여정을 마치지 못했습니다.');

    const { data, error } = await db()
      .from('journey_archives')
      .upsert(
        {
          journey_id: journeyRow.id,
          user_id: userId,
          completed_day: currentDay,
          satisfaction_score: input.satisfactionScore,
          learned_insight: parts.join(' '),
        },
        { onConflict: 'journey_id' }
      )
      .select('*')
      .single<JourneyArchiveRow>();
    if (error || !data) throw new ApiError('QUERY_FAILED', '아카이브 저장에 실패했습니다.');

    return toArchiveEntry(data, {
      procedure_name: journeyRow.procedure_name,
      clinic_name: journeyRow.clinic_name,
      procedure_date: journeyRow.procedure_date,
      status: 'completed',
    });
  },
};
