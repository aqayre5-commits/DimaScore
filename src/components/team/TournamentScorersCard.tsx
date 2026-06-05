import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { TournamentScorers, TournamentScorerRow } from '@/lib/db/queries/team';
import type { Locale } from '@/lib/i18n/config';

interface TournamentScorersCardProps {
  data: TournamentScorers | null;
  locale: Locale;
}

function ScorerSection({ title, rows }: { title: string; rows: TournamentScorerRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="py-1">
      <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
        {title}
      </div>
      <ol>
        {rows.map((r, i) => (
          <li key={`${r.playerId ?? r.name}-${i}`} className="flex items-center gap-2 px-4 py-1.5">
            <span className="w-4 text-center text-xs tabular-nums text-text-quaternary">
              {i + 1}
            </span>
            {r.photo ? (
              <Image
                src={r.photo}
                alt=""
                width={24}
                height={24}
                className="size-6 shrink-0 rounded-full bg-bg-surface-2 object-cover"
              />
            ) : (
              <div className="size-6 shrink-0 rounded-full bg-bg-surface-2" />
            )}
            <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{r.name}</span>
            {r.teamLogo && (
              <Image
                src={r.teamLogo}
                alt=""
                width={14}
                height={14}
                className="size-3.5 shrink-0 object-contain"
              />
            )}
            <span className="w-6 text-end text-sm font-bold tabular-nums text-text-primary">
              {r.value}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Right-rail card: top scorers + assists for the team's current/upcoming
 * tournament. Shows an empty state until the tournament has been played.
 * Renders nothing when the team has no current tournament.
 */
export async function TournamentScorersCard({ data, locale }: TournamentScorersCardProps) {
  if (!data) return null;
  const t = await getTranslations({ locale, namespace: 'teamPage' });
  const compName = data.competitionName[locale] ?? data.competitionName['en'] ?? '';
  const empty = data.scorers.length === 0 && data.assisters.length === 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-3">
        <h3 className="label-caps truncate">{compName}</h3>
      </div>
      {empty ? (
        <p className="px-4 py-6 text-center text-xs text-text-tertiary">{t('statsPending')}</p>
      ) : (
        <div className="divide-y divide-border-subtle">
          <ScorerSection title={t('topScorers')} rows={data.scorers} />
          <ScorerSection title={t('topAssisters')} rows={data.assisters} />
        </div>
      )}
    </div>
  );
}
