import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // 로그인 페이지나 고객 접근용 퍼블릭 경로는 인증 없이 통과
  if (
    pathname === '/login' ||
    pathname.startsWith('/store') ||
    pathname.startsWith('/table-order') ||
    pathname.startsWith('/booking') ||
    pathname.startsWith('/m')
  ) {
    return NextResponse.next();
  }

  // 위 퍼블릭 경로를 제외한 모든 관리자 대시보드 접근 시, 토큰이 없으면 로그인 화면으로 강제 이동
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 아래 경로들을 제외한 모든 요청에 대해 미들웨어가 실행됩니다:
     * - api (API 라우트는 각각 검증하거나 별도 처리)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (파비콘)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
