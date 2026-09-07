import { ALL_ENTRIES, type MegaMenuEntry } from '@/lib/constants/competitions-mega-menu';

export const BOTOLA_PRO_ID = 200;

const DASH_RE =
  /[\u2010-\u2015\u2212\u2043\u00AD\u058A\u05BE\u1806\u2E3A\u2E3B\uFE58\uFE63\uFF0D\u0640]+/g;

/**
 * Decode + Unicode-NFC + unify dashes so `/ar/…/البطولة-الاحترافية` and mixed
 * EN/FR slug aliases all collapse to one lookup key.
 */
export function normalizeCompetitionSlug(raw: string): string {
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    // already decoded or malformed — keep as-is
  }
  try {
    value = decodeURIComponent(value);
  } catch {
    // second pass is a no-op when not percent-encoded
  }
  return value.normalize('NFC').replace(DASH_RE, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function slugKey(slug: string): string {
  const normalized = normalizeCompetitionSlug(slug);
  return /[A-Za-z]/.test(normalized) ? normalized.toLowerCase() : normalized;
}

const SLUG_TO_ENTRY: Map<string, MegaMenuEntry> = (() => {
  const map = new Map<string, MegaMenuEntry>();
  for (const entry of ALL_ENTRIES) {
    for (const slug of Object.values(entry.slugs)) {
      map.set(slugKey(slug), entry);
    }
  }
  // Short aliases that are not locale-canonical mega-menu slugs (BUG-016).
  const ucl = ALL_ENTRIES.find((e) => e.competitionId === 2);
  if (ucl) map.set(slugKey('ucl'), ucl);
  return map;
})();

/** Resolve any locale slug (or mixed-locale alias) to the mega-menu entry. */
export function resolveCompetitionEntry(tournament: string): MegaMenuEntry | undefined {
  return SLUG_TO_ENTRY.get(slugKey(tournament));
}

export function resolveCompetitionId(tournament: string): number | undefined {
  return resolveCompetitionEntry(tournament)?.competitionId;
}

/** Every published slug for a competition (used by season-default tests). */
export function competitionSlugAliases(competitionId: number): string[] {
  const entry = ALL_ENTRIES.find((e) => e.competitionId === competitionId);
  if (!entry) return [];
  return [...new Set(Object.values(entry.slugs).map(normalizeCompetitionSlug))];
}
