'use client';

import { DailyCheckin, RecoveryAlert, SymptomKey } from '@/types';
import type { DailyCheckinRow, RecoveryAlertRow } from '@/lib/supabase/database.types';
import { toAlert, toCheckin } from '@/lib/supabase/mappers';
import { computeRecoveryModifier, detectDeviation } from '@/lib/recovery';
import { getProtocol } from '@/mock/protocols';
import { addDays, todayKST } from '@/lib/utils';
import { ApiError, db, requireUserId } from './supabase';
import { fetchCurrentJourneyRow, fetchVitals } from './journey';
import { daysBetween } from '@/lib/utils';

export interface CheckinInput {
  symptoms: Record<SymptomKey, number>;
  moodNote?: string;
  photoPath?: string;
  followedRestrictions: boolean;
  durationSeconds: number;
}

export interface CheckinResult {
  checkin: DailyCheckin;
  /** 이번 기록으로 새로 감지된 이탈. 없으면 null */
  newAlert: RecoveryAlert | null;
  /** 어제 대비 좋아진 증상 키 배열. 즉시 피드백에 쓴다. */
  improved: SymptomKey[];
}

function symptomColumns(symptoms: Record<SymptomKey, number>) {
  return {
    swelling: symptoms.swelling,
    redness: symptoms.redness,
    pain: symptoms.pain,
    peeling: symptoms.peeling,
    tightness: symptoms.tightness,
  };
}

export const checkinService = {
  async getCheckins(): Promise<DailyCheckin[]> {
    const userId = await requireUserId();
    const journeyRow = await fetchCurrentJourneyRow(userId);
    const { data, error } = await db()
      .from('daily_checkins')
      .select('*')
      .eq('journey_id', journeyRow.id)
      .order('day', { ascending: true });
    if (error) throw new ApiError('QUERY_FAILED', '기록을 불러오지 못했습니다.');
    return ((data ?? []) as DailyCheckinRow[]).map((r) => toCheckin(r));
  },

  async submitCheckin(input: CheckinInput): Promise<CheckinResult> {
    const today = todayKST();
    const userId = await requireUserId();
    const journeyRow = await fetchCurrentJourneyRow(userId);
    const protocol = getProtocol(journeyRow.protocol_id);
    const day = Math.max(0, daysBetween(journeyRow.procedure_date, today));

    const { data, error } = await db()
      .from('daily_checkins')
      .upsert(
        {
          journey_id: journeyRow.id,
          user_id: userId,
          date: today,
          day,
          ...symptomColumns(input.symptoms),
          photo_path: input.photoPath ?? null,
          mood_note: input.moodNote ?? null,
          followed_restrictions: input.followedRestrictions,
          duration_seconds: input.durationSeconds,
        },
        { onConflict: 'journey_id,date' }
      )
      .select('*')
      .single<DailyCheckinRow>();
    if (error || !data) throw new ApiError('CHECKIN_FAILED', '기록을 저장하지 못했습니다.');

    const checkin = toCheckin(data);

    // 이탈 판정은 저장 직후 같은 규칙으로 계산한다 (lib/recovery.ts).
    const vitals = await fetchVitals(userId, journeyRow.procedure_date);
    const draft = detectDeviation(protocol, checkin, computeRecoveryModifier(vitals));

    let newAlert: RecoveryAlert | null = null;
    if (draft) {
      const { data: alertRow } = await db()
        .from('recovery_alerts')
        .upsert(
          {
            journey_id: journeyRow.id,
            user_id: userId,
            date: today,
            day,
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
      if (alertRow) newAlert = toAlert(alertRow, null);
    }

    const { data: prev } = await db()
      .from('daily_checkins')
      .select('*')
      .eq('journey_id', journeyRow.id)
      .eq('day', day - 1)
      .maybeSingle<DailyCheckinRow>();

    const improved: SymptomKey[] = prev
      ? (Object.keys(input.symptoms) as SymptomKey[]).filter(
          (k) => input.symptoms[k] < toCheckin(prev).symptoms[k]
        )
      : [];

    return { checkin, newAlert, improved };
  },

  /**
   * 지난 날짜 채워넣기.
   * 시술 후 며칠 지나 앱을 알게 된 사용자가 기억나는 만큼만 소급 입력한다.
   * 소요 시간은 0으로 저장해 '30초 체크인' 지표를 오염시키지 않는다.
   */
  async backfillCheckin(
    day: number,
    symptoms: Record<SymptomKey, number>
  ): Promise<DailyCheckin> {
    const userId = await requireUserId();
    const journeyRow = await fetchCurrentJourneyRow(userId);

    const { data, error } = await db()
      .from('daily_checkins')
      .upsert(
        {
          journey_id: journeyRow.id,
          user_id: userId,
          date: addDays(journeyRow.procedure_date, day),
          day,
          ...symptomColumns(symptoms),
          followed_restrictions: true,
          duration_seconds: 0,
        },
        { onConflict: 'journey_id,date' }
      )
      .select('*')
      .single<DailyCheckinRow>();
    if (error || !data) throw new ApiError('CHECKIN_FAILED', '기록을 저장하지 못했습니다.');
    return toCheckin(data);
  },
};
