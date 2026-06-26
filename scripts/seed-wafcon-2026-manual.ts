/**
 * Manual seed of WAFCON 2026 from the CAF schedule PDF.
 *
 * Use until API-Football publishes WAFCON 2026 fixtures (currently 0 rows for league=922,
 * season=2026 from `provider.getFixtures`). All manually-created rows use sentinel IDs in a
 * reserved negative range so the future swap is one DELETE then `seed-wafcon-2026.ts`:
 *   - Teams: ids -1..-7 (Kenya W, Côte d'Ivoire W, Burkina Faso W, Egypt W, Malawi W,
 *     Cameroon W, Cape Verde W). The other 9 nations already exist with real API ids.
 *   - Fixtures: ids -1001..-1034 (24 group + 4 QF + 2 SF + 2 WC-Q play-offs + 1 3rd place + 1 Final).
 *
 * Kickoff times: PDF is local (Africa/Casablanca, UTC+1 in summer). 18h00 → 17:00Z, 21h00 → 20:00Z.
 *
 * Run: pnpm tsx --env-file=.env.local scripts/seed-wafcon-2026-manual.ts
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';
import { sql as dsql } from 'drizzle-orm';

const COMPETITION_ID = 922;
const SEASON = 2026;

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

function log(msg: string) {
  console.log(`[seed-wafcon-2026-manual] ${new Date().toISOString()} ${msg}`);
}

// ── Teams ─────────────────────────────────────────────────────────────────
// Existing women's national teams (real API-Football ids):
const TEAM_MAR = 14461;
const TEAM_ALG = 18257;
const TEAM_SEN = 18262;
const TEAM_RSA = 1978;
const TEAM_TAN = 21437;
const TEAM_NGA = 1730;
const TEAM_ZAM = 15584;
const TEAM_GHA = 15583;
const TEAM_MLI = 16937;

// Placeholder ids for the 7 women's national teams not yet in DB.
const TEAM_KEN = -1;
const TEAM_CIV = -2;
const TEAM_BFA = -3;
const TEAM_EGY = -4;
const TEAM_MWI = -5;
const TEAM_CMR = -6;
const TEAM_CPV = -7;

const PLACEHOLDER_TEAMS: Array<{
  id: number;
  slug: string;
  enName: string;
  frName: string;
  arName: string;
  countryCode: string | null;
}> = [
  {
    id: TEAM_KEN,
    slug: 'kenya-w',
    enName: 'Kenya W',
    frName: 'Kenya F',
    arName: 'كينيا (سيدات)',
    countryCode: 'KE',
  },
  {
    id: TEAM_CIV,
    slug: 'cote-divoire-w',
    enName: "Côte d'Ivoire W",
    frName: "Côte d'Ivoire F",
    arName: 'كوت ديفوار (سيدات)',
    countryCode: 'CI',
  },
  {
    id: TEAM_BFA,
    slug: 'burkina-faso-w',
    enName: 'Burkina Faso W',
    frName: 'Burkina Faso F',
    arName: 'بوركينا فاسو (سيدات)',
    countryCode: 'BF',
  },
  {
    id: TEAM_EGY,
    slug: 'egypt-w',
    enName: 'Egypt W',
    frName: 'Égypte F',
    arName: 'مصر (سيدات)',
    countryCode: 'EG',
  },
  {
    id: TEAM_MWI,
    slug: 'malawi-w',
    enName: 'Malawi W',
    frName: 'Malawi F',
    arName: 'مالاوي (سيدات)',
    countryCode: 'MW',
  },
  {
    id: TEAM_CMR,
    slug: 'cameroon-w',
    enName: 'Cameroon W',
    frName: 'Cameroun F',
    arName: 'الكاميرون (سيدات)',
    countryCode: 'CM',
  },
  // Cape Verde 'CV' isn't in our countries table (existing CPV men's team also has country_code=null);
  // leave null until a countries-table backfill lands rather than block the seed.
  {
    id: TEAM_CPV,
    slug: 'cape-verde-w',
    enName: 'Cape Verde W',
    frName: 'Cap-Vert F',
    arName: 'الرأس الأخضر (سيدات)',
    countryCode: null,
  },
];

// ── Groups (PDF draw order = group rank 1..4) ─────────────────────────────
const GROUPS: Array<{ label: string; teamIds: [number, number, number, number] }> = [
  { label: 'Group A', teamIds: [TEAM_MAR, TEAM_KEN, TEAM_SEN, TEAM_ALG] },
  { label: 'Group B', teamIds: [TEAM_TAN, TEAM_BFA, TEAM_CIV, TEAM_RSA] },
  { label: 'Group C', teamIds: [TEAM_NGA, TEAM_MWI, TEAM_EGY, TEAM_ZAM] },
  { label: 'Group D', teamIds: [TEAM_CPV, TEAM_MLI, TEAM_CMR, TEAM_GHA] },
];

// ── Fixtures ──────────────────────────────────────────────────────────────
// Casablanca is UTC+1 in summer (WEST). 18h00 → 17:00Z, 21h00 → 20:00Z, 20h00 → 19:00Z.
function k(date: string, hourLocal: number): Date {
  return new Date(`${date}T${String(hourLocal - 1).padStart(2, '0')}:00:00.000Z`);
}

interface FixtureSeed {
  id: number;
  round: string;
  homeTeamId: number | null;
  awayTeamId: number | null;
  kickoffAt: Date;
}

const FIXTURES: FixtureSeed[] = [
  // ── Group stage (24 matches) ─────────────────────────────────────────
  {
    id: -1001,
    round: 'Group Stage - Group A',
    homeTeamId: TEAM_MAR,
    awayTeamId: TEAM_KEN,
    kickoffAt: k('2026-07-26', 21),
  },
  {
    id: -1002,
    round: 'Group Stage - Group A',
    homeTeamId: TEAM_ALG,
    awayTeamId: TEAM_SEN,
    kickoffAt: k('2026-07-26', 18),
  },
  {
    id: -1003,
    round: 'Group Stage - Group B',
    homeTeamId: TEAM_RSA,
    awayTeamId: TEAM_TAN,
    kickoffAt: k('2026-07-27', 18),
  },
  {
    id: -1004,
    round: 'Group Stage - Group B',
    homeTeamId: TEAM_CIV,
    awayTeamId: TEAM_BFA,
    kickoffAt: k('2026-07-27', 21),
  },
  {
    id: -1005,
    round: 'Group Stage - Group C',
    homeTeamId: TEAM_NGA,
    awayTeamId: TEAM_MWI,
    kickoffAt: k('2026-07-28', 21),
  },
  {
    id: -1006,
    round: 'Group Stage - Group C',
    homeTeamId: TEAM_ZAM,
    awayTeamId: TEAM_EGY,
    kickoffAt: k('2026-07-28', 18),
  },
  {
    id: -1007,
    round: 'Group Stage - Group D',
    homeTeamId: TEAM_GHA,
    awayTeamId: TEAM_CPV,
    kickoffAt: k('2026-07-29', 18),
  },
  {
    id: -1008,
    round: 'Group Stage - Group D',
    homeTeamId: TEAM_CMR,
    awayTeamId: TEAM_MLI,
    kickoffAt: k('2026-07-29', 21),
  },
  {
    id: -1009,
    round: 'Group Stage - Group A',
    homeTeamId: TEAM_MAR,
    awayTeamId: TEAM_ALG,
    kickoffAt: k('2026-07-30', 21),
  },
  {
    id: -1010,
    round: 'Group Stage - Group A',
    homeTeamId: TEAM_SEN,
    awayTeamId: TEAM_KEN,
    kickoffAt: k('2026-07-30', 18),
  },
  {
    id: -1011,
    round: 'Group Stage - Group B',
    homeTeamId: TEAM_RSA,
    awayTeamId: TEAM_CIV,
    kickoffAt: k('2026-07-31', 18),
  },
  {
    id: -1012,
    round: 'Group Stage - Group B',
    homeTeamId: TEAM_BFA,
    awayTeamId: TEAM_TAN,
    kickoffAt: k('2026-07-31', 21),
  },
  {
    id: -1013,
    round: 'Group Stage - Group C',
    homeTeamId: TEAM_NGA,
    awayTeamId: TEAM_ZAM,
    kickoffAt: k('2026-08-01', 21),
  },
  {
    id: -1014,
    round: 'Group Stage - Group C',
    homeTeamId: TEAM_EGY,
    awayTeamId: TEAM_MWI,
    kickoffAt: k('2026-08-01', 18),
  },
  {
    id: -1015,
    round: 'Group Stage - Group D',
    homeTeamId: TEAM_GHA,
    awayTeamId: TEAM_CMR,
    kickoffAt: k('2026-08-02', 18),
  },
  {
    id: -1016,
    round: 'Group Stage - Group D',
    homeTeamId: TEAM_MLI,
    awayTeamId: TEAM_CPV,
    kickoffAt: k('2026-08-02', 21),
  },
  {
    id: -1017,
    round: 'Group Stage - Group A',
    homeTeamId: TEAM_SEN,
    awayTeamId: TEAM_MAR,
    kickoffAt: k('2026-08-03', 21),
  },
  {
    id: -1018,
    round: 'Group Stage - Group A',
    homeTeamId: TEAM_KEN,
    awayTeamId: TEAM_ALG,
    kickoffAt: k('2026-08-03', 21),
  },
  {
    id: -1019,
    round: 'Group Stage - Group B',
    homeTeamId: TEAM_BFA,
    awayTeamId: TEAM_RSA,
    kickoffAt: k('2026-08-04', 21),
  },
  {
    id: -1020,
    round: 'Group Stage - Group B',
    homeTeamId: TEAM_TAN,
    awayTeamId: TEAM_CIV,
    kickoffAt: k('2026-08-04', 21),
  },
  {
    id: -1021,
    round: 'Group Stage - Group C',
    homeTeamId: TEAM_EGY,
    awayTeamId: TEAM_NGA,
    kickoffAt: k('2026-08-05', 21),
  },
  {
    id: -1022,
    round: 'Group Stage - Group C',
    homeTeamId: TEAM_MWI,
    awayTeamId: TEAM_ZAM,
    kickoffAt: k('2026-08-05', 21),
  },
  {
    id: -1023,
    round: 'Group Stage - Group D',
    homeTeamId: TEAM_MLI,
    awayTeamId: TEAM_GHA,
    kickoffAt: k('2026-08-06', 21),
  },
  {
    id: -1024,
    round: 'Group Stage - Group D',
    homeTeamId: TEAM_CPV,
    awayTeamId: TEAM_CMR,
    kickoffAt: k('2026-08-06', 21),
  },
  // ── Knockout (8 matches) ─────────────────────────────────────────────
  {
    id: -1025,
    round: 'Quarter-finals',
    homeTeamId: null,
    awayTeamId: null,
    kickoffAt: k('2026-08-08', 21),
  },
  {
    id: -1026,
    round: 'Quarter-finals',
    homeTeamId: null,
    awayTeamId: null,
    kickoffAt: k('2026-08-08', 18),
  },
  {
    id: -1027,
    round: 'Quarter-finals',
    homeTeamId: null,
    awayTeamId: null,
    kickoffAt: k('2026-08-09', 21),
  },
  {
    id: -1028,
    round: 'Quarter-finals',
    homeTeamId: null,
    awayTeamId: null,
    kickoffAt: k('2026-08-09', 18),
  },
  {
    id: -1029,
    round: 'Semi-finals',
    homeTeamId: null,
    awayTeamId: null,
    kickoffAt: k('2026-08-12', 21),
  },
  {
    id: -1030,
    round: 'Semi-finals',
    homeTeamId: null,
    awayTeamId: null,
    kickoffAt: k('2026-08-12', 18),
  },
  // WC Qualifying play-offs — deliberately a non-canonical round so the knockout-bracket
  // builder ignores them (still surface in Fixtures).
  {
    id: -1031,
    round: 'WC Qualifying Play-offs',
    homeTeamId: null,
    awayTeamId: null,
    kickoffAt: k('2026-08-13', 21),
  },
  {
    id: -1032,
    round: 'WC Qualifying Play-offs',
    homeTeamId: null,
    awayTeamId: null,
    kickoffAt: k('2026-08-13', 18),
  },
  {
    id: -1033,
    round: '3rd Place Final',
    homeTeamId: null,
    awayTeamId: null,
    kickoffAt: k('2026-08-15', 18),
  },
  { id: -1034, round: 'Final', homeTeamId: null, awayTeamId: null, kickoffAt: k('2026-08-16', 20) },
];

async function main() {
  const t0 = Date.now();

  log('Upserting placeholder teams...');
  for (const t of PLACEHOLDER_TEAMS) {
    await db
      .insert(schema.teams)
      .values({
        id: t.id,
        slug: t.slug,
        name: { en: t.enName, fr: t.frName, ar: t.arName },
        shortName: { en: t.enName, fr: t.frName, ar: t.arName },
        code: null,
        countryCode: t.countryCode,
        logoUrl: null,
        isNational: true,
        isWomen: true,
      })
      .onConflictDoUpdate({
        target: schema.teams.id,
        set: {
          slug: t.slug,
          name: { en: t.enName, fr: t.frName, ar: t.arName },
          shortName: { en: t.enName, fr: t.frName, ar: t.arName },
          countryCode: t.countryCode,
          isNational: true,
          isWomen: true,
        },
      });
  }
  log(`  ${PLACEHOLDER_TEAMS.length} placeholder teams upserted`);

  log('Clearing existing WAFCON 2026 standings...');
  await db.execute(
    dsql`DELETE FROM standings WHERE competition_id = ${COMPETITION_ID} AND season_year = ${SEASON}`,
  );

  log('Inserting standings...');
  let standingRows = 0;
  for (const g of GROUPS) {
    for (let i = 0; i < g.teamIds.length; i++) {
      await db.insert(schema.standings).values({
        competitionId: COMPETITION_ID,
        seasonYear: SEASON,
        groupLabel: g.label,
        teamId: g.teamIds[i],
        rank: i + 1,
        points: 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        form: null,
        description: null,
      });
      standingRows++;
    }
  }
  log(`  ${standingRows} standings rows inserted`);

  log('Upserting fixtures...');
  for (const f of FIXTURES) {
    await db
      .insert(schema.fixtures)
      .values({
        id: f.id,
        competitionId: COMPETITION_ID,
        seasonYear: SEASON,
        round: f.round,
        roundNumber: null,
        kickoffAt: f.kickoffAt,
        statusCode: 'NS',
        minute: null,
        homeTeamId: f.homeTeamId,
        awayTeamId: f.awayTeamId,
        homeScore: null,
        awayScore: null,
        homeScoreHt: null,
        awayScoreHt: null,
        homeScoreFt: null,
        awayScoreFt: null,
        homeScoreEt: null,
        awayScoreEt: null,
        homeScorePen: null,
        awayScorePen: null,
        venueId: null,
        referee: null,
      })
      .onConflictDoUpdate({
        target: schema.fixtures.id,
        set: {
          round: f.round,
          kickoffAt: f.kickoffAt,
          homeTeamId: f.homeTeamId,
          awayTeamId: f.awayTeamId,
        },
      });
  }
  log(`  ${FIXTURES.length} fixtures upserted`);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  log(`WAFCON 2026 manual seed complete in ${elapsed}s`);
}

main().catch((err) => {
  console.error('[seed-wafcon-2026-manual] Fatal error:', err);
  process.exit(1);
});
