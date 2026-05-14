# Premier League 2025/2026 — Sofascore Page Navigation Analysis

---

## PART 1: COMPLETE INVENTORY OF WHAT OPENS A NEW PAGE

From the Premier League 2025/2026 main page, the following elements navigate to a distinct new URL:

### From the Left Column
1. Every individual match row in the Matches card → Match detail page (`/football/match/...`)
2. Featured match (Man City vs Crystal Palace card at top) → Match detail page
3. Betting odds links (1/5, X 13/2, 2 10/1) → bet365 external site
4. Each player in Player of the Season race card → Player profile page (`/football/player/...`)
5. Each player in Team of the Week card → Player profile page (`/football/player/...`)
6. "Play now" in Sofascore Fantasy card → Sofascore Fantasy sign-in page (`/fantasy`)

### From the Centre Column — Standings tab
7. Each of the 20 team rows in the standings table → Team profile page (`/football/team/...`)
8. Each W/D/L form pill in the Last 5 column → The match that result belongs to (match detail page)
9. Standings Tracker match result links (e.g. "3-0", "3-3") → Match detail page
10. "Championship" link in the About SEO card (relegation link) → Championship tournament page (`/football/tournament/england/championship/18`)

### From the Centre Column — Stats tab
11. Each player name in the stats table → Player profile page (`/football/player/...`)
12. Team badge icons next to each player → Team profile page (`/football/team/...`)

### From the Centre Column — Details tab
13. Liverpool FC (Title holder) → Team profile page
14. Manchester United (Most titles) → Team profile page
15. Championship (Lower division) → Championship tournament page
16. Leeds United (Newcomer) → Team profile page
17. Sunderland (Newcomer) → Team profile page
18. Burnley (Newcomer) → Team profile page

### From the Centre Column — Media tab
19. Each news article title under "News" section → Sofascore News article page (`/news/...`)
20. Video thumbnails in Highlights section → Open a video overlay modal (not a new URL)
21. "See all" for Highlights → Expands/filters within same tab (not a new URL)
22. "See all" for News → Expands/filters within same tab (not a new URL)

### Things that do NOT open new pages
- "View media" button in left column → switches the centre column to the Media tab (same page)
- The 4 main tabs (Standings / Stats / Details / Media) → update URL hash only (`#tab:...`), stay on same page
- "FAVOURITE" button → toggle, same page
- Season dropdown (25/26) → re-loads standings for that season, same page
- Round dropdown in Matches card → navigates within the card
- "By date" / "By round" tabs → within-card toggle
- "Rules" accordion in standings → expands inline
- Standings Tracker team dropdowns → change chart lines inline
- Team of the Week round dropdown → changes which TOTW is shown

---

## PART 2: PAGE-BY-PAGE DETAILED ANALYSIS

---

### 1. MATCH DETAIL PAGE

**Example URL:** `/football/match/manchester-city-crystal-palace/hr#id:15999228`  
**Example match:** Man City vs Crystal Palace — Premier League, Round 31 — 13/05/2026 20:00

**Breadcrumb:** Football › England › Premier League, Round 31 › Manchester City vs Crystal Palace live score, H2H results, standings and prediction

**Match Hero / Header Card** (full-width white card):
- Team names with crests: Man City (left) | 20:00 Today (centre) | Crystal Palace (right)
- Date: 13/05/2026 • 20:00
- Meta row: Premier League badge | Etihad Stadium | Sky Go UK +4 (more TV channels)
- Top-right buttons: FAVOURITE (star), compare icon, share/embed icon

**Left Column — 11 cards in order:**

Card 1 — Odds (Full-time): bet365 branding, odds row showing 1 (1/5) | X (13/2) | 2 (10/1), "Additional odds" link, sign-up bonus CTA.

Card 2 — Media promo: "Explore videos, news, facts, and more from this event." + "View media" button (switches to Media tab).

Card 3 — Fan Polls: Three rotating vote questions — "Who will win?" (1/X/2), "Will both teams score?" (YES/NO), "Who will score first?" (team selectors). Prev/Next arrows navigate between polls.

Card 4 — Prematch standings: Mini standings table showing both teams' current position, last 5 form, and points.

Card 5 — TV channels: Country selector dropdown, then list of broadcasters (Sky Go UK, Sky Sports Premier League, Sky Sports Ultra HD, Sky Sports+ shown for UK, with channel number and subchannel).

Card 6 — Date and time / Match info: Date 13/05/2026 20:00, "Add to calendar" link, Competition (Football, England, Premier League, Round 31), Referee (Stuart Attwell).

Card 7 — Venue: Name: Etihad Stadium, Location: Manchester, England, "See more details" link.

Card 8 — Featured players: "Based on performance in the last match." Shows head-to-head player comparison for J. Doku vs D. Muñoz with spider/radar stat breakdown: ATT (75 vs 55), TEC (88 vs 49), TAC (45 vs 62), DEF (30 vs 69), CRE (values shown).

Card 9 — Sofascore Fantasy promo.  
Card 10 — Gambling disclaimer.  
Card 11 — Ad unit.

**Centre Column — 5 primary tabs:** Lineups | Statistics | Standings | H2H | Media

**Lineups tab content:**
- "Possible lineups" header with "Share lineups" button
- Player filter pills: Performance | Nationality | Age | Market value | Height | Fantasy
- Man City average rating: 5.52 | Crystal Palace average rating: 5.32
- Formation labels: Man City 4-2-3-1 | Crystal Palace 3-4-2-1
- Visual pitch layout with player photos and shirt numbers positioned on pitch
- Man City possible XI: 25 G. Donnarumma; 27 M. Nunes, 15 M. Guéhi, 6 N. Aké, 33 N. O'Reilly; 20 B. Silva, 14 N. González; 42 A. Semenyo, 10 R. Cherki, 11 J. Doku; 9 E. Haaland
- Crystal Palace possible XI: 1 D. Henderson; 26 C. Richards, 5 M. Lacroix, 23 J. Canvot; 2 D. Muñoz, 20 A. Wharton, 18 D. Kamada, 3 T. Mitchell; 7 I. Sarr, 11 B. Johnson; 22 J. Larsen
- Referee: Stuart Attwell | Avg. cards 0.14 (Man City) — 3.49 (Crystal Palace)
- Managers: Pep Guardiola (Man City) | Oliver Glasner (Crystal Palace)
- Injuries & suspensions: Joško Gvardiol (Broken leg), Rodri (Physical discomfort), Abdukodir Khusanov (Doubtful – Knock), Borna Sosa (Muscle), Cheick Doucouré (Knee), Eddie Nketiah (Strain), Evann Guessand (Knee)

---

### 2. TEAM PROFILE PAGE

**Example URL:** `/football/team/manchester-city/17`  
**Title:** Manchester City scores, fixtures, standings and player stats

**Breadcrumb:** Football › England › Premier League › Manchester City scores, fixtures, standings and player stats

**Team Hero Card** (full-width):
- Club crest (large), "Manchester City", "4.2M followers"
- Country flag (England) + coach headshot + "Pep Guardiola, Coach"
- Previous match box: Premier League, 09/05/26 FT, Man City 3–0 Brentford
- Next match box: Premier League, 20:00, Man City – Crystal Palace
- Metadata: Etihad Stadium icon | Premier League icon
- Top-right: COMPARE button | FAVOURITE star

**Left Column — 6 cards:**

Card 1 — Matches (649px): Competition filter dropdown (All). Toggle: List | Calendar. Tabs: Finished | Upcoming. Grouped by competition (Premier League). Each match row: date, status (FT/time), home team, score, away team, result badge (W/D/L), favourite star.

Card 2 — Recent form (232px): "Hover over the columns to see scores." Bar chart of form across the season — green (wins), orange (draws), red (losses), ~20 most recent matches as stacked columns.

Card 3 — Media promo (100px): "Explore videos, news, facts, and more about this team." + "View media" button.

Card 4 — Featured match (226px): Competition label, Man City 20:00 Crystal Palace, countdown timer, bet365 odds.

Card 5 — Sofascore Fantasy promo (96px).  
Card 6 — Gambling disclaimer (32px). Ad unit below.

**Centre Column — 5 primary tabs:** Standings | Statistics | Players | Details | Media

- **Standings:** Competition selector (Premier League, 25/26). Sub-tabs: All | Home | Away. Full 20-team table with Man City row highlighted. Tiebreaker rules accordion. Standings Tracker chart below.
- **Statistics:** Same Player stats table as PL Stats tab — General/Attack/Defense/Passing/Goalkeeping/Detailed filter pills.
- **Players:** Squad list with shirt numbers, positions, ages, nationalities, ratings.
- **Details:** Titles, newcomers, competition facts, lower division link.
- **Media:** Highlights (video thumbnails) + News articles for this team.

---

### 3. PLAYER PROFILE PAGE

**Example URL:** `/football/player/bruno-fernandes/288205`  
**Title:** Bruno Fernandes stats and ratings

**Breadcrumb:** Football › England › Premier League › Bruno Fernandes stats, ratings and goals

**Player Hero Card** (full-width):
- Player headshot (circular photo), "Bruno Fernandes", "294k followers"
- Club badge + "Manchester United", "Contract until: 30 Jun 2027"
- Previous match: Premier League, 09/05/26 FT, Sunderland 0–0 Man Utd
- Next match: Premier League, 17/05/26 12:30, Man Utd vs Forest
- Bio row: Portugal flag | 8 September 1994 (31) | Midfielder | 179 cm | Right (foot) | Number 8
- Top-right: COMPARE button | FAVOURITE star | EMBED WIDGET button

**Left Column — 9 cards:**

Card 1 — Player value (108px): "MARKET VALUE 37M €" | Interactive higher/lower guess buttons.

Card 2 — Summary last 12 months (292px): Monthly average rating bar chart Jul 2025–May 2026. Values: Jul 7.1/7.8, Sep 7.1/7.4, Nov 8.0/8.1, Jan 7.5/7.5, Mar 7.6/7.5, May 7.4.

Card 3 — Media promo (100px): "Explore videos, news, facts, and more about this player." + "View media".

Card 4 — Attribute Overview (476px): Pentagon/spider chart — ATT (79), TEC (78), TAC (67), DEF (43), CRE (98). Timeline slider May 2023–May 2026 showing attribute evolution. "Search to compare players" field below.

Card 5 — Player positions (248px): Pitch diagram showing AM/MC/DM position zones. Strengths: Playmaking, Direct free kicks, Consistency. Weaknesses: None outstanding.

Card 6 — Transfer history (770px): Timeline chart of market value and transfer fees. History: youth → '13 → '17 → '20 (€65M to Man Utd). Current market value €37M, highest fee €65M. Historical clubs listed with fees.

Card 7 — National team (148px): Portugal flag, Debut: 10 Nov 2017, Appearances: 87, Goals: 28.

Card 8 — Sofascore Fantasy promo.  
Card 9 — Ad unit.

**Centre Column — 5 primary tabs:** Matches | Season | Career | Fantasy | Media

- **Matches (active):** Competition filter dropdown. Columns: Date | Status | Home | Score | Away | Result (W/D/L) | Minutes | Goals | Yellow cards | Assists | Rating. Every match in reverse chronological order with per-match individual stats.
- **Season:** Aggregate season statistics across all competitions.
- **Career:** Full career statistics year by year, by club, by competition.
- **Fantasy:** Fantasy-specific stats and points history.
- **Media:** Highlights and news articles related to this player.

---

### 4. SOFASCORE NEWS ARTICLE PAGE

**Example URL:** `/news/david-raya-tops-premier-league-clean-sheets-for-a-third-straight-season`  
**Title:** David Raya leads EPL clean sheets for third straight season

**Header:** Separate "Sofascore News" brand header (blue bar). Left: Sofascore News logo. Centre: "Search news..." search field. Right: "Sofascore app" link | Settings icon. No sport nav bar.

**Ad banner:** Full-width ad slot below header.

**Breadcrumb:** Sofascore News › [Article title]

**Two-column layout:**

Left column (366px, ~1/3 width): "The latest stories" panel — vertical list of recent news articles across all sports, each with thumbnail image, headline, and date. Items: How fan culture differs between host countries, Managing Your World Cup Travel Cost, New York Mets beat Tigers 10-2, Pistons vs Cavaliers Game 5, Clay-court heavyweights: Ruud vs Khachanov in Rome, Rome QF: Swiatek and Pegula, RC Lens vs PSG preview. Each is a clickable link to its own article page.

Right column (731px, ~2/3 width): Article content.
- Author byline: "Written by David Walker • 12 May 2026"
- H1 headline: "David Raya tops Premier League clean sheets for a third straight season"
- Lead hero image (full-width within column, ~660px tall photo)
- Article body in prose paragraphs with bold sub-headings
- Inline data tables / stat charts embedded within article body
- Second image with caption
- No comment section or related articles rail visible

**Footer:** Shared Sofascore footer (About paragraph, link columns, latest stories, utility bar).

---

### 5. SOFASCORE FANTASY PAGE

**URL:** `/fantasy`  
**Title:** Football Live Score – Sofascore (Fantasy sign-in)

**Header:** Fantasy-specific brand header (blue). Left: Fantasy shield logo + "Fantasy" wordmark. Centre: "← Back to Sofascore app" button. Right: SIGN IN button | Help icon | Settings icon.

**Single-panel layout (login-gate only):**

Left panel (white card): "A world of stats at your fingertips—for free." Three SSO sign-in options: Sign in with Google | Sign in with Facebook | Sign in with Apple. Legal note: "By signing in, you agree to our Terms & Conditions and Privacy Policy."

Right panel: Full-height action photo of a football player shooting, with "Football ⚽" text overlay. No further content visible without signing in.

---

### 6. ANOTHER TOURNAMENT PAGE (CHAMPIONSHIP)

**URL:** `/football/tournament/england/championship/18`  
**Title:** Championship table, schedule & stats

Structurally identical to the Premier League 2025/2026 page. Same three-section layout: tournament hero, left column with match/editorial cards, centre column with tabs.

**Key differences from the PL page:**

Tournament hero: Championship logo (blue/gold dot-pattern crest), "Championship", "128k followers", England flag, 25/26 dropdown. Season timeline: 8 Aug → 23 May.

Centre column tabs: Standings | **Knockout** | Stats | Details | Media — Championship has an additional "Knockout" tab (playoff bracket) not present on the PL page (pure league format).

Left column: Featured match (Southampton vs Middlesbrough, Agg. 2–1, after extra time), Matches card.

Standings: 46 games played per team (Championship season length). Top teams: 1 Coventry 95pts, 2 Ipswich 84pts, 3 Millwall 83pts.

---

## SUMMARY TABLE

| Click source | Destination page type | Key distinguishing feature |
|---|---|---|
| Any match row | Match detail page | Lineups/Stats/Standings/H2H/Media tabs; left col has odds, polls, TV, venue, featured players |
| Any team row (standings) | Team profile page | Matches + Recent form in left col; Players tab in centre |
| Any player (POTS / TOTW / Stats table) | Player profile page | Market value, attribute radar, transfer history in left col; Match/Season/Career tabs |
| News article (Media tab) | Sofascore News article page | Two-column: latest stories sidebar + article body; separate News brand header |
| "Play now" (Fantasy) | Fantasy sign-in page | Login gate only; Google/Facebook/Apple SSO |
| "Championship" relegation link | Championship tournament page | Identical layout to PL page but with extra Knockout tab |
| Bet365 odds links | External: bet365.com | Leaves Sofascore entirely |

---

*Analysis conducted on 13 May 2026. Viewport: 1133px CSS width (desktop layout). URL: https://www.sofascore.com/football/tournament/england/premier-league/17*
