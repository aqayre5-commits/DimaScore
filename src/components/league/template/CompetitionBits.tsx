'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { TeamMark } from '@/components/shared/TeamMark';
import type { LogoStatus } from '@/lib/logos/status';
import { useFollows } from '@/hooks/useFollows';
import { useLiveFixtures } from '@/hooks/useLiveFixtures';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { getMatchState, isLive } from '@/lib/match-status';
import { matchHref } from '@/lib/seo/match-slug';
import { MatchLink } from '@/components/shared/MatchLink';
import { IntentLink } from '@/components/shared/IntentLink';
import { previewFromFixtureRow } from '@/lib/match-header-preview';
import { LocalTime } from '@/components/shared/LocalTime';
import { SINGLE_YEAR_EDITION_IDS, editionYearLabel } from '@/lib/competitions/group-stage';
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
  status,
  sizeVar,
  invert,
  name,
  shortName,
  code,
  primary,
  secondary,
  isNational,
  countryCode,
  variant = 'team',
}: {
  src: string | null | undefined;
  status?: LogoStatus | null;
  sizeVar?: string;
  invert?: boolean;
  name?: string | Record<string, string> | null;
  shortName?: string | Record<string, string> | null;
  code?: string | null;
  primary?: string | null;
  secondary?: string | null;
  isNational?: boolean | null;
  countryCode?: string | null;
  variant?: 'team' | 'competition';
}) {
  return (
    <TeamMark
      className={`mark${invert ? ' logo-invert' : ''}`}
      src={src}
      status={status}
      sizeVar={sizeVar}
      invert={invert}
      name={name}
      shortName={shortName}
      code={code}
      primary={primary}
      secondary={secondary}
      isNational={isNational}
      countryCode={countryCode}
      variant={variant}
    />
  );
}

function formatSigned(n: number): string {
  if (n === 0) return '0';
  return `${n > 0 ? '+' : '\u2212'}${Math.abs(n)}`;
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
      <select aria-labelledby={labelledBy} value={value} onChange={(e) => onChange(e.target.value)}>
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
  const editionLabel = (y: number) =>
    SINGLE_YEAR_EDITION_IDS.has(competitionId)
      ? editionYearLabel(competitionId, y)
      : formatSeason(y);
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
      <Crest src={logoSrc} invert={invertLogo} name={name} variant="competition" />
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
            <bdi>{editionLabel(seasonYear)}</bdi>
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
                  const details = e.currentTarget.closest('details') as HTMLDetailsElement | null;
                  if (details) details.open = false;
                }}
              >
                <bdi>{editionLabel(s.year)}</bdi>
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

export function UpcomingCard({
  fixture,
  locale,
  dayLabel,
  kind,
}: {
  fixture: FixtureWithTeams;
  locale: Locale;
  /** Overrides the card's day line (Home passes "Today" / "Tomorrow"). */
  dayLabel?: string;
  /** Competition line under the day (Home only; a competition page omits it). */
  kind?: string;
}) {
  const day = dayLabel ?? formatDateLabel(fixtureDaySafe(fixture), locale, todayWord(locale));
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
    <MatchLink
      matchId={String(fixture.id)}
      href={href}
      preview={preview}
      prefetchIntent
      className="sooncard"
    >
      <div className="cardtop">{day}</div>
      {kind ? <div className="cardkind">{kind}</div> : null}
      <div className="upcoming-match">
        <div className="pair">
          <div className="teamline">
            <Crest
              src={fixture.homeTeam?.logoUrl}
              status={fixture.homeTeam?.logoStatus}
              isNational={fixture.homeTeam?.isNational}
              countryCode={fixture.homeTeam?.countryCode}
              name={fixture.homeTeam?.name}
              shortName={fixture.homeTeam?.shortName}
              code={fixture.homeTeam?.code}
              primary={fixture.homeTeam?.primaryColor}
              secondary={fixture.homeTeam?.secondaryColor}
            />
            <bdi>{teamName(fixture.homeTeam, locale)}</bdi>
          </div>
          <div className="teamline">
            <Crest
              src={fixture.awayTeam?.logoUrl}
              status={fixture.awayTeam?.logoStatus}
              isNational={fixture.awayTeam?.isNational}
              countryCode={fixture.awayTeam?.countryCode}
              name={fixture.awayTeam?.name}
              shortName={fixture.awayTeam?.shortName}
              code={fixture.awayTeam?.code}
              primary={fixture.awayTeam?.primaryColor}
              secondary={fixture.awayTeam?.secondaryColor}
            />
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

function teamName(team: FixtureWithTeams['homeTeam'], locale: Locale): string {
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
          <Crest
            src={fixture.homeTeam?.logoUrl}
            status={fixture.homeTeam?.logoStatus}
            isNational={fixture.homeTeam?.isNational}
            countryCode={fixture.homeTeam?.countryCode}
            name={fixture.homeTeam?.name}
            shortName={fixture.homeTeam?.shortName}
            code={fixture.homeTeam?.code}
            primary={fixture.homeTeam?.primaryColor}
            secondary={fixture.homeTeam?.secondaryColor}
            sizeVar="clamp(56px, 6vw, 88px)"
          />
          <strong>
            <bdi>{teamName(fixture.homeTeam, locale)}</bdi>
          </strong>
        </div>
        <div className="pl-score">
          {phase ? (
            <span className={`pl-phase${state === 'live' ? ' playing' : ''}`}>{phase}</span>
          ) : null}
          <span className="bigscore">
            {hasScore ? (
              `${fixture.homeScore}–${fixture.awayScore}`
            ) : (
              <LocalTime date={asDate(fixture.kickoffAt)} locale={locale} format="time" />
            )}
          </span>
        </div>
        <div className="heroteam">
          <Crest
            src={fixture.awayTeam?.logoUrl}
            status={fixture.awayTeam?.logoStatus}
            isNational={fixture.awayTeam?.isNational}
            countryCode={fixture.awayTeam?.countryCode}
            name={fixture.awayTeam?.name}
            shortName={fixture.awayTeam?.shortName}
            code={fixture.awayTeam?.code}
            primary={fixture.awayTeam?.primaryColor}
            secondary={fixture.awayTeam?.secondaryColor}
            sizeVar="clamp(56px, 6vw, 88px)"
          />
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

export function CompetitionMatchRow({
  fixture,
  locale,
  minute,
}: {
  fixture: FixtureWithTeams;
  locale: Locale;
  /** Live match minute; when given, a running match shows "70′" instead of LIVE (Home). */
  minute?: number | null;
}) {
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
    clock =
      fixture.statusCode === 'HT'
        ? t('halfTime')
        : minute != null
          ? `${minute}\u2032`
          : t('live') || 'LIVE';
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
            <Crest
              src={fixture.homeTeam?.logoUrl}
              status={fixture.homeTeam?.logoStatus}
              isNational={fixture.homeTeam?.isNational}
              countryCode={fixture.homeTeam?.countryCode}
              name={fixture.homeTeam?.name}
              shortName={fixture.homeTeam?.shortName}
              code={fixture.homeTeam?.code}
              primary={fixture.homeTeam?.primaryColor}
              secondary={fixture.homeTeam?.secondaryColor}
            />
            <span className="teamname">
              <bdi>{teamName(fixture.homeTeam, locale)}</bdi>
            </span>
            {hasScore ? (
              <span className="points">{fixture.homeScore}</span>
            ) : (
              <span className="points" />
            )}
          </div>
          <div className={`teamline${homeWon ? ' is-loser' : ''}`}>
            <Crest
              src={fixture.awayTeam?.logoUrl}
              status={fixture.awayTeam?.logoStatus}
              isNational={fixture.awayTeam?.isNational}
              countryCode={fixture.awayTeam?.countryCode}
              name={fixture.awayTeam?.name}
              shortName={fixture.awayTeam?.shortName}
              code={fixture.awayTeam?.code}
              primary={fixture.awayTeam?.primaryColor}
              secondary={fixture.awayTeam?.secondaryColor}
            />
            <span className="teamname">
              <bdi>{teamName(fixture.awayTeam, locale)}</bdi>
            </span>
            {hasScore ? (
              <span className="points">{fixture.awayScore}</span>
            ) : (
              <span className="points" />
            )}
          </div>
        </div>
      </MatchLink>
      <div className="savebox">
        <button
          type="button"
          className="save"
          aria-pressed={saved}
          aria-label={
            saved ? tL('unstarFixture', { match: names }) : tL('starFixture', { match: names })
          }
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
  plain = false,
}: {
  standings: StandingRow[];
  fixtures: FixtureWithTeams[];
  locale: Locale;
  split: TableSplit;
  caption?: string;
  /** No qualification-zone marks or legend (Home's "Live standings" table). */
  plain?: boolean;
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
      <table className="stand-table" aria-label={caption || undefined}>
        <colgroup>
          <col className="stand-pos" />
          <col className="stand-team" />
          <col className="stand-num" />
          <col className="stand-num" />
          <col className="stand-num" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="stand-pos">
              <abbr title={t('colRankFull')}>#</abbr>
            </th>
            <th scope="col">{t('team')}</th>
            <th scope="col" className="stand-num">
              <abbr title={t('colPlayedFull')}>{t('colPlayed')}</abbr>
            </th>
            <th scope="col" className="stand-num">
              <abbr title={t('colGoalDiffFull')}>{t('colGoalDiff')}</abbr>
            </th>
            <th scope="col" className="stand-num">
              <abbr title={t('colPointsFull')}>{t('colPoints')}</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const live =
              row.teamId != null && liveTeamIds.has(row.teamId)
                ? liveScoreLabel(row.teamId, fixtures)
                : null;
            const href = row.team?.slug ? `/${locale}/equipe/${row.team.slug}` : undefined;
            const color = plain ? null : zoneColor(row.description);
            const team = (
              <>
                <Crest
                  src={row.team?.logoUrl}
                  status={row.team?.logoStatus}
                  isNational={row.team?.isNational}
                  countryCode={row.team?.countryCode}
                  name={row.team?.name}
                  shortName={row.team?.shortName}
                  code={row.team?.code}
                  primary={row.team?.primaryColor}
                  secondary={row.team?.secondaryColor}
                />
                <bdi>{row.team ? getTeamDisplayName(row.team, locale) : '—'}</bdi>
                {live ? <span className="standing-live">{live}</span> : null}
              </>
            );
            return (
              <tr key={`${row.groupLabel}-${row.teamId}`}>
                <td className="stand-pos">
                  <span className="standing-pos">
                    <i className="zone" style={color ? { background: color } : undefined} />
                    <span className="pos-n">{row.rank}</span>
                  </span>
                </td>
                <td>
                  {href ? (
                    <IntentLink className="standing-team" href={href}>
                      {team}
                    </IntentLink>
                  ) : (
                    <span className="standing-team">{team}</span>
                  )}
                </td>
                <td className="stand-num">{row.played}</td>
                <td className="stand-num">{formatSigned(row.goalDiff ?? 0)}</td>
                <td className="stand-num">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!plain && legend.length > 0 && (
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
  valueLabel,
  players,
  locale,
  cutoff,
  hideTitle,
  emptyMessage,
}: {
  title: string;
  valueLabel?: string;
  players: {
    id: number;
    slug: string;
    name: string;
    team: string;
    teamLogo: string | null;
    value: number;
  }[];
  locale: Locale;
  cutoff?: string | null;
  hideTitle?: boolean;
  emptyMessage?: string;
}) {
  const t = useTranslations('leaguePage');
  const [open, setOpen] = useState(false);
  const metric = valueLabel ?? title;
  if (players.length === 0) {
    if (!emptyMessage) return null;
    return (
      <section className="player-ranking">
        {!hideTitle ? (
          <div className="pl-head">
            <h2>{title}</h2>
          </div>
        ) : null}
        <p className="pl-empty pl-stats-empty">{emptyMessage}</p>
      </section>
    );
  }
  // Preserve ties: same value shares the previous rank (1,2,3,3,5).
  const ranked = players.reduce<
    {
      id: number;
      slug: string;
      name: string;
      team: string;
      teamLogo: string | null;
      value: number;
      rank: number;
    }[]
  >((acc, p, i) => {
    const rank =
      acc.length === 0 || acc[acc.length - 1].value !== p.value ? i + 1 : acc[acc.length - 1].rank;
    acc.push({ ...p, rank });
    return acc;
  }, []);
  const canToggle = ranked.length > 20;
  return (
    <section className="player-ranking" data-open={open ? 'true' : 'false'}>
      {!hideTitle ? (
        <div className="pl-head">
          <h2>{title}</h2>
        </div>
      ) : null}
      {cutoff ? <p className="pl-stats-date">{cutoff}</p> : null}
      <table className="pl-ranking" aria-label={metric}>
        <colgroup>
          <col className="stand-pos" />
          <col className="stand-team" />
          <col className="stand-num" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="stand-pos">
              <abbr title={t('colRankFull')}>#</abbr>
            </th>
            <th scope="col">{t('colPlayer')}</th>
            <th scope="col" className="stand-num">
              {metric}
            </th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((p, i) => (
            <tr key={`${p.id}-${p.team}-${i}`}>
              <td className="stand-pos">{p.rank}</td>
              <td>
                <IntentLink className="player-cell" href={`/${locale}/joueur/${p.slug}`}>
                  <Crest src={p.teamLogo} name={p.team} />
                  <bdi>{p.name}</bdi>
                </IntentLink>
              </td>
              <td className="stand-num">{p.value}</td>
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

type StatsSub = 'scorers' | 'assists' | 'cleanSheets' | 'yellow' | 'red';

export function StatsBoard({
  scorers,
  assists,
  cards,
  locale,
  playerCount,
  throughLabel,
}: {
  scorers: {
    id: number;
    slug: string;
    name: string;
    team: string;
    teamLogo: string | null;
    value: number;
  }[];
  assists: {
    id: number;
    slug: string;
    name: string;
    team: string;
    teamLogo: string | null;
    value: number;
  }[];
  cards: TopCardRow[];
  locale: Locale;
  playerCount: number;
  throughLabel: string | null;
}) {
  const t = useTranslations('leaguePage');
  const moreLabel = useTranslations('topbar')('more');
  const [tab, setTab] = useState<StatsSub>('scorers');
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = tab === 'yellow' || tab === 'red';

  function pick(next: StatsSub) {
    setTab(next);
    setMoreOpen(false);
  }

  const valueLabel =
    tab === 'scorers'
      ? t('goals')
      : tab === 'assists'
        ? t('assists')
        : tab === 'yellow'
          ? t('yellowCards')
          : tab === 'red'
            ? t('redCards')
            : t('cleanSheets');

  const players =
    tab === 'scorers'
      ? scorers
      : tab === 'assists'
        ? assists
        : tab === 'yellow'
          ? mapCards(cards, 'yellow')
          : tab === 'red'
            ? mapCards(cards, 'red')
            : [];

  return (
    <div className="pl-stats-board">
      <div className="pl-stats-subs" role="tablist" aria-label={t('stats')}>
        <button
          type="button"
          role="tab"
          className="pl-stats-sub"
          aria-selected={tab === 'scorers'}
          onClick={() => pick('scorers')}
        >
          {t('topScorers')}
        </button>
        <button
          type="button"
          role="tab"
          className="pl-stats-sub"
          aria-selected={tab === 'assists'}
          onClick={() => pick('assists')}
        >
          {t('assists')}
        </button>
        <button
          type="button"
          role="tab"
          className="pl-stats-sub"
          aria-selected={tab === 'cleanSheets'}
          onClick={() => pick('cleanSheets')}
        >
          {t('cleanSheets')}
        </button>
        <div className="pl-stats-more">
          <button
            type="button"
            role="tab"
            className="pl-stats-sub"
            aria-selected={moreActive}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
          >
            {moreLabel}
            <Chevron />
          </button>
          {moreOpen ? (
            <div className="pl-stats-more-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => pick('yellow')}>
                {t('yellowCards')}
              </button>
              <button type="button" role="menuitem" onClick={() => pick('red')}>
                {t('redCards')}
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {(playerCount > 0 || throughLabel) && (
        <div className="pl-stats-meta">
          {playerCount > 0 ? <span>{t('playersMeta', { n: playerCount })}</span> : <span />}
          {throughLabel ? <span>{t('throughDate', { date: throughLabel })}</span> : null}
        </div>
      )}
      <PlayerRanking
        title={valueLabel}
        valueLabel={valueLabel}
        players={players}
        locale={locale}
        hideTitle
        emptyMessage={tab === 'cleanSheets' ? t('emptyCleanSheets') : t('noStatsData')}
      />
    </div>
  );
}

export function ClubDetails({
  teams,
  intro,
  locale,
}: {
  teams: {
    id: number;
    slug: string;
    name: string;
    logoUrl: string | null;
    logoStatus?: import('@/lib/logos/status').LogoStatus | null;
    code?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
  }[];
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
              <Crest
                src={team.logoUrl}
                status={team.logoStatus}
                name={team.name}
                code={team.code}
                primary={team.primaryColor}
                secondary={team.secondaryColor}
              />
              <IntentLink href={`/${locale}/equipe/${team.slug}`}>
                <bdi>{team.name}</bdi>
              </IntentLink>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

export function mapScorers(rows: TopPlayerRow[]): {
  id: number;
  slug: string;
  name: string;
  team: string;
  teamLogo: string | null;
  value: number;
}[] {
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
