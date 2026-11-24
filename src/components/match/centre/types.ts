import type { Locale } from '@/lib/i18n/config';
import type { MatchCoverage } from '@/lib/db/queries/match-detail';
import type { LiveFixture, Phase, TableBase, TableResult } from '@/lib/match/match-centre';

export interface McTeam {
  id: number;
  name: string;
  href: string | null;
  logo: string | null;
}

/** Serializable match view the server hands to the client match centre. */
export interface McMatch {
  id: number;
  locale: Locale;
  /** BCP 47 tag for numbers and dates (Latin digits in Arabic, as on the rest of the site). */
  bcp: string;
  h1: string;
  coverage: MatchCoverage | null;
  /** Server phase (it knows the clock); the client re-derives it from live status codes. */
  phase: Phase;
  statusCode: string;
  minute: number | null;
  extraMinute: number | null;
  homeScore: number | null;
  awayScore: number | null;
  homeScoreHt: number | null;
  awayScoreHt: number | null;
  homeScorePen: number | null;
  awayScorePen: number | null;
  kickoffIso: string;
  /** "Sat 15 Mar · 15:00 GMT+1" (Africa/Casablanca). */
  dateText: string;
  /** "15:00" — shown in the score slot before kick-off. */
  timeText: string;
  venue: string | null;
  competition: { id: number; name: string; href: string | null; logo: string | null };
  roundLabel: string | null;
  home: McTeam;
  away: McTeam;
}

export interface McUpcoming {
  id: number;
  href: string;
  dayLabel: string;
  iso: string;
  time: string;
  home: { name: string; logo: string | null };
  away: { name: string; logo: string | null };
}

export interface McTable {
  base: TableBase[];
  /** Finished results between teams of this table (Home / Away scopes). */
  results: TableResult[];
  /** Other fixtures of this table in play (this match is overlaid from the live score). */
  live: LiveFixture[];
}
