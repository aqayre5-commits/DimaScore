'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Locale error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-display text-2xl font-semibold">Something went wrong</h1>
        <p className="text-secondary text-sm">An unexpected error occurred. Please try again.</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-accent-azure hover:bg-accent-azure/90 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="bg-surface-2 text-secondary hover:bg-surface-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
