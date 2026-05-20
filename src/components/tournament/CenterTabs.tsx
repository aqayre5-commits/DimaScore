'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface TabDefinition {
  key: string;
  hash: string;
  labelKey: string;
  content: ReactNode;
}

interface CenterTabsProps {
  tabs: TabDefinition[];
}

/**
 * Center column tab switcher with hash-fragment sync.
 * Per competition-cup.md Section 7: 3 tabs, NOT sticky, gold underline active.
 * Hash updates on tab change; reads hash on mount for deep-link support.
 */
export function CenterTabs({ tabs }: CenterTabsProps) {
  const t = useTranslations('tournament');
  const [activeKey, setActiveKey] = useState<string>(() => {
    if (typeof window === 'undefined') return tabs[0]?.key ?? '';
    const hash = window.location.hash.slice(1);
    return tabs.find((tab) => tab.hash === hash)?.key ?? tabs[0]?.key ?? '';
  });

  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash.slice(1);
      const match = tabs.find((tab) => tab.hash === hash);
      if (match) setActiveKey(match.key);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [tabs]);

  function handleTabClick(tab: TabDefinition) {
    setActiveKey(tab.key);
    window.history.replaceState(null, '', `#${tab.hash}`);
  }

  const activeTab = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];

  return (
    <div>
      {/* Tabs row */}
      <div className="flex overflow-x-auto border-b border-border-subtle" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={tab.key === activeKey}
            aria-controls={`tabpanel-${tab.key}`}
            onClick={() => handleTabClick(tab)}
            className={cn(
              'relative shrink-0 flex-1 px-4 py-3 text-center text-base font-medium transition-colors',
              tab.key === activeKey
                ? 'rounded-t-md bg-bg-surface-2 font-semibold text-text-primary'
                : 'text-text-tertiary hover:text-text-secondary',
            )}
          >
            {t(tab.labelKey)}
            {tab.key === activeKey && (
              <span className="absolute inset-x-0 bottom-0 h-[3px] bg-accent-green" />
            )}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div role="tabpanel" id={`tabpanel-${activeTab?.key}`} className="pt-4">
        <h2 className="sr-only">{t(activeTab?.labelKey ?? '')}</h2>
        {activeTab?.content}
      </div>
    </div>
  );
}
