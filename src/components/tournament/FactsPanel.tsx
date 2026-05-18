import { useTranslations } from 'next-intl';

interface FactsPanelProps {
  facts: string[];
}

/**
 * Overview Block 5 — Facts panel.
 * Per competition-cup.md Section 7 Tab 1 Block 5.
 * Structured data summary. Facts passed as locale-resolved strings from page.
 */
export function FactsPanel({ facts }: FactsPanelProps) {
  const t = useTranslations('tournament');

  if (facts.length === 0) return null;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="label-caps">{t('facts')}</h3>
      </div>

      <ul className="divide-y divide-border-subtle px-4">
        {facts.map((fact, i) => (
          <li key={i} className="py-2 text-base text-text-secondary">
            {fact}
          </li>
        ))}
      </ul>
    </div>
  );
}
