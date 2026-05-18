import { useTranslations } from 'next-intl';
import { ShareButton } from '@/components/shared/ShareButton';
import { BlockRenderer } from './about/BlockRenderer';
import { QuickFactsStrip } from './about/QuickFactsStrip';
import type { AboutContent, StatCardBlock } from '@/lib/constants/about-content';

interface AboutCardProps {
  content: AboutContent;
}

/**
 * About section — renders 12 thematic content cards with typed blocks.
 * QuickFactsStrip renders as a standalone stat grid.
 * Each remaining card renders as a bordered section with hash anchor.
 */
export function AboutCard({ content }: AboutCardProps) {
  const t = useTranslations('tournament');

  return (
    <div className="mt-6 space-y-4">
      {content.cards.map((card) => {
        // QuickFactsStrip: stat-card grid, no heading or card wrapper
        if (card.id === 'quick-facts') {
          const statBlocks = card.blocks.filter((b): b is StatCardBlock => b.type === 'stat-card');
          return <QuickFactsStrip key={card.id} blocks={statBlocks} />;
        }

        // Standard content card
        return (
          <section
            key={card.id}
            id={card.id}
            className="rounded-lg border border-border-subtle bg-bg-surface p-6"
          >
            {card.heading && (
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">{card.heading}</h2>
                <ShareButton title={card.heading} hash={card.id} />
              </div>
            )}
            {card.blocks.map((block, j) => (
              <BlockRenderer key={j} block={block} />
            ))}
          </section>
        );
      })}

      {/* FAQ accordion */}
      {content.faqs.length > 0 && (
        <section id="faq" className="rounded-lg border border-border-subtle bg-bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">{t('faqTitle')}</h2>
            <ShareButton title={t('faqTitle')} hash="faq" />
          </div>
          <div className="mt-3 divide-y divide-border-subtle">
            {content.faqs.map((faq, i) => (
              <details key={i} className="group py-3">
                <summary className="cursor-pointer text-base font-medium text-text-primary hover:text-accent-green">
                  {faq.question}
                </summary>
                <p className="mt-2 text-base leading-relaxed text-text-secondary">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
