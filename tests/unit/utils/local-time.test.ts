import { describe, expect, it } from 'vitest';
import { formatServerKickoff, formatViewerKickoff } from '@/lib/utils/local-time';

/** 2026-09-07 19:00 UTC — a known instant. */
const ISO = '2026-09-07T19:00:00.000Z';

describe('formatViewerKickoff', () => {
  it('formats viewer-local time without a fixed zone', () => {
    const text = formatViewerKickoff(new Date(ISO), 'en', 'time');
    expect(text).toMatch(/^\d{2}:\d{2}$/);
  });

  it('Casablanca (UTC+1 in September) is 20:00, distinct from UTC', () => {
    const casa = formatViewerKickoff(new Date(ISO), 'en', 'time', undefined, 'Africa/Casablanca');
    const utc = formatViewerKickoff(new Date(ISO), 'en', 'time', undefined, 'UTC');
    expect(casa).toBe('20:00');
    expect(utc).toBe('19:00');
    expect(casa).not.toBe(utc);
  });

  it('server render shows the real Casablanca kickoff, never a 00:00 / 00 Jan placeholder', () => {
    const d = new Date(ISO);
    expect(formatServerKickoff(d, 'en', 'time')).toBe('20:00');
    for (const locale of ['fr', 'en', 'ar'] as const) {
      for (const format of ['time', 'date', 'kickoff', 'featured'] as const) {
        const text = formatServerKickoff(d, locale, format);
        expect(text).not.toMatch(/00 Jan|00:00/i);
      }
    }
    expect(formatServerKickoff(d, 'fr', 'kickoff')).toMatch(/7.*20:00/);
  });

  it('server render is deterministic regardless of the process time zone', () => {
    const a = formatServerKickoff(new Date(ISO), 'fr', 'kickoff');
    const b = formatViewerKickoff(new Date(ISO), 'fr', 'kickoff', undefined, 'Africa/Casablanca');
    expect(a).toBe(b);
  });

  it('kickoff and featured include a time segment', () => {
    const kickoff = formatViewerKickoff(new Date(ISO), 'fr', 'kickoff', undefined, 'UTC');
    const featured = formatViewerKickoff(new Date(ISO), 'en', 'featured', undefined, 'UTC');
    expect(kickoff).toMatch(/19:00/);
    expect(featured).toMatch(/19:00/);
  });
});
