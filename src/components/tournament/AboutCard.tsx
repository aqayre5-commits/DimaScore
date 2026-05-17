import { useTranslations } from 'next-intl';
import { ShareButton } from '@/components/shared/ShareButton';
import type { AboutContent } from '@/lib/constants/about-content';

interface AboutCardProps {
  content: AboutContent;
}

/**
 * About card — long-form keyword-bearing content at page bottom.
 * Currently renders prose blocks only (Chunk A bridge).
 * Chunk B/C will add table, timeline, stat-card, list, callout renderers.
 */
export function AboutCard({ content }: AboutCardProps) {
  const t = useTranslations('tournament');

  // Filter to cards that have headings (skip QuickFactsStrip for now)
  const visibleCards = content.cards.filter((card) => card.heading);

  return (
    <section id="about" className="mt-6 rounded-lg border border-border-subtle bg-bg-surface p-6">
      {visibleCards[0] && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">{visibleCards[0].heading}</h2>
            <ShareButton title={visibleCards[0].heading ?? 'About'} hash="about" />
          </div>
          {visibleCards[0].blocks
            .filter((b) => b.type === 'prose')
            .map((block, j) => (
              <p key={j} className="mt-2 text-sm leading-relaxed text-text-secondary">
                {block.text}
              </p>
            ))}
        </>
      )}

      {visibleCards.slice(1).map((card, i) => (
        <div key={i} className="mt-6">
          <h2 className="text-base font-semibold text-text-primary">{card.heading}</h2>
          {card.blocks
            .filter((b) => b.type === 'prose')
            .map((block, j) => (
              <p key={j} className="mt-2 text-sm leading-relaxed text-text-secondary">
                {block.text}
              </p>
            ))}
        </div>
      ))}

      {content.faqs.length > 0 && (
        <div id="faq" className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">{t('faqTitle')}</h2>
            <ShareButton title={t('faqTitle')} hash="faq" />
          </div>
          <div className="mt-3 divide-y divide-border-subtle">
            {content.faqs.map((faq, i) => (
              <details key={i} className="group py-3">
                <summary className="cursor-pointer text-sm font-medium text-text-primary hover:text-accent-gold">
                  {faq.question}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
