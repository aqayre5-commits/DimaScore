import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';

/**
 * Build a Map<lowercased country name, country code> from the countries table.
 * Includes known aliases for API-Football quirks (England → GB-ENG, etc.).
 * Must be called AFTER syncCountries has populated the countries table.
 */
export async function buildCountryLookup(
  db: NeonHttpDatabase<typeof schema>,
): Promise<Map<string, string>> {
  const rows = await db
    .select({ code: schema.countries.code, name: schema.countries.name })
    .from(schema.countries);

  const lookup = new Map<string, string>();

  for (const row of rows) {
    const name = (row.name as Record<string, string>).en;
    if (name && row.code) {
      // Primary: exact name from API-Football (e.g., "Saudi-Arabia" → "SA")
      lookup.set(name.toLowerCase(), row.code);
      // Also index without hyphens (e.g., "saudi arabia" → "SA")
      const noHyphen = name.replace(/-/g, ' ').toLowerCase();
      if (noHyphen !== name.toLowerCase()) {
        lookup.set(noHyphen, row.code);
      }
    }
  }

  // Aliases for known API-Football team.country values that differ from /countries names
  const aliases: Record<string, string | undefined> = {
    'korea republic': lookup.get('south-korea'),
    'south korea': lookup.get('south-korea'),
    'north korea': lookup.get('north-korea') ?? lookup.get('korea dpr'),
    usa: lookup.get('usa'),
    'united states': lookup.get('usa'),
    'czech republic': lookup.get('czech-republic'),
    czechia: lookup.get('czech-republic'),
    'bosnia and herzegovina': lookup.get('bosnia'),
    'bosnia-and-herzegovina': lookup.get('bosnia'),
    'trinidad and tobago': lookup.get('trinidad-and-tobago'),
    'antigua and barbuda': lookup.get('antigua-and-barbuda'),
    "cote d'ivoire": lookup.get('ivory-coast'),
    "côte d'ivoire": lookup.get('ivory-coast'),
    'ivory coast': lookup.get('ivory-coast'),
    'cape verde': lookup.get('cape-verde'),
    'cabo verde': lookup.get('cape-verde'),
    'dr congo': lookup.get('congo-dr'),
    'congo dr': lookup.get('congo-dr'),
    'united arab emirates': lookup.get('united-arab-emirates'),
    'burkina faso': lookup.get('burkina-faso'),
    'el salvador': lookup.get('el-salvador'),
    'hong kong': lookup.get('hong-kong'),
    'new zealand': lookup.get('new-zealand'),
    'new caledonia': lookup.get('new-caledonia'),
    'northern ireland': lookup.get('northern-ireland'),
    'saudi arabia': lookup.get('saudi-arabia'),
    'south africa': lookup.get('south-africa'),
    'south sudan': lookup.get('south-sudan'),
    'sri lanka': lookup.get('sri-lanka'),
    'san marino': lookup.get('san-marino'),
    'sierra leone': lookup.get('sierra-leone'),
    'solomon islands': lookup.get('solomon-islands'),
    'equatorial guinea': lookup.get('equatorial-guinea'),
    'guinea-bissau': lookup.get('guinea-bissau'),
    'guinea bissau': lookup.get('guinea-bissau'),
    'central african republic': lookup.get('central-african-republic'),
    'dominican republic': lookup.get('dominican-republic'),
    'papua new guinea': lookup.get('papua-new-guinea'),
    'timor-leste': lookup.get('timor-leste'),
    'east timor': lookup.get('timor-leste'),
    'chinese taipei': lookup.get('chinese-taipei'),
    'faroe islands': lookup.get('faroe-islands'),
    // Friendlies surfaced team.country values that differ from the /countries names.
    'kyrgyz-republic': lookup.get('kyrgyzstan'),
    'cape-verde-islands': lookup.get('cape-verde'),
    'north-korea': lookup.get('north-korea') ?? lookup.get('korea-dpr') ?? lookup.get('korea dpr'),
  };

  for (const [alias, code] of Object.entries(aliases)) {
    if (code && !lookup.has(alias)) {
      lookup.set(alias, code);
    }
  }

  return lookup;
}

/**
 * Resolve a country name (as returned by API-Football) to an ISO-style code.
 * Returns null on miss — the caller should pass null to the DB (nullable FK).
 */
let warnedNames: Set<string> | null = null;

export function resolveCountryCode(
  lookup: Map<string, string>,
  name: string | null | undefined,
): string | null {
  if (!name) return null;

  const key = name.toLowerCase().trim();
  const code = lookup.get(key);
  if (code) return code;

  // Log unresolved names once per process
  if (!warnedNames) warnedNames = new Set();
  if (!warnedNames.has(key)) {
    warnedNames.add(key);
    console.warn(`[country-lookup] Unresolved country name: "${name}"`);
  }

  return null;
}
