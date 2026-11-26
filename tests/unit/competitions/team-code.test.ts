import { describe, expect, it } from 'vitest';
import { fallbackTeamCode, teamCode } from '@/lib/competitions/team-code';

describe('fallbackTeamCode', () => {
  it.each([
    ['Arsenal', 'ARS'],
    ['FC Barcelona', 'BAR'],
    ['Real Madrid', 'MAD'],
    ['Club Brugge', 'BRU'],
    ['Paris Saint Germain', 'PSG'],
    ['Paris Saint-Germain', 'PSG'],
    ['Manchester City', 'MCI'],
    ['Bayern München', 'BMU'],
    ['Atlético Madrid', 'AMA'],
    ['Borussia de Dortmund', 'BDO'],
    ['Sporting CP', 'SCP'],
    ['Bodø/Glimt', 'BGL'],
    ['AC Milan', 'MIL'],
    ['FC', 'FC'],
  ])('%s -> %s', (name, code) => {
    expect(fallbackTeamCode(name)).toBe(code);
  });

  it('is uppercase, Latin-only, 3 letters for ordinary names', () => {
    for (const n of ['Šibenik', 'Raków Częstochowa', 'Olympiacos', 'Galatasaray']) {
      expect(fallbackTeamCode(n)).toMatch(/^[A-Z]{3}$/);
    }
  });

  it('is deterministic', () => {
    expect(fallbackTeamCode('Bayer 04 Leverkusen')).toBe(fallbackTeamCode('Bayer 04 Leverkusen'));
    expect(fallbackTeamCode('Bayer 04 Leverkusen')).toBe('BLE');
  });

  it('falls back to TBD when there is no Latin name', () => {
    expect(fallbackTeamCode('الأهلي')).toBe('TBD');
    expect(fallbackTeamCode(null)).toBe('TBD');
  });
});

describe('teamCode', () => {
  const name = { en: 'Paris Saint Germain' };
  it('prefers the stored API-Football code', () => {
    expect(teamCode({ code: 'psg', name })).toBe('PSG');
    expect(teamCode({ code: ' ARS ', name: { en: 'Arsenal FC' } })).toBe('ARS');
  });
  it('generates a code when it is missing or not a clean 3-letter code', () => {
    expect(teamCode({ code: null, name: { en: 'Arsenal' } })).toBe('ARS');
    expect(teamCode({ code: '', name: { en: 'Arsenal' } })).toBe('ARS');
    expect(teamCode({ code: 'A1', name: { en: 'Arsenal' } })).toBe('ARS');
    expect(teamCode({ code: 'ARSE', name: { en: 'Arsenal' } })).toBe('ARS');
  });
  it('handles a missing team', () => {
    expect(teamCode(null)).toBe('TBD');
  });
});
