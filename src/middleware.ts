import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/lib/i18n/routing';
import { getAdminSession } from '@/lib/auth/admin';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { resolveBareMatchRedirect } from '@/lib/seo/match-redirect';
import { lookupMatchSlug } from '@/lib/seo/match-slug-lookup';
import {
  createExistenceCache,
  entityCacheKey,
  entityHttpResponse,
  parseEntityPath,
} from '@/lib/seo/entity-http';
import { lookupEntity } from '@/lib/seo/entity-lookup';

export const runtime = 'nodejs';

const intlMiddleware = createMiddleware(routing);
const resolveExistence = createExistenceCache();

// Enumeration-prone JSON endpoints worth rate-limiting. `/api/v1/live` is intentionally excluded:
// it's polled every 30s by our own clients (limiting it would hit real users) and holds little
// scrape value. Crawlers fetch HTML, never this API, so a JSON-scoped limit can't affect them.
const RATE_LIMITED_API = /^\/api\/v1\/(match|search|media)(\/|$)/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Legacy bare-ID match URLs (/fr/match/123, /match/123) → real 308 to the slug URL before render.
  // Unknown ids and DB errors fall through to the existence check below (404 / 503), which also
  // covers slug URLs. A locale-less /match/<id> that *does* exist but has no slug to redirect to
  // still skips next-intl (it would prefix the path into a soft-404).
  if (/\/match\/\d+\/?$/.test(pathname)) {
    const target = await resolveBareMatchRedirect(pathname, lookupMatchSlug);
    if (target) {
      const url = request.nextUrl.clone();
      url.pathname = target;
      return NextResponse.redirect(url, 308);
    }
  }

  const entity = parseEntityPath(pathname);
  if (entity) {
    const existence = await resolveExistence(entityCacheKey(entity), () => lookupEntity(entity));
    const http = entityHttpResponse(entity, existence);
    if (http) {
      return new NextResponse(http.body, { status: http.status, headers: http.headers });
    }
    if (pathname.startsWith('/match/')) return NextResponse.next();
  }

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
  matcher: ['/', '/(fr|en|ar)/:path*', '/match/:id', '/admin/:path*', '/api/v1/:path*'],
};
