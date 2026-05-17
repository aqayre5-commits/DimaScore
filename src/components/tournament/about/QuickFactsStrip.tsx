import type { StatCardBlock } from '@/lib/constants/about-content';

interface QuickFactsStripProps {
  blocks: StatCardBlock[];
}

export function QuickFactsStrip({ blocks }: QuickFactsStripProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {blocks.map((block, i) => (
        <div
          key={i}
          className="flex flex-col items-center rounded-lg border border-border-subtle bg-bg-surface px-3 py-3 text-center"
        >
          <span className="text-lg font-bold tabular-nums text-text-primary">{block.value}</span>
          <span className="text-[11px] font-medium text-text-secondary">{block.label}</span>
        </div>
      ))}
    </div>
  );
}
