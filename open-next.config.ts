import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
// R2 incremental cache (persists 'use cache' entries across isolates, like Vercel ISR), fronted by the
// per-colo Cache API so most reads never touch R2. No tag cache: the app uses no revalidateTag/cacheTag.
// Queue: Durable Object queue (DOQueueHandler, exported from cf/worker.ts). Without a queue OpenNext uses
// its "dummy" queue, which throws, so stale ISR pages (revalidate = 60) logged
// "Failed to revalidate stale page" and were never regenerated for the life of a build.
// The DO revalidates by sending a HEAD request to this Worker via the WORKER_SELF_REFERENCE binding.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: 'long-lived' }),
  queue: doQueue,
});
