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
  locale: Locale;
}

export function HomeLeftRail({ sections, locale }: Props) {
  return (
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
  );
}
