import { getTranslations } from 'next-intl/server';
import { FormDots, type FormResult } from '@/components/shared/FormSparkline';
import type { Locale } from '@/lib/i18n/config';

interface PreMatchFormProps {
  locale: Locale;
  homeName: string;
  awayName: string;
  homeForm: FormResult[];
  awayForm: FormResult[];
}

/**
 * Pre-match "Recent Form" card — each team's last few W/D/L results.
 * Shown for upcoming matches (where stats/lineups/events don't exist yet) using
 * data that's already available in the DB.
 */
export async function PreMatchForm({
  locale,
  homeName,
  awayName,
  homeForm,
  awayForm,
}: PreMatchFormProps) {
  if (homeForm.length === 0 && awayForm.length === 0) return null;
  const t = await getTranslations({ locale, namespace: 'matchDetail' });

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle bg-bg-surface-2 px-4 py-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-accent-green">
          {t('recentForm')}
        </h3>
      </div>
      <div className="divide-y divide-border-subtle">
        <FormRow name={homeName} form={homeForm} />
        <FormRow name={awayName} form={awayForm} />
      </div>
    </div>
  );
}

function FormRow({ name, form }: { name: string; form: FormResult[] }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="min-w-0 truncate text-sm font-medium text-text-primary">{name}</span>
      {form.length > 0 ? (
        <FormDots results={form} />
      ) : (
        <span className="text-xs text-text-tertiary">—</span>
      )}
    </div>
  );
}
