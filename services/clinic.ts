'use client';

import { ClinicCase, ClinicScreenData, SymptomKey } from '@/types';
import type {
  ClinicResponseRow,
  DailyCheckinRow,
  RecoveryAlertRow,
  RecoveryJourneyRow,
} from '@/lib/supabase/database.types';
import { firstOf, toCheckin } from '@/lib/supabase/mappers';
import { daysBetween, todayKST } from '@/lib/utils';
import { ApiError, db, requireUserId } from './supabase';
import { authService } from './auth';

/**
 * 클리닉(의료진) 리콜 대시보드.
 *
 * 볼 수 있는 것은 RLS가 결정한다.
 *  - 우리 클리닉에서 시술한 여정 중
 *  - 환자가 공유에 동의했고
 *  - 회복 곡선을 벗어나 공유된 알림
 * 그리고 그 알림 전후 3일 체크인까지만. 평상시 기록과 환자 개인정보는 열리지 않는다.
 */
export const clinicService = {
  async getDashboard(): Promise<ClinicScreenData> {
    await requireUserId();
    const member = await authService.getClinicMembership();
    if (!member) {
      throw new ApiError('NOT_CLINIC_STAFF', '클리닉 계정이 아닙니다.', 403);
    }

    const { data, error } = await db()
      .from('recovery_alerts')
      .select('*, clinic_responses(*), recovery_journeys(*)')
      .eq('shared_with_clinic', true)
      .order('shared_at', { ascending: false });
    if (error) throw new ApiError('QUERY_FAILED', '공유된 기록을 불러오지 못했습니다.');

    const rows = (data ?? []) as (RecoveryAlertRow & {
      clinic_responses: ClinicResponseRow | ClinicResponseRow[] | null;
      recovery_journeys: RecoveryJourneyRow | RecoveryJourneyRow[] | null;
    })[];

    const cases: ClinicCase[] = [];
    const today = todayKST();

    for (const row of rows) {
      const journey = firstOf(row.recovery_journeys);
      if (!journey) continue;

      // 공유 범위: 알림 전후 3일. RLS도 같은 범위를 강제한다.
      const { data: checkinRows } = await db()
        .from('daily_checkins')
        .select('*')
        .eq('journey_id', row.journey_id)
        .gte('day', row.day - 3)
        .lte('day', row.day)
        .order('day', { ascending: true });

      const response = firstOf(row.clinic_responses);

      cases.push({
        alertId: row.id,
        journeyId: row.journey_id,
        procedureName: journey.procedure_name,
        procedureDate: journey.procedure_date,
        day: row.day,
        level: row.level,
        title: row.title,
        detail: row.detail,
        triggeredBy: (row.triggered_by ?? []).map((t) => ({
          symptom: t.symptom as SymptomKey,
          expected: t.expected,
          actual: t.actual,
        })),
        recommendedAction: row.recommended_action,
        sharedAt: row.shared_at,
        recentCheckins: ((checkinRows ?? []) as DailyCheckinRow[]).map((c) => toCheckin(c)),
        response: response
          ? {
              respondedAt: response.responded_at,
              practitionerName: response.practitioner_name,
              message: response.message,
              suggestedVisit: response.suggested_visit,
            }
          : null,
      });
    }

    // 미답변 → 긴급 순으로 위에 올린다. 놓치면 안 되는 것이 위로 온다.
    cases.sort((a, b) => {
      if (!a.response && b.response) return -1;
      if (a.response && !b.response) return 1;
      if (a.level !== b.level) return a.level === 'urgent' ? -1 : 1;
      return daysBetween(a.procedureDate, today) - daysBetween(b.procedureDate, today);
    });

    return { member, cases };
  },

  async respond(input: {
    alertId: string;
    message: string;
    suggestedVisit: boolean;
  }): Promise<void> {
    const member = await authService.getClinicMembership();
    if (!member) throw new ApiError('NOT_CLINIC_STAFF', '클리닉 계정이 아닙니다.', 403);
    if (!input.message.trim()) {
      throw new ApiError('INVALID_PARAM', '답변 내용을 입력해 주세요.', 422);
    }

    const { error } = await db().from('clinic_responses').insert({
      alert_id: input.alertId,
      responder_id: member.userId,
      practitioner_name: member.displayName,
      message: input.message.trim(),
      suggested_visit: input.suggestedVisit,
    });
    if (error) throw new ApiError('QUERY_FAILED', '답변을 저장하지 못했습니다.');
  },
};
