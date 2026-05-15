'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getMetadataForCompetition, type CupMetadata } from '@/lib/constants/tournament-metadata';
import { codeToFlag } from '@/lib/flags';
import { cn } from '@/lib/utils';

// ── Mode type definitions (homepage.md Section 1) ──

interface StripModeCountdown {
  mode: 'countdown';
  tournament: CupMetadata;
}

// TODO: Phase 5+ — implement modes 2-4
export interface StripModeLive {
  mode: 'live';
  tournamentName: string;
  fixtures: Array<{
    fixtureId: number;
    homeCode: string;
    awayCode: string;
    kickoff: string;
    isLive: boolean;
    score?: string;
  }>;
}

export interface StripModeUpcoming {
  mode: 'upcoming-matches';
  fixtures: Array<{
    fixtureId: number;
    homeCode: string;
    awayCode: string;
    kickoff: string;
    competition: string;
  }>;
}

export interface StripModeFallback {
  mode: 'fallback';
}

export type StripMode = StripModeCountdown | StripModeLive | StripModeUpcoming | StripModeFallback;

/**
 * Determine which strip mode to show. Per homepage.md Section 1:
 * 90-day window for tournament countdown, 180 days for WC 2030 co-host.
 */
function getCountdownStripMode(today: Date): StripMode {
  // Check WC 2026 countdown (competition ID 1)
  const wc2026 = getMetadataForCompetition(1);
  if (wc2026 && wc2026.type === 'cup') {
    const kickoff = new Date(wc2026.kickoffDate);
    const daysUntil = Math.ceil((kickoff.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil > 0 && daysUntil <= 90) {
      return { mode: 'countdown', tournament: wc2026 };
    }
  }

  return { mode: 'fallback' };
}

function CountdownTimer({ kickoffDate }: { kickoffDate: string }) {
  const t = useTranslations('topStrip');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(kickoffDate).getTime();
  const diff = Math.max(0, target - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <span className="flex items-center gap-1 font-[family-name:var(--font-ibm-plex-sans)] text-sm font-semibold tabular-nums text-text-primary">
      <span>
        {days}
        {t('days')}
      </span>
      <span className="text-text-tertiary">:</span>
      <span>
        {pad(hours)}
        {t('hours')}
      </span>
      <span className="text-text-tertiary">:</span>
      <span>
        {pad(minutes)}
        {t('minutes')}
      </span>
      <span className="text-text-tertiary">:</span>
      <span>
        {pad(seconds)}
        {t('seconds')}
      </span>
    </span>
  );
}

function GroupPills({ groups }: { groups: CupMetadata['groups'] }) {
  const t = useTranslations('topStrip');

  return (
    <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
      {groups.map((group) => (
        <span
          key={group.label}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs',
            group.isMoroccoGroup
              ? 'bg-accent-gold/20 text-accent-gold-bright'
              : 'text-text-secondary',
          )}
        >
          <span className="font-medium">
            {t('group')} {group.label}
          </span>
          {group.teamCodes.map((code) => (
            <span key={code} className="text-sm leading-none">
              {codeToFlag(code)}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}

export function AdaptiveTopStrip() {
  const stripMode = getCountdownStripMode(new Date());

  if (stripMode.mode === 'countdown') {
    return (
      <div className="sticky top-0 z-50 flex h-10 items-center gap-4 overflow-hidden bg-[#0c0c0d] px-4">
        <span className="shrink-0 text-sm font-bold text-accent-gold">WC26</span>
        <CountdownTimer kickoffDate={stripMode.tournament.kickoffDate} />
        <div className="h-4 w-px shrink-0 bg-border-subtle" />
        <GroupPills groups={stripMode.tournament.groups} />
      </div>
    );
  }

  // Fallback mode — minimal brand strip
  return (
    <div className="sticky top-0 z-50 flex h-10 items-center bg-[#0c0c0d] px-4">
      <span className="text-sm text-text-secondary">Atlas Kings</span>
    </div>
  );
}
