import { useTranslations } from 'next-intl';
import { codeToFlag } from '@/lib/flags';
import type { Locale } from '@/lib/i18n/config';

interface RivalTeam {
  code: string;
  name: Record<string, string>;
}

interface MoroccoContextLineProps {
  groupLabel: string;
  rivals: RivalTeam[];
  locale: Locale;
}

/**
 * "Maroc dans Groupe C avec (rival flags)" — Morocco context line
 * shown in page header for tournaments where Morocco participates.
 *
 * Per competition-cup.md Section 5 Sub-zone D.
 * Rival flags are non-clickable at v1 (team pages deferred).
 */
export function MoroccoContextLine({ groupLabel, rivals, locale }: MoroccoContextLineProps) {
  const t = useTranslations('tournament');

  return (
    <p className="flex flex-wrap items-center gap-1.5 text-base text-text-secondary">
      <span>{t('moroccoInGroup', { group: groupLabel })}</span>
      <span className="text-text-tertiary">{t('with')}</span>
      {rivals.map((rival, i) => (
        <span key={rival.code} className="inline-flex items-center gap-1">
          <span className="text-base leading-none">{codeToFlag(rival.code)}</span>
          <span>{rival.name[locale] ?? rival.name['en'] ?? rival.code}</span>
          {i < rivals.length - 1 && <span className="text-text-tertiary">·</span>}
        </span>
      ))}
    </p>
  );
}
