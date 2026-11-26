/**
 * Real HTTP 308s for competition URLs that are not pages, decided in the middleware so the
 * status is on the wire (a redirect thrown inside a Cache Components page is only a meta refresh).
 *
 *  - `/…/{tournament}/{year}[/round/{slug}]` where `year` is outside the allowed window
 *    (current + last season, see `allowedSeasons`) → the competition's current-season URL.
 *    One rule for every competition, league or cup. No data is deleted.
 *  - `/…/{tournament}/[{year}/]round/{knockout|knockout-round-play-offs|round-of-32}` on the UEFA
 *    league-phase cups → `/round/knockout-play-offs`.
 */
import { locales, type Locale } from '@/lib/i18n/config';
import { resolveCompetitionEntry } from '@/lib/competitions/resolve-competition';
import { getCompetitionFormat } from '@/lib/competitions/formats';
import { PLAYOFFS_ALIAS_SLUGS } from '@/lib/competitions/bracket';
import { KNOCKOUT_PLAYOFFS_SLUG } from '@/lib/competitions/domestic-ties';
import { resolveLeagueSeason } from '@/lib/competitions/league-season';
import { allowedSeasons } from '@/lib/competitions/allowed-seasons';
import { getMetadataForCompetition } from '@/lib/constants/tournament-metadata';

export interface SeasonSnapshot {
  availableSeasons: { year: number; isCurrent: boolean; fixtureCount: number }[];
  currentSeasonYear: number | null;
}

const PATH_RE =
  /^\/(fr|en|ar)\/competition\/([^/]+)\/([^/]+)(?:\/(\d{4}))?(?:\/round\/([^/]+))?\/?$/;

/** Target pathname for a 308, or null when the request is fine (or cannot be judged). */
export async function competitionSeasonRedirect(
  pathname: string,
  loadSeasons: (competitionId: number) => Promise<SeasonSnapshot>,
): Promise<string | null> {
  const match = PATH_RE.exec(pathname);
  if (!match) return null;
  const [, locale, rawCountry, rawTournament, season, rawRound] = match;
  if (!(locales as readonly string[]).includes(locale as Locale)) return null;
  if (!season && !rawRound) return null;

  let tournament: string;
  let round: string | null = null;
  try {
    tournament = decodeURIComponent(rawTournament);
    if (rawRound) round = decodeURIComponent(rawRound);
  } catch {
    return null;
  }
  const entry = resolveCompetitionEntry(tournament);
  if (!entry) return null;
  // Constants-driven tournaments (World Cup, AFCON, WAFCON) resolve editions their own way.
  if (getMetadataForCompetition(entry.competitionId)?.type === 'cup') return null;

  const base = `/${locale}/competition/${rawCountry}/${rawTournament}`;

  if (season) {
    try {
      const snapshot = await loadSeasons(entry.competitionId);
      const allowed = allowedSeasons(entry.competitionId, snapshot.availableSeasons);
      const resolved = resolveLeagueSeason(
        snapshot.availableSeasons,
        snapshot.currentSeasonYear,
        Number(season),
        allowed,
      );
      if (resolved.requestedOutOfWindow) return base;
    } catch {
      // Fail open: a database error must not turn real pages into redirects.
    }
  }

  if (
    round &&
    getCompetitionFormat(entry.competitionId)?.leaguePhase != null &&
    (PLAYOFFS_ALIAS_SLUGS as readonly string[]).includes(round)
  ) {
    return `${base}${season ? `/${season}` : ''}/round/${KNOCKOUT_PLAYOFFS_SLUG}`;
  }
  return null;
}
