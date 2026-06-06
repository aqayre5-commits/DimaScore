import Link from 'next/link';
import { getCountrySlug } from '@/lib/constants/country-slugs';
import type { Locale } from '@/lib/i18n/config';
import Image from 'next/image';

interface LeftRailCompetition {
  id: number;
  name: Record<string, string>;
  countryCode: string | null;
  logoUrl: string | null;
  countryKey: string;
  slug: Record<string, string>;
}

interface CompSection {
  label: string;
  items: LeftRailCompetition[];
}

interface Props {
  sections: CompSection[];
  counts: { live: number; today: number; upcoming: number; results: number };
  locale: Locale;
  labels: {
    viewAllCompetitions: string;
    liveNow: string;
    todaysMatches: string;
    upcoming: string;
    results: string;
    quickFilters: string;
  };
}

export function HomeLeftRail({ sections, counts, locale, labels }: Props) {
  return (
    <div className="space-y-4">
      {/* Competitions by section */}
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
        <nav>
          {sections.map((section) => (
            <div key={section.label}>
              <div className="px-4 py-2">
                <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                  {section.label}
                </h2>
              </div>
              {section.items.map((c) => {
                const name = c.name[locale] ?? c.name['en'] ?? '';
                const country = getCountrySlug(c.countryKey, locale);
                const href = `/${locale}/competition/${country}/${c.slug[locale]}`;
                return (
                  <Link
                    key={c.id}
                    href={href}
                    className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-bg-surface-2"
                  >
                    {c.logoUrl ? (
                      <Image
                        src={c.logoUrl}
                        alt=""
                        className="size-5 shrink-0 object-contain"
                        width={20}
                        height={20}
                      />
                    ) : (
                      <div className="flex size-5 items-center justify-center rounded bg-bg-surface-2 text-[8px] font-bold text-text-tertiary">
                        {name.slice(0, 2)}
                      </div>
                    )}
                    <p className="min-w-0 flex-1 truncate text-sm text-text-primary">{name}</p>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Quick Filters */}
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
        <div className="px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            {labels.quickFilters}
          </h2>
        </div>
        <div>
          <QuickFilterRow label={labels.liveNow} count={counts.live} isLive />
          <QuickFilterRow label={labels.todaysMatches} count={counts.today} />
          <QuickFilterRow label={labels.upcoming} count={counts.upcoming} />
          <QuickFilterRow label={labels.results} count={counts.results} />
        </div>
      </div>
    </div>
  );
}

function QuickFilterRow({
  label,
  count,
  isLive,
}: {
  label: string;
  count: number;
  isLive?: boolean;
}) {
  return (
    <div className="flex cursor-pointer items-center justify-between px-4 py-2 transition-colors hover:bg-bg-surface-2">
      <span className="text-sm text-text-secondary">{label}</span>
      <span
        className={`min-w-[24px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums ${
          isLive ? 'bg-score-live/15 text-score-live' : 'bg-bg-surface-2 text-text-tertiary'
        }`}
      >
        {count}
      </span>
    </div>
  );
}
