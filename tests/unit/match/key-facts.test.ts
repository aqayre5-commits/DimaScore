import { describe, expect, it } from 'vitest';
import {
  buildKeyFacts,
  formatMoroccoKickoff,
  formatShortMatchDate,
  moroccoOffsetLabel,
} from '@/lib/match/key-facts';
import { buildMatchMeta } from '@/lib/seo/match-metadata';

const ko = new Date('2026-11-20T19:45:00Z');

describe('Morocco kick-off', () => {
  it('uses GMT after the 20 Sept 2026 switch and GMT+1 before it', () => {
    expect(moroccoOffsetLabel(ko)).toBe('GMT');
    expect(moroccoOffsetLabel(new Date('2026-05-10T18:00:00Z'))).toBe('GMT+1');
  });

  it('formats the time in Morocco with an explicit zone label per locale', () => {
    expect(formatMoroccoKickoff(ko, 'en')).toContain('19:45');
    expect(formatMoroccoKickoff(ko, 'en')).toContain('Morocco time (GMT)');
    expect(formatMoroccoKickoff(ko, 'fr')).toContain('heure marocaine (GMT)');
    expect(formatMoroccoKickoff(ko, 'ar')).toContain('بتوقيت المغرب (GMT)');
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
      'Raja – Wydad : compo probable, heure & stats',
    );
  });
});
