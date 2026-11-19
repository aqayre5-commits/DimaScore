import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const vercel = JSON.parse(readFileSync(path.resolve(__dirname, '../../vercel.json'), 'utf8')) as {
  crons: { path: string; schedule: string }[];
};

// Minutes-past-the-hour each sub-hourly cron fires at.
function minutes(schedule: string): number[] {
  const field = schedule.split(' ')[0];
  if (field.startsWith('*/')) {
    const step = Number(field.slice(2));
    return Array.from({ length: 60 / step }, (_, i) => i * step);
  }
  return field.split(',').map(Number);
}

describe('vercel.json cron staggering', () => {
  const API_HEAVY = [
    '/api/cron/fixtures-schedule',
    '/api/cron/fixture-details',
    '/api/cron/live-details',
    '/api/cron/finalize-stale',
  ];

  it('API-Football-heavy crons never fire in the same minute', () => {
    const seen = new Map<number, string>();
    for (const p of API_HEAVY) {
      const cron = vercel.crons.find((c) => c.path === p);
      expect(cron, p).toBeDefined();
      for (const m of minutes(cron!.schedule)) {
        expect(seen.get(m), `${p} collides with ${seen.get(m)} at :${m}`).toBeUndefined();
        seen.set(m, p);
      }
    }
  });

  it('none of them fire on the :00 / :30 boundary', () => {
    for (const p of API_HEAVY) {
      const cron = vercel.crons.find((c) => c.path === p)!;
      expect(minutes(cron.schedule)).not.toContain(0);
      expect(minutes(cron.schedule)).not.toContain(30);
    }
  });
});
