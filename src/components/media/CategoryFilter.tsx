'use client';

interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  if (categories.length <= 1) return null;

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
          selected === null
            ? 'bg-accent-green text-bg-canvas'
            : 'bg-bg-raised text-text-secondary hover:text-text-primary'
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
            selected === cat
              ? 'bg-accent-green text-bg-canvas'
              : 'bg-bg-raised text-text-secondary hover:text-text-primary'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
