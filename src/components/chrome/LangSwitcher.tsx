'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { resolveCompetitionEntry } from '@/lib/competitions/resolve-competition';
import { getCountrySlug } from '@/lib/constants/country-slugs';
import type { Locale } from '@/lib/i18n/config';

const localeLabels: Record<string, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
};

export function LangSwitcher() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    if (newLocale === locale) return;
    const segments = pathname.split('/');
    segments[1] = newLocale;
    // /{locale}/competition/{country}/{tournament}/...
    if (segments[2] === 'competition' && segments[4]) {
      let tournament = segments[4];
      try {
        tournament = decodeURIComponent(tournament);
      } catch {
        // keep raw
      }
      const entry = resolveCompetitionEntry(tournament);
      if (entry) {
        segments[3] = getCountrySlug(entry.countryKey, newLocale as Locale);
        segments[4] = entry.slugs[newLocale as Locale];
      }
    }
    router.push(segments.join('/'));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" aria-label={t('language')} />}>
        <Globe className="size-4" />
        <span className="uppercase text-xs font-semibold">{locale}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        {Object.entries(localeLabels).map(([code, label]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => switchLocale(code)}
            className={locale === code ? 'font-semibold text-text-primary' : ''}
          >
            <span className="uppercase text-xs text-text-tertiary w-6">{code}</span>
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
