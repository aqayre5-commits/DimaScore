import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n/config';
import { db } from '@/lib/db/client';
import { getStandings } from '@/lib/db/queries';
import { SeoBreadcrumb } from '@/components/chrome/SeoBreadcrumb';
import { FaqPageJsonLd } from '@/components/seo/FaqPageJsonLd';
import { LeagueStandingsTab } from '@/components/league/LeagueStandingsTab';
import {
  BOTOLA_SEASON_OPENER_YEAR,
  BOTOLA_SEASON_OPENER_COMPETITION_ID,
  BOTOLA_COMPETITION_HUB,
  botolaCompetitionFixturesHref,
  botolaCompetitionStandingsHref,
  botolaSeasonOpenerPath,
} from '@/lib/seo/botola-season-opener';
import {
  botolaClassementTableHash,
  botolaClassementTableHashAliases,
} from '@/lib/seo/botola-classement';

async function getCachedBotola2026Standings() {
  'use cache';
  cacheLife('minutes');
  return getStandings(db, BOTOLA_SEASON_OPENER_COMPETITION_ID, BOTOLA_SEASON_OPENER_YEAR);
}

export async function BotolaClassementPage({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'botolaClassement' });
  const standings = await getCachedBotola2026Standings();

  const hubHref = BOTOLA_COMPETITION_HUB[locale];
  const fixturesHref = botolaCompetitionFixturesHref(locale);
  const standingsHref = botolaCompetitionStandingsHref(locale);
  const calendarHref = botolaSeasonOpenerPath(locale);
  const marocHref = `/${locale}/edition/maroc`;
  const homeHref = `/${locale}`;
  const tableHash = botolaClassementTableHash(locale);
  const tableAliases = botolaClassementTableHashAliases(locale);

  const faqs = [
    { q: t('faq1q'), a: t('faq1a') },
    { q: t('faq2q'), a: t('faq2a') },
    { q: t('faq3q'), a: t('faq3a') },
    { q: t('faq4q'), a: t('faq4a') },
  ];

  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-6">
      <SeoBreadcrumb
        segments={[
          { label: 'DimaScore', href: homeHref },
          { label: t('linkMaroc'), href: marocHref },
          { label: t('breadcrumb') },
        ]}
        compact
      />

      <h1 className="mt-2 text-2xl font-bold text-text-primary">{t('h1')}</h1>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t('lead')}</p>

      <section id={tableHash} className="mt-8 scroll-mt-24">
        {tableAliases.map((alias) => (
          <div key={alias} id={alias} className="h-0 w-0 overflow-hidden" aria-hidden />
        ))}
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-text-primary">{t('tableTitle')}</h2>
          <Link
            href={standingsHref}
            className="text-sm font-medium text-accent-azure hover:underline"
          >
            {t('ctaStandings')}
          </Link>
        </div>
        {standings.length === 0 ? (
          <p className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-6 text-center text-sm text-text-tertiary">
            {t('tableEmpty')}
          </p>
        ) : (
          <LeagueStandingsTab standings={standings} locale={locale} />
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary">{t('howToReadTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t('howToReadBody')}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary">{t('ctaTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t('ctaBody')}</p>
        <nav className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href={fixturesHref} className="text-accent-azure hover:underline">
            {t('ctaFixtures')}
          </Link>
          <Link href={calendarHref} className="text-accent-azure hover:underline">
            {t('ctaCalendar')}
          </Link>
          <Link href={standingsHref} className="text-accent-azure hover:underline">
            {t('ctaStandings')}
          </Link>
        </nav>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary">{t('followTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t('followBody')}</p>
        <nav className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href={fixturesHref} className="text-accent-azure hover:underline">
            {t('ctaFixtures')}
          </Link>
          <Link href={standingsHref} className="text-accent-azure hover:underline">
            {t('ctaStandings')}
          </Link>
          <Link href={calendarHref} className="text-accent-azure hover:underline">
            {t('ctaCalendar')}
          </Link>
          <Link href={hubHref} className="text-accent-azure hover:underline">
            {t('linkBotola')}
          </Link>
          <Link href={marocHref} className="text-accent-azure hover:underline">
            {t('linkMaroc')}
          </Link>
          <Link href={homeHref} className="text-accent-azure hover:underline">
            {t('linkHome')}
          </Link>
        </nav>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary">{t('vsNewsTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t('vsNewsBody')}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-text-primary">{t('faqTitle')}</h2>
        <dl className="mt-4 divide-y divide-border-subtle">
          {faqs.map((item) => (
            <div key={item.q} className="py-3">
              <dt className="text-sm font-semibold text-text-primary">{item.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-text-secondary">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <FaqPageJsonLd faqs={faqs.map((it) => ({ question: it.q, answer: it.a }))} />
    </div>
  );
}
