# Sofascore Visual & Structural Analysis — Atlas Kings Phase 4.5 Reference

**Captured:** 13 May 2026 | **Analysis environment:** Chromium 1280×800 desktop, 375×812 mobile
**Pages visited:** sofascore.com, /football, Lazio vs Inter match detail, Botola Pro tournament, MAS de Fès team page, player page template

---

## 1. Homepage Analysis

### A. Viewport-Level Structure

#### Top Bar (Row 1) — sticky, always present
- **Background:** Deep royal blue, approximately `#3D47CC` (Sofascore brand blue). Not dark, not black.
- **Left:** Square logomark (white "S" in square bracket shape) + wordmark "Sofascore" in white, all-caps. Logo is ~28×28px. The whole mark is left-aligned with ~16px left padding.
- **Right:** Single action button — "Download app" — white pill button, black text, ~40px height, ~120px wide. No user auth visible without login (no sign-in button in top bar at mobile/compact view; sign-in button appears only on a secondary nav row that is not rendered at the screen sizes tested).
- **No search bar in the top row.** Search is accessed via the bottom tab bar (Search icon, second from left).
- **No language switcher visible.** No theme toggle visible in the header.

#### Sport Navigation Row (Row 2) — sticky, scrollable horizontally
- **Same blue background as top bar**, visually unified into a single tall header block (~90px total header height).
- **Items visible at 1280px** (horizontal scroll): Trending (flame icon), WC26 (trophy icon), Football (ball icon, currently selected), Tennis (racket+ball icon), Cricket (bat icon), Rugby, Basketball, Darts, American football, MMA, Motorsport, Snooker, Ice hockey, Table tennis, Esports, Cycling, Handball, Volleyball, Baseball, Aussie rules, Badminton, Water polo, Futsal, Beach volleyball, Minifootball, Floorball, Bandy.
- **Active state (Football):** Filled lighter-blue rectangular highlight behind the text+icon cell. The active cell spans the full height of the nav row and is approximately 120px wide, clearly prominent. No underline — it's a background-fill active state.
- **Inactive items:** Icon + label in white, no background. Spaced approximately 80–100px apart.
- **Icon style:** White line/outline icons, approximately 20×20px, with sport-specific silhouettes. The Football icon is a small football/soccer ball (filled). WC26 has a World Cup trophy icon.
- **Live counts:** Not shown next to sport names in this nav row. The live count "Live (14)" appears only in the content filter row below.
- **"Trending" item** is positioned first (leftmost), before any sport, with a flame icon. This is a cross-sport trending page, not a sport itself.
- **WC26** is second, a dedicated FIFA World Cup 2026 section with standings scroll shown in a top-of-page banner carousel (not visible in the nav row itself — the WC26 banner is an inline content element above the main fixture list).
- **Secondary nav below sport nav (Row 3):** Date navigator — `< Today >` pill, ~100px wide, centered with arrow chevrons on each side. On the far right: "Odds" label + toggle switch (off by default). No tabs on this row. This row has a light gray/white background, contrasting with the blue header.
- **Row 4 (filter row):** Pill filter buttons — "All" (filled black, selected), "Live (14)" (outlined with red text), "Finished" (outlined gray), "Upcoming" (outlined gray). These are ~36px height pills. The "Live" button has its count in red text inside it.

#### Content Grid
- **At 1280px desktop:** Sofascore renders a **single-column layout** with no left sidebar visible. The entire viewport width is used for the fixture list. There is no right rail. No left rail. This is surprising — the desktop layout appears nearly identical to the mobile layout in terms of column structure. The fixture list is full-width (approx. 1240px usable after left/right padding).
- **Important:** I see from the accessibility tree that there ARE elements to the left/right of the main fixture list in the DOM (there's a secondary scrollbar and duplicate nav elements suggesting a two-pane structure in the original design), but at 1280px the left sidebar has collapsed. The Sofascore app appears to use a breakpoint above 1280px for the two-column layout with a left rail showing competitions list.
- **At 375px mobile:** Same single-column layout. Identical structure. Bottom navigation bar becomes the primary navigation. Team names truncate to ~4 characters ("Man..." "Cry..." etc.).

#### Footer
- **Background:** Same deep blue as header.
- **Content (from top):** "Football Scores" section (2-column text links to WC26 group matches) | "Basketball Scores" section (2-column text links) | Then: ADVERTISE, CONTACT, TORNEO BY SOFASCORE, SOFASCORE NEWS as large-text stacked links (full width) | Horizontal rule | Sofascore wordmark (white) | Google Play + App Store buttons | Social icons: Facebook, X, Instagram, TikTok | Gambling responsibility line ("18+ When the fun stops, STOP") | Privacy Policy, Cookie Policy, Accessibility Policy, Terms & Conditions, GDPR & Journalism, Impressum | © 2026 Sofascore — All rights reserved.
- **Footer is visually heavy and content-rich** — the SEO links section alone is 2 columns × ~8 rows of text links. Footer has no column grid for the legal links at mobile — all stacked vertically.

---

### B. Card and Module Inventory

#### 1. Competition Header Row
- **Name:** Competition group row / section header
- **Where:** Appears once before each group of matches (e.g., above all Premier League matches)
- **Data fields:** Competition logo (circle ~32px), Competition name (bold ~14px), Competition sub-name if applicable (e.g., "Championship Round"), Country flag (circular emoji-style ~16px), Country name (~12px gray), Match count (number on right, e.g., "4"), Collapse/expand chevron (right edge)
- **Visual treatment:** White background with very subtle bottom border (~1px #E8E8E8). Left-aligned. ~60px tall.
- **Width:** Full fixture list width (~1240px at 1280px viewport)
- **Hover state:** Subtle hover on the competition logo links (they are clickable to go to competition page)

#### 2. Upcoming/Finished Match Row
- **Name:** Standard fixture row
- **Where:** Inside each competition group
- **Data fields:** Time column (left, ~60px, shows kickoff time in local 24hr format + dash below representing "not started"), Home team crest (circular ~24px), Home team name (shortened if needed), Away team crest (~24px), Away team name, Star/favourite icon (right edge, outline star)
- **Layout:** Time left | Teams column (two rows: home on top, away below) | [Score column — shows "-" for upcoming, or actual score] | Favourite star right
- **Visual treatment:** White background. Very light gray separator between rows (~0.5px). Rows are approximately 80px tall total (40px per team row).
- **Score display:** For upcoming matches, shows a centered "-" in gray. For finished, shows score numerals in bold. For live matches (see below).
- **No odds shown** unless the Odds toggle is enabled. When enabled, odds columns appear between the score and the star.

#### 3. Live Match Row
- **Name:** Live fixture row
- **Where:** Mixed into the fixture list when a match is in progress
- **Distinguishing elements:** The minute indicator (e.g., "67'") appears in place of the kickoff time, shown in **red text**. The score numerals are also rendered in a heavier weight or slightly different color to indicate live status. In the Colombia match visible, "2ND" period indicator appears in red, and the live score "4-4" appears in a more prominent style.
- **No pulsing dot or animation visible** in the static screenshot, but the minute updates in real-time via websocket.
- **Competition group label** shows match count with a red indicator dot for competitions with live matches.

#### 4. Competition Group Collapsed State
- When all matches for a competition are hidden (collapsed), only the header row with the chevron shows. The match count number is still visible. The chevron points up when expanded, down when collapsed.

#### 5. WC26 Groups Banner (at-page-top inline module)
- Horizontally-scrolling carousel of World Cup group tiles. Each tile shows: Group letter (e.g., "Group C"), 4 country flags arranged in a 2×2 grid. Only active when navigating to the WC26 section.

#### 6. "About" Section
- Appears at the bottom of the fixture list (above the footer links). Gray background, smaller text, ~14px. Contains SEO paragraph text about the page. Includes internal links to major competition pages.

#### 7. News / News Cards
- The page source shows a news section with 5-6 article headlines. These are NOT visually rendered as cards in the fixture view — they appear as part of the footer/about section in text-only format. There is no image-based news card module on the homepage fixture list.

---

### C. Specific Visual Decisions

**Above the fold at 1280×800 (before scrolling):**
- Header (sport nav + date strip + filter pills) — 1 zone (~130px)
- Competition group header #1 (Premier League) — ~60px
- 1 match row (Man City vs Crystal Palace) — ~80px
- Competition group header #2 (LaLiga) — ~60px
- 4 match rows (LaLiga matches) — ~320px
- Approximately: 3 competitions and ~5 individual match rows visible above the fold. Total above-fold content: about 8 distinct visual units.

**Above the fold at 375×812 mobile:**
- ~4–5 content units. Team names truncate aggressively.

**Dominant visual rhythm:**
Tight, uniform-height list. All rows are approximately the same height. This is a **data-dense vertical list** — not masonry, not card grid, not varied heights. The rhythm is almost newspaper-tabular: very information-dense with minimal decoration. The only visual punctuation is the competition header rows.

**Hero element:**
There is no traditional "hero" on the homepage. Sofascore does not have a featured match banner, a hero image, or any large promotional element. The homepage IS the fixture list. The WC26 horizontal carousel at the top of the football section functions as the closest thing to a promotional/featured module, but it is compact (~80px tall).

**Live vs. Upcoming vs. Finished distinction:**
- Live: Red minute text (e.g., "67'"), bold/emphasized score numerals, red period indicator
- Upcoming: Gray time text (e.g., "20:00"), dash score placeholder
- Finished: Gray time text replaced by score — no explicit "FT" label in the row itself

**Date strip rendering:**
There is NO date strip with multiple day tiles. The date navigator is a single `< Today >` pill with chevron arrows to navigate days. It does NOT show "Mon 12 | Tue 13 | Wed 14..." — only the current day label. You use arrows to go forward or backward.

**Competition sorting on homepage:**
Major European leagues first (Premier League, LaLiga, Ligue 1), then other UEFA-adjacent leagues, then cups, then South American leagues, then long tail of global competitions. No explicit "Featured" or "Morocco" section.

---

### D. Sport Navigation Details

- **Icons:** Yes, all sport nav items have icons. Style is white line/silhouette icons at ~20px. Monochrome, single-weight line icons.
- **Live counts:** NOT shown next to sport names in the navigation. The "Live (14)" count is shown only in the content filter pill below the date strip.
- **Active state:** Filled lighter-blue rectangle as background behind the icon+label. Full height of the nav row.
- **Sport order (left to right):** Trending, WC26, Football, Tennis, Cricket, Rugby, Basketball, Darts, American football, MMA, Motorsport, Snooker, Ice hockey, Table tennis, Esports, Cycling, Handball, Volleyball, Baseball, Aussie rules, Badminton, Water polo, Futsal, Beach volleyball, Minifootball, Floorball, Bandy
- **At mobile 375px:** The sport nav horizontally scrolls. No drawer. No collapse. The bottom of the screen has a separate 5-tab bottom navigation: Matches, Search, Fantasy, Favourites, Profile.

---

## 2. Match Detail Page Analysis (Lazio vs Inter, Coppa Italia Final)

### E. Match Detail Page Tab Structure

**Page above-tabs header:**
- Breadcrumb: `Football > Italy > Coppa Italia, Final > [match title]` — small gray text, ~12px
- "Add to Favourites" button — pill, centered, with star icon, ~44px height
- Match header: Home team crest (large, ~80px), [centered time/score block], Away team crest (large ~80px). Team names below crests in ~14px. Favorite stars in corners.
- Score area: Shows kickoff time for upcoming. Would show live score/minute for live. Shows final score for finished.

**Tab bar:**
- **Tabs (in order):** Details | Odds | Lineups | Matches | Knockout | Media
- Note: This is a Cup match — "Knockout" tab replaces "Standings" which appears for league matches. For a league match: Details | Odds | Lineups | Matches | Standings | Media
- **Default tab on page load:** Details
- **Tab style:** Text-only tabs, no pill background. Active tab: bold text + solid blue underline (~2px). Inactive tabs: Sofascore blue color text. No pill/capsule backgrounds.
- **Tab overflow on mobile:** Horizontal scroll. No "more" dropdown.

**Tab content descriptions:**

**Details tab (default):**
- Full-time odds block (bet365 sponsor, fractional odds 1/X/2 with implied probability %)
- Betting CTA strip ("A sign-up bonus awaits you. Claim")
- Live stream widget (video player placeholder left, "Register & Watch" CTA right)
- "Explore videos, news, facts, and more from this event. View media" — promo block
- "Who will win? Cast your vote!" — prediction poll (3 buttons: home/draw/away)
- "Analyse match with AI" → Sofascore Analyst CTA
- "Head-to-head" section — H2H record summary (W-D-L counts), manager H2H
- "Compare teams" — full-width blue CTA button
- Ad slot (inline, ~300px tall)
- "Odds" section — fractional odds + implied probability bars
- "TV channels" section — broadcaster logos + availability counts, country selector
- "Date and time" — datetime + Add to calendar button
- "Competition" — text details
- "Featured players" — two player cards (one per team) with Sofascore Rating + radar stats (ATT/TEC/TAC/DEF/CRE)
- "About the match" — long SEO text block

**Lineups tab:**
- "Possible lineups" heading + "Share lineups" blue pill button
- Filter pills: Performance | Nationality | Age | Market value | Height
- Team header: Team name + avg Sofascore Rating + formation badge (e.g., "4-3-3") + kit color swatch
- **Pitch visualization:** Green pitch with player dots by formation. Each dot: player photo (circular), shirt number, surname. Substitutes list below.
- Both teams shown stacked vertically (home top, away bottom).

**Matches tab:**
- Head-to-head historical results list. Date, competition, score for recent meetings.

**Knockout tab (or Standings for league):**
- Knockout: Cup bracket/draw visualization
- Standings: League table

**Media tab:**
- Videos, highlights, news articles. Card-based grid, 2–3 columns.

---

## 3. Competition Page Analysis (Botola Pro)

**URL:** `/football/tournament/morocco/botola-pro/937`

**Page header:**
- Breadcrumb: `Football > Morocco > Botola Pro standings, fixtures, results and stats`
- Large competition logo (~60×60px)
- Competition name: "Botola Pro" — large bold ~22px
- Country flag dot + "Morocco"
- Season selector dropdown: "25/26" with chevron
- Favourite star (top right) + "25k" favourites count
- **Season timeline bar:** Horizontal progress bar "12 Sept → 31 May" showing season progress. Simple but highly effective contextual element.

**Tab bar:**
Standings | Details | Matches | Stats | Media

**Standings tab (default):**
- Filter pills: All | Home | Away
- "Chart" button (top right) — standings chart over time
- Column headers: # | Team | P | DIFF | PTS
- Full data (W/D/L/GF/GA) behind a display type toggle (hamburger icon)
- Zone color coding at position circle:
  - Green = Champions League
  - Light green/yellow = CAF Confederation Cup
  - Orange = Relegation Playoffs
  - Red = Relegation
- Legend at bottom of table

**Current Botola Pro standings (25/26, Round 20):**
1. MAS de Fès — 20P, +19 GD, 41pts
2. AS FAR — 20P, +20 GD, 40pts
3. Raja CA — 20P, +17 GD, 39pts
4. WAC — 20P, +14 GD, 37pts
5. RS Berkane — 20P, +11 GD, 37pts
6. DHJ — 20P, -2 GD, 29pts
7. CODM — 20P, -4 GD, 27pts
8. FUS Rabat — 20P, -2 GD, 26pts
9. Renaissance Zemamra — 20P, -7 GD, 23pts
10. KACM — 20P, 0 GD, 23pts
11. Ittihad Tanger — 20P, -7 GD, 20pts
12. HUSA — 20P, -11 GD, 20pts
13. Olympique Dcheira — 20P, -12 GD, 18pts
14. USYM — 20P, -10 GD, 16pts
15. OC Safi — 20P, -14 GD, 14pts
16. Union Touarga — 20P, -12 GD, 13pts

---

## 4. Team Page Analysis (MAS de Fès)

**URL:** `/football/team/mas-de-fes/55035`

**Page header:**
- Breadcrumb: `Football > Morocco > Botola Pro > [team] scores, fixtures, standings and player stats`
- Team crest (~60×60px)
- Team name — large bold
- Country flag dot + country name
- "Compare" button — blue pill with compare icon
- Favourite star + count

**Tab bar:**
Details | Matches | Standings | Squad | Top players | Statistics

**Details tab (default) content:**
- **"Featured" section:** Large card with most recent match. Contains: competition badge, match date/time, both team crests (large), score, match status, odds strip (1/X/2).
  - Right chevron allows cycling through recent/upcoming matches.
- **"Recent form" section:** Horizontal scrollable row of mini match result chips (W/D/L + score). Hover/tap to see score. Shows ~9 matches.
- **"Team info" block:** 2×2 grid: Total players / Average player age / Foreign players / National team players
- **"Major trophies":** Labeled counts (e.g., "CAF Confederations Cup 1 | Coupe du Trône 4")
- **"Competitions" section:** Badges/pills for active competitions
- **"Info" sub-section:** Coach | Country | Founded | Venue | Capacity | City
- **"About" section:** Long SEO text with next/previous match info and current roster in text.

---

## 5. Player Page Analysis

**Observed template from player pages:**

**Page header:**
- Breadcrumb: `Football > [Country] > [Competition] > [Player] stats, ratings and goals`
- Player photo (circular ~60×60px, gray silhouette if no photo)
- Player name — large bold
- "Compare" button — blue pill
- Favourite star + count

**Tab bar:**
Details | Season | Matches | Career

**Details tab (default) content:**
- **Current club row:** Club crest + Club name (links to team page)
- **Bio grid (3-column):**
  - Row 1: NATIONALITY (flag + code) | DOB + Age ("28 yrs") | HEIGHT (cm)
  - Row 2: POSITION (letter, e.g., "D") | SHIRT NUMBER | [empty]
- **"Player positions" section:** Visual pitch diagram with position zones colored
- **"Strengths" section** (green label): Key strengths or "No outstanding strengths"
- Additional sections (inferred): Transfer history, Ratings chart, Career stats

**Season tab:** Statistics by competition — goals, assists, ratings, minutes, cards

**Matches tab:** Match-by-match log for current season

**Career tab:** Season-by-season career statistics table

---

## 6. Cross-Cutting Design System Observations

### F. Information Density

**Horizontal padding (page gutter):**
~12–16px on left/right at mobile 375px. At 1280px desktop, fixture list is full-bleed within main content area. Competition header rows have ~16px internal left padding.

**Vertical spacing between sections:**
- Between competition groups: ~0px (thin separator line only)
- Between tab bar and content: ~0px
- Team/player page cards: ~8px vertical gap between cards

**Card padding (internal):**
- Match rows: ~12px top/bottom, ~8px left time column, ~12px left team name
- Competition headers: ~12px vertical, ~16px horizontal
- Info blocks: ~16px all sides

**Font sizes (estimated):**
- Page title / player name / team name: ~20–22px bold
- Competition name in group header: ~14px bold (~600 weight)
- Team name in fixture row: ~13–14px regular
- Time in fixture row: ~13px
- Score: ~14–16px bold
- Country name in competition header: ~12px gray (#666)
- Caption/meta text: ~11–12px
- Tab labels: ~13–14px medium weight
- Body text in "About" sections: ~14px

**Font stack:**
Custom sans-serif — likely "Rubik" or similar geometric sans-serif. Tabular numerals for all numeric data.

**Visual weight balance:**
Data-first, chrome-minimal. Scores and team names have maximum visual weight. Borders and background fills are extremely subtle (off-white vs. white). Blue reserved for interactive/active elements, header/footer. Main content area is almost entirely white.

---

### G. Prominent vs. Deemphasized

**What Sofascore puts front-and-center (notable decisions):**
- No hero match, no featured game, no editorial curation on homepage. The fixture list IS the product.
- **Odds are a first-class UI element** — toggle on the primary filter row, odds inline in match rows, fixture pages, competition pages. Primary monetization mechanism.
- **WC26 banner** at top of football section — horizontally scrolling group carousel. Promotes high-value tournaments above regular fixture flow.
- **"Favourites" is heavily promoted** — second tab in content strip, dedicated bottom bar icon. Product designed to convert users to logged-in favourites-users.

**Conspicuously absent or hidden:**
- No editorial homepage — no articles above fixture list
- No player spotlight or "top performer today" module
- No league table widget on homepage
- No standings visible on homepage
- No dark mode in default view
- No visible language switcher
- No explicit Morocco/region section on global homepage

**Ad placements:**
- Inline within fixture list: "Advertisement" labels between competition groups every 4–6 competitions (~300×250 or 300×100 IAB slots)
- Match detail page: Full-width video/display ad mid-content
- Sticky banner ad at bottom of viewport (above bottom tab bar on mobile)
- Large display ad just before footer
- Total: ~4 ad zones per page on average

**Where branding appears:**
- Logo top-left header — small
- Logo in footer
- "Sofascore Analyst" CTA on match detail pages
- Competition favourites counts ("25k") — data but not logo-bearing
- Brand is quiet — recedes behind data

---

### H. Interactive Elements

**Sticky elements on scroll:**
- Top header (sport nav + top bar): Always sticky
- Tab bar on match/competition/team/player pages: Sticks when you scroll past the page header. This is a KEY UX pattern — always-accessible tab switching without scrolling back up.
- Date/filter row on homepage: Also sticks

**Expanding/collapsing sections:**
- Competition group rows on homepage: collapsible/expandable via chevron
- "About" sections: hidden behind "Show more" link
- TV channels on match detail: expandable country selector

**Infinite scroll / pagination:**
- Homepage fixture list: Infinite-style — all competitions for the day appear by scrolling. No "load more" button.
- No pagination observed anywhere.

**Hover behaviors:**
- Competition logo: link cursor
- Match rows: subtle background tint (~#F5F5F5)
- Favourite star: fills outline
- Tabs: subtle color change

**Loading skeletons:**
Not captured in static screenshots, but likely gray shimmer skeletons for fixture list rows (standard practice given the row shapes).

---

## 7. Responsive Behavior Summary

### At 1280px desktop:
- Single-column full-width fixture list (no left rail at this breakpoint — left rail likely appears at ≥1400px)
- Navigation: Horizontal scrolling sport nav in full
- Bottom tab bar: Hidden
- Fixture rows: Full team names shown
- All 5–6 match detail tabs visible without overflow
- "Download app" button visible in header

### At 768px tablet:
- Same single-column layout as 1280px
- Sport nav truncates slightly, horizontal scroll sooner
- Match rows retain full team name display

### At 375px mobile:
- Same single-column layout
- **Bottom navigation bar appears:** Matches | Search | Fantasy | Favourites | Profile (5 icons + labels, ~56px tall, white, fixed at bottom)
- Team names **aggressively truncate** (4–5 chars + "...")
- "Download app" button retained in header
- Sport nav shows fewer items before requiring scroll
- Match detail tabs overflow to horizontal scroll (all tabs remain, no "More" menu)

---

## 8. Atlas Kings vs Sofascore Comparison Table

| Component | Sofascore Implementation | Atlas Kings Current State | Concrete Change Needed |
|---|---|---|---|
| **TopNav** | Blue (~#3D47CC). Icon logomark + wordmark. One CTA only ("Download app"). No search in top bar. | #0A0A0A dark bar. Text wordmark "Atlas Kings" in gold. Nav links (Competitions, Teams, Players, Live). Search/lang/theme icons right. | (1) Change background from black to a branded color (dark navy `#0D0F2B` or keep dark but add accent). (2) Remove nav links from top bar — relocate to sport nav row. (3) Add a sport/section icon to the wordmark. (4) Search icon in top bar is fine for desktop. |
| **SportNav** | Blue same-background row. All-icon + label. Active = filled blue cell. Horizontal scroll. No live counts in nav. | Text labels "Football | Basketball | Tennis" with "Bientôt" badges. | (1) Add icons to every sport item. (2) Style "Bientôt" badge as a separate pill (visually distinct from the label). (3) Color the active item with a background fill. (4) Make the nav horizontally scrollable. |
| **LeftRail** | Does not exist at ≤1280px. Collapses at this breakpoint. | 280px sidebar, always visible, 3 collapsible sections all empty. | (1) **Critical:** Make the left rail collapsible/hideable at ≤1280px. (2) Populate immediately with Morocco competitions from your DB: Botola Pro 1, Botola Pro 2, Coupe du Trône, CAF, National Team. (3) Each competition in the rail should show: logo, name, today's match count. |
| **DateStrip** | Single `< Today >` navigator pill with arrows. No multi-date row. | 8-date horizontal row (yesterday + today + 6 days), today highlighted gold. | Atlas Kings' multi-date strip is BETTER than Sofascore's for UX. Keep it. Improve: (1) Show abbreviated day name ("Mer 13") not just number. (2) Add a subtle dot indicator for days with matches. (3) Dim dates with no matches. |
| **LiveTicker** | No separate live ticker. Live matches integrated into fixture list with red time text. | Hidden when no live matches. | (1) Remove the separate LiveTicker component. (2) Integrate live status into fixture rows: red minute text, bold score, pulsing red dot at far left. (3) Add "Live (N)" count in the filter pill row. |
| **LeftRail Competitions** | All competitions for the day sorted by global popularity, with logos and match counts. | "Coming soon" placeholder. | (1) Immediately populate with hard-coded Morocco competition list. (2) Show today's match count per competition. (3) Add collapsible "Morocco" and "International" sections. This is where Atlas Kings should be MORE focused than Sofascore. |
| **Empty Main Area** | Never empty — fixture list always shows something. | "Matches coming soon" text only. | (1) This must go immediately. Show: (a) Fixture rows from your DB for upcoming Botola matches, (b) Botola Pro standings widget, (c) "Next round" upcoming fixtures module. |
| **Footer** | Same-color (blue) full-width footer. Logo + app stores + social icons + legal links + copyright. Heavy SEO link section. | Minimal: logo + 3 legal links + Loi 09-08 notice. | (1) Add social media links. (2) Add "Morocco Football" links section (Botola Pro, Coupe du Trône, National Team). (3) Keep Loi 09-08 notice — style it subtly. (4) Give footer same background color as header for visual symmetry. |

---

## 9. Top 10 Specific Changes — Highest Visual Gap Impact

Ranked by impact on closing the gap from "thin chrome shell" to "competition-grade sports data site":

### 1. Populate the fixture list with real data immediately
The "Matches coming soon" empty state is the biggest signal that the product is incomplete. Use your Neon Postgres seeded data to render actual Botola Pro match rows — even upcoming fixtures — in the correct competition group header format. One real competition group with real team names and a real kickoff time does more than any CSS change.

### 2. Replace competition group headers with visual identity
Every competition group needs: a real competition logo (image), competition name, country flag, match count. Sofascore's competition header row is the visual anchor that makes the fixture list feel "real." A row that says "● Morocco | Botola Pro | Round 22 | 8 matches" with the Botola Pro crest at left is worth more than any color scheme work.

### 3. Add a status indicator system to match rows
Three states need clear visual differentiation: upcoming (gray time text, "–" score), live (red time/minute text, bold score, pulsing dot), finished (muted time, score in default weight). The design tokens (red = live, gray = not started, normal weight = finished) need to be specified and consistent.

### 4. Make the sport nav active state a filled background cell
Adding a filled background cell (using Morocco red #C1272D or gold #D4AF37 on the dark background) makes the selected sport obvious. This is a 20-minute CSS change with major visual impact.

### 5. Make the tab bar sticky on content pages
On match detail, competition, team, and player pages — the tab bar should stick to the top of the viewport after scrolling past the page header. This is the single most used interactive pattern on Sofascore's inner pages and its absence makes pages feel flat.

### 6. Add position color coding to standings tables
The Botola Pro standings need zone color circles (green for Champions League spots, red for relegation). Use colored circles at the position number, not colored row backgrounds — cleaner, avoids 16 rows bleeding with different colors.

### 7. Add a multi-stat bio grid to player and team pages
The player page needs the 3-column attribute grid (Nationality / DOB+Age / Height // Position / Shirt Number). The team page needs the 4-stat info block (Total players / Avg age / Foreign players / National team players) + Coach, Founded, Venue, Capacity. These data fields are already in your Neon Postgres for 23,544 players.

### 8. Implement the "Featured match" card on team pages
The featured card on a team's Details page (large crests, centered score, match status, competition badge) is the highest-information-density single module on Sofascore. For Wydad or Raja CA pages, showing their last result in this format immediately communicates "this is a live data product."

### 9. Add the season timeline bar to competition pages
The "12 Sept ————●—————— 31 May" progress bar is a simple, highly effective element that adds contextual depth. It tells users where we are in the season without requiring any mental calculation. One `<div>` with a percentage fill tied to (today - seasonStart) / (seasonEnd - seasonStart).

### 10. Redesign the footer from minimal to content-rich
The current footer is legally compliant but signals a stub product. Adding: (1) Morocco Football link section (5–6 links), (2) competition-specific links (Botola Pro groups, cup draws), (3) social links, (4) app store badges placeholder — transforms the footer from "3 links" to "this is a real site." The Loi 09-08 notice should stay but be styled as a subtle single line, not a warning block.

---

## Appendix: Key Sofascore Design Tokens (Observed/Estimated)

| Token | Value |
|---|---|
| Brand primary blue | ~#3D47CC |
| Header background | ~#3D47CC |
| Active nav cell | ~#4A55D8 (lighter blue) |
| Content background | #FFFFFF |
| Card separator | ~#F0F0F0 / #E8E8E8 |
| Body text | #222222 / #1A1A1A |
| Secondary text (country, meta) | #666666 |
| Live indicator | #E53935 (red) |
| Favourite star | #FFB300 (amber) when filled |
| Standings zone green | #4CAF50 |
| Standings zone red | #F44336 |
| Standings zone orange | #FF9800 |
| Tab active underline | ~#3D47CC |
| Tab inactive text | ~#3D47CC (same blue, lighter weight) |
| Footer background | ~#3D47CC (same as header) |
| Font | Rubik or similar geometric sans |
| Base font size | 14px |
| Border radius (pills/buttons) | ~20px (full round) |
| Border radius (cards) | ~8px |
| Competition header height | ~60px |
| Match row height | ~80px (40px per team) |
| Top header total height | ~90px |
| Bottom nav height (mobile) | ~56px |
