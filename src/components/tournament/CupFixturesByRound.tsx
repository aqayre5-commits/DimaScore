import { useTranslations } from 'next-intl';
import { FixtureRow } from '@/components/shared/FixtureRow';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

interface CupFixturesByRoundProps {
  fixtures: FixtureWithTeams[];
  locale: Locale;
}

const DATE_LOCALE_MAP: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  ar: 'ar-MA',
};

function groupByDate(fixtures: FixtureWithTeams[], locale: Locale) {
  const dateLocale = DATE_LOCALE_MAP[locale] ?? 'en-GB';
  const groups: { key: string; label: string; fixtures: FixtureWithTeams[] }[] = [];
  const seen = new Map<string, number>();

  // Sort all fixtures chronologically first
  const sorted = [...fixtures].sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime());

  for (const f of sorted) {
    const dateKey = f.kickoffAt.toISOString().slice(0, 10);
    const idx = seen.get(dateKey);
    if (idx != null) {
      groups[idx].fixtures.push(f);
    } else {
      const label = new Intl.DateTimeFormat(dateLocale, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
      }).format(f.kickoffAt);
      seen.set(dateKey, groups.length);
      groups.push({ key: dateKey, label, fixtures: [f] });
    }
  }

  return groups;
}

/**
 * All cup fixtures grouped by date, sorted chronologically.
 * Works for group stage + knockout.
 */
export function CupFixturesByRound({ fixtures, locale }: CupFixturesByRoundProps) {
  const t = useTranslations('tournament');

  if (fixtures.length === 0) {
    return <p className="py-8 text-center text-sm text-text-tertiary">{t('noMatches')}</p>;
  }

  const dateGroups = groupByDate(fixtures, locale);

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-bg-surface">
      {/* Header */}
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="label-caps">{t('fixtures')}</h3>
      </div>

      {/* Date groups with internal separators */}
      {dateGroups.map((group) => (
        <div key={group.key}>
          <div className="border-b border-border-subtle bg-bg-surface-3 px-4 py-1.5">
            <span className="text-xs font-medium uppercase text-text-tertiary">{group.label}</span>
          </div>
          <div className="divide-y divide-border-subtle px-4">
            {group.fixtures.map((f) => (
              <FixtureRow
                key={f.id}
                fixtureId={f.id}
                kickoffAt={f.kickoffAt}
                statusCode={f.statusCode}
                homeTeam={f.homeTeam}
                awayTeam={f.awayTeam}
                homeScore={f.homeScore}
                awayScore={f.awayScore}
                homeScorePen={f.homeScorePen}
                awayScorePen={f.awayScorePen}
                locale={locale}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
