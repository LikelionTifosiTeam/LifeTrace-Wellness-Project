'use client';

import { DailyVitals, RecoveryCorrelation, VitalsScreenData } from '@/types';
import type { DailyVitalsRow } from '@/lib/supabase/database.types';
import { toVitals } from '@/lib/supabase/mappers';
import { pearson } from '@/lib/recovery';
import { correlationTemplates } from '@/mock/reference';
import { todayKST } from '@/lib/utils';
import { ApiError, db, requireUserId } from './supabase';
import { fetchCurrentJourneyRow, fetchEnvironments, fetchVitals } from './journey';
import { checkinService } from './checkin';

export interface DailyVitalsInput {
  date: string;
  sleepHours: number;
  stressLevel: number;
  alcohol: boolean;
}

export const vitalsService = {
  async getVitals(): Promise<VitalsScreenData> {
    const today = todayKST();
    const userId = await requireUserId();
    const journeyRow = await fetchCurrentJourneyRow(userId);

    const [vitals, environments, checkins] = await Promise.all([
      fetchVitals(userId, journeyRow.procedure_date),
      fetchEnvironments(journeyRow.procedure_date),
      checkinService.getCheckins(),
    ]);

    // 상관계수는 매번 실제 기록으로 다시 계산한다. 고정 숫자를 보여주지 않는다.
    const byDate = new Map(vitals.map((v) => [v.date, v]));
    const envByDate = new Map(environments.map((e) => [e.date, e]));

    const sleepPairs: [number, number][] = [];
    const stressPairs: [number, number][] = [];
    const humidityPairs: [number, number][] = [];

    checkins.forEach((c) => {
      const prevDate = vitals[c.day - 1]?.date;
      const prev = prevDate ? byDate.get(prevDate) : undefined;
      if (prev) {
        sleepPairs.push([prev.sleepHours, c.symptoms.swelling]);
        stressPairs.push([prev.stressLevel, c.symptoms.redness]);
      }
      const env = envByDate.get(c.date);
      if (env) humidityPairs.push([env.humidity, c.symptoms.tightness]);
    });

    const build = (
      template: RecoveryCorrelation,
      pairs: [number, number][]
    ): RecoveryCorrelation => ({
      ...template,
      coefficient: pearson(
        pairs.map((p) => p[0]),
        pairs.map((p) => p[1])
      ),
      sampleDays: pairs.length,
    });

    return {
      vitals,
      environments,
      correlations: [
        build(correlationTemplates.sleep, sleepPairs),
        build(correlationTemplates.stress, stressPairs),
        build(correlationTemplates.humidity, humidityPairs),
      ],
      hasToday: vitals.some((v) => v.date === today),
    };
  },

  /** 하루 컨디션 저장. 웨어러블 없이 웹에서 직접 입력한다. */
  async saveVitals(input: DailyVitalsInput): Promise<DailyVitals> {
    const userId = await requireUserId();
    const { data, error } = await db()
      .from('daily_vitals')
      .upsert(
        {
          user_id: userId,
          date: input.date,
          sleep_hours: input.sleepHours,
          stress_level: input.stressLevel,
          alcohol: input.alcohol,
        },
        { onConflict: 'user_id,date' }
      )
      .select('*')
      .single<DailyVitalsRow>();
    if (error || !data) throw new ApiError('QUERY_FAILED', '컨디션을 저장하지 못했습니다.');
    return toVitals(data);
  },
};
