import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { Flag } from '@/components/shared/Flag';
import { Card, CardTitle } from './Card';

/** Overview › First-half summary / Match summary / Match so far / Preview. */
export function SummaryCard({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  if (paragraphs.length === 0) return null;
  return (
    <Card labelledBy="mp-summary">
      <CardTitle id="mp-summary">{title}</CardTitle>
      <div className="mt-1.5 space-y-2 text-sm leading-snug text-text-secondary md:mt-3 md:text-[17px]">
        {paragraphs.map((p, i) => (
          <p key={i} className={i === 0 ? 'text-text-primary' : undefined}>
            {p}
          </p>
        ))}
      </div>
    </Card>
  );
}

/** Overview › Match details: label / value rows; rows without data are left out. */
export function MatchDetailsCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: React.ReactNode }>;
}) {
  if (rows.length === 0) return null;
  return (
    <Card labelledBy="mp-details">
      <CardTitle id="mp-details" size="md">
        {title}
      </CardTitle>
      <dl className="mt-2 divide-y divide-border-subtle text-sm">
        {rows.map((r, i) => (
          <div key={i} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-text-secondary">{r.label}</dt>
            <dd className="text-end text-text-primary">{r.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

/**
 * Table tab: the top five of the group the match belongs to, then the position of any team in
 * this match that is outside it, then a link to the full table. Current standings only (there is
 * no stored "before kick-off" snapshot).
 */
export async function TableCard({
  locale,
  rows,
  homeTeamId,
  awayTeamId,
  competitionName,
  competitionHref,
}: {
  locale: Locale;
  rows: StandingRow[];
  homeTeamId: number;
  awayTeamId: number;
  competitionName: string;
  competitionHref: string | null;
}) {
  const t = await getTranslations({ locale, namespace: 'matchPage' });
  const inMatch = (r: StandingRow) => r.teamId === homeTeamId || r.teamId === awayTeamId;
  const top = rows.slice(0, 5);
  const outside = rows.slice(5).filter(inMatch);

  const head = (
    <div className="grid grid-cols-[2.75rem_1fr_3.5rem_3.5rem] border-b border-border-subtle px-3 py-2 text-xs font-semibold text-text-secondary md:text-sm md:grid-cols-[4.5rem_1fr_9rem_9rem]">
      <span>{t('pos')}</span>
      <span>{t('club')}</span>
      <span className="text-center">
        <abbr title={t('played')} className="no-underline md:hidden">
          {t('playedShort')}
        </abbr>
        <span className="max-md:hidden">{t('played')}</span>
      </span>
      <span className="text-center">
        <abbr title={t('points')} className="no-underline md:hidden">
          {t('pointsShort')}
        </abbr>
        <span className="max-md:hidden">{t('points')}</span>
      </span>
    </div>
  );

  const row = (r: StandingRow) => {
    const hl = inMatch(r);
    const name = r.team ? getTeamDisplayName(r.team, locale) : '—';
    return (
      <li
        key={`${r.groupLabel}-${r.teamId}`}
        className={`grid grid-cols-[2.75rem_1fr_3.5rem_3.5rem] items-center border-s-4 px-3 py-1.5 text-sm md:py-2 md:text-base md:grid-cols-[4.5rem_1fr_9rem_9rem] ${
          hl
            ? 'border-accent-green bg-[var(--mp-highlight-bg)] font-bold text-text-primary'
            : 'border-transparent text-text-primary'
        }`}
        aria-current={hl ? 'true' : undefined}
      >
        <span className="tabular-nums">{r.rank}</span>
        <span className="flex min-w-0 items-center gap-2 md:gap-4">
          <Flag
            countryCode={r.team?.countryCode}
            logoUrl={r.team?.logoUrl}
            isNational={r.team?.isNational}
            size={28}
            label={name}
            className="max-md:!h-6 max-md:!w-6"
          />
          <span className="truncate">{name}</span>
        </span>
        <span className="text-center tabular-nums">{r.played}</span>
        <span className="text-center font-bold tabular-nums">{r.points}</span>
      </li>
    );
  };

  const band = (label: string) => (
    <h3 className="mt-4 rounded-lg border-s-4 border-accent-green bg-[var(--mp-band)] px-4 py-2 text-sm font-bold text-text-primary md:py-1.5 md:text-lg">
      {label}
    </h3>
  );

  return (
    <Card labelledBy="mp-table">
      <CardTitle id="mp-table">{t('tableTitle', { competition: competitionName })}</CardTitle>
      {band(t('topFive'))}
      {head}
      <ol className="divide-y divide-border-subtle">{top.map(row)}</ol>
      {outside.map((r) => (
        <div key={r.teamId}>
          {band(t('teamPosition', { team: r.team ? getTeamDisplayName(r.team, locale) : '—' }))}
          <p aria-hidden className="py-1 text-center text-text-tertiary">
            …
          </p>
          <ol className="divide-y divide-border-subtle">{row(r)}</ol>
        </div>
      ))}
      {competitionHref && (
        <p className="mt-4">
          <Link
            href={competitionHref}
            prefetch={false}
            className="text-sm font-semibold text-accent-green underline underline-offset-4 hover:no-underline md:text-base"
          >
            {t('fullTable', { competition: competitionName })}
          </Link>
        </p>
      )}
    </Card>
  );
}
