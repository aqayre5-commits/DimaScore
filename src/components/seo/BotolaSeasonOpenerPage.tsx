import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n/config';
import { db } from '@/lib/db/client';
import { getStandings } from '@/lib/db/queries';
import { getLeagueRounds, getCurrentRound, getLeagueFixtures } from '@/lib/db/queries/league';
import { SeoBreadcrumb } from '@/components/chrome/SeoBreadcrumb';
import { FaqPageJsonLd } from '@/components/seo/FaqPageJsonLd';
import { LeagueFixturesTab } from '@/components/league/LeagueFixturesTab';
import { LeagueStandingsTab } from '@/components/league/LeagueStandingsTab';
import {
  BOTOLA_SEASON_OPENER_YEAR,
  BOTOLA_SEASON_OPENER_COMPETITION_ID,
  BOTOLA_SEASON_OPENER_HIGHLIGHTS,
  BOTOLA_COMPETITION_HUB,
  botolaCompetitionFixturesHref,
  botolaCompetitionStandingsHref,
} from '@/lib/seo/botola-season-opener';

async function getCachedBotola2026Embed() {
  'use cache';
  cacheLife('minutes');
  const competitionId = BOTOLA_SEASON_OPENER_COMPETITION_ID;
  const seasonYear = BOTOLA_SEASON_OPENER_YEAR;
  const [standings, rounds, currentRound, fixtures] = await Promise.all([
    getStandings(db, competitionId, seasonYear),
    getLeagueRounds(db, competitionId, seasonYear),
    getCurrentRound(db, competitionId, seasonYear),
    getLeagueFixtures(db, competitionId, seasonYear),
  ]);
  return {
    standings,
    rounds,
    defaultRound: currentRound ?? 1,
    fixtures,
    seasonYear,
  };
}

export async function BotolaSeasonOpenerPage({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'botolaSeasonOpener' });
  const embed = await getCachedBotola2026Embed();

  const hubHref = BOTOLA_COMPETITION_HUB[locale];
  const fixturesHref = botolaCompetitionFixturesHref(locale);
  const standingsHref = botolaCompetitionStandingsHref(locale);
  const marocHref = `/${locale}/edition/maroc`;
  const homeHref = `/${locale}`;

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

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary">{t('startDateTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t('startDateBody')}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary">{t('j1Title')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t('j1Body')}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary">{t('highlightsTitle')}</h2>
        <ul className="mt-3 divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
          {BOTOLA_SEASON_OPENER_HIGHLIGHTS.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  {t(item.roundKey)}
                </p>
                <p className="text-sm font-medium text-text-primary">{t(item.pairingKey)}</p>
                <p className="text-xs text-text-tertiary">{t('kickoffTbc')}</p>
              </div>
              <Link
                href={fixturesHref}
                className="text-sm font-medium text-accent-azure hover:underline"
              >
                {t('highlightCalendarCta')}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-text-primary">{t('fixturesTitle')}</h2>
          <Link
            href={fixturesHref}
            className="text-sm font-medium text-accent-azure hover:underline"
          >
            {t('ctaFixtures')}
          </Link>
        </div>
        <p className="mb-3 text-xs text-text-tertiary">{t('widgetNote')}</p>
        {embed.rounds.length === 0 && embed.fixtures.length === 0 ? (
          <p className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-6 text-center text-sm text-text-tertiary">
            {t('fixturesEmpty')}
          </p>
        ) : (
          <LeagueFixturesTab
            fixtures={embed.fixtures}
            rounds={embed.rounds}
            defaultRound={embed.defaultRound}
            locale={locale}
          />
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-text-primary">{t('standingsTitle')}</h2>
          <Link
            href={standingsHref}
            className="text-sm font-medium text-accent-azure hover:underline"
          >
            {t('ctaStandings')}
          </Link>
        </div>
        {embed.standings.length === 0 ? (
          <p className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-6 text-center text-sm text-text-tertiary">
            {t('standingsEmpty')}
          </p>
        ) : (
          <LeagueStandingsTab standings={embed.standings} locale={locale} compact />
        )}
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
