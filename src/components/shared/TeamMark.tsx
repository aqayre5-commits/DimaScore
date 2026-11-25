'use client';

import { useState } from 'react';
import { usableLogoUrl, type LogoStatus } from '@/lib/logos/status';
import { FallbackMark, type FallbackMarkProps } from './FallbackMark';
import { flagImageSrc } from '@/lib/logos/flag-src';

export type TeamMarkProps = FallbackMarkProps & {
  src?: string | null;
  status?: LogoStatus | null;
  isNational?: boolean | null;
  countryCode?: string | null;
  alt?: string;
  invert?: boolean;
};

/**
 * Real crest/flag when available; otherwise the inline fallback SVG.
 * Switches to the fallback if the image errors (broken URL after a previous
 * `ok` scan). National teams still prefer the country flag.
 */
export function TeamMark({
  src,
  status,
  isNational,
  countryCode,
  alt = '',
  invert,
  className,
  size,
  sizeVar,
  ...rest
}: TeamMarkProps) {
  const [failed, setFailed] = useState(false);
  const crest = usableLogoUrl(src, status);
  const image = flagImageSrc({
    countryCode,
    logoUrl: failed ? null : crest,
    isNational,
  });

  if (image) {
    const cls = [className, invert ? 'logo-invert' : null].filter(Boolean).join(' ') || undefined;
    const style = sizeVar ? ({ ['--m' as string]: sizeVar } as React.CSSProperties) : undefined;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={cls}
        src={image}
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
