import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db/client';
import { getEditorialHeroData, type EditorialHeroData } from '@/lib/db/queries/editorial-hero';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { formatMatchTime } from '@/lib/utils/date';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import type { Locale } from '@/lib/i18n/config';

interface EditorialHeroProps {
  locale: Locale;
}

const WC_2026_PATHS: Record<Locale, string> = {
  fr: '/fr/competition/fifa/coupe-du-monde-2026',
  en: '/en/competition/fifa/world-cup-2026',
  ar: '/ar/competition/فيفا/كأس-العالم-2026',
};

export async function EditorialHero({ locale }: EditorialHeroProps) {
  const [data, t] = await Promise.all([
    getEditorialHeroData(db),
    getTranslations({ locale, namespace: 'editorialHero' }),
  ]);

  const { content, href } = resolveContent(data, locale, t);

  return (
    <section
      className="sticky top-[104px] z-30 border-b border-border-subtle bg-bg-surface"
      data-mode={data.mode}
      aria-label={t('label')}
    >
      <Link
        href={href}
        className="mx-auto flex h-[72px] max-w-[1280px] items-center gap-3 px-4 transition-colors hover:bg-bg-surface-2"
      >
        {content}
      </Link>
    </section>
  );
}

function resolveContent(
  data: EditorialHeroData,
  locale: Locale,
  t: Awaited<ReturnType<typeof getTranslations>>,
): { content: React.ReactNode; href: string } {
  switch (data.mode) {
    case 'A': {
      const { fixture } = data;
      const home = getTeamDisplayName(fixture.homeTeam, locale);
      const away = getTeamDisplayName(fixture.awayTeam, locale);
      const compName = fixture.competitionName[locale] || fixture.competitionName.en || '';
      return {
        content: (
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="flex shrink-0 items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-score-live opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-score-live" />
              </span>
              <span className="text-xs font-bold uppercase text-score-live">{t('live')}</span>
            </span>
            <h2 className="truncate text-sm font-semibold text-text-primary">
              {home} {fixture.homeScore} – {fixture.awayScore} {away}
            </h2>
            <p className="hidden truncate text-xs text-text-secondary sm:block">
              {compName} · {fixture.minute}&apos;
            </p>
          </div>
        ),
        href: `/${locale}/match/${fixture.id}`,
      };
    }

    case 'B': {
      const { fixture, daysUntil } = data;
      const home = getTeamDisplayName(fixture.homeTeam, locale);
      const away = getTeamDisplayName(fixture.awayTeam, locale);
      const compName = fixture.competitionName[locale] || fixture.competitionName.en || '';
      const kickoffTime = formatMatchTime(fixture.kickoffAt, locale);
      return {
        content: (
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="shrink-0 text-base">&#9917;</span>
            <h2 className="truncate text-sm font-semibold text-text-primary">
              {home} – {away}
            </h2>
            <p className="hidden truncate text-xs text-text-secondary sm:block">
              {compName} · {kickoffTime} · {t('daysShort', { days: daysUntil })}
            </p>
          </div>
        ),
        href: `/${locale}/match/${fixture.id}`,
      };
    }

    case 'C': {
      const { fixture } = data;
      const home = getTeamDisplayName(fixture.homeTeam, locale);
      const away = getTeamDisplayName(fixture.awayTeam, locale);
      const kickoffTime = formatMatchTime(fixture.kickoffAt, locale);
      return {
        content: (
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="shrink-0 text-base">&#127942;</span>
            <h2 className="truncate text-sm font-semibold text-text-primary">
              {home} – {away}
            </h2>
            <p className="hidden truncate text-xs text-text-secondary sm:block">
              {t('botolaHighlight')} · {kickoffTime}
            </p>
          </div>
        ),
        href: `/${locale}/match/${fixture.id}`,
      };
    }

    case 'D': {
      const { daysUntil, moroccoGroup } = data;
      return {
        content: (
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="shrink-0 text-base">&#127942;</span>
            <h2 className="truncate text-sm font-semibold text-text-primary">
              {t('modeD', { days: daysUntil })}
            </h2>
            <p className="hidden truncate text-xs text-text-secondary sm:block">
              {t('moroccoInGroup', { group: moroccoGroup })}
            </p>
          </div>
        ),
        href: WC_2026_PATHS[locale],
      };
    }

    case 'E':
    default:
      return {
        content: (
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="shrink-0 text-base">&#129409;</span>
            <h2 className="truncate text-sm font-semibold text-text-primary">{t('modeE')}</h2>
          </div>
        ),
        href: WC_2026_PATHS[locale],
      };
  }
}
