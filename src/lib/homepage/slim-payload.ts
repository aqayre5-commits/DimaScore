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
    // Keep the resolved crest URL (includes Task G's parent-club fallback). This used to be nulled
    // on the assumption Flag rebuilds the crest from the team id, but Flag no longer does that (id
    // reconstruction 200s with API-Football's grey placeholder) — so nulling here left every club
    // on the featured hero with no crest → initials. Logo-less teams are already null in the DB.
    logoUrl: team.logoUrl,
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
      // Keep the resolved competition logo (local override or the provider URL) — same reasoning as
      // the team crest above; nulling external URLs dropped unmapped-competition logos.
      logoUrl: fixture.competition.logoUrl,
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
