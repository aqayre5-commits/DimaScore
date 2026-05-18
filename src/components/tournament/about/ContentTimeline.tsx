import type { TimelineBlock } from '@/lib/constants/about-content';

interface ContentTimelineProps {
  block: TimelineBlock;
}

export function ContentTimeline({ block }: ContentTimelineProps) {
  return (
    <div className="mt-3 space-y-0 border-l-2 border-border-strong pl-4">
      {block.events.map((event, i) => (
        <div key={i} className="relative pb-4 last:pb-0">
          <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-accent-azure bg-bg-surface" />
          <p className="text-xs font-semibold tabular-nums text-text-secondary">{event.date}</p>
          <p className="text-base font-medium text-text-primary">{event.label}</p>
          {event.detail && <p className="text-xs text-text-tertiary">{event.detail}</p>}
        </div>
      ))}
    </div>
  );
}
