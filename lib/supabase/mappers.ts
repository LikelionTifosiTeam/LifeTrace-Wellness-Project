/**
 * Supabase 행(snake_case) ↔ 도메인 타입(camelCase) 변환.
 *
 * 페이지와 회복 엔진은 도메인 타입만 안다. DB 컬럼명이 바뀌어도 이 파일만 고치면 된다.
 */

import {
  DailyCheckin,
  EnvironmentSnapshot,
  JourneyArchiveEntry,
  ProcedureCategory,
  RecoveryAlert,
  RecoveryJourney,
  SymptomKey,
  User,
  WearableSnapshot,
} from '@/types';
import { daysBetween } from '@/lib/utils';
import type {
  ClinicResponseRow,
  DailyCheckinRow,
  EnvironmentSnapshotRow,
  JourneyArchiveRow,
  ProfileRow,
  RecoveryAlertRow,
  RecoveryJourneyRow,
  WearableSnapshotRow,
} from './database.types';

export function toUser(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    birthYear: row.birth_year ?? undefined,
    gender: (row.gender as User['gender']) ?? undefined,
    checkinReminderTime: row.checkin_reminder_time.slice(0, 5),
    connectedWearable: row.connected_wearable ?? undefined,
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
    photoUrl: photoUrl ?? undefined,
    moodNote: row.mood_note ?? undefined,
    followedRestrictions: row.followed_restrictions,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
  };
}

export function fromCheckin(
  input: {
    journeyId: string;
    userId: string;
    date: string;
    day: number;
    symptoms: Record<SymptomKey, number>;
    moodNote?: string;
    photoPath?: string;
    followedRestrictions: boolean;
    durationSeconds: number;
  }
): Omit<DailyCheckinRow, 'id' | 'created_at'> {
  return {
    journey_id: input.journeyId,
    user_id: input.userId,
    date: input.date,
    day: input.day,
    swelling: input.symptoms.swelling,
    redness: input.symptoms.redness,
    pain: input.symptoms.pain,
    peeling: input.symptoms.peeling,
    tightness: input.symptoms.tightness,
    photo_path: input.photoPath ?? null,
    mood_note: input.moodNote ?? null,
    followed_restrictions: input.followedRestrictions,
    duration_seconds: input.durationSeconds,
  };
}

export function toWearable(row: WearableSnapshotRow): WearableSnapshot {
  return {
    date: row.date,
    source: row.source,
    sleepHours: Number(row.sleep_hours),
    sleepQuality: row.sleep_quality ?? 0,
    hrvMs: row.hrv_ms ?? 0,
    restingHr: row.resting_hr ?? 0,
    steps: row.steps ?? 0,
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
    triggeredBy: row.triggered_by.map((t) => ({
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
    finalStatus: journey.status,
    satisfactionScore: row.satisfaction_score ?? undefined,
    beforePhotoUrl: row.before_photo_path ?? undefined,
    afterPhotoUrl: row.after_photo_path ?? undefined,
    learnedInsight: row.learned_insight,
  };
}
