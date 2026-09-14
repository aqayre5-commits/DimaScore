/**
 * SEO title + description templates for the hub pages — league landing, team, player —
 * keyed on locale. Copy mirrors the SEO blueprint (Section 01, "Hubs") and report §E.
 *
 * Same conventions as match-metadata: keyword-first, hyphen/colon separators (no pipes),
 * no brand suffix, localized descriptor. Pure and framework-free for unit testing.
 * Cups keep their own cup-content metadata; standings has no dedicated route yet (deferred).
 */

export interface Meta {
  title: string;
  description: string;
}

type Builder<T> = (v: T) => Meta;
type ByLocale<T> = Record<string, Builder<T>>;

function pick<T>(map: ByLocale<T>, locale: string): Builder<T> {
  return map[locale] ?? map.fr;
}

// ── League landing ──

interface LeagueVars {
  competition: string;
  /** Full season range, e.g. "2025–2026". */
  seasonLabel: string;
}

const LEAGUE: ByLocale<LeagueVars> = {
  fr: ({ competition, seasonLabel }) => ({
    title: `${competition} ${seasonLabel} : classement, résultats & calendrier`,
    description: `Suivez la ${competition} ${seasonLabel} : classement en direct, résultats, calendrier des journées, buteurs et statistiques des clubs.`,
  }),
  en: ({ competition, seasonLabel }) => ({
    title: `${competition} ${seasonLabel}: table, results & fixtures`,
    description: `Follow the ${competition} ${seasonLabel}: live table, results, fixture calendar, top scorers and club statistics.`,
  }),
  ar: ({ competition, seasonLabel }) => ({
    title: `${competition} ${seasonLabel}: الترتيب والنتائج والمباريات`,
    description: `تابع ${competition} ${seasonLabel}: الترتيب المباشر والنتائج وجدول المباريات والهدّافين وإحصائيات الأندية.`,
  }),
};

export function buildLeagueMeta(input: LeagueVars & { locale: string }): Meta {
  return pick(
    LEAGUE,
    input.locale,
  )({ competition: input.competition, seasonLabel: input.seasonLabel });
}

// ── Team ──

interface TeamVars {
  team: string;
}

const TEAM: ByLocale<TeamVars> = {
  fr: ({ team }) => ({
    title: `${team} : effectif, calendrier, résultats & stats`,
    description: `${team} : effectif complet, prochain match, derniers résultats, classement et statistiques de la saison.`,
  }),
  en: ({ team }) => ({
    title: `${team}: squad, fixtures, results & stats`,
    description: `${team}: full squad, next match, latest results, standings and season statistics.`,
  }),
  ar: ({ team }) => ({
    title: `${team}: التشكيلة والمباريات والنتائج`,
    description: `${team}: التشكيلة الكاملة والمباراة القادمة وآخر النتائج والترتيب وإحصائيات الموسم.`,
  }),
};

export function buildTeamMeta(input: TeamVars & { locale: string }): Meta {
  return pick(TEAM, input.locale)({ team: input.team });
}

// ── Player ──

interface PlayerVars {
  player: string;
}

const PLAYER: ByLocale<PlayerVars> = {
  fr: ({ player }) => ({
    title: `${player} : stats, profil & actualités`,
    description: `${player} : statistiques détaillées, profil, club actuel et dernières actualités.`,
  }),
  en: ({ player }) => ({
    title: `${player}: stats, profile & news`,
    description: `${player}: detailed statistics, profile, current club and latest news.`,
  }),
  ar: ({ player }) => ({
    title: `${player}: إحصائيات وملف اللاعب والأخبار`,
    description: `${player}: إحصائيات مفصّلة وملف اللاعب والنادي الحالي وآخر الأخبار.`,
  }),
};

export function buildPlayerMeta(input: PlayerVars & { locale: string }): Meta {
  return pick(PLAYER, input.locale)({ player: input.player });
}
