/**
 * Template icons. Navigation icons: 24×24 viewBox, 1.8 stroke (the .ic class). Event art: 20×20
 * viewBox with the template's fixed palette (Match-Page-Icon-Dimensions.txt).
 */
const NAV = {
  home: 'm3 10 9-7 9 7v11h-6v-7H9v7H3z',
  star: 'm12 2.3 3 6.2 6.8 1-4.9 4.8 1.2 6.8L12 18l-6.1 3.1 1.2-6.8-4.9-4.8 6.8-1z',
  cup: 'M7 3h10v6a5 5 0 0 1-10 0zM7 5H3v2a5 5 0 0 0 5 5m9-7h4v2a5 5 0 0 1-5 5m-4 2v5m-5 2h10',
  search: 'M21 21l-5.2-5.2M18 10a8 8 0 1 1-16 0 8 8 0 1 1 16 0Z',
  right: 'm9 5 7 7-7 7',
  arrow: 'M3 12h17m-6-6 6 6-6 6',
  down: 'm5 9 7 7 7-7',
  close: 'm5 5 14 14M19 5 5 19',
} as const;

export type NavIconName = keyof typeof NAV;

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const forward = name === 'right' || name === 'arrow';
  return (
    <svg
      className={`ic${forward ? ' forward' : ''}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      viewBox="0 0 24 24"
    >
      <path d={NAV[name]} />
    </svg>
  );
}

export type EventArt = 'goal' | 'yellow' | 'red' | 'on' | 'off' | 'down';

function Art({ kind }: { kind: EventArt }) {
  switch (kind) {
    case 'goal':
      return (
        <>
          <circle cx="10" cy="10" r="8.2" fill="#fff" stroke="#17221e" strokeWidth="1.35" />
          <path
            fill="#17221e"
            d="m10 6.6 3.45 2.5-1.33 3.98H7.88L6.55 9.1Zm-1.8-4.3 3.6 0 .6 1.5-2.4 1.28L7.6 3.8ZM2.07 8.5l1.24-3.1 1.4.15.42 2.53-1.97 1.3Zm15.86 0-1.24-3.1-1.4.15-.42 2.53 1.97 1.3ZM4.08 15.5l2.17-1.14 1.84 1.7-.48 1.62-2.16-1.03Zm11.84 0-2.17-1.14-1.84 1.7.48 1.62 2.16-1.03Z"
          />
          <path
            d="M10 6.9V4.7m-3.3 4.6-1.9-1m8.5 1 1.9-1m-3.2 4.6 1.9 2.1m-5.9-2.1L6.2 15"
            fill="none"
            stroke="#17221e"
            strokeWidth=".65"
          />
        </>
      );
    case 'yellow':
      return (
        <g transform="rotate(9 10 10)">
          <rect
            x="4.5"
            y="2"
            width="11"
            height="16"
            rx="1.6"
            fill="#ffd03b"
            stroke="#8e6810"
            strokeWidth="1.2"
          />
          <path d="M7 5h5" stroke="#fff7bf" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      );
    case 'red':
      return (
        <g transform="rotate(9 10 10)">
          <rect
            x="4.5"
            y="2"
            width="11"
            height="16"
            rx="1.6"
            fill="#d32e40"
            stroke="#812236"
            strokeWidth="1.2"
          />
          <path d="M7 5h5M7 7.5h3" stroke="#ffe9e9" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      );
    case 'on':
      return (
        <g
          fill="none"
          stroke="#08764b"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 16V4m-5 5 5-5 5 5" />
        </g>
      );
    case 'off':
      return (
        <g
          fill="none"
          stroke="#ad3443"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 4v12m-5-5 5 5 5-5" />
        </g>
      );
    case 'down':
      return (
        <path
          d="m4.5 7.5 5.5 5 5.5-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
  }
}

export function EventIcon({ kind, className }: { kind: EventArt; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <Art kind={kind} />
    </svg>
  );
}
