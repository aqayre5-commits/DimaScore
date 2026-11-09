import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';

/**
 * Legacy bare-ID match URLs → real 308 to the canonical slug URL, issued in middleware *before*
 * render. (The page-level permanentRedirect() can't change the status under cacheComponents —
 * the 200 shell is already committed — so it only emitted a meta-refresh.)
 *
 *   /fr|en|ar/match/<digits>  → /<locale>/match/<home>-<away>-<id>
 *   /match/<digits>           → /fr/match/<home>-<away>-<id>   (default locale)
 *
 * Unknown IDs, fixtures without both team slugs, and DB errors fall through to the existing
 * page behaviour (no redirect loops, nothing new can 5xx).
 */
const BARE_MATCH_RE = /^(?:\/(fr|en|ar))?\/match\/(\d{1,10})\/?$/;

export function parseBareMatchPath(pathname: string): { locale: Locale; fixtureId: number } | null {
  const m = BARE_MATCH_RE.exec(pathname);
  if (!m) return null;
  const id = Number(m[2]);
  if (!Number.isSafeInteger(id) || id <= 0 || id >= 2_000_000_000) return null;
  const locale = (m[1] ?? defaultLocale) as Locale;
  if (!(locales as readonly string[]).includes(locale)) return null;
  return { locale, fixtureId: id };
}

type SlugLookup = (fixtureId: number) => Promise<string | null>;

interface CacheEntry {
  slug: string | null;
  expires: number;
}

const TTL_MS = 60 * 60 * 1000; // 1h — team slugs essentially never change
const NEG_TTL_MS = 5 * 60 * 1000; // unknown IDs: re-check after 5 min (fixture may be ingested)
const MAX_ENTRIES = 5_000;

/** Per-instance LRU-ish cache in front of the DB slug lookup. */
export function createCachedSlugLookup(lookup: SlugLookup, now: () => number = Date.now) {
  const cache = new Map<number, CacheEntry>();
  return async function cachedLookup(fixtureId: number): Promise<string | null> {
    const hit = cache.get(fixtureId);
    if (hit && hit.expires > now()) return hit.slug;
    const slug = await lookup(fixtureId);
    if (cache.size >= MAX_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(fixtureId, { slug, expires: now() + (slug ? TTL_MS : NEG_TTL_MS) });
    return slug;
  };
}

/**
 * Resolve the redirect target for a bare-ID match path, or null to fall through.
 * `slug` must be the full canonical match slug (`home-away-<id>`); a bare-id slug (team slugs
 * missing) means the bare URL *is* canonical, so we never redirect it to itself.
 */
export async function resolveBareMatchRedirect(
  pathname: string,
  lookup: SlugLookup,
): Promise<string | null> {
  const parsed = parseBareMatchPath(pathname);
  if (!parsed) return null;
  let slug: string | null;
  try {
    slug = await lookup(parsed.fixtureId);
  } catch {
    return null; // fail open: page renders as before
  }
  if (!slug || slug === String(parsed.fixtureId)) return null;
  return `/${parsed.locale}/match/${slug}`;
}
