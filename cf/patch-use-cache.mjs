// Cloudflare build only (run by `pnpm cf:build` after `opennextjs-cloudflare build`; never part of the Vercel build).
//
// Next 16's "use cache" wrapper shares in-flight cache invocations ACROSS requests through a module-level
// Map (crossRequestPendingCacheInvocations). On Node that is fine. On Workers one isolate serves many
// requests, and the shared entry carries a ReadableStream created by another request, which workerd does not
// allow a different request to read. The follower request then fails its dynamic segments and returns only
// the static shell (no <h1>, no title) — seen on repeat hits of team, match and competition pages.
//
// This patch turns off only the cross-request sharing in the bundled server output (the same switch Next uses
// for "use cache: private"). Dedupe within one request is unchanged. The script fails the build if the
// expected code is not found, so a Next upgrade cannot silently drop the fix.
import { readFileSync, writeFileSync, readdirSync, statSync, realpathSync } from 'node:fs';
import { join } from 'node:path';

const root = '.open-next/server-functions/default';
const marker = 'registering as cross-request invocation leader';
// minified:   let f3=T2&&!0;try{for(;S3===void 0;){let d5,e3=f3?void 0:
//             let f=T&&!0;try{for(;void 0===S;){let d,e=f?void 0:
const minified = /let ([\w$]+)=[\w$]+&&!0;(try\{for\(;(?:[\w$]+===void 0|void 0===[\w$]+);\)\{let [\w$]+,[\w$]+=\1\?void 0:)/g;
// unminified: const skipCrossRequestDedupe = isPrivate && !process.env.__NEXT_DEV_SERVER;
const plain = /const skipCrossRequestDedupe = isPrivate && !process\.env\.__NEXT_DEV_SERVER;/g;
// already patched (re-run of the script on the same output)
const done = /let ([\w$]+)=!0;try\{for\(;(?:[\w$]+===void 0|void 0===[\w$]+);\)\{let [\w$]+,[\w$]+=\1\?void 0:|const skipCrossRequestDedupe = true;/;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (/\.(m?js|cjs)$/.test(name)) yield p;
  }
}

let files = 0;
let patched = 0;
const seen = new Set();
for (const file of walk(root)) {
  const real = realpathSync(file);
  if (seen.has(real)) continue;
  seen.add(real);
  const src = readFileSync(file, 'utf8');
  if (!src.includes(marker)) continue;
  files++;
  let n = 0;
  const out = src
    .replace(minified, (_m, v, rest) => (n++, `let ${v}=!0;${rest}`))
    .replace(plain, () => (n++, 'const skipCrossRequestDedupe = true;'));
  if (n === 0 && done.test(src)) {
    console.log(`[patch-use-cache] ${file}: already patched`);
    continue;
  }
  if (n === 0) {
    console.error(`[patch-use-cache] ${file}: cross-request dedupe code not found; refusing to build`);
    process.exit(1);
  }
  writeFileSync(file, out);
  patched += n;
  console.log(`[patch-use-cache] ${file}: disabled cross-request "use cache" sharing (${n} site${n > 1 ? 's' : ''})`);
}
if (files === 0) {
  console.error('[patch-use-cache] no bundled "use cache" wrapper found under ' + root + '; refusing to build');
  process.exit(1);
}
console.log(`[patch-use-cache] done: ${patched} site(s) in ${files} file(s)`);
