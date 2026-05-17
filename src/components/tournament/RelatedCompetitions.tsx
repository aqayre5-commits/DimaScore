import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n/config';
import {
  MEGA_MENU_SECTIONS,
  buildCompetitionHref,
  type MegaMenuEntry,
} from '@/lib/constants/competitions-mega-menu';

interface RelatedCompetitionsProps {
  competitionIds: number[];
  locale: Locale;
}

/**
 * Overview Block 4 — Related competitions.
 * Per competition-cup.md Section 7 Tab 1 Block 4.
 * Lists related tournaments (qualifiers, sister competitions) from metadata.
 */
export function RelatedCompetitions({ competitionIds, locale }: RelatedCompetitionsProps) {
  const tTournament = useTranslations('tournament');
  const tMenu = useTranslations('megaMenu');

  // Resolve competition IDs to mega-menu entries
  const allEntries = MEGA_MENU_SECTIONS.flatMap((s) => s.entries);
  const related = competitionIds
    .map((id) => allEntries.find((e) => e.competitionId === id))
    .filter((e): e is MegaMenuEntry => e != null);

  if (related.length === 0) return null;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="label-caps">{tTournament('relatedCompetitions')}</h3>
      </div>

      <div className="divide-y divide-border-subtle">
        {related.map((entry) => (
          <a
            key={entry.competitionId}
            href={buildCompetitionHref(entry, locale)}
            className="flex items-center justify-between px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-bg-surface-2 hover:text-text-primary"
          >
            <span>{tMenu(entry.labelKey as never)}</span>
            <span className="text-text-tertiary">&rarr;</span>
          </a>
        ))}
      </div>
    </div>
  );
}
