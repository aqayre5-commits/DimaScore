'use client';

import { useEffect, useRef, useState } from 'react';

interface Section {
  id: string;
  label: string;
}

interface MatchSectionNavProps {
  sections: Section[];
}

/** Fixed chrome height (AdaptiveTopStrip + Topbar), read from --app-sticky-offset. */
function getChromeOffset(): number {
  if (typeof document === 'undefined') return 88;
  const v = getComputedStyle(document.documentElement).getPropertyValue('--app-sticky-offset');
  return parseInt(v, 10) || 88;
}

export function MatchSectionNav({ sections }: MatchSectionNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      // Top margin tracks the fixed chrome + sticky nav so the active tab flips
      // when a section clears the header stack, not when it touches the viewport top.
      { threshold: 0.3, rootMargin: '-144px 0px -50% 0px' },
    );

    for (const el of targets) observer.observe(el);
    return () => observer.disconnect();
  }, [sections]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;

    const navHeight = navRef.current?.offsetHeight ?? 48;
    // Land the heading below the fixed chrome AND the sticky nav (+ small gap).
    const y = el.getBoundingClientRect().top + window.scrollY - getChromeOffset() - navHeight - 8;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  return (
    <nav
      ref={navRef}
      aria-label="Match sections"
      className="sticky top-[var(--app-sticky-offset)] z-30 border-t border-border-subtle bg-bg-surface/95 backdrop-blur-sm"
    >
      <div className="flex">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => handleClick(e, s.id)}
            className={`flex-1 border-b-2 px-3 py-3.5 text-center text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeId === s.id
                ? 'border-accent-azure text-accent-azure'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
