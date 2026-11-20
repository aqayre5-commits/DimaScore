/* eslint-disable @typescript-eslint/no-explicit-any -- thin Proxy shim over the untyped driver call surface */
/**
 * Cloudflare-migration shim around @neondatabase/serverless (adapter glue, not app code).
 * - DB_READ_ONLY=1 (preview Worker / shadow poller): every query drizzle sends runs inside a
 *   READ ONLY transaction (Neon-Batch-Read-Only header), so Postgres rejects any write.
 *   Note: neon(url, { readOnly: true }) alone is NOT enough — the driver only sends that flag
 *   for batch/transaction calls, so single queries are wrapped in a 1-query transaction here.
 * - CF_BUILD_NO_DB=1 (Cloudflare build only): queries return no rows, so `next build` needs no
 *   database; pages render from the DB at request time instead.
 * Without either flag it is exactly the real neon().
 */
import { neon as realNeon } from '@neondatabase/serverless';

type AnyFn = (...args: any[]) => any;

// Resolve in a later macrotask, like real network I/O: an instantly-resolved promise would make
// Next's cacheComponents prerender treat uncached DB reads as static (it then trips on Date.now()
// further down), whereas on Vercel a real query outside 'use cache' leaves a dynamic hole.
function emptyResult(opts?: { fullResults?: boolean }) {
  const value = opts?.fullResults ? { rows: [], rowCount: 0, fields: [], command: 'SELECT' } : [];
  return new Promise((resolve) => setTimeout(() => resolve(value), 5));
}

function emptySql(): any {
  const fn: any = new Proxy(function () {}, {
    apply: (_t, _this, args) => emptyResult(args?.[2]),
  });
  fn.query = (_q: string, _p?: unknown[], opts?: { fullResults?: boolean }) => emptyResult(opts);
  fn.transaction = (qs: unknown) =>
    new Promise((resolve) =>
      setTimeout(() => resolve(Array.isArray(qs) ? qs.map(() => []) : []), 5),
    );
  return fn;
}

export function readOnlyNeon(url: string): any {
  const sql: any = (realNeon as AnyFn)(url);
  // Keep the driver's own functions; the Proxy must not write onto `sql` (a set on a Proxy
  // passes through to its target and would make query() call itself).
  const rawQuery = sql.query.bind(sql);
  const rawTransaction = sql.transaction.bind(sql);
  const query = (q: string, params?: unknown[], opts?: Record<string, unknown>) =>
    rawTransaction([rawQuery(q, params, opts)], { readOnly: true }).then((r: unknown[]) => r[0]);
  const transaction = (qs: unknown, cfg?: Record<string, unknown>) =>
    rawTransaction(qs, { ...(cfg ?? {}), readOnly: true });
  return new Proxy(sql, {
    apply(target, thisArg, args) {
      const q = Reflect.apply(target, thisArg, args);
      return rawTransaction([q], { readOnly: true }).then((r: unknown[]) => r[0]);
    },
    get(target, prop, receiver) {
      if (prop === 'query') return query;
      if (prop === 'transaction') return transaction;
      return Reflect.get(target, prop, receiver);
    },
  });
}

export const neon = ((url: string, opts?: any) => {
  if (process.env.CF_BUILD_NO_DB === '1') return emptySql();
  if (process.env.DB_READ_ONLY === '1') return readOnlyNeon(url);
  return (realNeon as AnyFn)(url, opts);
}) as typeof realNeon;
