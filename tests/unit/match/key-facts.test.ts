import { describe, expect, it } from 'vitest';
import {
  buildKeyFacts,
  formatLongMatchDate,
  formatMoroccoKickoff,
  formatShortMatchDate,
  moroccoOffsetLabel,
} from '@/lib/match/key-facts';
import { buildMatchMeta } from '@/lib/seo/match-metadata';

const ko = new Date('2026-11-20T19:45:00Z');

/** What the runtime's own Intl/tz data says Morocco's offset is at that instant. */
function intlOffset(d: Date): string {
  return (
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Casablanca', timeZoneName: 'longOffset' })
      .formatToParts(d)
      .find((p) => p.type === 'timeZoneName')?.value ?? ''
  );
}

describe('Morocco kick-off', () => {
  // Summer kick-off: 12 Jul 2026, under the old GMT+1 rule. Winter kick-off: 13 Dec 2026, after
  // Morocco's 20 Sept 2026 return to GMT (decree 2.26.530, tzdata 2026 releases).
  const summer = new Date('2026-07-12T19:00:00Z');
  const winter = new Date('2026-12-13T19:00:00Z');

  it('derives the label from Intl, not a hard-coded offset', () => {
    expect(intlOffset(summer)).toBe('GMT+01:00');
    expect(moroccoOffsetLabel(summer)).toBe('GMT+1');
    expect(intlOffset(winter)).toMatch(/^GMT(\+00:00)?$/);
    expect(moroccoOffsetLabel(winter)).toBe('GMT');
  });

  it('shows the Morocco wall-clock time with that offset', () => {
    expect(formatMoroccoKickoff(summer, 'en')).toContain('20:00 Morocco time (GMT+1)');
    expect(formatMoroccoKickoff(winter, 'en')).toContain('19:00 Morocco time (GMT)');
    expect(formatMoroccoKickoff(winter, 'fr')).toContain('heure marocaine (GMT)');
    expect(formatMoroccoKickoff(winter, 'ar')).toContain('بتوقيت المغرب (GMT)');
  });
});

describe('buildKeyFacts', () => {
  const base = {
    locale: 'en' as const,
    kickoffAt: ko,
    homeId: 1,
    awayId: 2,
    homeName: 'Raja',
    awayName: 'Wydad',
  };

  it('always leads with kick-off as a <time> value and skips missing data', () => {
    const facts = buildKeyFacts(base);
    expect(facts).toHaveLength(1);
    expect(facts[0]).toMatchObject({ label: 'Kick-off', dateTime: ko.toISOString() });
  });

  it('adds venue, possession, shots on target and H2H only when present', () => {
    const facts = buildKeyFacts({
      ...base,
      venue: 'Stade Mohamed V',
      teamStats: [
        {
          teamId: 1,
          stats: [
            { type: 'Ball Possession', value: '58%' },
            { type: 'Shots on Goal', value: 6 },
          ],
        },
        {
          teamId: 2,
          stats: [
            { type: 'Ball Possession', value: '42%' },
            { type: 'Shots on Goal', value: 2 },
          ],
        },
      ],
      h2h: { played: 5, homeWins: 2, draws: 2, awayWins: 1 },
    });
    expect(facts.map((f) => f.label)).toEqual([
      'Kick-off',
      'Venue',
      'Possession',
      'Shots on target',
      'Head-to-head',
    ]);
    expect(facts[2].value).toBe('58% – 42%');
    expect(facts[4].value).toBe('5 meetings: Raja 2, draws 2, Wydad 1');
  });

  it('omits H2H with no meetings', () => {
    expect(
      buildKeyFacts({ ...base, h2h: { played: 0, homeWins: 0, draws: 0, awayWins: 0 } }),
    ).toHaveLength(1);
  });
});

describe('match titles carry the date', () => {
  const m = { home: 'Raja', away: 'Wydad', competition: 'Botola Pro', state: 'upcoming' as const };

  it('puts the date in upcoming titles and every description, per locale', () => {
    for (const locale of ['en', 'fr', 'ar'] as const) {
      const dateLabel = formatShortMatchDate(ko, locale);
      const meta = buildMatchMeta({ ...m, locale, dateLabel });
      expect(meta.title).toContain(dateLabel);
      expect(meta.description).toContain(dateLabel);
      expect(meta.description.toLowerCase()).not.toMatch(/tv|chaîne|القناة/);
    }
  });

  it('keeps distinct titles for two meetings of the same pairing', () => {
    const a = buildMatchMeta({ ...m, locale: 'en', dateLabel: '20 Nov' });
    const b = buildMatchMeta({ ...m, locale: 'en', dateLabel: '12 Apr' });
    expect(a.title).not.toBe(b.title);
  });

  it('still works without a date', () => {
    expect(buildMatchMeta({ ...m, locale: 'fr' }).title).toBe(
      'Raja – Wydad : compo probable, heure & face-à-face',
    );
  });

  it('promises head-to-head (shown in the top facts row), not stats, for upcoming matches', () => {
    expect(buildMatchMeta({ ...m, locale: 'fr' }).title).not.toContain('stats');
    expect(buildMatchMeta({ ...m, locale: 'en' }).title).toContain('head-to-head');
    expect(buildMatchMeta({ ...m, locale: 'ar' }).title).toContain('المواجهات المباشرة');
  });

  it('puts the year in finished descriptions but keeps titles short', () => {
    const fin = { ...m, state: 'finished' as const, homeScore: 2, awayScore: 1 };
    for (const locale of ['en', 'fr', 'ar'] as const) {
      const meta = buildMatchMeta({
        ...fin,
        locale,
        dateLabel: formatShortMatchDate(ko, locale),
        dateLabelLong: formatLongMatchDate(ko, locale),
      });
      expect(meta.description).toContain(formatLongMatchDate(ko, locale));
      expect(meta.description).toContain('2026');
      expect(meta.title).not.toContain('2026');
    }
    expect(
      buildMatchMeta({ ...fin, locale: 'fr', dateLabel: '20 nov.', dateLabelLong: '20 nov. 2026' })
        .description,
    ).toContain('le 20 nov. 2026');
  });
});
