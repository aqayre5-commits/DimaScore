# FIFA World Cup 2026 (WC26) — Sofascore Page Analysis
## Comprehensive Structure, Layout, Content & Navigation Analysis

**Analysis Date:** 13 May 2026
**Source URL:** https://www.sofascore.com/football/tournament/world/world-championship/16#id:58210
**Viewport:** 1133px CSS width (desktop two-column layout)
**Page Scroll Height:** 4830px

---

## 1. GLOBAL HEADER (Shared Across All Sofascore Pages)

The global header is fixed at the top and renders identically on all Sofascore pages. It contains:

**WC26 Countdown Ticker (top bar):** A dark-background horizontal scrolling strip positioned above the main navigation bar. Displays the countdown to WC26 kick-off (29D : 0H : 46M : 46S format) on the left side with a trophy icon. The rest of the strip is a horizontally scrolling carousel of group pills, each showing a group label (Group A through Group L) followed by small flag icons of the four teams in that group. These are navigation links pointing back to the WC26 standings page for each group (/football/tournament/world/world-championship/16#id:58210,tab:standings). This ticker is unique to the WC26 context.

**Main Navigation Bar:** White bar containing:
- Sofascore logo (top-left) — links to sofascore.com root
- Search box (centre) — "Search matches, competitions, teams, players..."
- Sign In button (top-right)
- Star icon (Favourites) and lightning bolt icon (Live) and gear icon (Settings)

**Sport Navigation Strip:** Icon + label tabs for: Trending | WC26 (highlighted with Beta badge) | Football (305 live) | Tennis (36 live) | Cricket (2 live) | Rugby | Basketball (25 live) | Darts | American football | MMA | Motorsport | More
Right side: NEWS | FANTASY | TORNEO

**Full-Width Ad Banner:** A leaderboard advertisement (e.g. bet365) spanning the full page width below the header, ~90px tall.

---

## 2. WC26 PAGE — SOURCE PAGE ANALYSIS

### 2.1 Breadcrumb
Football › World › FIFA World Cup 2026 standings, fixtures, results and statistics
(Each item is a clickable link: Football → /football, World → /football/world)

### 2.2 Hero Banner

A WC26-specific full-width hero section with a dark blue/navy gradient background. Distinct from standard tournament hero banners by its graphic design and additional elements:

**Left side of hero:**
- World Cup trophy icon (yellow/gold trophy graphic)
- Title text: "FIFA World Cup 2026"
- Follower count: "710k followers"
- FAVOURITE star button (top-right of hero)

**Year Pills Carousel (chip/radio selector):**
A horizontal row of pill-shaped chips: 2026, 2022, 2018, 2014, 2010, 2006, 2002, 1998, 1994, 1990, 1986, 1982, 1978, 1974, 1970, 1966, 1962, 1958, 1954, 1950, 1938, 1934, 1930
- Implemented as HTML radio inputs + label elements (chip component)
- Active pill = 2026 (highlighted)
- Clicking a pill reloads tournament data for that year IN-PAGE — they do NOT navigate to new URLs
- These are data filters, not navigation links

**Stage Progress Timeline:**
A horizontal progress bar with labelled dot markers: Group stage → R32 → R16 → QF → SF → 3rd → Final
- The current stage ("Group stage") is highlighted
- These dots are visual-only div elements — they do NOT navigate to new URLs

### 2.3 Page Layout (Two-Column)

At 1133px CSS width, the page renders as two columns:
- Left column: 366px wide — fixtures/stats cards
- Centre column: 731px wide — main content with tab navigation
- Right column: Not visible at 1133px (requires ≥1344px for right ad rail)

---

## 3. LEFT COLUMN CARDS

### Card 1: Matches

**Header:** "Matches"
**Three sub-tabs:**
1. **By date** — Fixture list chronological order. Shows match date, time, team names with flags, and status badges. Round 1 fixtures visible (11 Jun – 26 Jun 2026 dates). 24 matches across 12 groups (Groups A–L, 2 matches per group in Round 1).
2. **By round** — Groups matches by round. Dropdown selector shows Round 1 (active) through Round 3 + knockout stages.
3. **By group** — Groups matches by group. Selector for Groups A through L.

Each match row shows: time/date, home team flag + name, score (or kickoff time), away team flag + name, and star icon (add to favourites). Match rows link to individual match detail pages.

### Card 2: Power Rankings (WC26-Specific)

**Header:** "Power Rankings" with a trophy icon
**Dropdown:** "Pre-tournament" selector (the only available option pre-tournament)
Top 5 countries listed (with ranking number, flag, country name, and points):
1. Spain — 2025 pts
2. France — 2012 pts
3. Argentina — 1999 pts
4. England — 1942 pts
5. Brazil — 1910 pts
**"Show more" button** — expands to show remaining ranked teams
Each team name/flag links to its national team profile page.
Note: This card is WC26-specific and not found on regular club tournament pages.

### Card 3: Media Promo (Left Column)

A small card with a "View media" button linking to the Media sub-section of the WC26 page.

### Card 4: Sofascore Analyst Promo

Promotional card for Sofascore's paid analyst subscription:
- "30% OFF" banner badge
- Feature list: Advanced statistics, In-depth analysis, Expert insights, Exclusive predictions
- "View offer" button → links to /upgrade (which redirects to landing.sofascore.com/download/ — different subdomain, cannot be visited directly)

### Ad Unit (Left Column Bottom)

A standard display advertisement unit at the bottom of the left column.

---

## 4. CENTRE COLUMN — TABS

The centre column has four primary navigation tabs:

### Tab 1: Overview (Default/Active)

**Featured Match Cards (2 side-by-side):**
Two match preview cards displayed in a 2-column grid at the top of the overview. Each card shows:
- Tournament badge and name
- Match date and time
- Home team flag + name | score placeholder | Away team flag + name
- Betting odds row (1 / X / 2 values from a bookmaker, with bet365 branding)
- Clicking a featured match card navigates to that match's detail page

**Mini Standings Table:**
- Group selector dropdown (Groups A through L)
- Compact standings table: Rank, Team flag + name, P W D L GLS PTS
- "Full view" link → navigates to the Standings tab of the WC26 page
- Each team row is a clickable link to that team's national team page

**World Cup News Grid:**
- Heading: "World Cup" with Sofascore News label
- 4 news article cards displayed in a 2×2 grid
- Each card: thumbnail image, article title, date
- "See more" link → navigates to sofascore.com/news with World Cup filter
- Clicking any article card navigates to the individual news article page on sofascore.com/news/[slug]

**Titles Section:**
Shows historical WC winners. Each past winner has a year badge + trophy icon + country name. Countries link to their national team pages.

**Related Competitions:**
Cards for the 6 confederation WC qualification tournaments:
- World Cup Qual. CONMEBOL → /football/tournament/south-america/...
- World Cup Qual. UEFA → /football/tournament/europe/world-championship-qual-uefa/11
- World Cup Qual. AFC → /football/tournament/asia/...
- World Cup Qual. CAF → /football/tournament/africa/...
- World Cup Qual. CONCACAF → /football/tournament/north-central-america-and-caribbean/...
- World Cup Qual. OFC → /football/tournament/oceania/...

**Facts Panel:**
Displays statistical facts about WC26 (host cities, team counts, match counts, etc.)

**About / SEO Text Section:**
Long-form text describing the FIFA World Cup 2026. Contains inline hyperlinks to 30+ national team pages. Text includes tournament background, host countries (USA, Canada, Mexico), format (48 teams, 12 groups, 104 matches total), and historical context.

### Tab 2: Standings

**Group Selector:** Dropdown or tabbed selector for Groups A through L
**Table per group:** 4 teams × 12 groups = 48 teams total
**Columns:** Position, Team (flag + name), P (played), W (wins), D (draws), L (losses), DIFF (goal difference), GLS (goals), Last 5, PTS (points)
**Tiebreaker rules accordion:** Expandable section listing tie-breaking rules (head-to-head, then goal difference, etc.)
**Each team row** links to that team's national team page

### Tab 3: Knockout

**Phase selector dropdown:** Allows jumping to specific knockout round (R32, R16, QF, SF, Final, 3rd Place)
**Bracket view:**
- Full bracket spanning the entire tournament knockout stage
- R32: 16 matches (32 teams)
- R16: 8 matches (16 teams)
- QF: 4 matches (8 teams)
- SF: 2 matches (4 teams)
- 3rd place: 1 match (2 teams)
- Final: 1 match (2 teams)
Bracket slots are pre-filled with "Group X Runner-up" / "Group X Winner" placeholder text as the tournament has not started.
**Zoom controls:** + and − buttons to zoom the bracket in/out
**Embed button (</>):** Allows embedding the bracket as an iframe on external websites

### Tab 4: Media

**Sub-tabs:** All | Meet the teams | Highlights | News
- **All:** Grid of all media items (videos + articles)
- **Meet the teams:** Video thumbnails — pre-tournament profile videos for national teams, each linking to YouTube via outbound link
- **Highlights:** Match highlight videos (to be populated after matches are played)
- **News:** Grid of WC26-tagged news articles, each linking to sofascore.com/news/[slug]

---

## 5. FOOTER (Shared Across All Sofascore Pages)

Standard Sofascore footer with three column groups:
- **Football:** UEFA Champions League, FIFA World Cup, Premier League, Serie A, LaLiga, Bundesliga, FIFA Rankings, UEFA Rankings
- **Basketball:** NBA, Euroleague, Stoiximan GBL, Liga ACB, Lega A Basket, Turkish Basketball
- **Other sports:** Tennis, Cricket, Rugby, American football, MMA, Motorsport
Plus: App Store / Google Play download links, Language selector, Terms & Privacy links, Copyright notice

---

## 6. NAVIGATION ANALYSIS — ALL DESTINATION PAGE TYPES

The WC26 page links to the following distinct destination page types:

### DESTINATION TYPE 1: Match Detail Page (Pre-Tournament / Upcoming Match)
**Example URL:** https://www.sofascore.com/football/match/mexico-south-africa/LUbsGVb#id:15186710
**Page Title:** "Mexico vs South Africa live score, H2H and lineups | Sofascore"
**Breadcrumb:** Football › World › FIFA World Cup, Group A, Round 1 › [Match title]
**Scroll Height:** ~2440px
**Layout:** Two-column — Left panel (430px) + Right panel/tabs area (700px)

**Header / Match Summary Bar (full width):**
- Home team crest + name | Match date (11/06/2026) + time (Thu 20:00) | Away team crest + name
- Below: Date/time row | Competition icon + "FIFA World Cup" link | Venue name "Estadio Azteca"
- FAVOURITE button (top-right), COMPARE TEAMS icon, ADD TO CALENDAR icon

**Left Panel Cards:**

*Prediction / Vote Widget:*
A card-style carousel with three voting polls:
1. "Who will win?" — Three buttons: Home team crest | X (draw) | Away team crest
2. "Will both teams score?" — YES / NO buttons
3. "Who will score first?" — team selection options
Navigation dots and Previous/Next arrows cycle through the three polls.

*Match Info Cards:*
- Date and time: 11/06/2026 • 20:00 | "Add to calendar" link with calendar icon
- Competition: "Football, FIFA World Cup, Group A, Round 1" — links to WC26 tournament page
- FIFA Rankings: "#15 Mexico" | "#60 South Africa" — each with team flag, links to team pages
- Venue card: Name "Estadio Azteca" | Location "Mexico City, Mexico" | "See more details" link

*Betting Responsibility Notice:* "Gamble responsibly 18+, www.begambleaware.org"
*Ad Unit:* Display ad at bottom of left panel (e.g. bet365)

**Right Panel Tabs (Pre-Tournament Match — only 2 tabs):**
For a future/pre-tournament match, the tab bar shows only:
1. **Standings** — Shows the group standings for the group this match belongs to (Group A). Table format identical to main Standings tab: Rank, Team, P/W/D/L/DIFF/GLS/Last5/PTS. Tiebreaker rules accordion below.
2. **H2H (Head to Head)** — Two-column layout:
   - Left: "Head-to-head" section with venue filter (At [Home Team], This competition checkboxes). Lists previous encounters between the two teams with date, competition, score.
   - Right: "Matches" section showing each team's recent matches independently. Filter: Home / This competition checkboxes. Lists recent fixtures with date, competition, score.

*Note: Played match pages would additionally show tabs such as: Summary / Lineups / Live Commentary / Statistics / Odds.*

**About the match section (below tabs):** SEO text describing the upcoming fixture, current FIFA rankings for both teams, and Sofascore rating explanation. "Show more" accordion expands full text.

**Latest Stories widget:** 6-7 article cards (from Sofascore News) shown as horizontal scroll at bottom of page — article title + source, links to /news/[slug].

---

### DESTINATION TYPE 2: National Team Page
**Example URL:** https://www.sofascore.com/football/team/spain/4698
**Page Title:** "Spain live score, schedule & player stats | Sofascore"
**Breadcrumb:** Football › International › UEFA Nations League › Spain scores, fixtures, standings and player stats
**Scroll Height:** ~3525px
**Layout:** Two-column — Left column + Right/main content area

**Team Profile Header (full width):**
- Large circular flag/crest image (Spain flag, ~120px)
- Team name "Spain" + follower count "1.6M followers"
- Coach name + avatar: "Luis De La Fuente, Coach"
- FIFA ranking badge: "FIFA #2"
- COMPARE button (top-right) + FAVOURITE star button
- Current competition badge: "UEFA Nations League" (linked)
- Previous match card: Competition, date (31/03/26 FT), Home vs Away, score — clickable match link
- Next match card: Competition, date (09/06/26), Home vs Away — clickable match link

**Left Column:**
*Meet the Team promotional card:*
- Background image (team photo with dark overlay)
- Title: "The 2026 World Cup Warm Up: Spain"
- Excerpt text: Short description of Spain's WC26 campaign
- Source: "Sofascore • 22 Mar 2026"
- Clicking navigates to the news article on sofascore.com/news/

*Matches Card:*
- "Matches" heading with competition filter dropdown ("All" or specific competition)
- View toggle: List | Calendar
- Status filter tabs: Finished | Upcoming (toggle)
- Navigation arrows (◄ ►) to page through seasons/months
- Match list grouped by competition:
  - Competition header (badge + competition name)
  - Match rows: date/status | Home team | score | Away team | result badge (W/D/L coloured circle)
  - Competitions shown include: International Friendly Games, Finalissima, World Cup Qual. UEFA

**Right/Main Content Tabs:**
1. **Standings** — Dropdown selectors: Competition ("FIFA World Cup") + Year ("2026"). Shows group table (Group H for Spain). Format: Rank/Team/P/W/D/L/DIFF/GLS/Last5/PTS. Tiebreaker rules accordion.
2. **Statistics** — Player statistics for Spain. Season selector. Category tabs: General/Attack/Defense/Passing/Goalkeeping/Detailed. Sortable table by stat column.
3. **Players** — Squad list with player names, positions, ages, and Sofascore ratings. Each player links to their player profile page.
4. **Details** — Team information: Country, Founded year, Coach, Stadium.
5. **Media** — News articles and video content related to Spain.

---

### DESTINATION TYPE 3: WC Qualification Tournament Page
**Example URL:** https://www.sofascore.com/football/tournament/europe/world-championship-qual-uefa/11#id:69427
**Page Title:** "World Cup Qual. UEFA table, schedule & stats | Sofascore"
**Breadcrumb:** Football › Europe › World Cup Qual. UEFA standings, fixtures, results and stats
**Scroll Height:** ~3714px
**Layout:** Same two-column structure as the WC26 main page (Left fixtures + Right content/tabs)

**Tournament Hero Banner:**
- UEFA logo (round orange/red badge)
- Title: "World Cup Qual. UEFA"
- Follower count: "209k followers"
- Region badge: "Europe" globe icon
- Year selector dropdown: "2026" (▾) — can switch to previous qualification campaigns
- FAVOURITE star button
- Timeline bar below: Horizontal date bar from "21 Mar" to "31 Mar" (showing current active window)

**Left Column:**
*Featured Match Card:*
- Shows a specific featured match with: date (31/03/2026), time (19:45), home team | score (1-1 PEN 4-1) | away team (BiH vs Italy), competition name
- Betting odds strip below the match: 1 | X | 2 odds values with bookmaker branding
- Navigation arrows (◄ ►) for browsing featured matches
*Matches Card:*
- Sub-tabs: By date | By round | By group
- Dropdown: Round selector (e.g. "Final")
- Match list with same format as WC26 matches card

**Right Column Tabs:**
1. **Standings** — Group/phase standings tables
2. **Knockout** — Bracket view for playoff rounds
3. **Stats** — Player statistics for the qualification campaign
   - Category sub-tabs: General | Attack | Defense | Passing | Goalkeeping | Detailed
   - Filter: All players / Players with minimum appearances
   - Accumulation dropdown: "All"
   - Stat table: # | Team | Name | Goals | Succ. dribbles | Tackles | Assists | Accurate passes % | Average Sofascore Rating
4. **Details** — Tournament information
5. **Media** — News and video content

---

### DESTINATION TYPE 4: World Region Page (/football/world)
**URL:** https://www.sofascore.com/football/world
**Page Title:** "Football Live Score - Sofascore"
**Breadcrumb:** Football › World › Football Livescore
**Scroll Height:** ~4257px
**Layout:** Two-column — Left fixtures list + Right contextual content

**Left Column — "World" Fixtures List:**
- Heading: "World" with date navigation arrows and "Today" button
- Fixture list grouped by competition:
  - Club Friendly Games (with matches listed)
  - U20 Friendly Games
  - Kings League Mexico, Playoff
  - U16 Friendly Games
  - (additional international competitions scroll below)
- Below fixtures: "All Football leagues and tournaments from World covered on Sofascore:" followed by an alphabetical list of World-category competitions (used as SEO text + navigation links):
  - UEFA-CONMEBOL Club Challenge, FIFA World Cup, FIFA Intercontinental Cup, Arab Cup, Olympic Games, Olympic Games Women, International Friendly Games, Arab Club Champions Cup, Club Friendly Games, Emirates Cup, Premier League Asia Trophy, Algarve Cup Women, International Friendly Games Women, etc.

**Right Column (contextual/dynamic):**
When a match is selected from the left list, a match preview panel appears on the right showing:
- Competition name and badge
- Match time and status
- Team crests and names
- "Who will win?" prediction widget (Home | X | Away vote buttons)
- Betting odds display: Full-time odds (1 / X / 2) with numerical values and arrows indicating direction
- bet365 branding + "Additional odds" link + "Claim" button
- Previous/Next match carousel navigation
- FIFA Rankings card (links to FIFA rankings page)
- UEFA Rankings card (links to UEFA rankings page)
- Player of the Season race card: Competition dropdown selector (e.g. "UEFA Champions League"), ranked player list with Sofascore ratings (1. Lamine Yamal 8.08, 2. Kylian Mbappé 8.05, 3. Harry Kane 7.93), "View past winners" link
- Compare players card: Row of player headshots with "Compare players >" link
- Compare teams card: Row of team crests with "Compare teams >" link
- Featured odds card: "Bet Now >" link

---

### DESTINATION TYPE 5: Sofascore News Article Page
**Example URL:** https://www.sofascore.com/news/neymar-and-vasco-headline-brasileirao-team-of-the-week
**Page Title:** "Neymar and Vasco headline Brasileirão Team of the Week"
**Subdomain:** sofascore.com/news (same domain, different path structure)
**Scroll Height:** ~5011px
**Layout:** Two-column — Left sidebar (latest stories) + Right main article content

**Global Header (News variant):**
Different header from main Sofascore app:
- Sofascore News logo (top-left) — links to news homepage
- Search bar: "Search news..." (centre)
- "Sofascore app" link (top-right) — app download link
- Settings gear icon

**Full-Width Ad Banner:** Leaderboard ad (bet365) below header

**Breadcrumb:** Sofascore News › [Article title]

**Left Sidebar — "The latest stories":**
A vertically stacked list of recent news cards, each containing:
- Thumbnail image (left)
- Article title (right, 2-3 lines)
- Date (below title)
Articles are from across all sports (football, basketball, tennis, etc.)
**"All news >"** link at bottom — navigates to sofascore.com/news
**Advertisement unit** (bet365) below the article list

**Right Column — Article Content:**
- Byline: "Written by [Author Name]" • [Date]
- Article headline (h1)
- Hero image (full-width within column)
- Article body text (multiple paragraphs)
- Embedded Sofascore data widgets (e.g. Team of the Week formation graphic, player stat cards)
- Tags/keywords (e.g. neymar, santos, sofascore, totw, vasco)
- Social sharing buttons (Twitter/X, Facebook, copy link)
- Related articles section at bottom

---

### DESTINATION TYPE 6: Sofascore Analyst / Upgrade Page
**URL:** /upgrade → redirects to landing.sofascore.com/download/
**Status:** Different subdomain — page could not be accessed
**Note:** The "View offer" button in the Sofascore Analyst promo card on the WC26 left column navigates to /upgrade which immediately redirects to landing.sofascore.com/download/. This is a dedicated marketing/landing page for the Sofascore premium subscription product. Cannot be fully documented due to subdomain permission restriction.

---

## 7. COMPLETE LINK INVENTORY — WC26 PAGE

### By category:

**Match links (24 total):**
All 24 Round 1 group matches, format: /football/match/[team-a]-[team-b]/[id]
Examples:
- Mexico vs South Africa → /football/match/mexico-south-africa/LUbsGVb#id:15186710
- South Korea vs Czechia → /football/match/south-korea-czechia/oUbsKUb#id:15186720
- Canada vs BiH → /football/match/canada-bosnia-and-herzegovina/EObscVb#id:15186836
- USA vs Paraguay → /football/match/paraguay-usa/zUbsOVb#id:15186873
- Qatar vs Switzerland → /football/match/qatar-switzerland/ZTbsRVb#id:15186526
- Brazil vs Morocco → /football/match/morocco-brazil/YUbsDVb#id:15186850
(+ 18 more across Groups B–L)

**National team page links (36+ total):**
Power Rankings top 5 + Standings 48 teams + SEO text inline links
Format: /football/team/[team-name]/[id]
Examples:
- Spain → /football/team/spain/4698
- France → /football/team/france/4481
- Argentina → /football/team/argentina/6
- England → /football/team/england/4713
- Brazil → /football/team/brazil/4755

**News article links (8 visible):**
4 in Overview news grid + 4 in Media tab
Format: /news/[article-slug]
Examples:
- /news/how-fan-culture-differs-between-host-countries
- /news/world-cup-2026-power-rankings

**WC Qualification tournament links (6):**
- World Cup Qual. CONMEBOL → /football/tournament/south-america/world-championship-qual-conmebol/...
- World Cup Qual. UEFA → /football/tournament/europe/world-championship-qual-uefa/11
- World Cup Qual. AFC → /football/tournament/asia/world-championship-qual-afc/...
- World Cup Qual. CAF → /football/tournament/africa/world-championship-qual-caf/...
- World Cup Qual. CONCACAF → /football/tournament/north-central-america-and-caribbean/...
- World Cup Qual. OFC → /football/tournament/oceania/...

**Region link (1):**
- World region page → /football/world (in breadcrumb)

**External links:**
- YouTube (media/video thumbnails in Media tab) — outbound
- landing.sofascore.com/download/ (via /upgrade — promo card)

**Non-navigating interactive elements:**
- Year pills (2026–1930): Radio input chips — reload in-page data, no URL navigation
- Stage timeline dots (Group stage/R32/R16/QF/SF/3rd/Final): Visual indicators only, no navigation
- Tab navigation (Overview/Standings/Knockout/Media): SPA in-page navigation, URL hash changes
- By date/By round/By group tabs in Matches card: In-page data filters
- Embed (</>): Opens embed code modal, no page navigation
- Zoom +/−: In-page bracket zoom controls
- Group selector dropdown in Standings: In-page data filter

---

## 8. KEY OBSERVATIONS & COMPARISONS

### WC26 vs Standard Club Tournament Pages (e.g. Premier League)

| Feature | WC26 Page | PL/Club Page |
|---|---|---|
| Hero banner style | Dark gradient + WC26-specific design, trophy icon | Competition logo/badge, simpler |
| Year pills | Yes — full tournament history from 1930 | Yes — recent seasons only |
| Stage timeline | Yes — WC26-specific progress indicator | No |
| Power Rankings card | Yes — WC26-specific | No |
| Left column cards | Matches + Power Rankings + Media promo + Analyst promo | Matches + Top Players/Scorer + Analyst promo |
| Teams in standings | 48 (12 groups × 4 teams) | Varies (20 for PL) |
| Match tabs | By date/By round/By group | By date/By round |
| Centre tabs | Overview/Standings/Knockout/Media | Overview/Standings/Knockout/Media (identical structure) |

### WC26 Match Page vs Regular Club Match Page

| Feature | WC26 Pre-Tournament Match | PL/Played Match |
|---|---|---|
| Tabs shown | Standings + H2H only | Summary/Lineups/Commentary/Statistics/Odds |
| Left panel | Vote widgets + match info + FIFA rankings | Vote widgets + match info + team form |
| Match-specific info | FIFA rankings instead of league position | League table position |
| Betting section | Minimal (odds in left panel only) | Full odds comparison tab |

### National Team Page vs Club Team Page

| Feature | National Team (Spain) | Club Team |
|---|---|---|
| Profile image | National flag | Club crest/badge |
| Coach info | Yes (national team coach) | Yes (manager) |
| FIFA ranking | Yes (FIFA #2) | No |
| Current competition | UEFA Nations League | Domestic league |
| Standings tab context | Shows WC26 group standings | Shows domestic league table |

---

## 9. SOFASCORE NEWS PAGE (Standalone)

The Sofascore News section functions as a semi-independent editorial platform within the sofascore.com domain.

**News Homepage (sofascore.com/news):**
- Different header/navigation from main app (no sport tabs, no match counts)
- Featured content block: "World Cup stories" banner at top with "SEE MORE →" button
- Category filter pills: All news | Football | Other sports | Torneo by Sofascore | Fantasy | Business | Product | World Cup stories
- Main content: Featured article (hero card: large image + headline + excerpt + tags)
- Article grid below: card-format with thumbnail + title + date

**News Article Page (individual):**
- Two-column layout: left sidebar (latest stories) + right article content
- Byline, date, full article text, embedded widgets, tags, social sharing
- Related articles below content

---

## 10. SUMMARY

The FIFA World Cup 2026 page on Sofascore is the most feature-rich tournament page on the platform, built around a WC26-specific design language. Its hero section, Power Rankings card, and stage timeline are unique to this tournament. The two-column desktop layout (left fixtures, right tabbed content) follows the same structural pattern as all other tournament pages, but with more content depth due to the tournament's scale (48 teams, 104 matches, 6 confederation qualifiers).

The page serves as a hub connecting to six distinct destination page types: individual match pages, national team profile pages, WC qualification tournament pages, the World football region page, Sofascore News articles, and the Sofascore Analyst upgrade landing page. All internal navigation is implemented as SPA deep-links with URL hash parameters, maintaining a consistent desktop layout across destination pages.
