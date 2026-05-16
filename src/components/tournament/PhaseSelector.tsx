import { cn } from '@/lib/utils';
import type { KnockoutPhase } from './BracketMatchCell';

interface PhaseOption {
  key: KnockoutPhase;
  label: string;
}

interface PhaseSelectorProps {
  phases: PhaseOption[];
  activePhase: KnockoutPhase;
  onPhaseChange: (phase: KnockoutPhase) => void;
}

/**
 * Chip-style knockout phase selector.
 * On desktop: clicking a chip scrolls the bracket to the corresponding column.
 * On mobile: scrolls the scroll-snap container to the corresponding round slide.
 * Scroll behavior is wired by the parent (KnockoutTab / KnockoutBracket).
 */
export function PhaseSelector({ phases, activePhase, onPhaseChange }: PhaseSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist">
      {phases.map(({ key, label }) => (
        <button
          key={key}
          role="tab"
          aria-selected={key === activePhase}
          onClick={() => onPhaseChange(key)}
          className={cn(
            'min-h-[44px] rounded-full px-3 py-1 text-xs font-medium transition-colors',
            key === activePhase
              ? 'bg-accent-gold/15 text-accent-gold'
              : 'text-text-tertiary hover:bg-bg-surface-2 hover:text-text-secondary',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
