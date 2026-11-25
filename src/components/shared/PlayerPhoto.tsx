'use client';

import { useState, type CSSProperties } from 'react';
import { usableLogoUrl, type LogoStatus } from '@/lib/logos/status';
import { fallbackPalette } from '@/lib/logos/colors';
import { logoInitials } from '@/lib/logos/initials';

export type PlayerPhotoProps = {
  src?: string | null;
  status?: LogoStatus | null;
  name?: string | Record<string, string> | null;
  firstname?: string | null;
  lastname?: string | null;
  size?: number;
  className?: string;
  alt?: string;
  /** Circle (default) or a rectangular hero slot. */
  rounded?: boolean;
};

/**
 * Real headshot when available; otherwise an inline SVG initials avatar
 * (no network request). Sized like a real photo so layout does not shift.
 * Switches to the fallback when status ≠ ok or the image errors.
 */
export function PlayerPhoto({
  src,
  status,
  name,
  firstname,
  lastname,
  size,
  className,
  alt = '',
  rounded = true,
}: PlayerPhotoProps) {
  const [failed, setFailed] = useState(false);
  const photo = failed ? null : usableLogoUrl(src, status);
  const label =
    [firstname, lastname].filter(Boolean).join(' ').trim() ||
    (typeof name === 'string' ? name : null);
  const { initials } = logoInitials({
    name: label || name,
    shortName: firstname && lastname ? `${firstname[0]}${lastname[0]}` : firstname || lastname,
  });
  const dim = size ?? undefined;

  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={className}
        src={photo}
        alt={alt}
        width={dim}
        height={dim}
        style={dim ? undefined : { width: 'var(--ph, 100%)', height: 'var(--ph, 100%)' }}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  const palette = fallbackPalette(null, null, null);
  const long = initials.length >= 3;
  const fontSize = long ? 9 : initials.length === 1 ? 13 : 11;
  const css: CSSProperties = {
    display: 'inline-block',
    flexShrink: 0,
    width: dim ?? 'var(--ph, 24px)',
    height: dim ?? 'var(--ph, 24px)',
    borderRadius: rounded ? '999px' : '0',
  };
  return (
    <svg
      className={className}
      style={css}
      viewBox="0 0 24 24"
      width={dim}
      height={dim}
      role="img"
      aria-hidden={alt ? undefined : true}
      aria-label={alt || undefined}
    >
      {alt ? <title>{alt}</title> : null}
      <circle cx="12" cy="12" r="11.4" fill={palette.fill} />
      <text
        x="12"
        y="13.1"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={palette.ink}
        fontSize={fontSize}
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, 'Inter', 'Noto Sans', 'Noto Naskh Arabic', sans-serif"
        letterSpacing={long ? -0.3 : 0.1}
      >
        {initials}
      </text>
    </svg>
  );
}
