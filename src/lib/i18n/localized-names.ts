/**
 * Arabic-name helpers for render sites that build a label straight from a stored name record
 * (`name[locale] ?? name.en`). Each returns null for non-Arabic locales or when no Arabic name is
 * known, so callers can put it at the head of their existing fallback chain:
 *
 *   arabicTeamName(team, locale) ?? team.name[locale] ?? team.name['en']
 */
import { localizedTeamName } from '@/lib/constants/team-names-i18n';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import { AR_COMPETITIONS_BY_EN } from './feed-labels-ar';

const ARABIC = /[\u0600-\u06FF]/;
const arabic = (v: string | null | undefined) => (v && ARABIC.test(v) ? v : null);

type TeamNameSource =
  | {
      id?: number | string | null;
      name?: Record<string, string> | null;
      shortName?: Record<string, string> | null;
      countryCode?: string | null;
      isNational?: boolean | null;
    }
  | null
  | undefined;

export function arabicTeamName(team: TeamNameSource, locale: string): string | null {
  if (locale !== 'ar' || !team) return null;
  const name = team.name ?? {};
  const id = team.id == null ? null : Number(team.id);
  return (
    arabic(name['ar']) ??
    localizedTeamName(
      { id, name, countryCode: team.countryCode ?? null, isNational: team.isNational ?? null },
      'ar',
    ) ??
    arabic(team.shortName?.['ar']) ??
    null
  );
}

type CompetitionNameSource =
  | {
      id?: number | string | null;
      name?: Record<string, string> | null;
      slug?: string | null;
    }
  | null
  | undefined;

export function arabicCompetitionName(comp: CompetitionNameSource, locale: string): string | null {
  if (locale !== 'ar' || !comp) return null;
  const name = comp.name ?? {};
  if (comp.id != null) {
    const curated = getLocalizedCompetitionName(
      { id: Number(comp.id), name, slug: comp.slug ?? '' },
      'ar',
    );
    if (arabic(curated)) return curated;
  }
  return arabic(name['ar']) ?? AR_COMPETITIONS_BY_EN[name['en'] ?? ''] ?? null;
}

/**
 * Display name for a team row joined in a query (id + name jsonb), for any locale:
 * Arabic via {@link arabicTeamName}, otherwise name[locale] → name.en → `fallback`
 * (e.g. the English team name copied into a stats feed).
 */
export function teamLabel(team: TeamNameSource, locale: string, fallback = ''): string {
  return (
    arabicTeamName(team, locale) ??
    (locale === 'ar' ? null : (team?.name?.[locale] ?? null)) ??
    team?.name?.['en'] ??
    fallback
  );
}
