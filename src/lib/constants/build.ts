/**
 * Deployment build id — the Vercel git commit SHA, baked into both the server and client bundles
 * at build time (via NEXT_PUBLIC_BUILD_ID in next.config). The same value on the server and the
 * client within one deployment; it changes on every new deployment. Used by the live route + the
 * update banner to detect when an open tab is running stale code. Falls back to 'dev' locally.
 */
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev';
