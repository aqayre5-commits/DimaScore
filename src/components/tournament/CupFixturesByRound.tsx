'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { FixtureRow } from '@/components/shared/FixtureRow';
import { useLiveFixtures } from '@/hooks/useLiveFixtures';
import { SITE_TZ } from '@/lib/utils/date';
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
    // Day key + label pinned to the site timezone — deterministic across SSR/hydration
    // and consistent with each other at midnight boundaries.
    const dateKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: SITE_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(f.kickoffAt);
    const idx = seen.get(dateKey);
    if (idx != null) {
      groups[idx].fixtures.push(f);
    } else {
      const label = new Intl.DateTimeFormat(dateLocale, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        timeZone: SITE_TZ,
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

  // Overlay 15s live poll so knockout-day scores/minute/status tick on this surface.
  const livePatches = useLiveFixtures();
  const patchedFixtures = useMemo(() => {
    if (livePatches.size === 0) return fixtures;
    return fixtures.map((f) => {
      const p = livePatches.get(f.id);
      return p
        ? {
            ...f,
            statusCode: p.statusCode,
            minute: p.minute,
            homeScore: p.homeScore,
            awayScore: p.awayScore,
            homeScorePen: p.homeScorePen,
            awayScorePen: p.awayScorePen,
          }
        : f;
    });
  }, [fixtures, livePatches]);

  if (patchedFixtures.length === 0) {
    return <p className="py-8 text-center text-sm text-text-tertiary">{t('noMatches')}</p>;
  }

  const dateGroups = groupByDate(patchedFixtures, locale);

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
