import { useTranslations } from 'next-intl';
import type { PlayerTransfer } from '@/lib/db/queries/player';
import type { Locale } from '@/lib/i18n/config';

interface PlayerTransfersProps {
  transfers: PlayerTransfer[];
  locale: Locale;
}

function resolveTeamCode(
  team: { name: Record<string, string>; code: string | null } | null,
  locale: Locale,
): string {
  if (!team) return '—';
  return (
    team.code ??
    team.name[locale]?.slice(0, 3).toUpperCase() ??
    team.name['en']?.slice(0, 3).toUpperCase() ??
    '—'
  );
}

export function PlayerTransfers({ transfers, locale }: PlayerTransfersProps) {
  const t = useTranslations('playerPage');

  if (transfers.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('noTransferData')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
      <div className="border-b border-border-subtle px-4 py-2">
        <h3 className="label-caps">{t('careerTimeline')}</h3>
      </div>

      <div className="divide-y divide-border-subtle">
        {transfers.map((transfer) => (
          <div key={transfer.id} className="flex items-center gap-3 px-4 py-3">
            {/* Date */}
            <div className="w-20 shrink-0 text-xs tabular-nums text-text-tertiary">
              {transfer.date ?? '—'}
            </div>

            {/* From → To */}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex items-center gap-1.5">
                {transfer.fromTeam?.logoUrl && (
                  <img
                    src={transfer.fromTeam.logoUrl}
                    alt=""
                    width={16}
                    height={16}
                    className="size-4 object-contain"
                    loading="lazy"
                  />
                )}
                <span className="text-sm text-text-secondary">
                  {resolveTeamCode(transfer.fromTeam, locale)}
                </span>
              </div>

              <span className="text-xs text-text-tertiary">→</span>

              <div className="flex items-center gap-1.5">
                {transfer.toTeam?.logoUrl && (
                  <img
                    src={transfer.toTeam.logoUrl}
                    alt=""
                    width={16}
                    height={16}
                    className="size-4 object-contain"
                    loading="lazy"
                  />
                )}
                <span className="text-sm font-medium text-text-primary">
                  {resolveTeamCode(transfer.toTeam, locale)}
                </span>
              </div>
            </div>

            {/* Fee / Type */}
            <div className="shrink-0 text-end text-xs text-text-tertiary">
              {transfer.fee ?? transfer.type ?? '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
