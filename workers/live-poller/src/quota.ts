let callsThisTick = 0;
let totalCalls = 0;
let currentDay = new Date().toISOString().slice(0, 10);

/** API-Football quota resets daily (UTC); reset our counter when the UTC day changes. */
function rollDay(): void {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== currentDay) {
    currentDay = today;
    totalCalls = 0;
  }
}

const DAILY_LIMIT = Number(process.env.API_FOOTBALL_DAILY_LIMIT) || 75_000;
const SAFETY_MARGIN = 100;

/**
 * Track an API call. Returns `true` if the call is allowed,
 * `false` if quota is nearly exhausted (circuit breaker).
 */
export function trackCall(): boolean {
  rollDay();
  if (totalCalls >= DAILY_LIMIT - SAFETY_MARGIN) {
    return false;
  }
  callsThisTick++;
  totalCalls++;
  return true;
}

export function resetTick(): { tickCalls: number; totalCalls: number } {
  const result = { tickCalls: callsThisTick, totalCalls };
  callsThisTick = 0;
  return result;
}

export function getTotalCalls(): number {
  return totalCalls;
}

export function isQuotaExhausted(): boolean {
  rollDay();
  return totalCalls >= DAILY_LIMIT - SAFETY_MARGIN;
}
