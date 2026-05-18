import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n/config';
import { codeToFlag } from '@/lib/flags';
import { ShareButton } from '@/components/shared/ShareButton';
import type { CupMetadata } from '@/lib/constants/tournament-metadata';
import type { StandingRow } from '@/lib/db/queries';

interface MeetTheTeamsCardProps {
  metadata: CupMetadata;
  standings: StandingRow[];
  locale: Locale;
}

/**
 * Right-rail Widget 3 — Meet the Teams (Morocco's group).
 * Shows flag + team name for each team in Morocco's group.
 * Falls back to first group if no Morocco group found.
 * Captain photos deferred until squad data is hydrated (Phase 9+).
 */
export function MeetTheTeamsCard({ metadata, standings, locale }: MeetTheTeamsCardProps) {
  const t = useTranslations('tournament');

  const moroccoGroup = metadata.groups.find((g) => g.isMoroccoGroup) ?? metadata.groups[0];
  if (!moroccoGroup) return null;

  const groupStandings = standings.filter((s) => s.groupLabel === moroccoGroup.label);

  return (
    <div id="meet-teams" className="rounded-lg border border-border-subtle bg-bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary">{t('meetTheTeams')}</h3>
        <ShareButton title={t('meetTheTeams')} hash="meet-teams" />
      </div>
      <p className="mt-0.5 text-xs text-text-tertiary">
        {t('groupLabel', { label: moroccoGroup.label })}
      </p>

      <ul className="mt-3 space-y-2">
        {groupStandings.map((row) => {
          const name =
            row.team?.name[locale] ??
            row.team?.name['en'] ??
            row.team?.shortName[locale] ??
            row.team?.shortName['en'] ??
            row.team?.code ??
            '—';
          const flag = row.team?.countryCode ? codeToFlag(row.team.countryCode) : '';

          return (
            <li key={row.teamId ?? row.groupLabel + row.rank} className="flex items-center gap-2">
              {flag && <span className="text-base">{flag}</span>}
              <span className="text-base text-text-primary">{name}</span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-accent-azure">{t('seeAllTeams')} &rarr;</p>
    </div>
  );
}
