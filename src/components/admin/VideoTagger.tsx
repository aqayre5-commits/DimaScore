'use client';

import { useState, useEffect, useRef } from 'react';

// ── Types ──

interface TagItem {
  id: number;
  label: string;
}

interface VideoTaggerProps {
  competitions: TagItem[];
  initialTeams: TagItem[];
  selectedCompetitionIds: number[];
  onCompetitionIdsChange: (ids: number[]) => void;
  selectedTeamIds: number[];
  onTeamIdsChange: (ids: number[]) => void;
  selectedFixtureIds: number[];
  onFixtureIdsChange: (ids: number[]) => void;
  selectedPlayerIds: number[];
  onPlayerIdsChange: (ids: number[]) => void;
}

// ── Tag input with search (for competitions & teams) ──

function TagSelect({
  label,
  items,
  selected,
  onChange,
}: {
  label: string;
  items: TagItem[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = items.filter(
    (item) => !selected.includes(item.id) && item.label.toLowerCase().includes(query.toLowerCase()),
  );

  function add(id: number) {
    onChange([...selected, id]);
    setQuery('');
  }

  function remove(id: number) {
    onChange(selected.filter((x) => x !== id));
  }

  const selectedItems = items.filter((item) => selected.includes(item.id));

  return (
    <div ref={ref} className="space-y-1.5">
      <span className="block text-sm font-medium text-text-secondary">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {selectedItems.map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-1 rounded bg-bg-raised px-2 py-0.5 text-xs font-medium text-text-secondary"
          >
            {item.label}
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="ml-0.5 text-text-tertiary hover:text-text-primary"
            >
              x
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          placeholder={`Search ${label.toLowerCase()}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          className="h-8 w-full rounded-md border border-border-subtle bg-bg-canvas px-3 text-sm text-text-primary outline-none focus:border-accent-azure focus:ring-1 focus:ring-accent-azure"
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-border-subtle bg-bg-surface shadow-lg">
            {filtered.slice(0, 20).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => add(item.id)}
                  className="w-full px-3 py-1.5 text-left text-sm text-text-primary hover:bg-bg-raised"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Numeric ID list (for fixtures & players) ──

function NumericIdInput({
  label,
  selected,
  onChange,
}: {
  label: string;
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const [value, setValue] = useState('');

  function add() {
    const id = parseInt(value, 10);
    if (!isNaN(id) && !selected.includes(id)) {
      onChange([...selected, id]);
    }
    setValue('');
  }

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-text-secondary">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {selected.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1 rounded bg-bg-raised px-2 py-0.5 text-xs font-medium text-text-secondary"
          >
            {id}
            <button
              type="button"
              onClick={() => onChange(selected.filter((x) => x !== id))}
              className="ml-0.5 text-text-tertiary hover:text-text-primary"
            >
              x
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder={`Add ${label.toLowerCase()} ID`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          className="h-8 w-32 rounded-md border border-border-subtle bg-bg-canvas px-3 text-sm text-text-primary outline-none focus:border-accent-azure focus:ring-1 focus:ring-accent-azure"
        />
        <button
          type="button"
          onClick={add}
          disabled={!value.trim()}
          className="h-8 rounded-md border border-border-subtle px-3 text-xs font-medium text-text-secondary hover:bg-bg-raised disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ── Main component ──

export function VideoTagger({
  competitions,
  initialTeams,
  selectedCompetitionIds,
  onCompetitionIdsChange,
  selectedTeamIds,
  onTeamIdsChange,
  selectedFixtureIds,
  onFixtureIdsChange,
  selectedPlayerIds,
  onPlayerIdsChange,
}: VideoTaggerProps) {
  return (
    <div className="space-y-4">
      <TagSelect
        label="Competitions"
        items={competitions}
        selected={selectedCompetitionIds}
        onChange={onCompetitionIdsChange}
      />
      <TagSelect
        label="Teams"
        items={initialTeams}
        selected={selectedTeamIds}
        onChange={onTeamIdsChange}
      />
      <NumericIdInput label="Fixture" selected={selectedFixtureIds} onChange={onFixtureIdsChange} />
      <NumericIdInput label="Player" selected={selectedPlayerIds} onChange={onPlayerIdsChange} />
    </div>
  );
}
