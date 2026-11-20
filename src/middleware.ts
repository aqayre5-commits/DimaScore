import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/lib/i18n/routing';
import { getAdminSession } from '@/lib/auth/admin';
import { lookupCanonicalSlug } from '@/lib/seo/slug-redirect-lookup';
import { parseSlugRedirect, slugRedirectPath } from '@/lib/seo/slug-redirect';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { pointXDefaultAtEnglish } from '@/lib/i18n/hreflang-header';
import { canonicalCompetitionRedirect } from '@/lib/seo/competition-canonical';
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

  // `/` must not 307 based on Accept-Language. One permanent redirect, always English.
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}`;
    return NextResponse.redirect(url, 308);
  }

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

  // Renamed team/player slugs → 301 to the stored slug. Unknown ids fall through (not a 404 here).
  // A database error falls through too, so an outage does not turn real pages into redirects or 404s.
  const slugRef = parseSlugRedirect(pathname);
  if (slugRef) {
    try {
      const canonical = await lookupCanonicalSlug(slugRef);
      const target = slugRedirectPath(slugRef, canonical);
      if (target) {
        const url = request.nextUrl.clone();
        url.pathname = target;
        return NextResponse.redirect(url, 301);
      }
    } catch {
      // fail open
    }
  }

  // Off-locale competition slugs (/en/competition/maroc/botola-pro) → 301 to this locale's canonical.
  const competitionTarget = canonicalCompetitionRedirect(pathname);
  if (competitionTarget) {
    const url = request.nextUrl.clone();
    url.pathname = competitionTarget;
    return NextResponse.redirect(url, 301);
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

  // All other matched routes: next-intl locale handling.
  // Rewrite x-default onto the English alternate. next-intl emits the unprefixed path.
  const response = intlMiddleware(request);
  const link = response.headers.get('link');
  if (link) {
    const fixed = pointXDefaultAtEnglish(link);
    if (fixed !== link) response.headers.set('link', fixed);
  }
  return response;
}

export const config = {
  matcher: ['/', '/(fr|en|ar)/:path*', '/match/:id', '/admin/:path*', '/api/v1/:path*'],
};
