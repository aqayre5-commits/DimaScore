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
    <Card labelledBy="mp-summary" pad="pb-2 pt-1 md:px-[18px] md:pb-[30px] md:pt-[15px]">
      <CardTitle id="mp-summary">{title}</CardTitle>
      <div className="mt-1 space-y-2 text-[15px] leading-[17px] text-text-secondary md:mt-[11.5px] md:text-[21px] md:leading-snug">
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
      <dl className="mt-2 divide-y divide-border-subtle text-sm md:mt-[6.5px] md:text-base md:leading-6">
        {rows.map((r, i) => (
          <div key={i} className="flex items-baseline justify-between gap-4 py-2.5 md:py-1">
            <dt className="text-text-secondary md:text-[17px]">{r.label}</dt>
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
    <div className="grid grid-cols-[2.75rem_1fr_3.5rem_3.5rem] border-b border-border-subtle px-3 pb-[3px] pt-[13px] text-[15px] font-semibold text-text-secondary md:grid-cols-[92px_1fr_132px_129px] md:pe-0 md:ps-[18px] md:py-[7px] md:text-base md:leading-6">
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
        className={`grid grid-cols-[2.75rem_1fr_3.5rem_3.5rem] items-center border-s-4 px-3 py-[5px] text-[16.5px] md:grid-cols-[88px_1fr_132px_129px] md:py-1 md:pe-0 md:ps-[14px] md:text-lg ${
          hl
            ? 'border-accent-green bg-[var(--mp-highlight-bg)] font-bold text-text-primary'
            : 'border-transparent text-text-primary'
        }`}
        aria-current={hl ? 'true' : undefined}
      >
        <span className="tabular-nums">{r.rank}</span>
        <span className="flex min-w-0 items-center gap-2 md:gap-[22px]">
          <Flag
            countryCode={r.team?.countryCode}
            logoUrl={r.team?.logoUrl}
            isNational={r.team?.isNational}
            size={30}
            label={name}
            className="max-md:!h-7 max-md:!w-7"
          />
          <span className="truncate">{name}</span>
        </span>
        <span className="text-center tabular-nums">{r.played}</span>
        <span className="text-center font-bold tabular-nums">{r.points}</span>
      </li>
    );
  };

  const band = (label: string, mt: string) => (
    <h3
      className={`${mt} rounded-lg border-s-4 border-accent-green bg-[var(--mp-band)] px-4 py-[3px] text-[21px] font-bold leading-tight text-text-primary md:rounded-[9px] md:pe-4 md:ps-[17px] md:py-[3px] md:text-[22.5px] md:leading-[1.2]`}
    >
      {label}
    </h3>
  );

  return (
    <Card labelledBy="mp-table" pad="md:px-[23px] md:pb-6 md:pt-[11.5px]">
      <CardTitle id="mp-table" size="table">
        {t('tableTitle', { competition: competitionName })}
      </CardTitle>
      {band(t('topFive'), 'mt-4 md:mt-[14px]')}
      {head}
      <ol className="divide-y divide-border-subtle">{top.map(row)}</ol>
      {outside.map((r) => (
        <div key={r.teamId}>
          {band(
            t('teamPosition', { team: r.team ? getTeamDisplayName(r.team, locale) : '—' }),
            'mt-[29px] md:mt-[25px]',
          )}
          <p aria-hidden className="py-3 text-center text-text-tertiary md:py-[11px] md:leading-6">
            …
          </p>
          <ol className="divide-y divide-border-subtle">{row(r)}</ol>
        </div>
      ))}
      {competitionHref && (
        <p className="mt-4 md:mt-[13px]">
          <Link
            href={competitionHref}
            prefetch={false}
            className="text-sm font-semibold text-accent-green underline underline-offset-4 hover:no-underline md:text-[18.5px]"
          >
            {t('fullTable', { competition: competitionName })}
          </Link>
        </p>
      )}
    </Card>
  );
}
