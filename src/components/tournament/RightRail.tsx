import type { Locale } from '@/lib/i18n/config';
import type { CupMetadata } from '@/lib/constants/tournament-metadata';
import type { StandingRow } from '@/lib/db/queries';
import { TopScorersWidget } from './TopScorersWidget';
import { TopAssistsWidget } from './TopAssistsWidget';
import { MeetTheTeamsCard } from './MeetTheTeamsCard';
import { MoreMatchesTodayWidget } from './MoreMatchesTodayWidget';
import { NewsletterCard } from './NewsletterCard';

interface RightRailProps {
  metadata: CupMetadata;
  standings: StandingRow[];
  locale: Locale;
  tournamentName: string;
}

/**
 * Right rail composition — 5 widgets stacked per competition-cup.md §9.
 * Widget order: Top Scorers → Top Assists → Meet the Teams → More Matches Today → Newsletter.
 */
export function RightRail({ metadata, standings, locale, tournamentName }: RightRailProps) {
  return (
    <div className="space-y-4">
      <TopScorersWidget />
      <TopAssistsWidget />
      <MeetTheTeamsCard metadata={metadata} standings={standings} locale={locale} />
      <MoreMatchesTodayWidget />
      <NewsletterCard tournamentName={tournamentName} />
    </div>
  );
}
