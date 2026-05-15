'use client';

import { useState, type ReactNode } from 'react';
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

  function handleTabClick(tab: TabDefinition) {
    setActiveKey(tab.key);
    window.history.replaceState(null, '', `#${tab.hash}`);
  }

  const activeTab = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];

  return (
    <div>
      {/* Tabs row */}
      <div className="grid grid-cols-4 border-b border-border-subtle" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={tab.key === activeKey}
            onClick={() => handleTabClick(tab)}
            className={cn(
              'relative px-4 py-3 text-center text-sm font-medium transition-colors',
              tab.key === activeKey
                ? 'font-semibold text-text-primary'
                : 'text-text-tertiary hover:text-text-secondary',
            )}
          >
            {t(tab.labelKey)}
            {tab.key === activeKey && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent-gold" />
            )}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div role="tabpanel" className="pt-4">
        {activeTab?.content}
      </div>
    </div>
  );
}
