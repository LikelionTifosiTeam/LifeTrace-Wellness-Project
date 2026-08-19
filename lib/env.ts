/**
 * 환경 변수 단일 진입점.
 *
 * 아직 교체되지 않은 자리표시자('mock-...')는 없는 값으로 취급한다.
 * 덕분에 키가 비어 있어도 앱이 깨지지 않고 안전한 대체 경로로 떨어진다.
 * (예: ANTHROPIC_API_KEY가 없으면 케어 카드 문장을 로컬 생성기가 만든다.)
 */

/** 'mock-...' 형태이거나 비어 있으면 아직 교체되지 않은 자리표시자로 본다. */
export function isMockValue(value: string | undefined | null): boolean {
  if (!value) return true;
  const v = value.trim();
  return v === '' || v.startsWith('mock-') || v.includes('replace-me');
}

/**
 * 심사·시연용 기본값.
 *
 * Supabase publishable 키는 설계상 클라이언트 번들에 노출되는 공개 키이며,
 * 실제 접근 통제는 전부 RLS가 담당한다(본인 행 + 공유 동의한 알림만).
 * 배포 환경에 환경 변수를 넣으면 그 값이 우선한다.
 * service_role 키는 절대 여기에 두지 않는다 — 서버 전용 변수로만 읽는다.
 */
const DEFAULT_SUPABASE_URL = 'https://muvtvsdouvbsmmsikedk.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lS73PddxavthIDDuER_ssA_-zqqolP7';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

/** Supabase 키가 실제 값으로 채워져 있는지 */
export function hasSupabaseCredentials(): boolean {
  return !isMockValue(supabaseUrl) && !isMockValue(supabaseAnonKey);
}

// --- 서버 전용 (클라이언트 번들에 포함되지 않음) -----------------------------

export const anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? '';
export const anthropicModel = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5';
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export function hasAnthropicKey(): boolean {
  return !isMockValue(anthropicApiKey);
}
