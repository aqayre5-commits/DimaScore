// Cloudflare build only (run by `pnpm cf:build` after `opennextjs-cloudflare build`; never part of the Vercel build).
//
// @opennextjs/aws's edge converter does `import cookieParser from "cookie"` and calls
// `cookieParser.parse(cookieHeader)`. The installed cookie@1.x is CommonJS flagged `__esModule` with no
// `default` export, so in the esbuild bundle `import_cookie.default` is undefined and EVERY request that
// carries a Cookie header throws "Cannot read properties of undefined (reading 'parse')" (Error 1101).
// This rewrites the call to fall back to the module namespace. The script fails the build if a target file
// has neither the expected code nor the patched form, so an OpenNext upgrade cannot silently drop the fix.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const targets = [
  '.open-next/middleware/handler.mjs',
  '.open-next/server-functions/default/handler.mjs',
  '.open-next/server-functions/default/index.mjs',
];
const broken = /\b(import_cookie\d*)\.default\.parse\(/g;
const fixed = /\(import_cookie\d*\.default\?\?import_cookie\d*\)\.parse\(/;

let failed = false;
for (const file of targets) {
  if (!existsSync(file)) {
    console.error(`[patch-cookie] MISSING ${file}`);
    failed = true;
    continue;
  }
  const src = readFileSync(file, 'utf8');
  let n = 0;
  const out = src.replace(broken, (_m, id) => {
    n++;
    return `(${id}.default??${id}).parse(`;
  });
  if (n > 0) {
    writeFileSync(file, out);
    console.log(`[patch-cookie] ${file}: patched ${n} site(s)`);
  } else if (fixed.test(src)) {
    console.log(`[patch-cookie] ${file}: already patched`);
  } else {
    console.error(`[patch-cookie] ${file}: expected cookie parse call NOT FOUND`);
    failed = true;
  }
}
if (failed) {
  console.error('[patch-cookie] FAILED: cookie fix not applied; refusing to continue');
  process.exit(1);
}
console.log('[patch-cookie] done');
