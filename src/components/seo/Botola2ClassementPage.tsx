import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n/config';
import { db } from '@/lib/db/client';
import { getStandings } from '@/lib/db/queries';
import { resolveCompetitionSeason } from '@/lib/competitions/league-season-query';
import { SeoBreadcrumb } from '@/components/chrome/SeoBreadcrumb';
import { FaqPageJsonLd } from '@/components/seo/FaqPageJsonLd';
import { LeagueStandingsTab } from '@/components/league/LeagueStandingsTab';
import { BOTOLA_COMPETITION_HUB } from '@/lib/seo/botola-season-opener';
import { botolaClassementPath } from '@/lib/seo/botola-classement';
import {
  BOTOLA_2_COMPETITION_ID,
  BOTOLA_2_COMPETITION_HUB,
  botola2ClassementTableHash,
  botola2ClassementTableHashAliases,
  botola2CompetitionFixturesHref,
  botola2CompetitionStandingsHref,
  botola2SeasonLabel,
} from '@/lib/seo/botola-2-classement';

async function getCachedBotola2Standings(seasonYear: number) {
  'use cache';
  cacheLife('minutes');
  return getStandings(db, BOTOLA_2_COMPETITION_ID, seasonYear);
}

export async function Botola2ClassementPage({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'botola2Classement' });
  const { seasonYear } = await resolveCompetitionSeason(BOTOLA_2_COMPETITION_ID, null);
  const season = botola2SeasonLabel(seasonYear);
  const standings = seasonYear != null ? await getCachedBotola2Standings(seasonYear) : [];

  const hubHref = BOTOLA_2_COMPETITION_HUB[locale];
  const fixturesHref = botola2CompetitionFixturesHref(locale);
  const standingsHref = botola2CompetitionStandingsHref(locale);
  const proClassementHref = botolaClassementPath(locale);
  const proHubHref = BOTOLA_COMPETITION_HUB[locale];
  const marocHref = `/${locale}/edition/maroc`;
  const homeHref = `/${locale}`;
  const tableHash = botola2ClassementTableHash(locale);
  const tableAliases = botola2ClassementTableHashAliases(locale);

  const faqs = [
    { q: t('faq1q'), a: t('faq1a', { season }) },
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
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t('lead', { season })}</p>

      <section id={tableHash} className="mt-8 scroll-mt-24">
        {tableAliases.map((alias) => (
          <div key={alias} id={alias} className="h-0 w-0 overflow-hidden" aria-hidden />
        ))}
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-text-primary">{t('tableTitle', { season })}</h2>
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
          <Link href={proClassementHref} className="text-accent-azure hover:underline">
            {t('linkBotolaProClassement')}
          </Link>
          <Link href={proHubHref} className="text-accent-azure hover:underline">
            {t('linkBotolaPro')}
          </Link>
          <Link href={hubHref} className="text-accent-azure hover:underline">
            {t('linkBotola2')}
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
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {t('vsNewsBody', { season })}
        </p>
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
