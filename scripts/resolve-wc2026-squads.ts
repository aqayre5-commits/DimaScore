/**
 * Read-only WC2026 squad match report. Prints, per nation, how each FIFA squad
 * name resolved against our players table (pool / global / ambiguous / missing).
 * Writes nothing — run this before seeding to review the matches.
 *
 * Run: pnpm tsx --env-file=.env.local scripts/resolve-wc2026-squads.ts
 */
import { WC2026_SQUADS } from './data/wc2026-squads';
import { resolveNation } from './lib-wc2026';

async function main(): Promise<void> {
  let totAll = 0;
  let totMatched = 0;
  let totGlobal = 0;
  let totAmb = 0;
  let totMiss = 0;

  for (const nation of WC2026_SQUADS) {
    const r = await resolveNation(nation);
    const matched = r.results.filter((x) => x.status === 'matched');
    const pool = matched.filter((x) => x.source === 'pool').length;
    const global = matched.filter((x) => x.source === 'global').length;
    const amb = r.results.filter((x) => x.status === 'ambiguous');
    const miss = r.results.filter((x) => x.status === 'missing');

    totAll += r.results.length;
    totMatched += matched.length;
    totGlobal += global;
    totAmb += amb.length;
    totMiss += miss.length;

    console.log(
      `\n=== ${nation.fifaName} (${nation.dbName}) — team_id=${r.teamId ?? 'NOT FOUND'} pool=${r.poolSize} ===`,
    );
    console.log(
      `  matched ${matched.length}/${r.results.length} (pool ${pool}, global ${global}) · ambiguous ${amb.length} · missing ${miss.length}`,
    );
    for (const x of matched.filter((m) => m.source === 'global')) {
      console.log(`  ~ global   ${x.entry.name}  ->  #${x.playerId} "${x.dbName}"  (spot-check)`);
    }
    for (const x of amb) {
      const cands = x.candidates
        ?.map((c) => `#${c.id} "${c.name}"${c.teams ? ` [${c.teams}]` : ''}`)
        .join('  |  ');
      console.log(`  ? ambig    ${x.entry.name}  ->  ${cands}`);
    }
    for (const x of miss) {
      console.log(`  x missing  ${x.entry.name} (${x.entry.pos})`);
    }
  }

  console.log(
    `\n--- TOTAL: ${totMatched}/${totAll} matched (global ${totGlobal}) · ${totAmb} ambiguous · ${totMiss} missing ---`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('[resolve] fatal:', err);
  process.exit(1);
});
