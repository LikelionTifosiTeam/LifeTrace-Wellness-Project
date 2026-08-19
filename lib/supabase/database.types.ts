/**
 * Supabase 테이블 타입.
 *
 * 스키마 원본은 supabase/migrations/. 실제 프로젝트 연결 후에는 아래 명령으로
 * 자동 생성한 파일로 교체할 수 있다.
 *
 *   npx supabase gen types typescript --project-id <ref> > lib/supabase/database.types.ts
 */

export type JourneyStatusRow = 'on-track' | 'watch' | 'off-track' | 'completed';
export type AlertLevelRow = 'info' | 'watch' | 'urgent';
export type ClinicRoleRow = 'practitioner' | 'admin';

export interface ProfileRow {
  id: string;
  email: string;
  name: string;
  birth_year: number | null;
  gender: string | null;
  checkin_reminder_time: string;
  clinic_sharing_consent: boolean;
  created_at: string;
}

export interface ClinicRow {
  id: string;
  name: string;
  created_at: string;
}

export interface ClinicMemberRow {
  user_id: string;
  clinic_id: string;
  display_name: string;
  role: ClinicRoleRow;
  created_at: string;
}

export interface RecoveryJourneyRow {
  id: string;
  user_id: string;
  protocol_id: string;
  procedure_name: string;
  category: string;
  clinic_id: string | null;
  clinic_name: string;
  practitioner_name: string;
  procedure_date: string;
  status: JourneyStatusRow;
  completed_at: string | null;
  created_at: string;
}

export interface DailyCheckinRow {
  id: string;
  journey_id: string;
  user_id: string;
  date: string;
  day: number;
  swelling: number;
  redness: number;
  pain: number;
  peeling: number;
  tightness: number;
  photo_path: string | null;
  mood_note: string | null;
  followed_restrictions: boolean;
  duration_seconds: number;
  created_at: string;
}

export interface DailyVitalsRow {
  id: string;
  user_id: string;
  date: string;
  sleep_hours: number;
  stress_level: number | null;
  alcohol: boolean;
  created_at: string;
}

export interface EnvironmentSnapshotRow {
  date: string;
  region: string;
  uv_index: number;
  humidity: number;
  temperature: number;
  fine_dust: string;
}

export interface RecoveryAlertRow {
  id: string;
  journey_id: string;
  user_id: string;
  date: string;
  day: number;
  level: AlertLevelRow;
  title: string;
  detail: string;
  triggered_by: { symptom: string; expected: number; actual: number }[];
  recommended_action: string;
  shared_with_clinic: boolean;
  shared_at: string | null;
  created_at: string;
}

export interface ClinicResponseRow {
  id: string;
  alert_id: string;
  responder_id: string | null;
  practitioner_name: string;
  message: string;
  suggested_visit: boolean;
  responded_at: string;
}

export interface JourneyArchiveRow {
  id: string;
  journey_id: string;
  user_id: string;
  completed_day: number;
  satisfaction_score: number | null;
  before_photo_path: string | null;
  after_photo_path: string | null;
  learned_insight: string;
  created_at: string;
}

export interface CareCardRow {
  id: string;
  journey_id: string;
  user_id: string;
  date: string;
  day: number;
  headline: string;
  rationale: string;
  avoid: unknown[];
  recommend: unknown[];
  signals_used: unknown[];
  generated_by: 'llm' | 'fallback';
  generated_at: string;
}
