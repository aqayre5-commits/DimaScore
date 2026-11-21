import type { MatchCoverage } from '@/lib/db/queries/match-detail';
import type { Locale } from '@/lib/i18n/config';

/** A team as the match page shows it (name already localized). */
export interface TeamView {
  id: number;
  name: string;
  href: string | null;
  logoUrl: string | null;
  countryCode: string | null;
  isNational: boolean | null;
}

/** Serializable match facts shared by the client parts of the page. */
export interface MatchView {
  matchId: string;
  locale: Locale;
  coverage: MatchCoverage | null;
  isUpcoming: boolean;
  statusCode: string;
  homeScore: number | null;
  awayScore: number | null;
  homeScoreHt: number | null;
  awayScoreHt: number | null;
  homeScorePen: number | null;
  awayScorePen: number | null;
  minute: number | null;
  extraMinute: number | null;
  kickoffAt: string;
  home: TeamView;
  away: TeamView;
}
