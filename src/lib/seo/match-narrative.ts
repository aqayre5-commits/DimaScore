/**
 * Server-rendered editorial prose for the match page — recap (finished), preview (upcoming),
 * head-to-head narrative, and FAQ, in FR/AR/EN. This is the long-tail content Google does not
 * answer inline; it wraps (never replaces) the interactive widgets.
 *
 * Pure and framework-free so every template is unit-testable against fixture data. Copy is
 * condition-varied (result type, margin, clean sheet…) so pages across thousands of matches are
 * distinct rather than boilerplate. Auto-generated — review a sample per locale before treating as
 * final, especially Arabic.
 */

export type NarrativeLocale = string;

export interface NarrativeScorer {
  name: string;
  minute: number;
  extra?: number | null;
  side: 'home' | 'away';
  isPenalty: boolean;
  isOwnGoal: boolean;
}

export interface H2HResult {
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeScore: number | null;
  awayScore: number | null;
}

export interface H2HSummary {
  played: number;
  homeWins: number; // wins for THIS match's home team
  draws: number;
  awayWins: number; // wins for THIS match's away team
}

const pick = <T>(map: Record<string, T>, locale: string): T => map[locale] ?? map.fr;

function min(s: NarrativeScorer): string {
  return s.extra ? `${s.minute}+${s.extra}'` : `${s.minute}'`;
}

/** Summarise past meetings relative to THIS match's home/away teams. */
export function summarizeH2H(
  fixtures: readonly H2HResult[],
  homeTeamId: number,
  awayTeamId: number,
): H2HSummary {
  let homeWins = 0,
    draws = 0,
    awayWins = 0,
    played = 0;
  for (const f of fixtures) {
    if (f.homeScore == null || f.awayScore == null) continue;
    const involvesBoth =
      (f.homeTeamId === homeTeamId && f.awayTeamId === awayTeamId) ||
      (f.homeTeamId === awayTeamId && f.awayTeamId === homeTeamId);
    if (!involvesBoth) continue;
    const homeGoals = f.homeTeamId === homeTeamId ? f.homeScore : f.awayScore;
    const awayGoals = f.homeTeamId === homeTeamId ? f.awayScore : f.homeScore;
    played++;
    if (homeGoals > awayGoals) homeWins++;
    else if (homeGoals < awayGoals) awayWins++;
    else draws++;
  }
  return { played, homeWins, draws, awayWins };
}

/** Render one side's scorers as "Name (23'), Name (78' pen)". Empty string when none. */
function scorerClause(scorers: NarrativeScorer[], side: 'home' | 'away', locale: string): string {
  const list = scorers.filter((s) => s.side === side);
  if (list.length === 0) return '';
  const p = pick(
    {
      fr: { pen: ' sp', og: ' csc' },
      en: { pen: ' pen', og: ' o.g.' },
      ar: { pen: ' ركلة جزاء', og: ' ذاتي' },
    },
    locale,
  );
  return list
    .map((s) => `${s.name} (${min(s)}${s.isPenalty ? p.pen : s.isOwnGoal ? p.og : ''})`)
    .join(', ');
}

// ── Recap (finished) ─────────────────────────────────────────────────────
export function buildRecap(input: {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  scorers: NarrativeScorer[];
  competition: string;
  locale: string;
}): string {
  const { home, away, homeScore, awayScore, competition, locale } = input;
  const score = `${homeScore}–${awayScore}`;
  const margin = Math.abs(homeScore - awayScore);
  const draw = homeScore === awayScore;
  const winner = homeScore > awayScore ? home : away;
  const cleanSheet = homeScore === 0 || awayScore === 0;
  const homeGoals = scorerClause(input.scorers, 'home', locale);
  const awayGoals = scorerClause(input.scorers, 'away', locale);

  if (locale === 'en') {
    let lead: string;
    if (draw)
      lead = `${home} and ${away} shared the points in a ${score} draw in the ${competition}.`;
    else if (margin >= 3)
      lead = `${winner} cruised past ${winner === home ? away : home} ${score} in the ${competition}.`;
    else lead = `${winner} edged ${winner === home ? away : home} ${score} in the ${competition}.`;
    const goals = [homeGoals && `${home}: ${homeGoals}`, awayGoals && `${away}: ${awayGoals}`]
      .filter(Boolean)
      .join('. ');
    const cs = cleanSheet && !draw ? ` ${winner} kept a clean sheet.` : '';
    return `${lead}${goals ? ' ' + goals + '.' : ''}${cs}`;
  }

  if (locale === 'ar') {
    let lead: string;
    if (draw) lead = `تعادل ${home} و${away} بنتيجة ${score} في ${competition}.`;
    else if (margin >= 3)
      lead = `فاز ${winner} بسهولة على ${winner === home ? away : home} بنتيجة ${score} في ${competition}.`;
    else
      lead = `حقق ${winner} فوزاً صعباً على ${winner === home ? away : home} بنتيجة ${score} في ${competition}.`;
    const goals = [homeGoals && `${home}: ${homeGoals}`, awayGoals && `${away}: ${awayGoals}`]
      .filter(Boolean)
      .join('، ');
    const cs = cleanSheet && !draw ? ` وحافظ ${winner} على شباكه نظيفة.` : '';
    return `${lead}${goals ? ' ' + goals + '.' : ''}${cs}`;
  }

  // fr (default)
  let lead: string;
  if (draw) lead = `${home} et ${away} se sont quittés sur un nul ${score} en ${competition}.`;
  else if (margin >= 3)
    lead = `${winner} s'est largement imposé ${score} face à ${winner === home ? away : home} en ${competition}.`;
  else
    lead = `${winner} s'est imposé ${score} face à ${winner === home ? away : home} en ${competition}.`;
  const goals = [homeGoals && `${home} : ${homeGoals}`, awayGoals && `${away} : ${awayGoals}`]
    .filter(Boolean)
    .join('. ');
  const cs = cleanSheet && !draw ? ` ${winner} a gardé sa cage inviolée.` : '';
  return `${lead}${goals ? ' ' + goals + '.' : ''}${cs}`;
}

// ── Preview (upcoming) ───────────────────────────────────────────────────
export function buildPreview(input: {
  home: string;
  away: string;
  competition: string;
  kickoffLabel: string; // pre-formatted, locale-aware
  venue?: string | null;
  h2h?: H2HSummary | null;
  locale: string;
}): string {
  const { home, away, competition, kickoffLabel, venue, h2h, locale } = input;
  const venuePart = venue ? venue : null;

  if (locale === 'en') {
    let s = `${home} host ${away} in the ${competition}, ${kickoffLabel}${venuePart ? ` at ${venuePart}` : ''}.`;
    if (h2h && h2h.played > 0)
      s += ` In their last ${h2h.played} meetings: ${h2h.homeWins} wins for ${home}, ${h2h.draws} draws, ${h2h.awayWins} for ${away}.`;
    return s;
  }
  if (locale === 'ar') {
    let s = `يستضيف ${home} فريق ${away} في ${competition}، ${kickoffLabel}${venuePart ? ` على ملعب ${venuePart}` : ''}.`;
    if (h2h && h2h.played > 0)
      s += ` في آخر ${h2h.played} مواجهات: ${h2h.homeWins} انتصارات لـ${home}، ${h2h.draws} تعادلات، و${h2h.awayWins} لـ${away}.`;
    return s;
  }
  let s = `${home} reçoit ${away} en ${competition}, ${kickoffLabel}${venuePart ? ` au ${venuePart}` : ''}.`;
  if (h2h && h2h.played > 0)
    s += ` Sur les ${h2h.played} dernières confrontations : ${h2h.homeWins} victoires du ${home}, ${h2h.draws} nuls, ${h2h.awayWins} du ${away}.`;
  return s;
}

// ── Head-to-head narrative (any state) ───────────────────────────────────
export function buildH2HNarrative(input: {
  home: string;
  away: string;
  h2h: H2HSummary;
  locale: string;
}): string | null {
  const { home, away, h2h, locale } = input;
  if (h2h.played === 0) return null;
  if (locale === 'en')
    return `Over the last ${h2h.played} meetings, ${home} lead ${h2h.homeWins}–${h2h.awayWins} (${h2h.draws} draws) against ${away}.`;
  if (locale === 'ar')
    return `في آخر ${h2h.played} مواجهات، يتقدم ${home} بنتيجة ${h2h.homeWins}–${h2h.awayWins} (${h2h.draws} تعادلات) على ${away}.`;
  return `Sur les ${h2h.played} dernières confrontations, le ${home} mène ${h2h.homeWins}–${h2h.awayWins} (${h2h.draws} nuls) face au ${away}.`;
}

// ── FAQ (state-aware) ────────────────────────────────────────────────────
export interface FaqItem {
  q: string;
  a: string;
}

export function buildMatchFaq(input: {
  state: 'upcoming' | 'live' | 'finished';
  home: string;
  away: string;
  homeScore?: number | null;
  awayScore?: number | null;
  scorers?: NarrativeScorer[];
  kickoffLabel?: string | null;
  nextMatchLabel?: string | null;
  locale: string;
}): FaqItem[] {
  const { state, home, away, homeScore, awayScore, scorers = [], kickoffLabel, locale } = input;
  const items: FaqItem[] = [];
  const L = pick(
    {
      fr: {
        score: `Quel a été le score de ${home} – ${away} ?`,
        scored: 'Qui a marqué ?',
        when: `Quand joue ${home} – ${away} ?`,
      },
      en: {
        score: `What was the score of ${home} vs ${away}?`,
        scored: 'Who scored?',
        when: `When do ${home} and ${away} play?`,
      },
      ar: {
        score: `ما نتيجة مباراة ${home} و${away}؟`,
        scored: 'من سجّل الأهداف؟',
        when: `متى تقام مباراة ${home} و${away}؟`,
      },
    },
    locale,
  );

  if (state === 'finished' && typeof homeScore === 'number' && typeof awayScore === 'number') {
    const res =
      locale === 'en'
        ? `${home} ${homeScore}–${awayScore} ${away}.`
        : locale === 'ar'
          ? `انتهت المباراة ${homeScore}–${awayScore} لصالح ${homeScore >= awayScore ? home : away}.`
          : `${home} ${homeScore}–${awayScore} ${away}.`;
    items.push({ q: L.score, a: res });
    const hs = scorerClause(scorers, 'home', locale);
    const as = scorerClause(scorers, 'away', locale);
    const goals = [hs && `${home} : ${hs}`, as && `${away} : ${as}`].filter(Boolean).join(' ; ');
    if (goals) items.push({ q: L.scored, a: goals });
  } else if (kickoffLabel) {
    items.push({ q: L.when, a: kickoffLabel });
  }
  return items;
}
