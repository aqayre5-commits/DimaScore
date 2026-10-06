/**
 * Backfill `country_code` for NATIONAL teams that already have `is_national = true` but a NULL
 * country_code. Without it, getNationalFlagUrl (src/lib/team-display.ts) can't build the flag SVG
 * URL and falls back to the team's logo_url (a PNG) — so these sides render an inconsistent crest
 * instead of the clean, shared country flag.
 *
 * FK-aware: `teams.country_code` references `countries.code` (stored UPPERCASE). These 42 countries
 * are missing from the `countries` sync, so we upsert them first (same shape as the reference-data
 * ingestion: code + name jsonb + flag_url, ON CONFLICT DO NOTHING), then set teams.country_code.
 * Codes are stored uppercase to satisfy the FK; getNationalFlagUrl lowercases at render time.
 *
 * Matching keys on the BASE name (age-group U15–U23 and women's suffix stripped), so youth/women
 * sides inherit their senior nation's code automatically (e.g. "Mozambique U23" → MZ).
 *
 * Safety: each code is HEAD-checked against media.api-sports.io/flags/{cc}.svg; a team is updated
 * only when its flag returns 200. Unmapped teams / missing flags are skipped and reported — they
 * keep their working logo_url fallback (no regression).
 *
 * Run:
 *   pnpm tsx --env-file=.env.local scripts/backfill-national-country-codes.ts          # dry-run
 *   pnpm tsx --env-file=.env.local scripts/backfill-national-country-codes.ts --apply   # write
 */
import { neon } from '@neondatabase/serverless';

const apply = process.argv.includes('--apply');
const AGE = /\s*U-?(1[5-9]|2[0-3])\b/i;

function baseName(n: string): string {
  return n
    .replace(AGE, ' ')
    .replace(/\s*\(?W(omen)?\)?\s*$/i, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Base name (lowercased) → ISO 3166-1 alpha-2 (UPPERCASE, to match countries.code).
// Aliases cover spelling variants API-Football uses for the same country.
const NAME_TO_ISO2: Record<string, string> = {
  madagascar: 'MG',
  eritrea: 'ER',
  'sierra leone': 'SL',
  niger: 'NE',
  mozambique: 'MZ',
  'guinea-bissau': 'GW',
  seychelles: 'SC',
  'equatorial guinea': 'GQ',
  chad: 'TD',
  comoros: 'KM',
  'central african republic': 'CF',
  'cape verde islands': 'CV',
  'cape verde': 'CV',
  djibouti: 'DJ',
  afghanistan: 'AF',
  'north korea': 'KP',
  'korea dpr': 'KP',
  bahamas: 'BS',
  guyana: 'GY',
  'new caledonia': 'NC',
  'solomon islands': 'SB',
  'sri lanka': 'LK',
  tahiti: 'PF',
  'turks and caicos islands': 'TC',
  vanuatu: 'VU',
  dominica: 'DM',
  'st. kitts and nevis': 'KN',
  'timor-leste': 'TL',
  brunei: 'BN',
  'puerto rico': 'PR',
  'st. lucia': 'LC',
  'st. vincent / grenadines': 'VC',
  'st. vincent / gren.': 'VC',
  tonga: 'TO',
  martinique: 'MQ',
  guam: 'GU',
  anguilla: 'AI',
  'british virgin islands': 'VG',
  'cayman islands': 'KY',
  'us virgin islands': 'VI',
  'american samoa': 'AS',
  'cook islands': 'CK',
  'papua new guinea': 'PG',
  samoa: 'WS',
  bonaire: 'BQ',
};

// Canonical English name per code, used for the countries row (en-only, matching existing rows).
const ISO2_NAME: Record<string, string> = {
  MG: 'Madagascar',
  ER: 'Eritrea',
  SL: 'Sierra Leone',
  NE: 'Niger',
  MZ: 'Mozambique',
  GW: 'Guinea-Bissau',
  SC: 'Seychelles',
  GQ: 'Equatorial Guinea',
  TD: 'Chad',
  KM: 'Comoros',
  CF: 'Central African Republic',
  CV: 'Cape Verde Islands',
  DJ: 'Djibouti',
  AF: 'Afghanistan',
  KP: 'North Korea',
  BS: 'Bahamas',
  GY: 'Guyana',
  NC: 'New Caledonia',
  SB: 'Solomon Islands',
  LK: 'Sri Lanka',
  PF: 'Tahiti',
  TC: 'Turks and Caicos Islands',
  VU: 'Vanuatu',
  DM: 'Dominica',
  KN: 'St. Kitts and Nevis',
  TL: 'Timor-Leste',
  BN: 'Brunei',
  PR: 'Puerto Rico',
  LC: 'St. Lucia',
  VC: 'St. Vincent / Grenadines',
  TO: 'Tonga',
  MQ: 'Martinique',
  GU: 'Guam',
  AI: 'Anguilla',
  VG: 'British Virgin Islands',
  KY: 'Cayman Islands',
  VI: 'US Virgin Islands',
  AS: 'American Samoa',
  CK: 'Cook Islands',
  PG: 'Papua New Guinea',
  WS: 'Samoa',
  BQ: 'Bonaire',
};

async function flagExists(ccLower: string): Promise<boolean> {
  try {
    const res = await fetch(`https://media.api-sports.io/flags/${ccLower}.svg`, { method: 'HEAD' });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  const rows = (await sql.query(
    `SELECT id, name->>'en' AS en FROM teams WHERE is_national = true AND country_code IS NULL ORDER BY id`,
  )) as { id: number; en: string }[];

  const flagCache = new Map<string, boolean>();
  const updates: { id: number; en: string; cc: string }[] = [];
  const skipped: { id: number; en: string; reason: string }[] = [];

  for (const t of rows) {
    const key = baseName(t.en || '').toLowerCase();
    const cc = NAME_TO_ISO2[key];
    if (!cc) {
      skipped.push({ id: t.id, en: t.en, reason: `no ISO2 mapping (base="${key}")` });
      continue;
    }
    const lower = cc.toLowerCase();
    if (!flagCache.has(lower)) flagCache.set(lower, await flagExists(lower));
    if (!flagCache.get(lower)) {
      skipped.push({ id: t.id, en: t.en, reason: `flag ${lower}.svg not found (not 200)` });
      continue;
    }
    updates.push({ id: t.id, en: t.en, cc });
  }

  const codes = [...new Set(updates.map((u) => u.cc))].sort();

  console.log(`flag-less nationals scanned: ${rows.length}`);
  console.log(
    `resolvable teams: ${updates.length}  |  countries to upsert: ${codes.length}${apply ? '' : '  (dry-run)'}`,
  );
  for (const u of updates) console.log(`  team ${u.id}  "${u.en}" -> ${u.cc}`);
  console.log(`countries: ${codes.map((c) => `${c}(${ISO2_NAME[c]})`).join(', ')}`);
  if (skipped.length) {
    console.log(`\nskipped: ${skipped.length}`);
    for (const s of skipped) console.log(`  ${s.id}  "${s.en}"  (${s.reason})`);
  }

  if (apply) {
    for (const cc of codes) {
      await sql.query(
        `INSERT INTO countries (code, name, flag_url) VALUES ($1, $2::jsonb, $3) ON CONFLICT (code) DO NOTHING`,
        [
          cc,
          JSON.stringify({ en: ISO2_NAME[cc] }),
          `https://media.api-sports.io/flags/${cc.toLowerCase()}.svg`,
        ],
      );
    }
    for (const u of updates) {
      await sql.query(`UPDATE teams SET country_code = $1 WHERE id = $2`, [u.cc, u.id]);
    }
    console.log(`\napplied: ${codes.length} countries upserted, ${updates.length} teams updated`);
  } else {
    console.log('\n(dry-run — re-run with --apply)');
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
