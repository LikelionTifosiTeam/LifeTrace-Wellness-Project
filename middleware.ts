import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { hasSupabaseCredentials, supabaseAnonKey, supabaseUrl } from '@/lib/env';

/** 로그인이 필요한 경로 */
const PROTECTED = ['/today', '/checkin', '/recovery', '/vitals', '/journal', '/profile', '/settings', '/clinic', '/onboarding'];

/**
 * Supabase 세션 갱신 + 라우트 보호.
 *
 * 비로그인 상태로 앱 화면에 들어오면 로그인으로 보낸다.
 * 클리닉 계정이 환자 화면에 들어오면 대시보드로 돌려보낸다 (그 반대도 마찬가지).
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsAuth = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: membership } = await supabase
      .from('clinic_members')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const isClinic = Boolean(membership);

    if (isClinic && needsAuth && !path.startsWith('/clinic')) {
      const url = request.nextUrl.clone();
      url.pathname = '/clinic';
      return NextResponse.redirect(url);
    }
    if (!isClinic && path.startsWith('/clinic')) {
      const url = request.nextUrl.clone();
      url.pathname = '/today';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
};
