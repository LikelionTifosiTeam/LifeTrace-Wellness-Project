'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hasSupabaseCredentials, supabaseAnonKey, supabaseUrl } from '@/lib/env';

let cached: SupabaseClient | null = null;

/**
 * 브라우저용 Supabase 클라이언트.
 *
 * 키가 아직 목업 자리표시자면 null을 돌려준다. 호출부는 null일 때
 * 목데이터 경로로 빠지므로, 키 없이도 앱이 정상 동작한다.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!hasSupabaseCredentials()) return null;
  if (!cached) {
    cached = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return cached;
}
