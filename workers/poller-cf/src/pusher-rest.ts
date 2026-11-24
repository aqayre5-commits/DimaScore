/**
 * Pusher protocol HTTP trigger for workerd (Railway Soketi). Same events as
 * `getPusherServer().trigger(...)` — channel + event + JSON payload — but signed
 * with node:crypto and sent via fetch so we do not depend on the Node `pusher` package.
 * Env var NAMES match Railway: PUSHER_APP_ID, PUSHER_SECRET, PUSHER_HOST, NEXT_PUBLIC_PUSHER_KEY.
 * Values are never logged.
 */
import { createHash, createHmac } from 'node:crypto';

export async function triggerPusher(
  channel: string,
  event: string,
  payload: unknown,
): Promise<void> {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const host = process.env.PUSHER_HOST;
  if (!appId || !key || !secret || !host) {
    throw new Error('PUSHER_* env not set (need PUSHER_APP_ID, PUSHER_SECRET, PUSHER_HOST, NEXT_PUBLIC_PUSHER_KEY)');
  }

  const body = JSON.stringify({
    name: event,
    // Soketi/Pusher require `data` to be a JSON string, same as the official client.
    data: JSON.stringify(payload),
    channel,
  });
  const bodyMd5 = createHash('md5').update(body).digest('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const path = `/apps/${appId}/events`;
  const query = [
    `auth_key=${key}`,
    `auth_timestamp=${timestamp}`,
    'auth_version=1.0',
    `body_md5=${bodyMd5}`,
  ].join('&');
  const signature = createHmac('sha256', secret).update(`POST\n${path}\n${query}`).digest('hex');
  const url = `https://${host}${path}?${query}&auth_signature=${signature}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`pusher HTTP ${res.status} ${text.slice(0, 200)}`);
  }
}
