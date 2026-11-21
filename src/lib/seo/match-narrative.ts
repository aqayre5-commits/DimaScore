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

/**
 * The result (or the live state) with the leading side's score first: "Everton beat Chelsea 2–0",
 * "Chelsea won 2–0 at Everton", "Everton and Chelsea drew 1–1". Never "beat Everton 0–2".
 */
export function resultClause(input: {
  state: 'live' | 'finished';
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  /** Shoot-out score; only used for a finished level match decided on penalties (PEN). */
  homePen?: number | null;
  awayPen?: number | null;
  locale: string;
}): string {
  const { state, home, away, homeScore: hs, awayScore: as, locale } = input;
  const hi = Math.max(hs, as);
  const lo = Math.min(hs, as);
  const sc = `${hi}–${lo}`;
  const homeWin = hs > as;
  const draw = hs === as;
  const hp = input.homePen;
  const ap = input.awayPen;
  if (state === 'finished' && draw && hp != null && ap != null && hp !== ap) {
    // Level after play, decided on penalties: the shoot-out winner first, never "drew".
    const pens = `${Math.max(hp, ap)}–${Math.min(hp, ap)}`;
    const homePens = hp > ap;
    if (locale === 'en')
      return homePens
        ? `${home} beat ${away} ${pens} on penalties after a ${sc} draw`
        : `${away} won ${pens} on penalties after a ${sc} draw at ${home}`;
    if (locale === 'ar')
      return homePens
        ? `فاز ${home} على ${away} ${pens} بركلات الترجيح بعد التعادل ${sc}`
        : `فاز ${away} على ${home} ${pens} بركلات الترجيح خارج أرضه بعد التعادل ${sc}`;
    return homePens
      ? `${home} a battu ${away} ${pens} aux tirs au but, après un nul ${sc}`
      : `${away} s'est imposé ${pens} aux tirs au but à l'extérieur face à ${home}, après un nul ${sc}`;
  }
  if (locale === 'en') {
    if (state === 'finished')
      return draw
        ? `${home} and ${away} drew ${sc}`
        : homeWin
          ? `${home} beat ${away} ${sc}`
          : `${away} won ${sc} at ${home}`;
    return draw
      ? `${home} and ${away} are level at ${sc}`
      : homeWin
        ? `${home} lead ${away} ${sc}`
        : `${away} lead ${sc} at ${home}`;
  }
  if (locale === 'ar') {
    if (state === 'finished')
      return draw
        ? `تعادل ${home} و${away} ${sc}`
        : homeWin
          ? `فاز ${home} على ${away} ${sc}`
          : `فاز ${away} على ${home} ${sc} خارج أرضه`;
    return draw
      ? `${home} و${away} متعادلان ${sc}`
      : homeWin
        ? `${home} يتقدّم على ${away} ${sc}`
        : `${away} يتقدّم ${sc} خارج أرضه أمام ${home}`;
  }
  if (state === 'finished')
    return draw
      ? `${home} et ${away} ont fait match nul ${sc}`
      : homeWin
        ? `${home} a battu ${away} ${sc}`
        : `${away} s'est imposé ${sc} à l'extérieur face à ${home}`;
  return draw
    ? `${home} et ${away} font jeu égal ${sc}`
    : homeWin
      ? `${home} mène ${sc} face à ${away}`
      : `${away} mène ${sc} à l'extérieur face à ${home}`;
}

// ── Recap (finished) ─────────────────────────────────────────────────────
export function buildRecap(input: {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  homePen?: number | null;
  awayPen?: number | null;
  scorers: NarrativeScorer[];
  competition: string;
  locale: string;
}): string {
  const { home, away, homeScore, awayScore, competition, locale } = input;
  const draw = homeScore === awayScore;
  const winner = homeScore > awayScore ? home : away;
  const cleanSheet = homeScore === 0 || awayScore === 0;
  const homeGoals = scorerClause(input.scorers, 'home', locale);
  const awayGoals = scorerClause(input.scorers, 'away', locale);

  const result = resultClause({
    state: 'finished',
    home,
    away,
    homeScore,
    awayScore,
    homePen: input.homePen,
    awayPen: input.awayPen,
    locale,
  });

  if (locale === 'en') {
    const lead = `${result} in ${withArticleEn(competition)}.`;
    const goals = [homeGoals && `${home}: ${homeGoals}`, awayGoals && `${away}: ${awayGoals}`]
      .filter(Boolean)
      .join('. ');
    const cs = cleanSheet && !draw ? ` ${winner} kept a clean sheet.` : '';
    return `${lead}${goals ? ' ' + goals + '.' : ''}${cs}`;
  }

  if (locale === 'ar') {
    const lead = `${result} في ${competition}.`;
    const goals = [homeGoals && `${home}: ${homeGoals}`, awayGoals && `${away}: ${awayGoals}`]
      .filter(Boolean)
      .join('، ');
    const cs = cleanSheet && !draw ? ` وحافظ ${winner} على شباكه نظيفة.` : '';
    return `${lead}${goals ? ' ' + goals + '.' : ''}${cs}`;
  }

  // fr (default)
  const lead = `${result} en ${competition}.`;
  const goals = [homeGoals && `${home} : ${homeGoals}`, awayGoals && `${away} : ${awayGoals}`]
    .filter(Boolean)
    .join('. ');
  const cs = cleanSheet && !draw ? ` ${winner} a gardé sa cage inviolée.` : '';
  return `${lead}${goals ? ' ' + goals + '.' : ''}${cs}`;
}

/** EN only: some competitions take a definite article ("the Premier League") and some don't
 * ("Ligue 1", "Serie A", "La Liga"). Heuristic: add "the" for League/Cup/Championship names. */
function withArticleEn(competition: string): string {
  return /\b(League|Cup|Championship)\b/i.test(competition) ? `the ${competition}` : competition;
}

function ordinalEn(n: number): string {
  const v = n % 100;
  const suffix = v >= 11 && v <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');
  return `${n}${suffix}`;
}

// ── Preview (upcoming) ───────────────────────────────────────────────────
export function buildPreview(input: {
  home: string;
  away: string;
  competition: string;
  dateLabel: string; // date only, locale-aware (the exact kickoff time lives in the match card)
  venue?: string | null;
  h2h?: H2HSummary | null;
  homeRank?: number | null;
  awayRank?: number | null;
  homeForm?: string | null; // compact W/D/L form, most recent last (e.g. "WDWDL")
  awayForm?: string | null;
  locale: string;
}): string {
  const { home, away, competition, dateLabel, venue, h2h, locale } = input;
  const { homeRank, awayRank, homeForm, awayForm } = input;
  const venuePart = venue ? venue : null;
  const hasH2h = !!h2h && h2h.played > 0;

  if (locale === 'en') {
    const hp = homeRank ? `${ordinalEn(homeRank)}-placed ` : '';
    const ap = awayRank ? `${ordinalEn(awayRank)}-placed ` : '';
    let s = `${hp}${home} host ${ap}${away} in ${withArticleEn(competition)}, ${dateLabel}${venuePart ? ` at ${venuePart}` : ''}.`;
    if (hasH2h)
      s += ` In their last ${h2h!.played} meetings: ${h2h!.homeWins} wins for ${home}, ${h2h!.draws} draws, ${h2h!.awayWins} for ${away}.`;
    else if (homeForm || awayForm)
      s += ` Recent form — ${home}: ${homeForm || '—'}, ${away}: ${awayForm || '—'}.`;
    return s;
  }
  if (locale === 'ar') {
    let s = `يستضيف ${home} فريق ${away} في ${competition}، ${dateLabel}${venuePart ? ` على ملعب ${venuePart}` : ''}.`;
    if (hasH2h)
      s += ` في آخر ${h2h!.played} مواجهات: ${h2h!.homeWins} انتصارات لـ${home}، ${h2h!.draws} تعادلات، و${h2h!.awayWins} لـ${away}.`;
    else if (homeForm || awayForm)
      s += ` النتائج الأخيرة — ${home}: ${homeForm || '—'}، ${away}: ${awayForm || '—'}.`;
    return s;
  }
  let s = `${home} reçoit ${away} en ${competition}, ${dateLabel}${venuePart ? ` au ${venuePart}` : ''}.`;
  if (hasH2h)
    s += ` Sur les ${h2h!.played} dernières confrontations : ${h2h!.homeWins} victoires du ${home}, ${h2h!.draws} nuls, ${h2h!.awayWins} du ${away}.`;
  else if (homeForm || awayForm)
    s += ` Forme récente — ${home} : ${homeForm || '—'}, ${away} : ${awayForm || '—'}.`;
  return s;
}

// ── Answer-first one-liner (any state) ───────────────────────────────────
/**
 * The single-sentence direct answer shown at the very top of the match page (Answer-First / AEO).
 * Adapts across upcoming → live → finished. Kept deliberately crisp; the fuller prose lives in the
 * recap/preview/live paragraph beneath it.
 */
export function buildMatchAnswer(input: {
  state: 'upcoming' | 'live' | 'finished';
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  homePen?: number | null;
  awayPen?: number | null;
  competition: string;
  kickoffLabel: string; // pre-formatted, locale-aware
  venue?: string | null;
  minute?: number | null;
  locale: string;
}): string {
  const { state, home, away, competition, kickoffLabel, venue, minute, locale } = input;
  const hs = input.homeScore ?? 0;
  const as = input.awayScore ?? 0;
  const mm = minute != null ? ` (${minute}’)` : '';

  if (state === 'upcoming') {
    if (locale === 'ar')
      return `يستضيف ${home} ${away} في ${competition}، ${kickoffLabel}${venue ? ` على ملعب ${venue}` : ''}.`;
    if (locale === 'en')
      return `${home} host ${away} in ${withArticleEn(competition)}, ${kickoffLabel}${venue ? ` at ${venue}` : ''}.`;
    return `${home} reçoit ${away} en ${competition}, ${kickoffLabel}${venue ? ` au ${venue}` : ''}.`;
  }

  const result = resultClause({
    state,
    home,
    away,
    homeScore: hs,
    awayScore: as,
    homePen: input.homePen,
    awayPen: input.awayPen,
    locale,
  });
  if (locale === 'ar') return `${result}${state === 'live' ? mm : ''} في ${competition}.`;
  if (locale === 'en')
    return `${result}${state === 'live' ? mm : ''} in ${withArticleEn(competition)}.`;
  return `${result}${state === 'live' ? mm : ''} en ${competition}.`;
}

// ── Live narrative paragraph ─────────────────────────────────────────────
/** Fuller live blurb beneath the answer: current scoreline + minute + scorers so far. */
export function buildLiveNarrative(input: {
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  scorers: NarrativeScorer[];
  minute?: number | null;
  competition: string;
  locale: string;
}): string {
  const { home, away, scorers, minute, competition, locale } = input;
  const hs = input.homeScore ?? 0;
  const as = input.awayScore ?? 0;
  const homeGoals = scorerClause(scorers, 'home', locale);
  const awayGoals = scorerClause(scorers, 'away', locale);

  const result = resultClause({ state: 'live', home, away, homeScore: hs, awayScore: as, locale });

  if (locale === 'ar') {
    const lead =
      minute != null
        ? `بعد ${minute} دقيقة، ${result} في ${competition}.`
        : `${result} في ${competition}.`;
    const goals = [homeGoals && `${home}: ${homeGoals}`, awayGoals && `${away}: ${awayGoals}`]
      .filter(Boolean)
      .join('، ');
    return `${lead}${goals ? ' ' + goals + '.' : ''}`;
  }
  if (locale === 'en') {
    const lead =
      minute != null
        ? `After ${minute} minutes, ${result} in ${withArticleEn(competition)}.`
        : `${result} in ${withArticleEn(competition)}.`;
    const goals = [homeGoals && `${home}: ${homeGoals}`, awayGoals && `${away}: ${awayGoals}`]
      .filter(Boolean)
      .join('. ');
    return `${lead}${goals ? ' ' + goals + '.' : ''}`;
  }
  const lead =
    minute != null
      ? `Après ${minute} minutes, ${result} en ${competition}.`
      : `${result} en ${competition}.`;
  const goals = [homeGoals && `${home} : ${homeGoals}`, awayGoals && `${away} : ${awayGoals}`]
    .filter(Boolean)
    .join('. ');
  return `${lead}${goals ? ' ' + goals + '.' : ''}`;
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
  homePen?: number | null;
  awayPen?: number | null;
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
    // Same winner-first wording as the summary (a draw names no winner).
    const res = `${resultClause({
      state: 'finished',
      home,
      away,
      homeScore,
      awayScore,
      homePen: input.homePen,
      awayPen: input.awayPen,
      locale,
    })}.`;
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
