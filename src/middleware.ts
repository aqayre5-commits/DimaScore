import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/lib/i18n/routing';
import { getAdminSession } from '@/lib/auth/admin';

export const runtime = 'nodejs';

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes: gate behind session cookie (except /admin/login)
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const session = getAdminSession(request.cookies);
    if (!session) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // All other matched routes: next-intl locale handling
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(fr|en|ar)/:path*', '/admin/:path*'],
};
