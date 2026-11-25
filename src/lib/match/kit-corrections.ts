import type { KitCorrectionMap } from './kit-colours';

/**
 * Verified per-fixture kit corrections. Keyed by `${fixtureId}:${teamId}`.
 * A correction wins over the API palette for that team and role. Only add a
 * row when the worn kit has been confirmed — do not guess from a team's usual
 * home/away colours.
 */
export const KIT_CORRECTIONS: KitCorrectionMap = {};
