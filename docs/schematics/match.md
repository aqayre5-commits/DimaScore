# Atlas Kings Match Schematic — Page 6

Locked schematic for `/[locale]/match/[match-slug]` (match detail pages). Real Madrid vs Real Oviedo (14 May 2026, LaLiga J36, Bernabéu) is the worked example used throughout this document; the same structure repurposes for all match types — Botola Pro derbies, Atlas Lions internationals, continental club competitions, low-coverage leagues, domestic cup knockouts, women's football, friendlies. A Format Variants subsection covers per-context adaptations.

Reference data sources for the schematic:
- Real Madrid vs Real Oviedo (Sofascore, upcoming match) browser-session analysis — `docs/research/real-madrid-vs-real-oviedo-match-page-full-analysis.md`
- Manchester City vs Crystal Palace (Sofascore, played match) cross-referenced from earlier analysis — establishes pre/live/post deltas
- Flashscore and ESPN match pages cross-referenced for industry-pattern comparison

API-Football data-availability sweep conducted 2026-05-13 confirmed what's buildable in v1 versus what's been deliberately cut for lack of data source (see Section 17 — Differences from Sofascore reference).

**Status**: Locked, ready for Phase 4.5 implementation
**Last updated**: 2026-05-13
**Reference**: `docs/research/real-madrid-vs-real-oviedo-match-page-full-analysis.md`
**Inherits chrome from**: `docs/schematics/homepage.md`
**Inherits page-shell patterns from**: `docs/schematics/competition-league.md` (Page 2), `docs/schematics/competition-cup.md` (Page 3), `docs/schematics/team.md` (Page 4), `docs/schematics/player.md` (Page 5)
**Match data sources**: API-Football `/fixtures?id=X` (master object with embedded events/lineups/statistics/players), `/fixtures/headtohead`, `/predictions`, `/injuries`, `/fixtures?team=X&next=3` (next matches per team)

---

## Page identity

Canonical Atlas Kings page template for **match** entities — individual football fixtures. Distinct from Pages 2-5 which represent the structural entities (competitions, teams, players); Page 6 represents a single event in the football calendar where two teams meet.

Where Pages 2-3 = "this competition", Page 4 = "this team", Page 5 = "this player", **Page 6 = "this specific match between two teams at a specific moment in time"**.

The match page is the **state-driven page** in our seven-page model — the same page serves pre-match, live, and post-match user experiences. Content adapts coherently across state transitions (kickoff, goals, halftime, full-time). No prior page in our model has this depth of state-dependency.

### Distinguishing characteristics — Page 6 vs Pages 2-5

| Aspect | Pages 2-5 | Page 6 (Match) |
|---|---|---|
| Hero focus | Entity identity (competition / team / player) | The match itself: two teams meeting at a specific moment |
| Hero structure | Identity-first horizontal strip with metadata sub-zone | **Score header card** — crests left/right with state-adaptive center (kickoff/score/FT) + shared metadata sub-row |
| State machine | Mild (live indicators on hero) | **Core to the page**: pre-match / live / post-match drive every content surface |
| Center column | Static structure with tabs swapping content | **ONE card with tab strip** swapping content (Sofascore-pattern, industry-standard for match pages) |
| Left rail content | Editorial cards | **Home team's context for THIS match** — Forme + Et après + Indispos |
| Right rail content | Editorial cards | **Away team's context for THIS match** — Forme + Et après + Indispos (symmetric) |
| Rail symmetry | Asymmetric content per entity type | Symmetric: each rail = one team's situation |
| Time sensitivity | Updates per round / per season | **15-second polling during live state**; transitions invalidate cache instantly |
| Page lifecycle | Persistent (team / player / competition pages exist indefinitely) | **Lifecycle peaks then declines**: pre-match (interest building) → live (peak traffic) → post-match (replay value) → archival (low traffic but indexed) |
| Caching strategy | Hours to days | Seconds to minutes during live; hours pre-match; days post-archive |

### Inherited from Pages 2-5

- Inner-page 3-column shell at ≥1280px floor (~360-380 left + ~500-520 center + ~280-300 right) — design system rule maintained
- Chrome from homepage.md (top strip, topbar, breadcrumb, footer, mobile tab bar)
- SEO machinery (per-locale title/meta/H1/intro/JSON-LD/hreflang/image alt text)
- Loi 09-08 compliance throughout (no odds anywhere, no betting promo, no vote widgets)
- Phase 6+ deferred-affordance rule for unbuilt destinations (manager pages, stadium pages, referee pages)
- Videos section pattern from Pages 3-5 (`youtube-nocookie.com` + facade lazy-load)
- About card at page bottom with 6 H2 sections + 6-8 FAQ

---

## Section 1 — URL structure

### Canonical pattern

```
/[locale]/match/[match-slug]
```

The `/match/` root segment is **not translated** across locales (Next.js routing simplicity, consistent with `/competition/` / `/equipe/` / `/joueur/` on Pages 2-5).

### Match slug strategy

Match slug encodes both teams + date for human readability and SEO. Pattern:

```
[home-team-slug]-vs-[away-team-slug]-[YYYY-MM-DD]
```

### Per-locale examples

**Real Madrid vs Real Oviedo** — canonical Page 6 instance:
```
/fr/match/real-madrid-vs-real-oviedo-2026-05-14
/en/match/real-madrid-vs-real-oviedo-2026-05-14
/ar/match/ريال-مدريد-vs-ريال-أوفييدو-2026-05-14
```

**Wydad AC vs Raja CA** (Casablanca derby — Botola Pro):
```
/fr/match/wydad-ac-vs-raja-ca-2026-05-23
/en/match/wydad-ac-vs-raja-ca-2026-05-23
/ar/match/الوداد-vs-الرجاء-2026-05-23
```

**Maroc vs Argentine** (WC 2026 group stage):
```
/fr/match/maroc-vs-argentine-2026-06-12
/en/match/morocco-vs-argentina-2026-06-12
/ar/match/المغرب-vs-الأرجنتين-2026-06-12
```

**Arsenal vs Liverpool** (Premier League):
```
/fr/match/arsenal-vs-liverpool-2026-05-15
/en/match/arsenal-vs-liverpool-2026-05-15
/ar/match/أرسنال-vs-ليفربول-2026-05-15
```

### Slug collision handling

For competitions where two teams play home-and-away in the same season, two fixtures share the team pair but differ in date — the YYYY-MM-DD suffix disambiguates them. Slugs are unique per fixture by definition.

For tournament knockout rounds where a tie spans two legs (UCL semi-final 1st leg + 2nd leg), each leg is a separate fixture with its own date in the slug. The relationship is metadata, not URL structure.

For rescheduled matches: the slug stays at the new date. Old slug (if briefly used while announced for the old date) redirects 301 to the canonical (new date) slug.

### Match data schema additions

Building on a `fixtures` table that captures API-Football's `/fixtures` data:

```typescript
// fixture identity
id: number                        // API-Football fixture id
slug: string                      // 'real-madrid-vs-real-oviedo-2026-05-14'
slug_ar: string                   // Arabic-native script slug

// match identity
home_team_id: number              // FK to teams
away_team_id: number              // FK to teams
competition_id: number            // FK to competitions
round: string                     // 'Regular Season - 36' or 'Quarter-finals'
date_iso: ISO date                // kickoff datetime
timestamp: number                 // kickoff unix timestamp
status_short: string              // TBD/NS/1H/HT/2H/ET/P/BT/FT/AET/PEN/LIVE/PST/CANC/ABD/AWD/WO/SUSP/INT
status_long: string               // human-readable status
elapsed: number | null            // current minute if live
extra: number | null              // injury time minutes if live

// venue
venue_id: number | null           // FK to venues table
venue_name: string                // 'Bernabéu' (fallback if venue table empty)
venue_city: string                // 'Madrid'

// referee
referee_name: string | null       // 'Ricardo De Burgos Bengoetxea'
referee_nationality: string | null // 'Spain'

// score
goals_home: number | null         // null pre-kickoff
goals_away: number | null
score_halftime_home: number | null
score_halftime_away: number | null
score_fulltime_home: number | null
score_fulltime_away: number | null
score_extratime_home: number | null
score_extratime_away: number | null
score_penalty_home: number | null
score_penalty_away: number | null

// coverage gates (cached per match from competition's coverage)
coverage_events: boolean
coverage_lineups: boolean
coverage_statistics_fixtures: boolean
coverage_statistics_players: boolean
coverage_predictions: boolean
coverage_injuries: boolean

// hand-curated / editorial
media_youtube_ids: string[]       // populated post-match for priority matches
about_fr: { intro, history, venue_context, broadcast, editorial, faqs }
about_en: { ... }
about_ar: { ... }
```

The `slug` field is generated server-side during fixture ingestion. Slugs for past seasons can be backfilled. Slugs for newly-announced fixtures generate when the fixture appears in API-Football's calendar.

### Tab state — hash fragments only

```
/fr/match/real-madrid-vs-real-oviedo-2026-05-14                  → defaults to Aperçu
/fr/match/real-madrid-vs-real-oviedo-2026-05-14#apercu           → Aperçu (explicit, same as default)
/fr/match/real-madrid-vs-real-oviedo-2026-05-14#composition      → Composition tab
/fr/match/real-madrid-vs-real-oviedo-2026-05-14#statistiques     → Statistiques tab
/fr/match/real-madrid-vs-real-oviedo-2026-05-14#confrontations   → Confrontations tab
```

Per-locale hash fragments:
- Aperçu: `#apercu` (FR) / `#overview` (EN) / `#نظرة-عامة` (AR)
- Composition: `#composition` (FR) / `#lineups` (EN) / `#التشكيلة` (AR)
- Statistiques: `#statistiques` (FR) / `#statistics` (EN) / `#الإحصائيات` (AR)
- Confrontations: `#confrontations` (FR) / `#head-to-head` (EN) / `#المواجهات` (AR)

### hreflang annotations

```html
<link rel="alternate" hreflang="fr" href="https://atlaskings.com/fr/match/real-madrid-vs-real-oviedo-2026-05-14" />
<link rel="alternate" hreflang="en" href="https://atlaskings.com/en/match/real-madrid-vs-real-oviedo-2026-05-14" />
<link rel="alternate" hreflang="ar" href="https://atlaskings.com/ar/match/ريال-مدريد-vs-ريال-أوفييدو-2026-05-14" />
<link rel="alternate" hreflang="x-default" href="https://atlaskings.com/fr/match/real-madrid-vs-real-oviedo-2026-05-14" />
```

---

## Section 2 — SEO and indexability

### Per-locale title and meta description

Hand-written for priority matches (Atlas Lions internationals, Botola Pro top fixtures, derby matches, knockout-stage matches). Templated for the rest.

Real Madrid vs Real Oviedo hand-written (or templated for non-priority):

```
fr: <title>Real Madrid vs Real Oviedo · 14 mai 2026 · LaLiga J36 | Atlas Kings</title>
    <meta name="description" content="Real Madrid reçoit Real Oviedo le 14 mai 2026 à 20h30 au Bernabéu, comptant pour la 36ème journée de LaLiga 2025/26. Compositions probables, statistiques, confrontations passées et prédictions. Suivez le match en direct." />

en: <title>Real Madrid vs Real Oviedo · 14 May 2026 · LaLiga J36 | Atlas Kings</title>
    <meta name="description" content="Real Madrid host Real Oviedo on 14 May 2026 at 20:30 at the Bernabéu, in matchday 36 of LaLiga 2025/26. Predicted lineups, statistics, head-to-head and predictions. Follow the match live." />

ar: <title>ريال مدريد vs ريال أوفييدو · 14 مايو 2026 · الليغا الجولة 36 | أطلس كينغز</title>
    <meta name="description" content="ريال مدريد يستقبل ريال أوفييدو يوم 14 مايو 2026 الساعة 20:30 في ملعب البرنابيو، ضمن الجولة 36 من الليغا 2025/26. التشكيلات المحتملة والإحصائيات والمواجهات السابقة والتوقعات. تابعوا المباراة مباشرة." />
```

Title pattern: `{home_team} vs {away_team} · {date} · {competition} J{round} | Atlas Kings`.

Modifiers tuned per match type:
- League match: `vs / date / competition / round`
- Cup knockout: `vs / date / competition / phase` (e.g., "demi-finale", "1/8 de finale")
- International: `vs / date / competition / tournament context` (e.g., "Coupe du Monde 2026 · Groupe C")
- Friendly: `vs / date / amical international`

### H1 — single per page

The match itself, framed as a meeting between the two teams. IBM Plex Sans 22-24px semibold (slightly smaller than Pages 2-5 H1 since the score itself is the dominant visual):

```
fr: <h1>Real Madrid vs Real Oviedo</h1>
en: <h1>Real Madrid vs Real Oviedo</h1>
ar: <h1>ريال مدريد ضد ريال أوفييدو</h1>
```

For Atlas Lions matches specifically, the H1 includes nickname when meaningful:

```
fr: <h1>Maroc — Lions de l'Atlas vs Argentine</h1>
en: <h1>Morocco — Atlas Lions vs Argentina</h1>
ar: <h1>المغرب — أسود الأطلس ضد الأرجنتين</h1>
```

For Botola Pro derbies, optional editorial nickname appended in body content (not H1):

```
fr: <h1>Wydad AC vs Raja CA</h1>
    <p>Le derby casablancais...</p>
```

### Intro paragraph

Below the score header, above the 3-column zone. 40-60 words, keyword-loaded, per locale. Hand-written for priority matches.

Real Madrid vs Real Oviedo (FR):

```
Real Madrid reçoit Real Oviedo le jeudi 14 mai 2026 à 20h30 au Stade Santiago 
Bernabéu pour le compte de la 36ème journée de LaLiga 2025/26. Le club madrilène, 
2ème au classement avec 77 points, affronte un Real Oviedo en lutte pour le 
maintien (20ème, 29 points). Suivez ce match en direct, compositions probables, 
statistiques et confrontations.
```

For Atlas Lions matches:

```
La sélection marocaine, surnommée les Lions de l'Atlas, affronte l'Argentine 
(tenante du titre) le 12 juin 2026 au Stade Hassan II de Casablanca pour le 
match d'ouverture du Groupe C de la Coupe du Monde FIFA 2026, co-organisée 
par le Maroc. Suivez ce match historique en direct.
```

### H2 inside each active tab

Same pattern as Pages 2-5. Each tab content area has a visible H2:

| Tab | French | English | Arabic |
|---|---|---|---|
| Aperçu | Aperçu du match | Match overview | نظرة عامة على المباراة |
| Composition | Compositions probables / Composition de départ | Possible lineups / Starting lineups | التشكيلات المحتملة / التشكيلة الأساسية |
| Statistiques | Statistiques du match | Match statistics | إحصائيات المباراة |
| Confrontations | Confrontations directes | Head-to-head | المواجهات المباشرة |

Composition H2 adapts: "Compositions probables" before kickoff, "Composition de départ" once lineups are confirmed (20-40 minutes before kickoff), "Composition finale" post-match (reflecting substitutions made).

### JSON-LD structured data

Two blocks in `<head>`:

**1. SportsEvent** for the match itself:

```json
{
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  "name": "Real Madrid vs Real Oviedo",
  "startDate": "2026-05-14T20:30:00+02:00",
  "sport": "https://schema.org/Soccer",
  "homeTeam": {
    "@type": "SportsTeam",
    "name": "Real Madrid",
    "url": "https://atlaskings.com/fr/equipe/espagne/real-madrid"
  },
  "awayTeam": {
    "@type": "SportsTeam",
    "name": "Real Oviedo",
    "url": "https://atlaskings.com/fr/equipe/espagne/real-oviedo"
  },
  "location": {
    "@type": "Place",
    "name": "Santiago Bernabéu",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Madrid",
      "addressCountry": "ES"
    }
  },
  "competition": {
    "@type": "SportsOrganization",
    "name": "LaLiga 2025/26 — Round 36",
    "url": "https://atlaskings.com/fr/competition/espagne/laliga"
  },
  "url": "https://atlaskings.com/fr/match/real-madrid-vs-real-oviedo-2026-05-14",
  "eventStatus": "https://schema.org/EventScheduled"
}
```

Post-match, `eventStatus` updates to `EventEnded` and score becomes part of the structured data.

**2. BreadcrumbList** for the breadcrumb hierarchy:

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Football", "item": "https://atlaskings.com/fr" },
    { "@type": "ListItem", "position": 2, "name": "Espagne", "item": "https://atlaskings.com/fr/pays/espagne" },
    { "@type": "ListItem", "position": 3, "name": "LaLiga", "item": "https://atlaskings.com/fr/competition/espagne/laliga" },
    { "@type": "ListItem", "position": 4, "name": "Real Madrid vs Real Oviedo" }
  ]
}
```

### Per-locale image alt text

Team crests, venue photo, player photos all carry locale-specific alt text:

```
Home crest:    alt="Écusson du Real Madrid" (fr)
                alt="Real Madrid crest" (en)
                alt="شعار ريال مدريد" (ar)

Away crest:    alt="Écusson du Real Oviedo" (fr)

Venue photo:   alt="Stade Santiago Bernabéu, Madrid" (fr)
```

### About card at page bottom

Long-form keyword-bearing content. 6 H2 sections + 6-8 FAQ entries, hand-written per locale for priority matches. Documented in Section 11.

---

## Section 3 — Layout at desktop ≥1280px

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADAPTIVE TOP STRIP (~40px, sticky top:0)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ TOPBAR (~64px, sticky top:40px)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ SEO breadcrumb (~22px, scrolls away)                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ SCORE HEADER CARD (~170-200px, full content width, NOT sticky)               │
│  [Crest Home]   STATE-ADAPTIVE CENTER   [Crest Away]                         │
│  Pre-match: kickoff time + "Aujourd'hui" / "Demain" + "–" separator         │
│  Live: minute + animated indicator + current score                          │
│  Post-match: final score + status badge + goalscorers list                  │
│  Sub-row metadata: date · competition · venue · referee · TV                │
├──────────────────────┬───────────────────────────┬──────────────────────────┤
│ LEFT RAIL ~360-380px │ CENTER ~500-520px         │ RIGHT RAIL ~280-300px    │
│                      │                           │                          │
│ HOME TEAM context:   │ ONE match card with       │ AWAY TEAM context:       │
│                      │ tab strip + content area  │                          │
│ 1. Forme card        │                           │ 1. Forme card            │
│    standings pos.    │ Tab strip:                │    standings pos.        │
│    last 5 form       │ Aperçu (default) ·        │    last 5 form           │
│    home/away splits  │ Composition ·             │    home/away splits      │
│                      │ Statistiques ·            │                          │
│ 2. Et après card     │ Confrontations            │ 2. Et après card         │
│    next 3 fixtures   │                           │    next 3 fixtures       │
│    /fixtures?team=X  │ Content area shows the    │    /fixtures?team=X      │
│    &next=3           │ active tab's content.     │    &next=3               │
│                      │ Click tab → swap content. │                          │
│ 3. Indispos card     │                           │ 3. Indispos card         │
│    pre-match only    │ State-adaptive content    │    pre-match only        │
│    /injuries?        │ within each tab           │    /injuries?            │
│    fixture=X         │                           │    fixture=X             │
│                      │                           │                          │
├──────────────────────┴───────────────────────────┴──────────────────────────┤
│ VIDÉOS section (~400-600px, full content width, POST-MATCH ONLY)            │
│  3-up YouTube thumbnail grid · embeds via youtube-nocookie.com              │
├─────────────────────────────────────────────────────────────────────────────┤
│ ABOUT CARD (full keyword surface, 6 H2 sections + 6-8 FAQ)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Section 4 — Inherited chrome (from homepage.md)

Carries over verbatim from `docs/schematics/homepage.md`. No re-spec needed.

| Component | Behaviour on Page 6 |
|---|---|
| AdaptiveTopStrip | Identical. WC 2026 Mode 1 countdown active globally today. For Atlas Lions match specifically: top strip remains in WC2026 mode (no match-specific override). |
| Topbar | Identical. For match in covered league (e.g., LaLiga): that league's nav item gets gold underline (active). For matches in pinned competitions (Botola Pro, EPL, UCL): same. For other matches: no top-level nav active. |
| SeoBreadcrumb | Content updates per match. For Real Madrid vs Real Oviedo: `Football › Espagne › LaLiga · J36 › Real Madrid vs Real Oviedo` (FR). Breadcrumb segment routing per Page 2 Section 4 conventions: first segment → homepage; country segment → country index (Phase 6+ deferred-affordance); competition segment → Page 2; match segment → current page (non-clickable). |
| Footer | Identical. Loi 09-08 notice. |
| Mobile bottom tab bar | Identical 4 tabs (Matchs / Recherche / Favoris / Paramètres). |
| Mobile hamburger drawer | Identical structure. |

---

## Section 5 — Score header card (~170-200px)

The defining visual element of Page 6. ONE card spanning the full content width above the 3-column zone. State-adaptive content in the center; everything else (crests, metadata sub-row) stays consistent across all states.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  [Real Madrid crest]      20:30 · Aujourd'hui      [Real Oviedo crest]   │
│       Real Madrid                  "–"                  Real Oviedo      │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│  📅 14/05/2026 · 20:30  ·  🏆 LaLiga J36  ·  📍 Bernabéu, Madrid         │
│  ⚖ Arbitre: De Burgos Bengoetxea (Espagne)  ·  📺 Movistar+              │
└──────────────────────────────────────────────────────────────────────────┘
```

Total height: ~170-200px depending on state (post-match with goalscorer list is tallest).

### Structure

**Top zone — match identity (~120-140px)**:

Three columns within the score header:
- **Left column** (33%): Home team crest (large, ~64×64) + team name below. Crest is clickable → home team's Page 4.
- **Center column** (34%): State-adaptive content (see state machine below).
- **Right column** (33%): Away team crest (large, ~64×64) + team name below. Crest is clickable → away team's Page 4.

**Bottom zone — shared metadata sub-row (~40-50px)**:

Horizontal row of inline-icon + text pairs:
- Calendar icon + date + kickoff time
- Competition icon + competition name + round (clickable → Page 2/3)
- Stadium icon + venue name + city (non-clickable text in v1; Phase 6+ stadium page reserved)
- Whistle/referee icon + referee name + nationality flag (non-clickable text in v1; Phase 6+ referee page reserved)
- TV icon + broadcaster name(s) for user's region (non-clickable)

Sub-row content is **identical across all states**. The shared metadata doesn't change when the match transitions from pre-match to live to post-match.

### State machine — center column content

The center column adapts to the match's current `status_short` value. Pusher subscription on `fixture-{id}-state` invalidates and re-renders the center column on transitions.

**State 1 — Pre-match (>24h to kickoff)** — `TBD` / `NS` status:

```
                                14/05/2026
                                  20:30
                                    –
```

- Date label (large, "14/05/2026") + kickoff time below (large, "20:30") + "–" separator below
- No countdown yet (too far out to be useful)

**State 2 — Pre-match (<24h, >1h to kickoff)** — `NS` status with timestamp <24h:

```
                              Aujourd'hui
                                 20:30
                                    –
```

- "Aujourd'hui" / "Demain" label (or "Dans 6h") + kickoff time + "–" separator
- Auto-updates as the day/hour rolls over

**State 3 — Pre-match (<1h to kickoff)** — `NS` status with timestamp <1h:

```
                                 20:30
                       Coup d'envoi dans 47 min
                                    –
```

- Kickoff time large + countdown below ("Coup d'envoi dans X min") + "–"
- Countdown updates every minute

**State 4 — Live (1H / HT / 2H / ET / P / BT / LIVE)** — match in progress:

```
                                  67'  ●
                                  2 – 1
```

- Current minute large (with extra time if applicable: `90'+4`)
- Animated red live indicator (pulsing dot, CSS animation)
- Current score below (large, "2 – 1")
- Score updates via Pusher push when goals score

For halftime (`HT`):
```
                                Mi-temps
                                 1 – 0
```

For extra time (`ET`):
```
                              90'+4 (ET)  ●
                                 2 – 2
```

For penalties (`P`):
```
                          Tirs au but  ●
                           2 – 2 (4 – 3)
```

**State 5 — Post-match (FT / AET / PEN)** — match concluded:

```
                                 3 – 0
                                  FT
                          
                          Vinícius 45'
                          Mbappé 60' 78'
```

- Final score large
- Status badge below (FT / AET / Tirs au but)
- Goalscorers list inline (player name + minute, one line per scorer)
- Goalscorer names clickable → player pages (Page 5)

For matches ending with penalty shootout decided:
```
                            3 – 3 (5 – 4 t.a.b.)
                                   PEN
```

**State 6 — Postponed / Cancelled / Abandoned (PST / CANC / ABD / AWD / WO / SUSP / INT)** — exceptional states:

```
                                Match reporté
                            au 21/05/2026 · 20:30
                                    –
```

- Status reason displayed prominently
- For postponed: new date if known
- For abandoned/cancelled: reason if API provides it

### Mobile (375px)

Score header card stacks vertically:
- Crests + team names in a 2-column mini-grid at top
- State-adaptive content in a 3rd row spanning full width
- Sub-row metadata: wraps onto multiple lines as needed; icon+text pairs stack at narrow viewports

Mobile score header height: ~220-280px (taller than desktop due to stacking).

### Live data refresh

Pusher subscriptions on this card:
- `fixture-{id}` for any data change in the master fixture object
- `fixture-{id}-state` specifically for state transitions (kickoff, HT, FT)

Cache TTL:
- Pre-match >2h: 1h
- Pre-match <2h: 5min
- Live: 0s (push-driven)
- Post-match <24h: 5min (occasional stat corrections)
- Post-match >24h: 24h (effectively immutable)

### What's NOT in the score header

Removed vs Sofascore (Loi 09-08 + scope discipline):
- ❌ FAVOURITE button (Phase 10 auth feature; slot reserved but not rendered in v1)
- ❌ COMPARE teams button (Phase 6+ feature reserved)
- ❌ Add to calendar button (Phase 6+ feature reserved)
- ❌ Bet365 / betting odds card (Loi 09-08)
- ❌ "Sign-up bonus awaits you" promo (Loi 09-08)
- ❌ 18+ disclaimer banner (Loi 09-08, nothing to disclaim)

The clean header focuses entirely on match identity and shared metadata. No promotional elements.

---

## Section 6 — Left rail (~360-380px) — Home team context

Three cards stacked. All content scoped to the **home team in the context of this match**. Total rail height ~620-720px (depends on injury list length).

### Card 1 — Forme & classement card (~110-130px)

The home team's current standings position + recent form. Distilled from `/standings` endpoint.

```
┌─ Forme · Real Madrid ─────────────────────────┐
│                                                │
│  2ème · LaLiga · 77 pts                        │
│                                                │
│  Forme: D W D W L                              │
│                                                │
│  Domicile: W W L W                             │
│  Extérieur: D D L W L                          │
│                                                │
│  Voir le classement complet →                  │
└────────────────────────────────────────────────┘
```

**Content structure**:
- Card title: "Forme · {home_team_name}"
- Standings position: rank + competition + points (e.g., "2ème · LaLiga · 77 pts")
- Form string: last 5 matches as W/D/L letters with color coding (green/gray/red)
- Home form: last 5 home matches
- Away form: last 5 away matches
- Link "Voir le classement complet →" → competition's Page 2 hash-anchored to Standings tab

**Data sources**:
- `/standings?league=X&season=Y` returns the team's rank, points, and `form` field (string like "DWDWL" — the last 5 matches in order)
- Home/away form splits derivable from the same `/standings` response (`home` and `away` records included)

**For competitions without standings** (knockout-only, friendlies, etc.):

Card adapts to show form only (no standings position):

```
┌─ Forme · Maroc ───────────────────────────────┐
│                                                │
│  Forme récente: W W D W W                      │
│                                                │
│  Compétitions: Qualifications WC 2026          │
│                                                │
│  FIFA: #14 mondial                             │
└────────────────────────────────────────────────┘
```

For national teams in tournament contexts, FIFA ranking displayed (gated by `fifa_ranking_applicable` flag per Page 3/4 precedent).

### Card 2 — Et après card (~170-200px)

The home team's next 3 fixtures after the current match. Distilled from `/fixtures?team=X&next=3`.

```
┌─ Et après · Real Madrid ──────────────────────┐
│                                                │
│  Prochains 3 matchs                            │
│                                                │
│  21/05  ·  Sevilla (ext.)                      │
│           LaLiga J37                           │
│                                                │
│  24/05  ·  Athletic (dom.)                     │
│           LaLiga J38                           │
│                                                │
│  31/05  ·  À confirmer                         │
│           Friendly                             │
└────────────────────────────────────────────────┘
```

**Content structure**:
- Card title: "Et après · {home_team_name}"
- Sub-heading: "Prochains 3 matchs"
- 3 fixture rows, each:
  - Date (DD/MM format)
  - Opponent team name + (dom.) for home / (ext.) for away
  - Competition name + round on second line

**Each row is clickable → match detail page (Page 6 of that future match)**.

**Data source**: `/fixtures?team={home_team_id}&next=3`. 

Returns 3 fixture objects. We extract:
- `fixture.date` → formatted DD/MM
- `teams.home.id` vs `teams.away.id` → determine if THIS team is home or away (vs `home_team_id`)
- `teams.{opposite}.name` → opponent name
- `league.name` + `league.round` → competition + round

**Cost**: 1 API call per team. Page 6 fires 2 calls (one per team) in parallel server-side. Cached with 1-hour TTL — upcoming fixtures don't change minute-to-minute.

**Edge cases**:
- If `next < 3` fixtures available (end of season): show what's available; pad with "Saison terminée" placeholder
- If next fixture is the CURRENT match (rare; shouldn't happen since current match is `status=NS` not `next`): filter out current match from the response

### Card 3 — Indispos card (~120-180px)

The home team's unavailable players for this specific match. Pre-match only — hidden during live and post-match.

```
┌─ Indispos · Real Madrid ──────────────────────┐
│                                                │
│  Pour ce match                                 │
│                                                │
│  • Arda Güler         · cuisse                 │
│  • Federico Valverde  · tête                   │
│  • Ferland Mendy      · ligament               │
│  • Rodrygo            · LCA                    │
│  • Éder Militão       · cuisse                 │
│                                                │
│  Doutful:                                      │
│  • Andriy Lunin       · virus                  │
│  • Dean Huijsen       · virus                  │
└────────────────────────────────────────────────┘
```

**Content structure**:
- Card title: "Indispos · {home_team_name}"
- Sub-heading: "Pour ce match" (clarifies this is fixture-specific)
- List of unavailable players (injured / suspended) with reason
- Sub-section for doubtful players if any

**Data source**: `/injuries?fixture={match_id}` filtered to home team. Returns:
- `player.name` + `player.id`
- `team.id` (filter where team.id === home_team_id)
- `type` ("Missing Fixture" / "Questionable")
- `reason` ("Thigh" / "Head" / "Ligament" / "Cruciate ligament" / "Virus" / "Red card suspension" / etc.)

Reason field translated to FR/AR via mapping table maintained editorially.

**Player names clickable** → player pages (Page 5).

**Card visibility states**:
- **Pre-match**: visible, populated
- **Live**: hidden (irrelevant once match is in progress)
- **Post-match**: hidden (irrelevant once match is over)
- **Empty pre-match** (no injuries reported): card renders with empty state "Aucun joueur indisponible signalé pour ce match." OR hides entirely (TBD per UX preference at 4.5a)

**Coverage gate**: requires `coverage.injuries: true` for the competition. For competitions without injury coverage: card hides entirely.

### Cards NOT used on Page 6 vs Pages 2-5

- **Newsletter card**: NOT present. Not match-specific. Newsletter signup belongs on homepage / persistent entity pages, not single-event pages.
- **Featured match card** (Pages 2-5 Card 1): NOT present. Page 6 IS the featured match.
- **Matches list card** (Pages 2-5 Card 2): NOT present. Match-specific page doesn't list other matches.

The left rail is exclusively the home team's situation entering this match.
---

## Section 7 — Center column (~500-520px) — Match card with tabs

ONE card occupying the center column. Tab strip at the top of the card. Single content area below the tab strip that swaps when a different tab is clicked. The card itself stays in place — only the inner content changes.

This is the **industry-standard pattern** confirmed across Sofascore, Flashscore, and ESPN match pages. We adopt it for design familiarity and because it works.

### Card structure

```
┌─ Match card ──────────────────────────────────────┐
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Aperçu ● │ Composition │ Stats │ Confront.  │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │                                             │ │
│  │  Content area — shows the active tab's      │ │
│  │  content. Click another tab → content       │ │
│  │  swaps in place. Card shell stays.          │ │
│  │                                             │ │
│  │                                             │ │
│  │                                             │ │
│  └─────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

### Tab strip (~48px tall, NOT sticky)

4 tabs displayed inline:
- **Aperçu** (default active, gold underline + semibold)
- **Composition**
- **Statistiques**
- **Confrontations**

Tab click: updates hash fragment (`#apercu` / `#composition` / `#statistiques` / `#confrontations`), swaps content area below. No page reload.

Active tab: gold underline, semibold weight. Inactive: gray text, regular weight. ~16px text.

### Content area — adapts per tab AND per match state

The content area below the tab strip shows ONE tab's content at a time. Each tab's content varies by match state (pre-match / live / post-match). Card-internal `tab × state` matrix:

| Tab | Pre-match | Live | Post-match |
|---|---|---|---|
| Aperçu | Predictions + form preview | Events timeline live | Match summary + player of match + events |
| Composition | "Compositions probables" (20-40min before) | Confirmed XI + subs as they happen | Confirmed XI + per-player ratings + substitutions |
| Statistiques | Empty state | Live stats updating | Final 16 stats with bars |
| Confrontations | Past meetings + summary | Same | Same |

Each tab spec'd below.

---

### Tab 1 — Aperçu (default)

H2 (within content area): `Aperçu du match` (FR) / `Match overview` (EN) / `نظرة عامة على المباراة` (AR).

The universal entry point. Adapts by state.

#### Pre-match state

```
┌─ Aperçu du match ─────────────────────────────────┐
│                                                   │
│  Prédiction Atlas Kings                           │
│                                                   │
│  Real Madrid  ████████████████  87%               │
│  Nul          █                  6%               │
│  Real Oviedo  █                  7%               │
│                                                   │
│  Conseil: Victoire Real Madrid                    │
│                                                   │
├───────────────────────────────────────────────────┤
│                                                   │
│  Forme comparative                                │
│                                                   │
│  Real Madrid:  D W D W L  (2ème · 77 pts)         │
│  Real Oviedo:  W D L L D  (20ème · 29 pts)        │
│                                                   │
├───────────────────────────────────────────────────┤
│                                                   │
│  Indisponibles                                    │
│                                                   │
│  Real Madrid: 5 absences (Güler, Valverde,       │
│  Mendy, Rodrygo, Militão)                         │
│                                                   │
│  Real Oviedo: 2 suspensions (Javi López,         │
│  Sibo), 1 doute                                   │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Content blocks**:

1. **Prédiction Atlas Kings**: 3 horizontal bars showing winner percentages (home / draw / away). Bar widths proportional to predicted probability. Below bars: "Conseil" text — algorithmic advice from API.

   Data source: `/predictions?fixture={match_id}`. Returns:
   - `winner` — predicted team
   - `percent.home`, `percent.draw`, `percent.away`
   - `advice` — human-readable advice string

   Framing: **"Prédiction Atlas Kings"** (we own the prediction display). Note discreetly: "Basé sur un modèle statistique". NOT framed as betting recommendation. Loi 09-08 compliant.

2. **Forme comparative**: side-by-side form strings for both teams + standings position. Duplicates information from the rails Forme cards, but consolidated for pre-match scannability.

3. **Indisponibles**: short summary count of each team's unavailable players. Detail lives in rail Indispos cards. This is a glanceable summary.

**Tab content height pre-match**: ~480-540px.

#### Live state

```
┌─ Aperçu du match ─────────────────────────────────┐
│                                                   │
│  En direct · 67' · 2 – 1                          │
│                                                   │
│  ┌─ Timeline ──────────────────────────────────┐  │
│  │                                             │  │
│  │  90'+                                       │  │
│  │  ●  60' ⚽  Mbappé (Real Madrid)            │  │
│  │  ●  45' ⚽  Vinícius (Real Madrid)          │  │
│  │  ●  32' 🟨  Camavinga                       │  │
│  │  ●  18' ⚽  Bouzok (Real Oviedo)            │  │
│  │  ●   1' Coup d'envoi                        │  │
│  │                                             │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Content blocks**:

1. **Live indicator banner**: minute + current score reflected (also in score header but emphasized here)

2. **Timeline of events**: chronological list (most recent at top, oldest at bottom — descending order so the latest event is always visible without scrolling). Each event:
   - Minute marker (with `+X` extra time if applicable)
   - Event icon (⚽ goal / 🟨 yellow / 🟥 red / 🔄 substitution / 📺 VAR)
   - Player name + team in parentheses
   - For goals: assist info if available ("← Hamoutim")
   - For VAR: detail subtype ("But annulé" / "Penalty confirmé")

   Data source: `events` sub-resource within `/fixtures?id=X`. Refreshed every 15 seconds via Pusher.

**Live timeline updates push to top** when new events arrive — no manual refresh.

**Tab content height live**: ~400-700px (grows as events accumulate).

#### Post-match state

```
┌─ Aperçu du match ─────────────────────────────────┐
│                                                   │
│  Score final · 3 – 0  (FT)                        │
│                                                   │
│  Joueur du match                                  │
│  ┌─────────────────────────────────────────────┐  │
│  │  [Photo Mbappé]                             │  │
│  │  Kylian Mbappé · Note 8.4                   │  │
│  │  Real Madrid · 2 buts                       │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  Buteurs                                          │
│  Vinícius 45'  ·  Mbappé 60' 78'                  │
│                                                   │
│  ┌─ Timeline complète ─────────────────────────┐  │
│  │                                             │  │
│  │  90'+3 Fin du match                         │  │
│  │  ●  78' ⚽  Mbappé (Real Madrid)            │  │
│  │  ●  74' 🔄  Bellingham → Modric             │  │
│  │  ●  60' ⚽  Mbappé (Real Madrid)            │  │
│  │  ●  45' ⚽  Vinícius (Real Madrid)          │  │
│  │  ●  32' 🟨  Camavinga                       │  │
│  │  ●   1' Coup d'envoi                        │  │
│  │                                             │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  → Voir le résumé vidéo ↓                         │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Content blocks**:

1. **Final score banner**: prominent "Score final · 3 – 0 · FT"

2. **Joueur du match**: highest-rated player from `players` sub-resource (sorted by `rating` field descending). Photo + name + rating + team + key contribution (goals / assists / saves).

   Computation: server-side, sort all players by rating, pick top 1. Editorial override possible (`fixtures.player_of_match_override` field per fixture for narrative-driven choices).

3. **Buteurs**: goalscorer list (player + minute), one line. Same data shown in score header but repeated here for tab self-containment.

4. **Timeline complète**: full match events chronologically. Same component as live state but now showing all events through full-time.

5. **Anchor link to Videos**: "Voir le résumé vidéo ↓" — anchor-scrolls to the Videos section below the 3-column zone.

**Tab content height post-match**: ~550-700px.

**Coverage gating for Aperçu**:
- `/predictions` requires `coverage.predictions: true` — most major leagues have it. For competitions without: pre-match Aperçu hides the Predictions block, shows only Forme + Indispos summary.
- Events timeline requires `coverage.events: true`. For competitions without: live/post-match Aperçu shows score + buteurs only (no full timeline).

---

### Tab 2 — Composition

H2 (within content area): `Compositions probables` / `Composition de départ` / `Composition finale` (adapts to state).

#### Pre-match state (before lineups released)

```
┌─ Compositions probables ──────────────────────────┐
│                                                   │
│  Les compositions seront disponibles 20 à 40      │
│  minutes avant le coup d'envoi.                   │
│                                                   │
│  Heure prévue: 20h30  ·  Lineups attendues ~19h50│
│                                                   │
│  En attendant, consultez:                         │
│  →  Les indisponibles (rails ←→)                  │
│  →  La forme récente (rails ←→)                   │
│                                                   │
└───────────────────────────────────────────────────┘
```

Empty state until 20-40 minutes before kickoff. Honest about the wait — points users to other available content.

#### Pre-match state (once lineups released, T-30 min)

```
┌─ Compositions probables ──────────────────────────┐
│                                                   │
│  Real Madrid  4-2-3-1            Real Oviedo  4-4-2│
│                                                   │
│  ┌─ Pitch SVG ────────────────────────────────┐   │
│  │                                             │   │
│  │  (Real Madrid formation rendered top half) │   │
│  │  GK                                         │   │
│  │  RB  CB  CB  LB                             │   │
│  │     CM  CM                                  │   │
│  │  RW  CAM  LW                                │   │
│  │       ST                                    │   │
│  │  ─────────  centre line  ─────────         │   │
│  │       ST  ST                                │   │
│  │  RM  CM  CM  LM                             │   │
│  │  RB  CB  CB  LB                             │   │
│  │                  GK                         │   │
│  │  (Real Oviedo formation rendered bottom)   │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                   │
│  Banc:                                            │
│  Real Madrid: 7 remplaçants                       │
│  Real Oviedo: 7 remplaçants                       │
│                                                   │
│  Entraîneurs:                                     │
│  Real Madrid: Álvaro Arbeloa                      │
│  Real Oviedo: Guillermo Almada                    │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Content blocks**:

1. **Formation headers**: home team name + formation string (e.g., "4-2-3-1") on left; away team name + formation on right.

2. **Pitch SVG** — stacked orientation (TV-broadcast convention):
   - Home team formation rendered on TOP half of pitch
   - Center line divides the pitch
   - Away team formation rendered on BOTTOM half (mirrored — goalkeeper at the bottom)
   - Each player position rendered as a small circular badge with shirt number visible
   - Player name (surname) shown next to badge
   - Coords from API-Football `grid` field (`"row:column"` format)

   Pre-match: player photos shown without rating badges (no match data yet to display).

3. **Bench list**: collapsed view showing count + "Voir le banc →" expand link. Expanded: full list of 7 substitutes per team.

4. **Coaches**: both managers' names. Non-clickable in v1 (manager page Phase 6+ reserved at `/[locale]/entraineur/[slug]`).

#### Live state

Same pitch SVG. Active substitutions overlay as they happen — player who was substituted off dims (~50% opacity); replacement player overlaid at same position.

#### Post-match state — Composition de départ tab variant

```
┌─ Composition de départ ───────────────────────────┐
│                                                   │
│  Real Madrid 4-2-3-1 · Note moy: 7.22            │
│  Real Oviedo 4-4-2 · Note moy: 6.49              │
│                                                   │
│  Sous-onglet:  [Schéma ●]  [Stats joueurs]       │
│                                                   │
│  ┌─ Pitch SVG (Schéma sub-tab active) ────────┐  │
│  │                                             │  │
│  │  Real Madrid (top, with rating badges):    │  │
│  │  Courtois 6.9  Carvajal 7.2  Rüdiger 7.5   │  │
│  │  ...                                        │  │
│  │  ─────────                                  │  │
│  │  Real Oviedo (bottom):                     │  │
│  │  Escandell 5.8  ...                        │  │
│  │                                             │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  Substitutions:                                   │
│  Real Madrid:                                     │
│  · 74'  Modric → Bellingham                       │
│  · 82'  Joselu → Mbappé                           │
│                                                   │
│  Real Oviedo:                                     │
│  · 60'  Reina → Cazorla                           │
│  · 70'  Hassan → Paulino                          │
│  · 85'  Viñas → Fernández                         │
│                                                   │
└───────────────────────────────────────────────────┘
```

**New post-match elements**:

1. **Average team ratings** in header (e.g., "Note moy: 7.22"). Color-coded badge: green ≥7, yellow 6-7, orange <6.

2. **Sub-tab toggle** within Composition (Q-P6-O locked): **`Schéma` | `Stats joueurs`**:
   - **Schéma** (default): pitch SVG with rating badges per player
   - **Stats joueurs**: table view with per-player numerical stats (shots, passes, tackles, ratings, key contributions)

3. **Pitch SVG with per-player rating badges** overlaid on player photos. Color-coded badges (green ≥7 / yellow 6-7 / orange <6).

4. **Substitutions section**: timestamped substitution list per team.

#### Stats joueurs sub-tab (post-match, coverage-gated)

```
┌─ Stats joueurs · Real Madrid ─────────────────────┐
│                                                   │
│  #  Joueur            Note  Min  Buts  Pass  Tac  │
│  1  Courtois           6.9   90    -     14    -  │
│  2  Carvajal           7.2   90    -     45    3  │
│  22 Rüdiger            7.5   90    -     67    5  │
│  ...                                              │
│                                                   │
│  [Real Madrid] [Real Oviedo]   ← team toggle      │
│                                                   │
└───────────────────────────────────────────────────┘
```

Per-player stats table. Team toggle to switch between home and away teams.

Coverage gate: `statistics_players: true`. For competitions without per-player stats coverage: sub-tab hides; only Schéma view available.

**Tab content height Composition**: ~520-750px (pitch SVG is the dominant element).

---

### Tab 3 — Statistiques

H2 (within content area): `Statistiques du match`.

#### Pre-match state

```
┌─ Statistiques du match ───────────────────────────┐
│                                                   │
│  ℹ  Les statistiques apparaîtront une fois le     │
│     match commencé.                               │
│                                                   │
│  Heure prévue: 20h30                              │
│                                                   │
└───────────────────────────────────────────────────┘
```

Empty state. Honest about no data yet (vs Sofascore which shows season averages as filler).

#### Live + post-match state

```
┌─ Statistiques du match ───────────────────────────┐
│                                                   │
│  Real Madrid              vs              Real Oviedo│
│                                                   │
│  Tirs au but                                      │
│  ████████ 8                                  3 ██ │
│                                                   │
│  Tirs hors cadre                                  │
│  ██████ 6                                    4 ███│
│                                                   │
│  Tirs totaux                                      │
│  ██████████████ 14                           7 ███████│
│                                                   │
│  Tirs bloqués                                     │
│  ████ 4                                      2 ██ │
│                                                   │
│  Tirs dans la surface                             │
│  ██████████ 10                               5 ████│
│                                                   │
│  Tirs hors surface                                │
│  ████ 4                                      2 ██ │
│                                                   │
│  Possession de balle                              │
│  ████████████████ 64%                      36% ████████│
│                                                   │
│  Passes totales                                   │
│  ████████████ 487                          268 ███████│
│                                                   │
│  Passes précises                                  │
│  ████████████ 426                          204 █████│
│                                                   │
│  Précision passes                                 │
│  ███████████ 87%                           76% ███████│
│                                                   │
│  Fautes                                           │
│  ██ 8                                       14 █████│
│                                                   │
│  Corners                                          │
│  ████ 4                                      2 ██ │
│                                                   │
│  Hors-jeu                                         │
│  █ 1                                         3 ██ │
│                                                   │
│  Cartons jaunes                                   │
│  ██ 2                                        3 ███│
│                                                   │
│  Cartons rouges                                   │
│  0                                          0     │
│                                                   │
│  Arrêts du gardien                                │
│  █ 1                                         5 ████│
│                                                   │
└───────────────────────────────────────────────────┘
```

**Content structure**:

16 stat rows. Each row:
- Stat label centered above
- Two horizontal bars on either side of center divider
- Home team value on LEFT (bar extends from center to the left, length proportional to value)
- Away team value on RIGHT (bar extends from center to the right)
- Numerical value displayed at the end of each bar

**Color coding**: home team color (e.g., Real Madrid white/gold) for left bars; away team color (e.g., Real Oviedo blue) for right bars. For neutral display: gold (home) / teal (away) generic colors when team brand colors aren't defined.

**The 16 stat types** (locked from API-Football data sweep):
1. Shots on Goal (Tirs au but)
2. Shots off Goal (Tirs hors cadre)
3. Total Shots (Tirs totaux)
4. Blocked Shots (Tirs bloqués)
5. Shots insidebox (Tirs dans la surface)
6. Shots outsidebox (Tirs hors surface)
7. Ball Possession (Possession de balle)
8. Total passes (Passes totales)
9. Passes accurate (Passes précises)
10. Passes % (Précision passes)
11. Fouls (Fautes)
12. Corner Kicks (Corners)
13. Offsides (Hors-jeu)
14. Yellow Cards (Cartons jaunes)
15. Red Cards (Cartons rouges)
16. Goalkeeper Saves (Arrêts du gardien)

Data source: `/fixtures/statistics?fixture=X` (or embedded in `/fixtures?id=X` master object).

**Null values**: any stat can be null. Displayed as "—" placeholder, not as 0. (Important: 0 means "team has zero of this stat"; null means "data not reported".)

**Coverage gate**: `statistics_fixtures: true`. For competitions without statistics coverage (most lower-tier leagues): tab content area shows empty state "Statistiques non disponibles pour cette compétition." Tab still appears in tab strip — clicking it shows the empty state. Honest about coverage limitations.

**Tab content height Statistiques**: ~600-700px when populated; ~120px empty state.

---

### Tab 4 — Confrontations

H2 (within content area): `Confrontations directes`.

```
┌─ Confrontations directes ─────────────────────────┐
│                                                   │
│  Bilan: Real Madrid 5 · Nul 4 · Real Oviedo 1     │
│                                                   │
│  ┌─ Filtres ───────────────────────────────────┐  │
│  │  [Toutes compétitions ●] [LaLiga seulement] │  │
│  │  [Toutes équipes ●] [Au Bernabéu]           │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─ 10 derniers matchs ────────────────────────┐  │
│  │                                             │  │
│  │  24/08/25  FT   Real Oviedo  0 – 3  RMA     │  │
│  │  LaLiga · Carlos Tartiere                   │  │
│  │                                             │  │
│  │  19/02/24  FT   Real Madrid  3 – 1  OVI     │  │
│  │  Copa del Rey · Bernabéu                    │  │
│  │                                             │  │
│  │  12/05/01  FT   Real Madrid  2 – 0  OVI     │  │
│  │  LaLiga · Bernabéu                          │  │
│  │                                             │  │
│  │  (...older matches truncated)               │  │
│  │                                             │  │
│  │  Voir tous les face-à-face →                │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Content blocks**:

1. **Bilan headline**: "Real Madrid 5 · Nul 4 · Real Oviedo 1" — aggregate record from past meetings. Counts derived from API response.

2. **Filter pills**:
   - All competitions / This competition only
   - All venues / At {home_team_venue} only

3. **Past meetings list**:
   - Date (DD/MM/YY)
   - Status (FT / AET / PEN)
   - Match score in format: `{team_a} {score} – {score} {team_b}`
   - Competition + venue on second line
   - Each row clickable → that match's Page 6 (if we have it indexed) or routes to results archive

4. **"Voir tous les face-à-face →"**: if more than 10 past meetings, this link expands the list inline (Phase 4.5) or routes to a Phase 6+ scoped archive page.

**Data source**: `/fixtures/headtohead?h2h={home_id}-{away_id}&last=10`. Returns up to 10 most recent past meetings as full fixture objects.

Cached at 24h TTL — past meetings don't change frequently. Refresh more aggressively after the current match concludes (it becomes a past meeting then).

**Empty state** (first-ever meeting between two teams):

```
Premier face-à-face entre Real Madrid et Real Oviedo en LaLiga.
Aucune confrontation passée à afficher.
```

**Tab content height Confrontations**: ~400-600px depending on meeting count.

---

### Center column — Mobile (375px)

Same card structure, narrower. Tab strip remains horizontal — 4 tabs at ~16px text fit comfortably at 375px width.

Tab content adapts per state per tab as on desktop. Pitch SVG in Composition tab scales proportionally; stat bars in Statistiques fit narrower viewport with adjusted typography.

---

## Section 8 — Right rail (~280-300px) — Away team context

Three cards stacked, mirroring the left rail symmetrically. All content scoped to the **away team in the context of this match**. Total rail height ~620-720px.

Cards are structurally identical to left rail cards (Section 6), with content swapped to the away team.

### Card 1 — Forme & classement card (~110-130px)

```
┌─ Forme · Real Oviedo ─────────────────────────┐
│                                                │
│  20ème · LaLiga · 29 pts                       │
│                                                │
│  Forme: W D L L D                              │
│                                                │
│  Domicile: L L L D L                           │
│  Extérieur: W W D L D                          │
│                                                │
│  Voir le classement complet →                  │
└────────────────────────────────────────────────┘
```

Same data source as left rail Card 1 (`/standings`), filtered to away team. Same "Voir le classement complet →" link to competition's Page 2.

### Card 2 — Et après card (~170-200px)

```
┌─ Et après · Real Oviedo ──────────────────────┐
│                                                │
│  Prochains 3 matchs                            │
│                                                │
│  19/05  ·  Girona (ext.)                       │
│           LaLiga J37                           │
│                                                │
│  25/05  ·  Levante (dom.)                      │
│           LaLiga J38                           │
│                                                │
│  31/05  ·  À confirmer                         │
│           Friendly                             │
└────────────────────────────────────────────────┘
```

Same data source as left rail Card 2 (`/fixtures?team={away_team_id}&next=3`).

### Card 3 — Indispos card (~120-180px)

```
┌─ Indispos · Real Oviedo ──────────────────────┐
│                                                │
│  Pour ce match                                 │
│                                                │
│  • Javi López         · suspendu (rouge)       │
│  • Kwasi Sibo         · suspendu (rouge)       │
│                                                │
│  Doubtful:                                     │
│  • Leander Dendoncker · muscle                 │
│                                                │
└────────────────────────────────────────────────┘
```

Same data source (`/injuries?fixture=X`), filtered to away team.

### Symmetric mirror — design and behavior

Both rails:
- Same 3-card structure (Forme / Et après / Indispos)
- Same data sources (with team_id swap)
- Same card heights (drift slightly per actual content)
- Same visibility states (Indispos hidden post-match for both)
- Same outbound link patterns

The user gets a coherent "Real Madrid's situation" vs "Real Oviedo's situation" comparison by glancing left and right.

### Asymmetric column widths (Pages 2-5 design system retained)

Left rail at ~360-380px is slightly wider than right rail at ~280-300px. Visual treatment per card:
- Forme card adapts to narrower right rail (~280px): same content, tighter padding
- Et après card adapts: same 3-fixture list, slightly compressed
- Indispos card adapts: same list, narrower line wraps

The width asymmetry is the design system default across Pages 2-5. Cards work at either width since content is vertical-list-oriented.

---

## Section 9 — Vidéos section (below 3-column zone, full content width)

Standalone section below the 3-column zone. **Post-match only**. Hidden pre-match and during live state (videos don't exist yet).

```
┌─ Vidéos ────────────────────────────────────────────────┐
│                                                         │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│ │  Thumbnail   │  │  Thumbnail   │  │  Thumbnail   │    │
│ │  [▶ play]    │  │  [▶ play]    │  │  [▶ play]    │    │
│ ├──────────────┤  ├──────────────┤  ├──────────────┤    │
│ │ Résumé du    │  │ Tous les     │  │ Réactions    │    │
│ │ match        │  │ buts         │  │ d'après-match│    │
│ │ 3:42 · YT    │  │ 1:24         │  │ 5:15         │    │
│ └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                         │
│  Voir plus →                                            │
└─────────────────────────────────────────────────────────┘
```

H2: `Vidéos` (FR) / `Videos` (EN) / `فيديوهات` (AR).

### Layout + implementation

Identical to Pages 3-5 Videos section spec:
- 3-up grid at ≥1280px, 2-up at 768-1279px, 1-column on mobile
- `youtube-nocookie.com` domain (no tracking cookies until user clicks)
- `loading="lazy"` on iframes
- Facade pattern: thumbnail + play button initially; swap to iframe on first user click
- In-place inline playback (modal upgrade Phase 6+)

### Content curation

`fixtures.media_youtube_ids: string[]` field per match. Hand-curated post-match:
- Priority matches (Atlas Lions, Botola Pro top fixtures, derby matches, knockout-stage): 3-6 videos each
- Standard matches: 1-3 videos when editorial team adds them
- Lower-priority matches: empty array (Videos section hidden)

Editorial cadence: videos added within 24-48 hours of match conclusion for priority fixtures.

### Empty state

If `media_youtube_ids` is empty (most common pre-match and for non-priority post-match):

```
Aucune vidéo disponible pour ce match.
```

Or section hides entirely (TBD per UX preference at 4.5a).

### Visibility states

- **Pre-match**: section hidden entirely
- **Live**: section hidden entirely
- **Post-match**: section visible if videos curated; hidden if no videos and no editorial intent

---

## Section 10 — About card (full content width)

Long-form keyword-bearing content at page bottom, after the Videos section, before the footer.

6 H2 sections + 6-8 FAQ entries, hand-written per locale for priority matches. Templated for the rest.

### Structure for Real Madrid vs Real Oviedo (FR worked example)

```
## À propos du match Real Madrid vs Real Oviedo

Real Madrid affronte Real Oviedo le 14 mai 2026 à 20h30 au Stade Santiago 
Bernabéu, comptant pour la 36ème journée de LaLiga 2025/26. Le club madrilène 
joue à domicile face à un Real Oviedo en lutte pour le maintien.

## Historique des rencontres

Real Madrid et Real Oviedo se sont rencontrés à 10 reprises depuis 2001, avec 
un avantage net pour les Madrilènes (5 victoires contre 1 pour Oviedo et 4 
nuls). La dernière rencontre, le 24 août 2025, s'est soldée par une victoire 
3-0 de Real Madrid à l'extérieur. Real Oviedo, club historique d'Asturies, a 
fait son retour en LaLiga après plusieurs saisons en LaLiga 2.

## Le Stade Santiago Bernabéu

Le match se joue au Stade Santiago Bernabéu, à Madrid (Espagne), enceinte 
mythique de 84 744 places qui accueille les matchs du Real Madrid depuis 
1947. Récemment rénové, le stade combine architecture historique et 
équipements modernes.

## Diffusion

Le match est diffusé en Espagne sur Movistar+. Au Maroc, la chaîne 
spécifique reste à confirmer — les matchs de LaLiga sont généralement 
disponibles sur les plateformes sportives internationales.

## L'enjeu pour les deux équipes

Pour Real Madrid (2ème, 77 pts), une victoire consolide la deuxième place et 
maintient une pression théorique sur le leader. Pour Real Oviedo (20ème, 
29 pts), le maintien est arithmétiquement très compromis — chaque match 
restant est crucial.

## Atlas Kings et ce match

Atlas Kings couvre les matchs de LaLiga avec une attention particulière aux 
joueurs marocains évoluant en Espagne et aux affrontements de Real Madrid en 
contexte continental. Aucun joueur marocain ne figure actuellement dans les 
effectifs de Real Madrid ou de Real Oviedo.

## Questions fréquentes

### Où se joue Real Madrid vs Real Oviedo ?
Au Stade Santiago Bernabéu à Madrid, Espagne. Capacité: 84 744 places.

### À quelle heure commence le match ?
Le coup d'envoi est prévu à 20h30 (heure locale espagnole) le 14 mai 2026.

### Qui est l'arbitre du match ?
Ricardo De Burgos Bengoetxea (Espagne) officie cette rencontre.

### Quelle chaîne diffuse le match ?
Movistar+ en Espagne. Au Maroc, la diffusion reste à confirmer.

### Quel est le classement actuel des deux équipes ?
Real Madrid est 2ème de LaLiga avec 77 points. Real Oviedo est 20ème avec 
29 points et en lutte pour le maintien.

### Quels sont les joueurs absents pour ce match ?
Real Madrid a 5 absents (Güler, Valverde, Mendy, Rodrygo, Militão) et 2 
joueurs doutful (Lunin, Huijsen). Real Oviedo a 2 suspensions (Javi López, 
Sibo) et 1 doute (Dendoncker).

### Qui est favori selon les prédictions ?
Real Madrid est largement favori (87% selon notre modèle statistique), avec 
6% pour le nul et 7% pour Real Oviedo.

### Y a-t-il des joueurs marocains dans ce match ?
Non. Ni Real Madrid ni Real Oviedo ne comptent de joueur marocain dans leur 
effectif actuel.
```

Per-locale variants. Arabic uses passionate fan-aligned tone. For Atlas Lions matches, the "أسود الأطلس" team term used prominently.

### About card content schema

About card content lives in `fixtures` table per entry:

```typescript
about_fr: {
  intro: string,                  // match identity sentence
  history: string,                // past meetings narrative
  venue_context: string,          // venue significance
  broadcast: string,              // broadcaster info
  editorial: string,              // Atlas Kings framing (incl. Morocco angle if applicable)
  faqs: Array<{ q: string, a: string }>
}
about_en: { ... }
about_ar: { ... }
```

Hand-written for priority matches (Atlas Lions, Botola Pro top fixtures, derbies, knockout finals). Templated for the rest, with hand-curation upgrade path.

### Morocco angle handling

For matches involving:
- **Both Moroccan teams** (Botola Pro): "Atlas Kings et ce match" section is extensive, framing the rivalry context
- **One Moroccan team** (Atlas Lions vs X, or Moroccan club in CAF): editorial section frames the national / continental significance
- **Neither team Moroccan, but Moroccan players involved** (e.g., PSG vs Real Madrid with Hakimi): editorial section names the Moroccan players involved
- **Neither team Moroccan, no Moroccan players** (e.g., Real Madrid vs Real Oviedo): editorial section honestly notes "Aucun joueur marocain ne figure actuellement dans les effectifs" — no fake Morocco angle

---

## Section 11 — Live data and caching

### Pusher subscriptions on this page

| Element | Pusher channel | Update cadence |
|---|---|---|
| Adaptive top strip | (global, not match-specific) | per-event |
| Score header center area | `fixture-{id}-state` for state transitions | on transition |
| Score header score value | `fixture-{id}` for goal events | on goal |
| Left rail Forme card | `team-{home_id}-form` | post-match (after a different match concludes) |
| Left rail Et après card | `team-{home_id}-fixtures` | daily |
| Left rail Indispos card | `fixture-{id}-injuries` | hourly pre-match |
| Center card — Aperçu live events | `fixture-{id}-events` | per-event (live) |
| Center card — Composition lineups | `fixture-{id}-lineups` | on release (20-40min pre) + subs |
| Center card — Statistiques | `fixture-{id}-statistics` | every 15s during live |
| Center card — Confrontations | (static, no Pusher) | 24h cache |
| Right rail Forme card | `team-{away_id}-form` | post-match (after a different match concludes) |
| Right rail Et après card | `team-{away_id}-fixtures` | daily |
| Right rail Indispos card | `fixture-{id}-injuries` | hourly pre-match |
| Vidéos section | `fixture-{id}-media` | post-match |

### Server-side caching

| Element | TTL pre-match >24h | TTL pre-match <24h | TTL live | TTL post-match <24h | TTL post-match >24h |
|---|---|---|---|---|---|
| Score header | 1h | 5min | 0s (push) | 5min | 24h |
| Left rail Forme | 1h | 1h | 1h | 5min | 24h |
| Left rail Et après | 1h | 1h | 1h | 1h | 1h |
| Left rail Indispos | 1h | 5min | hidden | hidden | hidden |
| Aperçu tab | 1h | 5min | 0s (push) | 5min | 24h |
| Composition tab | 1h | 1min (20-40min before) | 0s (push) | 5min | 24h |
| Statistiques tab | hidden | hidden | 0s (push) | 5min | 24h |
| Confrontations tab | 24h | 24h | 24h | 24h | 24h |
| Right rail | same as left | same as left | same as left | same as left | same as left |
| Vidéos | hidden | hidden | hidden | 1h | 24h |
| About card | 24h | 24h | 24h | 24h | 24h |

State transitions invalidate cache immediately via Pusher emit. Goal events invalidate score header + Aperçu (timeline) + Statistiques (shots/passes affected).

### API call budget per page render

For a single Page 6 render:

**Pre-match >24h** (cold cache):
1. `/fixtures?id=X` — master object (1 call)
2. `/standings?league=X&season=Y` — for Forme cards (1 call, shared for both teams)
3. `/fixtures?team={home_id}&next=3` — left rail Et après (1 call)
4. `/fixtures?team={away_id}&next=3` — right rail Et après (1 call)
5. `/injuries?fixture=X` — both rails Indispos (1 call, filtered per team)
6. `/predictions?fixture=X` — Aperçu pre-match (1 call)
7. `/fixtures/headtohead?h2h={home_id}-{away_id}&last=10` — Confrontations tab (1 call)

**7 API calls per cold render.** All cacheable for 1h+ pre-match.

**Live** (cold cache rare — typically warmed):
1. `/fixtures?id=X` — refreshed every 15s, contains embedded events/lineups/statistics/players

**1 API call per 15s during live**. The master object refresh is the only thing needed; everything else is either static historical (Confrontations) or hidden during live (Indispos / pre-match Aperçu blocks).

**Post-match** (warm cache):
- Master fixture: 5min TTL initially, expanding to 24h+
- All other endpoints: 24h+ TTL

Page 6 is **less API-intensive than expected** because the embedded master object covers most needs.

---

## Section 12 — Mobile (375px)

### Single-column stacked layout

```
[ADAPTIVE TOP STRIP ~40px]
[TOPBAR ~56px condensed]
[SEO breadcrumb ~22px, compact]
[SCORE HEADER CARD — mobile condensed ~220-280px]
  Crests + names stacked (2-col mini-grid)
  State-adaptive center (full width)
  Sub-row metadata (wrapped multi-line)
[INTRO PARAGRAPH (full text)]
[LEFT RAIL CARDS — Home team]
  Forme · Et après · Indispos
[CENTER CARD — match story]
  Tab strip (horizontal, 4 tabs fit at 375px)
  Active tab content (scales to viewport)
[RIGHT RAIL CARDS — Away team]
  Forme · Et après · Indispos
[VIDÉOS SECTION] (post-match)
  1-column video stack
[ABOUT CARD — full content]
[FOOTER vertical stack]
[FIXED BOTTOM TAB BAR ~56px]
```

### Mobile content order rationale

Score header first (the match identity). Then the home team's context cards (left rail content). Then the center match card (the tabs). Then the away team's context cards (right rail content). Videos and About at the bottom.

This LTR-friendly order works because:
- Score header establishes WHAT this page is
- Home team rail establishes WHO is playing at home (often the user's primary interest)
- Match card has the deep content (tabs)
- Away team rail completes the "both teams" picture
- Below-the-fold content (videos, about) wraps up

For Arabic RTL: same logical order. The "left rail" and "right rail" labels refer to LTR positions; on RTL the home team rail appears on the right side of the screen but in the same logical position in the stacked mobile flow.

### Mobile center card — pitch SVG

Composition tab's pitch SVG scales proportionally. At 375px width:
- Pitch SVG renders at ~340-360px width (with horizontal padding)
- Player badges stay legible at smaller scale
- Player names abbreviate (initials + surname) at narrow viewport

### Mobile statistics tab

Statistics bars stack vertically per stat, with home/away comparison maintained:
- Stat label above
- Home bar (left-aligned at narrow width)
- Away bar (right-aligned at narrow width)

Or alternative: keep horizontal home-left + away-right comparison, just narrower bars. TBD per 4.5a UX preference.

---

## Section 13 — All locked decisions summary

| Element | Decision |
|---|---|
| Page identity | Match detail family. Real Madrid vs Real Oviedo canonical worked example. Wydad vs Raja, Atlas Lions internationals, etc. covered as Format Variants. |
| URL canonical | `/[locale]/match/[match-slug]` — slug pattern `{home-slug}-vs-{away-slug}-YYYY-MM-DD` |
| URL — `/match/` segment | Not translated; same across all locales |
| Tab state | Hash fragments per locale (`#apercu` / `#composition` / `#statistiques` / `#confrontations`) |
| hreflang | All three locale variants reference each other; `x-default` → FR |
| Layout | Full-width score header above 3-column shell. Maintains Pages 2-5 design system (left ~360-380, center ~500-520, right ~280-300). |
| Score header | ONE card spanning full content width. State-adaptive center (kickoff/score/FT). Shared metadata sub-row identical across states. Crests clickable to team pages. NO favourite/compare/calendar buttons (Phase 6+/10 deferred). NO bet365/odds/promo (Loi 09-08). |
| Score state machine | 7 states: pre-match >24h, pre-match <24h, pre-match <1h, live (1H/2H/ET/P/BT), HT/break, post-match basic, post-match with goalscorers. Pusher invalidates on transitions. |
| Left rail content | 3 cards: Forme · Et après · Indispos — all about home team for this match |
| Center column | ONE card with tab strip at top + content area below. 4 tabs: Aperçu (default) · Composition · Statistiques · Confrontations. Click tab → content area swaps. |
| Default tab | Aperçu always default; state-adaptive content within |
| Aperçu tab | Pre-match: predictions + form comparison + indispos summary. Live: events timeline. Post-match: match summary + player of match + full timeline + videos anchor link. |
| Composition tab | Pre-match before lineup release: "Lineups disponibles ~20-40 min avant". Pre-match after release: stacked-pitch SVG (TV-broadcast convention) with formations. Live: confirmed XI + live substitutions overlay. Post-match: with per-player rating badges + Schéma/Stats joueurs sub-toggle (Q-P6-O). |
| Statistiques tab | Pre-match: empty state. Live + post-match: 16 stat types with comparative bars. Coverage-gated by `statistics_fixtures`. |
| Confrontations tab | Bilan H2H summary + filterable past meetings list. Always available. |
| NO Standings tab | Routed to Page 2 via "Voir le classement complet →" link in rails Forme cards. Page 6 stays focused on this match. |
| NO Media tab | Videos in dedicated section below 3-column zone (consistent with Pages 3-5). |
| Right rail content | 3 cards mirroring left rail: Forme · Et après · Indispos — all about away team for this match |
| Symmetric rails | Both rails serve equivalent roles (one team each). Asymmetric column widths (360 vs 280) retained from Pages 2-5 design system. |
| MoroccoConnection widget | NOT present as standalone widget. Morocco angle surfaces in About card editorial section when applicable. |
| Pitch diagram orientation | Stacked (Flashscore-style, TV-broadcast convention): home team top, center line, away team bottom mirrored |
| Per-match rating display | On lineup pitch post-match: color-coded badges (green ≥7, yellow 6-7, orange <6). API-Football `/fixtures/players` rating field. |
| Referee surfacing | Sub-row in score header (name + nationality only). NO career stats (API-Football doesn't provide). Phase 6+ feature page reserved at `/[locale]/arbitre/[slug]`. |
| Venue surfacing | Sub-row in score header (name + city). Phase 6+ feature page reserved at `/[locale]/stade/[slug]`. |
| Predictions framing | "Prédiction Atlas Kings · Basé sur un modèle statistique". NOT framed as betting recommendation. Loi 09-08 compliant. |
| Coverage gating | Each tab gracefully degrades to empty state when coverage flag is false. Tab still appears; content area shows honest empty state. |
| Vidéos section | Standalone section below 3-column zone. Post-match only. Hidden pre-match and live. youtube-nocookie.com + facade lazy-load. |
| About card | Bottom of page. 6 H2 sections + 6-8 FAQ. Hand-written per locale for priority matches. |
| Live data | Pusher `fixture-{id}` for any change; `fixture-{id}-state` for state transitions; 15s polling fallback. |
| Caching | 1h pre-match >24h / 5min pre-match <24h / 0s live / 5min post-match <24h / 24h post-match >24h |
| Mobile (375px) | Single-column stack. Score header → home rail → center card → away rail → Videos → About. Pitch SVG scales. |
| Compliance | Loi 09-08 (no odds anywhere, no betting promos, no vote widgets). YouTube via youtube-nocookie.com. No Sign In until Phase 10. |
| Placeholder content | Real Real Madrid vs Real Oviedo seed data for canonical instance. Wydad vs Raja seeded by editorial for Botola Pro canonical. |

---

## Section 14 — Component inventory for Phase 4.5 implementation

### New components to build (Page 6 specific)

| Component | Location | Reuse |
|---|---|---|
| MatchPageHeader | src/components/match/MatchPageHeader.tsx | Page 6 only |
| MatchScoreHeader | src/components/match/MatchScoreHeader.tsx | Page 6 only |
| MatchScoreHeaderCenter | src/components/match/MatchScoreHeaderCenter.tsx | Page 6 — state machine for 7 score states |
| MatchScoreHeaderSubRow | src/components/match/MatchScoreHeaderSubRow.tsx | Page 6 — shared metadata row |
| MatchLiveIndicator | src/components/match/MatchLiveIndicator.tsx | Page 6 — animated pulsing dot |
| MatchTabStrip | src/components/match/MatchTabStrip.tsx | Page 6 — 4-tab navigation within match card |
| MatchCard | src/components/match/MatchCard.tsx | Page 6 — center column container card |
| ApercuTabContent | src/components/match/ApercuTabContent.tsx | Page 6 — state-adaptive overview |
| ApercuPredictions | src/components/match/ApercuPredictions.tsx | Page 6 — winner percent bars + advice |
| ApercuEventsTimeline | src/components/match/ApercuEventsTimeline.tsx | Page 6 — live/post events stream |
| ApercuMatchSummary | src/components/match/ApercuMatchSummary.tsx | Page 6 — post-match summary + player of match |
| CompositionTabContent | src/components/match/CompositionTabContent.tsx | Page 6 — pitch + lineups |
| MatchPitchSVG | src/components/match/MatchPitchSVG.tsx | Page 6 — stacked pitch with both formations |
| MatchPitchPlayerBadge | src/components/match/MatchPitchPlayerBadge.tsx | Page 6 — player badge with rating overlay |
| SubstitutionAnnotation | src/components/match/SubstitutionAnnotation.tsx | Page 6 — sub icon + timestamp |
| StatsJoueursSubTab | src/components/match/StatsJoueursSubTab.tsx | Page 6 — per-player stats table (post-match) |
| StatistiquesTabContent | src/components/match/StatistiquesTabContent.tsx | Page 6 — 16-stat comparison bars |
| MatchStatBar | src/components/match/MatchStatBar.tsx | Page 6 — single stat comparison bar component |
| ConfrontationsTabContent | src/components/match/ConfrontationsTabContent.tsx | Page 6 — H2H summary + past meetings |
| H2HSummaryBar | src/components/match/H2HSummaryBar.tsx | Page 6 — "5-4-1" headline |
| H2HMeetingRow | src/components/match/H2HMeetingRow.tsx | Page 6 — past meeting list row |
| TeamFormCard | src/components/match/TeamFormCard.tsx | Page 6 — both rails Card 1 (left + right) |
| TeamNextFixturesCard | src/components/match/TeamNextFixturesCard.tsx | Page 6 — both rails Card 2 |
| TeamInjuriesCard | src/components/match/TeamInjuriesCard.tsx | Page 6 — both rails Card 3 |
| MatchAboutCard | src/components/match/MatchAboutCard.tsx | Page 6 — long-form SEO content |

### Reused from Pages 2-5 (no changes needed)

- InnerPageShell
- FixtureRow (in TeamNextFixturesCard)
- VideosSection (Pages 3-5)
- YouTubeFacade
- AboutCard structure
- FAQList
- StructuredDataInjector (with SportsEvent variant)
- FifaRankingBadge (when national-team match context)
- FormStringBadge (rendering "WWDLW" with color coding)

### Reused from homepage.md (no changes needed)

- AdaptiveTopStrip
- Topbar
- SeoBreadcrumb
- Footer
- MobileBottomTabBar
- MobileHamburgerDrawer

### Database schema additions required

```typescript
// fixtures table (extends API-Football's /fixtures data with editorial fields)
slug, slug_ar,
home_team_id, away_team_id (FK to teams),
competition_id, round,
date_iso, timestamp,
status_short, status_long, elapsed, extra,
venue_id, venue_name, venue_city,
referee_name, referee_nationality,
goals_home, goals_away,
score_halftime_home/away, score_fulltime_home/away, score_extratime_home/away, score_penalty_home/away,
coverage_events, coverage_lineups, coverage_statistics_fixtures, coverage_statistics_players,
coverage_predictions, coverage_injuries,
media_youtube_ids,
about_fr/en/ar (jsonb with intro/history/venue_context/broadcast/editorial/faqs),
player_of_match_override (FK to players, optional editorial override)

// Indexes
home_team_id, away_team_id, competition_id, status_short, date_iso, slug
```

---

## Section 15 — Open questions for Phase 4.5 implementation

| Question | Owner | Decision target |
|---|---|---|
| Indispos card empty state — hide entirely or show "Aucun joueur indisponible" message? | UX | 4.5a |
| Aperçu pre-match block ordering — predictions first, or form first? | UX | 4.5a |
| Composition tab pre-match empty state — point to rails or just say "20-40min before"? | UX | 4.5a |
| Statistiques tab pre-match — pure empty state or show "no data yet, season averages: ..."? | Product | 4.5a — recommend pure empty state for honesty |
| Confrontations tab — initial display: 5 / 10 / unlimited past meetings? | UX | 4.5a |
| Player of the match — algorithmic highest-rated, or editorial override available? | Editorial | 4.5b |
| Pitch SVG mobile — keep stacked or rotate to side-by-side? | UX | 4.5b |
| Live events timeline ordering — newest at top or chronological (oldest at top)? | UX | 4.5a |
| Stats joueurs sub-tab — column visibility per position (GK vs outfield)? | Product | 4.5b |
| Match transitioning to live — push-rendered transition or page reload? | Engineering | 4.5b |
| Videos empty state post-match — show "Aucune vidéo" message or hide section? | UX | 4.5a |
| About card market value mentions for players? | Editorial | 4.5b |
| Hreflang for Arabic slugs — native script or romanized fallback for compatibility? | Engineering / SEO | 4.5a |

---

## Section 16 — Differences from Sofascore Real Madrid vs Real Oviedo reference

| Element | Sofascore | Atlas Kings |
|---|---|---|
| URL structure | `/football/match/real-oviedo-real-madrid/Egbsbhb#id:14083649` (trailing slug-id, /football root, ENGLISH ordering "oviedo-real-madrid") | `/[locale]/match/{home}-vs-{away}-YYYY-MM-DD` (locale-translated slugs, no trailing ID, consistent home-first ordering) |
| Locale handling | One URL (English-dominant) | Locale-translated slugs with hreflang bridges |
| Score header structure | Crests + score/time + metadata sub-row + favourite/compare/calendar buttons top-right | Same structure, **NO** favourite/compare/calendar (Phase 6+/10 deferred) |
| FAVOURITE button | Present | NOT present in v1; slot reserved for Phase 10 auth |
| COMPARE button | Present | NOT present; moved to Phase 6+ |
| Add to calendar button | Present | NOT present; moved to Phase 6+ |
| Bet365 odds card (left column) | Present pre-match AND post-match | NOT present; removed for Loi 09-08 |
| Sign-up bonus promo | Present | NOT present; removed for Loi 09-08 |
| 18+ disclaimer banner | Full-width below ad | NOT present (nothing to disclaim) |
| Vote widget carousel (Who will win? / Both teams score? / First scorer?) | Present | NOT present; gambling-adjacent gamification removed |
| Featured Players pentagon (Camavinga vs Calvo radar) | Present | NOT present — proprietary composite, no API data, editorial guess |
| Sofascore Analyst AI promo | Present | NOT present — no premium tier in v2 |
| Prematch standings card | Compact 2-row standings in left column | Replaced by Forme card per rail (per-team form + standings position) |
| TV channels card with country flag dropdown | Present | Simplified — TV broadcaster in score header sub-row, Morocco-first framing |
| Match info card (Date/Competition/Referee) | Present as left-column card | Consolidated into score header sub-row (no duplicate card) |
| Venue card with photo + capacity + map link | Present | Simplified — venue name + city in score header sub-row; Phase 6+ feature page reserved |
| Featured players card with pentagon | Present | NOT present — replaced by per-rail "Indispos" + center column "Composition" tab (per-player ratings on pitch) |
| Sofascore Fantasy promo card | Present | NOT present — Rule 11 (out of scope) |
| Left column purpose | 10 cards including bet365/promos | 3 cards entirely about home team's context for this match |
| Right column at 1133px | Empty (Sofascore doesn't fill right rail at narrow viewport) | 3 cards entirely about away team's context (consistent design system) |
| Center column tab set | 5 tabs (Lineups / Statistics / Standings / H2H / Media) | 4 tabs (Aperçu / Composition / Statistiques / Confrontations) — Standings dropped (routed to Page 2), Media dropped (Videos in dedicated section below), Aperçu added as state-adaptive default |
| Default tab | Lineups (for upcoming) / Statistics (for played) | Aperçu always default — adapts to state internally |
| Lineups title | "Possible lineups" pre-match | "Compositions probables" pre-match → "Composition de départ" once confirmed → "Composition finale" post-match |
| Pitch orientation | Split-pitch (home left half, away right half, vertical divider) | Stacked-pitch (home top, away bottom, horizontal divider) — TV-broadcast convention, more universal |
| Lineups sub-toggle | "Lineups / Player stats" toggle (post-match) | "Schéma / Stats joueurs" sub-tab (post-match, coverage-gated) — same intent, French labeling |
| Statistics tab pre-match | Season statistics as filler ("Match & player stats appear once kicked off" + season stats) | Pure empty state — honest about no match data yet |
| Statistics tab data | Limited; some stats null | Same 16 stat types (API-Football limit) |
| Standings tab | Full league table with both teams highlighted | NOT present — routed to Page 2 via rails' "Voir le classement complet →" link |
| H2H tab | Two-column: past meetings + recent form per team toggle | Single-column: bilan headline + filterable past meetings list (recent form per team already in rails) |
| Media tab | Sub-tabs All/Highlights/Social/News | NOT present — Videos in dedicated section below 3-column zone; news deferred Phase 12+ |
| YouTube embeds | Standard `youtube.com` (tracking cookies) | `youtube-nocookie.com` + facade lazy-load |
| Post-match left column changes | Adds match highlights video card + AI analysis text + commentary log + highest-rated players + post-match article | Highlights in dedicated Videos section; rest deferred or simplified |
| Per-match rating display on pitch | Shown post-match (Sofascore proprietary algorithm) | Shown post-match (API-Football `/fixtures/players` rating field — same field source Sofascore likely uses) |
| Live commentary text feed | Present in left column | NOT present — no API source for textual commentary; events timeline serves as proxy |
| Attack Momentum chart | Present (Sofascore proprietary) | NOT present — no API data; Sofascore-only feature |
| Per-team big chances / xG | Present | NOT present — no API data |
| Embed widget button | Present | Deferred Phase 12+ (syndication) |
| Right column at 1280px+ | Empty / ads at wider viewports | Full per-team symmetric content |
| Mobile breakpoint | Same desktop structure compressed | Single-column stack with logical re-ordering |

---

## Section 17 — Format variants

Atlas Kings Page 6 template canonically documents Real Madrid vs Real Oviedo. This section documents deltas for other match types.

### Variant A — Domestic Moroccan derby (Botola Pro)

**Applies to**: Wydad AC vs Raja CA, Wydad vs FAR, MAS vs Maghreb, etc. — Botola Pro top fixtures.

**Key reference**: Wydad AC vs Raja CA (Casablanca derby) — recurring 2x per season.

**Deltas from Real Madrid vs Real Oviedo canonical**:

| Element | Canonical | Variant A |
|---|---|---|
| Score header sub-row TV | Movistar+ (Spain) | Arryadia / SNRT (Morocco) |
| Score header referee | Spanish referee | Moroccan referee |
| Left rail Forme card | LaLiga position | Botola Pro position |
| Left rail Forme — FIFA ranking | NOT shown (club fixture, no national context) | NOT shown (club fixture) |
| Et après card | Mix of LaLiga + UCL fixtures | Mix of Botola Pro + CAF CL fixtures |
| Aperçu Predictions | `/predictions` works for any covered league | Same — Botola Pro has predictions coverage |
| Composition coverage | Full (LaLiga has full coverage) | Coverage may be partial — verify per current season |
| Statistiques coverage | Full | Coverage may be partial — empty state if `statistics_fixtures: false` |
| About card morocco_section | "Aucun joueur marocain..." honest empty | Extensive — derby history, key matchups, players to watch |
| About card editorial | Match-specific summary | Derby rivalry context, historical significance, Atlas Lions players involved |

Same template, content adapts. URL pattern identical.

### Variant B — International / national-team match (Atlas Lions)

**Applies to**: Maroc vs Argentine, Maroc vs Tanzanie (WC 2026 qualifying), Maroc in AFCON 2026, etc.

**Key reference**: Maroc vs Argentine (WC 2026 group stage opening match).

**Deltas from canonical**:

| Element | Canonical | Variant B |
|---|---|---|
| H1 | "Real Madrid vs Real Oviedo" | "Maroc — Lions de l'Atlas vs Argentine" |
| Score header crests | Club crests | National team flags + crests |
| Score header sub-row competition | "LaLiga J36" | "Coupe du Monde 2026 · Groupe C" |
| Score header sub-row venue | "Bernabéu, Madrid" | "Stade Hassan II, Casablanca" (Morocco co-host) |
| Score header sub-row referee | Spanish | International (FIFA-listed) |
| Score header sub-row TV | Movistar+ | Multiple international broadcasters; SNRT primary for Morocco |
| Left rail Forme card | Club standings | National team form + **FIFA ranking** (per Pages 3-4 pattern) |
| Et après card | Club fixtures | National team fixtures (next WC qualifiers, friendlies) |
| Indispos card | Club injuries | National team selection availability (injuries, suspensions for the squad) |
| Aperçu Predictions | Algorithmic prediction | Same — predictions available for any covered competition including WC 2026 |
| Composition formations | Club tactical setup | National team setup (often more defensive vs strong opponents) |
| Confrontations tab | Past league meetings | Past international meetings (rarer, more historic) — "Maroc 2 · Nul 1 · Argentine 4" |
| About card editorial | Match-specific context | National-team narrative — Atlas Lions WC 2026 context, Morocco co-hosting, key players (Hakimi captain, etc.) |
| Atlas Lions framing | Not applicable | Prominent — "أسود الأطلس" team term used in Arabic locale |
| Match anticipation | Standard pre-match | Heightened — Morocco home advantage for some matches in WC 2026 |

Same template, national-team framing applied throughout.

### Variant C — Continental club match (CAF, UEFA, Conmebol)

**Applies to**: Wydad in CAF Champions League, Real Madrid in UCL, etc.

**Key reference**: Wydad AC vs Al Ahly (CAF Champions League semi-final) or Real Madrid vs Bayern (UCL).

**Deltas from canonical**:

| Element | Canonical | Variant C |
|---|---|---|
| Score header sub-row competition | "LaLiga J36" | "CAF CL · 1/2 finale aller" or "UCL · 1/4 finale retour" |
| Score header sub-row venue | Home stadium | May be home OR away (knockout away leg) OR neutral venue (final) |
| Left rail Forme card | League position | Continental competition specific (group standings if group stage, or "Tour qualificatif" / "Phase à élimination directe") |
| Et après card | Domestic league fixtures predominant | Mix of domestic + continental fixtures |
| Aperçu Predictions | Available | Available |
| Composition coverage | Full | Full for UCL/CAF CL |
| Confrontations | Past league meetings | Past continental meetings (often historic; first-ever meeting common for early rounds) |
| About card editorial | Domestic context | Continental narrative — campaign progress, group standings, what's at stake |
| Aggregate score (knockout) | NOT applicable | For two-legged ties: aggregate score may be shown in score header sub-row ("Agg: 2-1 après aller") |

Same template, continental framing applied.

### Variant D — Domestic cup knockout (Coupe du Trône, Copa del Rey, FA Cup)

**Applies to**: Wydad vs Raja in Coupe du Trône final, Real Madrid vs Sevilla in Copa del Rey, etc.

**Key reference**: Coupe du Trône final at Stade Mohammed V (Casablanca, neutral).

**Deltas from canonical**:

| Element | Canonical | Variant D |
|---|---|---|
| Score header sub-row competition | League round | Cup phase ("Finale" / "1/2 finale" / etc.) |
| Score header sub-row venue | One team's home stadium | May be neutral venue (cup finals usually at national stadium) |
| Left rail Forme card | League standings | Cup-specific path display: "Quarts: vs MAS · DNF" — show the team's previous cup-stage performances |
| Et après card | Domestic league fixtures | Domestic league fixtures (cup is the current match's competition) |
| Aperçu Predictions | Available | Available |
| Composition | Standard | Standard |
| **Score state extension** | FT/AET/PEN | More likely to extend to AET / PEN in knockout — state machine handles this natively (Q-P6-K locked: 7 states includes PEN handling) |
| Penalty shootout score display | Shown in `score_penalty_home/away` | Same fields, displayed in score header center: "3 – 3 (5 – 4 t.a.b.)" |
| Confrontations | Past meetings | Past cup-final meetings (rare, often historic) |
| About card | Match-specific | Cup-specific framing — what's at stake, qualification context (CAF Confederation Cup berth, etc.) |

Same template, cup-knockout framing applied.

### Variant E — Low-coverage league match

**Applies to**: Lower-coverage competitions (Algeria Ligue 1, Tunisia Ligue 1, lower divisions of major leagues, friendlies).

**Key reference**: Algerian Ligue 1 mid-table fixture.

**Deltas from canonical**:

| Element | Canonical | Variant E |
|---|---|---|
| Coverage flags | All `true` for LaLiga | Mix of true/false per `/leagues` coverage object |
| Composition tab | Full pitch with lineups | If `lineups: false`: empty state "Compositions non disponibles pour cette compétition" |
| Statistiques tab | 16 stats with bars | If `statistics_fixtures: false`: empty state "Statistiques non disponibles" |
| Composition sub-tab Stats joueurs | Available | If `statistics_players: false`: sub-toggle hides; only Schéma view |
| Aperçu pre-match | Predictions + form + indispos | If `predictions: false`: Predictions block hides; form + indispos only |
| Indispos card | Pre-match injury list | If `injuries: false`: card hides entirely |
| Score / events | Live updates | If `events: false`: events timeline hides; score updates from main fixture object only |

Page renders gracefully with documented empty states throughout. No fake data. No data theater. Honest about what's available for each competition.

### Variant F — Women's football match

**Applies to**: Women's national team (Atlas Lionesses), women's club competitions.

**Key reference**: Atlas Lionesses vs France (women's friendly) or WAFCON match.

**Deltas from canonical**:

| Element | Men's (canonical) | Women's variant |
|---|---|---|
| URL pattern | Same | Same — gender doesn't affect URL |
| H1 | "Real Madrid vs Real Oviedo" | "Maroc Féminines — Lionnes de l'Atlas vs France Féminines" (or appropriate framing per competition) |
| Score header crests | Men's national/club crests | Women's team crests (often same crest as men's; differentiated by competition context) |
| Score header sub-row competition | Men's league | Women's competition (D1 Arkema, NWSL, Liga F, WSL, etc.) |
| Left rail Forme card | Men's standings | Women's competition standings |
| Et après card | Men's fixtures | Women's fixtures |
| Indispos card | Men's roster injuries | Women's roster injuries |
| Confrontations | Past men's meetings | Past women's meetings (often shorter history due to recent professional growth) |
| About card | Men's editorial | Women's editorial — Atlas Lionesses context, women's football growth in Morocco |
| Coverage flags | Same checks | Coverage often partial for women's competitions — graceful degradation |

Same template, women's-competition context selection. Implementation: `gender: 'F'` flag on `teams` table drives appropriate competition lookup.

---

## Section 18 — Outbound link targets

Every clickable destination on the page (Real Madrid vs Real Oviedo canonical instance). Documented against the spec.

Routes follow patterns established in Pages 1-5. Phase 6+ deferred-affordance rule applies.

### Category 1 — Routes to existing Pages 1-7

**Inherited chrome**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Topbar — all items | Per homepage Section 16 | Pages 1-7 | Per topbar routing |
| SeoBreadcrumb segment 1 ("Football") | Homepage | Page 1 | `/fr` |
| SeoBreadcrumb segment 2 (country) | Country index (Phase 6+ deferred) | — | (reserved) |
| SeoBreadcrumb segment 3 (competition) | Competition page | Page 2 or 3 | `/fr/competition/[country]/[slug]` |
| SeoBreadcrumb segment 4 (match) | Current page (non-clickable) | — | — |
| Footer — all links | Per homepage Section 16 | Pages 1-7 | Per footer routing |
| Mobile bottom tab bar — Matchs | Homepage | Page 1 | `/fr` |

**Score header**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Home team crest | Home team page | Page 4 | `/fr/equipe/espagne/real-madrid` |
| Home team name | Same as crest | Page 4 | Same |
| Away team crest | Away team page | Page 4 | `/fr/equipe/espagne/real-oviedo` |
| Away team name | Same as crest | Page 4 | Same |
| Score / kickoff time | Non-clickable | — | — |
| Goalscorer name (post-match) | Player page | Page 5 | `/fr/joueur/[country]/[player-slug]` |
| Sub-row competition name | Competition page | Page 2 or 3 | `/fr/competition/espagne/laliga` |
| Sub-row venue name | Phase 6+ stadium page (reserved) | — | (reserved) |
| Sub-row referee name | Phase 6+ referee page (reserved) | — | (reserved) |
| Sub-row TV broadcaster | Non-clickable | — | — |

**Left rail (home team context)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Forme card — "Voir le classement complet →" | Competition page Standings tab | Page 2 | `/fr/competition/espagne/laliga#classement` |
| Et après card — fixture row | Match detail | Page 6 | `/fr/match/[home]-vs-[away]-YYYY-MM-DD` |
| Et après — opponent name | Opponent team page | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| Et après — competition label | Competition page | Page 2 or 3 | `/fr/competition/[country]/[slug]` |
| Indispos card — player name | Player page | Page 5 | `/fr/joueur/[country]/[player-slug]` |

**Center column — tab strip**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Tab change (Aperçu / Composition / Statistiques / Confrontations) | Same page, hash fragment update | — | `#apercu`, `#composition`, `#statistiques`, `#confrontations` |

**Aperçu tab**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Predictions bars | Non-clickable | — | — |
| Form comparative values | Non-clickable | — | — |
| Indispos summary | Non-clickable | — | — |
| Events timeline — player names | Player page | Page 5 | `/fr/joueur/[country]/[player-slug]` |
| Events timeline — assist names | Player page | Page 5 | Same |
| Joueur du match — player photo/name | Player page | Page 5 | Same |
| "Voir le résumé vidéo ↓" | Same page anchor scroll to Videos section | — | — |

**Composition tab**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Player badge on pitch | Player page | Page 5 | `/fr/joueur/[country]/[player-slug]` |
| Bench player name (expanded) | Player page | Page 5 | Same |
| Coach name | Phase 6+ manager page (reserved) | — | (reserved) |
| Schéma / Stats joueurs sub-toggle | In-tab toggle | — | — |
| Stats joueurs — player name | Player page | Page 5 | Same |
| Team toggle (in Stats joueurs sub-tab) | In-sub-tab toggle | — | — |

**Statistiques tab**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Stat values | Non-clickable | — | — |
| (entire tab is informational, no inbound clicks) | — | — | — |

**Confrontations tab**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Past meeting row | That match's Page 6 | Page 6 | `/fr/match/[home]-vs-[away]-YYYY-MM-DD` |
| Past meeting competition label | Competition page | Page 2 or 3 | `/fr/competition/[country]/[slug]` |
| Filter pills | In-tab state change | — | — |
| "Voir tous les face-à-face →" | Inline expansion (Phase 4.5) / Phase 6+ archive | — | (reserved) |

**Right rail (away team context)**:

Same routing pattern as left rail, with destinations swapped to away team's context.

**Videos section**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Video facade thumbnail | Inline iframe swap (in-place YouTube playback) | — | — |
| "Voir plus →" | Inline expansion (Phase 4.5) | — | — |

**About card**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Entity name in body (teams, players, competitions, stadiums, coaches) | Corresponding entity pages where shipped; non-clickable text where Phase 6+ deferred | Pages 2-5 | Per entity URL |
| Internal anchor links | Same page hash scroll | — | — |
| FAQ entity references | Corresponding entity pages | Pages 2-5 | Per entity URL |

### Category 2 — In-page interaction (no navigation)

Summary of types (all marked with em-dashes in Category 1):

- Tab changes (hash fragment update only)
- Sub-tab toggles (Schéma / Stats joueurs)
- Team toggle (in Stats joueurs sub-tab)
- Confrontations filter pills
- Score header — all non-clickable display elements
- Statistics bar — non-clickable display
- Video facade clicks (swap to iframe)
- Pitch SVG hover (player tooltip — Phase 6+ enhancement; click to player page in v1)
- Form string letters (non-clickable display)

### Category 3 — Routes to Phase 6+ feature pages

| Click source | Reserved URL | Phase |
|---|---|---|
| Sub-row venue name | `/[locale]/stade/[venue-slug]` | Phase 6+ |
| Sub-row referee name | `/[locale]/arbitre/[referee-slug]` | Phase 6+ |
| Composition tab coach name | `/[locale]/entraineur/[coach-slug]` | Phase 6+ |
| Confrontations "Voir tous les face-à-face →" overflow | `/[locale]/match/historique/[team1]-vs-[team2]` | Phase 6+ |
| Videos "Voir plus →" overflow | Phase 6+ match-scoped videos page | Phase 6+ |
| Favourite star (score header — reserved slot) | Phase 10 auth feature | Phase 10 |
| Compare teams affordance | `/[locale]/comparer/equipes/[id1]-vs-[id2]` | Phase 6+ |
| Add to calendar | OS calendar integration | Phase 6+ |
| Embed widget | Syndication feature | Phase 12+ |
| Mobile bottom tab bar — Recherche / Favoris / Paramètres | Various Phase 6+/10 URLs | Phase 6+ / Phase 10 |

**Deferred-affordance rule** (consistent with Pages 1-5): destinations listed in Category 3 render as non-clickable text or open a "Bientôt disponible" lightweight overlay, never as broken links or 404s.

### Category 4 — Explicit divergences from Sofascore routing

| Sofascore pattern | Atlas Kings pattern | Rationale |
|---|---|---|
| bet365 odds in left column | NOT present | Loi 09-08 |
| Sign-up bonus / Claim button | NOT present | Loi 09-08 |
| Vote widget carousel | NOT present | Gambling-adjacent gamification |
| Sofascore Analyst /upgrade promo | NOT present | No premium tier in v2 |
| Sofascore Fantasy promo | NOT present | Rule 11 |
| FAVOURITE / COMPARE / Add to calendar | NOT present (reserved slots) | Phase 6+ / Phase 10 deferred |
| Featured Players pentagon | NOT present | Proprietary composite, no API data |
| Embed widget button | NOT present | Phase 12+ |
| Standings tab | NOT present (routed to Page 2) | Match-focus discipline |
| Media tab | NOT present (Videos in section below) | Consistent with Pages 3-5 pattern |
| Referee dedicated page | Deferred Phase 6+ | Out of scope for v1 |
| Venue dedicated page | Deferred Phase 6+ | Out of scope for v1 |
| YouTube standard embeds (tracking) | youtube-nocookie.com + facade | Loi 09-08 data protection |
| Live commentary text feed | NOT present | No API source |
| Attack Momentum chart | NOT present | No API data (Sofascore proprietary) |
| Per-team xG / big chances | NOT present | No API data |
| Post-match "AI analysis text" | NOT present | No premium tier; editorial replaces |

---

## Update log

- 2026-05-13 — Initial schematic locked after Phase 4.5+ design session. Real Madrid vs Real Oviedo canonical worked example documenting the pre-match state with post-match deltas (cross-referenced from Man City vs Crystal Palace played-match analysis). Format Variants section covers Botola Pro derbies (Wydad vs Raja), Atlas Lions internationals (Maroc vs Argentine), continental club competitions, domestic cup knockouts, low-coverage leagues, women's football. Inherits chrome from `docs/schematics/homepage.md`, page-shell patterns from `docs/schematics/competition-league.md` (Page 2), `docs/schematics/competition-cup.md` (Page 3), `docs/schematics/team.md` (Page 4), and `docs/schematics/player.md` (Page 5). Reference: `docs/research/real-madrid-vs-real-oviedo-match-page-full-analysis.md`.

Page 6 differentiators from Sofascore: state-driven design with 7-state score machine (the same page serves pre-match / live / post-match coherently); ONE match card with 4 tabs in center column (Aperçu default, Composition / Statistiques / Confrontations); symmetric per-team rails (home left, away right) each containing Forme + Et après + Indispos cards specific to that team's context; stacked-pitch SVG (Flashscore-style, TV-broadcast convention) for lineups; post-match Composition sub-toggle (Schéma / Stats joueurs); Predictions framed as Atlas Kings statistical model (NOT betting recommendation); shared metadata consolidated in score header sub-row (venue, referee, TV); long-form About card with 6 H2 sections + 6-8 FAQ per locale.

Critical Sofascore elements cut per Loi 09-08 + data-availability + scope discipline: bet365 odds card, sign-up bonus promo, vote widget carousel, 18+ disclaimer banner, Sofascore Analyst AI promo, Fantasy promo card, Featured Players pentagon (proprietary composite, no API data), FAVOURITE/COMPARE/Add-to-calendar buttons (Phase 6+/10 deferred), Standings tab (routed to Page 2), Media tab (Videos in dedicated section below), Attack Momentum chart (no API data), live commentary text feed (no API source), per-team xG/big chances (no API data), post-match AI analysis text (no premium tier).

Buildable from API-Football confirmed: `/fixtures?id=X` master object with embedded events+lineups+statistics+players sub-resources (refreshed every 15s during live); `/fixtures/headtohead?h2h=X-Y` for past meetings; `/predictions?fixture=X` for pre-match algorithmic forecast; `/injuries?fixture=X` for pre-match unavailable players; `/fixtures?team=X&next=3` for next fixtures per team (1 call per team, 2 calls total for symmetric rails — confirmed working V3 query parameter); `/standings?league=X&season=Y` for rails Forme cards. Score state machine driven by `status_short` field (TBD/NS/1H/HT/2H/ET/P/BT/FT/AET/PEN/LIVE/PST/CANC/ABD/AWD/WO/SUSP/INT).

Schema additions: extensive `fixtures` table with slug, slug_ar, FK references to teams/competitions/venues, status fields (status_short/status_long/elapsed/extra), all score breakdowns (halftime/fulltime/extratime/penalty home+away), venue/referee fields cached from API metadata, coverage flag booleans cached per match (events/lineups/statistics_fixtures/statistics_players/predictions/injuries), media_youtube_ids array for post-match curated videos, about_fr/en/ar jsonb with sections (intro/history/venue_context/broadcast/editorial/faqs), player_of_match_override FK for editorial selections.

Outbound routing matrix in Section 18 follows Pages 1-5 conventions with Phase 6+ deferred-affordance rule. Manager, Stadium, and Referee pages all reserved at `/[locale]/entraineur/[slug]`, `/[locale]/stade/[slug]`, `/[locale]/arbitre/[slug]` (consistent across schematics).

- (Append future updates here with date and change description)
