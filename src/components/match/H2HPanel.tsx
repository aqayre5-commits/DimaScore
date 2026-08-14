import { useTranslations } from 'next-intl';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import { formatMatchDate } from '@/lib/utils/date';
import type { H2HFixture } from '@/lib/db/queries/match-detail';
import type { Locale } from '@/lib/i18n/config';

interface H2HPanelProps {
  fixtures: H2HFixture[];
  homeTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  locale: Locale;
}

export function H2HPanel({
  fixtures,
  homeTeamId,
  homeTeamName,
  awayTeamName,
  locale,
}: H2HPanelProps) {
  const t = useTranslations('matchDetail');

  if (fixtures.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
        <div className="border-b border-border-subtle bg-bg-surface-2 px-4 py-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-accent-green">
            {t('h2h')}
          </h3>
        </div>
        <div className="px-4 py-6 text-center text-sm text-text-tertiary">{t('noH2H')}</div>
      </div>
    );
  }

  // Compute record from homeTeamId's perspective
  let wins = 0;
  let draws = 0;
  let losses = 0;

  for (const f of fixtures) {
    if (f.homeScore == null || f.awayScore == null) continue;
    const isHome = f.homeTeamId === homeTeamId;
    const myScore = isHome ? f.homeScore : f.awayScore;
    const theirScore = isHome ? f.awayScore : f.homeScore;
    if (myScore > theirScore) wins++;
    else if (myScore < theirScore) losses++;
    else draws++;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle bg-bg-surface-2 px-4 py-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-accent-green">{t('h2h')}</h3>
      </div>
      {/* Record summary */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
        <span className="text-xs font-medium text-text-primary">{homeTeamName}</span>
        <div className="flex items-center gap-3 text-xs tabular-nums">
          <span className="font-semibold text-accent-emerald">
            {t('wins')} {wins}
          </span>
          <span className="text-text-tertiary">
            {t('draws')} {draws}
          </span>
          <span className="font-semibold text-score-loss">
            {t('losses')} {losses}
          </span>
        </div>
        <span className="text-xs font-medium text-text-primary">{awayTeamName}</span>
      </div>

      {/* Past fixtures */}
      <div className="divide-y divide-border-subtle">
        {fixtures.map((f) => (
          <H2HRow key={f.id} fixture={f} homeTeamId={homeTeamId} locale={locale} />
        ))}
      </div>
    </div>
  );
}

function H2HRow({
  fixture,
  homeTeamId,
  locale,
}: {
  fixture: H2HFixture;
  homeTeamId: number;
  locale: Locale;
}) {
  const date = formatMatchDate(fixture.kickoffAt, locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const compName = getLocalizedCompetitionName(
    { id: 0, name: fixture.competitionName, slug: fixture.competitionSlug },
    locale,
  );

  const isHome = fixture.homeTeamId === homeTeamId;
  const myScore = isHome ? fixture.homeScore : fixture.awayScore;
  const theirScore = isHome ? fixture.awayScore : fixture.homeScore;
  const won = myScore != null && theirScore != null && myScore > theirScore;
  const lost = myScore != null && theirScore != null && myScore < theirScore;

  return (
    <a
      href={`/${locale}/match/${fixture.id}`}
      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg-surface-2"
    >
      {/* Date */}
      <span className="w-24 shrink-0 text-xs text-text-tertiary">{date}</span>

      {/* Score */}
      <span
        className={`w-14 shrink-0 text-center text-base font-semibold tabular-nums ${
          won ? 'text-accent-emerald' : lost ? 'text-score-loss' : 'text-text-primary'
        }`}
      >
        {fixture.homeScore ?? 0} - {fixture.awayScore ?? 0}
      </span>

      {/* Competition */}
      <span className="min-w-0 truncate text-xs text-text-tertiary">{compName}</span>
    </a>
  );
}
