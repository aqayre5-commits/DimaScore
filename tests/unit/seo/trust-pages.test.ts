import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SITE_PAGES_CONTENT } from '@/lib/constants/site-pages-content';
import { buildAboutPageGraph, OPERATOR } from '@/lib/seo/about-jsonld';
import { routing } from '@/lib/i18n/routing';

// About, privacy and cookie copy (Revamp R7) states facts about the code. These tests pin each fact
// to its source, so changing the behaviour without changing the copy (or the reverse) fails here.
const LOCALES = ['en', 'fr', 'ar'] as const;
const read = (p: string) => readFileSync(p, 'utf8');
const text = (locale: (typeof LOCALES)[number], key: 'about' | 'privacy' | 'cookiePolicy') => {
  const c = SITE_PAGES_CONTENT[locale][key];
  return [c.title, c.description, ...c.sections.flatMap((s) => [s.heading, ...s.body])].join('\n');
};

describe('trust pages copy', () => {
  it.each(LOCALES)('%s: About and privacy name the operator and company number', (locale) => {
    for (const key of ['about', 'privacy'] as const) {
      expect(text(locale, key)).toContain(OPERATOR.legalName);
      expect(text(locale, key)).toContain(OPERATOR.companyNumber);
    }
  });

  it.each(LOCALES)('%s: no analytics, pixel or consent claims', (locale) => {
    for (const key of ['about', 'privacy', 'cookiePolicy'] as const) {
      expect(text(locale, key)).not.toMatch(
        /Google Analytics|GA4|Tag Manager|Meta Pixel|Facebook|strictly necessary|strictement nécessaires|الضرورية|licensed|sous licence|predictions|pronostics|التوقّعات/i,
      );
    }
  });

  it.each(LOCALES)('%s: every section has a heading and a non-empty body', (locale) => {
    for (const key of ['about', 'privacy', 'cookiePolicy'] as const) {
      for (const s of SITE_PAGES_CONTENT[locale][key].sections) {
        expect(s.heading.trim()).not.toBe('');
        expect(s.body.length).toBeGreaterThan(0);
        for (const p of s.body) expect(p.trim()).not.toBe('');
      }
    }
  });

  it('every locale has the same section count per page', () => {
    for (const key of ['about', 'privacy', 'cookiePolicy'] as const) {
      const counts = LOCALES.map((l) => SITE_PAGES_CONTENT[l][key].sections.length);
      expect(new Set(counts).size).toBe(1);
    }
  });
});

describe('facts the copy relies on', () => {
  it('"no cookies": next-intl does not set a locale cookie', () => {
    expect(routing.localeCookie).toBe(false);
  });

  it('"no analytics or pixels": no tag snippets in the layout or CSP', () => {
    const src = read('src/app/[locale]/layout.tsx') + read('next.config.ts');
    expect(src).not.toMatch(/googletagmanager|google-analytics|connect\.facebook\.net|fbq\(/);
  });

  it('"local storage holds theme and follows": the two keys exist', () => {
    expect(read('src/components/chrome/ThemeToggle.tsx')).toContain("'atlas-theme'");
    expect(read('src/hooks/useFollows.ts')).toContain("'dimascore:follows'");
  });

  it('"videos use privacy-enhanced mode, on open": lite embed with cookie={false}', () => {
    expect(read('src/components/media/VideoPlayerModal.tsx')).toMatch(
      /LiteYouTubeEmbed[^>]*cookie=\{false\}/,
    );
  });

  it('"flags load from media.api-sports.io"', () => {
    expect(read('src/components/shared/Flag.tsx')).toContain('https://media.api-sports.io/flags/');
  });

  it('refresh cadence: live 15 s; fixtures and standings 30 min; scorers daily; squads weekly', () => {
    expect(read('workers/live-poller/src/index.ts')).toMatch(/LIVE_INTERVAL_MS = 15_000/);
    const crons = (
      JSON.parse(read('vercel.json')) as { crons: { path: string; schedule: string }[] }
    ).crons;
    const at = (p: string) => crons.find((c) => c.path === `/api/cron/${p}`)?.schedule;
    expect(at('fixtures-schedule')).toBe('0,30 * * * *');
    expect(at('standings')).toBe('15,45 * * * *');
    expect(at('top-scorers')).toMatch(/^\d+ \d+ \* \* \*$/);
    expect(at('squads-refresh')).toMatch(/^\d+ \d+ \* \* \d$/);
  });
});

describe('About JSON-LD', () => {
  it('links the AboutPage, DimaScore and the operating company', () => {
    const g = buildAboutPageGraph('https://dimascore.ma', 'fr', {
      title: 'À propos de DimaScore',
      description: 'x',
    });
    const nodes = g['@graph'] as Record<string, unknown>[];
    expect(nodes[0]).toMatchObject({
      '@type': 'AboutPage',
      url: 'https://dimascore.ma/fr/about',
      inLanguage: 'fr',
      about: { '@id': 'https://dimascore.ma/#organization' },
    });
    expect(nodes[1]).toMatchObject({
      '@id': 'https://dimascore.ma/#organization',
      parentOrganization: { '@id': 'https://dimascore.ma/#operator' },
    });
    expect(nodes[2]).toMatchObject({
      legalName: 'REN Technology Limited',
      identifier: { value: '13694812' },
    });
  });
});
