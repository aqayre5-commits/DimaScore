/**
 * dimascore-poller — Cloudflare replacement for the Railway live poller.
 * POLLER_MODE=off | shadow | live
 *   off:    alarm not re-armed; watchdog deletes it.
 *   shadow: read API-Football + Neon, log what it WOULD write/push (DB_READ_ONLY=1).
 *   live:   same DB upserts and Pusher events as workers/live-poller; DB_READ_ONLY must not be "1".
 * Cadence: 15 s while a tracked match is live, else 60 s; on API-Football 429s, back off to 60 s
 * then recover to 15 s on the next clean tick with tracked matches.
 */
import { DurableObject } from 'cloudflare:workers';
import { shadowTick } from './shadow';
import { liveTick } from './live';
import { isApiFootballRateLimit } from './rate-limit';

interface Env {
  POLLER: DurableObjectNamespace;
  POLLER_MODE: string;
  DB_READ_ONLY?: string;
}

const LIVE_INTERVAL_MS = 15_000;
const IDLE_INTERVAL_MS = 60_000;
const MIN_SPACING_MS = 14_500; // never two ticks (= live-all calls) closer than this
const TICK_TIMEOUT_MS = 30_000;

interface State {
  lastTickAt: number;
  day: string;
  totalCalls: number;
  lastEventSync: Record<string, number>;
  last?: unknown;
}

function isRunningMode(mode: string | undefined): mode is 'shadow' | 'live' {
  return mode === 'shadow' || mode === 'live';
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`tick timeout ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
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
    if (!isRunningMode(mode)) {
      if (alarmAt) await this.ctx.storage.deleteAlarm();
      return { armed: false, alarmAt: null, mode };
    }
    if (!alarmAt) {
      alarmAt = Date.now() + 1_000;
      await this.ctx.storage.setAlarm(alarmAt);
      console.log(`[${mode}] watchdog armed alarm at ${new Date(alarmAt).toISOString()}`);
    }
    return { armed: true, alarmAt, mode };
  }

  async status() {
    const s = await this.load();
    return {
      mode: this.env.POLLER_MODE,
      dbReadOnly: this.env.DB_READ_ONLY ?? '',
      alarmAt: await this.ctx.storage.getAlarm(),
      ...s,
      lastEventSync: undefined,
    };
  }

  async alarm() {
    const mode = this.env.POLLER_MODE;
    if (!isRunningMode(mode)) return; // off: do not re-arm
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
        if (mode === 'shadow') {
          const r = await withTimeout(shadowTick(s.lastEventSync, (l) => lines.push(l)), TICK_TIMEOUT_MS);
          s.totalCalls += r.apiCalls;
          next = r.trackedCount > 0 ? LIVE_INTERVAL_MS : IDLE_INTERVAL_MS;
          s.last = { at: new Date(now).toISOString(), ...r, ms: Date.now() - now };
          console.log(
            `[${new Date(now).toISOString()}] [shadow] live=${r.liveCount} tracked=${r.trackedCount} would_update=${r.wouldUpdate} would_details=${r.wouldDetails} api_calls=${r.apiCalls} total_calls=${s.totalCalls} next_tick=${next / 1000}s ms=${Date.now() - now} writes=0 pushes=0`,
          );
        } else {
          if (this.env.DB_READ_ONLY === '1') {
            throw new Error('POLLER_MODE=live but DB_READ_ONLY=1 — refusing to tick (would skip writes)');
          }
          const r = await withTimeout(liveTick(s.lastEventSync, (l) => lines.push(l)), TICK_TIMEOUT_MS);
          s.totalCalls += r.apiCalls;
          if (r.rateLimited) {
            next = IDLE_INTERVAL_MS;
            console.warn(
              `[${new Date(now).toISOString()}] [live] rate-limited — backing off next_tick=60s api_calls=${r.apiCalls} total_calls=${s.totalCalls}`,
            );
          } else {
            next = r.trackedCount > 0 ? LIVE_INTERVAL_MS : IDLE_INTERVAL_MS;
          }
          s.last = { at: new Date(now).toISOString(), ...r, ms: Date.now() - now };
          console.log(
            `[${new Date(now).toISOString()}] [live] live=${r.liveCount} tracked=${r.trackedCount} updated=${r.updatedCount} details=${r.detailsCount} api_calls=${r.apiCalls} total_calls=${s.totalCalls} next_tick=${next / 1000}s ms=${Date.now() - now} writes=${r.updatedCount} pushes=${r.pushes}${r.rateLimited ? ' rate_limited=1' : ''}`,
          );
        }
        for (const l of lines) console.log(l);
      } catch (err) {
        s.totalCalls += 1;
        const rateLimited = isApiFootballRateLimit(err);
        next = rateLimited ? IDLE_INTERVAL_MS : LIVE_INTERVAL_MS;
        s.last = {
          at: new Date(now).toISOString(),
          error: err instanceof Error ? err.message : String(err),
          rateLimited,
        };
        console.error(
          `[${new Date(now).toISOString()}] [${mode}] poll error: ${err instanceof Error ? err.message : err} total_calls=${s.totalCalls}${rateLimited ? ' — backing off next_tick=60s' : ''}`,
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
