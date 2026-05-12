import { describe, it, expect } from 'vitest';
import { getRefreshInterval } from '@/lib/constants/refresh-intervals';

describe('getRefreshInterval', () => {
  // Live statuses → 5000ms
  it.each(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'])(
    'returns 5000 for live status %s',
    (status) => {
      expect(getRefreshInterval(status)).toBe(5000);
    },
  );

  // Finished statuses → 0
  it.each(['FT', 'AET', 'PEN'])('returns 0 for finished status %s', (status) => {
    expect(getRefreshInterval(status)).toBe(0);
  });

  // Interrupted statuses → 60000ms
  it.each(['SUSP', 'INT'])('returns 60000 for interrupted status %s', (status) => {
    expect(getRefreshInterval(status)).toBe(60000);
  });

  // Terminal statuses → 0
  it.each(['PST', 'CANC', 'ABD', 'AWD', 'WO'])('returns 0 for terminal status %s', (status) => {
    expect(getRefreshInterval(status)).toBe(0);
  });

  // Upcoming within 1 hour → 30000ms
  it.each(['NS', 'TBD'])('returns 30000 for %s within one hour', (status) => {
    expect(getRefreshInterval(status, true)).toBe(30000);
  });

  // Upcoming more than 1 hour away → 0
  it.each(['NS', 'TBD'])('returns 0 for %s more than one hour away', (status) => {
    expect(getRefreshInterval(status, false)).toBe(0);
  });

  // Upcoming without isWithinOneHour defaults to 0
  it.each(['NS', 'TBD'])('returns 0 for %s when isWithinOneHour is omitted', (status) => {
    expect(getRefreshInterval(status)).toBe(0);
  });

  // Unknown status → 0
  it('returns 0 for unknown status', () => {
    expect(getRefreshInterval('UNKNOWN')).toBe(0);
  });
});
