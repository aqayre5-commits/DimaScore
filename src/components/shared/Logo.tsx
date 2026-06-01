/**
 * Lightweight logo components for small team/competition crests.
 * Uses raw <img> instead of next/image to skip the /_next/image proxy,
 * which adds latency without meaningful optimization for ≤32px images.
 */

interface LogoProps {
  src: string | null | undefined;
  size?: number;
  alt?: string;
  className?: string;
}

export function TeamLogo({ src, size = 20, alt = '', className = 'object-contain' }: LogoProps) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}

export function CompetitionLogo({
  src,
  size = 20,
  alt = '',
  className = 'object-contain',
}: LogoProps) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}
