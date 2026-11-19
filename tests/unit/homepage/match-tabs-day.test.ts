import { describe, expect, it } from 'vitest';
import { isSameDay } from '@/components/homepage/HomeMatchTabs';
import { SITE_TZ } from '@/lib/utils/date';

// Before mount the match list is bucketed by the site's day (Africa/Casablanca) so the server HTML
// and the hydration pass agree (no list pop-in, no layout shift); after mount it uses the viewer's
// zone. Morocco's offset is +00 or +01 depending on the date and on the runtime's tz data
// (Ramadan, and older tzdata that keeps +01 all year), so every instant below sits at least an hour
// away from midnight under BOTH offsets: the assertions hold whichever tz data the runtime has.
describe('HomeMatchTabs day bucketing', () => {
  it('uses the site zone', () => {
    expect(SITE_TZ).toBe('Africa/Casablanca');
  });

  it('puts 00:30Z, 12:00Z and 22:30Z on the same Casablanca day, in winter and summer', () => {
    for (const day of ['2026-11-19', '2026-07-12']) {
      const noon = new Date(`${day}T12:00:00Z`);
      expect(isSameDay(new Date(`${day}T00:30:00Z`), noon, SITE_TZ)).toBe(true);
      expect(isSameDay(new Date(`${day}T22:30:00Z`), noon, SITE_TZ)).toBe(true);
    }
  });

  it('splits 22:30Z and the next 00:30Z into two Casablanca days under either offset', () => {
    expect(
      isSameDay(new Date('2026-11-19T22:30:00Z'), new Date('2026-11-20T00:30:00Z'), SITE_TZ),
    ).toBe(false);
  });

  it('is independent of the host zone: a viewer zone far east sees a different day', () => {
    // 22:30Z is 01:30 the next day in Riyadh (+03, no DST).
    const late = new Date('2026-11-19T22:30:00Z');
    const noon = new Date('2026-11-19T12:00:00Z');
    expect(isSameDay(late, noon, SITE_TZ)).toBe(true);
    expect(isSameDay(late, noon, 'Asia/Riyadh')).toBe(false);
  });

  it('agrees with Intl for an arbitrary instant in the zone it is given', () => {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: SITE_TZ });
    const a = new Date('2026-03-01T08:15:00Z');
    const b = new Date('2026-03-01T17:45:00Z');
    expect(isSameDay(a, b, SITE_TZ)).toBe(fmt.format(a) === fmt.format(b));
  });
});
