import type { ReactNode } from 'react';

/** White (surface) card with the page's radius, border and padding. */
export function Card({
  children,
  className = '',
  labelledBy,
  as: Tag = 'section',
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  as?: 'section' | 'div';
}) {
  return (
    <Tag
      aria-labelledby={labelledBy}
      className={`rounded-xl border border-border-subtle bg-bg-surface p-3 shadow-[0_1px_2px_rgba(15,26,36,0.04)] md:p-5 ${className}`}
    >
      {children}
    </Tag>
  );
}

export function CardTitle({
  id,
  children,
  className = '',
  size = 'lg',
}: {
  id: string;
  children: ReactNode;
  className?: string;
  /** The mockups' side-column cards (Key stats, Match details) use a smaller title. */
  size?: 'lg' | 'md';
}) {
  return (
    <h2
      id={id}
      className={`text-[17px] font-bold leading-tight text-text-primary ${
        size === 'lg' ? 'md:text-[26px]' : 'md:text-[21px]'
      } ${className}`}
    >
      {children}
    </h2>
  );
}
