import Link from 'next/link';
import type { Locale } from '@/lib/i18n/config';
import {
  MOROCCO_HUB_HEADING,
  moroccoHubLinks,
  type MoroccoHubKey,
} from '@/lib/constants/morocco-hubs';
import { approvedHubIntro } from '@/lib/constants/morocco-hub-intros';

/**
 * Server-rendered cross-links between the Moroccan football hubs (R5). Plain links in the page
 * body, not the nav, so each hub passes context to the others. No ad slot, fixed layout.
 */
export function MoroccoHubLinks({
  locale,
  current,
  embedded = false,
}: {
  locale: Locale;
  current?: MoroccoHubKey | null;
  /** Inside an already padded page column: drop the outer page container. */
  embedded?: boolean;
}) {
  const links = moroccoHubLinks(locale, current);
  const intro = current ? approvedHubIntro(current, locale) : null;
  return (
    <section
      aria-labelledby="morocco-hubs-heading"
      className={embedded ? 'mt-6' : 'mx-auto mt-6 w-full max-w-[1280px] px-4'}
      data-testid="morocco-hub-links"
    >
      <div className="rounded-xl border border-border-subtle bg-bg-surface p-4">
        <h2 id="morocco-hubs-heading" className="text-base font-semibold text-text-primary">
          {MOROCCO_HUB_HEADING[locale]}
        </h2>
        {intro && <p className="mt-2 text-sm leading-relaxed text-text-secondary">{intro}</p>}
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((l) => (
            <li key={l.key}>
              <Link
                href={l.href}
                className="block rounded-lg border border-border-subtle px-3 py-2 hover:border-accent-azure"
              >
                <span className="block text-sm font-semibold text-text-primary">{l.label}</span>
                <span className="block text-xs text-text-tertiary">{l.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
