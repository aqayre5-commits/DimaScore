'use client';

import { useSyncExternalStore } from 'react';

/**
 * Cookie-consent store (opt-in, GDPR).
 *
 * `null` = the visitor has not chosen yet → non-essential trackers stay OFF.
 * `granted` = analytics/marketing tags may load. `denied` = they never load.
 *
 * State lives in localStorage (per-browser) and changes are broadcast via a window event so the
 * tag components (GTM, Meta Pixel) react live without a reload, plus the `storage` event for
 * cross-tab sync. Strictly-necessary state (theme, language) is unaffected by this.
 */
export type ConsentValue = 'granted' | 'denied';

const STORAGE_KEY = 'dimascore-consent';
const CHANGE_EVENT = 'dimascore-consent-change';

export function getConsent(): ConsentValue | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: ConsentValue): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore — private mode / blocked storage
  }
  try {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // ignore — non-browser environment
  }
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

/** Reactive consent value. Returns `null` on the server and until the visitor chooses. */
export function useConsent(): ConsentValue | null {
  return useSyncExternalStore(subscribe, getConsent, () => null);
}
