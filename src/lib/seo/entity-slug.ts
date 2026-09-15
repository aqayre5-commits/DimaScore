/**
 * Entity-slug helpers for slug+ID URLs (`raja-ca-31`, `yassine-bounou-2701`).
 *
 * The ID is the stable, canonical key; the leading name-part is a human-readable keyword that may
 * drift (renames, transliteration tweaks) or be wrong on inbound links. Resolving by the trailing
 * ID lets a page self-heal, and callers 301 the request to the canonical slug when the name-part
 * differs.
 */

/**
 * Extract the trailing numeric ID from an entity slug — `raja-ca-31` → 31, `yassine-bounou-2701`
 * → 2701, a bare `31` → 31. Returns null when there is no trailing id (a legacy name-only slug),
 * so callers can fall back to an exact slug match.
 */
export function parseTrailingId(slug: string): number | null {
  const m = /-(\d+)$/.exec(slug);
  if (m) return Number(m[1]);
  if (/^\d+$/.test(slug)) return Number(slug);
  return null;
}
