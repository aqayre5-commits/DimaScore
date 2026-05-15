import { useTranslations } from 'next-intl';

interface EditionSelectorProps {
  currentYear: number;
}

/**
 * Edition selector chip. At v1 launch: renders current edition only as
 * a non-interactive label. Forward-compatible: when past-edition data
 * is ingested (Phase 6+), the dropdown becomes functional and routes
 * to ?edition=YYYY query param.
 *
 * Per competition-cup.md Section 5 Sub-zone B.
 */
export function EditionSelector({ currentYear }: EditionSelectorProps) {
  const t = useTranslations('tournament');

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-surface-2 px-3 py-1 text-xs font-medium text-text-secondary">
      {t('edition')}: {currentYear}
    </span>
  );
}
