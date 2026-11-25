'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useFollows } from '@/hooks/useFollows';
import { useLiveFixtures } from '@/hooks/useLiveFixtures';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { getMatchState, isLive } from '@/lib/match-status';
import { matchHref } from '@/lib/seo/match-slug';
import { MatchLink } from '@/components/shared/MatchLink';
import { previewFromFixtureRow } from '@/lib/match-header-preview';
import { LocalTime } from '@/components/shared/LocalTime';
import { formatSeason, formatDateLabel, toSiteDateKey, SITE_TZ } from '@/lib/utils/date';
import type { FixtureWithTeams, StandingRow } from '@/lib/db/queries';
import type { TopPlayerRow, TopCardRow } from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';
import { translateStandingZoneLabel } from '@/lib/standings/zone-labels';
import { dedupeStandingsByTeam } from '@/lib/standings/dedupe';
import {
  asDate,
  standingsForSplit,
  liveScoreLabel,
  uniqueGroups,
  type TableSplit,
  type MatchweekOption,
} from '@/lib/competitions/template-model';

function Chevron() {
  return (
    <svg className="ic" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 3.6l2.1 5.3 5.6.4-4.3 3.6 1.3 5.4L12 15.7 7.3 18.3l1.3-5.4-4.3-3.6 5.6-.4z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Crest({
  src,
  sizeVar,
  invert,
}: {
  src: string | null | undefined;
  sizeVar?: string;
  invert?: boolean;
}) {
  const style = sizeVar ? ({ ['--m' as string]: sizeVar } as React.CSSProperties) : undefined;
  if (!src) return <span className="mark fallback" aria-hidden="true" style={style} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={`mark${invert ? ' logo-invert' : ''}`} src={src} alt="" style={style} />
  );
}

export function PeriodSelect({
  value,
  onChange,
  labelledBy,
  children,
  display,
}: {
  value: string;
  onChange: (value: string) => void;
  labelledBy?: string;
  display: string;
  children: ReactNode;
}) {
  return (
    <label className="ds-period">
      <bdi>{display}</bdi>
      <svg viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2.5 4.5L6 8l3.5-3.5" />
      </svg>
      <select
        aria-labelledby={labelledBy}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

export function CompetitionIdentity({
  competitionId,
  name,
  logoSrc,
  invertLogo,
  countryName,
  countryFlag,
  seasonYear,
  availableSeasons,
  currentSeasonYear,
  locale,
  basePath,
}: {
  competitionId: number;
  name: string;
  logoSrc: string | null;
  invertLogo: boolean;
  countryName: string | null;
  countryFlag: string | null;
  seasonYear: number;
  availableSeasons: { year: number; isCurrent: boolean }[];
  currentSeasonYear?: number | null;
  locale: Locale;
  basePath: string;
}) {
  const t = useTranslations('leaguePage');
  const router = useRouter();
  const { followedComps, toggleComp } = useFollows();
  const pinned = followedComps.has(competitionId);
  const sorted = [...availableSeasons].sort((a, b) => b.year - a.year);
  const shown = (() => {
    const top = sorted.slice(0, 8);
    if (top.some((s) => s.year === seasonYear)) return top;
    const active = sorted.find((s) => s.year === seasonYear);
    return active ? [...top, active].sort((a, b) => b.year - a.year) : top;
  })();
  const currentYear = currentSeasonYear ?? shown.find((s) => s.isCurrent)?.year;

  function goToSeason(year: number) {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const dest = currentYear != null && year === currentYear ? basePath : `${basePath}/${year}`;
    router.push(`${dest}${hash}`);
  }

  return (
    <div className="pl-identity">
      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={`mark${invertLogo ? ' logo-invert' : ''}`}
          src={logoSrc}
          alt=""
          width={128}
          height={128}
        />
      ) : (
        <span className="mark fallback" aria-hidden="true" />
      )}
      <div>
        <h1>{name}</h1>
        {countryName && (
          <p className="byline">
            {countryFlag ? <span className="flag">{countryFlag}</span> : null}
            {countryName}
          </p>
        )}
      </div>
      {shown.length > 0 && (
        <details className="edition-menu">
          <summary>
            <bdi>{formatSeason(seasonYear)}</bdi>
            <Chevron />
          </summary>
          <div className="edition-options">
            <strong>{t('seasonLabel')}</strong>
            {shown.map((s) => (
              <button
                key={s.year}
                type="button"
                aria-pressed={s.year === seasonYear}
                onClick={(e) => {
                  goToSeason(s.year);
                  const details = (e.currentTarget.closest('details') as HTMLDetailsElement | null);
                  if (details) details.open = false;
                }}
              >
                <bdi>{formatSeason(s.year)}</bdi>
              </button>
            ))}
          </div>
        </details>
      )}
      <button
        type="button"
        className="pl-pin"
        aria-pressed={pinned}
        aria-label={pinned ? t('unpinCompetition', { name }) : t('pinCompetition', { name })}
        onClick={() => toggleComp(competitionId)}
      >
        <StarIcon />
      </button>
    </div>
  );
}

export function UpcomingCard({ fixture, locale }: { fixture: FixtureWithTeams; locale: Locale }) {
  const day = formatDateLabel(fixtureDaySafe(fixture), locale, todayWord(locale));
  const href = matchHref(locale, {
    id: fixture.id,
    homeSlug: fixture.homeTeam?.slug,
    awaySlug: fixture.awayTeam?.slug,
  });
  const preview = previewFromFixtureRow({
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    homeScore: fixture.homeScore,
    awayScore: fixture.awayScore,
    statusCode: fixture.statusCode,
    kickoffAt: asDate(fixture.kickoffAt),
  });
  return (
    <MatchLink matchId={String(fixture.id)} href={href} preview={preview} prefetchIntent className="sooncard">
      <div className="cardtop">{day}</div>
      <div className="upcoming-match">
        <div className="pair">
          <div className="teamline">
            <Crest src={fixture.homeTeam?.logoUrl} />
            <bdi>{teamName(fixture.homeTeam, locale)}</bdi>
          </div>
          <div className="teamline">
            <Crest src={fixture.awayTeam?.logoUrl} />
            <bdi>{teamName(fixture.awayTeam, locale)}</bdi>
          </div>
        </div>
        <div className="when">
          {isLive(fixture.statusCode) ? (
            liveClock(fixture, locale)
          ) : getMatchState(fixture.statusCode, asDate(fixture.kickoffAt)) === 'finished' ? (
            `${fixture.homeScore ?? 0}–${fixture.awayScore ?? 0}`
          ) : (
            <LocalTime date={asDate(fixture.kickoffAt)} locale={locale} format="time" />
          )}
        </div>
      </div>
    </MatchLink>
  );
}

function fixtureDaySafe(f: FixtureWithTeams): string {
  return toSiteDateKey(asDate(f.kickoffAt), SITE_TZ);
}

function todayWord(locale: Locale): string {
  return locale === 'fr' ? "Aujourd'hui" : locale === 'ar' ? 'اليوم' : 'Today';
}

function teamName(
  team: FixtureWithTeams['homeTeam'],
  locale: Locale,
): string {
  return team ? getTeamDisplayName(team, locale) : '—';
}

function liveClock(fixture: FixtureWithTeams, locale: Locale): string {
  if (fixture.statusCode === 'HT') {
    return locale === 'fr' ? 'MT' : locale === 'ar' ? 'استراحة' : 'HT';
  }
  return 'LIVE';
}

export function FeaturedMatch({
  fixture,
  locale,
  competitionName,
  roundLabel,
}: {
  fixture: FixtureWithTeams;
  locale: Locale;
  competitionName: string;
  roundLabel?: string | null;
}) {
  const t = useTranslations('matchDetail');
  const href = matchHref(locale, {
    id: fixture.id,
    homeSlug: fixture.homeTeam?.slug,
    awaySlug: fixture.awayTeam?.slug,
  });
  const preview = previewFromFixtureRow({
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    homeScore: fixture.homeScore,
    awayScore: fixture.awayScore,
    statusCode: fixture.statusCode,
    kickoffAt: asDate(fixture.kickoffAt),
  });
  const state = getMatchState(fixture.statusCode, asDate(fixture.kickoffAt));
  const hasScore = fixture.homeScore != null && fixture.awayScore != null;
  const phase =
    state === 'live'
      ? fixture.statusCode === 'HT'
        ? t('halfTime')
        : t('live') || 'LIVE'
      : state === 'finished'
        ? t('fullTime')
        : null;

  return (
    <MatchLink
      matchId={String(fixture.id)}
      href={href}
      preview={preview}
      prefetchIntent
      className="pl-board"
      ariaLabel={`${teamName(fixture.homeTeam, locale)} vs ${teamName(fixture.awayTeam, locale)}`}
    >
      <div className="herocore">
        <div className="heroteam">
          <Crest src={fixture.homeTeam?.logoUrl} sizeVar="clamp(56px, 6vw, 88px)" />
          <strong>
            <bdi>{teamName(fixture.homeTeam, locale)}</bdi>
          </strong>
        </div>
        <div className="pl-score">
          {phase ? <span className={`pl-phase${state === 'live' ? ' playing' : ''}`}>{phase}</span> : null}
          <span className="bigscore">
            {hasScore ? `${fixture.homeScore}–${fixture.awayScore}` : <LocalTime date={asDate(fixture.kickoffAt)} locale={locale} format="time" />}
          </span>
        </div>
        <div className="heroteam">
          <Crest src={fixture.awayTeam?.logoUrl} sizeVar="clamp(56px, 6vw, 88px)" />
          <strong>
            <bdi>{teamName(fixture.awayTeam, locale)}</bdi>
          </strong>
        </div>
      </div>
      <div className="herobottom">
        {competitionName}
        {roundLabel ? ` · ${roundLabel}` : ''}
      </div>
    </MatchLink>
  );
}

export function CompetitionMatchRow({ fixture, locale }: { fixture: FixtureWithTeams; locale: Locale }) {
  const t = useTranslations('matchDetail');
  const tL = useTranslations('leaguePage');
  const { followedMatches, toggleMatch } = useFollows();
  const href = matchHref(locale, {
    id: fixture.id,
    homeSlug: fixture.homeTeam?.slug,
    awaySlug: fixture.awayTeam?.slug,
  });
  const preview = previewFromFixtureRow({
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    homeScore: fixture.homeScore,
    awayScore: fixture.awayScore,
    statusCode: fixture.statusCode,
    kickoffAt: asDate(fixture.kickoffAt),
  });
  const state = getMatchState(fixture.statusCode, asDate(fixture.kickoffAt));
  const isFinished = state === 'finished';
  const live = state === 'live';
  const hasScore = fixture.homeScore != null && fixture.awayScore != null;
  const homeWon = isFinished && hasScore && (fixture.homeScore ?? 0) > (fixture.awayScore ?? 0);
  const awayWon = isFinished && hasScore && (fixture.awayScore ?? 0) > (fixture.homeScore ?? 0);
  const saved = followedMatches.has(fixture.id);
  const names = `${teamName(fixture.homeTeam, locale)} vs ${teamName(fixture.awayTeam, locale)}`;

  let clock: ReactNode;
  if (live) {
    clock = fixture.statusCode === 'HT' ? t('halfTime') : t('live') || 'LIVE';
  } else if (state === 'interrupted') {
    clock = t('fullTime');
  } else if (isFinished) {
    clock = t('fullTime');
  } else {
    clock = <LocalTime date={asDate(fixture.kickoffAt)} locale={locale} format="time" />;
  }

  return (
    <div className="matchrow">
      <MatchLink
        matchId={String(fixture.id)}
        href={href}
        preview={preview}
        prefetchIntent
        className="matchtap"
        ariaLabel={names}
      >
        <div className={`clock${live ? ' is-live' : ''}`}>{clock}</div>
        <div className="duo">
          <div className={`teamline${awayWon ? ' is-loser' : ''}`}>
            <Crest src={fixture.homeTeam?.logoUrl} />
            <span className="teamname">
              <bdi>{teamName(fixture.homeTeam, locale)}</bdi>
            </span>
            {hasScore ? <span className="points">{fixture.homeScore}</span> : <span className="points" />}
          </div>
          <div className={`teamline${homeWon ? ' is-loser' : ''}`}>
            <Crest src={fixture.awayTeam?.logoUrl} />
            <span className="teamname">
              <bdi>{teamName(fixture.awayTeam, locale)}</bdi>
            </span>
            {hasScore ? <span className="points">{fixture.awayScore}</span> : <span className="points" />}
          </div>
        </div>
      </MatchLink>
      <div className="savebox">
        <button
          type="button"
          className="save"
          aria-pressed={saved}
          aria-label={saved ? tL('unstarFixture', { match: names }) : tL('starFixture', { match: names })}
          onClick={() => toggleMatch(fixture.id)}
        >
          <StarIcon />
        </button>
      </div>
    </div>
  );
}

export function UpcomingRail({
  fixtures,
  locale,
  heading,
}: {
  fixtures: FixtureWithTeams[];
  locale: Locale;
  heading: string;
}) {
  if (fixtures.length === 0) return null;
  return (
    <section className="pl-coming">
      <h2>{heading}</h2>
      <div className="upgrid">
        {fixtures.map((f) => (
          <UpcomingCard key={f.id} fixture={f} locale={locale} />
        ))}
      </div>
    </section>
  );
}

export function StandingsTable({
  standings,
  fixtures,
  locale,
  split,
  caption,
}: {
  standings: StandingRow[];
  fixtures: FixtureWithTeams[];
  locale: Locale;
  split: TableSplit;
  caption?: string;
}) {
  const t = useTranslations('leaguePage');
  const groups = uniqueGroups(standings);
  const [group, setGroup] = useState(groups[0] ?? '');
  const source = useMemo(() => {
    const base = groups.length > 1 ? standings.filter((r) => r.groupLabel === group) : standings;
    return dedupeStandingsByTeam(base);
  }, [standings, group, groups.length]);
  const { rows, liveTeamIds } = useMemo(
    () => standingsForSplit(source, fixtures, split),
    [source, fixtures, split],
  );

  const legend = useMemo(() => {
    const seen = new Set<string>();
    const items: { color: string; label: string }[] = [];
    for (const row of rows) {
      if (!row.description || seen.has(row.description)) continue;
      const color = zoneColor(row.description);
      if (!color) continue;
      seen.add(row.description);
      items.push({
        color,
        label: translateStandingZoneLabel(row.description, locale) ?? row.description,
      });
    }
    return items;
  }, [rows, locale]);

  return (
    <>
      {groups.length > 1 && (
        <div className="ds-period-row">
          <PeriodSelect value={group} onChange={setGroup} display={group}>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </PeriodSelect>
        </div>
      )}
      <table className="stand-table">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr>
            <th scope="col">{t('colRankFull')}</th>
            <th scope="col">{t('team')}</th>
            <th scope="col">{t('colPlayed')}</th>
            <th scope="col">{t('colGoalDiff')}</th>
            <th scope="col">{t('colPoints')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const live =
              row.teamId != null && liveTeamIds.has(row.teamId)
                ? liveScoreLabel(row.teamId, fixtures)
                : null;
            const href = row.team?.slug ? `/${locale}/equipe/${row.team.slug}` : undefined;
            const color = zoneColor(row.description);
            return (
              <tr key={`${row.groupLabel}-${row.teamId}`}>
                <td>
                  {color ? (
                    <i className="zone" style={{ background: color, display: 'inline-block', width: 6, height: 12, marginInlineEnd: 4, borderRadius: 1 }} />
                  ) : null}
                  {row.rank}
                </td>
                <td>
                  {href ? (
                    <a className="standing-team" href={href}>
                      <Crest src={row.team?.logoUrl} />
                      <bdi>{row.team ? getTeamDisplayName(row.team, locale) : '—'}</bdi>
                      {live ? <span className="standing-live">{live}</span> : null}
                    </a>
                  ) : (
                    <span className="standing-team">
                      <Crest src={row.team?.logoUrl} />
                      <bdi>{row.team ? getTeamDisplayName(row.team, locale) : '—'}</bdi>
                      {live ? <span className="standing-live">{live}</span> : null}
                    </span>
                  )}
                </td>
                <td>{row.played}</td>
                <td>{row.goalDiff ?? 0}</td>
                <td>{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {legend.length > 0 && (
        <div className="pl-legend">
          {legend.map((item) => (
            <span key={item.label}>
              <i style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function zoneColor(description: string | null): string | null {
  if (!description) return null;
  const d = description.toLowerCase();
  if (d.includes('champions league') || d.includes('promotion')) return '#0b7a4b';
  if (d.includes('europa')) return '#b86200';
  if (d.includes('conference') || d.includes('confederation')) return '#3a56d4';
  if (d.includes('relegation')) return '#cf2a3c';
  return null;
}

export function PlayerRanking({
  title,
  players,
  locale,
  cutoff,
}: {
  title: string;
  players: { id: number; slug: string; name: string; team: string; teamLogo: string | null; value: number }[];
  locale: Locale;
  cutoff?: string | null;
}) {
  const t = useTranslations('leaguePage');
  const [open, setOpen] = useState(false);
  if (players.length === 0) return null;
  // Preserve ties: same value shares the previous rank.
  let lastValue: number | null = null;
  let lastRank = 0;
  const ranked = players.map((p, i) => {
    if (lastValue == null || p.value !== lastValue) {
      lastRank = i + 1;
      lastValue = p.value;
    }
    return { ...p, rank: lastRank };
  });
  const canToggle = ranked.length > 20;
  return (
    <section className="player-ranking" data-open={open ? 'true' : 'false'}>
      <div className="pl-head">
        <h2>{title}</h2>
      </div>
      {cutoff ? <p className="pl-stats-date">{cutoff}</p> : null}
      <table className="pl-ranking">
        <thead>
          <tr>
            <th scope="col">{t('colRankFull')}</th>
            <th scope="col">{t('colPlayer')}</th>
            <th scope="col">{t('colTeam')}</th>
            <th scope="col">{title}</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((p, i) => (
            <tr key={`${p.id}-${p.team}-${i}`}>
              <td>{p.rank}</td>
              <td>
                <a href={`/${locale}/joueur/${p.slug}`}>
                  <bdi>{p.name}</bdi>
                </a>
              </td>
              <td>
                <span className="standing-team">
                  <Crest src={p.teamLogo} />
                  <bdi>{p.team}</bdi>
                </span>
              </td>
              <td>{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {canToggle && (
        <button type="button" onClick={() => setOpen((v) => !v)}>
          {open ? t('showFewer') : t('viewMore')}
          <Chevron />
        </button>
      )}
    </section>
  );
}

export function ClubDetails({
  teams,
  intro,
  locale,
}: {
  teams: { id: number; slug: string; name: string; logoUrl: string | null }[];
  intro: string | null;
  locale: Locale;
}) {
  const t = useTranslations('leaguePage');
  if (teams.length === 0 && !intro) return null;
  return (
    <section className="pl-details">
      <details>
        <summary>
          {t('teamsCount')}
          <Chevron />
        </summary>
        {intro ? <p>{intro}</p> : null}
        <ul>
          {teams.map((team) => (
            <li key={team.id}>
              <Crest src={team.logoUrl} />
              <a href={`/${locale}/equipe/${team.slug}`}>
                <bdi>{team.name}</bdi>
              </a>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

export function mapScorers(rows: TopPlayerRow[]): { id: number; slug: string; name: string; team: string; teamLogo: string | null; value: number }[] {
  return rows.map((p) => ({
    id: p.playerId,
    slug: p.playerSlug,
    name: p.playerName,
    team: p.teamName,
    teamLogo: p.teamLogo,
    value: p.goals,
  }));
}

export function mapAssists(rows: TopPlayerRow[]) {
  return rows.map((p) => ({
    id: p.playerId,
    slug: p.playerSlug,
    name: p.playerName,
    team: p.teamName,
    teamLogo: p.teamLogo,
    value: p.assists,
  }));
}

export function mapCards(rows: TopCardRow[], kind: 'yellow' | 'red') {
  return [...rows]
    .filter((p) => (kind === 'yellow' ? p.yellowCards : p.redCards) > 0)
    .sort((a, b) => (kind === 'yellow' ? b.yellowCards - a.yellowCards : b.redCards - a.redCards))
    .map((p) => ({
      id: p.playerId,
      slug: p.playerSlug,
      name: p.playerName,
      team: p.teamName,
      teamLogo: p.teamLogo,
      value: kind === 'yellow' ? p.yellowCards : p.redCards,
    }));
}

export function usePatchedFixtures(fixtures: FixtureWithTeams[]): FixtureWithTeams[] {
  const livePatches = useLiveFixtures();
  return useMemo(() => {
    if (livePatches.size === 0) return fixtures;
    return fixtures.map((f) => {
      const p = livePatches.get(f.id);
      if (!p) return f;
      return {
        ...f,
        statusCode: p.statusCode ?? f.statusCode,
        homeScore: p.homeScore ?? f.homeScore,
        awayScore: p.awayScore ?? f.awayScore,
      };
    });
  }, [fixtures, livePatches]);
}

export type { MatchweekOption };
