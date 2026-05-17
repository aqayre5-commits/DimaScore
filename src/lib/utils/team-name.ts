/**
 * Shared team display-name resolver.
 *
 * Fallback chain: name[locale] → name.en → shortName[locale] → shortName.en → code → '???'
 *
 * This matches the pattern already used by tournament components (GroupTable,
 * FeaturedMatchCard, etc.) and prefers full names over short codes.
 */
export function getTeamDisplayName(
  team: {
    name: Record<string, string>;
    shortName: Record<string, string>;
    code: string | null;
  } | null,
  locale: string,
): string {
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
