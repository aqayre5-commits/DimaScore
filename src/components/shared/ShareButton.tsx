'use client';

import { useState, useCallback } from 'react';
import { Share2, Check } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  hash: string;
}

/**
 * Compact share button for card headers.
 * Uses Web Share API if available, falls back to clipboard copy.
 * Hash is always Latin (e.g. #group-c) for cross-locale robustness.
 */
export function ShareButton({ title, hash }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = window.location.href.split('#')[0] + '#' + hash;

    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silent fail
    }
  }, [title, hash]);

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-center rounded-md border border-border-subtle bg-bg-surface-2 p-1.5 text-text-tertiary transition-colors hover:bg-bg-surface-3 hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1"
      aria-label={`Share ${title}`}
    >
      {copied ? (
        <Check className="size-3.5 text-accent-emerald" />
      ) : (
        <Share2 className="size-3.5" />
      )}
    </button>
  );
}
