import Link from 'next/link';
import { Star } from 'lucide-react';
import { getCountrySlug } from '@/lib/constants/country-slugs';
import type { Locale } from '@/lib/i18n/config';

interface PopularComp {
  name: Record<string, string>;
  countryKey: string;
  slug: Record<string, string>;
  logoUrl: string | null;
}

interface Props {
  competitions: PopularComp[];
  locale: Locale;
  labels: {
    popularCompetitions: string;
    followYourTeams: string;
    followDescription: string;
    browseTeams: string;
    getTheApp: string;
    appDescription: string;
  };
}

export function HomeFooterStrip({ competitions, locale, labels }: Props) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {/* Popular Competitions */}
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface px-4 py-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-primary">
          {labels.popularCompetitions}
        </h2>
        <div className="flex flex-wrap gap-2">
          {competitions.map((c, i) => {
            const name = c.name[locale] ?? c.name['en'] ?? '';
            const country = getCountrySlug(c.countryKey, locale);
            return (
              <Link
                key={i}
                href={`/${locale}/competition/${country}/${c.slug[locale]}`}
                className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-surface-2 px-3 py-2 transition-colors hover:border-accent-green/50"
              >
                {c.logoUrl && (
                  <img src={c.logoUrl} alt="" className="size-5 object-contain" loading="lazy" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-text-primary">{name}</p>
                  <p className="text-[10px] text-text-tertiary capitalize">{country}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Follow Your Teams */}
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border-subtle bg-bg-surface px-4 py-6 text-center">
        <Star className="size-10 text-text-tertiary" />
        <h2 className="text-sm font-semibold text-text-primary">{labels.followYourTeams}</h2>
        <p className="text-xs text-text-tertiary">{labels.followDescription}</p>
        <Link
          href={`/${locale}/teams`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle px-4 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-surface-2"
        >
          <Star className="size-3.5" />
          {labels.browseTeams}
        </Link>
      </div>

      {/* App Promo */}
      <div className="flex flex-col justify-center gap-3 rounded-xl border border-border-subtle bg-bg-surface px-4 py-6">
        <h2 className="text-sm font-semibold text-text-primary">{labels.getTheApp}</h2>
        <p className="text-xs text-text-tertiary">{labels.appDescription}</p>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-black px-3 py-2 text-white">
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <div className="leading-none">
              <p className="text-[7px]">Download on the</p>
              <p className="text-[11px] font-semibold">App Store</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-black px-3 py-2 text-white">
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.18 23.49c.56.29 1.26.18 1.7-.28l12.16-12.16L4.88 1.79c-.44-.46-1.14-.57-1.7-.28-.56.29-.88.88-.78 1.48L4.38 12l-1.98 8.99c-.1.6.22 1.21.78 1.5z" />
            </svg>
            <div className="leading-none">
              <p className="text-[7px]">GET IT ON</p>
              <p className="text-[11px] font-semibold">Google Play</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
