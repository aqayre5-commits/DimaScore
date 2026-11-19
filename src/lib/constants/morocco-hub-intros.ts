/**
 * DRAFT hub intros (R5) — awaiting Abdilahi's approval. NOT RENDERED while `approved` is false.
 *
 * Rules: factual, specific to each hub, no invented stats, no results that the data could
 * contradict, no boilerplate shared between hubs. To publish one, review all three languages and
 * flip its `approved` to true (MoroccoHubLinks renders it above the links).
 *
 * Sources and data checks for each factual claim are listed in PR #34 (intro claims) and must be
 * re-checked before any intro is approved.
 */
import type { Locale } from '@/lib/i18n/config';
import type { MoroccoHubKey } from './morocco-hubs';

export interface HubIntro {
  approved: boolean;
  text: Record<Locale, string>;
}

export const MOROCCO_HUB_INTROS: Partial<Record<MoroccoHubKey, HubIntro>> = {
  morocco: {
    approved: false,
    text: {
      en: "Morocco's national team, the Atlas Lions, is run by the Royal Moroccan Football Federation (FRMF). In 2022 it became the first African and Arab side to reach a World Cup semi-final. This page follows every Morocco fixture, result and squad call-up, with links to the players' clubs abroad.",
      fr: "L'équipe du Maroc, les Lions de l'Atlas, dépend de la Fédération royale marocaine de football (FRMF). En 2022, elle est devenue la première sélection africaine et arabe à atteindre une demi-finale de Coupe du monde. Cette page suit chaque match, résultat et convocation du Maroc, avec les clubs de ses internationaux à l'étranger.",
      ar: 'المنتخب المغربي، أسود الأطلس، تشرف عليه الجامعة الملكية المغربية لكرة القدم. في 2022 أصبح أول منتخب إفريقي وعربي يبلغ نصف نهائي كأس العالم. تتابع هذه الصفحة كل مباريات المغرب ونتائجه واستدعاءاته، مع أندية لاعبيه المحترفين في الخارج.',
    },
  },
  lionsAbroad: {
    approved: false,
    text: {
      en: 'Many of Morocco’s internationals play their club football outside the Botola. Lions abroad lists those players with their clubs and their latest matches, so you can follow them between international windows.',
      fr: "De nombreux internationaux marocains jouent en club hors de la Botola. Lions à l'étranger les répertorie avec leur club et leurs derniers matchs, pour les suivre entre deux rassemblements.",
      ar: 'يلعب كثير من الدوليين المغاربة لأندية خارج البطولة الاحترافية. تجمع صفحة أسود الأطلس في الخارج هؤلاء اللاعبين مع أنديتهم وآخر مبارياتهم، لمتابعتهم بين فترات التوقف الدولي.',
    },
  },
  edition: {
    approved: false,
    text: {
      en: "The Morocco edition puts Moroccan football first: today's Botola Pro and Botola 2 matches, the Coupe du Trône, Moroccan clubs in CAF competitions and the national teams, live and in one place.",
      fr: "L'édition Maroc met le football marocain en premier : les matchs du jour de Botola Pro et Botola 2, la Coupe du Trône, les clubs marocains en compétitions CAF et les sélections nationales, en direct et au même endroit.",
      ar: 'تضع نسخة المغرب الكرة المغربية في المقدمة: مباريات اليوم في البطولة الاحترافية والقسم الثاني وكأس العرش، والأندية المغربية في مسابقات الكاف، والمنتخبات الوطنية، مباشرة وفي مكان واحد.',
    },
  },
  botola: {
    approved: false,
    text: {
      en: 'Botola Pro is Morocco’s top division, organised by the LNFP: 16 clubs play each other home and away over 30 matchdays. Here you get the full table, every round’s fixtures and results, and the top scorers, updated as matches finish.',
      fr: 'La Botola Pro est la première division marocaine, organisée par la LNFP : 16 clubs s’affrontent en matchs aller et retour sur 30 journées. Vous y trouvez le classement complet, les matchs et résultats de chaque journée et les meilleurs buteurs, mis à jour à la fin des matchs.',
      ar: 'البطولة الاحترافية هي القسم الأول في المغرب وتنظمها العصبة الوطنية لكرة القدم الاحترافية: 16 ناديًا يتواجهون ذهابًا وإيابًا على مدى 30 جولة. تجد هنا الترتيب الكامل ومباريات ونتائج كل جولة والهدافين، مع التحديث عند نهاية المباريات.',
    },
  },
  afcon: {
    approved: false,
    text: {
      en: 'Morocco hosted the 2025 Africa Cup of Nations, played from December 2025 to January 2026 with 24 teams. This hub has the groups, the knockout bracket, every match page and the host stadiums.',
      fr: "Le Maroc a accueilli la Coupe d'Afrique des nations 2025, disputée de décembre 2025 à janvier 2026 avec 24 sélections. Ce hub regroupe les groupes, le tableau final, chaque page de match et les stades hôtes.",
      ar: 'استضاف المغرب كأس أمم إفريقيا 2025 التي أقيمت من دجنبر 2025 إلى يناير 2026 بمشاركة 24 منتخبًا. تضم هذه الصفحة المجموعات والأدوار الإقصائية وصفحات كل المباريات والملاعب المستضيفة.',
    },
  },
  worldCup: {
    approved: false,
    text: {
      en: 'The 2026 World Cup was the first with 48 teams, hosted by Canada, Mexico and the United States in June and July 2026. Morocco qualified from the CAF section. Groups, the 32-team knockout bracket and every match are here.',
      fr: 'La Coupe du monde 2026 a été la première à 48 équipes, organisée par le Canada, le Mexique et les États-Unis en juin et juillet 2026. Le Maroc s’est qualifié via la zone CAF. Groupes, tableau final à 32 et tous les matchs sont ici.',
      ar: 'كانت كأس العالم 2026 أول نسخة بمشاركة 48 منتخبًا، واستضافتها كندا والمكسيك والولايات المتحدة في يونيو ويوليوز 2026. تأهل المغرب عبر تصفيات الكاف. تجد هنا المجموعات وأدوار خروج المغلوب بـ32 منتخبًا وكل المباريات.',
    },
  },
};

/** Approved intro text for a hub, or null (drafts never render). */
export function approvedHubIntro(key: MoroccoHubKey, locale: Locale): string | null {
  const intro = MOROCCO_HUB_INTROS[key];
  return intro?.approved ? intro.text[locale] : null;
}
