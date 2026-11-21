'use client';

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

export interface MatchTab {
  id: string;
  label: string;
}

/** Old in-page anchors (#sec-…) from the previous layout, still linked from elsewhere. */
const ALIASES: Record<string, string> = {
  'sec-lineups': 'lineups',
  'sec-events': 'events',
  'sec-statistics': 'stats',
  'sec-players': 'stats',
};

/**
 * Before paint, show the panel the URL hash names (or keep Overview). Runs inline right after the
 * tabs root is parsed, so a shared "#events" link never flashes Overview first (no layout shift).
 */
function initScript(ids: string[]) {
  return `(function(){try{var r=document.currentScript.parentElement;var h=location.hash.slice(1);var a=${JSON.stringify(
    ALIASES,
  )};h=a[h]||h;if(${JSON.stringify(ids)}.indexOf(h)>0)r.setAttribute('data-tab',h);}catch(e){}})();`;
}

/**
 * Overview / Events / Stats / Line-ups / Table. One URL: each tab is a real `<a href="#id">`
 * link and every panel is in the HTML; the inactive ones are hidden with CSS (data-tab on this
 * root, see tokens.css), never removed. Overview is first in the DOM.
 */
export function MatchTabs({
  tabs,
  label,
  children,
}: {
  tabs: MatchTab[];
  label: string;
  children: ReactNode;
}) {
  const key = tabs.map((t) => t.id).join('|');
  const ids = useMemo(() => key.split('|'), [key]);
  const [active, setActive] = useState(ids[0]);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const resolve = useCallback(
    (hash: string) => {
      const h = ALIASES[hash] ?? hash;
      return ids.includes(h) ? h : null;
    },
    [ids],
  );

  // Layout effects: the hash sync and the data-tab write both land before the first paint after
  // hydration, so a page opened on "#lineups" never flashes Overview (no layout shift).
  useLayoutEffect(() => {
    const sync = () => {
      const id = resolve(window.location.hash.slice(1));
      if (id) setActive(id);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [resolve]);

  useLayoutEffect(() => {
    rootRef.current?.setAttribute('data-tab', active);
  }, [active]);

  const select = (id: string, focus = false) => {
    setActive(id);
    if (window.location.hash.slice(1) !== id) {
      window.history.replaceState(window.history.state, '', `#${id}`);
    }
    if (focus) tabRefs.current[id]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLAnchorElement>) => {
    const i = ids.indexOf(active);
    const rtl = rootRef.current?.closest('[dir="rtl"]') != null;
    const next = rtl ? 'ArrowLeft' : 'ArrowRight';
    const prev = rtl ? 'ArrowRight' : 'ArrowLeft';
    let j = -1;
    if (e.key === next) j = (i + 1) % ids.length;
    else if (e.key === prev) j = (i - 1 + ids.length) % ids.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = ids.length - 1;
    if (j < 0) return;
    e.preventDefault();
    select(ids[j], true);
  };

  return (
    <div ref={rootRef} data-mp-tabs="" data-tab={active} suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: initScript(ids) }} />
      <div
        role="tablist"
        aria-label={label}
        className="[scrollbar-width:none] -mx-2 mb-3 flex gap-0 overflow-x-auto border-b border-border-subtle bg-bg-surface px-0.5 md:mx-0 md:mb-[19px] md:gap-[6px] md:bg-transparent md:px-0"
      >
        {tabs.map((t) => (
          <a
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            id={`tab-${t.id}`}
            href={`#${t.id}`}
            role="tab"
            data-mp-tab={t.id}
            aria-selected={active === t.id}
            aria-controls={t.id}
            tabIndex={active === t.id ? 0 : -1}
            onClick={(e) => {
              e.preventDefault();
              select(t.id);
            }}
            onKeyDown={onKeyDown}
            className="-mb-px shrink-0 grow whitespace-nowrap border-b-[3px] border-transparent px-2 py-1.5 text-[15px] leading-5 font-semibold text-text-secondary transition-colors hover:text-text-primary focus-visible:rounded-t-md focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-green md:grow-0 md:border-b-4 md:px-[27px] md:pb-3 md:pt-2 md:text-[21.5px] md:font-bold md:leading-[26px]"
          >
            {t.label}
          </a>
        ))}
      </div>
      {children}
    </div>
  );
}

/** One tab panel. Always rendered; shown or hidden by MatchTabs' data-tab. */
export function MatchTabPanel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section
      id={id}
      data-mp-panel={id}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      className="scroll-mt-[calc(var(--app-sticky-offset,64px)+1rem)] focus-visible:outline-none"
    >
      {children}
    </section>
  );
}
