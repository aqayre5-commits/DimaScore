import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  hubKeyForCompetition,
  moroccoHubHref,
  moroccoHubLinks,
} from '@/lib/constants/morocco-hubs';
import { MOROCCO_HUB_INTROS, approvedHubIntro } from '@/lib/constants/morocco-hub-intros';

describe('Morocco hub cross-links', () => {
  it('links every other hub with existing locale URLs', () => {
    const links = moroccoHubLinks('fr', 'lionsAbroad');
    expect(links.map((l) => l.key)).not.toContain('lionsAbroad');
    expect(links.map((l) => l.href)).toEqual(
      expect.arrayContaining([
        '/fr/equipe/morocco-31',
        '/fr/edition/maroc',
        '/fr/classement-botola-pro',
        '/fr/competition/maroc/botola-pro',
      ]),
    );
    expect(moroccoHubHref('botolaStandings', 'en')).toBe('/en/botola-pro-standings');
    for (const l of moroccoHubLinks('ar')) expect(l.href.startsWith('/ar/')).toBe(true);
    expect(moroccoHubLinks('en')).toHaveLength(8);
  });

  it('uses the real localized competition URLs the site links to', () => {
    const href = (locale: 'en' | 'fr' | 'ar', key: string) =>
      moroccoHubLinks(locale).find((l) => l.key === key)?.href;
    expect(href('en', 'botola')).toBe('/en/competition/morocco/botola-pro');
    expect(href('fr', 'botola')).toBe('/fr/competition/maroc/botola-pro');
    expect(href('ar', 'botola')).toBe('/ar/competition/المغرب/البطولة-الاحترافية');
    expect(href('en', 'afcon')).toBe('/en/competition/caf/afcon-2025');
    expect(href('fr', 'afcon')).toBe('/fr/competition/caf/can-2025');
    expect(href('ar', 'afcon')).toBe('/ar/competition/كاف/كأس-أمم-إفريقيا-2025');
    expect(href('en', 'worldCup')).toBe('/en/competition/fifa/world-cup-2026');
    expect(href('ar', 'worldCup')).toBe('/ar/competition/فيفا/كأس-العالم-2026');
    for (const locale of ['en', 'fr', 'ar'] as const)
      for (const l of moroccoHubLinks(locale)) expect(l.href).not.toMatch(/\/x\/|undefined|null/);
  });

  it('maps competition pages to their hub key', () => {
    expect(hubKeyForCompetition(200)).toBe('botola');
    expect(hubKeyForCompetition(6)).toBe('afcon');
    expect(hubKeyForCompetition(1)).toBe('worldCup');
    expect(hubKeyForCompetition(36)).toBeNull();
  });
});

describe('draft hub intros', () => {
  it('are all drafts and never render until approved', () => {
    for (const [key, intro] of Object.entries(MOROCCO_HUB_INTROS)) {
      expect(intro!.approved).toBe(false);
      expect(approvedHubIntro(key as never, 'en')).toBeNull();
    }
  });

  it('are written per hub, in all three languages, with no shared sentences', () => {
    const sentences = new Map<string, string>();
    for (const [key, intro] of Object.entries(MOROCCO_HUB_INTROS)) {
      for (const locale of ['en', 'fr', 'ar'] as const) {
        const text = intro!.text[locale];
        expect(text.length).toBeGreaterThan(80);
        for (const s of text.split(/(?<=[.!?])\s+/)) {
          expect(sentences.get(s), `"${s}" reused in ${key}`).toBeUndefined();
          sentences.set(s, key);
        }
      }
    }
  });
});

describe('draft hub intros: only sourced claims', () => {
  const all = (l: 'en' | 'fr' | 'ar') =>
    Object.values(MOROCCO_HUB_INTROS)
      .map((i) => i!.text[l])
      .join('\n');

  it('no longer make the claims cut in review', () => {
    for (const l of ['en', 'fr', 'ar'] as const) {
      const t = all(l);
      expect(t).not.toMatch(/FRMF|Fédération royale|الجامعة الملكية/); // who runs the team
      expect(t).not.toMatch(/\b48\b|Canada|Canadá|كندا|qualif|تأهل/); // World Cup 2026 facts
      expect(t).not.toMatch(
        /Botola 2|Coupe du Trône|CAF competitions|compétitions CAF|كأس العرش|مسابقات الكاف/,
      );
      expect(t).not.toMatch(/\b30\b|matchdays|journées|جولة/); // matchday count
      expect(t).not.toMatch(/\bMany\b|De nombreux|كثير/); // unsourced quantifier
    }
  });

  it('keep the sourced facts: 2022 semi-final, 16 clubs, LNFP, AFCON 2025 dates and 24 teams', () => {
    expect(MOROCCO_HUB_INTROS.morocco!.text.en).toMatch(/first African and Arab side.*semi-final/);
    expect(MOROCCO_HUB_INTROS.morocco!.text.en).toContain('2022');
    expect(MOROCCO_HUB_INTROS.botola!.text.en).toMatch(/LNFP.*16 clubs/);
    expect(MOROCCO_HUB_INTROS.botola!.text.fr).toMatch(/LNFP.*16 clubs/);
    expect(MOROCCO_HUB_INTROS.botola!.text.ar).toContain('16');
    expect(MOROCCO_HUB_INTROS.afcon!.text.en).toContain(
      'from 21 December 2025 to 18 January 2026 with 24 teams',
    );
    expect(MOROCCO_HUB_INTROS.afcon!.text.fr).toContain(
      'du 21 décembre 2025 au 18 janvier 2026 avec 24 sélections',
    );
  });

  it('write Arabic dates with Moroccan month names', () => {
    const ar = MOROCCO_HUB_INTROS.afcon!.text.ar;
    expect(ar).toContain('من 21 دجنبر 2025 إلى 18 يناير 2026');
    expect(ar).not.toMatch(/ديسمبر|يوليو(?!ز)|نوفمبر|سبتمبر|أغسطس|مايو/);
  });
});

describe('tournament H1', () => {
  it('contains the title once (AFCON / World Cup H1 was doubled)', () => {
    const src = readFileSync(
      join(process.cwd(), 'src/components/tournament/TournamentPageHeader.tsx'),
      'utf8',
    );
    const h1s = src.match(/<h1[\s\S]*?<\/h1>/g) ?? [];
    expect(h1s.length).toBeGreaterThan(0);
    for (const h1 of h1s)
      expect(h1.match(/\{pageTitle(Short)?(\s*\?\?\s*pageTitle)?\}/g)).toHaveLength(1);
  });
});
