const SLOW_THRESHOLD_MS = 500;

export async function timedQuery<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const ms = Math.round((performance.now() - start) * 100) / 100;
  const entry = JSON.stringify({ query: name, ms });
  if (ms > SLOW_THRESHOLD_MS) {
    console.warn('[slow-query]', entry);
  } else if (process.env.NODE_ENV === 'development') {
    console.log('[query]', entry);
  }
  return result;
}
