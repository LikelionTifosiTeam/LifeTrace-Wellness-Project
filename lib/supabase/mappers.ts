/**
 * Supabase 행(snake_case) ↔ 도메인 타입(camelCase) 변환.
 *
 * 페이지와 회복 엔진은 도메인 타입만 안다. DB 컬럼명이 바뀌어도 이 파일만 고치면 된다.
 */

import {
  DailyCheckin,
  DailyVitals,
  EnvironmentSnapshot,
  JourneyArchiveEntry,
  ProcedureCategory,
  RecoveryAlert,
  RecoveryJourney,
  SymptomKey,
  User,
} from '@/types';
import { daysBetween } from '@/lib/utils';
import type {
  ClinicResponseRow,
  DailyCheckinRow,
  DailyVitalsRow,
  EnvironmentSnapshotRow,
  JourneyArchiveRow,
  ProfileRow,
  RecoveryAlertRow,
  RecoveryJourneyRow,
} from './database.types';

/**
 * PostgREST 중첩 관계 정규화.
 *
 * clinic_responses.alert_id에 UNIQUE가 걸려 있어 PostgREST가 이 관계를 to-one으로
 * 판단하고 배열이 아닌 객체를 돌려준다. 스키마 변경에 흔들리지 않도록 양쪽을 모두 받는다.
 */
export function firstOf<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function toUser(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    birthYear: row.birth_year ?? undefined,
    gender: (row.gender as User['gender']) ?? undefined,
    checkinReminderTime: row.checkin_reminder_time.slice(0, 5),
    clinicSharingConsent: row.clinic_sharing_consent,
    createdAt: row.created_at.slice(0, 10),
  };
}

export function toJourney(row: RecoveryJourneyRow, today: string): RecoveryJourney {
  return {
    id: row.id,
    userId: row.user_id,
    protocolId: row.protocol_id,
    procedureName: row.procedure_name,
    category: row.category as ProcedureCategory,
    clinicName: row.clinic_name,
    practitionerName: row.practitioner_name,
    procedureDate: row.procedure_date,
    currentDay: Math.max(0, daysBetween(row.procedure_date, today)),
    status: row.status,
    // 파생 필드는 회복 엔진이 채운다. DB에 저장된 값을 신뢰하지 않는다.
    recoveryProgress: 0,
    deviationScore: 0,
    createdAt: row.created_at,
  };
}

export function toCheckin(row: DailyCheckinRow, photoUrl?: string): DailyCheckin {
  return {
    id: row.id,
    journeyId: row.journey_id,
    date: row.date,
    day: row.day,
    symptoms: {
      swelling: row.swelling,
      redness: row.redness,
      pain: row.pain,
      peeling: row.peeling,
      tightness: row.tightness,
    },
    photoUrl: photoUrl ?? row.photo_path ?? undefined,
    moodNote: row.mood_note ?? undefined,
    followedRestrictions: row.followed_restrictions,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
  };
}

export function toVitals(row: DailyVitalsRow): DailyVitals {
  return {
    date: row.date,
    sleepHours: Number(row.sleep_hours),
    stressLevel: row.stress_level ?? 5,
    alcohol: row.alcohol,
  };
}

export function toEnvironment(row: EnvironmentSnapshotRow): EnvironmentSnapshot {
  return {
    date: row.date,
    uvIndex: row.uv_index,
    humidity: row.humidity,
    temperature: row.temperature,
    fineDust: row.fine_dust as EnvironmentSnapshot['fineDust'],
  };
}

export function toAlert(
  row: RecoveryAlertRow,
  response?: ClinicResponseRow | null
): RecoveryAlert {
  return {
    id: row.id,
    journeyId: row.journey_id,
    date: row.date,
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
    sharedWithClinic: row.shared_with_clinic,
    clinicResponse: response
      ? {
          respondedAt: response.responded_at,
          practitionerName: response.practitioner_name,
          message: response.message,
          suggestedVisit: response.suggested_visit,
        }
      : undefined,
  };
}

export function toArchiveEntry(
  row: JourneyArchiveRow,
  journey: Pick<RecoveryJourneyRow, 'procedure_name' | 'clinic_name' | 'procedure_date' | 'status'>
): JourneyArchiveEntry {
  return {
    id: row.id,
    journeyId: row.journey_id,
    procedureName: journey.procedure_name,
    clinicName: journey.clinic_name,
    procedureDate: journey.procedure_date,
    completedDay: row.completed_day,
    finalStatus: 'completed',
    satisfactionScore: row.satisfaction_score ?? undefined,
    beforePhotoUrl: row.before_photo_path ?? undefined,
    afterPhotoUrl: row.after_photo_path ?? undefined,
    learnedInsight: row.learned_insight,
  };
}
