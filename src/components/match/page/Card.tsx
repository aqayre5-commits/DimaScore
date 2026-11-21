import type { ReactNode } from 'react';

/** White (surface) card with the page's radius, border and padding. */
export function Card({
  children,
  className = '',
  pad = 'md:px-[18px] md:pb-4 md:pt-[9px]',
  labelledBy,
  as: Tag = 'section',
}: {
  children: ReactNode;
  className?: string;
  /** Desktop padding (each mockup card has its own). */
  pad?: string;
  labelledBy?: string;
  as?: 'section' | 'div';
}) {
  return (
    <Tag
      aria-labelledby={labelledBy}
      className={`rounded-xl border border-border-subtle bg-bg-surface p-3 shadow-[0_1px_2px_rgba(15,26,36,0.04)] ${pad} ${className}`}
    >
      {children}
    </Tag>
  );
}

const SIZES = {
  lg: 'text-[19.5px] md:text-[28.5px]',
  md: 'text-[19.5px] md:text-[26px]',
  events: 'text-[27.5px] md:text-[38.5px]',
  stats: 'text-[28px] md:text-[31.5px]',
  lineups: 'text-[28px] md:text-[31px]',
  table: 'text-[26.5px] md:text-[31.5px]',
} as const;

export function CardTitle({
  id,
  children,
  className = '',
  size = 'lg',
}: {
  id: string;
  children: ReactNode;
  className?: string;
  /** Size per mockup (mobile and desktop): Overview main cards (lg), side cards (md), and each tab's own title. */
  size?: 'lg' | 'md' | 'events' | 'stats' | 'lineups' | 'table';
}) {
  return (
    <h2
      id={id}
      className={`font-bold leading-tight text-text-primary md:leading-none ${SIZES[size]} ${className}`}
    >
      {children}
    </h2>
  );
}
