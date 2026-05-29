'use client';

import { useEffect, useRef, useState } from 'react';

interface Section {
  id: string;
  label: string;
}

interface MatchSectionNavProps {
  sections: Section[];
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
      { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' },
    );

    for (const el of targets) observer.observe(el);
    return () => observer.disconnect();
  }, [sections]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;

    const navHeight = navRef.current?.offsetHeight ?? 48;
    const y = el.getBoundingClientRect().top + window.scrollY - navHeight - 8;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-30 border-t border-border-subtle bg-bg-surface/95 backdrop-blur-sm"
    >
      <div className="flex">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => handleClick(e, s.id)}
            className={`flex-1 border-b-2 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider transition-colors ${
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
