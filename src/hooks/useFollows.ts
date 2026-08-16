import { useCallback, useSyncExternalStore } from 'react';

/**
 * Client-only "follow" store (no auth) backed by localStorage, exposed via useSyncExternalStore so
 * it's SSR-safe (server snapshot is empty) and hydration-safe with no setState-in-effect. Tracks
 * followed team + competition ids and syncs across tabs via the `storage` event.
 */
const STORAGE_KEY = 'dimascore:follows';

interface Follows {
  teams: number[];
  comps: number[];
}

const EMPTY: Follows = { teams: [], comps: [] };

// Snapshot cache: getSnapshot must return a stable reference while localStorage is unchanged,
// otherwise useSyncExternalStore re-renders forever.
let cachedRaw: string | null = null;
let cachedValue: Follows = EMPTY;

function parse(raw: string | null): Follows {
  if (!raw) return EMPTY;
  try {
    const p = JSON.parse(raw);
    const nums = (v: unknown): number[] =>
      Array.isArray(v) ? v.filter((n): n is number => typeof n === 'number') : [];
    return { teams: nums(p?.teams), comps: nums(p?.comps) };
  } catch {
    return EMPTY;
  }
}

const listeners = new Set<() => void>();

function getSnapshot(): Follows {
  const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  cachedValue = parse(raw);
  return cachedValue;
}

function getServerSnapshot(): Follows {
  return EMPTY;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

function setFollows(next: Follows) {
  const raw = JSON.stringify(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    /* storage unavailable (privacy mode) — follows just don't persist */
  }
  // Update the cache and notify same-tab subscribers (the `storage` event only fires in *other* tabs).
  cachedRaw = raw;
  cachedValue = next;
  for (const l of listeners) l();
}

export function useFollows() {
  const follows = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTeam = useCallback((id: number) => {
    const cur = getSnapshot();
    const has = cur.teams.includes(id);
    setFollows({ ...cur, teams: has ? cur.teams.filter((x) => x !== id) : [...cur.teams, id] });
  }, []);

  const toggleComp = useCallback((id: number) => {
    const cur = getSnapshot();
    const has = cur.comps.includes(id);
    setFollows({ ...cur, comps: has ? cur.comps.filter((x) => x !== id) : [...cur.comps, id] });
  }, []);

  return {
    followedTeams: new Set(follows.teams),
    followedComps: new Set(follows.comps),
    toggleTeam,
    toggleComp,
  };
}
