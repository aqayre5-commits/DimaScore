import type { CalloutBlock } from '@/lib/constants/about-content';
import { cn } from '@/lib/utils';

interface ContentCalloutProps {
  block: CalloutBlock;
}

export function ContentCallout({ block }: ContentCalloutProps) {
  return (
    <div
      className={cn(
        'mt-3 rounded-md border-l-4 px-4 py-3 text-base leading-relaxed',
        block.variant === 'warning'
          ? 'border-accent-amber bg-accent-amber/10 text-text-primary'
          : 'border-accent-azure bg-accent-azure/10 text-text-primary',
      )}
    >
      {block.text}
    </div>
  );
}
