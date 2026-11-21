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
      className={`rounded-2xl border border-border-subtle bg-bg-surface p-4 shadow-[0_1px_2px_rgba(15,26,36,0.04)] md:p-6 ${className}`}
    >
      {children}
    </Tag>
  );
}

export function CardTitle({
  id,
  children,
  className = '',
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      id={id}
      className={`text-lg font-bold leading-tight text-text-primary md:text-2xl lg:text-[28px] ${className}`}
    >
      {children}
    </h2>
  );
}
