import { useSyncExternalStore } from 'react';

/**
 * Returns false during SSR and on the client's first render, true after mount.
 * Backed by useSyncExternalStore so React's hydration explicitly tolerates the
 * server-vs-client divergence — avoids the react-hooks/set-state-in-effect
 * lint rule that the classic useEffect(() => setMounted(true), []) pattern trips.
 *
 * Use this for components that need to gate render output on mount (e.g. to
 * silence hydration mismatches from localStorage reads or timezone-dependent
 * Date formatting).
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
