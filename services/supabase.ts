'use client';

/**
 * 서비스 레이어 공통 기반.
 *
 * 모든 데이터는 Supabase에서 온다. 브라우저 클라이언트는 사용자 세션으로 동작하고,
 * RLS가 "본인 행"과 "공유에 동의한 알림"만 통과시킨다.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function db(): SupabaseClient {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new ApiError(
      'NO_CLIENT',
      '서버 설정이 완료되지 않았습니다. 환경 변수를 확인해 주세요.',
      500
    );
  }
  return client;
}

export async function requireUserId(): Promise<string> {
  const { data, error } = await db().auth.getUser();
  if (error || !data.user) {
    throw new ApiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);
  }
  return data.user.id;
}

/** Supabase 오류를 서비스 오류로 감싼다. 사용자에게 raw 메시지를 그대로 보이지 않는다. */
export function fail(message: string, error?: { message?: string }): never {
  throw new ApiError('QUERY_FAILED', error?.message ? `${message}` : message);
}
