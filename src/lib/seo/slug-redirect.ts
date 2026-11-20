/**
 * Old team/player slugs (czech-republic-770 → czechia-770) 301 to the stored slug.
 * The trailing id is the key. A missing id, or an id the database does not have,
 * is not redirected here.
 */

import { parseTrailingId } from '@/lib/seo/entity-slug';

const ENTITY_RE = /^\/(fr|en|ar)\/(equipe|joueur)\/([^/]+)\/?$/;

export interface SlugRedirectRef {
  locale: 'fr' | 'en' | 'ar';
  kind: 'team' | 'player';
  segment: 'equipe' | 'joueur';
  id: number;
  requestedSlug: string;
}

export function parseSlugRedirect(pathname: string): SlugRedirectRef | null {
  const match = ENTITY_RE.exec(pathname);
  if (!match) return null;
  let requestedSlug = match[3];
  try {
    requestedSlug = decodeURIComponent(requestedSlug);
  } catch {
    return null;
  }
  const id = parseTrailingId(requestedSlug);
  if (id == null || !Number.isSafeInteger(id) || id <= 0 || id >= 2_000_000_000) return null;
  return {
    locale: match[1] as SlugRedirectRef['locale'],
    kind: match[2] === 'equipe' ? 'team' : 'player',
    segment: match[2] as SlugRedirectRef['segment'],
    id,
    requestedSlug,
  };
}

/** 301 path when the stored slug differs. Null when it already matches or the id is unknown. */
export function slugRedirectPath(ref: SlugRedirectRef, canonicalSlug: string | null): string | null {
  if (!canonicalSlug || canonicalSlug === ref.requestedSlug) return null;
  return `/${ref.locale}/${ref.segment}/${canonicalSlug}`;
}
