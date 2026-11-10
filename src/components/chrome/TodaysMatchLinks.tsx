import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n/config';
import { getTodaysMatchLinks } from '@/lib/db/queries/todays-match-links';
import { matchHref } from '@/lib/seo/match-slug';
import { getTeamDisplayName } from '@/lib/utils/team-name';

/**
 * Server-rendered "Today's matches" links above the footer on every page. Replaces the crawlable
 * internal links the (now client-only) ticker strip used to provide. Data is cached and shared
 * across pages; renders nothing when there are no matches today.
 */
export async function TodaysMatchLinks({ locale }: { locale: Locale }) {
  const [links, t] = await Promise.all([
    getTodaysMatchLinks(),
    getTranslations({ locale, namespace: 'footer' }),
  ]);
  if (links.length === 0) return null;

  return (
    <nav
      aria-labelledby="todays-matches-heading"
      className="border-t border-border-subtle bg-bg-surface"
      data-testid="todays-match-links"
    >
      <div className="mx-auto max-w-[1280px] px-4 py-4">
        <h2 id="todays-matches-heading" className="label-caps mb-2">
          {t('todaysMatches')}
        </h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {links.map((m) => (
            <li key={m.id}>
              <Link
                href={matchHref(locale, { id: m.id, homeSlug: m.homeSlug, awaySlug: m.awaySlug })}
                prefetch={false}
                className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                {getTeamDisplayName(m.home, locale)} – {getTeamDisplayName(m.away, locale)}
                {m.live && <span className="ms-1 text-xs text-red-500">{t('live')}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
