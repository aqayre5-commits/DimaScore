import Image from 'next/image';

interface Props {
  src: string | null | undefined;
  /** Used for the initial-letter fallback when src is missing. */
  name: string;
  /** Two sizes are in use across the app — 'sm' = 24px, 'md' = 28px. */
  size?: 'sm' | 'md';
}

const CONFIG = {
  sm: { className: 'size-6', px: 24 },
  md: { className: 'size-7', px: 28 },
} as const;

/**
 * Circular player avatar with consistent initial-letter fallback. Replaces ~5 inline copies
 * of the same `{photo ? <Image /> : <initial-circle />}` pattern across right-rail widgets
 * and league stats tables.
 */
export function PlayerPhotoCircle({ src, name, size = 'md' }: Props) {
  const { className, px } = CONFIG[size];
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={px}
        height={px}
        className={`${className} rounded-full object-cover`}
      />
    );
  }
  return (
    <div className={`flex ${className} items-center justify-center rounded-full bg-bg-surface-2`}>
      <span className="text-[10px] text-text-tertiary">{name.charAt(0)}</span>
    </div>
  );
}
