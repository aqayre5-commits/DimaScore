import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONTACT_EMAIL, HOSTING, SITE_PAGES_CONTENT } from '@/lib/constants/site-pages-content';
import { buildAboutPageGraph } from '@/lib/seo/about-jsonld';
import { execSync } from 'node:child_process';
import { buildFounder, buildOrganization } from '@/lib/seo/jsonld';
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
  it.each(LOCALES)(
    '%s: privacy, terms and legal name DimaScore as a sole-operator site',
    (locale) => {
      const controller = {
        en: 'The data controller is DimaScore (the operator), a site run by an individual sole operator; it is not run by a company. Location: Manchester, United Kingdom.',
        fr: 'Le responsable du traitement est DimaScore (l’opérateur), un site exploité par une personne physique, opérateur individuel ; il n’est pas exploité par une société. Localisation : Manchester, Royaume-Uni.',
        ar: 'الجهة المسؤولة عن معالجة البيانات هي ديماسكور (المشغّل)، وهو موقع يديره فرد بصفته مشغّلًا مستقلًا، ولا تديره شركة. الموقع: مانشستر، المملكة المتحدة.',
      }[locale];
      expect(text(locale, 'privacy')).toContain(controller);
      const where = { en: 'Manchester, United Kingdom', fr: 'Manchester', ar: 'مانشستر' }[locale];
      for (const key of ['about', 'terms', 'legal'] as const) {
        const c = SITE_PAGES_CONTENT[locale][key];
        expect(c.sections.flatMap((x) => x.body).join('\n')).toContain(where);
      }
      // GDPR wording and governing law stay.
      expect(text(locale, 'privacy')).toMatch(/UK GDPR|RGPD britannique|المملكة المتحدة/);
      expect(JSON.stringify(SITE_PAGES_CONTENT[locale].terms)).toMatch(
        /England and Wales|Angleterre et du Pays de Galles|إنجلترا وويلز/,
      );
    },
  );

  it.each(LOCALES)('%s: no company, company number or address is named', (locale) => {
    const all = JSON.stringify(SITE_PAGES_CONTENT[locale]);
    expect(all).not.toMatch(/\bREN\b|REN Technology|13694812/);
    expect(all).not.toMatch(/Chester Road|Stretford|M32 0PA|Taxassist/);
  });

  it.each(LOCALES)(
    '%s: About names the founder and editor; no other page names a person',
    (locale) => {
      const line = {
        en: 'Abdilahi Qayre, founder and editor.',
        fr: 'Abdilahi Qayre, fondateur et éditeur.',
        ar: 'Abdilahi Qayre، المؤسس والمحرّر.',
      }[locale];
      expect(SITE_PAGES_CONTENT[locale].about.sections[0].body).toContain(line);
      // Name and role only: no bio, credentials or LinkedIn.
      expect(text(locale, 'about')).not.toMatch(/linkedin|Abdilahi Qayre (is|est)|diplôm|degree/i);
      for (const key of Object.keys(SITE_PAGES_CONTENT[locale]).filter((k) => k !== 'about')) {
        expect(JSON.stringify(SITE_PAGES_CONTENT[locale][key as 'about'])).not.toMatch(
          /Abdilahi|Qayre/,
        );
      }
    },
  );

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

  it('every static page uses the confirmed contact address, never dimascore.com', () => {
    expect(CONTACT_EMAIL).toBe('contact@dimascore.ma');
    for (const locale of LOCALES) {
      const all = JSON.stringify(SITE_PAGES_CONTENT[locale]);
      expect(all).not.toContain('@dimascore.com');
      for (const key of ['about', 'privacy', 'cookiePolicy'] as const)
        expect(text(locale, key)).toContain('contact@dimascore.ma');
    }
    expect(read('src/app/[locale]/(app)/contact/page.tsx')).toContain('mailto:${CONTACT_EMAIL}');
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

  it('hosting lines match the current hosts (update all 3 languages if the site moves)', () => {
    // Vercel: the app ships with a vercel.json (crons). Railway: the Soketi realtime server.
    expect(read('vercel.json')).toContain('"crons"');
    expect(read('next.config.ts')).toMatch(/Soketi \(Railway\)[\s\S]*NEXT_PUBLIC_PUSHER_HOST/);
    expect(HOSTING).toEqual({ site: 'Vercel', realtime: 'Railway' });
    for (const locale of LOCALES) {
      expect(text(locale, 'privacy')).toContain(HOSTING.site);
      expect(text(locale, 'privacy')).toContain(HOSTING.realtime);
      expect(text(locale, 'cookiePolicy')).not.toMatch(/Vercel|Railway|Cloudflare/);
    }
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
  const BASE = 'https://dimascore.ma';
  const graph = (locale: 'en' | 'fr' | 'ar') =>
    buildAboutPageGraph(BASE, locale, { title: 'À propos de DimaScore', description: 'x' })[
      '@graph'
    ];

  it('has the AboutPage node about the sitewide DimaScore organization', () => {
    expect(graph('fr')[0]).toEqual({
      '@type': 'AboutPage',
      '@id': 'https://dimascore.ma/fr/about#page',
      url: 'https://dimascore.ma/fr/about',
      name: 'À propos de DimaScore',
      description: 'x',
      inLanguage: 'fr',
      isPartOf: { '@id': 'https://dimascore.ma/#website' },
      about: { '@id': 'https://dimascore.ma/#organization' },
    });
  });

  const JOB_TITLE = { en: 'Founder and Editor', fr: 'Fondateur et éditeur', ar: 'المؤسس والمحرّر' };

  it('the About graph adds the founder Person (name and job title only) and links it from #organization', () => {
    for (const locale of LOCALES) {
      const nodes = graph(locale);
      expect(nodes).toContainEqual({
        '@type': 'Person',
        '@id': 'https://dimascore.ma/#founder',
        name: 'Abdilahi Qayre',
        jobTitle: JOB_TITLE[locale],
      });
      expect(nodes).toContainEqual({
        '@type': 'NewsMediaOrganization',
        '@id': 'https://dimascore.ma/#organization',
        founder: { '@id': 'https://dimascore.ma/#founder' },
      });
    }
  });

  it('the job title is in the page language and matches the role the visible About text gives', () => {
    const src = readFileSync(
      join(process.cwd(), 'src/lib/constants/site-pages-content.ts'),
      'utf8',
    );
    for (const locale of LOCALES) {
      const person = graph(locale).find((n) => n['@type'] === 'Person')!;
      // sentence case in prose ("Abdilahi Qayre, fondateur et éditeur."), capitalised as a title
      expect(src.toLowerCase()).toContain(
        `abdilahi qayre${locale === 'ar' ? '،' : ','} ${String(person.jobTitle).toLowerCase()}`,
      );
    }
  });

  it('falls back to the English job title for an unknown locale', () => {
    expect(buildFounder(BASE).jobTitle).toBe('Founder and Editor');
    expect(buildFounder(BASE, 'de').jobTitle).toBe('Founder and Editor');
  });

  it('the sitewide organization stays name, url, logo and sameAs X: no founder', () => {
    const org = buildOrganization(BASE);
    expect(Object.keys(org).sort()).toEqual(['@id', '@type', 'logo', 'name', 'sameAs', 'url']);
    expect(org.sameAs).toEqual(['https://x.com/DimaScoreMa']);
  });

  it('the founder is emitted on About only: not by the sitewide layout, not by any other page', () => {
    const root = process.cwd();
    const offenders = execSync(
      "grep -rlE 'buildFounder|#founder|founderId' src --include=*.ts --include=*.tsx || true",
      { cwd: root },
    )
      .toString()
      .split('\n')
      .filter(Boolean)
      .sort();
    expect(offenders).toEqual(['src/lib/seo/about-jsonld.ts', 'src/lib/seo/jsonld.ts']);
  });

  it('no JSON-LD names REN, the company number or a parent organization', () => {
    for (const locale of LOCALES) {
      const json = JSON.stringify(graph(locale)) + JSON.stringify(buildOrganization(BASE));
      expect(json).not.toMatch(/\bREN\b|13694812|parentOrganization|linkedin/i);
    }
  });

  it('no file in the repo names the former company or its number (docs included)', () => {
    const hits = execSync(
      "grep -rlE 'REN Technology|13694812' . --include=*.ts --include=*.tsx --include=*.md --include=*.json --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git || true",
      { cwd: process.cwd() },
    )
      .toString()
      .split('\n')
      .filter(Boolean)
      .filter((f) => !f.endsWith('trust-pages.test.ts'));
    expect(hits).toEqual([]);
  });
});
