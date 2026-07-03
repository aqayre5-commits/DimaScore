'use client';

import { MatchLink } from '@/components/shared/MatchLink';
import { previewFromFixtureRow } from '@/lib/match-header-preview';
import { Play } from 'lucide-react';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { LocalTime } from '@/components/shared/LocalTime';
import { useLiveFixtures, useLiveFeedReady } from '@/hooks/useLiveFixtures';
import type { RightRailFixture, GoalEvent } from '@/lib/db/queries/right-rail';
import type { Locale } from '@/lib/i18n/config';
import Image from 'next/image';
import { LIVE_CODES_ARRAY, FINISHED_CODES_ARRAY } from '@/lib/match-status';

interface Props {
  /** Server-ranked candidate list. Client picks first whose patched status isn't finished. */
  candidates: Array<{ match: RightRailFixture; goals: GoalEvent[] }>;
  locale: Locale;
  labels: {
    nextMatch: string;
    liveNow: string;
    viewMatch: string;
  };
}

const LIVE_CODES: string[] = [...LIVE_CODES_ARRAY];
const FINISHED_CODES = new Set<string>(FINISHED_CODES_ARRAY);

export function HomeNextMatch({ candidates, locale, labels }: Props) {
  const livePatches = useLiveFixtures();
  const feedReady = useLiveFeedReady();

  // Server-rendered candidates can be arbitrarily stale (long-lived tab, cached HTML).
  // Once the live feed has answered it is authoritative: a fixture it doesn't return is
  // not live — treat a server-"live" candidate without a patch as finished rather than
  // trusting the snapshot.
  const effectiveStatus = (m: RightRailFixture): string => {
    const patch = livePatches.get(m.id);
    if (patch) return patch.statusCode;
    if (feedReady && LIVE_CODES.includes(m.statusCode)) return 'FT';
    return m.statusCode;
  };

  // First candidate whose effective status is not finished (i.e. live or still-NS). When a
  // displayed match ends, the live patch flips it to FT and we auto-advance to the next.
  const selected = candidates.find(({ match: m }) => !FINISHED_CODES.has(effectiveStatus(m)));
  if (!selected) return null;
  const { match, goals } = selected;

  const homeName = getTeamDisplayName(match.homeTeam, locale);
  const awayName = getTeamDisplayName(match.awayTeam, locale);
  const compName = match.competition.name[locale] ?? match.competition.name['en'] ?? '';
  const patch = livePatches.get(match.id);
  const statusCode = effectiveStatus(match);
  // Patch presence is authoritative: its minute is taken even when null (BT/HT/P phases),
  // otherwise a stale server-prop minute leaks into the badge (e.g. "122'" during the break).
  const minute = patch ? patch.minute : match.minute;
  const homeScore = patch?.homeScore ?? match.homeScore;
  const awayScore = patch?.awayScore ?? match.awayScore;
  const isLive = LIVE_CODES.includes(statusCode);

  const preview = previewFromFixtureRow({
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    homeScore,
    awayScore,
    statusCode,
    minute,
    kickoffAt: match.kickoffAt,
    competition: { name: match.competition.name, slug: match.competition.slug },
  });

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {isLive ? labels.liveNow : labels.nextMatch}
        </h2>
        {isLive && (
          <span className="flex items-center gap-1 rounded-full bg-score-live/10 px-2 py-0.5 text-[11px] font-bold text-score-live">
            <span className="size-1.5 animate-pulse rounded-full bg-score-live" />
            {statusCode === 'HT'
              ? 'HT'
              : minute != null
                ? `${minute}'`
                : statusCode === 'P'
                  ? 'PEN'
                  : statusCode}
          </span>
        )}
      </div>

      <div className="px-4 pb-4">
        {/* Competition + round */}
        <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
          {match.competition.logoUrl && (
            <Image
              src={match.competition.logoUrl}
              alt=""
              className="size-3.5 object-contain"
              width={12}
              height={12}
            />
          )}
          <span className="truncate">{compName}</span>
          {match.contextLabel && <span> · {match.contextLabel}</span>}
        </div>

        {/* Kickoff time for upcoming */}
        {!isLive && (
          <div className="mt-2 text-center text-xs text-text-secondary" suppressHydrationWarning>
            <LocalTime date={match.kickoffAt} locale={locale} format="kickoff" />
          </div>
        )}

        {/* Teams + score/VS */}
        <div className="mt-3 flex items-center justify-center gap-3">
          {/* Home */}
          <div className="flex flex-1 flex-col items-center gap-1.5 min-w-0">
            {match.homeTeam?.logoUrl ? (
              <Image
                src={match.homeTeam.logoUrl}
                alt=""
                className="size-9 object-contain"
                width={36}
                height={36}
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full bg-bg-surface-2 text-xs font-bold text-text-tertiary">
                {homeName[0]}
              </div>
            )}
            <span className="w-full truncate text-center text-[11px] font-medium text-text-primary">
              {homeName}
            </span>
          </div>

          {/* Score or VS */}
          <div className="shrink-0 text-center">
            {isLive ? (
              <p className="text-2xl font-bold tabular-nums text-text-primary">
                {homeScore ?? 0} - {awayScore ?? 0}
              </p>
            ) : (
              <p className="text-lg font-semibold text-text-tertiary">VS</p>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-1 flex-col items-center gap-1.5 min-w-0">
            {match.awayTeam?.logoUrl ? (
              <Image
                src={match.awayTeam.logoUrl}
                alt=""
                className="size-9 object-contain"
                width={36}
                height={36}
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full bg-bg-surface-2 text-xs font-bold text-text-tertiary">
                {awayName[0]}
              </div>
            )}
            <span className="w-full truncate text-center text-[11px] font-medium text-text-primary">
              {awayName}
            </span>
          </div>
        </div>

        {/* Venue for upcoming */}
        {!isLive && match.venueName && (
          <div className="mt-2 text-center text-[11px] text-text-tertiary">
            {match.venueName}
            {match.venueCity ? `, ${match.venueCity}` : ''}
          </div>
        )}

        {/* Goal scorers for live */}
        {isLive && goals.length > 0 && (
          <div className="mt-3 space-y-0.5">
            {goals.map((g, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                <span className="size-1 rounded-full bg-text-tertiary" />
                <span className="tabular-nums text-text-tertiary">{g.minute}&apos;</span>
                <span>{g.playerName}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <MatchLink
          matchId={String(match.id)}
          href={`/${locale}/match/${match.id}`}
          preview={preview}
          prefetchIntent
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors ${
            isLive
              ? 'bg-accent-green text-white hover:bg-accent-green-deep'
              : 'border border-accent-azure/30 bg-accent-azure/10 text-accent-azure hover:bg-accent-azure/20'
          }`}
        >
          {isLive && <Play className="size-3.5 fill-current" />}
          {labels.viewMatch}
        </MatchLink>
      </div>
    </div>
  );
}
