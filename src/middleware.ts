import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/lib/i18n/routing';
import { getAdminSession } from '@/lib/auth/admin';
import { checkRateLimit } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

const intlMiddleware = createMiddleware(routing);

// Enumeration-prone JSON endpoints worth rate-limiting. `/api/v1/live` is intentionally excluded:
// it's polled every 30s by our own clients (limiting it would hit real users) and holds little
// scrape value. Crawlers fetch HTML, never this API, so a JSON-scoped limit can't affect them.
const RATE_LIMITED_API = /^\/api\/v1\/(match|search|media)(\/|$)/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public JSON API: per-IP rate limit on enumeration-prone routes (429 + Retry-After, fail-open).
  if (pathname.startsWith('/api/v1/')) {
    if (RATE_LIMITED_API.test(pathname)) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      const { ok, retryAfter } = checkRateLimit(ip);
      if (!ok) {
        return NextResponse.json(
          { error: 'Too Many Requests' },
          { status: 429, headers: { 'Retry-After': String(retryAfter) } },
        );
      }
    }
    return NextResponse.next();
  }

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
  matcher: ['/', '/(fr|en|ar)/:path*', '/admin/:path*', '/api/v1/:path*'],
};
