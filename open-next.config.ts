import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache';
// R2 incremental cache (persists 'use cache' entries across isolates, like Vercel ISR), fronted by the
// per-colo Cache API so most reads never touch R2. No tag cache: the app uses no revalidateTag/cacheTag.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: 'long-lived' }),
});
