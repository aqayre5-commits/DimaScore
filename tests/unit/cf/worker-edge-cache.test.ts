import { beforeEach, describe, expect, it, vi } from 'vitest';

// The Worker imports build output that only exists after `opennextjs-cloudflare build` (.open-next
// is gitignored). Vite needs the files to exist to resolve the imports; vi.mock replaces their content.
const origin = vi.hoisted(() => ({ fetch: vi.fn() }));
await vi.hoisted(async () => {
  const fs = await import('node:fs');
  const nodePath = await import('node:path');
  const base = nodePath.resolve(process.cwd(), '.open-next');
  const stubs: Record<string, string> = {
    'worker.js': 'export default {}; export class DOQueueHandler {}',
    'server-functions/default/.next/routes-manifest.json': '{"headers":[]}',
    'server-functions/default/.next/server/next-font-manifest.json': '{"app":{}}',
  };
  for (const [rel, body] of Object.entries(stubs)) {
    const file = nodePath.join(base, rel);
    if (fs.existsSync(file)) continue;
    fs.mkdirSync(nodePath.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
  }
});
vi.mock('../../../.open-next/worker.js', () => ({
  default: { fetch: origin.fetch },
  DOQueueHandler: class {},
}));
vi.mock('../../../.open-next/server-functions/default/.next/routes-manifest.json', () => ({
  default: { headers: [] },
}));
vi.mock(
  '../../../.open-next/server-functions/default/.next/server/next-font-manifest.json',
  () => ({
    default: { app: {} },
  }),
);

const NOW = Math.floor(Date.now() / 1000);
const CC = 'public, max-age=0, must-revalidate';
const matchHtml = (status: string, ko: number) =>
  `<html><body><div class="mc" data-edge-status="${status}" data-edge-ko="${ko}">1-0</div></body></html>`;

function page(body: string, init: ResponseInit = {}) {
  return new Response(body, {
    status: 200,
    ...init,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': CC,
      ...(init.headers as object),
    },
  });
}

/** Minimal Cache API: honours the stored `max-age` against a fake clock. */
function fakeCaches() {
  const store = new Map<string, { res: Response; expires: number }>();
  const clock = { now: 0 };
  const cache = {
    async match(req: Request) {
      const e = store.get(req.url);
      if (!e || e.expires <= clock.now) return undefined;
      return e.res.clone();
    },
    async put(req: Request, res: Response) {
      const ttl = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') ?? '')?.[1] ?? 0);
      store.set(req.url, { res: res.clone(), expires: clock.now + ttl });
    },
  };
  return { cache, clock, store };
}

type Worker = {
  fetch: (
    req: Request,
    env: object,
    ctx: { waitUntil: (p: Promise<unknown>) => void },
  ) => Promise<Response>;
};

async function get(worker: Worker, url: string, headers: Record<string, string> = {}) {
  const pending: Promise<unknown>[] = [];
  const res: Response = await worker.fetch(
    new Request(url, { headers }),
    {},
    { waitUntil: (p: Promise<unknown>) => pending.push(p) },
  );
  await Promise.all(pending);
  return res;
}

describe('worker HTML edge cache', () => {
  let worker: Worker;
  let fc: ReturnType<typeof fakeCaches>;
  beforeEach(async () => {
    origin.fetch.mockReset();
    fc = fakeCaches();
    vi.stubGlobal('caches', { default: fc.cache });
    worker = (await import('../../../cf/worker')).default as never;
  });

  it('caches a player page 10 min per locale and serves it without the origin', async () => {
    origin.fetch.mockImplementation(async (r: Request) =>
      page(`player ${new URL(r.url).pathname}`, {
        headers: { vary: 'rsc, next-router-state-tree' },
      }),
    );
    const a = await get(worker, 'https://dimascore.ma/en/joueur/m-hitz-2?utm=x');
    expect(a.headers.get('x-cf-html-cache')).toBe('MISS');
    expect(a.headers.get('cache-control')).toBe(CC);
    const b = await get(worker, 'https://dimascore.ma/en/joueur/m-hitz-2?other=1');
    expect(b.headers.get('x-cf-html-cache')).toBe('HIT');
    expect(await b.text()).toBe('player /en/joueur/m-hitz-2');
    expect(b.headers.get('vary')).toBe('rsc, next-router-state-tree');
    expect(b.headers.get('x-cf-origin-vary')).toBeNull();
    expect(fc.store.get('https://dimascore.ma/en/joueur/m-hitz-2')!.res.headers.has('vary')).toBe(
      false,
    );
    expect(origin.fetch).toHaveBeenCalledTimes(1);
    // an RSC/prefetch request must not be served the cached HTML
    origin.fetch.mockImplementationOnce(async () =>
      page('rsc payload', { headers: { 'content-type': 'text/x-component' } }),
    );
    const rsc = await get(worker, 'https://dimascore.ma/en/joueur/m-hitz-2', { rsc: '1' });
    expect(await rsc.text()).toBe('rsc payload');
    // other locale = other entry, never the English body
    const fr = await get(worker, 'https://dimascore.ma/fr/joueur/m-hitz-2');
    expect(fr.headers.get('x-cf-html-cache')).toBe('MISS');
    expect(await fr.text()).toBe('player /fr/joueur/m-hitz-2');
    // Accept-Language / Cookie do not change the entry (pages ignore them)
    const ar = await get(worker, 'https://dimascore.ma/ar/joueur/m-hitz-2', {
      'accept-language': 'en',
    });
    expect(await ar.text()).toBe('player /ar/joueur/m-hitz-2');
    // expires after 10 min
    fc.clock.now = 601;
    expect(
      (await get(worker, 'https://dimascore.ma/en/joueur/m-hitz-2')).headers.get('x-cf-html-cache'),
    ).toBe('MISS');
  });

  it('keeps a live match for 20 s and a finished match for hours', async () => {
    origin.fetch.mockImplementation(async (r: Request) =>
      new URL(r.url).pathname.includes('live')
        ? page(matchHtml('2H', NOW - 3000))
        : page(matchHtml('FT', NOW - 86400)),
    );
    await get(worker, 'https://dimascore.ma/en/match/live-1');
    await get(worker, 'https://dimascore.ma/en/match/done-2');
    expect(fc.store.get('https://dimascore.ma/en/match/live-1')).toBeDefined();
    const ttl = (u: string) => {
      const e = fc.store.get(u)!;
      return e.expires - fc.clock.now;
    };
    expect(ttl('https://dimascore.ma/en/match/live-1')).toBe(20);
    expect(ttl('https://dimascore.ma/en/match/done-2')).toBe(21600);
    fc.clock.now = 21;
    expect(
      (await get(worker, 'https://dimascore.ma/en/match/live-1')).headers.get('x-cf-html-cache'),
    ).toBe('MISS');
    expect(
      (await get(worker, 'https://dimascore.ma/en/match/done-2')).headers.get('x-cf-html-cache'),
    ).toBe('HIT');
  });

  it('never caches cookies, errors, redirects, RSC, markerless matches or unlisted paths', async () => {
    const cases: [string, () => Response][] = [
      ['https://dimascore.ma/en/joueur/a', () => page('x', { headers: { 'set-cookie': 'a=b' } })],
      ['https://dimascore.ma/en/joueur/b', () => page('x', { status: 404 })],
      [
        'https://dimascore.ma/en/joueur/c',
        () => new Response(null, { status: 308, headers: { location: '/en/joueur/d' } }),
      ],
      [
        'https://dimascore.ma/en/joueur/e',
        () => page('x', { headers: { 'content-type': 'text/x-component' } }),
      ],
      ['https://dimascore.ma/en/match/f', () => page('<html>no marker</html>')],
      ['https://dimascore.ma/en/equipe/g', () => page('team')],
    ];
    for (const [url, make] of cases) {
      origin.fetch.mockImplementation(async () => make());
      await get(worker, url);
      await get(worker, url);
    }
    expect(origin.fetch).toHaveBeenCalledTimes(cases.length * 2);
    expect(fc.store.size).toBe(0);
  });
});
