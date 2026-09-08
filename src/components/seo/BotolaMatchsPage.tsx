import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n/config';
import { db } from '@/lib/db/client';
import { getLeagueRounds, getCurrentRound, getLeagueFixtures } from '@/lib/db/queries/league';
import { SeoBreadcrumb } from '@/components/chrome/SeoBreadcrumb';
import { FaqPageJsonLd } from '@/components/seo/FaqPageJsonLd';
import { LeagueFixturesTab } from '@/components/league/LeagueFixturesTab';
import {
  BOTOLA_SEASON_OPENER_YEAR,
  BOTOLA_SEASON_OPENER_COMPETITION_ID,
  BOTOLA_COMPETITION_HUB,
  botolaCompetitionFixturesHref,
  botolaCompetitionStandingsHref,
  botolaSeasonOpenerPath,
} from '@/lib/seo/botola-season-opener';
import { botolaClassementPath } from '@/lib/seo/botola-classement';
import { botola2CompetitionFixturesHref } from '@/lib/seo/botola-2-classement';
import { botolaMatchsEmbedHash, botolaMatchsEmbedHashAliases } from '@/lib/seo/botola-matchs';

async function getCachedBotola2026Fixtures() {
  'use cache';
  cacheLife('minutes');
  const competitionId = BOTOLA_SEASON_OPENER_COMPETITION_ID;
  const seasonYear = BOTOLA_SEASON_OPENER_YEAR;
  const [rounds, currentRound, fixtures] = await Promise.all([
    getLeagueRounds(db, competitionId, seasonYear),
    getCurrentRound(db, competitionId, seasonYear),
    getLeagueFixtures(db, competitionId, seasonYear),
  ]);
  return {
    rounds,
    defaultRound: currentRound ?? 1,
    fixtures,
  };
}

export async function BotolaMatchsPage({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'botolaMatchs' });
  const embed = await getCachedBotola2026Fixtures();

  const hubHref = BOTOLA_COMPETITION_HUB[locale];
  const fixturesHref = botolaCompetitionFixturesHref(locale);
  const standingsHref = botolaCompetitionStandingsHref(locale);
  const classementHref = botolaClassementPath(locale);
  const calendarHref = botolaSeasonOpenerPath(locale);
  const botola2FixturesHref = botola2CompetitionFixturesHref(locale);
  const marocHref = `/${locale}/edition/maroc`;
  const homeHref = `/${locale}`;
  const embedHash = botolaMatchsEmbedHash(locale);
  const embedAliases = botolaMatchsEmbedHashAliases(locale);

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

      <section id={embedHash} className="mt-8 scroll-mt-24">
        {embedAliases.map((alias) => (
          <div key={alias} id={alias} className="h-0 w-0 overflow-hidden" aria-hidden />
        ))}
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
        <h2 className="text-lg font-semibold text-text-primary">{t('howToFollowTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t('howToFollowBody')}</p>
        <nav className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href={fixturesHref} className="text-accent-azure hover:underline">
            {t('ctaFixtures')}
          </Link>
          <Link href={standingsHref} className="text-accent-azure hover:underline">
            {t('ctaStandings')}
          </Link>
          <Link href={classementHref} className="text-accent-azure hover:underline">
            {t('ctaClassementLanding')}
          </Link>
          <Link href={calendarHref} className="text-accent-azure hover:underline">
            {t('ctaCalendar')}
          </Link>
        </nav>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary">{t('ctaTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t('ctaBody')}</p>
        <nav className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href={classementHref} className="text-accent-azure hover:underline">
            {t('ctaClassementLanding')}
          </Link>
          <Link href={calendarHref} className="text-accent-azure hover:underline">
            {t('ctaCalendar')}
          </Link>
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
          <Link href={hubHref} className="text-accent-azure hover:underline">
            {t('linkBotola')}
          </Link>
          <Link href={botola2FixturesHref} className="text-accent-azure hover:underline">
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
        <h2 className="text-lg font-semibold text-text-primary">{t('vsBotola2Title')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t('vsBotola2Body')}</p>
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
