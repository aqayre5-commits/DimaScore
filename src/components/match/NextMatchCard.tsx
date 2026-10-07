'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { LocalTime } from '@/components/shared/LocalTime';
import type { NextFixture } from '@/lib/db/queries/match-detail';
import type { Locale } from '@/lib/i18n/config';
import { matchHref } from '@/lib/seo/match-slug';

interface TeamRef {
  name: Record<string, string>;
  shortName: Record<string, string>;
  code: string | null;
  logoUrl: string | null;
}

interface NextMatchCardProps {
  fixtures: NextFixture[];
  homeTeamId: number;
  awayTeamId: number;
  homeTeam: TeamRef | null;
  awayTeam: TeamRef | null;
  locale: Locale;
}

const LABELS: Record<string, string> = {
  fr: 'Prochain match',
  en: 'Next match',
  ar: 'المباراة القادمة',
};

/**
 * One card per team playing in the current match, each showing that team's next fixture as a
 * matchup (home team on the left, both crests) with the competition, date and kick-off time.
 */
export function NextMatchCard({
  fixtures,
  homeTeamId,
  awayTeamId,
  homeTeam,
  awayTeam,
  locale,
}: NextMatchCardProps) {
  const label = LABELS[locale] ?? LABELS.fr;
  const homeNext = fixtures.find((f) => f.teamId === homeTeamId);
  const awayNext = fixtures.find((f) => f.teamId === awayTeamId);

  const cards = [
    homeNext && homeTeam ? { fixture: homeNext, team: homeTeam } : null,
    awayNext && awayTeam ? { fixture: awayNext, team: awayTeam } : null,
  ].filter((c): c is { fixture: NextFixture; team: TeamRef } => c !== null);

  if (cards.length === 0) return null;

  return (
    <div className="space-y-3">
      {cards.map(({ fixture, team }) => (
        <TeamNextCard
          key={fixture.teamId}
          fixture={fixture}
          team={team}
          label={label}
          locale={locale}
        />
      ))}
    </div>
  );
}

function TeamSide({
  name,
  logo,
  side,
}: {
  name: string;
  logo: string | null;
  side: 'home' | 'away';
}) {
  const crest = logo ? (
    <Image src={logo} alt="" width={20} height={20} className="size-5 shrink-0 object-contain" />
  ) : null;
  // Crests sit on the inner edge (next to "vs"): home = name then crest; away = crest then name.
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-1.5 ${side === 'home' ? 'justify-end' : 'justify-start'}`}
    >
      {side === 'home' ? (
        <>
          <span className="min-w-0 truncate font-medium text-text-primary">{name}</span>
          {crest}
        </>
      ) : (
        <>
          {crest}
          <span className="min-w-0 truncate font-medium text-text-primary">{name}</span>
        </>
      )}
    </div>
  );
}

function TeamNextCard({
  fixture,
  team,
  label,
  locale,
}: {
  fixture: NextFixture;
  team: TeamRef;
  label: string;
  locale: Locale;
}) {
  const teamName = getTeamDisplayName(team, locale);
  const opponentName = fixture.opponentName[locale] ?? fixture.opponentName['en'] ?? 'TBD';
  const compName = fixture.competitionName[locale] ?? fixture.competitionName['en'] ?? '';

  // Home team on the left (standard order). The subject team is home iff fixture.isHome.
  const subject = { name: teamName, logo: team.logoUrl, side: 'home' as const };
  const opponent = { name: opponentName, logo: fixture.opponentLogoUrl, side: 'away' as const };
  const [left, right] = fixture.isHome
    ? [subject, opponent]
    : [
        { ...opponent, side: 'home' as const },
        { ...subject, side: 'away' as const },
      ];

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="flex items-baseline gap-1.5 border-b border-border-subtle bg-bg-surface-2 px-4 py-2">
        <span className="min-w-0 truncate text-sm font-semibold text-text-primary">{teamName}</span>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-accent-green">
          {label}
        </span>
      </div>
      <Link
        href={matchHref(locale, {
          id: fixture.id,
          homeSlug: fixture.homeSlug,
          awaySlug: fixture.awaySlug,
        })}
        prefetch={false}
        className="block px-4 py-3 transition-colors hover:bg-bg-surface-2"
      >
        <div className="flex items-center gap-3 text-sm">
          <TeamSide name={left.name} logo={left.logo} side="home" />
          <span className="shrink-0 text-xs font-medium text-text-tertiary">vs</span>
          <TeamSide name={right.name} logo={right.logo} side="away" />
        </div>
        <p className="mt-2 text-center text-xs tabular-nums text-text-tertiary">
          {compName}
          {compName ? ' · ' : ''}
          <LocalTime
            date={fixture.kickoffAt}
            locale={locale}
            format="date"
            dateOptions={{ day: 'numeric', month: 'short' }}
          />
          {' · '}
          <LocalTime date={fixture.kickoffAt} locale={locale} format="time" />
        </p>
      </Link>
    </div>
  );
}
