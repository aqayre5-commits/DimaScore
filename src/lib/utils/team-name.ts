type TeamLike = {
  name: Record<string, string>;
  shortName: Record<string, string>;
  code: string | null;
  isNational?: boolean | null;
};

/**
 * Shared team display-name resolver.
 *
 * Fallback chain: name[locale] → name.en → shortName[locale] → shortName.en → code → 'TBD'
 *
 * This matches the pattern already used by tournament components (GroupTable,
 * FeaturedMatchCard, etc.) and prefers full names over short codes.
 */
export function getTeamDisplayName(team: TeamLike | null, locale: string): string {
  if (!team) return 'TBD';
  return (
    team.name[locale] ??
    team.name['en'] ??
    team.shortName[locale] ??
    team.shortName['en'] ??
    team.code ??
    'TBD'
  );
}

/**
 * Compact locale-aware team label for space-constrained contexts (ticker, score strips).
 *
 * National teams prefer their (FIFA) tri-code — the scoreboard convention (BRA, ARG,
 * RSA). Clubs prefer their real (short) name; a cryptic federation code (RAJ, ORA) is
 * only a last resort. For AR, Arabic shortName/name comes first either way, since Latin
 * codes embedded in RTL text cause bidi artifacts.
 *
 * National AR:    shortName.ar → name.ar trunc → code → shortName.en → name.en trunc → 'TBD'
 * National EN/FR: code → shortName[locale] → shortName.en → name[locale] trunc → name.en trunc → 'TBD'
 * Club AR:        shortName.ar → name.ar trunc → shortName.en → name.en trunc → code → 'TBD'
 * Club EN/FR:     shortName[locale] → shortName.en → name[locale] trunc → name.en trunc → code → 'TBD'
 */
export function getCompactTeamLabel(team: TeamLike | null, locale: string, maxLen = 6): string {
  if (!team) return '—';

  const isNational = team.isNational ?? false;

  if (locale === 'ar') {
    return isNational
      ? (team.shortName['ar'] ??
          truncate(team.name['ar'], maxLen) ??
          team.code ??
          team.shortName['en'] ??
          truncate(team.name['en'], maxLen) ??
          'TBD')
      : (team.shortName['ar'] ??
          truncate(team.name['ar'], maxLen) ??
          team.shortName['en'] ??
          truncate(team.name['en'], maxLen) ??
          team.code ??
          'TBD');
  }

  if (isNational) {
    // National teams: the FIFA tri-code is the ideal compact label (BRA, ARG, RSA).
    return (
      team.code ??
      team.shortName[locale] ??
      team.shortName['en'] ??
      truncate(team.name[locale], maxLen) ??
      truncate(team.name['en'], maxLen) ??
      'TBD'
    );
  }

  // Club teams: prefer the real (short) name; a cryptic code is the last resort.
  return (
    team.shortName[locale] ??
    team.shortName['en'] ??
    truncate(team.name[locale], maxLen) ??
    truncate(team.name['en'], maxLen) ??
    team.code ??
    'TBD'
  );
}

function truncate(value: string | undefined, maxLen: number): string | null {
  if (!value) return null;
  return value.length <= maxLen ? value : value.slice(0, maxLen).trimEnd();
}
