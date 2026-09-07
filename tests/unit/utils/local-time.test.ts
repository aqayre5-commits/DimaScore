import { describe, expect, it } from 'vitest';
import { formatViewerKickoff, KICKOFF_PLACEHOLDER } from '@/lib/utils/local-time';

/** 2026-09-07 19:00 UTC — a known instant. */
const ISO = '2026-09-07T19:00:00.000Z';

describe('formatViewerKickoff', () => {
  it('formats viewer-local time without a fixed zone', () => {
    const text = formatViewerKickoff(new Date(ISO), 'en', 'time');
    expect(text).toMatch(/^\d{2}:\d{2}$/);
  });

  it('Casablanca (UTC+1 in September) is 20:00 — must not be used as SSR display', () => {
    const casa = formatViewerKickoff(new Date(ISO), 'en', 'time', undefined, 'Africa/Casablanca');
    const utc = formatViewerKickoff(new Date(ISO), 'en', 'time', undefined, 'UTC');
    expect(casa).toBe('20:00');
    expect(utc).toBe('19:00');
    expect(casa).not.toBe(utc);
  });

  it('placeholders never contain a real clock from SITE_TZ', () => {
    expect(KICKOFF_PLACEHOLDER.time).toBe('00:00');
    expect(KICKOFF_PLACEHOLDER.kickoff).toContain('00:00');
    expect(KICKOFF_PLACEHOLDER.time).not.toBe('20:00');
    expect(KICKOFF_PLACEHOLDER.time).not.toBe('19:00');
  });

  it('kickoff and featured include a time segment', () => {
    const kickoff = formatViewerKickoff(new Date(ISO), 'fr', 'kickoff', undefined, 'UTC');
    const featured = formatViewerKickoff(new Date(ISO), 'en', 'featured', undefined, 'UTC');
    expect(kickoff).toMatch(/19:00/);
    expect(featured).toMatch(/19:00/);
  });
});
