'use client';

import { useState, useEffect } from 'react';
import { useMounted } from '@/hooks/useMounted';

interface KickoffCountdownProps {
  kickoffAt: Date;
  label?: string;
  /** Compact mode: no label, reduced padding. Used in fixed-height featured cards. */
  compact?: boolean;
}

function computeRemaining(kickoffAt: Date) {
  const diff = new Date(kickoffAt).getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);

  return { days, hours, minutes, seconds };
}

export function KickoffCountdown({ kickoffAt, label, compact }: KickoffCountdownProps) {
  const mounted = useMounted();
  const [remaining, setRemaining] = useState(() => computeRemaining(kickoffAt));

  useEffect(() => {
    const id = setInterval(() => {
      const next = computeRemaining(kickoffAt);
      if (!next) {
        clearInterval(id);
        setRemaining(null);
        return;
      }
      setRemaining(next);
    }, 1_000);

    return () => clearInterval(id);
  }, [kickoffAt]);

  // Only drop the countdown after mount. On the server and the client's first render always
  // render the box structure, so a PPR/ISR shell prerendered before kickoff still matches a
  // client that hydrates after kickoff — returning null here would be a structural #418 mismatch
  // (suppressHydrationWarning on the digits only forgives text, not a removed subtree).
  if (mounted && !remaining) return null;

  const r = remaining ?? { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const units = [
    { value: r.days, unit: 'D' },
    { value: r.hours, unit: 'H' },
    { value: r.minutes, unit: 'M' },
  ];

  if (compact) {
    return (
      <div className="flex justify-center gap-1.5">
        {units.map((u) => (
          <div
            key={u.unit}
            className="flex w-9 flex-col items-center rounded-md bg-bg-surface-3 py-0.5"
          >
            <span
              className="text-xs font-bold tabular-nums text-text-primary"
              suppressHydrationWarning
            >
              {String(u.value).padStart(2, '0')}
            </span>
            <span className="text-[7px] font-medium text-text-tertiary">{u.unit}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-2.5">
      <p className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
        {label}
      </p>
      <div className="flex justify-center gap-1.5">
        {units.map((u) => (
          <div
            key={u.unit}
            className="flex w-10 flex-col items-center rounded-md bg-bg-surface-3 py-1"
          >
            <span
              className="text-sm font-bold tabular-nums text-text-primary"
              suppressHydrationWarning
            >
              {String(u.value).padStart(2, '0')}
            </span>
            <span className="text-[8px] font-medium text-text-tertiary">{u.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
