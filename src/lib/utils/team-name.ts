type TeamLike = {
  name: Record<string, string>;
  shortName: Record<string, string>;
  code: string | null;
};

/**
 * Shared team display-name resolver.
 *
 * Fallback chain: name[locale] → name.en → shortName[locale] → shortName.en → code → '???'
 *
 * This matches the pattern already used by tournament components (GroupTable,
 * FeaturedMatchCard, etc.) and prefers full names over short codes.
 */
export function getTeamDisplayName(team: TeamLike | null, locale: string): string {
  if (!team) return '???';
  return (
    team.name[locale] ??
    team.name['en'] ??
    team.shortName[locale] ??
    team.shortName['en'] ??
    team.code ??
    '???'
  );
}

/**
 * Compact locale-aware team label for space-constrained contexts (ticker, score strips).
 *
 * For AR, prefer Arabic shortName/name first since 47/48 national teams have
 * shortName.ar; codes embedded in RTL text cause bidi artifacts. For EN/FR,
 * code-first is fine — Latin codes render naturally in LTR and most club teams
 * have no FR data anyway. Club teams in AR fall through to Latin name (no AR
 * data exists) — acceptable degradation until ingestion is fixed.
 *
 * AR chain:  shortName.ar → name.ar truncated → code → shortName.en → name.en truncated → '???'
 * EN/FR:     code → shortName[locale] → shortName.en → name[locale] truncated → name.en truncated → '???'
 */
export function getCompactTeamLabel(team: TeamLike | null, locale: string, maxLen = 6): string {
  if (!team) return '—';

  if (locale === 'ar') {
    return (
      team.shortName['ar'] ??
      truncate(team.name['ar'], maxLen) ??
      team.code ??
      team.shortName['en'] ??
      truncate(team.name['en'], maxLen) ??
      '???'
    );
  }

  return (
    team.code ??
    team.shortName[locale] ??
    team.shortName['en'] ??
    truncate(team.name[locale], maxLen) ??
    truncate(team.name['en'], maxLen) ??
    '???'
  );
}

function truncate(value: string | undefined, maxLen: number): string | null {
  if (!value) return null;
  return value.length <= maxLen ? value : value.slice(0, maxLen).trimEnd();
}
