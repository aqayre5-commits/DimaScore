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
}

type Template = (v: TemplateVars) => MatchMeta;

const TEMPLATES: Record<string, Record<MatchMetaState, Template>> = {
  fr: {
    upcoming: ({ home, away, comp }) => ({
      title: `${home} – ${away} : compo probable, heure & chaîne`,
      description: `Compo probable, heure du coup d'envoi et chaîne TV de ${home} – ${away} en ${comp}. Aperçu, forme récente et historique des confrontations.`,
    }),
    live: ({ home, away, comp }) => ({
      title: `${home} – ${away} en direct : score live & stats`,
      description: `Score en direct de ${home} – ${away} : buts minute par minute, compositions et statistiques live en ${comp}.`,
    }),
    finished: ({ home, away, comp, score }) => ({
      title: `${home} ${score} ${away} : résumé, buts & stats`,
      description: `Revivez ${home} ${score} ${away} en ${comp} : buts, temps forts, compositions et statistiques complètes.`,
    }),
  },
  en: {
    upcoming: ({ home, away, comp }) => ({
      title: `${home} vs ${away}: preview, lineups & kickoff`,
      description: `Probable lineups, kickoff time and TV channel for ${home} vs ${away} in the ${comp}. Preview, recent form and head-to-head history.`,
    }),
    live: ({ home, away, comp }) => ({
      title: `${home} vs ${away} live score & stats`,
      description: `Live score of ${home} vs ${away}: goals minute by minute, lineups and live match statistics in the ${comp}.`,
    }),
    finished: ({ home, away, comp, score }) => ({
      title: `${home} ${score} ${away}: recap, goals & stats`,
      description: `Relive ${home} ${score} ${away} in the ${comp}: goals, key moments, lineups and full match statistics.`,
    }),
  },
  ar: {
    upcoming: ({ home, away, comp }) => ({
      title: `${home} ضد ${away}: التشكيلة المتوقعة والقناة الناقلة`,
      description: `التشكيلة المتوقعة وموعد انطلاق المباراة والقناة الناقلة لمباراة ${home} ضد ${away} في ${comp}. معاينة والفورمة الأخيرة وتاريخ المواجهات.`,
    }),
    live: ({ home, away, comp }) => ({
      title: `${home} ضد ${away} بث مباشر: النتيجة لحظة بلحظة`,
      description: `النتيجة المباشرة لمباراة ${home} ضد ${away}: الأهداف لحظة بلحظة والتشكيلات والإحصائيات المباشرة في ${comp}.`,
    }),
    finished: ({ home, away, comp, score }) => ({
      title: `${home} ${score} ${away}: ملخص المباراة والأهداف`,
      description: `ملخص مباراة ${home} و${away} (${score}) في ${comp}: الأهداف وأبرز اللقطات والتشكيلات والإحصائيات الكاملة.`,
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
  return byLocale[state]({ home: input.home, away: input.away, comp: input.competition, score });
}
