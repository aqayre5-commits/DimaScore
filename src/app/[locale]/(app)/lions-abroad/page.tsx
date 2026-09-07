import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { BASE_URL } from '@/lib/constants/site';
import { SeoBreadcrumb } from '@/components/chrome/SeoBreadcrumb';
import { FaqPageJsonLd } from '@/components/seo/FaqPageJsonLd';
import { getLionsAbroadHubData } from '@/lib/db/queries/lions-abroad';
import { LionsAbroadFixtures } from '@/components/lions-abroad/LionsAbroadFixtures';
import { HomeLionsAbroad } from '@/components/homepage/HomeLionsAbroad';
import {
  findEntryByCompetitionId,
  buildCompetitionHref,
} from '@/lib/constants/competitions-mega-menu';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const META: Record<Locale, { title: string; description: string }> = {
  fr: {
    title: "Lions à l'étranger — Marocains en club | DimaScore",
    description:
      "Matchs, buts et passes des joueurs marocains à l'étranger : ce soir, ce week-end, et les 7 derniers jours. Sans cotes.",
  },
  en: {
    title: 'Lions Abroad — Moroccan players in Europe | DimaScore',
    description:
      'Fixtures, goals and assists from Moroccan players abroad: tonight, this weekend, and the last 7 days. No odds.',
  },
  ar: {
    title: 'أسود الأطلس بالخارج — المحترفون المغاربة | ديماسكور',
    description:
      'مباريات وأهداف وتمريرات اللاعبين المغاربة في الخارج: الليلة، نهاية الأسبوع، وآخر 7 أيام. بدون نسب رهان.',
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const typed = locale as Locale;
  const meta = META[typed];
  const pageUrl = `${BASE_URL}/${locale}/lions-abroad`;
  const languages: Record<string, string> = {};
  for (const loc of locales) languages[loc] = `${BASE_URL}/${loc}/lions-abroad`;
  languages['x-default'] = `${BASE_URL}/${defaultLocale}/lions-abroad`;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: pageUrl, languages },
    robots: { index: true, follow: true },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: pageUrl,
      siteName: 'DimaScore',
      locale: typed === 'fr' ? 'fr_FR' : typed === 'ar' ? 'ar_MA' : 'en_US',
      type: 'website',
    },
  };
}

export default async function LionsAbroadPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'lionsAbroadPage' });
  const tHome = await getTranslations({ locale, namespace: 'homepage' });
  const { fixtures, performances } = await getLionsAbroadHubData();

  const botola = findEntryByCompetitionId(200);
  const botolaHref = botola ? buildCompetitionHref(botola, typedLocale) : `/${locale}`;
  const faqs = [
    { q: t('faq1q'), a: t('faq1a') },
    { q: t('faq2q'), a: t('faq2a') },
    { q: t('faq3q'), a: t('faq3a') },
  ];

  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-6">
      <SeoBreadcrumb
        segments={[{ label: 'DimaScore', href: `/${locale}` }, { label: t('title') }]}
        compact
      />
      <h1 className="mt-2 text-2xl font-bold text-text-primary">{t('title')}</h1>
      <p className="mt-2 text-sm text-text-secondary">{t('intro')}</p>

      <div className="mt-6">
        <LionsAbroadFixtures
          fixtures={fixtures}
          locale={typedLocale}
          labels={{
            live: t('liveStrip'),
            tonight: t('tonight'),
            weekend: t('weekend'),
            upcoming: t('upcoming'),
            emptyFixtures: t('emptyFixtures'),
            vs: t('vs'),
          }}
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {t('last7d')}
        </h2>
        {performances.length === 0 ? (
          <p className="text-sm text-text-tertiary">{t('emptyPerformances')}</p>
        ) : (
          <HomeLionsAbroad
            performances={performances}
            locale={typedLocale}
            labels={{
              lionsAbroad: tHome('lionsAbroad'),
              last48h: tHome('last48h'),
              goal: tHome('goal'),
              assist: tHome('assist'),
              cleanSheet: tHome('cleanSheet'),
              viewAll: tHome('viewAll'),
            }}
          />
        )}
      </section>

      <section className="mt-8 rounded-xl border border-border-subtle bg-bg-surface px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {t('legendTitle')}
        </h2>
        <ul className="mt-2 flex flex-wrap gap-2 text-[11px]">
          <li className="rounded-full bg-accent-azure/10 px-2 py-0.5 font-medium text-accent-azure">
            {tHome('goal')}
          </li>
          <li className="rounded-full bg-accent-emerald/10 px-2 py-0.5 font-medium text-accent-emerald">
            {tHome('assist')}
          </li>
          <li className="rounded-full bg-accent-gold/10 px-2 py-0.5 font-medium text-accent-gold">
            {tHome('cleanSheet')}
          </li>
        </ul>
        <p className="mt-2 text-xs text-text-tertiary">{t('legendNote')}</p>
      </section>

      <nav className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href={`/${locale}/edition/maroc`} className="text-accent-azure hover:underline">
          {t('linkMaroc')}
        </Link>
        <Link href={botolaHref} className="text-accent-azure hover:underline">
          {t('linkBotola')}
        </Link>
        <Link href={`/${locale}/equipe/morocco-31`} className="text-accent-azure hover:underline">
          {t('linkAtlasLions')}
        </Link>
      </nav>

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
