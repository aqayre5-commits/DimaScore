# Arsenal — Sofascore Team Page: Full Structure, Content & Navigation Analysis

**URL:** https://www.sofascore.com/football/team/arsenal/42
**Date of analysis:** 13 May 2026
**Viewport:** 1133px CSS width — desktop two-column layout
**Page height:** 4342px scroll

---

## 1. GLOBAL HEADER

Fixed at the top of every page, identical site-wide.

**WC26 Countdown Ticker (topmost bar):** A dark strip showing a live countdown to the WC26 opening match (format: 29D:10H:57M:56S) on the left. The rest of the strip is a horizontally scrolling carousel of group pills — Group A through Group L — each pill showing the group label plus small flag icons of the four member teams. Each pill links to the WC26 Standings tab: /football/tournament/world/world-championship/16#id:58210,tab:standings.

**Main Navigation Bar:** White background bar containing:
- Sofascore wordmark logo (top-left) — links to sofascore.com root (/)
- Universal search box (centre): placeholder "Search matches, competitions, teams, players..."
- SIGN IN button (top-right, outlined)
- Star icon (Favourites), lightning bolt icon (Live), gear icon (Settings)

**Sport Navigation Strip:** Icon + label tabs with live-count badges:
Trending | WC26 (Beta badge) | Football (88) | Tennis (29) | Cricket | Rugby | Basketball (16) | Darts | American football | MMA | Motorsport | More (…)
Right side: NEWS | FANTASY | TORNEO

**Full-Width Ad Banner:** A leaderboard advertisement unit (~90px height) spanning the entire page width below the navigation. Rotates with various sponsors (e.g. bet365, Starlink).

---

## 2. BREADCRUMB NAVIGATION

Sits below the ad banner, above the team profile header.

**Path:** Football › England › Premier League › Arsenal scores, fixtures, standings and player stats

Each segment is a link:
- Football → https://www.sofascore.com/ (root football page)
- England → https://www.sofascore.com/football/england
- Premier League → https://www.sofascore.com/football/tournament/england/premier-league/17
- Final segment (current page title) is plain text, not a link

---

## 3. TEAM PROFILE HEADER

A white rounded card spanning the full content width (~1097px). Contains two logical halves.

### Left half — Team identity

- **Arsenal crest:** Large circular badge (~120px diameter). Not a link.
- **Team name:** "Arsenal" in large bold sans-serif. Not a link.
- **Follower count:** "3.6M followers" in blue text immediately right of the name.
- **Country:** England flag icon + "England" text label. Links to: /football/england
- **Coach:** Mikel Arteta headshot (small circular photo) + "Mikel Arteta" name + "Coach" subtitle. The entire item links to: /football/manager/mikel-arteta/794075
- **Subline row:** Stadium icon + "Emirates Stadium" (links to /venue/england/emirates-stadium/624) | PL badge + "Premier League" (links to /football/tournament/england/premier-league/17)
- **COMPARE button:** Blue pill button with comparison icon. Links to /football/team/compare?ids=42
- **FAVOURITE star button (☆):** Top-right of the card. Toggles team follow/unfollow. No page navigation.

### Right half — Match snapshot cards

**Previous match card:**
- Competition badge + "Premier League" label (links to /football/tournament/england/premier-league/17#id:76986)
- Date: 10/05/26 | Status: FT
- Home: West Ham crest + "West Ham" | Score: 0–1 | Away: Arsenal crest + "Arsenal"
- Entire card links to: /football/match/arsenal-west-ham-united/MR#id:14023942

**Next match card:**
- Competition badge + "Premier League" label
- Date: 18/05/26 | Time: 20:00
- Home: Arsenal crest + "Arsenal" | Away: Burnley crest + "Burnley"
- Entire card links to: /football/match/arsenal-burnley/gsR#id:14023950

---

## 4. STICKY MINI-HEADER (on scroll)

When the user scrolls past the profile header, a sticky bar appears fixed at the top of the viewport (below the global navigation). It contains:
- Arsenal crest (small)
- "Arsenal" name in blue
- Star icon (☆ add to favourites)
- "Add Arsenal to favorites" label text
- × dismiss button (removes the bar)

This bar does not contain navigation links — it is a contextual UX element only.

---

## 5. PAGE LAYOUT

At 1133px CSS width the page renders as two columns with no right ad rail:
- **Left column:** ~430px wide — matches list and contextual promo cards
- **Right column:** ~700px wide — five-tab content area
- **Right ad rail:** Hidden at this viewport (appears at ≥1344px)

---

## 6. LEFT COLUMN

### 6.1 Matches Card

**Header row:** "Matches" label (left) | Competition filter dropdown (right, default: "All")

**Competition filter dropdown options (when opened):**
All | FA Cup | Premier League | Emirates Cup | EFL Cup | UEFA Champions League | Club Friendly Games

**View toggle:** List (default, dark pill) | Calendar (light pill)

#### List view

**Status filter tabs:** Finished (default active) | Upcoming
**Season navigation arrows:** ◄ ► (navigate forward/backward through seasons/date ranges)

**Finished — match list** (5 matches visible, grouped by competition):

Premier League
- 10/05/26 FT | West Ham 0–1 Arsenal | W (green badge) → /football/match/arsenal-west-ham-united/MR#id:14023942

UEFA Champions League
- 05/05/26 FT | Arsenal 1–0 Atl. Madrid | W → /football/match/atletico-madrid-arsenal/RsLgb#id:15632635

Premier League
- 02/05/26 FT | Arsenal 3–0 Fulham | W → /football/match/fulham-arsenal/RsT#id:14023931

UEFA Champions League
- 29/04/26 FT | Atl. Madrid 1–1 Arsenal | D (grey badge) → /football/match/atletico-madrid-arsenal/RsLgb#id:15632633

Premier League
- 25/04/26 FT | Arsenal 1–0 Newcastle | W → /football/match/arsenal-newcastle-united/Ardc#id:14025045

Each match row: competition badge (left) | date/status | home team crest + name | score | away team crest + name | result badge (W/D/L). Star icon (☆) at row right = add match to favourites (no navigation). Rows with a goal arrow icon (↑) indicate scoreline details expandable.

**Upcoming — match list** (3 matches visible):

Premier League
- 18/05/26 20:00 | Arsenal vs Burnley → /football/match/arsenal-burnley/gsR#id:14023950
- 24/05/26 16:00 | Crystal Palace vs Arsenal → /football/match/arsenal-crystal-palace/hsR

UEFA Champions League
- 30/05/26 17:00 | PSG vs Arsenal → /football/match/paris-saint-germain-arsenal/RsUH

#### Calendar view

Replaces list with a monthly calendar grid. Default shows May 2026.
- Month/year dropdown selector (e.g. "May 2026 ▾")
- ◄ ► arrows navigate months
- Match days show: competition badge icon + opponent crest + score/time (e.g. Sat 2 = Fulham, 3-0; Mon 10 = West Ham, 0-1)
- Non-match days are empty cells
- Clicking a match day cell navigates to that match detail page

### 6.2 Recent Form Chart

**Header:** "Recent form" | ⓘ information tooltip button (right)
**Subtitle:** "Hover over the columns to see scores"

**Opponent strip:** A horizontal row of small opponent club crest icons (~15px each). Shows the last ~12 opponents in chronological order (left = oldest, right = most recent). These are not links.

**Bar chart:** One vertical bar per match. Bar height encodes match quality/performance score.
- Green bar = win
- Red bar = loss
- Grey/beige bar = draw
Hovering a bar reveals the match score tooltip. Bars are not navigable links.

### 6.3 View Media Promo Card

A card with white background and Arsenal crest on the right side. Contains:
- Text: "Explore videos, news, facts, and more about this team."
- **"View media" button** (blue, with media/play icon) → navigates in-page to: /football/team/arsenal/42#tab:media

### 6.4 Featured Match Card

**Header:** "Featured" | Competition + round label: "England, Premier League, Round 37" | right arrow (→) linking to the PL Round 37 fixture page
- Arsenal crest | -- (score not yet known) | Burnley crest
- Team names below crests
- **Betting odds strip:** Full-time odds row: 1 (9/100) | X (10/1) | 2 (18/1) with up/down directional arrows indicating odds movement — bet365 branding
- ◄ ► arrows (carousel navigation to browse other featured matches)
- Clicking the match card navigates to: /football/match/arsenal-burnley/gsR#id:14023950

### 6.5 Sofascore Fantasy Promo Card

- Thumbnail image (fantasy UI/players graphic, left)
- Title: "Sofascore Fantasy"
- Tagline: "Own your team. Rule the league."
- **"Play now ›" link** → /fantasy
- × dismiss button (removes card from view, no navigation)

### 6.6 Responsibility Notice + Ad Unit

- Text: "Gamble responsibly 18+, www.begambleaware.org"
- Display advertisement unit below (e.g. bet365 — rotates)

---

## 7. RIGHT COLUMN — TAB NAVIGATION

Five tabs rendered as an underline tab bar:
**Standings** (default) | Statistics | Players | Details | Media

Each tab URL-addressable via hash:
- Standings → #tab:standings
- Statistics → #tab:statistics
- Players → #tab:players
- Details → #tab:details
- Media → #tab:media

---

## 8. TAB 1: STANDINGS

### Selectors (row below tab bar)
- Competition dropdown: "Premier League ▾" — changes which competition's table is shown
- Season dropdown: "25/26 ▾" — switches to previous seasons

### View filter pills
All (active) | Home | Away
Filters the table to show all matches, home results only, or away results only.

### Embed button (</>)
Top-right of content area. Opens an embed-code modal for the standings table widget. No page navigation.

### Standings Table

Full 20-team Premier League 2025/26 table (36 games played as of analysis date).

Columns: # (position) | Team (crest + name, each links to team page) | P | W | D | L | DIFF | GLS | Last 5 | PTS

Arsenal's row (#1) is highlighted in blue. Man City row shows a live dot (●) indicating a match in progress.
Crystal Palace row shows goals in red (14) indicating red card.

Full table:
1.  Arsenal         36 24  7  5  +42  68:26  [L L W W W]  79
2.  Man City        36 23  8  5  +42  74:32  [W W W D W]  77
3.  Man Utd         36 18 11  7  +15  63:48  [L W W W D]  65
4.  Liverpool       36 17  8 11  +12  60:48  [W W W L D]  59
5.  Aston Villa     36 17  8 11   +4  50:46  [D W L L D]  59
6.  Bournemouth     36 13 16  7   +4  56:52  [W W D W W]  55
7.  Brighton        36 14 11 11  +10  52:42  [W D W L W]  53
8.  Brentford       36 14  9 13   +3  52:49  [D D L W L]  51
9.  Chelsea         36 13 10 13   +6  55:49  [L L L L D]  49
10. Everton         36 13 10 13    0  46:46  [D L L D D]  49
11. Fulham          36 14  6 16   -6  44:50  [L D W L L]  48
12. Sunderland      36 12 12 12   -9  37:46  [W L L D D]  48
13. Newcastle       36 13  7 16   -2  50:52  [L L L W D]  46
14. Leeds           36 10 14 12   -5  48:53  [W W D W D]  44
15. Crystal Palace  36 11 11 14   -8  38:46  [W D L L D]  44
16. Forest          36 11 10 15   -2  45:47  [D W W W D]  43
17. Tottenham       36  9 11 16   -9  46:55  [L D W W D]  38
18. West Ham        36  9  9 18  -20  42:62  [W D W L L]  36
19. Burnley         36  4  9 23  -36  37:73  [L L L L D]  21
20. Wolves          36  3  9 24  -41  25:66  [L L L D L]  18

Last 5 cells are colour-coded: W = green, D = grey, L = red.

### Rules Accordion
Expandable section (chevron toggle) below the table. Shows:
- Champions League qualification (green dot) — positions 1–4
- UEFA Europa League (orange dot) — position 5
- Conference League Qualification (light orange dot) — position 6
- Relegation (red dot) — positions 18–20
- Tiebreaker rules: 1. Goal difference, 2. Goals scored, 3. H2H

### Standings Tracker

A second section below the rules accordion. Header: "Standings tracker" + ⓘ info button.
A line chart showing Arsenal's league position week-by-week across the season.
- Y-axis: positions 1–20 (inverted: 1 at top, 20 at bottom). Gridlines at 1, 5, 10, 15, 20.
- X-axis: Gameweeks 1–31+. Numbers along bottom.
- Arsenal's line (blue/navy) shows trajectory from early season through current GW31.
- Week navigation: ◄ current week label (e.g. "31 Week (01/05/26 – 08/05/26)") ► arrows.
- Team selector dropdown: "Arsenal ▾" — switch to view another team's position tracker.
- **COMPARE button** (blue, right of selector) — opens the team comparison page with Arsenal pre-loaded: /football/team/compare?ids=42

---

## 9. TAB 2: STATISTICS

### Selectors
Competition dropdown: "Premier League ▾" | Season dropdown: "25/26 ▾"

### Summary Row (5 metric tiles)
SOFASCORE RATING: 5.45 (ⓘ) | MATCHES: 36 | GOALS SCORED: 68 | GOALS CONCEDED: 26 | ASSISTS: 48

### Attacking (left column)
Goals per game: 1.9 | Penalty goals: 4/4 | Free kick goals: 0/8
Goals from inside the box: 54/382 | Goals from outside the box: 10/141
Left-footed goals: 14 | Right-footed goals: 35 | Headed goals: 15
Big chances per game: 3 | Big chances missed per game: 2
Total shots per game: 14.5 | Shots on target per game: 4.9
Shots off target per game: 5.2 | Blocked shots per game: 4.4
Succ. dribbles per game: 7.1 | Corners per game: 5.8
Free kicks per game: 10.7 | Hit woodwork: 13 | Counter attacks: 35

### Passes (right column)
Ball possession: 55.9% | Accurate passes: 394 (84%)
Acc. own half: 184 (91.9%) | Acc. opposition half: 210 (78.2%)
Acc. long balls: 13.1 (44.7%) | Acc. crosses: 4.3 (24%)

### Defending (left column)
Clean sheets: 18 | Goals conceded per game: 0.7
Tackles per game: 16.1 | Interceptions per game: 7.3
Clearances per game: 23.9 | Saves per game: 1.7
Balls recovered per game: 45.2 | Errors leading to shot: 21
Errors leading to goal: 5 | Penalties committed: 0
Penalty goals conceded: 0 | Clearance off line: 3
Last man tackle: 12

### Other (right column)
Duels won per game: 49.6 (51.5%) | Ground duels won: 33.6 (51.8%)
Aerial duels won: 16 (50.9%) | Possession lost per game: 125.8
Throw-ins per game: 17.1 | Goal kicks per game: 5.6
Offsides per game: 1.7 | Fouls per game: 10.3
Yellow cards per game: 1.4 | Red cards: 0

---

## 10. TAB 3: PLAYERS

### Sub-tabs (toggle):  Squad | Top players

---

### 10.1 Squad sub-tab

**Category pills (switch column data):** General (default) | Market value | Previous club | Contract

#### General columns: Nationality | Height | Date of Birth | Age
#### Market value columns: Market value (in € millions)
#### Previous club columns: Previous club (name + badge)
#### Contract columns: Joined (date) | Expires (date)

Squad listed by position group. Each row: squad number badge | player headshot | player name + position abbreviation | [column-specific data]. Each row links to the player's profile page.

**Forwards (6):**
14. Viktor Gyökeres (ST) — SWE — 187cm — 04/06/1998 — 27 yrs | MV: 61M€ | Joined: 26 Jul 2025 | Exp: 30 Jun 2030
7.  Bukayo Saka (RW) — ENG — 178cm — 05/09/2001 — 24 yrs | MV: 126M€ | Joined: 1 Jul 2019 | Exp: 30 Jun 2030
9.  Gabriel Jesus (ST) — BRA — 175cm — 03/04/1997 — 29 yrs | MV: 21M€ | Joined: 4 Jul 2022 | Exp: 30 Jun 2027
11. Gabriel Martinelli (LW) — BRA — 180cm — 18/06/2001 — 24 yrs | MV: 42M€ | Joined: 2 Jul 2019 | Exp: 30 Jun 2027
29. Kai Havertz (ST,MC) — GER — 193cm — 11/06/1999 — 26 yrs | MV: 48M€ | Joined: 1 Jul 2023 | Exp: 30 Jun 2028
19. Leandro Trossard (LW,ST) — BEL — 172cm — 04/12/1994 — 31 yrs | MV: 21M€ | Joined: 20 Jan 2023 | Exp: 30 Jun 2027

**Midfielders (8):**
8.  Martin Ødegaard (MC) — NOR — 178cm — 17/12/1998 — 27 yrs
41. Declan Rice (MC,DM) — ENG — 188cm — 14/01/1999 — 27 yrs
10. Eberechi Eze (AM) — ENG — 178cm — 29/06/1998 — 27 yrs
20. Noni Madueke (RW) — ENG — 182cm — 10/03/2002 — 24 yrs
23. Mikel Merino (MC) [Doubtful — Foot] — ESP — 188cm — 22/06/1996 — 29 yrs
56. Max Dowman (MC) — ENG — 183cm — 31/12/2009 — 16 yrs
36. Martín Zubimendi (MC,DM) — ESP — 180cm — 02/02/1999 — 27 yrs
16. Christian Nørgaard (MC,DM) — DEN — 185cm — 10/03/1994 — 32 yrs

**Defenders (7):**
6.  Gabriel Magalhães (CB) — BRA
5.  William Saliba (CB) — FRA
3.  Piero Hincapié (LB) — ECU
12. Jurriën Timber (RB,CB) — NED
33. Riccardo Calafiori (CB,LB) — ITA
49. Cristhian Mosquera (CB) — COL
2.  Ben White (RB) — ENG

**Goalkeepers (3):**
22. David Raya (GK) — ESP
13. Kepa Arrizabalaga (GK) — ESP
Tommy Setford (GK)

Player injury status is shown inline (e.g. "Doubtful — Foot" next to Mikel Merino).

---

### 10.2 Top players sub-tab

**Selectors:** Competition dropdown: "Premier League ▾" | Season dropdown: "25/26 ▾" | Appearance threshold: "50% ▾" (minimum appearance percentage for inclusion)

Displays multiple two-column leaderboard card pairs, each showing top 3 players (paginated 1-3 of N with ◄ ► navigation). Each player entry shows headshot, name, position badge (Arsenal crest), stat value. Each player is a link to their profile.

**Leaderboard cards:**
- Average Sofascore Rating: 1. Declan Rice (Mid) 5.93 | 2. Gabriel Magalhães (Def) 5.79 | 3. Bukayo Saka (Fwd) 5.73 — 1-3 of 18
- Goals: 1. Viktor Gyökeres (Fwd) 14 | 2. Bukayo Saka (Fwd) 7 | 3. Eberechi Eze (Mid) 7 — 1-3 of 18
- Expected goals (xG) scored: 1. Gyökeres 12.23 (14) | 2. Saka 7.36 (7) | 3. Trossard 5.40 (6) — 1-3 of 23
- Assists: 1. Ødegaard 6 | 2. Trossard 6 | 3. Rice 5 — 1-3 of 16
- Expected assists (xA): 1. Rice 6.91 (5) | 2. Saka 6.87 (4) | 3. Ødegaard 3.58 (6) — 1-3 of 24
- Goals + assists: 1. Gyökeres 15 | 2. Trossard 12 | 3. Saka 11 — 1-3 of 19
- Penalty goals: 1. Gyökeres 3/3 | 2. Saka 1/1
- Free kick goals: 1. Rice 0/5 | 2. Saka 0/2 | 3. Eze 0/1
- Scoring frequency (minutes): 1. Gyökeres 159 | 2. Merino 252 | 3. Eze...
- Shots on target per game: (William Saliba leads — defensive metrics)
- Successful dribbles: (Saka leads)
- Yellow cards | Red cards

---

## 11. TAB 4: DETAILS

### Team info (4 stat tiles, top row)
Total players: 25 | Average player age: 25.7 yrs | Foreign players: 17 (donut chart) | National team players: 17 (donut chart)

### Titles section
Sub-tabs: Major trophies | All trophies (toggle)
Trophy grid cards (icon + count + competition name):
- 13 × Premier League
- 14 × FA Cup
- 2 × EFL Cup
- 1 × Cup Winners Cup
- 1 × Inter Cities Fairs Cup

### Competitions section
Header: "Competitions"
Cards grid (competition badge + name), each links to that tournament page:
- UEFA Champions League → /football/tournament/europe/uefa-champions-league/7
- Premier League → /football/tournament/england/premier-league/17
- FA Cup → /football/tournament/england/fa-cup/...
- EFL Cup → /football/tournament/england/efl-cup/...
- Emirates Cup → /football/tournament/england/emirates-cup/...

### Latest transfers section
Header: "Latest transfers"
Two-column layout: Arrivals (17 total) | Departures (16 total)
Each entry: player headshot | player name | transfer type + fee | date | source/destination club crest (badge links to that club's team page)
Paginated: "1-5 of 17" with ◄ ► arrows

**Arrivals (first 5 shown):**
- Oleksandr Zinchenko — End of loan — 31 Jan (from Nottm Forest)
- Piero Hincapié — Loan — 1 Sept 2025 (from Bayer Leverkusen)
- Eberechi Eze — Transfer 69.3M€ — 23 Aug 2025 (from Crystal Palace)
- Viktor Gyökeres — Transfer 66.9M€ — 26 Jul 2025 (from Sporting CP)
- Cristhian Mosquera — Transfer 15M€ — 24 Jul 2025 (from Valencia)

**Departures (first 5 shown):**
- Oleksandr Zinchenko — Transfer 1.5M€ — 1 Feb (to Nottm Forest)
- Ethan Nwaneri — Loan — 23 Jan (to Inter Milan)
- Reiss Nelson — Loan — 1 Sept 2025
- Oleksandr Zinchenko — Loan — 1 Sept 2025
- Albert Sambi Lokonga — Transfer 300K€ — 1 Sept 2025 (to Chelsea)

### Info section (two columns)

**Left — Club info:**
- Coach: "Mikel Arteta ›" — links to /football/manager/mikel-arteta/794075
- Founded: 1 Oct 1886
- Country: England flag icon

**Right — Venue info:**
- Name: "Emirates Stadium ›" — links to /venue/england/emirates-stadium/624
- Capacity: 60,704
- City: London, England

### About Arsenal (SEO text block)

Long-form text below the info section. Describes Arsenal on Sofascore, mentions next match (Arsenal vs Burnley — linked: /football/match/arsenal-burnley/gsR#id:14023950), previous match result, current players list (Gyökeres, Saka, etc.), and general Sofascore live score features.

---

## 12. TAB 5: MEDIA

### Sub-tabs: All | Highlights | Social | News

**All:** Combined feed of all media content (videos + articles)

**Highlights:**
Video thumbnail grid (2 columns). Each card:
- Full-width thumbnail image with ▶ play button overlay
- Video title (all-caps, e.g. "QUICK COUNTER ATTACK GOAL VS CRYSTAL P...")
- Short description text (first line of caption)
- Clicking opens the video (YouTube outbound link or inline player)

**Social:**
Social media posts related to Arsenal. Embedded tweet/post format.

**News:**
News article grid. "See all ›" link (top-right) → /news?team=arsenal or similar filtered news page
Each card: thumbnail | headline | date
Clicking navigates to the individual news article at /news/[slug]

---

## 13. FOOTER (Shared Site-Wide)

Three grouped columns of navigation links:
- **Football:** UEFA Champions League, FIFA World Cup, Premier League, Serie A, LaLiga, Bundesliga, FIFA Rankings, UEFA Rankings
- **Basketball:** NBA, Euroleague, Stoiximan GBL, Liga ACB, Lega A Basket, Turkish Basketball
- **Other sports:** Tennis, Cricket, Rugby, American football, MMA, Motorsport

Below columns: App Store / Google Play download buttons | Language selector | Privacy Policy | Cookie Policy | Accessibility Policy | Terms & Conditions | Copyright notice (© Sofascore)

---

## 14. COMPLETE LINK INVENTORY

All links on the Arsenal team page (195 total), categorised below.

### 14.1 Match links (13 unique matches)

**Finished (via left column Matches list and header):**
- West Ham 0–1 Arsenal (10/05/26, PL R36) → /football/match/arsenal-west-ham-united/MR#id:14023942
- Arsenal 1–0 Atl. Madrid (05/05/26, UCL SF) → /football/match/atletico-madrid-arsenal/RsLgb#id:15632635
- Arsenal 3–0 Fulham (02/05/26, PL R35) → /football/match/fulham-arsenal/RsT#id:14023931
- Atl. Madrid 1–1 Arsenal (29/04/26, UCL SF 1st leg) → /football/match/atletico-madrid-arsenal/RsLgb#id:15632633
- Arsenal 1–0 Newcastle (25/04/26, PL R34) → /football/match/arsenal-newcastle-united/Ardc#id:14025045

**Upcoming:**
- Arsenal vs Burnley (18/05/26, PL R37) → /football/match/arsenal-burnley/gsR#id:14023950
- Crystal Palace vs Arsenal (24/05/26, PL R38) → /football/match/arsenal-crystal-palace/hsR
- PSG vs Arsenal (30/05/26, UCL Final) → /football/match/paris-saint-germain-arsenal/RsUH

**Via Recent form chart opponents (in bar chart):** Additional match links embedded in opponent crest icons — Southampton, Sporting CP, Bournemouth, Arsenal vs Man City, Atl. Madrid, Fulham, etc.

### 14.2 Team links (21 unique teams, from standings table)

All 20 PL teams (via Standings table rows) + Compare link:
- COMPARE (Arsenal) → /football/team/compare?ids=42
- Arsenal (self) → /football/team/arsenal/42
- Man City → /football/team/manchester-city/17
- Man Utd → /football/team/manchester-united/35
- Liverpool → /football/team/liverpool/44
- Aston Villa → /football/team/aston-villa/40
- Bournemouth → /football/team/bournemouth/[id]
- Brighton → /football/team/brighton-hove-albion/[id]
- Brentford → /football/team/brentford/[id]
- Chelsea → /football/team/chelsea/38
- Everton → /football/team/everton/[id]
- Fulham → /football/team/fulham/[id]
- Sunderland → /football/team/sunderland/[id]
- Newcastle → /football/team/newcastle-united/[id]
- Leeds → /football/team/leeds-united/[id]
- Crystal Palace → /football/team/crystal-palace/[id]
- Forest → /football/team/nottingham-forest/[id]
- Tottenham → /football/team/tottenham-hotspur/[id]
- West Ham → /football/team/west-ham-united/[id]
- Burnley → /football/team/burnley/[id]
- Wolves → /football/team/wolverhampton-wanderers/[id]

### 14.3 Player links (squad roster in Players tab)

**Format:** /football/player/[name]/[id]
- Viktor Gyökeres → /football/player/viktor-gyokeres/804508
- Bukayo Saka → /football/player/bukayo-saka/934235
- Gabriel Jesus → /football/player/gabriel-jesus/794839
- Gabriel Martinelli → /football/player/gabriel-martinelli/922573
- Kai Havertz → /football/player/kai-havertz/836705
- Leandro Trossard → /football/player/leandro-trossard/135666
- Martin Ødegaard → /football/player/martin-degaard/547410
- Declan Rice → /football/player/declan-rice/856714
- Eberechi Eze → /football/player/eberechi-eze/864921
- Noni Madueke → /football/player/noni-madueke/966547
- Mikel Merino → /football/player/mikel-merino/592010
- Martín Zubimendi → /football/player/martin-zubimendi/[id]
- Christian Nørgaard → /football/player/christian-norgaard/[id]
- Max Dowman → /football/player/max-dowman/[id]
- Gabriel Magalhães → /football/player/gabriel-magalhaes/869792
- William Saliba → /football/player/william-saliba/941168
- Jurriën Timber → /football/player/jurrien-timber/[id]
- Piero Hincapié → /football/player/piero-hincapie/[id]
- Riccardo Calafiori → /football/player/riccardo-calafiori/[id]
- Cristhian Mosquera → /football/player/cristhian-mosquera/[id]
- Ben White → /football/player/ben-white/[id]
- David Raya → /football/player/david-raya/[id]
- Kepa Arrizabalaga → /football/player/kepa-arrizabalaga/[id]
- Tommy Setford → /football/player/tommy-setford/[id]

### 14.4 News article links (8 links, from footer "Latest stories" widget)

**Format:** /news/[slug]
- How fan culture differs between host countries → /news/how-fan-culture-differs-between-host-countries
- Managing Your World Cup Travel Cost → /news/managing-your-world-cup-travel-cost-how-fans-plan-multi-country-trips
- New York Mets beat Tigers 10-2 → /news/new-york-mets-beat-tigers-10-2-at-citi-field-as-middle-innings-explode
- Pistons vs Cavaliers Game 5 → /news/pistons-vs-cavaliers-game-5-odds-trends-key-stats
- Clay-court heavyweights: Ruud vs Khachanov → /news/clay-court-heavyweights-collide-ruud-vs-khachanov-in-rome
- Rome QF: Swiatek and Pegula → /news/rome-qf-spotlight-swiatek-and-pegula-clash-for-a-semifinal-place
- RC Lens vs PSG preview → /news/rc-lens-vs-psg-preview-possession-kings-visit-a-high-energy-bollaert
- (+ 1 more from footer ticker)

### 14.5 Tournament/competition links (via breadcrumb, tab nav, competition cards, footer)

- Premier League → /football/tournament/england/premier-league/17
- UEFA Champions League → /football/tournament/europe/uefa-champions-league/7
- FA Cup → /football/tournament/england/fa-cup/[id]
- EFL Cup → /football/tournament/england/efl-cup/[id]
- Emirates Cup → /football/tournament/england/emirates-cup/[id]
- WC26 → /football/tournament/world/world-championship/16 (via ticker)
- All 12 WC26 group links → /football/tournament/world/world-championship/16#id:58210,tab:standings (via ticker)
- Multiple footer football/basketball/other sport tournament links

### 14.6 Unique destination page links (non-match, non-team, non-player, non-news)

- Manager page: Mikel Arteta → /football/manager/mikel-arteta/794075
- Venue page: Emirates Stadium → /venue/england/emirates-stadium/624
- Country/region page: England → /football/england
- Compare tool: → /football/team/compare?ids=42 (via COMPARE button and Standings Tracker)
- Fantasy: → /fantasy (via Sofascore Fantasy promo card "Play now")
- NEWS section: → /news (via global nav)
- FIFA Rankings: → /football/rankings/fifa (via footer)
- UEFA Rankings: → /football/rankings/uefa (via footer)

---

## 15. NON-NAVIGATING INTERACTIVE ELEMENTS

The following elements are interactive but do not cause page navigation:

- **FAVOURITE (☆) button** in profile header — toggles team follow status in user account
- **Sticky mini-header × dismiss** — removes the scroll-triggered sticky bar
- **Competition filter dropdown** in Matches card — reloads match list in-place
- **List / Calendar toggle** — switches match display mode in-place
- **Finished / Upcoming toggle** — filters match list in-place
- **◄ ► season arrows** in Matches list — paginates match history in-place
- **Recent form chart bars (hover)** — tooltip with score, no link
- **Opponent crest strip** in Recent form — visual only, not navigable
- **All / Home / Away pills** in Standings — filter table in-place
- **Standings embed button (</>)** — opens embed code modal
- **Competition/season dropdowns** in Statistics and Players tabs — reload data in-place
- **Squad category pills** (General/Market value/Previous club/Contract) — switch column data in-place
- **Squad / Top players toggle** — switch sub-view in-place
- **Appearance % threshold dropdown** in Top players — filter in-place
- **Leaderboard ◄ ► pagination** in Top players — page through players in-place
- **Major trophies / All trophies toggle** in Details — switch trophy display in-place
- **Arrivals/Departures ◄ ► pagination** in Details transfers — page in-place
- **All / Highlights / Social / News pills** in Media tab — filter media in-place
- **Standings Tracker ◄ ► week arrows** — navigate season weeks in-place
- **Calendar month/year dropdown and ◄ ►** — navigate calendar months in-place
- **ⓘ info buttons** (tooltips on Sofascore Rating, Recent form, Standings Tracker) — tooltip only
- **Gamble responsibly text** — plain text, no link

---

## 16. NAVIGATION ANALYSIS — ALL DESTINATION PAGE TYPES

The Arsenal team page leads to nine distinct destination page types. Each is described below with full structure, layout, content, cards, and buttons.

---

### DEST-1: Played Match Detail Page

**Example:** West Ham 0–1 Arsenal (10 May 2026)
**URL:** /football/match/arsenal-west-ham-united/MR#id:14023942
**Title:** "West Ham United vs Arsenal live score, H2H and lineups | Sofascore"
**Breadcrumb:** Football › England › Premier League, Round 36 › [page title]
**Scroll height:** ~5643px
**Layout:** Two-column — Left panel (~430px) + Right content area (~700px)

**Match Summary Bar (full width, top):**
Home team crest + name | Final score (0–1) | "Finished" status label | Away team crest + name
Goalscorer + minute below score: "Leandro Trossard 83'"
Second row: Date/time (10/05/2026 • 16:30) | PL badge + "Premier League" link | Stadium icon + "London Stadium" | TV badge "Sky Go UK" + "+4" (more broadcasters)
Top-right: FAVOURITE ☆ button | COMPARE TEAMS icon (links to /football/team/compare?ids=[both teams])

**Left Panel — cards from top to bottom:**

*Betting odds card (Full-time):*
bet365 logo | Full-time odds: 1 (5/1) | X (16/5) | 2 (11/20) with directional arrows (▲▼) showing odds movement
"Additional odds" link (expands to more markets) | "A sign-up bonus awaits you. Claim" CTA button

*Match highlights video card:*
Large video thumbnail with ▶ overlay and "EXTENDED HIGHLIGHTS" banner
"See more" link below

*Attack Momentum chart:*
Horizontal bar chart (no numbers) showing attacking pressure per minute across the full 90+ minutes. Red side = West Ham (home), Blue side = Arsenal (away). Visual-only, no interaction.

*Prediction / vote widget:*
"Who will win?" | Total votes: 118k
Three vote buttons: West Ham crest (19%) | X draw (10%) | Arsenal crest (71%)
◄ Previous | dot navigation | Next ► (carousel to "Will both teams score?" and "Who will score first?" polls)

*Sofascore Analyst card:*
"Sofascore Analyst" logo + "View AI match analysis ›" link → /upgrade (redirects to landing.sofascore.com/download/)

*Highest-rated players card:*
Two-column list of top-rated players from both teams. Format: Rating badge | player headshot | player name | team. Example: 8.4 Konstantinos Mavropanos (West Ham) | 7.9 Leandro Trossard (Arsenal) | 7.8 Mateus Fernandes | 7.6 William Saliba | 7.1 El Hadji Malick Diouf | 7.4 David Raya

*Commentary section:*
Header: "Commentary"
Sub-tabs: All | Key events
Scrollable feed of match events in reverse chronological order (most recent first). Each entry: minute | event description | (player headshot optional). Examples: "Match ends, West Ham United 0, Arsenal 1." | "Second Half ends..." | "Attempt missed. [Player] header..."

**Right Panel Tabs (Played Match — full set):**

1. **Lineups** (default active):
   Sub-tabs: Lineups | Player stats
   - *Lineups sub-tab:* Two pitch graphics side by side on a green pitch background. Left = West Ham (3-4-2-1), Right = Arsenal (4-2-3-1). Each player shown as shirt icon with squad number + surname. Team average Sofascore rating shown below each formation name. Category filter pills: Performance (default) | Nationality | Age | Market value | Height | Fantasy — colour-code player icons by the selected attribute. Embed button (</>).
   - *Player stats sub-tab:* Sortable table of all 22+ players with columns: Player | Mins | Goals | Assists | Shots | Key passes | Rating. Filterable by team.

2. **Statistics:**
   Comparative two-column stat display (West Ham left, Arsenal right). Each stat displayed as a label + two values + a proportional horizontal bar chart.
   Categories: Attacking (expected goals, shots, shots on target, big chances, corners), Passing (ball possession %, passes, accuracy), Defending (tackles, clearances, interceptions), Other (fouls, yellow cards, offsides).

3. **Standings:**
   Current PL table (identical format to team page Standings tab). Current teams highlighted.

4. **H2H (Head to Head):**
   Two-column layout:
   - Left: "Head-to-head" with filter checkboxes: "At [Home Team]" | "This competition". Lists previous encounters sorted by date. Each row: date | competition | home team | score | away team.
   - Right: "Matches" showing each team's individual recent form independently. Filter: "Home" | "This competition" checkboxes. Same match row format.

5. **Media:**
   Video highlights grid + news articles. Same format as team page Media tab.

---

### DEST-2: Upcoming Match Detail Page

**Example:** Arsenal vs Burnley (18 May 2026)
**URL:** /football/match/arsenal-burnley/gsR#id:14023950
**Layout:** Same two-column structure as played match.

**Match Summary Bar:** Teams, time until match (countdown), Competition, Venue.

**Left Panel:**
*Vote widget (carousel of 3):*
1. "Who will win?" — Home | X | Away vote buttons
2. "Will both teams score?" — YES | NO
3. "Who will score first?" — team options
◄ Previous | dots | Next ►

*Match info cards (stacked):*
- Date and time: 18/05/2026 • 20:00 | "Add to calendar ›" link
- Competition: "Football, Premier League" — links to tournament page
- Betting odds: Full-time odds 1/X/2 — bet365 branded. "Additional odds" link. "Claim" CTA.

**Right Panel Tabs (Upcoming — reduced set):**
Only 2 tabs shown pre-match:
1. **Standings** — League table in same format as played match
2. **H2H** — Same two-column format as played match

After kickoff, additional tabs appear: Lineups, Statistics, Media.

---

### DEST-3: Player Profile Page

**Example:** Bukayo Saka
**URL:** /football/player/bukayo-saka/934235
**Title:** "Bukayo Saka stats and ratings | Sofascore"
**Breadcrumb:** Football › England › Premier League › Bukayo Saka stats, ratings and goals
**Scroll height:** ~3822px
**Layout:** Two-column — Left panel (~430px) + Right tabs area (~700px)

**Player Profile Header (full width):**
- Circular headshot photo (~100px)
- Name: "Bukayo Saka" in large bold
- Follower count: "200k followers"
- Club crest + "Arsenal" — links to /football/team/arsenal/42
- Contract: "Contract until: 30 Jun 2030"
- COMPARE button (blue) | FAVOURITE ☆ | EMBED WIDGET button (embeds a stat widget on external sites — opens modal with iframe code)
- Previous match card (same format as team page)
- Next match card (same format)
- Player attributes row: England flag | "5 September 2001 (24)" | Forward | 178 cm | Left | Number 7

**Left Panel — from top:**

*Player value card:*
- "Player value" heading
- MARKET VALUE: 126M €
- "Is market value higher or lower?" interactive vote buttons: € green (▲) | € red (▼)
- Player value chart ("Summary — last 12 months"):
  Monthly bar chart (Jul–May). Bar colour: green = played, red cross = injured. Monthly average Sofascore rating shown below each bar. "Click graph to swap values" toggle (switches between performance bars and market value bars). "Injured" legend.
  Values shown: 6.3 (Jul) | 7.3 (Sep) | 7.5 (Nov) | 6.8 (Jan) | 7.6 (Mar) | 7.6 (May)

*View media promo card:*
"Explore videos, news, facts, and more about this player." | Player headshot | "View media" button → #tab:media (in-page)

*Attribute Overview card:*
Spider/radar chart with player attributes. Axes shown: ATT (75) | CRE (74) | TEC | DEF | PHY | SPD etc. Multi-axis polygon visualisation. No navigation.

**Right Panel Tabs:**

1. **Matches** (default): Competition filter dropdown ("All competitions ▾"). Column icon headers: clock (minutes) | yellow card | red card | tackle | goal | substitution | Sofascore rating. Match rows: competition badge | date/status | home team + score + away team | W/D/L badge | minutes played | stats | Sofascore rating (coloured box: orange <6.5 | green 6.5–7.5 | teal >7.5). Paginated ◄ ►.
2. **Season**: Season summary stats table per competition (goals, assists, appearances, ratings).
3. **Career**: Full career history across all clubs. Each row: club crest | club name | season | appearances | goals | assists | avg rating.
4. **Fantasy**: Fantasy football-specific stats and advice for Sofascore Fantasy game.
5. **Media**: Highlights and news specific to this player. Same format as team media tab.

---

### DEST-4: Manager Profile Page

**Example:** Mikel Arteta
**URL:** /football/manager/mikel-arteta/794075
**Title:** "Mikel Arteta profile and stats | Sofascore"
**Breadcrumb:** Football › Manager › Mikel Arteta profile, stats and career history
**Scroll height:** ~2458px
**Layout:** Two-column — Left (matches list) + Right (manager info)

**Manager Header (full width):**
- Circular headshot photo (~100px)
- Name: "Mikel Arteta" + role badge: "Manager"
- Current club crest + "Arsenal" — links to /football/team/arsenal/42
- **PLAYER PROFILE button** (blue, top-right): Links to Arteta's old player profile (he played for Arsenal, Man City, etc.) → /football/player/mikel-arteta/[id]

**Left Panel:**
*Matches section:*
Mikel Arteta's managed matches listed chronologically, grouped by competition.
- ◄ ► arrows to navigate date ranges
- Match rows: same format (date, teams, score, W/D/L badge). Each row links to match page.

**Right Panel (single scrollable content, no tabs):**

*Manager stats card:*
- NATIONALITY: Spain (ESP flag)
- Age: 44 yrs (26 Mar 1982)
- PREF. FORMATION: 4-3-3
- MATCHES: 349
- POINTS/MATCH: 2.02

*Performance bar:*
Colour-coded proportional horizontal bar: 215 wins (62%, green) | 60 draws (17%, grey) | 74 losses (21%, red)

*Career history section:*
Header: "Career history" + "Points per match" column
Line chart showing average points per match across career (chart dates from 2019 to present)
Table entry: Arsenal crest | Arsenal | 12/2019 (start date) | 349 | 215 W | 60 D | 74 L | 2.02 pts/match
Club name links to /football/team/arsenal/42

---

### DEST-5: Venue / Stadium Page

**Example:** Emirates Stadium
**URL:** /venue/england/emirates-stadium/624
**Title:** "Emirates Stadium | Sofascore"
**Breadcrumb:** Venue › Emirates Stadium
**Scroll height:** ~2321px
**Layout:** Two-column — Left (matches) + Right (venue info + stats)

**Venue Header (full width):**
- Generic stadium silhouette icon (black on white, ~80px) — no photo in header
- Name: "Emirates Stadium" in large bold
- Country: England flag icon + "England"

**Left Panel:**
*Matches card:*
- Sport filter pills: All sports | Football | Rugby
- ◄ ► date navigation arrows
- Match list grouped by competition header (same match row format as elsewhere). Shows recent and upcoming matches at this venue.

**Right Panel:**

*Stadium photo:*
Large aerial photograph or 3D render of Emirates Stadium (~430px wide).

*Venue info card:*
- Home team: Arsenal crest + "Arsenal" (link to /football/team/arsenal/42)
- Capacity: 60,704
- Location: London, England
- **Map view** link/button → opens external map service (Google Maps / similar)

*Highlights section:*
Sport toggle: Football (active) | Rugby
Stats for this venue:
- Matches played: 408
- Goals scored: 1,208
- Home team wins: 66%
Plus additional stats below (visible on scroll): Home goals per game, Away goals per game, Average total goals, etc.

---

### DEST-6: Team Comparison Page

**URL:** /football/team/compare?ids=42
**Breadcrumb:** Football › Team comparison
**Scroll height:** ~3989px
**Layout:** Single centred column (no sidebar)

**Header:** "Team comparison" + ⓘ info button

**Team selector panel (side by side):**

*Left card (Arsenal pre-loaded):*
- Arsenal crest | "Arsenal" | "England" flag
- Competition dropdown: "Premier League ▾"
- Season dropdown: "25/26 ▾"
- × dismiss button | ⟳ swap teams button

*Right card (empty):*
- Shield placeholder icon
- "Select team" search/select dropdown
- Competition + season dropdowns (disabled until team selected)

**"+ Add another team" button:** Left of the cards. Adds a third team column for 3-way comparison.

**Comparison table (below cards):**
Rows grouped by category, Arsenal's stats in left column, blank (–) in right until second team is selected:
- General: Avg. Sofascore Rating (5.43) | Matches (36) | Goals scored (68) | Goals conceded (26) | Assists (48)
- Attacking: Goals per game (1.9) | xG | Shots on target per game | Big chances per game | etc.
- Passes: Ball possession (55.9%) | Accurate passes (394 / 84%) | etc.
- Defending: Clean sheets (18) | Tackles per game (16.1) | etc.
- Other: Duels won | Fouls | Yellow cards | etc.

---

### DEST-7: Country / Region Page

**Example:** England
**URL:** /football/england
**Title:** "Football Live Score - Sofascore"
**Breadcrumb:** Football › England › Football Livescore
**Scroll height:** ~3281px
**Layout:** Two-column — Left (fixture list) + Right (match preview panel)

**Left Column:**
- Region heading: "England" with ◄ Today ► date navigation
- Fixture list grouped by competition header rows:
  - Premier League (e.g. Man City vs Crystal Palace — HT 2-0)
  - League One, Playoffs
  - Women's Super League
  - (scrolls to show more competitions)
- SEO competition directory below fixtures: "All Football leagues and tournaments from England covered on Sofascore:" followed by a vertical list of competition links (Premier League, Championship, League One, League Two, FA Cup, EFL Cup, Women's Super League, FA Community Shield, National League, etc.)

**Right Column (match preview, shown when a match is selected):**
- Competition name + badge
- Match time / live score / status
- Team crests and names
- "Who will win?" vote widget (Home | X | Away buttons + vote percentages)
- Live betting odds: Full-time 1/X/2 with directional arrows | bet365 branded | "Additional odds" link | "Claim" CTA
- ◄ Previous match | dot indicators | Next ► carousel
- (Additional contextual cards on scroll: rankings cards, player of the season, compare players/teams, featured odds — same as the /football/world region page described in prior analysis)

---

### DEST-8: Tournament / Competition Page

**Example:** Premier League
**URL:** /football/tournament/england/premier-league/17
(Fully documented in the prior Premier League analysis. Key structure recap:)
**Layout:** Two-column — Left (Matches card with By date/By round sub-tabs) + Right (Overview/Standings/Top scorers/Media tabs)

---

### DEST-9: News Article Page

**Format:** /news/[article-slug]
(Fully documented in prior analysis. Recap:)
**Layout:** Two-column — Left sidebar (latest stories list + ad) + Right (full article: byline, date, headline, hero image, body text, embedded data widgets, tags, social sharing)
**Header:** Sofascore News variant (search bar, "Sofascore app" link — not the main app header)

---

## 17. SUMMARY

The Arsenal team page is Sofascore's standard club hub template, structured as a two-column desktop layout. The left column (~430px) focuses on match history with rich filtering (by competition, view mode, Finished/Upcoming, season), a visual Recent Form chart, and promotional cards for media and Fantasy. The right column (~700px) presents five themed tabs covering the full depth of Arsenal's season: league standings with a Standings Tracker chart, comprehensive team statistics across four categories, a full squad with multiple data views and top-player leaderboards, club details including titles/trophies/transfers/venue/info, and a media hub with highlights and news.

The page connects outward to nine distinct destination page types: played match pages (with full Lineups/Statistics/H2H/Media tabs and left-panel extras including betting odds, highlights, momentum chart, commentary, and Sofascore Analyst AI link), upcoming match pages (with condensed Standings and H2H only), player profile pages (market value, attribute radar, career, fantasy tabs), the manager profile page (career history, win/draw/loss performance bar), the stadium/venue page (photo, capacity, historical stats), the team comparison tool (side-by-side stat table), the country/region fixture page (England), the tournament/competition page (Premier League), and Sofascore News article pages.

Key interactive elements that do not navigate — including filter toggles, standings view pills, squad category pills, calendar navigation, chart hovers, and embed modals — are all in-page SPA interactions that reload data without a full page navigation.
