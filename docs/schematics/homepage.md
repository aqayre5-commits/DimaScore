# Atlas Kings Homepage Schematic

Locked schematic for `/[locale]` (homepage / football landing). All decisions consolidated from Phase 4.5+ design session 2026-05-13.

**Status**: Locked, ready for Phase 4.5 implementation
**Last updated**: 2026-05-13
**Reference**: `docs/research/sofascore-analysis-atlas-kings-phase4-5.md` (484 lines, Sofascore visual analysis)
**Tournament data source**: `docs/tournaments/CALENDAR.md`

---

## Page identity

This is the canonical Atlas Kings landing page. `/[locale]` resolves directly to this page; Football is the default sport. No separate `/football` URL.

The homepage is a **fixture browser plus editorial discovery surface**, not an inner page. It does not use the inner-page 3-column shell that competition / team / player / match-detail pages use (see BACKLOG entries for Phase 6+ inner-page shell). It has its own layout described below.

---

## Layout at desktop ≥1344px

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADAPTIVE TOP STRIP (~40px, sticky top:0, dark bg)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ TOPBAR (~64px, sticky top:40px, dark)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ EDITORIAL HERO (~80px, sticky top:104px)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ SEO breadcrumb (~22px, scrolls away)                                         │
├──────────────────────┬───────────────────────────┬──────────────────────────┤
│ FIXTURE LIST ~540px  │ EDITORIAL CARDS ~440-500  │ RIGHT RAIL ~280px        │
│ (left column)        │ (center column)           │ (≥1344px only)           │
└──────────────────────┴───────────────────────────┴──────────────────────────┘
│ FOOTER (dark)                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Section 1 — Adaptive top strip (~40px)

Sticky top:0, dark background, horizontally scrollable. Content swaps based on football calendar state, determined by `getCountdownStripMode(today)`.

### Mode 1 — Tournament countdown (within visibility window)

Active when a Morocco-priority tournament is within 90 days of kickoff (180 days for WC 2030 — co-host special case).

```
[🏆 WC26]  29J : 10H : 37M  ‹  Groupe A 🇲🇽🇿🇦🇰🇷🇨🇿   Groupe B 🇨🇦🇧🇦🇮🇷🇨🇭
                              Groupe C 🇦🇷🇲🇦🇸🇦🇪🇬   Groupe D 🇺🇸🇮🇷🇪🇨🇨🇱  →
```

- Live countdown timer (days : hours : minutes : seconds)
- Horizontally scrollable group/team preview
- Morocco's group highlighted with gold accent regardless of scroll position
- Today (May 13, 2026): WC 2026 countdown active

### Mode 2 — Tournament LIVE

Active when a tournament is in-progress and at least one fixture is live or scheduled for today.

```
[🏆 WC26 LIVE]  ●  ‹  17:00  🇲🇦 Morocco – 🇧🇷 Brazil  Group F  ·
                     20:00  🇫🇷 France – 🇪🇸 Spain  Group D  →
```

- Today's fixtures ticker
- Live indicator (red dot, animated) on currently-playing matches
- Updates via Pusher subscription as scores change

### Mode 3 — Upcoming match ticker (no tournament within window)

Falls back to scrolling Morocco-relevant fixtures for the next 7 days. No player names — match-level only.

```
[⚽ À venir]  ‹  Demain 20:00  Wydad – Raja  Botola Pro  ·
              Demain 21:00  PSG – Marseille  Ligue 1  ·
              Sam 17:00  Man City – Arsenal  Premier League  →
```

Selection priority for ticker fixtures:
1. Atlas Lions next match (always if within 14 days)
2. Botola Pro next matchweek's biggest fixtures
3. Moroccan clubs in CAF Champions League / CAF Confederation
4. Top European league matches Morocco audience cares about
5. UCL knockout matches
6. Major European derbies

Limit ~8 fixtures rotating; refreshes as matches complete.

### Mode 4 — Atlas Kings update (fallback identity)

Genuinely quiet periods (rare). Shows long-horizon items.

```
[⚽ Atlas Kings]  Saison Botola Pro 2026-27 commence le 15 août  ·
                 WC 2030 — 1,500 jours  ·  Prochain Atlas Lions: 6 sept  →
```

Never empty — always reinforces Atlas Kings as a Morocco-football product.

### Mode selection logic

```typescript
function getCountdownStripMode(today: Date): StripMode {
  const liveTournament = findLiveTournament(today);
  if (liveTournament) return { mode: 'live', tournament: liveTournament };

  const imminent = findTournamentWithinWindow(today, 90 /* days */);
  if (imminent) return { mode: 'countdown', tournament: imminent };

  const upcoming = getMoroccoRelevantUpcoming(today, 7 /* days ahead */);
  if (upcoming.length >= 3) return { mode: 'upcoming-matches', fixtures: upcoming };

  return { mode: 'fallback' };
}
```

When multiple tournaments overlap, highest-priority one shows (rule: Morocco hosts > Atlas Lions > Atlas Lionesses > Atlas Lions youth).

---

## Section 2 — Topbar (~64px)

Sticky top:40px, single row, dark background `#0c0c0d`.

```
[Atlas Kings]  Home  Botola Pro  WC 2026 🔥  WAFCON 2026  Compétitions ▾    🔍  EN ▾  ☾
```

### Items

| Position | Item | Type | Source |
|---|---|---|---|
| 1 | Atlas Kings logo | Static, gold | Brand asset |
| 2 | Home | Static label | Always present |
| 3 | Botola Pro | Permanent anchor | `is_permanent_anchor: true` in CALENDAR.md |
| 4 | Featured slot 1 | Auto-promoted | `getFeaturedCompetitions()` |
| 5 | Featured slot 2 | Auto-promoted | `getFeaturedCompetitions()` |
| 6 | Compétitions ▾ | Mega-menu trigger | Reads CALENDAR.md visibility |
| 7 | Search trigger 🔍 | Utility | Static |
| 8 | Language switcher | Utility | FR / EN / AR |
| 9 | Theme toggle ☾ | Utility | Light / dark |

### Featured slot rules

Auto-promotion driven by Morocco-relevance scoring:

```
PRIORITY (1 highest):
1. Morocco hosts/co-hosts tournament              → relevance: 'host'
2. Atlas Lions men's senior                       → relevance: 'national_team_senior_men'
3. Atlas Lionesses senior                         → relevance: 'national_team_senior_women'
4. Atlas Lions youth (U-17, U-20, U-23 men)       → relevance: 'national_team_youth_men'
5. Atlas Lionesses youth                          → relevance: 'national_team_youth_women'
6. Moroccan club in continental                   → relevance: 'club_competition'
7. Moroccan player abroad in major foreign comp.  → relevance: 'player_abroad'
8. Global headline                                → relevance: 'none'

Tiebreakers within same priority:
- Closer to kickoff wins
- Currently running > upcoming > recently finished (within grace window)
```

**Today (May 13, 2026)** resolves to:
- Slot 1: **WC 2026 🔥** (29 days to kickoff, Morocco qualified, Tier 1)
- Slot 2: **WAFCON 2026** (73 days to kickoff, Morocco hosts, Tier 1 priority)

🔥 badge on most-imminent featured tournament.

### Mega-menu (Compétitions ▾)

Drops down with tier groupings:

```
┌─ Morocco (always shown) ──┬─ Africa ─────────┬─ Europe ─────────────┐
│ Botola Pro                │ AFCON 2027       │ Premier League        │
│ Botola Pro 2              │ AFCON Qualifiers │ LaLiga                │
│ Coupe du Trône            │ WAFCON 2026      │ Bundesliga            │
│                           │ CAF Champions L. │ Serie A               │
├─ International ───────────│ CAF Confed       │ Ligue 1               │
│ FIFA World Cup 2026       │ CAF Super Cup    │ Champions League      │
│ FIFA World Cup 2030       │ CHAN             │ Europa League         │
│ WC Qualifications         │ AFCON U-23       │ Conference League     │
│ FIFA U-17 WC 2026         │                  │                       │
├─ MENA ────────────────────│                  │                       │
│ AFC Asian Cup 2027        │                  │                       │
│ Saudi Pro League          │                  │                       │
│ Egyptian Premier          │                  │                       │
└───────────────────────────┴──────────────────┴───────────────────────┘
```

Mega-menu queries `is_currently_visible` flag — temporal tournaments (AFCON 2027, U-17 WC 2026) only appear within their visibility window.

---

## Section 3 — Editorial hero (~80px)

Sticky top:104px. Priority-driven, no rotation timer. Resolves on each request, 60s cache for non-live content, 0s cache when live.

### Mode A — Morocco-relevant match LIVE

```
🔴 LIVE   🇲🇦 Maroc  2 - 1  🇧🇷 Brésil   WC 2026 · 67' · Stade Azteca           →
```

- Pusher subscription on `fixture-{id}` channel (deployed Phase 3, ~120ms latency)
- Re-evaluates priority when match reaches terminal state

### Mode B — Atlas Lions match within 7 days

```
⚽  🇲🇦 Maroc – 🇸🇳 Sénégal   AFCON Quals · Sam 17:00 · 2j 5h                  →
```

### Mode C — Botola Pro matchweek highlight

```
🏆  Wydad AC – Raja CA   Derby de Casablanca · Sam 20:00 · Botola Pro          →
```

### Mode D — Tournament milestone

```
🏆  WC 2026 commence dans 29 jours · Maroc dans Groupe C                       →
```

### Mode E — Fallback

```
🦁  Atlas Lions — Champions Arab Cup 2025 · WC 2030 dans 1,500 jours           →
```

### Priority

A (live) > B (Atlas Lions ≤7d) > C (Botola highlight) > D (milestone) > E (fallback)

### Click action

Navigates to relevant page — match detail / competition / team — depending on mode.

---

## Section 4 — SEO breadcrumb (~22px)

Scrolls away with content. Single line, ~14px gray text, locale-specific.

```
Football aujourd'hui — scores en direct, Botola Pro, AFCON Quals, WC 2026
```

---

## Section 5 — Left column / Fixture list (~540px)

### Card header (~96px)

Two rows separated by 1px divider.

Row 1 — View mode tabs + date navigator:

```
[Tous ●]  [Favoris]  [Compétitions]                            [< Aujourd'hui >]
```

- Tabs: gold underline on active
- Single-day navigator: chevron-label-chevron, small label
- NO multi-day strip (Sofascore uses single-day, we follow)

Row 2 — Filter pills + (no odds toggle):

```
[Tous]  [Live (N) red]  [Terminés]  [À venir]
```

- Pill chips
- Live pill: ALWAYS red text + 10% red background, regardless of active state
- Count in Live pill updates via Pusher
- NO Odds toggle (Loi 09-08 prohibits betting content)

### Competition groups

Sorted Morocco-first:

1. **Tier 2 Morocco domestic** — Botola Pro → Botola Pro 2 → Coupe du Trône
2. **Tier 3 African** — AFCON / WAFCON / CAF Champions League / CAF Confed / AFCON Qualifiers / CHAN / CAF Super Cup
3. **Tier 1 FIFA** — WC 2026 / WC 2030 / WAFCON / U-17 WC / WC Qualifications / FIFA Arab Cup (when active)
4. **Tier 4 European men's** — UCL / UEL / UECL / EPL / LaLiga / Bundesliga / Serie A / Ligue 1
5. **Tier 5 European women's + Olympic** — UWCL / UECL Women / UEFA Women's Euro / Olympics
6. **Tier 6 MENA** — AFC Asian Cup / Saudi Pro / Egyptian Premier / Algeria Ligue 1 / Tunisia Ligue 1

Each group has a collapsible header (default: top 5 expanded, others collapsed).

### Group header (~48px)

```
┌──────────────────────────────────────────────────────────────┐
│ [logo 24×24]  Competition name              [count]   [⌃]    │
│               🇲🇦 Country                                     │
└──────────────────────────────────────────────────────────────┘
```

Components: competition logo + name (bold) + country flag + country name (muted) + match count badge + collapse chevron.

### Fixture row (~48px)

Three states with distinct visual treatment.

**Upcoming**:

```
│ 20:00 │ [crest] Wydad AC                                   │ ☆ │
│       │ [crest] FAR Rabat                                  │   │
```

Gray time, dash where score would be, dim text, favourite star.

**LIVE**:

```
│ 67' R │ [crest] OCS Settat                  2              │ ☆ │
│       │ [crest] HUSA                         1             │   │
```

Red minute indicator (R = red color), bold scores, red wash animation across row (10% opacity, sweeps left-to-right per Sofascore pattern).

**Finished**:

```
│ FT    │ [crest] AS FAR                       3 (winner)    │ ☆ │
│       │ [crest] Renaissance B.              0 (45% opacity)│   │
```

"FT" status, scores bold, winner full opacity, loser at 45% opacity (Sofascore convention for outcome storytelling).

Each row has a 1px vertical divider between time block, teams area, and favourite star.

### Empty state

If zero fixtures today: short text "Aucun match aujourd'hui · Voir demain →" — not page-filling.

---

## Section 6 — Center column / Editorial cards (~440-500px)

Eight cards plus an About SEO block, stacked vertically with ~16px spacing.

### Card 1 — Featured match carousel

```
┌─ Carousel: 5 featured matches, dots + arrows ───────────────┐
│ [crest L]  Date · Heure  Countdown  [crest R]               │
│ Team L name                          Team R name            │
│                                                              │
│ Qui va gagner?                                              │
│ [Domicile]  [X nul]  [Extérieur]                            │
│   → % bars after vote (aggregated client-side, no auth)     │
│                                                              │
│ Forme récente:                                              │
│  WWLDW   vs   LWDWW                                         │
│   ↑ last 5 results for both teams (REPLACES Sofascore odds) │
│                                                              │
│ ‹ Précédent  ●●●●●  Suivant ›                               │
└──────────────────────────────────────────────────────────────┘
```

Featured match selection algorithm (Morocco-first):
1. Morocco hosts/co-hosts active tournament featured match
2. Atlas Lions men's senior next match
3. Atlas Lionesses senior next match
4. Atlas Lions youth next match
5. Moroccan club in continental competition
6. Moroccan player abroad — their next club match
7. Global headline (UCL final, El Clásico, etc.)

Replaces Sofascore's bet365 odds row with "Forme récente" (recent form WWLDW vs LWDWW). No betting content anywhere (Loi 09-08).

### Card 2 — Classements (rankings)

```
┌─────────────────────────────────────┐
│ [FIFA logo]  Classement FIFA      → │
│ [CAF logo]   Classement CAF       → │
└─────────────────────────────────────┘
```

Two tiles. Africa-first (CAF), drops UEFA from Sofascore's pattern.

### Card 3 — Joueur de la saison

```
┌────────────────────────────────────────────────┐
│ 🏆  Compétition: Botola Pro ▾                   │
│                                                 │
│ Dropdown options:                              │
│ - Botola Pro (default — Morocco-first)         │
│ - WC 2026 / WC Qualifications                  │
│ - AFCON 2027                                   │
│ - CAF Champions League                         │
│ - UCL / EPL / LaLiga / Ligue 1 / etc.          │
│                                                 │
│ 1  [photo]  Hakimi   · PSG       8.42          │
│ 2  [photo]  Diaz     · Bayern    8.18          │
│ 3  [photo]  Ziyech   · Galatasaray 7.95        │
│                                                 │
│ Voir tous les classements →                    │
└────────────────────────────────────────────────┘
```

Default competition: Botola Pro (Morocco-first). Dropdown switches the source competition.

### Card 4 — Comparer joueurs

```
┌─────────────────────────────────────────────────────┐
│ [Hakimi]  [Ziyech]  [Mazraoui]  [Diaz]  [En-Nesyri]│
│   ↑ default 5 Moroccan players abroad               │
│                                                     │
│ Comparer les joueurs →                              │
└─────────────────────────────────────────────────────┘
```

### Card 5 — Comparer équipes

```
┌─────────────────────────────────────────────────────┐
│ [🇲🇦]  [🇩🇿]  [🇹🇳]  [🇸🇳]  [🇪🇬]                       │
│   ↑ Morocco + African rivals + Egypt                │
│                                                     │
│ Comparer les équipes →                              │
└─────────────────────────────────────────────────────┘
```

### Card 6 — Matchs à suivre cette semaine

```
┌─────────────────────────────────────────────────────┐
│ Matchs à suivre cette semaine                       │
│                                                     │
│ • Maroc – Comores                                   │
│   WC Qualifications · sam 17:00                     │
│                                                     │
│ • Wydad – Sundowns                                  │
│   CAF Champions League SF · sam 20:00               │
│                                                     │
│ • PSG – Real Madrid                                 │
│   UCL Final · sam 21:00                             │
└─────────────────────────────────────────────────────┘
```

Replaces Sofascore's "Featured odds" card. Selection: Morocco-relevant fixtures across competitions, ranked by Morocco signal + match stakes (final, derby, qualifier rank).

### Card 7 — Top performances

```
┌─────────────────────────────────────────────────────┐
│ Top performances           ℹ️                       │
│                                                     │
│ 1  [photo]  Diasty   FW   2-1   9.3                 │
│ 2  [photo]  Kasami   MF   3-2   9.1                 │
│ 3  [photo]  M'Hand   MF   4-1   9.1                 │
│                                                     │
│ Voir plus ▼                                         │
└─────────────────────────────────────────────────────┘
```

Sofascore ratings or equivalent metric. Coverage check needed for Algeria/Tunisia (statistics_fixtures=false per API-Football).

### Card 8 — Newsletter

```
┌─────────────────────────────────────────────────────┐
│ "Recevez l'actu marocaine"                          │
│                                                     │
│ [email input]                       [S'abonner →]   │
└─────────────────────────────────────────────────────┘
```

Replaces Sofascore's Torneo CTA. Implementation deferred to Phase 5+ (newsletter infrastructure decision).

### About SEO text block

```
À propos

Atlas Kings couvre 50+ compétitions axées sur le football marocain —
Botola Pro, Coupe du Trône, équipe nationale, joueurs marocains à
l'étranger, Coupe du Monde 2026 (co-organisée par le Maroc), AFCON
2025 (au Maroc), WAFCON, compétitions CAF, top-5 ligues européennes.

Liens directs: Botola Pro · AFCON · WC 2026 · équipe du Maroc · comparer
joueurs · comparer équipes.
```

Multi-paragraph, locale-specific, with inline links for SEO.

---

## Section 7 — Right rail (~280px, ≥1344px only)

Seven mini widgets stacked vertically. Order locked:

### Widget 1 — Botola Pro top 6

```
┌─ Botola Pro · Maroc ──────────┐
│ #  Équipe         P    PTS    │
│ 1  Maghreb Fès   20     41    │
│ 2  AS FAR        20     40    │
│ 3  Raja CA       20     39    │
│ 4  Wydad AC      20     37    │
│ 5  Renaissance   20     37    │
│ 6  OCS Settat    20     35    │
│  Voir tout →                  │
└───────────────────────────────┘
```

### Widget 2 — UCL top scorers

```
┌─ UCL Top scorers ─────────────┐
│ #  Joueur          Buts       │
│ 1  Mbappé             12      │
│ 2  Salah              10      │
│ 3  Hakimi              8      │
│ 4  Vinicius            8      │
│ 5  Kane                7      │
│ 6  Foden               7      │
│  Voir tout →                  │
└───────────────────────────────┘
```

Placement at position 2 because Moroccan players abroad (Hakimi, Diaz, Mazraoui) appear prominently in UCL — highest Morocco signal among club-level rankings.

### Widget 3 — Premier League top 6

### Widget 4 — LaLiga top 6

### Widget 5 — Ligue 1 top 6

### Widget 6 — Bundesliga top 6

### Widget 7 — Serie A top 6

Each widget identical shape: header (logo + competition + country + "→") + column header (# Équipe P PTS) + 6 rows + "Voir tout →" link. Total height ~230px per widget.

### Right rail behavior

- Scrolls with page (no sticky behavior)
- Hidden at viewports <1344px (returns to 2-column layout)
- Replaces Sofascore's ad slot — Atlas Kings uses for editorial content (Loi 09-08 prohibits betting; no ad revenue model in v2)

---

## Section 8 — Footer

Dark background, Atlas Royal palette.

### Row 1 — Editorial + quick-link columns

Two zones side-by-side:

**Left zone (~45% width)**:

- À propos — multi-paragraph SEO description of Atlas Kings scope
- Dernières actualités — article titles list (Phase 12+ stub for now)

**Right zone (~55% width, 3 cols × 2 rows)**:

Row A:
- Football: Botola Pro / Botola Pro 2 / Coupe du Trône / AFCON / CAF CL / CAF Confed / UCL / UEL / EPL / LaLiga / Bundesliga / Serie A / Ligue 1
- Sélections: Maroc / WC 2026 / AFCON 2025 / WAFCON 2026 / Qualifications WC / CHAN / Olympics 2028
- Joueurs: Hakimi / Ziyech / Mazraoui / En-Nesyri / Diaz / Aguerd / Sabiri / Saiss

Row B:
- Tendances: Botola live / AFCON live / Atlas Lions / Hakimi PSG / WC 2026 / WAFCON
- Scores: Botola Pro / AFCON / WAFCON / Coupe du Trône / WC Qualifications / Top 5 EU
- Outils: Comparer joueurs / Comparer équipes / Calendrier / Saisons / Outils statistiques

### Row 2 — Bottom bar (darker shade)

```
[Atlas Kings logo]   |   Mentions légales · Politique de confidentialité · Contact
                         [X] [Instagram] [YouTube] [TikTok]

"Ce site se conforme à la Loi 09-08 sur la protection des données personnelles."
© 2026 Atlas Kings — Tous droits réservés
```

NOT present:
- 18+ gambling notice (no betting content)
- "Download app" buttons / app store links (no app until Phase 12+)
- Responsible gambling messaging

---

## Mobile (375px)

### Layout

```
[ADAPTIVE TOP STRIP ~40px]
[TOPBAR ~56px condensed]   ← [≡] [Atlas Kings]   🔍 EN ☾
[EDITORIAL HERO ~64px condensed]
[Filter tabs row]            ← [Tous][Favoris][Compétitions] [<Aujourd'hui>]
[Filter pills row]            ← [Tous][Live(N)][Terminés][À venir]
[FIXTURE CARD single column]
[EDITORIAL CARDS stacked]
[RIGHT RAIL WIDGETS stacked below editorial]
[About SEO block]
[FOOTER vertical stack]
[FIXED BOTTOM TAB BAR ~56px]  ← [⚽Matchs●][🔍][⭐][⚙️]
```

### Hamburger drawer

Opens from `[≡]` (left side). Contains:
- Home
- Botola Pro
- WC 2026 (featured slot 1)
- WAFCON 2026 (featured slot 2)
- Compétitions (with mega-menu structure as accordion)
- Language switcher
- Theme toggle

### Bottom tab bar (4 tabs)

- ⚽ Matchs (active on homepage)
- 🔍 Recherche
- ⭐ Favoris
- ⚙️ Paramètres

NOT included (vs Sofascore's 5 tabs):
- Fantasy (out of scope)
- Profile (Phase 10 auth)

---

## All locked decisions summary

| Element | Decision |
|---|---|
| Adaptive top strip | 4 modes (countdown / live / upcoming ticker without player names / fallback), 40px sticky |
| Topbar | Single row, 6 nav items + 3 utility icons. Single 64px row sticky top:40px |
| Featured slots | Auto-promoted via getFeaturedCompetitions() from CALENDAR.md. Today: WC 2026 🔥 + WAFCON 2026 |
| Compétitions mega-menu | Tier groupings (Morocco / Africa / International / Europe / MENA), driven by is_currently_visible flag |
| Editorial hero | 5 modes priority-driven, no timer. Pusher live updates. 60s cache for non-live |
| Fixture list | Left column ~540px, view-mode tabs + single-day nav, filter pills, NO odds toggle |
| Fixture rows | 3 states: upcoming gray / live red + animation / finished bold winner + 45% opacity loser |
| Competition group sort | Tier 2 Morocco > Tier 3 African > Tier 1 FIFA > Tier 4 EU men > Tier 5 women + Olympic > Tier 6 MENA |
| Center editorial cards | 8 cards: Featured carousel → Rankings → Joueur saison → Compare players → Compare teams → Matchs à suivre → Top performances → Newsletter → About SEO |
| Right rail | 7 widgets: Botola Pro top 6 → UCL top scorers → EPL → LaLiga → Ligue 1 → Bundesliga → Serie A (all top 6 rows). Only at ≥1344px viewport |
| Footer | 3-zone desktop (brand+editorial / quick-link columns / utility), vertical stack mobile. NO 18+, NO app store |
| Mobile bottom tab bar | 4 tabs: Matchs / Recherche / Favoris / Paramètres |
| Typography | IBM Plex Sans (Latin) + IBM Plex Sans Arabic + Fraunces (display) — Phase 4.5+ implementation |
| Compliance | Loi 09-08 footer notice, no betting/odds anywhere, no Sign In until Phase 10 |
| Live data | Pusher Channels (deployed Phase 3, ~120ms latency) for hero live + fixture row live state + Mode 2 strip |
| Caching | Server-side 60s for non-live content. Pusher channels per fixture for live state |
| Placeholder content | Real team names from seeded Neon DB (no "Coming soon"), real-style scores, real player names |

---

## Component inventory (for Phase 4.5 implementation)

New components to build in Phase 4.5 (homepage shell):

| Component | Location | Reuse on other pages |
|---|---|---|
| AdaptiveTopStrip | src/components/chrome/AdaptiveTopStrip.tsx | All pages |
| Topbar (updates) | src/components/chrome/TopNav.tsx | All pages |
| FeaturedSlotsLogic | src/lib/competitions/featured-slots.ts | Topbar driver |
| CompetitionsMegaMenu | src/components/chrome/CompetitionsMegaMenu.tsx | Topbar |
| EditorialHero | src/components/chrome/EditorialHero.tsx | Homepage only |
| HeroContentSelector | src/lib/homepage/hero-content.ts | Hero driver |
| SeoBreadcrumb | src/components/chrome/SeoBreadcrumb.tsx | All pages |
| FixtureListCard | src/components/homepage/FixtureListCard.tsx | Homepage |
| ViewModeTabs | src/components/homepage/ViewModeTabs.tsx | Homepage |
| SingleDayNavigator | src/components/homepage/SingleDayNavigator.tsx | Homepage + calendar pages later |
| FilterPills | src/components/homepage/FilterPills.tsx | Homepage |
| CompetitionGroupHeader | src/components/fixtures/CompetitionGroupHeader.tsx | Homepage + competition pages |
| FixtureRow | src/components/fixtures/FixtureRow.tsx | Homepage + competition pages + team pages |
| FeaturedMatchCarousel | src/components/editorial/FeaturedMatchCarousel.tsx | Homepage |
| RankingsTiles | src/components/editorial/RankingsTiles.tsx | Homepage |
| PlayerOfSeasonCard | src/components/editorial/PlayerOfSeasonCard.tsx | Homepage + competition pages |
| ComparePlayersCard | src/components/editorial/ComparePlayersCard.tsx | Homepage + player pages |
| CompareTeamsCard | src/components/editorial/CompareTeamsCard.tsx | Homepage + team pages |
| MatchesToWatchCard | src/components/editorial/MatchesToWatchCard.tsx | Homepage |
| TopPerformancesCard | src/components/editorial/TopPerformancesCard.tsx | Homepage |
| NewsletterCard | src/components/editorial/NewsletterCard.tsx | Homepage + footer area |
| RightRailMiniStandings | src/components/widgets/RightRailMiniStandings.tsx | Homepage right rail + other pages |
| RightRailTopScorers | src/components/widgets/RightRailTopScorers.tsx | Homepage + competition pages |
| MobileBottomTabBar | src/components/chrome/MobileBottomTabBar.tsx | All pages mobile |
| MobileHamburgerDrawer | src/components/chrome/MobileHamburgerDrawer.tsx | All pages mobile |
| Footer (updates) | src/components/chrome/Footer.tsx | All pages |

Components reusable from Phase 4 (no changes needed):
- LiveTicker (renders null when empty — survives, fold into row-level styling in Phase 5+)

Components kept for Phase 6+ reuse but removed from homepage:
- DateStrip (Phase 4 multi-day strip — keep file for calendar/results pages)
- LeftRail (Phase 4 280px sidebar — rebuild at 360px for inner-page shell)

---

## Open questions for Phase 4.5 implementation

| Question | Owner | Decision target |
|---|---|---|
| Search behavior — full-page overlay or inline expand? | UX | During 4.5a implementation |
| Right rail "Voir tout →" — opens overlay or routes to competition page? | UX | 4.5b implementation |
| Editorial hero click → match detail or competition page? | UX | 4.5a implementation |
| Newsletter signup — defer to Phase 12+ or implement Phase 5 alongside auth groundwork? | Product | Phase 5 planning |
| Compétitions mega-menu mobile — full-page modal or expandable accordion? | UX | 4.5a implementation |
| "Joueur du mois" rotation cadence — when should we cycle the displayed player? Hero mode E content rotation? | UX | Phase 5 |
| Top performances coverage — what to render when API-Football statistics_fixtures=false (Algeria, Tunisia)? | Engineering | Phase 5 ingestion |
| Featured match carousel — server-render carousel state vs client-only? | Engineering | 4.5b implementation |

---

## Update log

- 2026-05-13 — Initial schematic locked after Phase 4.5+ design session. Sofascore /football used as reference (`docs/research/sofascore-analysis-atlas-kings-phase4-5.md`). Tournament data sourced from `docs/tournaments/CALENDAR.md`. All decisions documented in this file.
- (Append future updates here with date and change description)
