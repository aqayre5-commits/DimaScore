import { describe, expect, it } from 'vitest';
import {
  BOTOLA_PRO_ID,
  competitionSlugAliases,
  normalizeCompetitionSlug,
  resolveCompetitionEntry,
  resolveCompetitionId,
} from '@/lib/competitions/resolve-competition';

const BOTOLA_AR = 'البطولة-الاحترافية';
const BOTOLA_AR_COUNTRY = 'المغرب';

describe('normalizeCompetitionSlug', () => {
  it('NFC-normalizes and unifies dash variants', () => {
    const nfd = BOTOLA_AR.normalize('NFD');
    expect(normalizeCompetitionSlug(nfd)).toBe(BOTOLA_AR.normalize('NFC'));
    expect(normalizeCompetitionSlug('botola\u2013pro')).toBe('botola-pro');
  });

  it('decodes a percent-encoded Arabic Botola slug', () => {
    expect(normalizeCompetitionSlug(encodeURIComponent(BOTOLA_AR))).toBe(BOTOLA_AR);
  });
});

describe('resolveCompetitionEntry — Botola aliases', () => {
  const aliases = [
    'botola-pro',
    'Botola-Pro',
    BOTOLA_AR,
    encodeURIComponent(BOTOLA_AR),
    BOTOLA_AR.normalize('NFD'),
  ];

  it('maps every Botola slug alias to competition id 200', () => {
    for (const slug of aliases) {
      expect(resolveCompetitionId(slug)).toBe(BOTOLA_PRO_ID);
      expect(resolveCompetitionEntry(slug)?.competitionId).toBe(BOTOLA_PRO_ID);
    }
  });

  it('published mega-menu slugs all resolve to the same id', () => {
    const published = competitionSlugAliases(BOTOLA_PRO_ID);
    expect(published).toContain('botola-pro');
    expect(published).toContain(BOTOLA_AR);
    for (const slug of published) {
      expect(resolveCompetitionId(slug)).toBe(BOTOLA_PRO_ID);
    }
  });

  it('does not confuse the country slug with the tournament slug', () => {
    expect(resolveCompetitionId(BOTOLA_AR_COUNTRY)).toBeUndefined();
  });
});
