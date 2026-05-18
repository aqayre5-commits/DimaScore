import type { ContentBlock } from '@/lib/constants/about-content';
import { ContentCallout } from './ContentCallout';
import { ContentList } from './ContentList';
import { ContentTable } from './ContentTable';
import { ContentTimeline } from './ContentTimeline';

interface BlockRendererProps {
  block: ContentBlock;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  switch (block.type) {
    case 'prose':
      return <p className="mt-2 text-base leading-relaxed text-text-secondary">{block.text}</p>;
    case 'table':
      return <ContentTable block={block} />;
    case 'list':
      return <ContentList block={block} />;
    case 'timeline':
      return <ContentTimeline block={block} />;
    case 'callout':
      return <ContentCallout block={block} />;
    case 'stat-card':
      return null; // Handled by QuickFactsStrip at the card level
    default:
      return null;
  }
}
