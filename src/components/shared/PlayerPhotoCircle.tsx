import { PlayerPhoto, type PlayerPhotoProps } from './PlayerPhoto';

interface Props {
  src: string | null | undefined;
  /** Used for the initials fallback when src is missing or a placeholder. */
  name: string;
  status?: PlayerPhotoProps['status'];
  /** Two sizes are in use across the app — 'sm' = 24px, 'md' = 28px. */
  size?: 'sm' | 'md' | number;
  className?: string;
}

const CONFIG = {
  sm: { className: 'size-6 rounded-full object-cover', px: 24 },
  md: { className: 'size-7 rounded-full object-cover', px: 28 },
} as const;

/**
 * Circular player avatar with a consistent initials fallback.
 * Delegates to {@link PlayerPhoto} so placeholder/broken photos never render
 * the API-Sports silhouette.
 */
export function PlayerPhotoCircle({ src, name, status, size = 'md', className }: Props) {
  const preset = typeof size === 'number' ? null : CONFIG[size];
  const px = typeof size === 'number' ? size : preset!.px;
  const cls = [preset?.className, className].filter(Boolean).join(' ') || undefined;
  return <PlayerPhoto src={src} status={status} name={name} size={px} className={cls} />;
}
