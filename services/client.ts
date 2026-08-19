/**
 * Service Layer 공통 어댑터.
 *
 * 현재는 mock 데이터를 지연과 함께 반환한다.
 * 백엔드가 준비되면 이 파일의 request()만 fetch 구현으로 교체하면 되고,
 * 각 서비스 모듈과 페이지 코드는 수정하지 않는다.
 */

import { dataSource } from '@/lib/env';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.afterglow.kr/v1';

/** Supabase가 아닌 경우에는 목데이터로 응답한다 (lib/env.ts에서 키 유효성까지 검사). */
export const USE_MOCK = dataSource === 'mock';

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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface RequestOptions<T> {
  /** 실제 백엔드 경로. mock 모드에서는 사용되지 않지만 계약 문서와 1:1로 유지한다. */
  path: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** mock 모드에서 반환할 값을 만드는 함수 */
  mock: () => T | Promise<T>;
  /** 네트워크 지연 시뮬레이션 (ms) */
  latency?: number;
}

export async function request<T>({
  path,
  method = 'GET',
  body,
  mock,
  latency = 350,
}: RequestOptions<T>): Promise<T> {
  if (USE_MOCK) {
    await delay(latency);
    return mock();
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new ApiError(
      json?.error?.code ?? 'UNKNOWN',
      json?.error?.message ?? '요청을 처리하지 못했습니다.',
      res.status
    );
  }
  return json.data as T;
}
