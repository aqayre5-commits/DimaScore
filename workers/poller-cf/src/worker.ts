/**
 * dimascore-poller — Cloudflare replacement for the Railway live poller, step 1 = SHADOW only.
 * One Durable Object instance runs an alarm loop with Railway's cadence: next tick in 15 s while a
 * tracked match is live, else 60 s, so at most 4 API-Football calls/minute (one per tick).
 * The cron is a watchdog that only re-arms a missing alarm. POLLER_MODE=off stops all ticking.
 */
import { DurableObject } from 'cloudflare:workers';
import { shadowTick } from './shadow';

interface Env {
  POLLER: DurableObjectNamespace;
  POLLER_MODE: string;
}

const LIVE_INTERVAL_MS = 15_000;
const IDLE_INTERVAL_MS = 60_000;
const MIN_SPACING_MS = 14_500; // never two ticks (= API calls) closer than this
const TICK_TIMEOUT_MS = 30_000;

interface State {
  lastTickAt: number;
  day: string;
  totalCalls: number;
  lastEventSync: Record<string, number>;
  last?: unknown;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`tick timeout ${ms}ms`)), ms)),
  ]);
}

export class LivePoller extends DurableObject<Env> {
  private async load(): Promise<State> {
    return (
      (await this.ctx.storage.get<State>('state')) ?? {
        lastTickAt: 0,
        day: '',
        totalCalls: 0,
        lastEventSync: {},
      }
    );
  }

  async ensureAlarm() {
    const mode = this.env.POLLER_MODE;
    let alarmAt = await this.ctx.storage.getAlarm();
    if (mode !== 'shadow') {
      if (alarmAt) await this.ctx.storage.deleteAlarm();
      return { armed: false, alarmAt: null, mode };
    }
    if (!alarmAt) {
      alarmAt = Date.now() + 1_000;
      await this.ctx.storage.setAlarm(alarmAt);
      console.log(`[shadow] watchdog armed alarm at ${new Date(alarmAt).toISOString()}`);
    }
    return { armed: true, alarmAt, mode };
  }

  async status() {
    const s = await this.load();
    return {
      mode: this.env.POLLER_MODE,
      alarmAt: await this.ctx.storage.getAlarm(),
      ...s,
      lastEventSync: undefined,
    };
  }

  async alarm() {
    if (this.env.POLLER_MODE !== 'shadow') return; // off: do not re-arm
    const s = await this.load();
    const now = Date.now();
    let next = IDLE_INTERVAL_MS;
    try {
      if (now - s.lastTickAt < MIN_SPACING_MS) {
        next = s.lastTickAt + MIN_SPACING_MS - now;
        return;
      }
      const day = new Date(now).toISOString().slice(0, 10);
      if (day !== s.day) {
        s.day = day;
        s.totalCalls = 0;
      }
      s.lastTickAt = now;
      const lines: string[] = [];
      try {
        const r = await withTimeout(
          shadowTick(s.lastEventSync, (l) => lines.push(l)),
          TICK_TIMEOUT_MS,
        );
        s.totalCalls += r.apiCalls;
        next = r.trackedCount > 0 ? LIVE_INTERVAL_MS : IDLE_INTERVAL_MS;
        s.last = { at: new Date(now).toISOString(), ...r, ms: Date.now() - now };
        console.log(
          `[${new Date(now).toISOString()}] [shadow] live=${r.liveCount} tracked=${r.trackedCount} would_update=${r.wouldUpdate} would_details=${r.wouldDetails} api_calls=${r.apiCalls} total_calls=${s.totalCalls} next_tick=${next / 1000}s ms=${Date.now() - now} writes=0 pushes=0`,
        );
        for (const l of lines) console.log(l);
      } catch (err) {
        // Count the attempted call; retry on the live cadence like Railway's catch branch.
        s.totalCalls += 1;
        next = LIVE_INTERVAL_MS;
        s.last = {
          at: new Date(now).toISOString(),
          error: err instanceof Error ? err.message : String(err),
        };
        console.error(
          `[${new Date(now).toISOString()}] [shadow] poll error: ${err instanceof Error ? err.message : err} total_calls=${s.totalCalls}`,
        );
      }
    } finally {
      await this.ctx.storage.put('state', s);
      await this.ctx.storage.setAlarm(Date.now() + Math.max(next, 1_000));
    }
  }
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/status') {
      const stub = env.POLLER.get(env.POLLER.idFromName('poller'));
      return Response.json(await stub.status());
    }
    return new Response('not found', { status: 404 });
  },
  async scheduled(_c: ScheduledController, env: Env): Promise<void> {
    const stub = env.POLLER.get(env.POLLER.idFromName('poller'));
    await stub.ensureAlarm();
  },
};

export default worker;
