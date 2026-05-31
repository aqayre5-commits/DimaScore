'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchResults } from '@/lib/db/queries/search';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Reset state on open change (render-time pattern, no effect)
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setQuery('');
      setResults(null);
      setActiveIndex(-1);
    }
  }

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Debounced search
  const doSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        setSearchError(false);
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}&limit=5`);
        if (res.ok) {
          const data: SearchResults = await res.json();
          setResults(data);
          setActiveIndex(-1);
        } else {
          setSearchError(true);
        }
      } catch {
        setSearchError(true);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    doSearch(value);
  }

  // Build flat list for keyboard nav
  const flatItems: { href: string; label: string }[] = [];
  if (results) {
    for (const team of results.teams) {
      const name = team.name[locale] ?? team.name['en'] ?? team.code ?? '—';
      flatItems.push({ href: `/${locale}/equipe/${team.slug}`, label: name });
    }
    for (const player of results.players) {
      const name =
        player.name[locale] ??
        player.name['en'] ??
        [player.firstname, player.lastname].filter(Boolean).join(' ') ??
        '—';
      flatItems.push({ href: `/${locale}/joueur/${player.slug}`, label: name });
    }
    for (const comp of results.competitions) {
      const name = comp.name[locale] ?? comp.name['en'] ?? '—';
      // Competition URL uses country/slug pattern — use slug directly for now
      flatItems.push({
        href: `/${locale}/competition/${comp.countryCode ?? 'int'}/${comp.slug}`,
        label: name,
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && flatItems[activeIndex]) {
      e.preventDefault();
      navigate(flatItems[activeIndex].href);
    }
  }

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  if (!open) return null;

  const hasResults =
    results &&
    (results.teams.length > 0 || results.players.length > 0 || results.competitions.length > 0);
  const showNoResults = results && !hasResults && query.trim().length >= 2 && !loading;

  let flatIdx = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-border-subtle bg-bg-canvas shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
          <Search className="size-5 shrink-0 text-text-tertiary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder')}
            className="flex-1 bg-transparent text-base text-text-primary placeholder:text-text-tertiary outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-text-tertiary hover:text-text-secondary"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Results */}
        {searchError && !loading && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-text-secondary">Search unavailable. Please try again.</p>
          </div>
        )}
        {loading && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-text-tertiary">{t('searching')}</p>
          </div>
        )}

        {showNoResults && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-text-tertiary">{t('noResults')}</p>
          </div>
        )}

        {hasResults && (
          <div className="max-h-[50vh] overflow-y-auto py-2">
            {/* Teams */}
            {results.teams.length > 0 && (
              <ResultGroup label={t('teams')}>
                {results.teams.map((team) => {
                  const idx = flatIdx++;
                  const name = team.name[locale] ?? team.name['en'] ?? team.code ?? '—';
                  return (
                    <ResultRow
                      key={`team-${team.id}`}
                      active={idx === activeIndex}
                      onClick={() => navigate(`/${locale}/equipe/${team.slug}`)}
                    >
                      {team.logoUrl ? (
                        <img
                          src={team.logoUrl}
                          alt=""
                          className="size-6 object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="size-6 rounded bg-bg-surface-2" />
                      )}
                      <span className="text-sm font-medium text-text-primary">{name}</span>
                      {team.countryCode && (
                        <span className="text-xs text-text-tertiary">{team.countryCode}</span>
                      )}
                    </ResultRow>
                  );
                })}
              </ResultGroup>
            )}

            {/* Players */}
            {results.players.length > 0 && (
              <ResultGroup label={t('players')}>
                {results.players.map((player) => {
                  const idx = flatIdx++;
                  const name =
                    player.name[locale] ??
                    player.name['en'] ??
                    [player.firstname, player.lastname].filter(Boolean).join(' ') ??
                    '—';
                  const teamName = player.currentTeamName
                    ? (player.currentTeamName[locale] ?? player.currentTeamName['en'] ?? '')
                    : '';
                  return (
                    <ResultRow
                      key={`player-${player.id}`}
                      active={idx === activeIndex}
                      onClick={() => navigate(`/${locale}/joueur/${player.slug}`)}
                    >
                      {player.photoUrl ? (
                        <img
                          src={player.photoUrl}
                          alt=""
                          className="size-6 rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="size-6 rounded-full bg-bg-surface-2" />
                      )}
                      <span className="text-sm font-medium text-text-primary">{name}</span>
                      {teamName && <span className="text-xs text-text-tertiary">{teamName}</span>}
                    </ResultRow>
                  );
                })}
              </ResultGroup>
            )}

            {/* Competitions */}
            {results.competitions.length > 0 && (
              <ResultGroup label={t('competitions')}>
                {results.competitions.map((comp) => {
                  const idx = flatIdx++;
                  const name = comp.name[locale] ?? comp.name['en'] ?? '—';
                  return (
                    <ResultRow
                      key={`comp-${comp.id}`}
                      active={idx === activeIndex}
                      onClick={() =>
                        navigate(`/${locale}/competition/${comp.countryCode ?? 'int'}/${comp.slug}`)
                      }
                    >
                      {comp.logoUrl ? (
                        <img
                          src={comp.logoUrl}
                          alt=""
                          className="size-6 object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="size-6 rounded bg-bg-surface-2" />
                      )}
                      <span className="text-sm font-medium text-text-primary">{name}</span>
                    </ResultRow>
                  );
                })}
              </ResultGroup>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-2 py-1">
      <p className="px-2 py-1 text-xs font-medium uppercase text-text-tertiary">{label}</p>
      {children}
    </div>
  );
}

function ResultRow({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-start transition-colors',
        active ? 'bg-bg-surface-2' : 'hover:bg-bg-surface-2',
      )}
    >
      {children}
    </button>
  );
}
