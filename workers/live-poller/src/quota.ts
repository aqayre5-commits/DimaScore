let callsThisTick = 0;
let totalCalls = 0;

export function trackCall(): void {
  callsThisTick++;
  totalCalls++;
}

export function resetTick(): { tickCalls: number; totalCalls: number } {
  const result = { tickCalls: callsThisTick, totalCalls };
  callsThisTick = 0;
  return result;
}

export function getTotalCalls(): number {
  return totalCalls;
}
