'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { LocalTime } from '@/components/shared/LocalTime';
import type { NextFixture } from '@/lib/db/queries/match-detail';
import type { Locale } from '@/lib/i18n/config';

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

const LABELS = {
  fr: {
    next: 'Prochains matchs',
    dom: 'DOM',
    ext: 'EXT',
    today: 'auj.',
    inDays: (d: number) => `dans ${d} j`,
  },
  en: {
    next: 'Next matches',
    dom: 'HOME',
    ext: 'AWAY',
    today: 'today',
    inDays: (d: number) => `in ${d}d`,
  },
  ar: {
    next: 'المباريات القادمة',
    dom: 'داخل',
    ext: 'خارج',
    today: 'اليوم',
    inDays: (d: number) => `خلال ${d} يوم`,
  },
} as const;

export function NextMatchCard({
  fixtures,
  homeTeamId,
  awayTeamId,
  homeTeam,
  awayTeam,
  locale,
}: NextMatchCardProps) {
  const L = LABELS[locale] ?? LABELS.fr;

  const homeNext = fixtures.find((f) => f.teamId === homeTeamId);
  const awayNext = fixtures.find((f) => f.teamId === awayTeamId);

  if (!homeNext && !awayNext) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle bg-bg-surface-2 px-4 py-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-accent-green">{L.next}</h3>
      </div>
      <div className="divide-y divide-border-subtle">
        {homeNext && homeTeam && (
          <NextFixtureRow
            fixture={homeNext}
            teamName={getTeamDisplayName(homeTeam, locale)}
            teamLogo={homeTeam.logoUrl}
            locale={locale}
            L={L}
          />
        )}
        {awayNext && awayTeam && (
          <NextFixtureRow
            fixture={awayNext}
            teamName={getTeamDisplayName(awayTeam, locale)}
            teamLogo={awayTeam.logoUrl}
            locale={locale}
            L={L}
          />
        )}
      </div>
    </div>
  );
}

function NextFixtureRow({
  fixture,
  teamName,
  teamLogo,
  locale,
  L,
}: {
  fixture: NextFixture;
  teamName: string;
  teamLogo: string | null;
  locale: Locale;
  L: (typeof LABELS)[Locale];
}) {
  const opponentName = fixture.opponentName[locale] ?? fixture.opponentName['en'] ?? 'TBD';
  const compName = fixture.competitionName[locale] ?? fixture.competitionName['en'] ?? '';

  // Days until kickoff — computed once in a useState initializer (the pattern KickoffCountdown uses;
  // Date.now() is allowed there, unlike in the render body).
  const [days] = useState(() =>
    Math.max(0, Math.ceil((new Date(fixture.kickoffAt).getTime() - Date.now()) / 86_400_000)),
  );
  const countdown = days === 0 ? L.today : L.inDays(days);

  return (
    <Link
      href={`/${locale}/match/${fixture.id}`}
      prefetch={false}
      className="block px-4 py-3 transition-colors hover:bg-bg-surface-2"
    >
      <div className="flex items-center gap-2">
        {teamLogo && (
          <Image
            src={teamLogo}
            alt=""
            width={24}
            height={24}
            className="size-6 shrink-0 object-contain"
          />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">
          {teamName}
        </span>
        {countdown && (
          <span className="shrink-0 rounded-full bg-accent-green/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-accent-green">
            {countdown}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-sm text-text-secondary">
        <span
          className={`rounded px-1.5 py-px text-[9px] font-bold uppercase tracking-wide ${
            fixture.isHome
              ? 'bg-accent-green/10 text-accent-green'
              : 'bg-bg-surface-2 text-text-tertiary'
          }`}
        >
          {fixture.isHome ? L.dom : L.ext}
        </span>
        <span className="min-w-0 truncate">
          vs <span className="font-medium text-text-primary">{opponentName}</span>
        </span>
      </div>
      <p className="mt-1 truncate text-xs tabular-nums text-text-tertiary">
        {compName}
        {compName ? ' · ' : ''}
        <LocalTime
          date={fixture.kickoffAt}
          locale={locale}
          format="date"
          dateOptions={{ day: 'numeric', month: 'short' }}
        />{' '}
        · <LocalTime date={fixture.kickoffAt} locale={locale} format="time" />
      </p>
    </Link>
  );
}
