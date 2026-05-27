/**
 * FIFA World Cup 2026 official venue data.
 * Capacities are FIFA 2026 tournament capacities (not permanent stadium capacities).
 */

import { WC_2026_SCHEDULE } from './wc2026-schedule';

interface WcVenue {
  stadium: string;
  city: string;
  capacity: number;
}

const WC_VENUES: Record<string, WcVenue> = {
  'Mexico City': { stadium: 'Estadio Azteca', city: 'Mexico City', capacity: 72766 },
  Guadalajara: { stadium: 'Estadio Akron', city: 'Guadalajara', capacity: 44330 },
  Monterrey: { stadium: 'Estadio BBVA', city: 'Monterrey', capacity: 50113 },
  Toronto: { stadium: 'BMO Field', city: 'Toronto', capacity: 44315 },
  Vancouver: { stadium: 'BC Place', city: 'Vancouver', capacity: 48821 },
  Seattle: { stadium: 'Lumen Field', city: 'Seattle', capacity: 65123 },
  'San Francisco Bay Area': { stadium: "Levi's Stadium", city: 'Santa Clara', capacity: 69391 },
  'Los Angeles': { stadium: 'SoFi Stadium', city: 'Los Angeles', capacity: 69650 },
  'Kansas City': {
    stadium: 'GEHA Field at Arrowhead Stadium',
    city: 'Kansas City',
    capacity: 67513,
  },
  Dallas: { stadium: 'AT&T Stadium', city: 'Arlington', capacity: 70122 },
  Houston: { stadium: 'NRG Stadium', city: 'Houston', capacity: 68311 },
  Atlanta: { stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', capacity: 67382 },
  Miami: { stadium: 'Hard Rock Stadium', city: 'Miami Gardens', capacity: 64091 },
  Philadelphia: { stadium: 'Lincoln Financial Field', city: 'Philadelphia', capacity: 65827 },
  Boston: { stadium: 'Gillette Stadium', city: 'Foxborough', capacity: 63815 },
  'New York New Jersey': { stadium: 'MetLife Stadium', city: 'East Rutherford', capacity: 78576 },
};

/**
 * Resolve WC 2026 venue by matching home + away team codes against the schedule.
 * Returns null if no match found.
 */
export function getWcVenueByTeamCodes(
  homeCode: string | null,
  awayCode: string | null,
): WcVenue | null {
  if (!homeCode || !awayCode) return null;

  const match = WC_2026_SCHEDULE.find(
    (m) =>
      m.homeSlot.toUpperCase() === homeCode.toUpperCase() &&
      m.awaySlot.toUpperCase() === awayCode.toUpperCase(),
  );

  if (!match) return null;
  return WC_VENUES[match.venue] ?? null;
}
