import { describe, expect, it } from 'vitest';
import { isSameDay, PRE_MOUNT_TZ } from '@/components/homepage/HomeMatchTabs';

// Before mount the match list is bucketed by Morocco's day so the server HTML and the hydration
// pass agree (no list pop-in, no layout shift); after mount it uses the viewer's zone.
describe('HomeMatchTabs day bucketing', () => {
  it('pre-mount zone is Morocco', () => {
    expect(PRE_MOUNT_TZ).toBe('Africa/Casablanca');
  });

  it('compares calendar days in the given zone, independent of the host zone', () => {
    // 23:30 UTC on 19 Nov is still 19 Nov in Casablanca (GMT in winter) but 20 Nov in Riyadh.
    const late = new Date('2026-11-19T23:30:00Z');
    const noon = new Date('2026-11-19T12:00:00Z');
    expect(isSameDay(late, noon, PRE_MOUNT_TZ)).toBe(true);
    expect(isSameDay(late, noon, 'Asia/Riyadh')).toBe(false);
    // Summer: Casablanca is GMT+1, so 23:30 UTC on 12 Jul is already 13 Jul there.
    expect(
      isSameDay(new Date('2026-07-12T23:30:00Z'), new Date('2026-07-13T08:00:00Z'), PRE_MOUNT_TZ),
    ).toBe(true);
  });
});
