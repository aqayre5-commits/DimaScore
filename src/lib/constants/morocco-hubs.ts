/**
 * The Moroccan football hub cluster: Morocco national team, Lions abroad, the Morocco edition,
 * Botola Pro (+ its standings landing), AFCON and the World Cup (+ African qualifiers).
 * All URLs already exist; this only decides which of them cross-link (R5).
 */
import type { Locale } from '@/lib/i18n/config';
import { buildCompetitionHrefById } from '@/lib/constants/competitions-mega-menu';
import { BOTOLA_CLASSEMENT_SLUGS } from '@/lib/seo/botola-classement';

export type MoroccoHubKey =
  | 'morocco'
  | 'lionsAbroad'
  | 'edition'
  | 'botola'
  | 'botolaStandings'
  | 'afcon'
  | 'worldCup'
  | 'wcQualAfrica';

export const MOROCCO_HUB_COMPETITIONS = {
  botola: 200,
  afcon: 6,
  worldCup: 1,
  wcQualAfrica: 29,
} as const;

/** Competition IDs whose hub page shows the cluster block (incl. AFCON qualifiers, 36). */
export const MOROCCO_HUB_COMPETITION_IDS = new Set<number>([200, 6, 1, 29, 36]);

export const MOROCCO_TEAM_ID = 31;

const LABELS: Record<Locale, Record<MoroccoHubKey, { label: string; hint: string }>> = {
  en: {
    morocco: { label: 'Morocco national team', hint: 'Fixtures, results and squad' },
    lionsAbroad: { label: 'Lions abroad', hint: 'Moroccan players at clubs worldwide' },
    edition: { label: 'Moroccan football today', hint: 'Live Moroccan matches and results' },
    botola: { label: 'Botola Pro', hint: 'Table, rounds and top scorers' },
    botolaStandings: { label: 'Botola Pro standings', hint: 'The live league table' },
    afcon: { label: 'AFCON', hint: 'Africa Cup of Nations hub' },
    worldCup: { label: 'World Cup 2026', hint: 'Groups, bracket and results' },
    wcQualAfrica: { label: 'World Cup qualifiers: Africa', hint: 'CAF qualifying groups' },
  },
  fr: {
    morocco: { label: 'Équipe du Maroc', hint: 'Calendrier, résultats et effectif' },
    lionsAbroad: {
      label: "Lions de l'Atlas à l'étranger",
      hint: 'Les Marocains dans les clubs du monde',
    },
    edition: {
      label: "Le foot marocain aujourd'hui",
      hint: 'Matchs et résultats marocains en direct',
    },
    botola: { label: 'Botola Pro', hint: 'Classement, journées et buteurs' },
    botolaStandings: { label: 'Classement Botola Pro', hint: 'Le classement en direct' },
    afcon: { label: 'CAN', hint: "Coupe d'Afrique des nations" },
    worldCup: { label: 'Coupe du monde 2026', hint: 'Groupes, tableau et résultats' },
    wcQualAfrica: { label: 'Qualifications Mondial : Afrique', hint: 'Groupes qualificatifs CAF' },
  },
  ar: {
    morocco: { label: 'المنتخب المغربي', hint: 'المباريات والنتائج والتشكيلة' },
    lionsAbroad: { label: 'أسود الأطلس في الخارج', hint: 'اللاعبون المغاربة في أندية العالم' },
    edition: { label: 'الكرة المغربية اليوم', hint: 'مباريات ونتائج مغربية مباشرة' },
    botola: { label: 'البطولة الاحترافية', hint: 'الترتيب والجولات والهدافون' },
    botolaStandings: { label: 'ترتيب البطولة الاحترافية', hint: 'الترتيب المباشر' },
    afcon: { label: 'كأس أمم إفريقيا', hint: 'صفحة البطولة القارية' },
    worldCup: { label: 'كأس العالم 2026', hint: 'المجموعات والأدوار الإقصائية والنتائج' },
    wcQualAfrica: { label: 'تصفيات كأس العالم: إفريقيا', hint: 'مجموعات تصفيات الكاف' },
  },
};

export const MOROCCO_HUB_HEADING: Record<Locale, string> = {
  en: 'Moroccan football on DimaScore',
  fr: 'Le football marocain sur DimaScore',
  ar: 'الكرة المغربية على ديماسكور',
};

export interface MoroccoHubLink {
  key: MoroccoHubKey;
  href: string;
  label: string;
  hint: string;
}

export function moroccoHubHref(key: MoroccoHubKey, locale: Locale): string | null {
  switch (key) {
    case 'morocco':
      return `/${locale}/equipe/morocco-${MOROCCO_TEAM_ID}`;
    case 'lionsAbroad':
      return `/${locale}/lions-abroad`;
    case 'edition':
      return `/${locale}/edition/maroc`;
    case 'botolaStandings':
      return `/${locale}/${BOTOLA_CLASSEMENT_SLUGS[locale]}`;
    default:
      return buildCompetitionHrefById(MOROCCO_HUB_COMPETITIONS[key], locale);
  }
}

const ORDER: MoroccoHubKey[] = [
  'morocco',
  'lionsAbroad',
  'edition',
  'botola',
  'botolaStandings',
  'afcon',
  'worldCup',
  'wcQualAfrica',
];

/** Every hub except the current one (and any whose URL can't be built). */
export function moroccoHubLinks(locale: Locale, current?: MoroccoHubKey | null): MoroccoHubLink[] {
  return ORDER.filter((k) => k !== current).flatMap((key) => {
    const href = moroccoHubHref(key, locale);
    return href ? [{ key, href, ...LABELS[locale][key] }] : [];
  });
}

/** Which hub a competition page is (so it isn't linked to itself); qualifiers etc. → null. */
export function hubKeyForCompetition(competitionId: number): MoroccoHubKey | null {
  for (const [key, id] of Object.entries(MOROCCO_HUB_COMPETITIONS)) {
    if (id === competitionId) return key as MoroccoHubKey;
  }
  return null;
}
