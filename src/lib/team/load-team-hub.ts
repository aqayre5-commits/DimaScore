/**
 * Server data for the redesigned team page. One cached snapshot per team + locale; the client
 * component filters it (competition, status, position, metric) without further requests.
 */
import { cacheLife } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import type { LogoStatus } from '@/lib/logos/status';
import { db } from '@/lib/db/client';
import type { Locale } from '@/lib/i18n/config';
import type { FixtureWithTeams, StandingRow } from '@/lib/db/queries';
import {
  getTeamBySlug,
  getTeamSquad,
  getTeamTournamentSquad,
  getTeamAllStandings,
  getTeamPrimaryCompetition,
} from '@/lib/db/queries/team';
import {
  getTeamWindowFixtures,
  getTeamMatchSheets,
  getPlayersById,
  getTeamTransfers,
  getTeamsMap,
  type TeamPageFixture,
} from '@/lib/db/queries/team-page';
import { isFinished } from '@/lib/match-status';
import { competitionDisplayName } from '@/lib/competitions/display-name';
import { arabicCompetitionName, teamLabel } from '@/lib/i18n/localized-names';
import { buildCompetitionHubHref } from '@/lib/competitions/paths';
import { localizeRound } from '@/lib/i18n/feed-labels';
import { formatSeason } from '@/lib/utils/date';
import {
  buildTallies,
  currentSeasonOf,
  scorerLines,
  squadPosition,
  type PlayerTally,
  type SquadPosition,
} from './page-model';
import { getBareSlugCollisions } from './resolve-hub-team';
import { publicTeamSlug } from './public-slug';

export interface HubTeam {
  id: number;
  slug: string;
  name: string;
  logoUrl: string | null;
  logoStatus: LogoStatus | null;
  code: string | null;
  countryCode: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  isNational: boolean;
  isWomen: boolean;
}

export interface HubFixture extends FixtureWithTeams {
  competitionId: number | null;
  competitionName: string;
  roundLabel: string | null;
}

export interface HubSquadPlayer {
  id: number;
  slug: string;
  name: string;
  number: number | null;
  position: SquadPosition | null;
  nationality: string | null;
  club: { name: string; slug: string; logoUrl: string | null; code: string | null } | null;
}

export interface HubProgressRow {
  competitionId: number;
  name: string;
  value: string;
}

export interface HubMove {
  key: string;
  player: { name: string; slug: string | null };
  other: string;
  type: string | null;
}

export interface TeamHubData {
  team: HubTeam;
  subtitle: string;
  seasonLabel: string;
  seasonYear: number;
  asOf: string;
  fixtures: HubFixture[];
  competitions: { id: number; name: string; href: string | null }[];
  standings: { competitionName: string; href: string | null; rows: StandingRow[] } | null;
  squad: HubSquadPlayer[];
  squadCaption: string | null;
  tallies: PlayerTally[];
  playerSlugs: Record<string, string>;
  latestScorers: { home: string[]; away: string[] } | null;
  progress: HubProgressRow[];
  details: {
    coach: string | null;
    captain: { name: string; slug: string } | null;
    venue: string | null;
    founded: number | null;
  };
  transfers: { in: HubMove[]; out: HubMove[] } | null;
  primaryCompetitionId: number | null;
  /** URL slug: bare name, or the stored id-slug when that name collides. */
  publicSlug: string;
  /** Which tabs have content. Empty tabs get no link and no URL (404). */
  populated: { matches: boolean; squad: boolean; stats: boolean; transfers: boolean };
  /**
   * Scope of the squad Apps counts and the Stats tab: the seasons covered, the matches in scope,
   * which of them have a match sheet (lineup), and the date of the latest covered one.
   */
  stats: {
    seasonLabel: string;
    fixtureIds: number[];
    coveredIds: number[];
    through: string | null;
  };
}

const nameOfRecord = (n: Record<string, string> | null | undefined, locale: Locale) =>
  (n && (n[locale] || n.en || Object.values(n)[0])) || '';

function ordinal(n: number, locale: Locale): string {
  if (locale === 'fr') return n === 1 ? '1er' : `${n}e`;
  if (locale === 'ar') return String(n);
  const s = new Intl.PluralRules('en', { type: 'ordinal' }).select(n);
  return `${n}${s === 'one' ? 'st' : s === 'two' ? 'nd' : s === 'few' ? 'rd' : 'th'}`;
}

function regionName(code: string | null, locale: Locale): string | null {
  if (!code) return null;
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

function teamTotals(f: TeamPageFixture, teamId: number) {
  const home = f.homeTeamId === teamId;
  const gf = home ? f.homeScore : f.awayScore;
  const ga = home ? f.awayScore : f.homeScore;
  return { gf: gf ?? 0, ga: ga ?? 0 };
}

/** Uncached load, used by middleware (Cache Components `use cache` cannot run there). */
export async function loadTeamHubFresh(
  teamSlug: string,
  locale: Locale,
): Promise<TeamHubData | null> {
  const [team, t] = await Promise.all([
    getTeamBySlug(db, teamSlug),
    getTranslations({ locale, namespace: 'teamHub' }),
  ]);
  const msg = {
    nationalTeam: t('nationalTeam'),
    womenNationalTeam: t('womenNationalTeam'),
    leaguePlace: (place: string, points: number) => t('leaguePlace', { place, points }),
    winsFrom: (round: string, wins: number, played: number) =>
      t('winsFrom', { round, wins, played }),
  };
  if (!team) return null;
  const now = Date.now();
  const thisYear = new Date(now).getUTCFullYear();
  const window = await getTeamWindowFixtures(db, team.id, thisYear - 2);
  const season = currentSeasonOf(window.fixtures, now) ?? thisYear;
  const fixtures = window.fixtures.filter((f) => f.seasonYear >= season - 1);
  const finished = fixtures.filter((f) => isFinished(f.statusCode, new Date(f.kickoffAt)));
  const national = !!team.isNational;
  // Clubs: current-season tallies; national teams play few games, so both seasons count.
  const tallyScope = finished.filter((f) => national || f.seasonYear === season);
  const latest = finished.at(-1) ?? null;
  const sheetIds = [...new Set([...tallyScope.map((f) => f.id), ...(latest ? [latest.id] : [])])];

  const [sheets, squadRows, tournamentSquad, allStandings, primaryComp, transferRows] =
    await Promise.all([
      getTeamMatchSheets(db, team.id, sheetIds),
      getTeamSquad(db, team.id),
      national ? getTeamTournamentSquad(db, team.id) : Promise.resolve(null),
      getTeamAllStandings(db, team.id),
      national ? Promise.resolve(null) : getTeamPrimaryCompetition(db, team.id),
      national ? Promise.resolve([]) : getTeamTransfers(db, team.id, `${season}-06-01`),
    ]);

  const squadSource = tournamentSquad?.players.length ? tournamentSquad.players : squadRows;
  const playerIds = new Set<number>();
  for (const e of sheets.events) {
    if (e.playerId != null) playerIds.add(e.playerId);
    if (e.assistPlayerId != null) playerIds.add(e.assistPlayerId);
  }
  for (const c of sheets.captains) playerIds.add(c.playerId);
  for (const m of transferRows) if (m.playerId != null) playerIds.add(m.playerId);
  if (national) for (const p of squadSource) playerIds.add(p.id);
  const players = await getPlayersById(db, [...playerIds]);
  const clubIds = new Set<number>();
  if (national)
    for (const p of squadSource) {
      const c = players.get(p.id)?.currentTeamId;
      if (c != null && c !== team.id) clubIds.add(c);
    }
  for (const m of transferRows) if (m.otherTeamId != null) clubIds.add(m.otherTeamId);
  const clubs = await getTeamsMap(db, [...clubIds]);
  const playerName = (id: number) => {
    const p = players.get(id);
    return p ? nameOfRecord(p.name, locale) || null : null;
  };

  const compName = (c: TeamPageFixture['competition'] | undefined) =>
    c ? (arabicCompetitionName(c, locale) ?? competitionDisplayName(c.name, locale)) : '';
  const hubFixtures: HubFixture[] = fixtures.map(({ competition, seasonYear: _s, ...f }) => ({
    ...f,
    competitionName: compName(competition),
    roundLabel: f.round ? localizeRound(f.round, locale) : null,
  }));

  // Competitions, league first, then by number of matches.
  const counts = new Map<number, number>();
  for (const f of fixtures)
    if (f.competitionId != null)
      counts.set(f.competitionId, (counts.get(f.competitionId) ?? 0) + 1);
  const competitions = window.competitions
    .filter((c) => counts.has(c.id))
    .sort(
      (a, b) =>
        Number(b.type === 'League' && !national) - Number(a.type === 'League' && !national) ||
        (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0),
    )
    .map((c) => ({ id: c.id, name: compName(c), href: buildCompetitionHubHref(c.id, locale) }));

  // Standings: the club's league; for a national team the latest group it played in.
  let standings: TeamHubData['standings'] = null;
  const pickRows = (rows: StandingRow[]) => {
    const group = rows.find((r) => r.teamId === team.id)?.groupLabel;
    return group == null ? rows : rows.filter((r) => r.groupLabel === group);
  };
  const keyFor = (compId: number) => {
    const seasons = allStandings.seasons.filter(
      (s) => allStandings.standingsByCompSeason[`${compId}-${s}`]?.length,
    );
    return seasons.length ? `${compId}-${Math.max(...seasons)}` : null;
  };
  const standingComp = primaryComp
    ? allStandings.competitions.find((c) => c.id === primaryComp.id)
    : allStandings.competitions
        .filter((c) => keyFor(c.id))
        .sort(
          (a, b) =>
            Number(keyFor(b.id)!.split('-').at(-1)) - Number(keyFor(a.id)!.split('-').at(-1)),
        )[0];
  if (standingComp) {
    const key = keyFor(standingComp.id);
    const rows = key ? pickRows(allStandings.standingsByCompSeason[key] ?? []) : [];
    if (rows.length)
      standings = {
        competitionName: compName({ ...standingComp }),
        href: buildCompetitionHubHref(standingComp.id, locale),
        rows,
      };
  }

  // Season competitions (club): league place, league-phase record, or the latest round reached.
  const progress: HubProgressRow[] = [];
  if (!national) {
    for (const c of competitions) {
      const inSeason = fixtures.filter((f) => f.competitionId === c.id && f.seasonYear === season);
      if (!inSeason.length) continue;
      const mine =
        standings && standingComp?.id === c.id
          ? standings.rows.find((r) => r.teamId === team.id)
          : null;
      let value: string;
      if (mine) value = msg.leaguePlace(ordinal(mine.rank, locale), mine.points);
      else {
        const last =
          [...inSeason].reverse().find((f) => isFinished(f.statusCode, new Date(f.kickoffAt))) ??
          inSeason[0];
        const round = last.round ?? '';
        if (/league[ -](stage|phase)/i.test(round)) {
          const played = inSeason.filter(
            (f) =>
              /league[ -](stage|phase)/i.test(f.round ?? '') &&
              isFinished(f.statusCode, new Date(f.kickoffAt)),
          );
          const wins = played.filter((f) => {
            const t = teamTotals(f, team.id);
            return t.gf > t.ga;
          }).length;
          value = msg.winsFrom(
            localizeRound(round.replace(/\s*-\s*\d+$/, ''), locale),
            wins,
            played.length,
          );
        } else value = localizeRound(round, locale) || '';
      }
      progress.push({ competitionId: c.id, name: c.name, value });
    }
  }

  const tallies = buildTallies(
    team.id,
    tallyScope.map((f) => ({ id: f.id, competitionId: f.competitionId })),
    sheets.events,
    sheets.lineups,
    playerName,
  );
  const playerSlugs: Record<string, string> = {};
  for (const [id, p] of players) playerSlugs[String(id)] = p.slug;

  const latestScorers = latest
    ? {
        home: scorerLines(
          sheets.events,
          latest.id,
          latest.homeTeamId,
          latest.awayTeamId,
          playerName,
        ),
        away: scorerLines(
          sheets.events,
          latest.id,
          latest.awayTeamId,
          latest.homeTeamId,
          playerName,
        ),
      }
    : null;

  const squad: HubSquadPlayer[] = squadSource.map((p) => {
    const clubId = players.get(p.id)?.currentTeamId;
    const club = national && clubId != null ? clubs.get(clubId) : null;
    return {
      id: p.id,
      slug: p.slug,
      name: nameOfRecord(p.name, locale),
      number: p.shirtNumber,
      position: squadPosition(p.position),
      nationality: regionName(p.nationalityCode, locale),
      club: club
        ? {
            name: teamLabel(club, locale),
            slug: club.slug,
            logoUrl: club.logoUrl,
            code: club.code ?? null,
          }
        : null,
    };
  });

  const captainRow = [...sheets.captains].sort((a, b) => b.fixtureId - a.fixtureId)[0];
  const captainRef = captainRow ? players.get(captainRow.playerId) : null;

  const moves = (dir: 'in' | 'out'): HubMove[] =>
    transferRows
      .filter((m) => m.direction === dir && m.playerId != null && players.has(m.playerId))
      .map((m, i) => {
        const p = players.get(m.playerId!)!;
        const other = m.otherTeamId != null ? clubs.get(m.otherTeamId) : null;
        return {
          key: `${dir}-${m.playerId}-${i}`,
          player: { name: nameOfRecord(p.name, locale), slug: p.slug },
          other: other ? teamLabel(other, locale) : '',
          type: m.type,
        };
      });

  const lineupIds = new Set(
    sheets.lineups.filter((l) => l.starters.length > 0).map((l) => l.fixtureId),
  );
  const coveredScope = tallyScope.filter((f) => lineupIds.has(f.id));
  const statsScope: TeamHubData['stats'] = {
    // A national team's window is two seasons; a club's is the current season.
    seasonLabel: national ? `${season - 1}\u2013${season}` : formatSeason(season),
    fixtureIds: tallyScope.map((f) => f.id),
    coveredIds: coveredScope.map((f) => f.id),
    through: coveredScope.length
      ? new Date(coveredScope[coveredScope.length - 1].kickoffAt).toISOString()
      : null,
  };
  const transferOut = national ? null : { in: moves('in'), out: moves('out') };

  const hubTeam: HubTeam = {
    id: team.id,
    slug: team.slug,
    name: teamLabel(team, locale),
    logoUrl: team.logoUrl,
    logoStatus: team.logoStatus as HubTeam['logoStatus'],
    code: team.code,
    countryCode: team.countryCode,
    primaryColor: team.primaryColor,
    secondaryColor: team.secondaryColor,
    isNational: national,
    isWomen: !!team.isWomen,
  };
  const leagueName = primaryComp
    ? (arabicCompetitionName(primaryComp, locale) ??
      competitionDisplayName(primaryComp.name, locale))
    : (competitions[0]?.name ?? '');
  const subtitle = national
    ? team.isWomen
      ? msg.womenNationalTeam
      : msg.nationalTeam
    : [leagueName, team.venue?.city].filter(Boolean).join(' · ');

  return {
    team: hubTeam,
    subtitle,
    seasonLabel: national ? String(season) : formatSeason(season),
    seasonYear: season,
    asOf: (latest ? new Date(latest.kickoffAt) : new Date(now)).toISOString(),
    fixtures: hubFixtures,
    competitions,
    standings,
    squad,
    squadCaption: tournamentSquad?.players.length
      ? `${nameOfRecord(tournamentSquad.competitionName, locale)} ${tournamentSquad.seasonYear}`
      : null,
    tallies,
    playerSlugs,
    latestScorers,
    progress,
    details: {
      coach: team.coach?.name ?? null,
      captain: captainRef
        ? { name: nameOfRecord(captainRef.name, locale), slug: captainRef.slug }
        : null,
      venue: team.venue?.name ?? null,
      founded: team.founded,
    },
    transfers: transferOut,
    primaryCompetitionId: primaryComp?.id ?? null,
    publicSlug: publicTeamSlug(team.slug, national, await getBareSlugCollisions()),
    populated: {
      matches: hubFixtures.length > 0,
      squad: squad.length > 0,
      stats: tallies.length > 0,
      transfers: !!transferOut && transferOut.in.length + transferOut.out.length > 0,
    },
    stats: statsScope,
  };
}

export async function loadTeamHub(teamSlug: string, locale: Locale): Promise<TeamHubData | null> {
  'use cache';
  cacheLife('minutes');
  return loadTeamHubFresh(teamSlug, locale);
}

export function tabHasContent(data: TeamHubData, tab: import('./hub-paths').HubTab): boolean {
  if (tab === 'overview') return true;
  if (tab === 'transfers') return data.populated.transfers && !data.team.isNational;
  return data.populated[tab];
}
