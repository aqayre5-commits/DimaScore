/**
 * DRAFT hub intros (R5) — awaiting Abdilahi's approval. NOT RENDERED while `approved` is false.
 *
 * Rules: factual, specific to each hub, no invented stats, no results that the data could
 * contradict, no boilerplate shared between hubs. To publish one, review all three languages and
 * flip its `approved` to true (MoroccoHubLinks renders it above the links).
 *
 * Only claims with a fetched primary source (or the site's own data) are kept; each is listed in
 * evidence/r5/intro-claims.md and PR #34. Everything else (who runs the national team, how many
 * internationals play abroad, World Cup 2026 facts, the editions' competition list, the number of
 * matchdays) was cut in review and must have a source before it comes back.
 *
 * Kept, with their source:
 *  - 2022: first African and Arab side in a World Cup semi-final (FIFA match report, 14 Dec 2022);
 *  - Botola Pro: 16 clubs in 2026/27, organised by the LNFP (lnfp.ma);
 *  - AFCON 2025: 21 Dec 2025 to 18 Jan 2026, 24 teams (CAF), read from tournament-metadata.ts.
 * Arabic dates use Moroccan month names via the shared helper in utils/date-range.ts.
 */
import type { Locale } from '@/lib/i18n/config';
import type { MoroccoHubKey } from './morocco-hubs';
import { getMetadataForCompetitionSeason } from './tournament-metadata';
import { formatCalendarDay } from '@/lib/utils/date-range';

export interface HubIntro {
  approved: boolean;
  text: Record<Locale, string>;
}

const AFCON = getMetadataForCompetitionSeason(6, 2025);
if (!AFCON || !('kickoffDate' in AFCON)) throw new Error('AFCON 2025 metadata is missing');
const AFCON_FROM = (l: Locale) => formatCalendarDay(AFCON.kickoffDate, l);
const AFCON_TO = (l: Locale) => formatCalendarDay(AFCON.finalDate, l);

export const MOROCCO_HUB_INTROS: Partial<Record<MoroccoHubKey, HubIntro>> = {
  morocco: {
    approved: false,
    text: {
      en: "Morocco's national team, the Atlas Lions, became the first African and Arab side to reach a World Cup semi-final in 2022. This page follows every Morocco fixture and result.",
      fr: "L'équipe du Maroc, les Lions de l'Atlas, est devenue en 2022 la première sélection africaine et arabe à atteindre une demi-finale de Coupe du monde. Cette page suit chaque match et chaque résultat du Maroc.",
      ar: 'المنتخب المغربي، أسود الأطلس، أصبح في 2022 أول منتخب إفريقي وعربي يبلغ نصف نهائي كأس العالم. تتابع هذه الصفحة كل مباريات المغرب ونتائجه.',
    },
  },
  lionsAbroad: {
    approved: false,
    text: {
      en: 'Lions abroad lists Moroccan players at clubs outside Morocco, with their clubs and their latest matches, so you can follow them between international windows.',
      fr: "Lions à l'étranger répertorie les joueurs marocains dans des clubs hors du Maroc, avec leur club et leurs derniers matchs, pour les suivre entre deux rassemblements.",
      ar: 'تجمع صفحة أسود الأطلس في الخارج اللاعبين المغاربة في أندية خارج المغرب مع أنديتهم وآخر مبارياتهم، لمتابعتهم بين فترات التوقف الدولي.',
    },
  },
  edition: {
    approved: false,
    text: {
      en: "The Morocco edition shows today's matches, live scores and results in one place, free and with no betting.",
      fr: "L'édition Maroc réunit les matchs du jour, les scores en direct et les résultats au même endroit, gratuitement et sans paris.",
      ar: 'تجمع نسخة المغرب مباريات اليوم والنتائج المباشرة والنتائج النهائية في مكان واحد، مجانًا ودون رهان.',
    },
  },
  botola: {
    approved: false,
    text: {
      en: 'Botola Pro is Morocco’s top division, organised by the LNFP, with 16 clubs in 2026/27. Here you get the full table, the fixtures and results, and the top scorers, updated as matches finish.',
      fr: 'La Botola Pro est la première division marocaine, organisée par la LNFP, avec 16 clubs en 2026/27. Vous y trouvez le classement complet, les matchs et résultats, et les meilleurs buteurs, mis à jour à la fin des matchs.',
      ar: 'البطولة الاحترافية هي القسم الأول في المغرب وتنظمها العصبة الوطنية لكرة القدم الاحترافية، بمشاركة 16 ناديًا في موسم 2026/27. تجد هنا الترتيب الكامل والمباريات والنتائج والهدافين، مع التحديث عند نهاية المباريات.',
    },
  },
  afcon: {
    approved: false,
    text: {
      en: `Morocco hosted the 2025 Africa Cup of Nations, played from ${AFCON_FROM('en')} to ${AFCON_TO('en')} with ${AFCON.teamsCount} teams. This hub has the groups, standings, fixtures and results.`,
      fr: `Le Maroc a accueilli la Coupe d'Afrique des nations 2025, disputée du ${AFCON_FROM('fr')} au ${AFCON_TO('fr')} avec ${AFCON.teamsCount} sélections. Ce hub regroupe les groupes, le classement, les matchs et les résultats.`,
      ar: `استضاف المغرب كأس أمم إفريقيا 2025 التي أقيمت من ${AFCON_FROM('ar')} إلى ${AFCON_TO('ar')} بمشاركة ${AFCON.teamsCount} منتخبًا. تضم هذه الصفحة المجموعات والترتيب والمباريات والنتائج.`,
    },
  },
  worldCup: {
    approved: false,
    text: {
      en: 'The 2026 World Cup hub follows the groups, the standings, every fixture and every result in one place, updated as matches finish.',
      fr: 'Le hub de la Coupe du monde 2026 réunit les groupes, le classement, chaque match et chaque résultat au même endroit, mis à jour à la fin des matchs.',
      ar: 'تجمع صفحة كأس العالم 2026 المجموعات والترتيب وكل المباريات وكل النتائج في مكان واحد، مع التحديث عند نهاية المباريات.',
    },
  },
};

/** Approved intro text for a hub, or null (drafts never render). */
export function approvedHubIntro(key: MoroccoHubKey, locale: Locale): string | null {
  const intro = MOROCCO_HUB_INTROS[key];
  return intro?.approved ? intro.text[locale] : null;
}
