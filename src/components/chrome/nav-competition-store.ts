'use client';

import { useSyncExternalStore } from 'react';
import type { CompetitionRailProps } from '@/components/match/centre/CompetitionRail';

export interface NavCompetition {
  current: { id: number; label: string; short: string } | null;
  rail: CompetitionRailProps;
}

/**
 * The page's competition context for the mobile navbar picker. The navbar lives in the layout and
 * cannot read page data, so match and competition pages register theirs here (see
 * NavCompetitionRegister) and the picker subscribes.
 */
let state: NavCompetition | null = null;
const listeners = new Set<() => void>();

export function setNavCompetition(next: NavCompetition | null) {
  state = next;
  listeners.forEach((l) => l());
}

export function clearNavCompetition(owner: NavCompetition) {
  if (state === owner) setNavCompetition(null);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useNavCompetition(): NavCompetition | null {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => null,
  );
}
