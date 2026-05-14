# Football Landing Page — Sofascore Clickable Destinations & Page Analysis

**URL:** https://www.sofascore.com/ (= https://www.sofascore.com/football)  
**Viewport:** 1133px CSS width (desktop layout — two content columns visible)  
**Page scroll height:** ~6139px  
**Analysis date:** 13 May 2026

---

## PART 1: COMPLETE INVENTORY OF CLICKABLE DESTINATIONS

### Total link count: 186 unique links in the content area

---

### FROM THE LEFT COLUMN (Fixture List Card)

The left column is a single large card (~4460px tall) containing the full multi-competition fixture list. It generates the following outbound link types:

**1. Competition group headers → Tournament page**
Each competition section header (e.g. "Premier League", "LaLiga", "Ligue 1") is a clickable link to that tournament's page at `/football/tournament/{country}/{name}/{id}`. On the day of analysis, 68 unique tournament links were present in the left column.

**2. Country labels under each competition → Country page**
Immediately below each competition name is a country label (e.g. "England", "Spain", "France"). Each links to the country's football page at `/football/{country}`. 32 unique country links counted.

**3. Individual match rows → Match detail page**
Each fixture row (showing time, home team, score/dash, away team) links to the match detail page at `/football/match/{slug}/{id}`. 23 unique match links counted from the expanded competitions visible on Today view.

**4. Standings-only competition headers → Standings-only page**
Some less prominent competitions use a `/football/standings/{country}/{name}/{id}` URL pattern rather than the full tournament URL. These open a minimal standings-only tournament page variant (see page type 8 below).

**5. Favourite star icons**
Per-competition and per-match star icons — these toggle favourites in-app, no navigation.

**6. Odds toggles (Live/Finished/Upcoming pills, Odds toggle)**
Within-card filters only, no navigation.

---

### FROM THE CENTRE COLUMN (Editorial Cards)

**Card 1 — Match Preview Carousel (scrollable)**
- Tournament name header (e.g. "LaLiga", "Premier League", "Ligue 1") → Tournament page
- Featured match link (team names / score) → Match detail page
- Bet odds links (1/X/2 values) → External: bet365.com
- "Claim" / "Additional odds" → External: bet365.com
- Carousel shows 5 featured matches; each slide has the above links

**Card 2 — FIFA/UEFA Rankings**
- "FIFA Rankings" → FIFA Rankings page (`/football/rankings/fifa`)
- "UEFA Rankings" → UEFA Rankings page (`/football/rankings/uefa`)

**Card 3 — Player of the Season Race**
- Competition selector dropdown (within-card, no navigation)
- Each player entry (rank + name + club + rating) → Player profile page (`/football/player/{slug}/{id}`)
- "View past winners" link → Player of the Season archive page (`/football/player-of-the-season`)

**Card 4 — Compare Players**
- The entire card is a single link → Player comparison tool (`/football/player/compare`)

**Card 5 — Compare Teams**
- The entire card is a single link → Team comparison tool (`/football/team/compare`)

**Card 6 — Featured Odds**
- "Bet Now" → External: bet365.com
- Each match row → Match detail page
- Bet odds (1/X/2 values) → External: bet365.com

**Card 7 — Top Performances**
- "Show more" → Button only, expands list within card (no navigation)
- No outbound links to new pages on the card itself

**Card 8 — Torneo Promo**
- "Learn more" button → External: https://torneo.sofascore.com/ (different subdomain)

**Card 9 — About SEO Text**
- Tournament name links (UEFA Champions League, UEFA Europa League, Premier League, LaLiga, Bundesliga, Serie A, Ligue 1, Brasileirão Série A) → Tournament pages
- "player comparison tool" text link → Player comparison tool (`/football/player/compare`)

---

### WHAT DOES NOT OPEN A NEW PAGE
- All/Favourites/Competitions tabs in left column → filter within card
- Live/Finished/Upcoming status pills → filter within card
- Odds toggle (on/off switch) → toggles odds display inline
- Date navigator (< Today >) → changes date, same page
- Left-column competition expand/collapse chevrons → expand inline
- "Show more" in Top Performances card → expands inline
- Bet365 "Claim" / sign-up bonus links → external, not Sofascore pages

---

## PART 2: UNIQUE DESTINATION PAGE TYPES

The football landing page leads to **10 distinct destination page types** (excluding external sites):

1. Tournament page (full)
2. Tournament page (standings-only variant)
3. Country / Region fixture page
4. Match detail page
5. Player profile page
6. FIFA Rankings page
7. UEFA Rankings page
8. Player comparison tool page
9. Team comparison tool page
10. Player of the Season archive page

Plus two external destinations:
- External: bet365.com (odds links, "Bet Now", "Claim")
- External: torneo.sofascore.com (Torneo promo card)

---

## PART 3: PAGE-BY-PAGE DETAILED ANALYSIS

---

### 1. TOURNAMENT PAGE (FULL)
**URL pattern:** `/football/tournament/{country}/{name}/{id}`  
**Example:** `/football/tournament/england/premier-league/17`

This is the same as the Premier League 2025/2026 page already documented in the previous analysis. Identical structure for all major tournaments.

**Structure recap:**
- Sticky global header (WC26 countdown + topbar + sport nav)
- Full-width ad banner
- Breadcrumb: Football › Country › Tournament name
- Tournament hero card: crest, name, followers count, country flag, season selector dropdown, season timeline bar, FAVOURITE button
- Two-column content area:
  - Left column (366px): Featured match card, Matches card (by date/by round), Media promo, editorial cards (POTS race, TOTW, Fantasy promo), ad unit
  - Centre column (731px): Primary tabs — Standings / Stats / Details / Media (some tournaments add Knockout tab)
- Standings tab: full league table with All/Home/Away sub-tabs, tiebreaker rules, Standings Tracker chart
- Stats tab: Player stats table with General/Attack/Defense/Passing/Goalkeeping/Detailed sub-tabs
- Details tab: Titles (holder + most), Lower division link, Newcomers, Facts panel
- Media tab: Highlights (video thumbnails) + News articles (All/Highlights/News sub-tabs, "See all" buttons)
- About / SEO card below main tabs
- Footer

---

### 2. TOURNAMENT PAGE (STANDINGS-ONLY VARIANT)
**URL pattern:** `/football/standings/{country}/{name}/{id}`  
**Example:** `/football/standings/argentina/camp-de-reser-de-primera-division-b-metropolitana/62405`  
**Title:** [Competition name] live score, fixtures and results

Used for lower-league and reserve competitions that don't have a full stats/media dataset. Notably simpler than the full tournament page.

**Breadcrumb:** Football › [Country] › [Competition name] live score

**Hero Card (full-width):**
- Greyed-out trophy icon (no official logo/crest available)
- Competition name in large bold text
- Country flag + country name
- No season selector, no FAVOURITE button, no follower count

**Left Column (366px) — 1 card:**
Matches card: Finished | Upcoming toggle tabs. Left/right navigation arrows. Competition name as group header. Match rows showing: time, live minute indicator (e.g. HT, 90+), home team, score, away team. No odds row. No media promo. No editorial cards.

**Centre Column (731px):**
Empty — no tabs, no standings table, no stats. The centre column container is present in the DOM but renders no content.

**No editorial cards, no footer SEO text specific to competition.**

**Footer:** Same shared Sofascore footer.

**Key difference from full tournament page:** No tabs at all in centre, no stats, no media, minimal hero. Essentially just a fixture list with tournament context.

---

### 3. COUNTRY / REGION FIXTURE PAGE
**URL pattern:** `/football/{country}`  
**Example:** `/football/england`  
**Title:** Football Live Score – Sofascore

**Breadcrumb:** Football › England › Football Livescore

**Layout:** Two-column, same widths as the football landing page (549px left + 549px right/centre).

**Left Panel (549px) — country fixture list:**
- Country name as large heading ("England") + date navigator (< Today >)
- All competitions from that country active today, each showing:
  - Competition name + crest as group header (clickable → full tournament page)
  - Match rows below (time + home team + score/dash + away team)
- Below the live matches: "All Football leagues and tournaments from [Country] covered on Sofascore:" followed by a comprehensive alphabetical list of all competitions — each is a plain text link to its tournament page. For England this includes: Premier League, Championship, League One, League Two, National League, FA Cup, FA Cup Qualification, EFL Cup, Football League Trophy, FA Women's Championship, Community Shield, Women's Super League, Women's FA Cup, England National League Cup, FA Women's League Cup, Baller League UK, FA Youth Cup, and many regional/lower leagues.
- Gambling disclaimer + Ad unit at bottom

**Right Panel / Centre (549px):**
Identical to the football landing page centre column — same rotating match preview carousel with featured matches from top global competitions (not filtered to the selected country).

**No tabs, no hero card, no season selector.** The page is essentially a country-filtered version of the football landing page.

---

### 4. MATCH DETAIL PAGE
**URL pattern:** `/football/match/{slug}/{id}`

Same as documented in the Premier League analysis. See that document for full detail.

**Quick recap:** Full-width match hero (teams, time, venue, TV channels). Left column: odds, media promo, fan polls, prematch standings, TV channels, date/time/referee, venue, featured player comparison, Fantasy promo. Centre column tabs: Lineups | Statistics | Standings | H2H | Media.

---

### 5. PLAYER PROFILE PAGE
**URL pattern:** `/football/player/{slug}/{id}`

Same as documented in the Premier League analysis. See that document for full detail.

**Quick recap:** Full-width player hero (photo, club, contract, bio stats, previous/next match). Left column: Market value, 12-month rating chart, media promo, attribute radar, positions diagram, transfer history, national team. Centre tabs: Matches | Season | Career | Fantasy | Media.

---

### 6. FIFA RANKINGS PAGE
**URL:** `/football/rankings/fifa`  
**Title:** FIFA Football Rankings 2026 – Sofascore  
**Breadcrumb:** FIFA Football rankings 2026

**Layout:** Two-column (366px left + 731px centre). No tournament hero. No primary tab bar.

**Left Column (366px) — 2 items:**

Matches card: Upcoming/recent international fixtures grouped by competition (e.g. "Africa, U17 Africa Cup of Nations, Group A"). Shows date, time, teams, score. Each competition group has a ">" arrow linking to its tournament page. Each match row links to match detail page. No tabs within card.

Ad unit below.

**Centre Column (731px) — Rankings table:**
- FIFA logo (large) + "FIFA Rankings" heading
- "Last updated: 13/05/26, 16:00"
- "Find country" search input with magnifier icon
- "Show favourites only" checkbox
- Column headers: # | Country | Total pts | Previous pts | +/-
- Ranked list of all 211 FIFA member nations, each row showing:
  - Rank number + movement indicator (up/down arrow + positions moved)
  - Country flag + country name
  - Total points (e.g. France 1877.32)
  - Previous points
  - Change (+/-)
  - Favourite star
- Top 6 on analysis date: 1st France (1877.32), 2nd Spain (1876.40), 3rd Argentina (1874.81), 4th England (1825.97), 5th Portugal (1763.83), 6th Brazil (1761.16)
- No sub-tabs. No filters beyond the search box and favourites checkbox.
- Country rows are not clickable links (no team/country profile pages for national team rankings context).

---

### 7. UEFA RANKINGS PAGE
**URL:** `/football/rankings/uefa`  
**Title:** UEFA Football Rankings 2026 – Sofascore  
**Breadcrumb:** UEFA Football rankings 2026

**Layout:** Two-column (366px left + 731px centre). Same layout pattern as FIFA Rankings.

**Left Column (366px):**
Matches card showing upcoming UEFA club competition fixtures (UEFA Europa League, UEFA Champions League). Each match row links to match detail page. Competition group headers link to tournament page.

**Centre Column (731px) — Rankings table:**
- UEFA logo (large circular red crest) + "UEFA Rankings" heading
- "Last updated: 13/05/26, 14:30"
- Two sub-tabs: **Countries** (active) | **Clubs**
- Countries tab: "Find country" search input + "Show favourites only" checkbox
- Column headers: # | Country | Teams* | Coefficient
- Ranked list of UEFA member countries showing their European competition coefficient:
  - Rank + country flag + country name + top domestic league badge
  - Teams* (clubs currently active in European competition / total eligible)
  - Coefficient score
- Top 5 on analysis date: 1st England 118.964 (3/9, Premier League), 2nd Italy 99.946 (0/7, Serie A), 3rd Spain 97.046 (1/8, LaLiga), 4th Germany 92.902 (1/7, Bundesliga), 5th France 83.355 (1/7, Ligue 1)
- Clubs tab (not explored): Presumably shows club-level UEFA ranking coefficients.
- Country name rows are clickable (each has a tournament/league badge link).

---

### 8. PLAYER COMPARISON TOOL
**URL:** `/football/player/compare`  
**Title:** Player stats and comparison tool | Sofascore  
**Breadcrumb:** Football › Player comparison

**Layout:** Single wide card (full-width, ~1260px). No left/right column split. No primary tabs.

**Hero comparison panel:**
- "Player comparison" heading + ⓘ info icon
- "Add another player" button with + icon (for adding a 3rd player)
- Side-by-side player selector panels (2 by default):
  - Each has: circular placeholder avatar, "Select player" dropdown, competition selector dropdown ("-"), season selector ("-")
- When players are selected, their stats appear head-to-head in rows between the two panels

**Popular player comparisons section** (below selector):
- "Popular player comparisons" heading
- Grid of pre-made comparison cards, each showing:
  - Two player photos side by side
  - Player name + position + competition badge + league name
  - Selected head-to-head stats (e.g. Avg. Sofascore Rating, Goals conceded, Saves, Goals prevented, Clean sheets, Accurate passes, Acc. long balls)
  - "COMPARE" button at bottom of card
- Examples visible: Donnarumma vs Raya (Premier League 25/26), William Saliba vs Rúben Dias (Premier League 25/26)
- Each "COMPARE" button loads that pairing into the selector above

---

### 9. TEAM COMPARISON TOOL
**URL:** `/football/team/compare`  
**Title:** Sofascore  
**Breadcrumb:** Football › Team comparison

**Layout:** Single wide card (full-width). No left/right column split. No primary tabs. Structurally identical to the Player comparison page.

**Hero comparison panel:**
- "Team comparison" heading + ⓘ info icon
- "Add another team" button with + icon
- Side-by-side team selector panels (2 by default):
  - Each has: shield placeholder logo, "Select team" dropdown, competition selector dropdown ("-"), season selector ("-")

**Popular team comparisons section:**
- Grid of pre-made comparison cards, each showing:
  - Two team crests side by side with team names and country flags
  - Competition badge + league name
  - Head-to-head stats (Avg. Sofascore Rating, Saves per game, Goals conceded, etc.)
  - "COMPARE" button
- Examples visible: Sunderland vs Everton (Premier League 25/26), AS Roma vs Arsenal (Serie A 25/26 vs Premier League 25/26)

---

### 10. PLAYER OF THE SEASON ARCHIVE PAGE
**URL:** `/football/player-of-the-season`  
**Breadcrumb:** Football › Sofascore Player of the Season | Winners & Stats

**Layout:** Full-width hero banner + two-column content below.

**Hero banner (full-width, ~490px tall):**
- Dark navy background with stadium/trophy image
- Sofascore POTS trophy logo icon (blue/white)
- "Player of the Season" heading in large white text

**Left Panel (366px) — Explanatory text card:**
- "Player of the Season Awards" heading
- Explanation paragraph: "At the end of each season, the football player with the league's highest average Sofascore Rating gets a special honour: the Player of the Season award. Top-rated players in 150 different leagues and tournaments get an in-app badge for their achievement, while major league players also get a physical trophy. All get eternal bragging rights."
- "Learn more" link/button
- Decorative trophy image

**Centre Panel (731px) — Winners table:**
Three primary tabs: **Highest ratings** (active) | Most awards | Top leagues

Highest ratings tab:
- Info notice: "This list includes only Player of the Season winners, not all top-rated players."
- Season filter dropdown: "All-time" | Filter button
- Table rows (each is a clickable link to the player's profile page):
  - Year | Player photo + name + club | Competition badge + league name | Rating badge
- Sample winners visible: 2025 Alexxis Sierra Lipsey (Riga FC, Latvian Women's League, 8.57), 2025 Maxime Lestienne (Lion City Sailors, Singapore Premier League, 8.01), 2019 Lionel Messi (FC Barcelona, UEFA Champions League, 7.92), 1966 Eusébio (Portugal, FIFA World Cup), 2024 Akram Afif (Al-Sadd, Stars League), 2026 Clara Luvanga (Al-Nassr, Saudi Women's Premier League)
- Most awards tab: Presumably ranks players by total POTS awards received
- Top leagues tab: Presumably ranks competitions by POTS winners

---

## PART 4: SUMMARY TABLE

| Click source | Destination page type | URL pattern |
|---|---|---|
| Competition header in left column | Tournament page (full) | /football/tournament/{country}/{name}/{id} |
| Competition header (lower leagues) | Tournament page (standings-only) | /football/standings/{country}/{name}/{id} |
| Country label under competition | Country fixture page | /football/{country} |
| Any match row (left or centre) | Match detail page | /football/match/{slug}/{id} |
| Player name in POTS card | Player profile page | /football/player/{slug}/{id} |
| "FIFA Rankings" in Rankings card | FIFA Rankings page | /football/rankings/fifa |
| "UEFA Rankings" in Rankings card | UEFA Rankings page | /football/rankings/uefa |
| "Compare players" card | Player comparison tool | /football/player/compare |
| "Compare teams" card | Team comparison tool | /football/team/compare |
| "View past winners" in POTS card | POTS archive page | /football/player-of-the-season |
| Tournament names in About SEO text | Tournament page (full) | /football/tournament/{country}/{name}/{id} |
| "player comparison tool" in About SEO | Player comparison tool | /football/player/compare |
| Bet365 odds links / "Bet Now" / "Claim" | External: bet365.com | https://www.bet365.com/... |
| "Learn more" in Torneo card | External: torneo.sofascore.com | https://torneo.sofascore.com/ |

---

## PART 5: COMPARISON WITH PREMIER LEAGUE PAGE

| Feature | Football landing page | Premier League page |
|---|---|---|
| Unique destination page types | 10 internal + 2 external | 6 internal + 1 external |
| New page types (not in PL) | Country page, FIFA Rankings, UEFA Rankings, Player compare, Team compare, POTS archive, Standings-only tournament | — |
| Shared page types | Match detail, Player profile, Tournament page, Fantasy | Match detail, Player profile, Tournament page, Fantasy |
| Left column function | Multi-competition fixture directory (500+ sections) | Single-tournament fixture list (round navigator) |
| Centre column cards | 9 editorial cards | 1 tabbed card (Standings/Stats/Details/Media) + About SEO |
| Outbound links volume | ~186 unique links (content area) | ~22 notable links + 20 team rows + match rows |
| External links | bet365 (odds) + torneo.sofascore.com | bet365 (odds only) |

---

*Analysis conducted on 13 May 2026. Viewport: 1133px CSS width (desktop layout, two columns). URL: https://www.sofascore.com/football (redirects to https://www.sofascore.com/)*
