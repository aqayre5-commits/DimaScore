'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { useNavCompetition } from './nav-competition-store';

const loadSheet = () =>
  import('@/components/match/centre/CompetitionSheet').then((m) => m.CompetitionSheet);
const CompetitionSheet = dynamic(loadSheet, { ssr: false });
const SearchModal = dynamic(() => import('./SearchModal').then((m) => m.SearchModal), {
  ssr: false,
});

/** Pages that register a competition context (Home, plus match and competition pages). */
const PICKER_PATH = /^\/(?:[a-z]{2}\/?)?$|^\/(?:[a-z]{2}\/)?(?:match|competition)\//;

/**
 * Mobile navbar competition picker (template top bar: "PL ▾"). Below 768px only, where the match
 * page has no left rail. Shows the current competition's short name (full name from 440px, as in
 * the template) and opens the rail — Overall, Favourites, Tournament editions, pinned, popular and
 * the browse tree with search — in a modal sheet. The button box has a fixed width per breakpoint
 * and the label is filled in when the page registers its competition, so nothing around it moves.
 */
export function MobileCompetitionPicker() {
  const pathname = usePathname();
  const t = useTranslations('matchCentre.rail');
  const tTop = useTranslations('topbar');
  const nav = useNavCompetition();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Rail links navigate client-side (the Topbar, and so this sheet, stays mounted), so dismiss the
  // sheet when the route changes; a full page load used to do this implicitly.
  const [sheetPath, setSheetPath] = useState(pathname);
  if (sheetPath !== pathname) {
    setSheetPath(pathname);
    setOpen(false);
  }

  // Fetch the sheet chunk (and its styles) once the page has a competition, so the first tap
  // opens it without a wait.
  useEffect(() => {
    if (nav) void loadSheet();
  }, [nav]);

  if (!PICKER_PATH.test(pathname)) return null;

  const full = nav ? (nav.current?.label ?? tTop('competitions')) : null;
  const short = nav ? (nav.current?.short ?? tTop('competitions')) : null;
  // Accessible name starts with the visible text (short name below 440px, full name above).
  const name = !full
    ? t('picker')
    : short && short !== full
      ? `${short} (${full}) · ${t('browse')}`
      : `${full} · ${t('browse')}`;

  return (
    <div className="flex md:hidden">
      <button
        type="button"
        data-nav-competition
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={name}
        disabled={!nav}
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
        className="inline-flex h-11 w-24 min-w-0 items-center justify-end gap-1 rounded-md px-1.5 text-[15px] font-semibold tracking-[-0.02em] text-text-primary transition-colors hover:bg-bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent-azure min-[380px]:w-32 min-[440px]:w-48"
      >
        {nav ? (
          <>
            <span className="h-[22px] min-w-0 truncate leading-[22px]">
              <bdi className="min-[440px]:hidden">{short}</bdi>
              <bdi className="hidden min-[440px]:inline">{full}</bdi>
            </span>
            <ChevronDown className="size-3.5 shrink-0" aria-hidden="true" />
          </>
        ) : (
          <span aria-hidden="true" className="flex h-[22px] items-center">
            <span className="h-4 w-12 animate-pulse rounded bg-bg-surface-2" />
          </span>
        )}
      </button>
      {nav && mounted && (
        <CompetitionSheet
          open={open}
          rail={nav.rail}
          onClose={() => setOpen(false)}
          onSearch={() => {
            setOpen(false);
            setSearchOpen(true);
          }}
        />
      )}
      {searchOpen && <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
