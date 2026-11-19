/**
 * HTTP status for unknown match / team / player URLs.
 *
 * Under `cacheComponents`, `notFound()` inside the page runs after the 200 shell is already
 * committed, so invented ids were soft-404s. Middleware decides the status *before* render
 * (same reason bare-id match URLs 308 in middleware). A lookup that throws is an outage:
 * 503, never a 404, so a blip cannot drop real pages out of the index.
 */

import { defaultLocale, isRtl, locales, type Locale } from '@/lib/i18n/config';
import { parseTrailingId } from '@/lib/seo/entity-slug';

export type EntityKind = 'match' | 'team' | 'player';
export type Existence = 'found' | 'missing' | 'unavailable';

export interface EntityRef {
  locale: Locale;
  kind: EntityKind;
  /** Decoded single path segment (`netherlands-germany-1528862`, `raja-ca-31`, …). */
  slug: string;
}

export interface EntityHttpResponse {
  status: 404 | 503;
  body: string;
  headers: Record<string, string>;
}

const SEGMENT_TO_KIND = { match: 'match', equipe: 'team', joueur: 'player' } as const;

/** `/fr/match/…`, `/en/equipe/…`, `/ar/joueur/…`, and locale-less `/match/…` (default locale). */
const ENTITY_PATH_RE = /^\/(?:(fr|en|ar)\/)?(match|equipe|joueur)\/([^/]+)\/?$/;

/** API-Football ids fit in a Postgres integer. Anything else cannot be a real row. */
const MAX_ENTITY_ID = 2_000_000_000;

/**
 * Copy kept identical to `notFound` in src/lib/i18n/messages/{fr,en,ar}.json.
 * A unit test fails if those files drift.
 */
export const NOT_FOUND_COPY: Record<Locale, { heading: string; body: string; cta: string }> = {
  fr: {
    heading: 'Page introuvable',
    body: "La page que vous cherchez n'existe pas ou a été déplacée.",
    cta: "Retour à l'accueil",
  },
  en: {
    heading: 'Page not found',
    body: "The page you're looking for doesn't exist or has been moved.",
    cta: 'Go home',
  },
  ar: {
    heading: 'الصفحة غير موجودة',
    body: 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.',
    cta: 'العودة إلى الرئيسية',
  },
};

const UNAVAILABLE_COPY: Record<Locale, { heading: string; body: string; cta: string }> = {
  fr: {
    heading: 'Service momentanément indisponible',
    body: 'Les données sont temporairement inaccessibles. Réessayez dans un instant.',
    cta: 'Retour à l’accueil',
  },
  en: {
    heading: 'Temporarily unavailable',
    body: 'The data is temporarily unreachable. Please try again shortly.',
    cta: 'Go home',
  },
  ar: {
    heading: 'الخدمة غير متاحة مؤقتاً',
    body: 'البيانات غير متاحة مؤقتاً. يُرجى المحاولة بعد قليل.',
    cta: 'العودة إلى الرئيسية',
  },
};

export function parseEntityPath(pathname: string): EntityRef | null {
  const m = ENTITY_PATH_RE.exec(pathname);
  if (!m) return null;
  const locale = (m[1] ?? defaultLocale) as Locale;
  if (!(locales as readonly string[]).includes(locale)) return null;
  let slug: string;
  try {
    slug = decodeURIComponent(m[3]);
  } catch {
    return null;
  }
  if (!slug || slug.length > 200) return null;
  const kind = SEGMENT_TO_KIND[m[2] as keyof typeof SEGMENT_TO_KIND];
  return { locale, kind, slug };
}

/**
 * How to resolve the URL. `impossible` means the path can never be an entity (no id on a match,
 * or an id outside the integer range) — that is a 404 and must not touch the database.
 * Team and player URLs without a trailing id fall back to an exact slug match, same as the pages.
 */
export function entityLookupKey(
  ref: EntityRef,
): { by: 'id'; id: number } | { by: 'slug' } | { by: 'impossible' } {
  const id = parseTrailingId(ref.slug);
  if (id != null) {
    if (!Number.isSafeInteger(id) || id <= 0 || id >= MAX_ENTITY_ID) return { by: 'impossible' };
    return { by: 'id', id };
  }
  if (ref.kind === 'match') return { by: 'impossible' };
  return { by: 'slug' };
}

/** Cache key is locale-independent: a fixture either exists or it doesn't. */
export function entityCacheKey(ref: EntityRef): string {
  return `${ref.kind}:${ref.slug}`;
}

const FOUND_TTL_MS = 5 * 60 * 1000;
const MISSING_TTL_MS = 60 * 1000;
const MAX_CACHE_ENTRIES = 5_000;

/**
 * Remember found/missing results. A thrown lookup (database down) becomes `unavailable`,
 * unless this instance already knows the entity exists — then we keep serving it instead of
 * turning a blip into a 503 for a page we have seen.
 */
export function createExistenceCache(now: () => number = Date.now) {
  const cache = new Map<string, { existence: 'found' | 'missing'; expires: number }>();
  return async function resolve(
    key: string,
    lookup: () => Promise<'found' | 'missing'>,
  ): Promise<Existence> {
    const hit = cache.get(key);
    if (hit && hit.expires > now()) return hit.existence;
    try {
      const existence = await lookup();
      if (cache.size >= MAX_CACHE_ENTRIES) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
      }
      cache.set(key, {
        existence,
        expires: now() + (existence === 'found' ? FOUND_TTL_MS : MISSING_TTL_MS),
      });
      return existence;
    } catch {
      if (hit?.existence === 'found') return 'found';
      return 'unavailable';
    }
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderDocument(
  locale: Locale,
  status: 404 | 503,
  copy: { heading: string; body: string; cta: string },
): string {
  const dir = isRtl(locale) ? 'rtl' : 'ltr';
  const title = escapeHtml(copy.heading);
  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${title} | DimaScore</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;padding:1.5rem;text-align:center;background:#0d1117;color:#e6edf3;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
<p style="margin:0;color:#4361ee;font-size:3.5rem;font-weight:700">${status}</p>
<h1 style="margin:0;font-size:1.5rem;font-weight:600">${title}</h1>
<p style="margin:0;max-width:28rem;color:#9aa7b4;font-size:0.95rem">${escapeHtml(copy.body)}</p>
<a href="/${locale}" style="background:#4361ee;color:#fff;border-radius:0.5rem;padding:0.625rem 1.25rem;font-size:0.875rem;font-weight:500;text-decoration:none">${escapeHtml(copy.cta)}</a>
</body>
</html>
`;
}

/** `null` when the entity exists and the page should render normally. */
export function entityHttpResponse(
  ref: EntityRef,
  existence: Existence,
): EntityHttpResponse | null {
  if (existence === 'found') return null;
  const status = existence === 'unavailable' ? 503 : 404;
  const copy = status === 503 ? UNAVAILABLE_COPY[ref.locale] : NOT_FOUND_COPY[ref.locale];
  const headers: Record<string, string> = {
    'content-type': 'text/html; charset=utf-8',
    'x-robots-tag': 'noindex, nofollow',
    'cache-control': 'private, no-store',
  };
  if (status === 503) headers['retry-after'] = '120';
  return { status, body: renderDocument(ref.locale, status, copy), headers };
}
