'use client';

import { useEffect } from 'react';

/**
 * Client component mounted once per page.
 * On mount, reads window.location.hash, scrolls smoothly to the matching id,
 * applies a 2-second highlight (ring pulse), then fades out.
 */
export function HashScrollHighlight() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    // Small delay to ensure DOM is painted
    const timer = setTimeout(() => {
      const el = document.getElementById(hash);
      if (!el) return;

      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('hash-highlight');
      setTimeout(() => el.classList.remove('hash-highlight'), 2000);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
