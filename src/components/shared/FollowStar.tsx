'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowStarProps {
  active: boolean;
  onToggle: () => void;
  /** Full accessible label, e.g. "Follow Botola Pro" / "Unfollow Botola Pro". */
  label: string;
  className?: string;
}

/** Small star toggle for following a team/competition. Stops propagation so it can sit inside
 *  other clickable rows (chips, list rows) without triggering them. */
export function FollowStar({ active, onToggle, label, className }: FollowStarProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onToggle();
      }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full p-0.5 transition-colors',
        active ? 'text-yellow-400' : 'text-text-tertiary hover:text-text-secondary',
        className,
      )}
    >
      <Star className={cn('size-3.5', active && 'fill-current')} />
    </button>
  );
}
