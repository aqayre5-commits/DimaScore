'use client';

import { useState, useEffect, useRef, type ReactNode, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { matchTabByHash } from '@/lib/ui/tab-hash';
import {
  Home,
  CalendarDays,
  TableProperties,
  BarChart3,
  Shield,
  LayoutGrid,
  Award,
  Swords,
} from 'lucide-react';

const ICON_MAP: Record<string, typeof Home> = {
  home: Home,
  calendar: CalendarDays,
  table: TableProperties,
  chart: BarChart3,
  shield: Shield,
  grid: LayoutGrid,
  award: Award,
  swords: Swords,
};

interface TabDefinition {
  key: string;
  hash: string;
  hashAliases?: string[];
  labelKey: string;
  icon?: string;
  content: ReactNode;
}

interface CenterTabsProps {
  tabs: TabDefinition[];
}

/**
 * Center column tab switcher with hash-fragment sync.
 * Hash updates on tab change; reads hash on mount for deep-link support.
 */
function TabIcon({ name }: { name?: string }) {
  if (!name || !ICON_MAP[name]) return null;
  const Icon = ICON_MAP[name];
  return <Icon className="mr-1.5 inline-block size-3.5 align-[-2px]" />;
}

export function CenterTabs({ tabs }: CenterTabsProps) {
  const t = useTranslations('tournament');
  // Always default to the first tab on the server AND the client's first render. Reading
  // window.location.hash in the initializer would make a #hash deep-link select a different
  // tab on the client than the server's default → hydration mismatch (React #418). The hash
  // is applied after mount instead (below), which still supports deep-links.
  const [activeKey, setActiveKey] = useState<string>(() => tabs[0]?.key ?? '');

  useEffect(() => {
    function applyHash() {
      const hash = window.location.hash.slice(1);
      const match = matchTabByHash(tabs, hash);
      if (match) setActiveKey(match.key);
    }
    applyHash(); // deep-link support, post-hydration
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [tabs]);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleTabClick(tab: TabDefinition) {
    setActiveKey(tab.key);
    window.history.replaceState(null, '', `#${tab.hash}`);
  }

  function handleKeyDown(e: KeyboardEvent, index: number) {
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = tabs.length - 1;

    if (nextIndex != null) {
      e.preventDefault();
      handleTabClick(tabs[nextIndex]);
      tabRefs.current[nextIndex]?.focus();
    }
  }

  const activeTab = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];

  return (
    <div>
      {/* Tab bar */}
      <div
        className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden"
        role="tablist"
      >
        <div className="flex">
          {tabs.map((tab, index) => {
            const isActive = tab.key === activeKey;
            return (
              <button
                key={tab.key}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.key}`}
                onClick={() => handleTabClick(tab)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={cn(
                  'relative shrink-0 flex-1 px-4 py-3 text-center text-[13px] font-semibold tracking-wide transition-colors',
                  isActive
                    ? 'text-accent-azure'
                    : 'text-text-tertiary hover:text-accent-azure/70 hover:bg-accent-azure/5',
                )}
              >
                <TabIcon name={tab.icon} />
                {t(tab.labelKey)}
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-[2.5px] bg-accent-azure" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active tab content */}
      <div role="tabpanel" id={`tabpanel-${activeTab?.key}`} className="mt-4">
        <h2 className="sr-only">{t(activeTab?.labelKey ?? '')}</h2>
        {activeTab?.content}
      </div>
    </div>
  );
}
