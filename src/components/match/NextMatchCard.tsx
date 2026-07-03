import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
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

export function NextMatchCard({
  fixtures,
  homeTeamId,
  awayTeamId,
  homeTeam,
  awayTeam,
  locale,
}: NextMatchCardProps) {
  const t = useTranslations('matchDetail');

  const homeNext = fixtures.find((f) => f.teamId === homeTeamId);
  const awayNext = fixtures.find((f) => f.teamId === awayTeamId);

  if (!homeNext && !awayNext) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle bg-bg-surface-2 px-4 py-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-accent-green">
          {t('nextMatch')}
        </h3>
      </div>
      <div className="divide-y divide-border-subtle">
        {homeNext && homeTeam && (
          <NextFixtureRow
            fixture={homeNext}
            teamName={getTeamDisplayName(homeTeam, locale)}
            teamLogo={homeTeam.logoUrl}
            locale={locale}
          />
        )}
        {awayNext && awayTeam && (
          <NextFixtureRow
            fixture={awayNext}
            teamName={getTeamDisplayName(awayTeam, locale)}
            teamLogo={awayTeam.logoUrl}
            locale={locale}
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
}: {
  fixture: NextFixture;
  teamName: string;
  teamLogo: string | null;
  locale: Locale;
}) {
  const opponentName = fixture.opponentName[locale] ?? fixture.opponentName['en'] ?? 'TBD';
  const compName = fixture.competitionName[locale] ?? fixture.competitionName['en'] ?? '';

  const dateStr = (
    <LocalTime
      date={fixture.kickoffAt}
      locale={locale}
      format="date"
      dateOptions={{ day: 'numeric', month: 'short' }}
    />
  );

  const timeStr = <LocalTime date={fixture.kickoffAt} locale={locale} format="time" />;

  const matchup = fixture.isHome
    ? `${teamName} vs ${opponentName}`
    : `${opponentName} vs ${teamName}`;

  return (
    <Link
      href={`/${locale}/match/${fixture.id}`}
      prefetch={false}
      className="block px-4 py-3 transition-colors hover:bg-bg-surface-2"
    >
      <div className="flex items-center gap-2.5">
        {teamLogo && (
          <Image
            src={teamLogo}
            alt=""
            width={32}
            height={32}
            className="size-8 shrink-0 object-contain"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">{matchup}</p>
          <p className="truncate text-xs text-text-tertiary">{compName}</p>
          <p className="mt-0.5 text-xs tabular-nums text-text-secondary">
            {dateStr} &middot; {timeStr}
          </p>
        </div>
      </div>
    </Link>
  );
}
