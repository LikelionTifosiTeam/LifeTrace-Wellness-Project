import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { hasSupabaseCredentials, supabaseAnonKey, supabaseUrl } from '@/lib/env';

/**
 * Supabase 세션 쿠키 갱신.
 *
 * 키가 아직 목업 자리표시자면 아무것도 하지 않고 통과시킨다 —
 * 목데이터 모드에서는 인증이 필요 없고, 미들웨어가 앱을 막아서도 안 된다.
 */
export async function middleware(request: NextRequest) {
  if (!hasSupabaseCredentials()) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
};
