import type { HomeFixture } from '@/lib/db/queries/homepage';
import type { Locale } from '@/lib/i18n/config';
import type { TeamSnapshot } from '@/lib/db/queries-hydrate';
import { LIVE_CODES_ARRAY } from '@/lib/match-status';

const LIVE = new Set<string>(LIVE_CODES_ARRAY);

/** Botola Pro, Botola 2, Coupe du Trône — above-the-fold homepage competitions. */
export const PRIMARY_HOME_COMP_IDS = new Set([200, 201, 822]);
const MA = 'MA';

function slimNameMap(record: Record<string, string>, locale: Locale): Record<string, string> {
  const local = record[locale] ?? record.en ?? '';
  const en = record.en ?? local;
  return locale === 'en' ? { en } : { [locale]: local, en };
}

function slimTeam(team: TeamSnapshot | null, locale: Locale): TeamSnapshot | null {
  if (!team) return null;
  return {
    id: team.id,
    slug: team.slug,
    name: slimNameMap(team.name, locale),
    shortName: slimNameMap(team.shortName, locale),
    code: team.code,
    countryCode: team.countryCode,
    // Crest reconstructed from id in Flag — do not inline media.api-sports.io URLs.
    logoUrl: team.logoUrl?.startsWith('/') ? team.logoUrl : null,
    isNational: team.isNational,
  };
}

export function slimHomeFixture(fixture: HomeFixture, locale: Locale): HomeFixture {
  return {
    ...fixture,
    homeTeam: slimTeam(fixture.homeTeam, locale),
    awayTeam: slimTeam(fixture.awayTeam, locale),
    venueName: null,
    venueCity: null,
    venueCapacity: null,
    competition: {
      ...fixture.competition,
      name: slimNameMap(fixture.competition.name, locale),
      logoUrl: fixture.competition.logoUrl?.startsWith('/') ? fixture.competition.logoUrl : null,
    },
  };
}

export function isPrimaryHomeFixture(f: HomeFixture): boolean {
  if (PRIMARY_HOME_COMP_IDS.has(f.competition.id)) return true;
  if (f.homeTeam?.countryCode === MA || f.awayTeam?.countryCode === MA) return true;
  return false;
}

export function partitionHomeMatches(
  matches: { live: HomeFixture[]; upcoming: HomeFixture[]; results: HomeFixture[] },
  locale: Locale,
): {
  primary: { live: HomeFixture[]; upcoming: HomeFixture[]; results: HomeFixture[] };
  secondary: { live: HomeFixture[]; upcoming: HomeFixture[]; results: HomeFixture[] };
} {
  const split = (list: HomeFixture[]) => {
    const primary: HomeFixture[] = [];
    const secondary: HomeFixture[] = [];
    for (const f of list) {
      const slim = slimHomeFixture(f, locale);
      if (LIVE.has(f.statusCode)) {
        primary.push(slim);
      } else if (isPrimaryHomeFixture(f)) {
        primary.push(slim);
      } else {
        secondary.push(slim);
      }
    }
    return { primary, secondary };
  };

  const live = split(matches.live);
  const upcoming = split(matches.upcoming);
  const results = split(matches.results);
  return {
    primary: { live: live.primary, upcoming: upcoming.primary, results: results.primary },
    secondary: { live: live.secondary, upcoming: upcoming.secondary, results: results.secondary },
  };
}
