/**
 * SEO title + description templates for the match page, keyed on locale × match state.
 *
 * Copy mirrors the SEO blueprint (Section 01). Principles: keyword-first, hyphen/colon
 * separators (never pipes in the pairing), no brand suffix (match titles are long), and one
 * varying token per state — kickoff intent (upcoming), "en direct/live" (live), or the score
 * (finished) — so each snippet stays distinct and resists Google's title rewrites.
 *
 * Pure and framework-free so it can be unit-tested against fixture data.
 */

export type MatchMetaState = 'upcoming' | 'live' | 'finished';

export interface MatchMetaInput {
  home: string;
  away: string;
  competition: string;
  locale: string;
  state: MatchMetaState;
  homeScore?: number | null;
  awayScore?: number | null;
  /**
   * Short kick-off date in Morocco time ("20 Nov"). Makes upcoming titles and every description
   * unique when the same pairing recurs (league legs, cups, seasons).
   */
  dateLabel?: string | null;
}

export interface MatchMeta {
  title: string;
  description: string;
}

interface TemplateVars {
  home: string;
  away: string;
  comp: string;
  /** "2–1" for a finished match; null otherwise (upcoming/live never read it). */
  score: string | null;
  /** " (20 Nov)"-style suffix pieces; empty strings when no date is known. */
  d: string;
  dIn: string;
}

type Template = (v: TemplateVars) => MatchMeta;

const TEMPLATES: Record<string, Record<MatchMetaState, Template>> = {
  // No "TV channel" promises: DimaScore has no broadcaster data, so titles promise what the page
  // actually shows (kick-off time, lineups, form, head-to-head).
  fr: {
    upcoming: ({ home, away, comp, d, dIn }) => ({
      title: `${home} – ${away}${d} : compo probable, heure & stats`,
      description: `${home} – ${away} en ${comp}${dIn} : heure du coup d'envoi (heure marocaine), compo probable, forme récente et historique des confrontations.`,
    }),
    live: ({ home, away, comp, dIn }) => ({
      title: `${home} – ${away} en direct : score live & stats`,
      description: `Score en direct de ${home} – ${away}${dIn} : buts minute par minute, compositions et statistiques live en ${comp}.`,
    }),
    finished: ({ home, away, comp, score, dIn }) => ({
      title: `${home} ${score} ${away} : résumé, buts & stats`,
      description: `Revivez ${home} ${score} ${away} en ${comp}${dIn} : buts, temps forts, compositions et statistiques complètes.`,
    }),
  },
  en: {
    upcoming: ({ home, away, comp, d, dIn }) => ({
      title: `${home} vs ${away}${d}: preview, lineups & kickoff`,
      description: `${home} vs ${away} in the ${comp}${dIn}: kickoff time (Morocco time), probable lineups, recent form and head-to-head history.`,
    }),
    live: ({ home, away, comp, dIn }) => ({
      title: `${home} vs ${away} live score & stats`,
      description: `Live score of ${home} vs ${away}${dIn}: goals minute by minute, lineups and live match statistics in the ${comp}.`,
    }),
    finished: ({ home, away, comp, score, dIn }) => ({
      title: `${home} ${score} ${away}: recap, goals & stats`,
      description: `Relive ${home} ${score} ${away} in the ${comp}${dIn}: goals, key moments, lineups and full match statistics.`,
    }),
  },
  ar: {
    upcoming: ({ home, away, comp, d, dIn }) => ({
      title: `${home} ضد ${away}${d}: التشكيلة المتوقعة وموعد المباراة`,
      description: `مباراة ${home} ضد ${away} في ${comp}${dIn}: موعد الانطلاق بتوقيت المغرب والتشكيلة المتوقعة والفورمة الأخيرة وتاريخ المواجهات.`,
    }),
    live: ({ home, away, comp, dIn }) => ({
      title: `${home} ضد ${away} بث مباشر: النتيجة لحظة بلحظة`,
      description: `النتيجة المباشرة لمباراة ${home} ضد ${away}${dIn}: الأهداف لحظة بلحظة والتشكيلات والإحصائيات المباشرة في ${comp}.`,
    }),
    finished: ({ home, away, comp, score, dIn }) => ({
      title: `${home} ${score} ${away}: ملخص المباراة والأهداف`,
      description: `ملخص مباراة ${home} و${away} (${score}) في ${comp}${dIn}: الأهداف وأبرز اللقطات والتشكيلات والإحصائيات الكاملة.`,
    }),
  },
};
function hasScore(a?: number | null, b?: number | null): boolean {
  return typeof a === 'number' && typeof b === 'number';
}

/**
 * Build the localized, state-varied match title + description. A "finished" match with no score
 * on record falls back to the neutral (upcoming) pairing rather than rendering "undefined".
 * Unknown locales fall back to French (the primary market).
 */
export function buildMatchMeta(input: MatchMetaInput): MatchMeta {
  const score = hasScore(input.homeScore, input.awayScore)
    ? `${input.homeScore}–${input.awayScore}`
    : null;
  const state: MatchMetaState = input.state === 'finished' && !score ? 'upcoming' : input.state;
  const byLocale = TEMPLATES[input.locale] ?? TEMPLATES.fr;
  const date = input.dateLabel?.trim();
  const d = date ? ` (${date})` : '';
  const dIn = date
    ? input.locale === 'ar'
      ? ` يوم ${date}`
      : input.locale === 'en'
        ? ` on ${date}`
        : ` le ${date}`
    : '';
  return byLocale[state]({
    home: input.home,
    away: input.away,
    comp: input.competition,
    score,
    d,
    dIn,
  });
}

/**
 * On-page <h1> for the match page — keyword-first, state-varied, no brand suffix (distinct from the
 * <title>, which carries the SERP copy). Finished shows the score; upcoming/live show the fixture
 * name with the locale's separator. Mirrors buildMatchMeta's finished-without-score fallback.
 */
export function buildMatchH1(input: MatchMetaInput): string {
  const score = hasScore(input.homeScore, input.awayScore)
    ? `${input.homeScore}–${input.awayScore}`
    : null;
  const vs = input.locale === 'en' ? 'vs' : input.locale === 'ar' ? 'ضد' : '–';
  const fixture =
    input.state === 'finished' && score
      ? `${input.home} ${score} ${input.away}`
      : `${input.home} ${vs} ${input.away}`;
  return `${fixture} — ${input.competition}`;
}
