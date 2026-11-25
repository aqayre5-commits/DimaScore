import { fallbackPalette, type FallbackPalette } from '@/lib/logos/colors';
import { logoInitials, type InitialsInput } from '@/lib/logos/initials';

export type FallbackMarkProps = InitialsInput & {
  /** 'team' uses a crest/shield; 'competition' uses a matching rounded badge. */
  variant?: 'team' | 'competition';
  primary?: string | null;
  secondary?: string | null;
  /** Used only when no team colour is known, to pick the neutral pair. */
  theme?: 'light' | 'dark' | null;
  size?: number;
  /** CSS length for --m (competition template marks). */
  sizeVar?: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
};

const SHIELD = 'M12 1.4 21.2 5.2v6.6c0 5.15-3.85 9.35-9.2 10.8C6.65 21.15 2.8 16.95 2.8 11.8V5.2Z';
const BADGE =
  'M4.2 3.4h15.6c.9 0 1.6.7 1.6 1.6v14c0 .9-.7 1.6-1.6 1.6H4.2c-.9 0-1.6-.7-1.6-1.6v-14c0-.9.7-1.6 1.6-1.6Z';

/**
 * Inline SVG fallback crest — no network request. Sized by `size` or by the
 * parent `.mark` box (`1em` / 100%) so layout matches a real crest.
 */
export function FallbackMark({
  variant = 'team',
  primary,
  secondary,
  theme,
  size,
  sizeVar,
  className,
  style,
  title,
  ...initialsInput
}: FallbackMarkProps) {
  const { initials } = logoInitials(initialsInput);
  const palette: FallbackPalette = fallbackPalette(primary, secondary, theme);
  const long = initials.length >= 3;
  const fontSize = long ? 7.2 : initials.length === 1 ? 10 : 8.2;
  // `size` goes on the width/height attributes (like an <img>), so any CSS class
  // (hidden, md:hidden, .mark { width: var(--event-crest) }, max-h, w-auto) wins.
  // Inline width/height/display would beat those classes and squeeze narrow rows.
  const dim = size ? { width: size, height: size } : undefined;
  const css: React.CSSProperties = {
    flexShrink: 0,
    // Without an explicit `size`, take --m from the parent .mark box; never
    // width:100% (that blew up standings cells).
    ...(size ? null : { width: 'var(--m, 24px)', height: 'var(--m, 24px)' }),
    ...(sizeVar ? ({ ['--m' as string]: sizeVar } as React.CSSProperties) : null),
    ...style,
  };

  return (
    <svg
      className={className}
      style={css}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden={title ? undefined : true}
      {...(title ? { 'aria-label': title } : {})}
      {...dim}
    >
      {title ? <title>{title}</title> : null}
      <path
        d={variant === 'competition' ? BADGE : SHIELD}
        fill={palette.fill}
        stroke={palette.stroke}
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
      <text
        x="12"
        y="13.2"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={palette.ink}
        fontSize={fontSize}
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, 'Inter', 'Noto Sans', 'Noto Naskh Arabic', sans-serif"
        letterSpacing={long ? -0.35 : 0.15}
      >
        {initials}
      </text>
    </svg>
  );
}
