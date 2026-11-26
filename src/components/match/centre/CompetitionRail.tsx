'use client';

import { useId, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useFollows } from '@/hooks/useFollows';
import { NavIcon } from './icons';
import { TeamMark } from '@/components/shared/TeamMark';
import { IntentLink } from '@/components/shared/IntentLink';

const SearchModal = dynamic(
  () => import('@/components/chrome/SearchModal').then((m) => m.SearchModal),
  { ssr: false },
);

export interface RailEntry {
  id: number;
  label: string;
  href: string;
  logo: string | null;
}

export interface RailZone {
  id: string;
  label: string;
  countries: Array<{ key: string; label: string; entries: RailEntry[] }>;
}

export interface RailLabels {
  nav: string;
  overall: string;
  favourites: string;
  tournaments: string;
  pinned: string;
  popular: string;
  showMore: string;
  showFewer: string;
  browse: string;
  find: string;
  count: string;
  open: string;
  close: string;
}

export interface CompetitionRailProps {
  homeHref: string;
  favouritesHref: string;
  currentId: number;
  popular: RailEntry[];
  popularVisible: number;
  all: RailEntry[];
  zones: RailZone[];
  tournaments: RailEntry[];
  labels: RailLabels;
  /** Home is the current page: the Home (Overall) row is highlighted. */
  overallCurrent?: boolean;
  /** Overrides the built-in search modal (the navbar picker closes its sheet first). */
  onSearch?: () => void;
}

const fill = (s: string, n: string | number) => s.replace('{n}', String(n));

function Row({ e, current, open }: { e: RailEntry; current: boolean; open: string }) {
  return (
    <IntentLink
      href={e.href}
      className={`railrow${current ? ' current' : ''}`}
      aria-label={open.replace('{name}', e.label)}
      aria-current={current ? 'true' : undefined}
    >
      <TeamMark className="mark" src={e.logo} name={e.label} variant="competition" />
      <bdi>{e.label}</bdi>
    </IntentLink>
  );
}

/**
 * The template's left rail: Overall, Favourites and Tournament editions; Pinned competitions (the
 * competitions the visitor follows); Popular competitions (active ones in editorial order, eight
 * shown, then "Show N more"); Browse competitions (zones → countries → competitions) with search.
 */
export function CompetitionRail(p: CompetitionRailProps) {
  const { followedComps } = useFollows();
  const [expanded, setExpanded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const L = p.labels;

  const pinned = p.all.filter((e) => followedComps.has(e.id));
  const pinnedIds = new Set(pinned.map((e) => e.id));
  const popular = p.popular.filter((e) => !pinnedIds.has(e.id));
  const rows = expanded ? popular : popular.slice(0, p.popularVisible);
  const here = popular.find((e) => e.id === p.currentId);
  if (!expanded && here && !rows.includes(here)) rows[rows.length - 1] = here;
  const extra = popular.length - p.popularVisible;
  const hidden = new Set([...pinnedIds, ...p.popular.map((e) => e.id)]);
  const zones = p.zones
    .map((z) => ({
      ...z,
      countries: z.countries
        .map((c) => ({ ...c, entries: c.entries.filter((e) => !hidden.has(e.id)) }))
        .filter((c) => c.entries.length > 0),
    }))
    .filter((z) => z.countries.length > 0);

  return (
    <nav className="railpanel" aria-label={L.nav}>
      <IntentLink
        href={p.homeHref}
        className={`railrow major${p.overallCurrent ? ' current' : ''}`}
        aria-current={p.overallCurrent ? 'page' : undefined}
      >
        <NavIcon name="home" />
        {L.overall}
      </IntentLink>
      <IntentLink href={p.favouritesHref} className="railrow major">
        <NavIcon name="star" />
        {L.favourites}
      </IntentLink>
      <button
        type="button"
        className="railrow major tournament-shortcut"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        <NavIcon name="cup" />
        <span>{L.tournaments}</span>
      </button>

      {pinned.length > 0 && (
        <section className="rail-pinned">
          <div className="railtop">
            <h2>{L.pinned}</h2>
          </div>
          {pinned.map((e) => (
            <Row key={e.id} e={e} current={e.id === p.currentId} open={L.open} />
          ))}
        </section>
      )}

      {popular.length > 0 && (
        <section className="rail-popular">
          <div className="railtop">
            <h2>{L.popular}</h2>
          </div>
          {rows.map((e) => (
            <Row key={e.id} e={e} current={e.id === p.currentId} open={L.open} />
          ))}
          {extra > 0 && (
            <button
              type="button"
              className="rail-more"
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? L.showFewer : fill(L.showMore, extra)}
              <NavIcon name="down" />
            </button>
          )}
        </section>
      )}

      <div className="railtop">
        <h2>{L.browse}</h2>
        <button
          type="button"
          className="iconbtn"
          aria-label={L.find}
          onClick={() => (p.onSearch ? p.onSearch() : setSearchOpen(true))}
        >
          <NavIcon name="search" />
        </button>
      </div>
      <p className="railsub">{L.count}</p>
      <div className="tree">
        {zones.map((z) => (
          <details key={z.id} className="zone">
            <summary>
              <NavIcon name="right" />
              {z.label}
              <span className="treenum">
                {z.countries.reduce((n, c) => n + c.entries.length, 0)}
              </span>
            </summary>
            <div className="branches">
              {z.countries.map((c) => (
                <details key={c.key} className="country">
                  <summary>
                    <NavIcon name="right" />
                    {c.label}
                    <span className="treenum">{c.entries.length}</span>
                  </summary>
                  {c.entries.map((e) => (
                    <IntentLink
                      key={e.id}
                      href={e.href}
                      className={`leaf${e.id === p.currentId ? ' current' : ''}`}
                    >
                      <TeamMark
                        className="mark"
                        src={e.logo}
                        name={e.label}
                        variant="competition"
                      />
                      <bdi>{e.label}</bdi>
                    </IntentLink>
                  ))}
                </details>
              ))}
            </div>
          </details>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="dialogbar">
          <h2 id={titleId}>{L.tournaments}</h2>
          <button
            type="button"
            className="iconbtn"
            aria-label={L.close}
            onClick={() => dialogRef.current?.close()}
          >
            <NavIcon name="close" />
          </button>
        </div>
        <div className="dialogbody">
          <nav className="tournament-list" aria-label={L.tournaments}>
            {p.tournaments.map((e) => (
              <IntentLink
                key={e.id}
                href={e.href}
                className="tournament-option"
                // Client-side navigation keeps this component mounted, so the modal must be
                // closed here (a full page load used to dismiss it implicitly).
                onClick={() => dialogRef.current?.close()}
              >
                <TeamMark className="mark" src={e.logo} name={e.label} variant="competition" />
                <bdi>{e.label}</bdi>
                <span />
                <NavIcon name="right" />
              </IntentLink>
            ))}
          </nav>
        </div>
      </dialog>
      {searchOpen && <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />}
    </nav>
  );
}
