'use client';

import { useTranslations } from 'next-intl';
import type { StandingRow } from '@/lib/db/queries';
import type { ZoneBand } from '@/lib/competitions/formats';
import type { Locale } from '@/lib/i18n/config';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { buildTeamHref } from '@/lib/competitions/paths';
import { dedupeStandingsByTeam } from '@/lib/standings/dedupe';
import { TeamMark } from '@/components/shared/TeamMark';
import { IntentLink } from '@/components/shared/IntentLink';

/** Reference band colours (competition.js ruleRows): direct, play-off, out. */
const BAND: Record<string, string> = {
  r16: '#6089ad',
  playoff: '#a48bac',
  eliminated: '#9da5a1',
};

function bandFor(rank: number, zones: ZoneBand[]): ZoneBand | undefined {
  return zones.find((z) => rank >= z.from && rank <= z.to);
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

/** Single ranked league-phase table (UEFA CL / EL / ECL reference). */
export function LeaguePhaseTable({
  standings,
  zones,
  locale,
  caption,
}: {
  standings: StandingRow[];
  zones: ZoneBand[];
  locale: Locale;
  caption?: string;
}) {
  const t = useTranslations('leaguePage');
  const rows = dedupeStandingsByTeam(standings)
    .slice()
    .sort((a, b) => a.rank - b.rank);
  if (rows.length === 0) return <p className="pl-empty">{t('comingSoon')}</p>;
  return (
    <table className="cup-table" aria-label={caption || undefined}>
      <thead>
        <tr>
          <th scope="col">
            <abbr title={t('colRankFull')}>#</abbr>
          </th>
          <th scope="col">{t('team')}</th>
          <th scope="col">
            <abbr title={t('colPlayedFull')}>{t('colPlayed')}</abbr>
          </th>
          <th scope="col">
            <abbr title={t('colGoalDiffFull')}>{t('colGoalDiff')}</abbr>
          </th>
          <th scope="col">
            <abbr title={t('colPointsFull')}>{t('colPoints')}</abbr>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const band = bandFor(row.rank, zones);
          const name = row.team ? getTeamDisplayName(row.team, locale) : '—';
          const crest = (
            <TeamMark
              className="mark cup-mark"
              src={row.team?.logoUrl}
              status={row.team?.logoStatus}
              name={row.team?.name}
              shortName={row.team?.shortName}
              code={row.team?.code}
              primary={row.team?.primaryColor}
              secondary={row.team?.secondaryColor}
              isNational={row.team?.isNational}
              countryCode={row.team?.countryCode}
              sizeVar="21px"
            />
          );
          return (
            <tr key={`${row.teamId}-${row.rank}`}>
              <td
                className="cup-pos"
                style={
                  band
                    ? ({ ['--band' as string]: BAND[band.key] } as React.CSSProperties)
                    : undefined
                }
              >
                {row.rank}
              </td>
              <td>
                {row.team?.slug ? (
                  <IntentLink className="cup-teamlink" href={buildTeamHref(locale, row.team.slug)}>
                    {crest}
                    <bdi>{name}</bdi>
                  </IntentLink>
                ) : (
                  <span className="cup-teamlink">
                    {crest}
                    <bdi>{name}</bdi>
                  </span>
                )}
              </td>
              <td>{row.played}</td>
              <td>{signed(row.goalDiff ?? 0)}</td>
              <td>{row.points}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** "What happens next" key, one row per zone band. */
export function LeaguePhaseRules({ zones, title }: { zones: ZoneBand[]; title: string }) {
  const tCup = useTranslations('domesticCup');
  const label = (key: string) =>
    key === 'r16' ? tCup('zoneR16') : key === 'playoff' ? tCup('zonePlayoff') : tCup('zoneOut');
  return (
    <section className="pl-summary cup-rules-panel">
      <div className="pl-head">
        <h2>{title}</h2>
      </div>
      <div className="cup-rules">
        {zones.map((z) => (
          <div
            key={z.key}
            className="cup-rule"
            style={{ ['--band' as string]: BAND[z.key] } as React.CSSProperties}
          >
            <span className="cup-rank">
              {z.from}–{z.to}
            </span>
            <span>{label(z.key)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
