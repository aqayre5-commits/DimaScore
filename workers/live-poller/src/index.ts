import { pollLiveFixtures } from './poller';
import { getTotalCalls } from './quota';

const LIVE_INTERVAL_MS = 15_000;
const IDLE_INTERVAL_MS = 60_000;

let running = true;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timestamp(): string {
  return new Date().toISOString();
}

async function main(): Promise<void> {
  console.log(`[${timestamp()}] live-poller starting`);

  while (running) {
    try {
      const result = await pollLiveFixtures();
      const interval = result.trackedCount > 0 ? LIVE_INTERVAL_MS : IDLE_INTERVAL_MS;

      console.log(
        `[${timestamp()}] live=${result.liveCount} tracked=${result.trackedCount} updated=${result.updatedCount} api_calls=${result.apiCalls} total_calls=${getTotalCalls()} next_tick=${interval / 1000}s`,
      );

      await sleep(interval);
    } catch (err) {
      console.error(`[${timestamp()}] poll error:`, err instanceof Error ? err.message : err);
      await sleep(LIVE_INTERVAL_MS);
    }
  }

  console.log(`[${timestamp()}] live-poller shutting down (total_calls=${getTotalCalls()})`);
}

process.on('SIGINT', () => {
  running = false;
});
process.on('SIGTERM', () => {
  running = false;
});

main().catch((err) => {
  console.error(`[${timestamp()}] fatal:`, err);
  process.exit(1);
});
