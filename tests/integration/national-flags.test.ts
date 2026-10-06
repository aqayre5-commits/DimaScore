import { describe, it, expect } from 'vitest';
import { neon } from '@neondatabase/serverless';

/**
 * Phase 16 · Task B (#6) — regression guard for national-team flags.
 *
 * National teams render their flag from `media.api-sports.io/flags/{country_code}.svg` via
 * getNationalFlagUrl, which does NOT check that the file exists — a national team with a null or
 * bad country_code therefore renders a broken image. This integration test (opt-in, needs DB +
 * network) asserts two things:
 *   1. The home nations, Kosovo and Palestine keep their exact country_code (the codes that are
 *      easy to null or mangle: GB-ENG / GB-SCT / GB-WLS / GB-NIR / XK / PS).
 *   2. Every distinct country_code used by a national team resolves to a 200 flag on the CDN.
 *
 * Run: pnpm test:integration
 */
const sql = neon(process.env.DATABASE_URL!);
const q = (s: string, p: unknown[] = []) =>
  sql.query(s, p).then((r) => r as Record<string, unknown>[]);

const EXPECTED: Record<string, string> = {
  England: 'GB-ENG',
  Scotland: 'GB-SCT',
  Wales: 'GB-WLS',
  'Northern Ireland': 'GB-NIR',
  Kosovo: 'XK',
  Palestine: 'PS',
};

async function flagOk(ccLower: string): Promise<boolean> {
  try {
    const res = await fetch(`https://media.api-sports.io/flags/${ccLower}.svg`, { method: 'HEAD' });
    return res.status === 200;
  } catch {
    return false;
  }
}

describe('national-team flags (integration)', () => {
  it('home nations, Kosovo and Palestine keep their exact country_code', async () => {
    const rows = await q(
      `SELECT name->>'en' AS en, country_code FROM teams WHERE name->>'en' = ANY($1)`,
      [Object.keys(EXPECTED)],
    );
    const got = Object.fromEntries(rows.map((r) => [String(r.en), r.country_code]));
    for (const [name, code] of Object.entries(EXPECTED)) {
      expect(got[name], `${name} should exist`).toBeDefined();
      expect(got[name], `${name} country_code`).toBe(code);
    }
  });

  it('every national-team country_code resolves to a 200 flag on the CDN', async () => {
    const rows = await q(
      `SELECT DISTINCT country_code AS cc FROM teams WHERE is_national = true AND country_code IS NOT NULL`,
    );
    const codes = rows.map((r) => String(r.cc));
    const results = await Promise.all(
      codes.map(async (cc) => ({ cc, ok: await flagOk(cc.toLowerCase()) })),
    );
    const broken = results.filter((r) => !r.ok).map((r) => r.cc);
    expect(broken, `country codes with no flag SVG: ${broken.join(', ')}`).toEqual([]);
  }, 60_000);

  it('national teams without a country_code would render no flag (visibility check)', async () => {
    const [row] = await q(
      `SELECT count(*)::int AS n FROM teams WHERE is_national = true AND country_code IS NULL`,
    );
    expect(Number(row.n), 'national teams missing country_code (fall back to logo/initials)').toBe(
      0,
    );
  });
});
