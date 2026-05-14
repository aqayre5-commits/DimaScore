# Atlas Kings Homepage Schematic

Locked schematic for `/[locale]` (homepage / football landing). All decisions consolidated from Phase 4.5+ design session 2026-05-13. SEO retrofit applied 2026-05-13 after Page 2 keyword analysis revealed common patterns to align across all pages.

**Status**: Locked, ready for Phase 4.5 implementation
**Last updated**: 2026-05-13 (v2 — SEO retrofit)
**Reference**: `docs/research/sofascore-analysis-atlas-kings-phase4-5.md` (484 lines, Sofascore visual analysis)
**Tournament data source**: `docs/tournaments/CALENDAR.md`
**Keyword data source**: Ahrefs Morocco SERP analysis (363K SV) + Arabic parallel-volume analysis
**Companion schematic**: `docs/schematics/competition-league.md` (shares URL pattern, SEO approach, structured-data approach)

---

## Page identity

This is the canonical Atlas Kings landing page. `/[locale]` resolves directly to this page; Football is the default sport. No separate `/football` URL.

The homepage is a **fixture browser plus editorial discovery surface**, not an inner page. It does not use the inner-page 3-column shell that competition / team / player / match-detail pages use (see `docs/schematics/competition-league.md` and BACKLOG entries for Phase 6+ inner-page shell). It has its own layout described below.

### URL and SEO scope

The homepage URL is intentionally minimal: `/fr`, `/en`, `/ar`. No country segment, no entity slug — the homepage isn't an entity. The locale-translated-slug pattern that Page 2 introduces only applies to inner pages (competitions, teams, players, matches).

The homepage targets **navigational + generic-football** keyword clusters, not entity queries:
- Navigational: "atlas kings", "atlaskings.com"
- Generic high-volume: "football aujourd'hui", "matchs en direct", "scores football maroc", "résultats foot direct" + Arabic and English equivalents
- Broad category: "كرة القدم اليوم", "نتائج مباشرة", "Botola live", "WC 2026"

Entity queries ("botola pro classement", "équipe du maroc", "hakimi", "wydad ac") route to Pages 2-5 via the topbar nav, mega-menu, or internal links from this page.

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
│ H1 + INTRO BLOCK (~60-80px, scrolls away — replaces v1 SEO breadcrumb)       │
├──────────────────────┬───────────────────────────┬──────────────────────────┤
│ FIXTURE LIST ~540px  │ EDITORIAL CARDS ~440-500  │ RIGHT RAIL ~280px        │
│ (left column)        │ (center column)           │ (≥1344px only)           │
│ H2 inside            │ H2 inside each card       │ H2 inside each widget    │
├──────────────────────┴───────────────────────────┴──────────────────────────┤
│ ABOUT CARD (expanded — 6 H2 sections + 8 FAQ entries)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ FOOTER (dark)                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

Layout change from v1: SEO breadcrumb (22px line) replaced by H1+intro block (60-80px). About card expanded from 2 paragraphs to 6 H2 sections + 8 FAQ entries (~600-900 words per locale).

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

Each entry routes to its locale-translated URL per the pattern locked in `docs/schematics/competition-league.md`:
- `Botola Pro` → `/fr/competition/maroc/botola-pro`
- `Premier League` → `/fr/competition/angleterre/premier-league`
- `FIFA World Cup 2026` → `/fr/competition/fifa/coupe-du-monde-2026`
- etc.

---

## Section 3 — SEO and indexability

The homepage is the primary indexing target for brand + generic-football queries across all three locales. This section documents the SEO machinery that lives in the page head and body alongside the visible layout.

### Per-locale title and meta description

```
fr: <title>Football aujourd'hui — scores en direct, Botola Pro, WC 2026, 
    Atlas Lions | Atlas Kings</title>
    <meta name="description" content="Suivez le football marocain et 
    mondial en direct: scores Botola Pro, matchs Atlas Lions, qualifications 
    Coupe du Monde 2026, AFCON, WAFCON, classements et statistiques 
    mises à jour en temps réel." />

en: <title>Football today — live scores, Botola Pro, WC 2026, 
    Atlas Lions | Atlas Kings</title>
    <meta name="description" content="Follow Moroccan and world football 
    live: Botola Pro scores, Atlas Lions fixtures, World Cup 2026 qualifiers, 
    AFCON, WAFCON, standings and statistics updated in real time." />

ar: <title>كرة القدم اليوم — نتائج مباشرة، البطولة الاحترافية، 
    كأس العالم 2026، أسود الأطلس | أطلس كينغز</title>
    <meta name="description" content="تابعوا كرة القدم المغربية والعالمية 
    مباشرة: نتائج البطولة الاحترافية، مباريات أسود الأطلس، تصفيات كأس العالم 
    2026، كأس أمم إفريقيا، كأس أمم إفريقيا للسيدات، الترتيب والإحصائيات 
    محدثة في الوقت الفعلي." />
```

Title pattern: `{topical_anchor} — {modifier_1}, {modifier_2}, {modifier_3}, {modifier_4} | Atlas Kings`.

Modifiers tuned to homepage-appropriate keywords (broad, not entity-specific):
- French: `scores en direct / Botola Pro / WC 2026 / Atlas Lions`
- English: `live scores / Botola Pro / WC 2026 / Atlas Lions`
- Arabic: `نتائج مباشرة / البطولة الاحترافية / كأس العالم 2026 / أسود الأطلس`

**Critical Arabic note**: title includes both formal entity term ("البطولة الاحترافية") and emotional fan term ("أسود الأطلس") per keyword analysis. "أسود الأطلس" is the dominant Arabic brand for the national team — 70-80% of casual fan queries use it.

### hreflang annotations

```html
<link rel="alternate" hreflang="fr" href="https://atlaskings.com/fr" />
<link rel="alternate" hreflang="en" href="https://atlaskings.com/en" />
<link rel="alternate" hreflang="ar" href="https://atlaskings.com/ar" />
<link rel="alternate" hreflang="x-default" href="https://atlaskings.com/fr" />
```

`x-default` points to French (primary Morocco audience language).

### Structured data (JSON-LD)

Three blocks in `<head>`:

**1. WebSite + SearchAction** — enables Google sitelinks search box:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Atlas Kings",
  "alternateName": ["أطلس كينغز", "Atlas Kings"],
  "url": "https://atlaskings.com/fr",
  "inLanguage": ["fr", "en", "ar"],
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://atlaskings.com/fr/recherche?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

**2. Organization** — brand authority:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Atlas Kings",
  "url": "https://atlaskings.com",
  "logo": "https://atlaskings.com/atlas-kings-logo.svg",
  "sameAs": [
    "https://x.com/atlaskings",
    "https://www.instagram.com/atlaskings",
    "https://www.youtube.com/@atlaskings",
    "https://www.tiktok.com/@atlaskings"
  ]
}
```

**3. SportsEvent array** — per-fixture rich snippets for fixtures displayed on the page (today + featured carousel). Generated server-side from the same data driving the fixture list.

```json
{
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  "name": "Wydad AC vs Raja CA",
  "startDate": "2026-05-17T20:00:00+01:00",
  "sport": "https://schema.org/Soccer",
  "location": {
    "@type": "SportsActivityLocation",
    "name": "Stade Mohammed V"
  },
  "competitor": [
    { "@type": "SportsTeam", "name": "Wydad AC" },
    { "@type": "SportsTeam", "name": "Raja CA" }
  ]
}
```

Adds rich snippet eligibility for fixture queries ("when is wydad raja", "next botola match"). Sofascore uses this aggressively.

### Per-locale image alt text

All images on the page carry locale-specific alt text:

```
Crest:        alt="Logo du Wydad AC" (fr)
              alt="Wydad AC crest" (en)
              alt="شعار الوداد الرياضي" (ar)

Player photo: alt="Photo de Achraf Hakimi, défenseur de l'équipe nationale du Maroc" (fr)
              alt="Achraf Hakimi photo, Morocco national team defender" (en)
              alt="صورة أشرف حكيمي، مدافع المنتخب المغربي" (ar)

Competition logo: alt="Logo de la Botola Pro" (fr)
                  alt="Botola Pro logo" (en)
                  alt="شعار البطولة الاحترافية" (ar)
```

Seed data needs `name_fr / name_en / name_ar` fields for teams, players, competitions. Phase 5 ingestion concern.

### Editorial hero — formalize semantic markup

Editorial hero modes (Section 5) currently render as styled text. SEO retrofit requires semantic HTML elements rather than styled spans:

```html
<!-- Mode A — Morocco-relevant match LIVE -->
<section class="editorial-hero" data-mode="live">
  <h2 class="hero-title">Maroc 2 – 1 Brésil</h2>
  <p class="hero-subtitle">WC 2026 · 67' · Stade Azteca</p>
</section>

<!-- Mode C — Botola Pro highlight -->
<section class="editorial-hero" data-mode="botola-highlight">
  <h2 class="hero-title">Wydad AC – Raja CA · Derby de Casablanca</h2>
  <p class="hero-subtitle">Botola Pro · Samedi 20:00</p>
</section>
```

Visible styling unchanged; underlying HTML promoted from spans to `<h2>` + `<p>`. Adds crawl-structure value.

---

## Section 4 — H1 + intro block (~60-80px)

**NEW in v2 — replaces v1's single-line SEO breadcrumb.**

Sits between the editorial hero and the 3-column zone. Scrolls away with content (not sticky).

### Per-locale H1 + intro paragraph

```
fr: <h1>Football marocain et international en direct</h1>
    <p>Atlas Kings suit la Botola Pro, l'équipe nationale du Maroc, les 
    qualifications de la Coupe du Monde 2026, AFCON, WAFCON et les 
    meilleures compétitions européennes. Scores en direct, classements et 
    statistiques mises à jour à la minute.</p>

en: <h1>Moroccan and world football live</h1>
    <p>Atlas Kings covers Botola Pro, the Morocco national team, World Cup 
    2026 qualifiers, AFCON, WAFCON, and Europe's top leagues. Live scores, 
    standings, and statistics updated to the minute.</p>

ar: <h1>كرة القدم المغربية والعالمية مباشرة</h1>
    <p>أطلس كينغز يغطي البطولة الاحترافية وأسود الأطلس وتصفيات كأس العالم 
    2026 وكأس أمم إفريقيا وأهم الدوريات الأوروبية. نتائج مباشرة، ترتيب 
    وإحصائيات محدثة في كل دقيقة.</p>
```

### Visual treatment

- H1: ~24-28px, IBM Plex Sans semibold (600), `var(--color-text-primary)`, line-height 1.2
- Intro paragraph: ~14-15px, regular (400), `var(--color-text-secondary)`, line-height 1.5
- Max-width ~720px for readability
- RTL flip applied automatically in Arabic locale
- Left-aligned (LTR) / right-aligned (RTL)
- 24px horizontal padding matching page gutter
- 16-24px vertical padding inside the block

### What this replaces

v1 Section 4 documented an "SEO breadcrumb" as a ~22px single line:

```
Football aujourd'hui — scores en direct, Botola Pro, AFCON Quals, WC 2026
```

That was a keyword-stuffing zone disguised as a breadcrumb. v2 formalizes it as a proper H1 + intro block — editorially honest, equally keyword-loaded, and gives Google a real H1 element. Net vertical increase ~40-60px (acceptable; user still sees most fixture list above the fold).

### Why this matters for SEO

The H1 is Google's strongest single signal for what a page is about. Without one, Google infers from other signals (title, meta, body content) — which works but is suboptimal. With a proper H1 + intro paragraph above the 3-column content zone, the homepage gets:
- Clear semantic anchor for the page's topical focus
- Above-the-fold keyword surface (Google weighs content above the fold higher)
- Crawl-structure improvement (H1 → H2 → H3 hierarchy through the page)

---

## Section 5 — Editorial hero (~80px)

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

Navigates to relevant page — match detail / competition / team — depending on mode. Uses locale-translated URLs per the pattern locked in competition-league.md.

### Semantic markup (NEW in v2)

Hero content renders as `<h2>` + `<p>` rather than styled spans (see Section 3 — SEO and indexability for the full markup spec).

---

## Section 6 — Left column / Fixture list (~540px)

### H2 above card header (NEW in v2)

```
fr: <h2>Matchs et résultats aujourd'hui</h2>
en: <h2>Matches and results today</h2>
ar: <h2>المباريات والنتائج اليوم</h2>
```

H2 updates per day navigation:
- "Aujourd'hui" → `Matchs et résultats aujourd'hui`
- "Demain" → `Matchs et résultats demain`
- Specific date → `Matchs et résultats — Samedi 17 mai`

Visible heading, ~18-20px, IBM Plex Sans semibold (600). Sits above the view-mode tabs.

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

### Clickable sub-elements inside the group header

- **Competition logo + competition name** → that competition's page (Page 2 or 3, locale-translated URL per competition-league.md pattern)
- **Country flag + country name** → country index page (Phase 6+ feature page at `/[locale]/pays/[country-slug]`). Until that page ships, render as non-clickable text — no broken links.
- **Match count badge** → non-clickable label
- **Collapse chevron** → collapses/expands the group in-place (no navigation)

Sofascore treats competition name and country name as two separate click targets in the same header. We mirror that pattern, with the country segment following the Phase 6+ deferred-affordance rule (consistent with Page 2 Section 4 breadcrumb and Section 5 page header country routing).

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

Crest alt text per locale (see Section 3). Team name is clickable → team page (Page 4 URL).

### Empty state

If zero fixtures today: short text "Aucun match aujourd'hui · Voir demain →" — not page-filling.

---

## Section 7 — Center column / Editorial cards (~440-500px)

Eight cards plus an About SEO block, stacked vertically with ~16px spacing.

Each card gets an `<h2>` heading (NEW in v2) for crawl structure.

### Card 1 — Featured match carousel

```
H2: Matchs à la une (fr) / Featured matches (en) / المباريات المميزة (ar)

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

### Clickable sub-elements inside each carousel slide

Each carousel slide has multiple distinct click targets:

- **Slide body (default tap area)** → that match's detail page (Page 6)
- **Competition name header inside the slide** (e.g. "Botola Pro · Journée 21") → that competition's page (Page 2 or 3)
- **Team crests + team names** → corresponding team pages (Page 4)
- **"Qui va gagner?" vote buttons** → submit vote, show aggregate % bars (in-card, client-side, no auth)
- **Forme récente W/D/L pills** → non-clickable (pills here are summary indicators, not match links — diverges from standings table form pills which DO route to match detail per Page 2 Edit 1a)
- **‹ Précédent / Suivant › arrows** → cycle carousel in-card
- **Dot indicators ●●●●●** → jump to specific carousel slide

Rationale on Forme récente non-clickability: in a carousel slide context, the WWLDW pills are illustrative of recent form (5 matches per team summarized at-a-glance). Making them clickable would create 10 micro-targets in a small space, fragmenting the slide's primary CTA (open match detail). The form pill click affordance lives in the standings table where it makes more sense as a primary navigation.

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
H2: Classements internationaux (fr) / International rankings (en) / التصنيفات الدولية (ar)

┌─────────────────────────────────────┐
│ [FIFA logo]  Classement FIFA      → │
│ [CAF logo]   Classement CAF       → │
└─────────────────────────────────────┘
```

Two tiles, two separate destinations. Africa-first (CAF), drops UEFA from Sofascore's pattern.

### Clickable destinations

- **Classement FIFA tile (FIFA logo + label + arrow)** → FIFA rankings page (Phase 6+ feature page at `/[locale]/classements/fifa`). Until shipped, tile renders with the visual treatment but routes to a "Bientôt disponible" stub or is non-clickable per deferred-affordance rule.
- **Classement CAF tile (CAF logo + label + arrow)** → CAF rankings page (Phase 6+ feature page at `/[locale]/classements/caf`). Same deferred-affordance treatment.

Sofascore confirms two distinct destinations for analogous tiles (FIFA Rankings → `/football/rankings/fifa`, UEFA Rankings → `/football/rankings/uefa`). We replicate the two-tile pattern with CAF replacing UEFA per Africa-first orientation.

### Card 3 — Joueur de la saison

```
H2: Joueurs de la saison (fr) / Players of the season (en) / لاعبو الموسم (ar)

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

### Clickable destinations

- **Competition dropdown** → in-card source change (no navigation)
- **Player photo + name + rating row** → that player's page (Page 5)
- **Club name inline (e.g. "PSG", "Bayern")** → that team's page (Page 4)
- **"Voir tous les classements →"** → rankings hub (Phase 6+ feature page at `/[locale]/classements`). The hub aggregates all leaderboard surfaces: player ratings per competition, top scorers per competition, top assists per competition, FIFA rankings, CAF rankings.

Sofascore's analogous card has a "View past winners" link routing to a dedicated POTS archive page (`/football/player-of-the-season`). We defer the POTS archive concept to Phase 6+ as a future addition under the rankings hub family — not a Phase 4.5 deliverable.

### Card 4 — Comparer joueurs

```
H2: Comparer les joueurs (fr) / Compare players (en) / مقارنة اللاعبين (ar)

┌─────────────────────────────────────────────────────┐
│ [Hakimi]  [Ziyech]  [Mazraoui]  [Diaz]  [En-Nesyri]│
│   ↑ default 5 Moroccan players abroad               │
│                                                     │
│ Comparer les joueurs →                              │
└─────────────────────────────────────────────────────┘
```

### Clickable destinations — hybrid pattern

- **Individual player chip (e.g. [Hakimi])** → pre-loaded comparison page with that player in slot 1, slot 2 empty awaiting selection. URL: `/[locale]/comparer/joueurs?p1=hakimi` (Phase 6+ feature page; until shipped, chip routes to that player's page Page 5 as fallback)
- **"Comparer les joueurs →" link** → empty comparison selector page where the user picks both players (Phase 6+ at `/[locale]/comparer/joueurs`)

The hybrid pattern: chips work as shortcuts (start comparing with this player); the explicit link is the generic entry point. Sofascore uses pattern (a) where the entire card is one link to the empty selector — we diverge to give the visible player chips actual affordance.

### Card 5 — Comparer équipes

```
H2: Comparer les équipes (fr) / Compare teams (en) / مقارنة الفرق (ar)

┌─────────────────────────────────────────────────────┐
│ [🇲🇦]  [🇩🇿]  [🇹🇳]  [🇸🇳]  [🇪🇬]                       │
│   ↑ Morocco + African rivals + Egypt                │
│                                                     │
│ Comparer les équipes →                              │
└─────────────────────────────────────────────────────┘
```

### Clickable destinations — hybrid pattern (same as Card 4)

- **Individual team chip (e.g. [🇲🇦 Maroc])** → pre-loaded comparison page with that team in slot 1, slot 2 empty. URL: `/[locale]/comparer/equipes?t1=maroc` (Phase 6+). Until shipped, chip routes to that team's page (Page 4) as fallback
- **"Comparer les équipes →" link** → empty comparison selector page (Phase 6+ at `/[locale]/comparer/equipes`)

Same hybrid rationale as Card 4 — chips function as shortcuts; explicit link is generic entry.

### Card 6 — Matchs à suivre cette semaine

```
H2: Matchs à suivre cette semaine (fr) / Matches to watch this week (en) / مباريات الأسبوع (ar)

┌─────────────────────────────────────────────────────┐
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
H2: Top performances (fr) / Top performances (en) / أفضل الأداءات (ar)

┌─────────────────────────────────────────────────────┐
│ ℹ️                                                  │
│                                                     │
│ 1  [photo]  Diasty   FW   2-1   9.3                 │
│ 2  [photo]  Kasami   MF   3-2   9.1                 │
│ 3  [photo]  M'Hand   MF   4-1   9.1                 │
│                                                     │
│ Voir plus ▼                                         │
└─────────────────────────────────────────────────────┘
```

Sofascore ratings or equivalent metric. Coverage check needed for Algeria/Tunisia (statistics_fixtures=false per API-Football).

### Clickable destinations

- **Player photo + name row** → that player's page (Page 5)
- **Position label + score reference (e.g. "FW · 2-1")** → that specific match's detail page (Page 6) for context
- **"Voir plus ▼"** → in-card expansion (no navigation) showing more performance rows; if rows exceed N (TBD in Phase 5+ implementation), eventually routes to performances leaderboard at `/[locale]/classements/performances` (Phase 6+).
- **ⓘ info icon** → tooltip explaining the rating metric (no navigation)

### Card 8 — Newsletter

```
H2: Recevez l'actualité (fr) / Get the latest (en) / استقبل المستجدات (ar)

┌─────────────────────────────────────────────────────┐
│ "Recevez l'actu marocaine"                          │
│                                                     │
│ [email input]                       [S'abonner →]   │
└─────────────────────────────────────────────────────┘
```

Replaces Sofascore's Torneo CTA. Implementation deferred to Phase 5+ (newsletter infrastructure decision).

---

## Section 8 — Right rail (~280px, ≥1344px only)

Seven mini widgets stacked vertically. Each gets an `<h2>` heading (NEW in v2).

### Widget 1 — Botola Pro top 6

```
<h2>Classement Botola Pro</h2>

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

"Voir tout →" routes to `/fr/competition/maroc/botola-pro` (Page 2).

### Widget 2 — UCL top scorers

```
<h2>Meilleurs buteurs UCL</h2>

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

H2: `Classement Premier League` / `Premier League standings` / `ترتيب الدوري الإنجليزي الممتاز`

### Widget 4 — LaLiga top 6

H2: `Classement LaLiga` / `LaLiga standings` / `ترتيب الدوري الإسباني`

### Widget 5 — Ligue 1 top 6

H2: `Classement Ligue 1` / `Ligue 1 standings` / `ترتيب الدوري الفرنسي`

### Widget 6 — Bundesliga top 6

H2: `Classement Bundesliga` / `Bundesliga standings` / `ترتيب الدوري الألماني`

### Widget 7 — Serie A top 6

H2: `Classement Serie A` / `Serie A standings` / `ترتيب الدوري الإيطالي`

Each widget identical shape: H2 + header (logo + competition + country + "→") + column header (# Équipe P PTS) + 6 rows + "Voir tout →" link. Total height ~230px per widget. Each "Voir tout →" links to the corresponding Page 2 competition URL (locale-translated).

### Right rail behavior

- Scrolls with page (no sticky behavior)
- Hidden at viewports <1344px (returns to 2-column layout)
- Replaces Sofascore's ad slot — Atlas Kings uses for editorial content (Loi 09-08 prohibits betting; no ad revenue model in v2)

---

## Section 9 — About card (EXPANDED in v2)

Full-width card below the 3-column zone, above the footer. Long-form keyword-bearing content for long-tail SEO surface.

v1 had 2 paragraphs; v2 expands to 6 H2 sections + 8 FAQ entries. ~600-900 words per locale.

### Structure

```
## À propos d'Atlas Kings

Atlas Kings est la plateforme de référence pour le football marocain et 
international. Lancée en 2026, elle couvre plus de 36 compétitions, 320+ 
clubs et 6,000+ joueurs avec des données en temps réel, des classements 
mis à jour à chaque journée, et une couverture éditoriale axée sur le 
football vu du Maroc.

## Compétitions couvertes

Atlas Kings suit la Botola Pro Inwi (1ère division), la Botola Pro 2 et la 
Coupe du Trône au Maroc; la CAF Champions League, la Coupe de la 
Confédération CAF, l'AFCON et la WAFCON pour l'Afrique; la Coupe du Monde 
2026 (co-organisée par le Maroc), les qualifications FIFA, et la Coupe du 
Monde U-17 2026 organisée au Qatar; les cinq grandes ligues européennes 
(Premier League, LaLiga, Bundesliga, Serie A, Ligue 1); l'UEFA Champions 
League, Europa League et Conference League; et les principales compétitions 
MENA (AFC Asian Cup, Saudi Pro League, Egyptian Premier).

## Le football marocain

La Botola Pro réunit 16 clubs, dont les rivalités historiques entre Wydad 
AC et Raja CA, le derby de Casablanca le plus suivi d'Afrique du Nord. 
AS FAR, Maghreb Fès, Renaissance Berkane et Hassania Agadir complètent 
le haut du classement. L'équipe nationale du Maroc — les Lions de l'Atlas — 
joue ses matchs au Complexe Mohammed V de Rabat. Sur la scène continentale, 
Wydad AC est le club marocain le plus titré en CAF Champions League avec 
trois victoires.

## La Coupe du Monde 2026

Le Maroc co-organise la Coupe du Monde 2026 aux côtés des États-Unis, du 
Canada et du Mexique. Six stades marocains accueilleront les matchs: 
Stade Hassan II à Casablanca, Stade Mohammed V (rénové), Grand Stade de 
Tanger, Grand Stade de Marrakech, Stade Adrar à Agadir et Stade de Fès. 
Le Maroc est dans le Groupe C avec l'Argentine, l'Arabie saoudite et 
l'Égypte. La compétition commence le 11 juin 2026 et se termine le 19 
juillet 2026.

## Atlas Kings et les Marocains à l'étranger

Atlas Kings suit en détail les performances des joueurs marocains dans 
les championnats étrangers. Achraf Hakimi (PSG, Ligue 1 et UCL), Brahim 
Diaz (Bayern Munich, Bundesliga et UCL), Noussair Mazraoui (Manchester 
United, Premier League), Youssef En-Nesyri (Fenerbahçe, Süper Lig), 
Hakim Ziyech (Galatasaray, Süper Lig), Sofyan Amrabat (Real Betis, LaLiga), 
Nayef Aguerd (Real Sociedad, LaLiga) et Abdessamad Ezzalzouli (Real Betis, 
LaLiga) sont parmi les Lions de l'Atlas suivis en détail à chaque journée 
de leurs championnats respectifs.

## Questions fréquentes

### Où regarder les matchs de l'équipe du Maroc ?
Les matchs des Lions de l'Atlas sont diffusés sur Arryadia TV (chaîne 
publique marocaine) en clair. Certains matchs internationaux sont aussi 
diffusés sur beIN Sports et sur les plateformes de streaming FIFA+ pour 
les compétitions FIFA.

### Quand sont les prochains matchs de la Botola Pro ?
La saison 2025-26 se déroule jusqu'au 25 mai 2026. La prochaine journée 
est consultable en haut de cette page dans la section Matchs. La saison 
2026-27 commencera le 15 août 2026.

### Quels Marocains jouent en UEFA Champions League ?
Saison 2025-26: Achraf Hakimi (PSG), Brahim Diaz (Bayern Munich), Noussair 
Mazraoui (Manchester United, via Europa League), Bilal El Khannouss 
(Stuttgart). Hakimi est le capitaine du Maroc et l'un des défenseurs les 
plus cotés au monde à son poste.

### Comment fonctionne la Coupe du Monde 2026 ?
La Coupe du Monde 2026 réunit 48 équipes — la première édition dans ce 
format élargi. Phase de groupes: 12 groupes de 4 équipes, les 2 premiers 
de chaque groupe et les 8 meilleurs troisièmes se qualifient pour les 
1/16e de finale. La compétition se déroule du 11 juin au 19 juillet 2026 
au Canada, au Mexique, aux États-Unis et au Maroc.

### Quand commence la WAFCON 2026 au Maroc ?
La Coupe d'Afrique des Nations féminine 2026 (WAFCON) se déroule au Maroc 
du 25 juillet au 16 août 2026. Le Maroc, hôte, est tête de série. 
Atlas Kings couvrira intégralement la compétition avec classements, 
résultats et profils des joueuses.

### Qui sont les meilleurs buteurs de la Botola Pro ?
À la mi-saison 2025-26: Diasty (Wydad AC, 14 buts), Kasami (Raja CA, 12), 
M'Hand (AS FAR, 9), El Idrissi (Maghreb Fès, 9), Naciri (OCS Settat, 8). 
Le classement complet est consultable sur la page de la Botola Pro.

### Atlas Kings est-il gratuit ?
Oui, Atlas Kings est entièrement gratuit. Le site est financé par son 
modèle éditorial et ne diffuse pas de publicité conformément à notre 
approche éditoriale et à la Loi 09-08 sur la protection des données 
personnelles. Aucune inscription n'est requise pour consulter les 
classements, scores ou statistiques.

### Atlas Kings couvre-t-il le football féminin ?
Oui. Atlas Kings couvre l'équipe nationale féminine du Maroc (Lionnes de 
l'Atlas), la Botola Pro Féminine (créée en 2017), la WAFCON 2026 (au 
Maroc), la Coupe du Monde féminine, la UEFA Women's Champions League, 
et les principales ligues féminines européennes.
```

### Per-locale variants

All sections translated. Arabic version uses passionate fan-aligned language per the keyword analysis recommendation ("تابع معنا أسود الأطلس..."). English version uses neutral journalistic tone. French version (primary Morocco audience) balances both.

### Internal anchor links from About card

About card paragraphs reference relevant pages via locale-translated URLs:
- "Botola Pro" → `/fr/competition/maroc/botola-pro`
- "Coupe du Monde 2026" → `/fr/competition/fifa/coupe-du-monde-2026`
- "équipe du Maroc" → `/fr/equipe/maroc/equipe-nationale` (Page 4 — to be locked)
- "Hakimi" → `/fr/joueur/achraf-hakimi` (Page 5 — to be locked)

Doesn't create indexable URLs but reinforces semantic structure and distributes internal link equity.

### Data source

About card content lives in homepage-specific seed data — NOT in CALENDAR.md (which scopes per-competition). Stored at `src/lib/seo/homepage-about.ts` or equivalent, with three locale variants.

Hand-written content. Refreshes editorially on major narrative beats (WC 2026 start, tournament conclusions, season transitions). Not auto-generated.

---

## Section 10 — Footer

Dark background, Atlas Royal palette. Unchanged from v1.

### Row 1 — Editorial + quick-link columns

Two zones side-by-side:

**Left zone (~45% width)**:

- À propos — multi-paragraph SEO description of Atlas Kings scope (replaced by full About card above; footer keeps a short ~60-word version)
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

All footer links use locale-translated URLs per the pattern locked in competition-league.md.

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

## Section 11 — Mobile (375px)

### Layout

```
[ADAPTIVE TOP STRIP ~40px]
[TOPBAR ~56px condensed]   ← [≡] [Atlas Kings]   🔍 EN ☾
[EDITORIAL HERO ~64px condensed]
[H1 + INTRO BLOCK ~80-100px mobile]   ← NEW in v2
[Filter tabs row]            ← [Tous][Favoris][Compétitions] [<Aujourd'hui>]
[Filter pills row]            ← [Tous][Live(N)][Terminés][À venir]
[H2 · Matchs aujourd'hui]    ← NEW in v2
[FIXTURE CARD single column]
[EDITORIAL CARDS stacked with H2 each]
[RIGHT RAIL WIDGETS stacked below editorial, with H2 each]
[ABOUT CARD — full expanded content]   ← EXPANDED in v2
[FOOTER vertical stack]
[FIXED BOTTOM TAB BAR ~56px]  ← [⚽Matchs●][🔍][⭐][⚙️]
```

### Mobile H1 + intro block

H1: ~20-22px (slightly smaller than desktop)
Intro paragraph: ~14px, 3-4 lines max before wrapping
Vertical space: ~80-100px total
Padding: 16px horizontal (matching mobile gutter)

### Hamburger drawer

Opens from `[≡]` (left side). Contains:
- Home
- Botola Pro
- WC 2026 (featured slot 1)
- WAFCON 2026 (featured slot 2)
- Compétitions (with mega-menu structure as accordion)
- Language switcher
- Theme toggle

All entries route to locale-translated URLs.

### Bottom tab bar (4 tabs)

- ⚽ **Matchs** (active on homepage) → routes to homepage (Page 1, `/[locale]`)
- 🔍 **Recherche** → routes to search page (Phase 6+ feature page at `/[locale]/recherche`); until shipped, opens a "Bientôt disponible" overlay
- ⭐ **Favoris** → routes to favourites page (Phase 10 feature page at `/[locale]/favoris`, requires auth); until shipped, opens an "Inscription bientôt" overlay
- ⚙️ **Paramètres** → routes to settings page (Phase 10 feature page at `/[locale]/parametres`); until shipped, opens an inline settings panel for language + theme only

All four are persistent across pages, not homepage-only. Active state on the icon reflects current page context (Matchs active on Pages 1-6 entity pages; other tabs activate when on their respective feature pages once shipped).

NOT included (vs Sofascore's 5 tabs):
- Fantasy (out of scope)
- Profile (Phase 10 auth)

---

## Section 12 — All locked decisions summary

| Element | Decision |
|---|---|
| URL | `/[locale]` — no country segment, no entity slug (homepage is not an entity) |
| URL — locale prefixes | `/fr`, `/en`, `/ar` with hreflang bridges |
| Title + meta | Keyword-loaded per locale; Arabic includes "أسود الأطلس" |
| H1 | New page H1 above 3-column zone (replaces v1 single-line SEO breadcrumb) |
| Intro paragraph | 25-40 word keyword-loaded paragraph below H1; names entity domain + top 4 modifiers |
| Structured data | JSON-LD: WebSite + SearchAction + Organization + SportsEvent array |
| Image alt text | Per-locale on all crests, player photos, competition logos |
| Adaptive top strip | 4 modes (countdown / live / upcoming ticker without player names / fallback), 40px sticky |
| Topbar | Single row, 6 nav items + 3 utility icons. Single 64px row sticky top:40px |
| Featured slots | Auto-promoted via getFeaturedCompetitions() from CALENDAR.md. Today: WC 2026 🔥 + WAFCON 2026 |
| Compétitions mega-menu | Tier groupings (Morocco / Africa / International / Europe / MENA), driven by is_currently_visible flag |
| Mega-menu URLs | All entries route to locale-translated competition URLs per competition-league.md |
| Editorial hero | 5 modes priority-driven, no timer. Pusher live updates. 60s cache for non-live. Semantic H2+P markup, not styled spans |
| Fixture list | Left column ~540px, H2 above card, view-mode tabs + single-day nav, filter pills, NO odds toggle |
| Fixture rows | 3 states: upcoming gray / live red + animation / finished bold winner + 45% opacity loser |
| Competition group sort | Tier 2 Morocco > Tier 3 African > Tier 1 FIFA > Tier 4 EU men > Tier 5 women + Olympic > Tier 6 MENA |
| Center editorial cards | 8 cards, each with H2 heading. Featured carousel → Rankings → Joueur saison → Compare players → Compare teams → Matchs à suivre → Top performances → Newsletter |
| Right rail | 7 widgets, each with H2 heading: Botola Pro top 6 → UCL top scorers → EPL → LaLiga → Ligue 1 → Bundesliga → Serie A. Only at ≥1344px viewport |
| About card | EXPANDED: 6 H2 sections + 8 FAQ entries (~600-900 words per locale). Hand-written |
| Footer | 3-zone desktop (brand+editorial / quick-link columns / utility), vertical stack mobile. NO 18+, NO app store |
| Mobile bottom tab bar | 4 tabs: Matchs / Recherche / Favoris / Paramètres |
| Typography | IBM Plex Sans (Latin) + IBM Plex Sans Arabic + Fraunces (display) — Phase 4.5+ implementation |
| Compliance | Loi 09-08 footer notice, no betting/odds anywhere, no Sign In until Phase 10 |
| Live data | Pusher Channels (deployed Phase 3, ~120ms latency) for hero live + fixture row live state + Mode 2 strip |
| Caching | Server-side 60s for non-live content. Pusher channels per fixture for live state |
| Placeholder content | Real team names from seeded Neon DB (no "Coming soon"), real-style scores, real player names |

---

## Section 13 — Component inventory (for Phase 4.5 implementation)

New components to build in Phase 4.5 (homepage shell):

| Component | Location | Reuse on other pages |
|---|---|---|
| AdaptiveTopStrip | src/components/chrome/AdaptiveTopStrip.tsx | All pages |
| Topbar (updates) | src/components/chrome/TopNav.tsx | All pages |
| FeaturedSlotsLogic | src/lib/competitions/featured-slots.ts | Topbar driver |
| CompetitionsMegaMenu | src/components/chrome/CompetitionsMegaMenu.tsx | Topbar |
| EditorialHero | src/components/chrome/EditorialHero.tsx | Homepage only |
| HeroContentSelector | src/lib/homepage/hero-content.ts | Hero driver |
| H1IntroBlock | src/components/homepage/H1IntroBlock.tsx | Homepage only — NEW in v2 |
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
| NewsletterCard | src/components/editorial/NewsletterCard.tsx | Homepage + footer area + Page 2 right rail |
| RightRailMiniStandings | src/components/widgets/RightRailMiniStandings.tsx | Homepage right rail + other pages |
| RightRailTopScorers | src/components/widgets/RightRailTopScorers.tsx | Homepage + competition pages |
| AboutCardExpanded | src/components/homepage/AboutCardExpanded.tsx | Homepage only — EXPANDED in v2 |
| FAQList | src/components/homepage/FAQList.tsx | Homepage + Pages 2-3 — NEW in v2 |
| StructuredDataInjector | src/components/seo/StructuredDataInjector.tsx | All pages — NEW in v2 |
| MobileBottomTabBar | src/components/chrome/MobileBottomTabBar.tsx | All pages mobile |
| MobileHamburgerDrawer | src/components/chrome/MobileHamburgerDrawer.tsx | All pages mobile |
| Footer (updates) | src/components/chrome/Footer.tsx | All pages |

Components reusable from Phase 4 (no changes needed):
- LiveTicker (renders null when empty — survives, fold into row-level styling in Phase 5+)

Components kept for Phase 6+ reuse but removed from homepage:
- DateStrip (Phase 4 multi-day strip — keep file for calendar/results pages)
- LeftRail (Phase 4 280px sidebar — rebuild at 360px for inner-page shell)

### New data files for v2 SEO

| File | Purpose |
|---|---|
| src/lib/seo/homepage-meta.ts | Per-locale title + meta description for homepage |
| src/lib/seo/homepage-h1-intro.ts | Per-locale H1 + intro paragraph |
| src/lib/seo/homepage-about.ts | Per-locale About card content (6 H2 sections + 8 FAQ entries) |
| src/lib/seo/structured-data.ts | JSON-LD generators (WebSite, Organization, SportsEvent) |

---

## Section 14 — Open questions for Phase 4.5 implementation

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
| H1+intro block padding/spacing on mobile — exact values | UX | 4.5a |
| About card FAQ count — 8 fixed or variable per locale? | Editorial | 4.5b |
| About card width on desktop — full-width or center-column constrained? | UX | 4.5a |

---

## Section 15 — Differences from Sofascore

| Element | Sofascore /football | Atlas Kings homepage |
|---|---|---|
| URL pattern | `/football` | `/[locale]` (no /football route) |
| Locale handling | One URL per language with subpath | Locale-translated content with hreflang |
| Sport scoping | Football as one of many sports | Football-only |
| H1 | Generic "Football" or none | Keyword-loaded H1 above content |
| Intro paragraph | Buried in About card at bottom | Above the fold, below editorial hero |
| Editorial hero | Single featured match with odds | 5 priority-driven modes, no odds |
| Featured carousel | Includes bet365 odds row | Replaces with "Forme récente" WWLDW |
| Right rail | Ad slot, requires ≥1344px | 7 editorial mini-widgets at ≥1344px |
| About card | Short, ~3-4 paragraphs at bottom | 6 H2 sections + 8 FAQ, hand-written per locale |
| Structured data | Standard sports markup | Same + WebSite SearchAction + per-locale altName |
| Bottom mobile nav | 5 tabs incl. Fantasy + Profile | 4 tabs (no Fantasy, no Profile until Phase 10) |
| Footer | 18+ gambling notice | Loi 09-08 notice |
| Sign In | Top-right CTA | None until Phase 10 |

---

## Section 16 — Outbound link targets

Every clickable destination on the homepage with its route. Documented against the spec (Sections 1-11 plus Edits 1a-1g), not extrapolated from Sofascore patterns.

Source for the Sofascore reference points cited below: `docs/research/sofascore-football-landing-analysis.md` (browser-session analysis of `sofascore.com/football`, captured 2026-05-13). That file documented 186 unique links across 10 distinct destination page types from Sofascore's landing page; this section maps which of those routing patterns Atlas Kings adopts, modifies, or rejects.

### Category 1 — Routes to existing Pages 2-7 (in scope, schematicized separately)

**Adaptive top strip (per Section 1)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Mode 1 — Tournament badge ("WC26") | Tournament page | Page 3 | `/fr/competition/fifa/coupe-du-monde-2026` |
| Mode 1 — Countdown timer | Tournament page | Page 3 | Same as above |
| Mode 1 — Group flag clusters (e.g. Group A flags) | Tournament page, group view | Page 3 | Same as above with hash `#groupe-a` |
| Mode 2 — LIVE indicator + fixture row | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Mode 3 — Upcoming match ticker fixture | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Mode 3 — Competition badge in fixture | Competition page | Pages 2 or 3 | `/fr/competition/[country]/[slug]` |
| Mode 4 — Atlas Kings update text items | Various entity pages (Botola → Page 2; WC 2030 → Page 3; Atlas Lions → Page 4) | Pages 2-4 | Per entity URL |
| Horizontal scroll affordance (‹ / →) | In-strip scroll (no navigation) | — | — |

**Topbar (per Section 2)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Atlas Kings logo | Homepage | Page 1 | `/fr` |
| Home nav item | Homepage | Page 1 | `/fr` |
| Botola Pro nav item | Botola Pro competition page | Page 2 | `/fr/competition/maroc/botola-pro` |
| Featured slot 1 (WC 2026 🔥) | WC 2026 tournament page | Page 3 | `/fr/competition/fifa/coupe-du-monde-2026` |
| Featured slot 2 (WAFCON 2026) | WAFCON 2026 tournament page | Page 3 | `/fr/competition/caf/wafcon-2026` |
| Mega-menu item (any league) | Competition page | Page 2 | `/fr/competition/[country]/[slug]` |
| Mega-menu item (any tournament) | Tournament page | Page 3 | `/fr/competition/[confederation]/[slug]` |
| Mega-menu section header (Morocco / Africa / International / Europe / MENA) | Non-clickable category label | — | — |
| Language switcher | Locale change (in-place URL replace) | — | — |
| Theme toggle | Light/dark mode toggle (no navigation) | — | — |

**Editorial hero (per Section 5)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Mode A — live match (entire hero) | Match detail of live fixture | Page 6 | `/fr/match/[match-slug]` |
| Mode B — Atlas Lions match | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Mode C — Botola Pro highlight | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Mode D — Tournament milestone | Tournament page | Page 3 | `/fr/competition/fifa/coupe-du-monde-2026` |
| Mode E — Atlas Lions fallback | Team page (Atlas Lions) | Page 4 | `/fr/equipe/maroc/equipe-nationale` |
| Mode E — Tournament reference in fallback (e.g. WC 2030) | Tournament page | Page 3 | `/fr/competition/fifa/coupe-du-monde-2030` |

**H1 + intro block (per Section 4)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| H1 text | Non-clickable (page identity) | — | — |
| Intro paragraph entity mentions (Botola Pro, Atlas Lions, WC 2026, etc.) | NOT separately linked — paragraph is plain prose. (Sofascore's intro analogue is also unlinked.) | — | — |

**Fixture list / Left column (per Section 6 + Edit 1a)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| View-mode tabs (Tous / Favoris / Compétitions) | In-card filter change | — | — |
| Single-day navigator ‹ Aujourd'hui › | In-card date change | — | — |
| Filter pills (Tous / Live / Terminés / À venir) | In-card filter | — | — |
| Competition group header — logo or competition name | Competition page | Pages 2 or 3 | `/fr/competition/[country]/[slug]` |
| Competition group header — collapse chevron | In-card collapse/expand | — | — |
| Competition group header — match count badge | Non-clickable label | — | — |
| Fixture row (entire row) | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Fixture row — team crest or team name | Team page | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| Fixture row — favourite star ☆ | Toggle favourite (stub until Phase 10) | — | — |
| Fixture row — time / status block | Non-clickable (status info) | — | — |

**Editorial cards / Center column (per Section 7 + Edits 1b through 1f)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| **Card 1 — Featured match carousel** | | | |
| Carousel slide body | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Slide — competition name header | Competition page | Pages 2 or 3 | `/fr/competition/[country]/[slug]` |
| Slide — team crests + names | Team pages | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| Slide — vote buttons (Domicile/X/Extérieur) | Submit vote, render % bars (in-card, client-side) | — | — |
| Slide — Forme récente W/D/L pills | Non-clickable here (illustrative only — diverges from standings form pills per Edit 1b rationale) | — | — |
| Carousel arrows / dots | In-card carousel navigation | — | — |
| **Card 6 — Matchs à suivre cette semaine** | | | |
| Fixture row (entire row) | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Competition badge inside row | Competition page | Pages 2 or 3 | `/fr/competition/[country]/[slug]` |
| Team names inline (when present) | Team pages | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| **Card 7 — Top performances (per Edit 1f)** | | | |
| Player photo + name row | Player page | Page 5 | `/fr/joueur/[player-slug]` |
| Position label + score reference | Match detail of that performance | Page 6 | `/fr/match/[match-slug]` |
| "Voir plus ▼" | In-card expansion (Phase 4.5); routes to performances leaderboard once expansion exceeds N rows (Phase 6+) | — | — |
| ⓘ info icon | Tooltip (no navigation) | — | — |
| **Card 3 — Joueur de la saison (per Edit 1d)** | | | |
| Competition dropdown | In-card source change | — | — |
| Player photo + name + rating row | Player page | Page 5 | `/fr/joueur/[player-slug]` |
| Club name inline | Team page | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| **Card 8 — Newsletter** | | | |
| Email input | Submit form (in-place toast on success) | — | — |
| S'abonner button | Submit form | — | — |

**Right rail widgets (per Section 8)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Widget 1 Botola Pro — header (logo + competition + country + →) | Botola Pro competition page | Page 2 | `/fr/competition/maroc/botola-pro` |
| Widget 1 — team row inside table | Team page | Page 4 | `/fr/equipe/maroc/[team-slug]` |
| Widget 1 — "Voir tout →" | Botola Pro standings tab (same as widget header destination + hash) | Page 2 | `/fr/competition/maroc/botola-pro#classement` |
| Widget 2 UCL — header | UCL tournament page | Page 3 | `/fr/competition/uefa/ligue-des-champions` |
| Widget 2 — player row | Player page | Page 5 | `/fr/joueur/[player-slug]` |
| Widget 2 — "Voir tout →" | UCL stats tab | Page 3 | `/fr/competition/uefa/ligue-des-champions#stats` |
| Widgets 3-7 (EPL / LaLiga / Ligue 1 / Bundesliga / Serie A) | Same pattern as Widget 1 scoped to respective league | Page 2 | `/fr/competition/[country]/[slug]` |

**About card (per Section 9)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Entity name in body copy (Botola Pro, Wydad, Raja, Hakimi, etc.) | Corresponding entity page | Pages 2-5 | Per entity URL |
| Internal anchor link (#matchs, #classement, etc.) | Same page, hash fragment scroll | — | — |
| Competition reference in FAQ answers | Competition page | Pages 2 or 3 | `/fr/competition/[country]/[slug]` |
| Player reference in FAQ answers | Player page | Page 5 | `/fr/joueur/[player-slug]` |

**Footer (per Section 10)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Footer — Football column entries | Competition pages | Pages 2 or 3 | `/fr/competition/[country]/[slug]` |
| Footer — Sélections column entries | Team pages (national teams) | Page 4 | `/fr/equipe/[country]/equipe-nationale` |
| Footer — Joueurs column entries | Player pages | Page 5 | `/fr/joueur/[player-slug]` |
| Footer — Tendances column entries | Trending page | Page 7 | `/fr/tendances` |
| Footer — Scores column entries | Competition pages (scores subset) | Pages 2 or 3 | `/fr/competition/[country]/[slug]` |
| Footer — Mentions légales / Politique / Contact | Legal pages (Phase 12+ stubs) | — | (reserved) |
| Footer — Social media icons | External (X, Instagram, YouTube, TikTok) | — | External |

**Mobile bottom tab bar (per Section 11 + Edit 1g)**:

Already covered under Phase 6+ feature pages in Category 3 below.

### Category 2 — In-page interaction (no navigation)

Summary of types (all marked with em-dashes in Category 1 above):

- Adaptive top strip horizontal scroll
- Topbar mega-menu open/close, language switcher, theme toggle
- All view-mode tabs, filter pills, day navigators in fixture list
- All carousel arrows, dots, vote buttons
- All competition group collapse chevrons
- Favourite star icons (stub until Phase 10 auth)
- Card 3 competition dropdown (in-card source change)
- Card 7 "Voir plus ▼" (in-card expansion until Phase 6+)
- Card 8 newsletter form submission (in-place toast)
- All ⓘ info icons (tooltip only)
- All hash fragment scrolls inside the page

### Category 3 — Routes to Phase 6+ feature pages (NOT in current 7-page scope)

| Click source | Reserved URL | Phase |
|---|---|---|
| Fixture list group header — country flag/name (Edit 1a) | `/[locale]/pays/[country-slug]` | Phase 6+ — render as non-clickable text until shipped |
| Card 2 — FIFA Rankings tile (Edit 1c) | `/[locale]/classements/fifa` | Phase 6+ |
| Card 2 — CAF Rankings tile (Edit 1c) | `/[locale]/classements/caf` | Phase 6+ |
| Card 3 — "Voir tous les classements →" (Edit 1d) | `/[locale]/classements` (hub) | Phase 6+ |
| Card 3 — POTS archive (FUTURE — not in spec yet) | `/[locale]/classements/joueurs-de-la-saison` | Phase 6+ — added to BACKLOG as future enhancement |
| Card 4 — Individual player chip (Edit 1e) | `/[locale]/comparer/joueurs?p1=[player]` | Phase 6+ — fallback to Page 5 until shipped |
| Card 4 — "Comparer les joueurs →" (Edit 1e) | `/[locale]/comparer/joueurs` | Phase 6+ |
| Card 5 — Individual team chip (Edit 1e) | `/[locale]/comparer/equipes?t1=[team]` | Phase 6+ — fallback to Page 4 until shipped |
| Card 5 — "Comparer les équipes →" (Edit 1e) | `/[locale]/comparer/equipes` | Phase 6+ |
| Card 7 — "Voir plus ▼" overflow (Edit 1f) | `/[locale]/classements/performances` | Phase 6+ |
| Topbar 🔍 Search trigger | `/[locale]/recherche` | Phase 6+ |
| Mobile tab bar — Recherche (Edit 1g) | `/[locale]/recherche` | Phase 6+ |
| Mobile tab bar — Favoris (Edit 1g) | `/[locale]/favoris` | Phase 10 — requires auth |
| Mobile tab bar — Paramètres (Edit 1g) | `/[locale]/parametres` | Phase 10 |
| Footer — Outils column entries | Various Phase 6+/12+ URLs | Phase 6+/12+ |

**Deferred-affordance rule** (consistent with Page 2 Section 17): destinations listed in Category 3 render as non-clickable text or open a "Bientôt disponible" lightweight overlay, never as broken links or 404s, until the destination page ships.

### Category 4 — Explicit divergences from Sofascore routing

Documented divergences where Atlas Kings deliberately differs from Sofascore's analogous routing:

| Sofascore pattern | Atlas Kings pattern | Rationale |
|---|---|---|
| Bet365 odds links in carousel + Featured odds card | NO betting/odds links anywhere | Loi 09-08 compliance |
| Torneo subdomain promo (`torneo.sofascore.com`) | NO equivalent | Out of v2 scope |
| Fantasy promo card linking to `/fantasy` | NO equivalent | Out of v2 scope per CLAUDE.md Rule 11 |
| Gambling disclaimer link | NO equivalent | Loi 09-08 — no betting content to disclaim |
| Compare card = single link to empty selector | Chips are shortcuts + card area is generic | Better affordance for visible entity chips (Edit 1e) |
| POTS archive page (`/football/player-of-the-season`) | Not in Phase 4.5 scope; deferred to Phase 6+ under rankings hub family | Avoid scope creep; rankings hub covers same functional surface |
| Standings-only tournament variant (`/football/standings/{country}/{name}/{id}`) | NO equivalent — Page 2 renders full template with empty states for low-coverage leagues (Algeria, Tunisia) per Rule 12 | Cleaner architecture; one URL per competition; coverage-gated content rather than coverage-gated routing |
| Carousel Forme récente pills as clickable | NO — illustrative only in carousel context | Avoids fragmenting the slide's primary CTA (open match detail) |

### Sofascore reference

Per the football landing page analysis, Sofascore exposes ~186 unique links across 10 destination page types from its landing page. Atlas Kings exposes a similar structural set scoped to its 7-page entity model plus reserved Phase 6+ feature pages. Key takeaways:

- Sofascore's 10 destination types collapse for us to: 7 entity templates (Pages 1-7) + 6 reserved Phase 6+ feature pages (country index, FIFA rankings, CAF rankings, rankings hub, compare-players, compare-teams, performances leaderboard) + 2 Phase 10 pages (favorites, settings) + 1 Phase 12+ page family (news).
- We do NOT expose: bet365, Torneo subdomain, Fantasy sign-in, standings-only tournament variant.
- Newly surfaced Phase 6+ feature page from this homepage routing analysis: performances leaderboard (`/[locale]/classements/performances`) — added via Edit 1f, tracked in BACKLOG.

---

## Update log

- 2026-05-13 — Initial schematic locked after Phase 4.5+ design session. Sofascore /football used as reference (`docs/research/sofascore-analysis-atlas-kings-phase4-5.md`). Tournament data sourced from `docs/tournaments/CALENDAR.md`.
- 2026-05-13 — v2 SEO retrofit applied after Page 2 keyword analysis. Changes: new Section 3 (SEO and indexability) consolidating title/meta/JSON-LD/hreflang/alt-text specs; new Section 4 (H1 + intro block) replacing v1's single-line SEO breadcrumb; semantic H2 markup formalized on editorial hero, fixture list, every editorial card, every right-rail widget; Section 9 (About card) expanded from 2 paragraphs to 6 H2 sections + 8 FAQ entries with hand-written per-locale content; mobile layout (Section 11) updated to include H1+intro block and expanded About card. New components: H1IntroBlock, AboutCardExpanded, FAQList, StructuredDataInjector. New data files under src/lib/seo/. URL pattern unchanged — homepage stays at `/[locale]`.
- 2026-05-13 — Inline click specs added across Sections 6 (fixture list group header country routing), 7 (Featured carousel slide internals, Rankings two-destination split, Joueur de la saison routing, Compare cards hybrid clickability, Top performances explicit routing), and 11 (mobile bottom tab bar deferred-affordance). New Section 16 (Outbound link targets) added with exhaustive routing matrix grounded in Sofascore football landing page browser analysis (`docs/research/sofascore-football-landing-analysis.md`). One new Phase 6+ feature page surfaced: performances leaderboard at /[locale]/classements/performances. POTS archive page added to BACKLOG as future enhancement.
- (Append future updates here with date and change description)
