# Reference Schematic — Matchwire EPL Prototype

Analysis of the standalone matchwire Premier League page prototype. This is a **reference artifact** — it documents an external design, not an Atlas Kings page spec. No adaptation decisions are made here.

**Source**: `epl.zip` (HTML + JSX + CSS + data, React 18 + Babel, no build step)
**Analyzed**: 2026-05-23
**Brand name in prototype**: matchwire

---

## ASCII Wireframe — Full Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LIVE TICKER (sticky, top:0, h:44, z:51)                                    │
│ [ARS 2-1 CHE ● 67'] [MCI 0-0 LIV ● 54'] [TOT vs WHU · 17:30] [All →]    │
├─────────────────────────────────────────────────────────────────────────────┤
│ TOP NAV (sticky, top:44, h:56, z:50)                                       │
│ ⚽ matchwire   [⚽🏀🎾🏈🏏🏒⛳🥊🏎️]         [🔍 Search]  [◑] [👤]     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ LEAGUE HERO                                                         │    │
│  │                                                                     │    │
│  │  ┌──────┐                                                           │    │
│  │  │ 96px │  England · Tier 1 · 2025/26 Season · MW 13               │    │
│  │  │CREST │  Premier League                          [Follow] [Share] │    │
│  │  └──────┘  Season 2025/26 ▾   ● 3 live                             │    │
│  │  ═══════════════════════ accent gradient stripe ═════════════════    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ TAB STRIP (sticky, top:100, h:48, z:49)                                    │
│   Overview    Standings    Fixtures & Results    Top Players    Teams       │
│   ═══════                                                      (underline) │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐  ┌──────────────────────────────────┐  ┌───────────────┐     │
│  │ LEFT     │  │ CENTER COLUMN (flex 1)            │  │ RIGHT RAIL    │     │
│  │ RAIL     │  │                                    │  │ (320px)       │     │
│  │ (256px)  │  │  [see tab wireframes below]       │  │               │     │
│  │ sticky   │  │                                    │  │ [see right    │     │
│  │ top:152  │  │                                    │  │  rail below]  │     │
│  │          │  │                                    │  │               │     │
│  │ Top 10   │  │                                    │  │               │     │
│  │ Competi- │  │                                    │  │               │     │
│  │ tions    │  │                                    │  │               │     │
│  │          │  │                                    │  │               │     │
│  │ All      │  │                                    │  │               │     │
│  │ Competi- │  │                                    │  │               │     │
│  │ tions    │  │                                    │  │               │     │
│  │ (tree)   │  │                                    │  │               │     │
│  └──────────┘  └──────────────────────────────────┘  └───────────────┘     │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                                      │
│ © 2026 matchwire · Leagues · Teams · Players · About · API    EN(UK) · GMT │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tab: Overview

```
┌──────────────────────────────────────────────────┐
│ MATCHWEEK STRIP                                   │
│ [←] [11] [12] [▓13▓] [14] [15] [→]              │
├──────────────────────────────────────────────────┤
│ FIXTURES GROUP (card, no-pad)                     │
│                                                    │
│ ┌─ FRI 21 NOV ──────────────────────────────────┐│
│ │ 20:00  │ARS ⛨ 2-1 ⛨ CHE│ Sky Sports · Emirates││
│ │ 20:00  │MCI ⛨ 0-0 ⛨ LIV│ TNT Sports · Etihad  ││
│ └────────────────────────────────────────────────┘│
│ ┌─ SAT 22 NOV ──────────────────────────────────┐│
│ │ ●67'   │TOT ⛨ 1-2 ⛨ WHU│ Sky Sports · Spurs   ││
│ │ 15:00  │BOU    vs    EVE│ BBC One · Vitality    ││
│ │ 17:30  │NEW    vs    BRE│                        ││
│ └────────────────────────────────────────────────┘│
│                                                    │
├──────────────────────────────────────────────────┤
│ Standings                     [View full table →] │
│ ┌────────────────────────────────────────────────┐│
│ │ #  Team         P  W D L  GF GA GD Pts  Form  ││
│ │ ▐1  Liverpool   12 10 1 1 28 8 +20 31  ●●●●○  ││  ← UCL zone (purple bar)
│ │ ▐2  Arsenal     12 9  2 1 25 9 +16 29  ●●●●●  ││
│ │ ▐3  Man City    12 8  2 2 24 10+14 26  ●●○●●  ││
│ │ ▐4  Chelsea     12 7  3 2 21 11+10 24  ●●●○●  ││
│ │ ▐5  Aston Villa 12 7  2 3 19 12 +7 23  ●○●●●  ││  ← UEL zone (blue bar)
│ │ ▐6  Brighton    12 6  3 3 18 13 +5 21  ○●●●○  ││  ← UECL zone (teal bar)
│ │  7  Newcastle   12 6  2 4 17 14 +3 20  ●●○●○  ││
│ └────────────────────────────────────────────────┘│
│                                                    │
├──────────────────────────────────────────────────┤
│ Top performers           [Goals|Assists|CS]       │
│ ┌────────────────────────────────────────────────┐│
│ │ 1  (●) Salah        8.1 xG · 5 A         10   ││
│ │     Liverpool        Goals                      ││
│ │ 2  (●) Haaland      7.2 xG · 2 A          9   ││
│ │     Man City         Goals                      ││
│ │ 3  (●) Palmer       5.8 xG · 4 A          8   ││
│ │     Chelsea          Goals                      ││
│ │ 4  (●) Watkins      5.5 xG · 3 A          7   ││
│ │     Aston Villa      Goals                      ││
│ │ 5  (●) Saka         5.1 xG · 6 A          6   ││
│ │     Arsenal          Goals                      ││
│ ├────────────────────────────────────────────────┤│
│ │         [View all top performers →]             ││
│ └────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

---

## Tab: Standings (full)

```
┌──────────────────────────────────────────────────────────┐
│ #  Team              P   W  D  L   GF  GA  GD  Pts Form │
│ ▐1  Liverpool        12  10 1  1   28   8  +20  31 ●●●● │ ← UCL
│ ▐2  Arsenal          12   9 2  1   25   9  +16  29 ●●●● │ ← UCL
│ ▐3  Man City         12   8 2  2   24  10  +14  26 ●●○● │ ← UCL
│ ▐4  Chelsea          12   7 3  2   21  11  +10  24 ●●●○ │ ← UCL
│ ▐5  Aston Villa      12   7 2  3   19  12   +7  23 ●○●● │ ← UEL
│ ▐6  Brighton         12   6 3  3   18  13   +5  21 ○●●● │ ← UECL
│  7  Newcastle        12   6 2  4   17  14   +3  20 ●●○● │
│  ...                                                      │
│ ▐18 Southampton  ▼2  12   1 2  9    7  23  -16   5 ○○●○ │ ← REL
│ ▐19 Luton Town   ▼1  12   1 1 10    6  25  -19   4 ○○○● │ ← REL
│ ▐20 Sheffield Utd    12   0 3  9    5  27  -22   3 ○○○○ │ ← REL
└──────────────────────────────────────────────────────────┘

Zone legend:
  ▐ purple = UCL (pos 1-4)
  ▐ blue   = UEL (pos 5)
  ▐ teal   = UECL (pos 6)
  ▐ red    = Relegation (pos 18-20)

Sortable by: any column header click
Form display: pips (●○) or letter chips ([W][D][L])
```

---

## Tab: Fixtures & Results

```
┌──────────────────────────────────────────────────┐
│ MATCHWEEK STRIP                                   │
│ [←] [11] [12] [▓13▓] [14] [15] [→]              │
├──────────────────────────────────────────────────┤
│ [Same FixturesGroup as Overview tab]              │
│ (full matchweek, grouped by date)                 │
└──────────────────────────────────────────────────┘
```

---

## Tab: Top Players

```
┌──────────────────────────────────────────────────┐
│ [Goals] [Assists] [Clean sheets]    ← seg control │
│                                                    │
│ GOALS view → ScorerCards (3-col grid)             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ (●) Salah│ │(●)Haaland│ │(●) Palmer│           │
│ │Liverpool │ │ Man City │ │ Chelsea  │           │
│ │G:10 A:5  │ │G:9  A:2  │ │G:8  A:4  │           │
│ │MP:12     │ │MP:12     │ │MP:12     │           │
│ │xG:8.1    │ │xG:7.2    │ │xG:5.8    │           │
│ │[═══════▏]│ │[══════▏] │ │[═════▏]  │           │
│ └──────────┘ └──────────┘ └──────────┘           │
│ ... (more cards)                                   │
│                                                    │
│ Full scorer list:                                  │
│ # Player        Team        G  A  xG   MP  xG Bar │
│ 1 Salah         Liverpool  10  5  8.1  12  [═══▏] │
│ 2 Haaland       Man City    9  2  7.2  12  [══▏]  │
│ ...                                                │
│                                                    │
│ ASSISTS view → MiniLeaderList                      │
│ # Player        Team        A  G  MP               │
│                                                    │
│ CS view → MiniLeaderList                           │
│ # Player        Team        CS GA MP               │
└──────────────────────────────────────────────────┘
```

---

## Tab: Teams

```
┌──────────────────────────────────────────────────────────┐
│ 4-COLUMN GRID (alphabetical sort)                         │
│                                                           │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────┐ │
│ │▓▓▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓│ │
│ │  ⛨  #1     │ │  ⛨  #2     │ │  ⛨  #5     │ │ ⛨  #10 │ │
│ │  Arsenal   │ │ Aston Villa│ │ Bournemouth│ │Brentford│ │
│ │ 29 pts     │ │ 23 pts     │ │ 15 pts     │ │ 14 pts │ │
│ │ 9W 2D 1L   │ │ 7W 2D 3L   │ │ 4W 3D 5L   │ │4W 2D 6L│ │
│ └────────────┘ └────────────┘ └────────────┘ └────────┘ │
│ ... (20 tiles total, 5 rows)                              │
│                                                           │
│ Tile spec:                                                │
│ - Team-color gradient bg (8% opacity, 15% hover)         │
│ - Crest: 56px centered                                    │
│ - Position badge: top-right corner                        │
│ - Hover: translateY(-2px) + shadow elevation              │
│ - Links to team detail page                               │
└──────────────────────────────────────────────────────────┘
```

---

## Left Rail

```
┌──────────────────┐
│ TOP 10            │
│ COMPETITIONS      │
│                    │
│ 1 ◻ Prem. League →│
│ 2 ◻ LaLiga       →│
│ 3 ◻ Bundesliga   →│
│ 4 ◻ Serie A      →│
│ 5 ◻ Ligue 1      →│
│ 6 ◻ Champions Lg →│
│ 7 ◻ Europa Lg    →│
│ 8 ◻ Conf. League →│
│ 9 ◻ Saudi Pro    →│
│ 10◻ Brasileirão  →│
│                    │
├──────────────────┤
│ ALL COMPETITIONS  │
│                    │
│ 🏴 England    (4) │
│   ▾ Premier League│
│     Championship  │
│     League One    │
│     League Two    │
│ 🇪🇸 Spain      (2) │
│   ▸ (collapsed)   │
│ 🇩🇪 Germany    (2) │
│   ▸ (collapsed)   │
│ 🇮🇹 Italy      (2) │
│ 🇫🇷 France     (2) │
│ 🇳🇱 Netherlands(1) │
│ 🇵🇹 Portugal   (1) │
│ 🇹🇷 Turkey     (1) │
│ 🇸🇦 Saudi A.   (1) │
│ 🇧🇷 Brazil     (1) │
│ 🇦🇷 Argentina  (1) │
│ 🇺🇸 USA        (1) │
│ 🌍 International  │
│   ▸ (collapsed)   │
└──────────────────┘

Sticky: top 152px
Max-height: calc(100vh - 168px)
Overflow-y: auto (thin scrollbar)
```

---

## Right Rail

```
┌───────────────────────┐
│ FEATURED MATCH         │
│                         │
│   ⛨ TOT  vs  WHU ⛨   │
│   Sat 22 Nov · 17:30  │
│   Tottenham Stadium    │
│                         │
│   ┌──┐ ┌──┐ ┌──┐ ┌──┐│
│   │0d│ │6h│ │23│ │41│││
│   │  │ │  │ │m │ │s │││
│   └──┘ └──┘ └──┘ └──┘│
│                         │
│   [View match]   [🔔]  │
├─────────────────────────┤
│ ON NOW                   │
│                         │
│ ⛨ ARS 2-1 CHE  ● 67' │
│ ⛨ MCI 0-0 LIV  ● 54' │
│ ⛨ BOU 1-0 EVE  ● 31' │
├─────────────────────────┤
│ ON TV TODAY              │
│                         │
│ ARS vs CHE  20:00 [Sky]│
│ MCI vs LIV  20:00 [TNT]│
│ TOT vs WHU  17:30 [Sky]│
├─────────────────────────┤
│ PLAYER OF THE WEEK       │
│                         │
│ ┌───────────────────┐  │
│ │   (photo area)    │  │
│ │                   │  │
│ │      [9.2]        │  │ ← rating badge
│ │   Mo Salah        │  │
│ │   Liverpool · FW  │  │
│ └───────────────────┘  │
└─────────────────────────┘
```

---

## Live Ticker Detail

```
┌──────────────────────────────────────────────────────────────────────┐
│ [ARS 2-1 CHE FT] [MCI 0-0 LIV ●54'] [TOT vs WHU 17:30] [All →]   │
└──────────────────────────────────────────────────────────────────────┘

Per pill:
┌─────────────────────────┐
│ ARS ⛨  2 - 1  ⛨ CHE FT │   ← finished: bold score, muted teams
└─────────────────────────┘
┌───────────────────────────┐
│ MCI ⛨  0 - 0  ⛨ LIV ●54'│   ← live: red dot + minute badge
└───────────────────────────┘
┌─────────────────────────┐
│ TOT ⛨   vs   ⛨ WHU 17:30│   ← upcoming: kickoff time
└─────────────────────────┘
```

---

## Match Row Detail

```
┌─ 72px ─┬──────────── 1fr ──────────────┬────── 200px ──────┐
│        │  Home name  ⛨ │ S-S │ ⛨  Away │                    │
│ 20:00  │  Arsenal      │ 2-1 │ Chelsea │ Sky Spts · Emirates│
│        │               │     │         │                    │
│▐home   │               │     │         │               away▐│
│ color  │               │     │         │              color │
└────────┴───────────────────────────────┴────────────────────┘

Team-color edge accents: 3px vertical bars
  Left edge = home team primary color
  Right edge = away team primary color
  Toggleable via "teamEdges" tweak

Score typography: JetBrains Mono 700 17px
  Winner digit: primary text color + bold
  Loser digit: text-muted
  Draw: both secondary

Status indicators:
  FT     → muted text, static
  ●67'   → red LiveDot + minute, live styling
  17:30  → upcoming time, secondary text
```

---

## Design Tokens

### Typography Scale

```
--font-primary:    Inter, system-ui, sans-serif
--font-mono:       JetBrains Mono, monospace
--font-features:   "cv11" 1, "ss01" 1

Body:           14px / 1.5  / 400
Hero title:     38px / 1.15 / 800
Hero eyebrow:   12px / -    / 500   uppercase, ls:0.5px
Section h2:     16px / 1.3  / 700
Tab label:      13px / -    / 600   uppercase, ls:0.3px
Table header:   11px / -    / 600   uppercase, ls:0.5px
Score:          17px / -    / 700   JetBrains Mono
Stat value:     22px / -    / 800   JetBrains Mono
Stat label:     10px / -    / 500   JetBrains Mono, uppercase
Ticker:         11px / -    / 600
MW pill:        12px / -    / 600
Footer:         12px / -    / 400
```

### Color Tokens — Dark (default)

```
--c-bg:              #0B0E14
--c-surface-0:       #0E1218
--c-surface-1:       #161B25
--c-surface-2:       #1E2533
--c-surface-3:       #262E3E
--c-border:          #1E2533
--c-text:            #F4F6F8
--c-text-secondary:  #B0B9CC
--c-text-muted:      #7C879B
--c-text-faint:      #56627A
```

### Color Tokens — Light

```
--c-bg:              #F4F6FA
--c-surface-0:       #FFFFFF
--c-surface-1:       #FFFFFF
--c-surface-2:       #F1F4F9
--c-surface-3:       #E7EBF2
--c-text:            #0E1218
--c-text-secondary:  (inherits from dark)
--c-text-muted:      (inherits from dark)
--c-text-faint:      (inherits from dark)
```

### Semantic Colors

```
--c-accent:          #7C5CFF  (configurable)
--c-accent-soft:     {accent}22  (13% opacity)

Zone UCL:            #7C5CFF
Zone UEL:            #4A90E2
Zone UECL:           #2DD4BF
Zone Relegation:     #EF4444

Win:                 #22C55E
Draw:                --c-text-muted
Loss / Live:         #EF4444
```

### Spacing

```
4px    micro (pip gaps, icon margins)
8px    tight (pill padding, badge padding)
12px   card border-radius, small gaps
16px   card padding, section gaps
20px   medium gaps
24px   column gap, section spacing
32px   container padding, large sections
48px   major vertical breaks
```

### Layout Dimensions

```
Container max:       1440px
Container padding:   32px
Left rail:           256px (224px at ≤1280px)
Right rail:          320px (300px at ≤1280px, hidden at ≤1180px)
Column gap:          24px
Center col:          ~752px (computed)

Ticker height:       44px
Nav height:          56px
Tab strip height:    48px
Total sticky stack:  148px

Card border-radius:  12px
Card border:         1px solid --c-border
```

### Density

```
data-density="compact"   → row-height: 38px
data-density="regular"   → row-height: 48px
data-density="comfy"     → row-height: 56px
```

### Z-Index Stack

```
51  LiveTicker
50  TopNav
49  TabStrip
10  TweaksPanel
 1  Tooltip / dropdown
```

---

## Component Atom Specs

### Crest (team)
- SVG shield path, 2-stop gradient fill (team color → darker)
- White initials (first 3 chars of team short code)
- Sizes used: 11px (inline), 16px (ticker), 20px (table), 36px (match row), 56px (team tile), 96px (hero)

### LeagueCrest (competition)
- Rounded rect SVG, accent-tinted fill
- Competition initials centered
- Sizes: 20px (left rail), 32px (ticker)

### FormPips
- 8px circles, gap 3px
- W = #22C55E, D = --c-text-muted, L = #EF4444
- Newest result: opacity 0.9; older: opacity 0.6
- Last 5 results shown

### FormChips
- 18px letter squares, 3px border-radius
- W = green-tinted bg + green text
- D = muted-tinted bg + muted text
- L = red-tinted bg + red text

### PosChange
- Triangle (▲/▼) + number
- Up: #22C55E, Down: #EF4444
- No change: dash in --c-text-faint

### LiveDot
- 8px circle, #EF4444
- Pulse keyframe: scale 1→1.4, opacity 1→0, 1.5s infinite

### PlayerAvatar
- Circle, 2-stop gradient (team color top → 20% darker bottom)
- White initials (first letter of first + last name)
- Sizes: 36px (performer list), 48px (scorer card)

### ChannelChip
- Inline pill, tinted background per channel
- Sky = blue tint, TNT = orange tint, BBC = neutral tint
- 11px/600 text, 4px 8px padding, 4px border-radius

### XgBar
- Horizontal bar, full width = max goals in dataset
- Accent fill = actual goals proportion
- Vertical line marker at xG position (1px, --c-text-muted)
- Height: 6px, border-radius: 3px

---

## Interaction Matrix

| Trigger | Target | Effect | Timing |
|---|---|---|---|
| Tab click | TabStrip underline | Slide to new tab (offsetLeft + width) | CSS transition 0.25s ease |
| Tab click | Center column | Instant content swap (React state) | Immediate |
| Column header click | StandingsTable | Re-sort rows | Immediate, no animation |
| MW arrow click | MatchweekStrip | Shift pill window ±1 | Immediate |
| MW pill click | MatchweekStrip + Fixtures | Set active week, reload fixtures | Immediate |
| Theme toggle | Entire page | Swap CSS vars via data-theme | Immediate |
| Density radio | Tables + match rows | Swap row heights via data-density | Immediate |
| Form toggle | Standings form column | Swap pips ↔ chips | Immediate |
| Team tile hover | Team tile | translateY(-2px) + box-shadow | 0.18s ease |
| Match row hover | Match row | bg → surface-2 | Instant |
| Left rail chevron | Country section | Expand/collapse children | Instant |
| Search focus | SearchDropdown | Show dropdown | Instant |
| Search keyup | SearchDropdown items | Filter results | Instant |
| Featured match | Countdown blocks | D/H/M/S update | setInterval(1000) |
| Accent picker | All accent-colored elements | Swap --c-accent | Immediate |
| Right rail toggle | Right rail column | Show/hide | Immediate (CSS) |
| Team edge toggle | Match row edge bars | Show/hide 3px bars | Immediate (CSS class) |

---

## Data Dependencies Per Tab

| Tab | Data globals consumed |
|---|---|
| Overview | EPL_MATCHWEEK, EPL_STANDINGS (top 7), EPL_SCORERS (top 5), EPL_ASSISTS (top 5), EPL_CLEAN_SHEETS |
| Standings | EPL_STANDINGS (all 20) |
| Fixtures & Results | EPL_MATCHWEEK |
| Top Players | EPL_SCORERS (all), EPL_ASSISTS (all), EPL_CLEAN_SHEETS |
| Teams | EPL_TEAMS, EPL_STANDINGS |
| Left Rail | EPL_TOP10, EPL_COUNTRIES |
| Right Rail | EPL_MATCHWEEK, EPL_ON_TV, EPL_POTW |
| Ticker | EPL_MATCHWEEK.matches |
| Hero | (static — league name, season, live count derived from matches) |

---

## What the prototype does NOT have

1. Loading / skeleton states
2. Empty / error states
3. Mobile / responsive layout (viewport locked 1280px)
4. Accessibility (ARIA, keyboard nav, focus management)
5. Internationalization / RTL
6. URL routing (tabs are React state only)
7. Real API integration (hardcoded globals)
8. SSR / SEO (client-side Babel rendering)
9. Real image assets (SVG-generated placeholders)
10. Pagination / infinite scroll
11. Match detail navigation (links exist but point to static HTML)
12. Live data polling (countdown uses setInterval, no WebSocket/SSE)
13. Caching / data freshness strategy
14. Analytics / tracking
15. Share functionality (button exists, no implementation)
