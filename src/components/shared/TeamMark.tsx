'use client';

import { useState } from 'react';
import { type LogoStatus } from '@/lib/logos/status';
import { compactTeamLogoSrc, resolveTeamLogo } from '@/lib/constants/team-logos';
import { FallbackMark, type FallbackMarkProps } from './FallbackMark';
import { flagImageSrc } from '@/lib/logos/flag-src';

export type TeamMarkProps = FallbackMarkProps & {
  src?: string | null;
  status?: LogoStatus | null;
  isNational?: boolean | null;
  countryCode?: string | null;
  teamId?: number | null;
  alt?: string;
  invert?: boolean;
};

/**
 * Real crest/flag when available; otherwise the inline fallback SVG.
 * Switches to the fallback if the image errors (broken URL after a previous
 * `ok` scan). Curated /logos/ crests win over the country flag for national
 * teams. Compact rasters are used at ticker/rail sizes when available.
 */
export function TeamMark({
  src,
  status,
  isNational,
  countryCode,
  teamId,
  alt = '',
  invert,
  className,
  size,
  sizeVar,
  ...rest
}: TeamMarkProps) {
  const [failed, setFailed] = useState(false);
  const crest = resolveTeamLogo(teamId, src ?? null, status);
  const image = flagImageSrc({
    countryCode,
    logoUrl: failed ? null : crest,
    isNational,
    logoStatus: failed ? 'missing' : crest ? 'ok' : status,
  });
  const display = compactTeamLogoSrc(image, size);

  if (display) {
    const cls = [className, invert ? 'logo-invert' : null].filter(Boolean).join(' ') || undefined;
    const style = sizeVar ? ({ ['--m' as string]: sizeVar } as React.CSSProperties) : undefined;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={cls}
        src={display}
        alt={alt}
        width={size}
        height={size}
        style={style}
        loading={size && size >= 64 ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  const fallbackClass = [className, 'fallback'].filter(Boolean).join(' ');
  return (
    <FallbackMark
      {...rest}
      className={fallbackClass}
      size={size}
      sizeVar={sizeVar}
      variant={rest.variant ?? 'team'}
    />
  );
}
