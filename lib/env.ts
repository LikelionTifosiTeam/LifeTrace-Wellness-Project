/**
 * 환경 변수 단일 진입점.
 *
 * 모든 키는 목업 자리표시자로 시작한다. 실제 키로 교체하기 전까지는
 * isMockValue()가 true를 돌려주고, 앱은 자동으로 목데이터/로컬 생성기로 동작한다.
 * 덕분에 키 없이도 전체 플로우가 깨지지 않고, 키를 넣는 순간 실서비스로 전환된다.
 */

export type DataSource = 'mock' | 'supabase';

/** 'mock-...' 형태이거나 비어 있으면 아직 교체되지 않은 자리표시자로 본다. */
export function isMockValue(value: string | undefined | null): boolean {
  if (!value) return true;
  const v = value.trim();
  return v === '' || v.startsWith('mock-') || v.includes('replace-me');
}

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Supabase 키가 실제 값으로 채워져 있는지 */
export function hasSupabaseCredentials(): boolean {
  return !isMockValue(supabaseUrl) && !isMockValue(supabaseAnonKey);
}

/**
 * 실제로 사용할 데이터 소스.
 * NEXT_PUBLIC_DATA_SOURCE=supabase 로 지정해도 키가 목업이면 mock으로 강등한다.
 * (데모 중 흰 화면이 뜨는 것보다 목데이터로 도는 편이 항상 낫다.)
 */
export function resolveDataSource(): DataSource {
  const requested = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock') as DataSource;
  if (requested === 'supabase' && hasSupabaseCredentials()) return 'supabase';
  return 'mock';
}

export const dataSource: DataSource = resolveDataSource();
export const isSupabase = dataSource === 'supabase';

// --- 서버 전용 (클라이언트 번들에 포함되지 않음) -----------------------------

export const anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? '';
export const anthropicModel = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5';
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export function hasAnthropicKey(): boolean {
  return !isMockValue(anthropicApiKey);
}
