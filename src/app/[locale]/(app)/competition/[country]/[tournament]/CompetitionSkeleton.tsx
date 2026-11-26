import { mcFont } from '@/components/match/centre/font';
import '@/components/match/centre/match-centre.css';
import '@/components/league/competition-page.css';
import '@/components/league/competition-skeleton.css';

const RAIL_ROWS = 8;
const TABS = 5;
const TABLE_ROWS = 10;
const SIDE_ROWS = 5;

/**
 * Instant skeleton for competition routes (loading.tsx at every level). It is part of the static
 * shell, so a client navigation paints it on click, before the competition's data arrives, in the
 * competition page's own frame (`.mc` > `.shell` > rail + main area), not the old app shell.
 * Decorative: the real page replaces it as soon as its data streams in.
 */
export function CompetitionSkeleton() {
  return (
    <div className={`mc cs ${mcFont.variable}`} aria-hidden>
      <div className="shell">
        <aside className="rail">
          <div className="cs-rail" data-cs>
            {Array.from({ length: 3 }, (_, i) => (
              <div className="cs-rail-row" key={`major-${i}`}>
                <i />
                <span className="cs-bar" />
              </div>
            ))}
            <span className="cs-bar cs-rail-head" />
            {Array.from({ length: RAIL_ROWS }, (_, i) => (
              <div className="cs-rail-row" key={`row-${i}`}>
                <i />
                <span className="cs-bar" />
              </div>
            ))}
          </div>
        </aside>
        <div className="mc-mainarea">
          <div className="pl pl-page">
            <div className="pl-identity" data-cs>
              <span className="cs-logo" />
              <div>
                <span className="cs-bar cs-title" />
                <span className="cs-bar cs-byline" />
              </div>
            </div>
            <div className="pl-tabs" data-cs>
              {Array.from({ length: TABS }, (_, i) => (
                <span className="cs-tab" key={i} />
              ))}
            </div>
            <div className="pl-layout">
              <div className="pl-main" data-cs>
                <div className="cs-card">
                  <span className="cs-bar cs-card-head" />
                  {Array.from({ length: TABLE_ROWS }, (_, i) => (
                    <div className="cs-line" key={i}>
                      <i />
                      <span className="cs-bar" />
                      <span className="cs-bar" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="pl-side" data-cs>
                <div className="cs-card">
                  <span className="cs-bar cs-card-head" />
                  {Array.from({ length: SIDE_ROWS }, (_, i) => (
                    <div className="cs-line" key={i}>
                      <i />
                      <span className="cs-bar" />
                      <span className="cs-bar" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
