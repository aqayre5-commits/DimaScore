import type { ListBlock } from '@/lib/constants/about-content';

interface ContentListProps {
  block: ListBlock;
}

export function ContentList({ block }: ContentListProps) {
  const Tag = block.ordered ? 'ol' : 'ul';

  return (
    <Tag className="mt-3 space-y-1.5 pl-5 text-sm leading-relaxed text-text-secondary list-disc [&_ol]:list-decimal">
      {block.items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </Tag>
  );
}
