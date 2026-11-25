export const FIXTURE_DETAILS_BATCH_SIZE = 20;

export function chunkIds(ids: number[], size = FIXTURE_DETAILS_BATCH_SIZE): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
}
