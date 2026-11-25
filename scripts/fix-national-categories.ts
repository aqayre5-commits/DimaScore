/**
 * Reclassify teams.national_category / age_group using the name-pattern fix
 * (e.g. "Mexico W U17") and, when known, the gender of competitions the team
 * has played in.
 *
 * Dry-run by default. Pass --apply to write.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-national-categories.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-national-categories.ts --apply
 */
import { neon } from '@neondatabase/serverless';
import { classifyNationalTeamName } from '../src/lib/competitions/national-category';

const apply = process.argv.includes('--apply');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const sql = neon(url);

  const rows = (await sql.query(
    `SELECT t.id, t.slug, t.name->>'en' AS en, t.is_women, t.is_national,
            t.national_category, t.age_group,
            bool_or(c.is_women) AS played_women
     FROM teams t
     LEFT JOIN fixtures f ON f.home_team_id = t.id OR f.away_team_id = t.id
     LEFT JOIN competitions c ON c.id = f.competition_id
     WHERE t.is_national = true OR t.is_women = true
        OR t.name->>'en' ~* '\\mU-?(1[5-9]|2[0-3])\\M'
        OR t.name->>'en' ~* '\\mW(omen)?\\M'
     GROUP BY t.id
     ORDER BY t.id`,
  )) as {
    id: number;
    slug: string;
    en: string;
    is_women: boolean;
    is_national: boolean;
    national_category: string | null;
    age_group: number | null;
    played_women: boolean | null;
  }[];

  const changes = rows
    .map((t) => {
      const competitionIsWomen = t.played_women === true ? true : undefined;
      const next = classifyNationalTeamName(t.en || '', t.is_women, competitionIsWomen);
      const changed = t.national_category !== next.category || t.age_group !== next.ageGroup;
      return { ...t, next, changed };
    })
    .filter((t) => t.changed);

  console.log(
    `rows examined: ${rows.length}; would change: ${changes.length}${apply ? '' : '  (dry-run)'}`,
  );
  for (const t of changes) {
    const from = `${t.national_category ?? 'null'}${t.age_group != null ? ` U${t.age_group}` : ''}`;
    const to = `${t.next.category}${t.next.ageGroup != null ? ` U${t.next.ageGroup}` : ''}`;
    console.log(`  ${t.id}  ${t.slug}  "${t.en}"  ${from} → ${to}`);
  }

  if (apply && changes.length) {
    for (const t of changes) {
      await sql.query(`UPDATE teams SET national_category = $2, age_group = $3 WHERE id = $1`, [
        t.id,
        t.next.category,
        t.next.ageGroup,
      ]);
    }
    console.log(`\napplied: ${changes.length} teams`);
  } else if (!apply) {
    console.log('\n(dry-run — re-run with --apply to write)');
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
