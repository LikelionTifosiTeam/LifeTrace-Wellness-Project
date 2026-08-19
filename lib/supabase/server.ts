import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import {
  hasSupabaseCredentials,
  isMockValue,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseUrl,
} from '@/lib/env';

/**
 * 서버 컴포넌트 / Route Handler 용 Supabase 클라이언트.
 * 사용자 세션(RLS 적용)을 그대로 이어받는다.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!hasSupabaseCredentials()) return null;

  const cookieStore = cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // 서버 컴포넌트에서는 쿠키 쓰기가 막힌다. 미들웨어가 갱신을 담당한다.
        }
      },
    },
  });
}

/**
 * 서비스 역할 키를 쓰는 관리자 클라이언트. RLS를 우회하므로
 * 클리닉 응답 저장처럼 서버만 수행해야 하는 작업에만 쓴다.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!hasSupabaseCredentials() || isMockValue(supabaseServiceRoleKey)) return null;
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
