import { Redis } from '@upstash/redis';

const DAILY_KEY = 'api:quota:daily';
const MINUTE_KEY = 'api:quota:minute';
const DAILY_TTL = 86400; // 24h
const MINUTE_TTL = 60; // 1min

export interface QuotaSnapshot {
  daily: { limit: number; remaining: number };
  minute: { limit: number; remaining: number };
}

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

export async function setQuota(snapshot: QuotaSnapshot): Promise<void> {
  const r = getRedis();
  await Promise.all([
    r.set(DAILY_KEY, JSON.stringify(snapshot.daily), { ex: DAILY_TTL }),
    r.set(MINUTE_KEY, JSON.stringify(snapshot.minute), { ex: MINUTE_TTL }),
  ]);
}

export async function getQuota(): Promise<QuotaSnapshot | null> {
  const r = getRedis();
  const [daily, minute] = await Promise.all([
    r.get<{ limit: number; remaining: number }>(DAILY_KEY),
    r.get<{ limit: number; remaining: number }>(MINUTE_KEY),
  ]);
  if (!daily || !minute) return null;
  return { daily, minute };
}

export async function isNearDailyLimit(threshold = 0.1): Promise<boolean> {
  const quota = await getQuota();
  if (!quota) return false;
  return quota.daily.remaining / quota.daily.limit < threshold;
}

export async function isMinuteExhausted(): Promise<boolean> {
  const quota = await getQuota();
  if (!quota) return false;
  return quota.minute.remaining <= 0;
}
