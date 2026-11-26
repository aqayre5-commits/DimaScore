'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

export interface StageOption {
  slug: string;
  label: string;
  /** Shown after the label in the menu only, e.g. the date span of a round. */
  detail?: string;
}

/**
 * Stage dropdown for the Stages tab. A <details>/<summary> menu of real links, so every option is
 * a crawlable `/round/{slug}` URL and the menu works with no JavaScript. With JavaScript, picking
 * an option swaps the stage in place and the menu closes on Escape, outside click or selection.
 */
export function StagePicker({
  label,
  current,
  options,
  hrefFor,
  onSelect,
}: {
  /** Accessible name of the control, e.g. "Stage". */
  label: string;
  current: string;
  options: StageOption[];
  hrefFor: (slug: string) => string;
  onSelect?: (slug: string) => void;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const currentOption = options.find((o) => o.slug === current) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) ref.current.open = false;
    }
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  function onKeyDown(e: KeyboardEvent<HTMLDetailsElement>) {
    const root = ref.current;
    if (!root) return;
    if (e.key === 'Escape' && root.open) {
      e.preventDefault();
      root.open = false;
      root.querySelector<HTMLElement>('summary')?.focus();
      return;
    }
    if (!root.open) return;
    const links = [...root.querySelectorAll<HTMLAnchorElement>('.stage-options a')];
    const at = links.indexOf(document.activeElement as HTMLAnchorElement);
    let to: number | null = null;
    if (e.key === 'ArrowDown') to = at < 0 ? 0 : Math.min(links.length - 1, at + 1);
    else if (e.key === 'ArrowUp') to = at <= 0 ? links.length - 1 : at - 1;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = links.length - 1;
    if (to == null) return;
    e.preventDefault();
    links[to]?.focus();
  }

  if (!currentOption) return null;
  return (
    <details
      ref={ref}
      className="stage-menu"
      onToggle={(e) => setOpen(e.currentTarget.open)}
      onKeyDown={onKeyDown}
    >
      <summary
        className="ds-period"
        aria-label={`${label}: ${currentOption.label}`}
        title={
          currentOption.detail ? `${currentOption.label} · ${currentOption.detail}` : undefined
        }
      >
        <bdi>{currentOption.label}</bdi>
        <svg className="ic" aria-hidden="true" viewBox="0 0 24 24">
          <path d="m5 9 7 7 7-7" />
        </svg>
      </summary>
      <ul className="stage-options" aria-label={label}>
        {options.map((o) => {
          const isCurrent = o.slug === currentOption.slug;
          return (
            <li key={o.slug}>
              <a
                href={hrefFor(o.slug)}
                aria-current={isCurrent ? 'page' : undefined}
                onClick={(e) => {
                  if (!onSelect) return;
                  e.preventDefault();
                  if (ref.current) ref.current.open = false;
                  onSelect(o.slug);
                }}
              >
                <svg className="ic stage-check" aria-hidden="true" viewBox="0 0 24 24">
                  {isCurrent ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : null}
                </svg>
                <bdi>{o.label}</bdi>
                {o.detail ? <span className="stage-detail">{o.detail}</span> : null}
              </a>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
