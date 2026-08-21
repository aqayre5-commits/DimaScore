import { BASE_URL } from '@/lib/constants/site';

/**
 * IndexNow — instantly notify Bing / Yandex / Seznam / etc. that URLs changed, so fresh results
 * get crawled fast (valuable for a livescore site). The key is public by design: it's hosted at
 * `${BASE_URL}/${INDEXNOW_KEY}.txt` (see public/…txt) and echoed here so submissions can prove
 * ownership. Best-effort — never throws into a caller (a cron); no-op off production.
 */
export const INDEXNOW_KEY = 'a3f1c9d740e84b26b8e05c7d21f9a6c4';

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS = 10_000; // IndexNow per-request cap

export async function submitToIndexNow(urls: string[]): Promise<void> {
  // Only ping from production deploys — never from local/preview (those URLs would be rejected).
  if (process.env.VERCEL_ENV !== 'production') return;

  const urlList = [...new Set(urls)].slice(0, MAX_URLS);
  if (urlList.length === 0) return;

  try {
    const host = new URL(BASE_URL).host;
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });
  } catch (err) {
    console.error('IndexNow submit failed:', err);
  }
}
