# Atlas Kings Competition (Cup/Tournament) Schematic — Page 3

Locked schematic for `/[locale]/competition/[confederation-or-country]/[tournament-slug]` (cup and international tournament pages). FIFA World Cup 2026 is the canonical instance used throughout this document; the same structure repurposes for all big international tournaments and domestic cups — WC 2030, AFCON, WAFCON, UCL, UEL, UECL, UWCL, CAF Champions League, CAF Confederation Cup, FIFA Arab Cup, Olympics Football, U-17 World Cup, AFCON U-23, AFC Asian Cup, and domestic cups (Coupe du Trône).

Format variants (pure-knockout cups, Swiss-format tournaments, league-phase-only competitions) get a dedicated section (Section 18 below) documenting deltas from the canonical WC 2026 spec.

**Status**: Locked, ready for Phase 4.5 implementation
**Last updated**: 2026-05-13
**Reference**: `docs/research/sofascore-page-templates-overview.md` (cross-template synthesis) + `docs/research/wc26-sofascore-full-analysis.md` (WC 2026 specific browser-session analysis)
**Inherits chrome from**: `docs/schematics/homepage.md`
**Inherits page-shell patterns from**: `docs/schematics/competition-league.md` (Page 2)
**Tournament data source**: `docs/tournaments/CALENDAR.md`
**Keyword data source**: Ahrefs Morocco SERP analysis + Arabic parallel analysis

---

## Page identity

Canonical Atlas Kings page template for **tournament** competitions — competitions with knockout structure, finite duration, and (usually) participation by entities outside the host country's league system.

Where Page 2 = "this league plays a season". Page 3 = "this tournament has a beginning, middle, end, and a winner."

Page-template-by-format mapping (which page template a given competition uses):

| Competition format | Page template | Examples |
|---|---|---|
| Round-robin league season, no knockout | Page 2 | Botola Pro, EPL, LaLiga, Bundesliga, Serie A, Ligue 1, Saudi Pro, Egyptian Premier, Algeria Ligue 1, Tunisia Ligue 1 |
| Groups + knockout (national teams) | Page 3 canonical | WC 2026, WC 2030, AFCON, WAFCON, U-17 WC, AFC Asian Cup, Olympics Football |
| Groups + knockout (clubs) | Page 3 canonical | CAF Champions League, CAF Confederation Cup, UCL pre-2024 |
| Pure knockout | Page 3 variant A | Coupe du Trône, FIFA Arab Cup, CAF Super Cup, UEFA Super Cup |
| Swiss + knockout | Page 3 variant B | UCL post-2024, UEL post-2024, UECL post-2024 |
| League phase only, no knockout | Page 3 variant C | UEFA Nations League group stage (when isolated) |

Domestic-vs-international does NOT determine the template — competition **format** does. Coupe du Trône is a Moroccan domestic cup with knockout structure: Page 3 template, URL `/competition/maroc/coupe-du-trone`. EPL is an English domestic league with round-robin structure: Page 2 template, URL `/competition/angleterre/premier-league`.

### Inherited from Page 2

Page 3 uses the **inner-page 3-column shell** at ≥1280px floor, inherited verbatim from Page 2: ~360-380 left + ~500-520 center + ~280-300 right. Same chrome (top strip, topbar, breadcrumb, footer, mobile tab bar) as homepage.md. Same SEO machinery (title/meta per locale, hreflang, JSON-LD, image alt text, H1+intro paragraph, About card with FAQ). Same URL pattern conventions.

### Distinguishing characteristics — Page 3 vs Page 2

| Aspect | Page 2 (League) | Page 3 (Tournament) |
|---|---|---|
| Tab set | Standings / Stats / Details / Media (4 tabs) | Overview / Standings / Knockout (3 tabs) |
| Default tab | Standings | Overview |
| Standings tab format | Single table (16-20 rows for most leagues) | Multi-group mini-tables (12 for WC 2026) — adapts per format |
| Knockout tab | Not present | Bracket visualization, left+right converging on Final |
| Featured slot in left rail | One featured match | Two side-by-side Featured Match Cards in Overview tab + one in left rail |
| FIFA ranking display | Not shown (clubs have no FIFA ranking) | Shown alongside team names (national-team tournaments) |
| Edition history | Recent seasons via selector | Multi-edition history forward-compatible; current-only at v1 launch |
| Left rail Card 3 | POTS race | "Tous les groupes en bref" (compact view of all groups) |
| Left rail Card 4 | Team of the Week | Newsletter (POTS/TOTW removed for tournaments — covered in Section 6) |
| Right rail Widget 3 | MoroccoEditorialPicks | MeetTheTeamsCard |
| Media handling | Tab placeholder (Phase 12+ stub) | Videos section below tabs (YouTube embeds at v1 launch) |
| Mid-page Standings Tracker chart | Yes (30-round line chart) | Not present (3 group matchdays = too few data points) |

---

## Section 1 — URL structure

### Canonical pattern

```
/[locale]/competition/[confederation-or-country]/[tournament-slug]
```

The `/competition/` root segment is **not translated** across locales (Next.js routing simplicity, inherited from Page 2). The confederation/country and tournament slugs **are** translated per locale.

### Per-locale examples

**FIFA World Cup 2026** — canonical Page 3 instance:
```
/fr/competition/fifa/coupe-du-monde-2026
/en/competition/fifa/world-cup-2026
/ar/competition/فيفا/كأس-العالم-2026
```

**AFCON 2027** — CAF national team tournament:
```
/fr/competition/caf/can-2027
/en/competition/caf/afcon-2027
/ar/competition/كاف/كأس-أمم-إفريقيا-2027
```

**WAFCON 2026** — CAF national team women's tournament, Morocco-hosted:
```
/fr/competition/caf/can-feminine-2026
/en/competition/caf/wafcon-2026
/ar/competition/كاف/كأس-أمم-إفريقيا-للسيدات-2026
```

**UEFA Champions League** — UEFA club tournament:
```
/fr/competition/uefa/ligue-des-champions
/en/competition/uefa/champions-league
/ar/competition/أوروبا/دوري-أبطال-أوروبا
```

**Coupe du Trône** — Morocco domestic cup (Page 3 variant A):
```
/fr/competition/maroc/coupe-du-trone
/en/competition/morocco/coupe-du-trone
/ar/competition/المغرب/كأس-العرش
```

Coupe du Trône uses `maroc` as the country segment, not a confederation, because it's a domestic cup — same URL convention as Botola Pro. Template = Page 3 (knockout format).

### Confederation/country root by tournament type

| Tournament class | Country/confederation segment | Examples |
|---|---|---|
| FIFA tournaments | `fifa` | WC 2026, WC 2030, FIFA Arab Cup, U-17 WC |
| UEFA tournaments | `uefa` | UCL, UEL, UECL, UWCL, Euros |
| CAF tournaments | `caf` | CAF CL, CAF Confed, AFCON, WAFCON, CHAN, AFCON U-23, CAF Super Cup |
| AFC tournaments | `afc` | AFC Asian Cup |
| Olympic tournaments | `ioc` | Olympics Football |
| Domestic cups | country slug | Coupe du Trône → `maroc`; FA Cup → `angleterre`; Copa del Rey → `espagne` |

### CALENDAR.md schema additions (Page 3 specific)

Building on Page 2's slug/intro/about/qualification-zones fields, Page 3 introduces:

```typescript
tournament_format: 'groups_and_knockout' | 'pure_knockout' | 'swiss_and_knockout' | 'league_phase_only'
groups_count: number | null              // 12 for WC 2026, 6 for AFCON, null for Coupe du Trône
teams_count: number                      // 48 for WC 2026, 32 for Coupe du Trône, 36 for UCL post-2024
host_country_codes: string[]             // ['US', 'CA', 'MX', 'MA'] for WC 2026; ['MA'] for WAFCON 2026
kickoff_date: ISO date                   // '2026-06-11' for WC 2026
final_date: ISO date                     // '2026-07-19' for WC 2026
edition_year: number                     // 2026
fifa_ranking_applicable: boolean         // true for national-team tournaments; false for clubs
home_away_meaningful: boolean            // false for neutral-venue tournaments (WC, AFCON); true for clubs (UCL, CAF CL)
media_youtube_ids: string[]              // hand-curated for priority tournaments
related_competitions: string[]           // competition IDs of related qualifiers / sister tournaments
historical_winners: Array<{ 
  year: number, 
  team_id: number, 
  runner_up_id: number, 
  host_country_codes: string[] 
}>
knockout_starts_round: 'r32' | 'r16' | 'qf'  // R32 for WC 2026; R16 for Coupe du Trône (depending on entries)
has_third_place_match: boolean           // true for WC, AFCON; false for UCL, Coupe du Trône
```

These fields drive the rendering decisions: which format variant section applies, whether the FIFA ranking badge shows, whether All/Home/Away sub-tabs appear in Standings, what the bracket structure looks like, etc.

### Edition history — Phase 6+ deferred

**EditionSelector component is forward-compatible but renders current edition only at v1 launch.** Past editions (WC 2022 / 2018 / 2014 / ...) are not in Phase 4.5 scope. When eventually built:

```
/fr/competition/fifa/coupe-du-monde-2026                    → 2026 edition (default)
/fr/competition/fifa/coupe-du-monde-2026?edition=2022       → 2022 edition (Phase 6+)
/fr/competition/fifa/coupe-du-monde-2026?edition=2018       → 2018 edition (Phase 6+)
```

Single canonical URL + query param for state, consistent with Page 2's season selector pattern.

### Tab state — hash fragments only

```
/fr/competition/fifa/coupe-du-monde-2026                → defaults to Overview
/fr/competition/fifa/coupe-du-monde-2026#vue-densemble  → Overview (explicit)
/fr/competition/fifa/coupe-du-monde-2026#classement     → Standings tab
/fr/competition/fifa/coupe-du-monde-2026#elimination    → Knockout tab
```

Per-locale hash fragments:
- Overview: `#vue-densemble` (FR) / `#overview` (EN) / `#نظرة-عامة` (AR)
- Standings: `#classement` (FR) / `#standings` (EN) / `#ترتيب` (AR)
- Knockout: `#elimination` (FR) / `#knockout` (EN) / `#إقصائيات` (AR)

### hreflang annotations

```html
<link rel="alternate" hreflang="fr" href="https://atlaskings.com/fr/competition/fifa/coupe-du-monde-2026" />
<link rel="alternate" hreflang="en" href="https://atlaskings.com/en/competition/fifa/world-cup-2026" />
<link rel="alternate" hreflang="ar" href="https://atlaskings.com/ar/competition/فيفا/كأس-العالم-2026" />
<link rel="alternate" hreflang="x-default" href="https://atlaskings.com/fr/competition/fifa/coupe-du-monde-2026" />
```

---

## Section 2 — SEO and indexability

### Per-locale title and meta description

Hand-written for priority tournaments (WC 2026, WC 2030, AFCON 2025, WAFCON 2026, UCL, CAF CL). Templated for the rest.

WC 2026 hand-written:

```
fr: <title>Coupe du Monde 2026 — Calendrier, groupes, classement et phase finale | Atlas Kings</title>
    <meta name="description" content="Suivez la Coupe du Monde FIFA 2026 en direct: calendrier des 104 matchs, les 12 groupes, classement de chaque groupe, phase à élimination directe. Le Maroc dans le Groupe C avec l'Argentine, l'Arabie saoudite et l'Égypte." />

en: <title>FIFA World Cup 2026 — Fixtures, groups, standings and knockout | Atlas Kings</title>
    <meta name="description" content="Follow the FIFA World Cup 2026 live: 104-match schedule, 12 groups, standings per group, knockout bracket. Morocco in Group C with Argentina, Saudi Arabia, and Egypt." />

ar: <title>كأس العالم 2026 — الجدول، المجموعات، الترتيب ومرحلة الإقصاء | أطلس كينغز</title>
    <meta name="description" content="تابعوا كأس العالم فيفا 2026 مباشرة: جدول 104 مباريات، 12 مجموعة، ترتيب كل مجموعة، الأدوار الإقصائية. المغرب في المجموعة C مع الأرجنتين والمملكة العربية السعودية ومصر." />
```

Title pattern: `{tournament_name} {edition} — {modifier_1}, {modifier_2}, {modifier_3}, {modifier_4} | Atlas Kings`.

Modifiers tuned per tournament format:
- Groups+knockout (WC, AFCON, WAFCON, UCL pre-2024): `calendrier / groupes / classement / phase finale`
- Pure knockout (Coupe du Trône, U-17 WC): `calendrier / tirage / matchs / vainqueur`
- Swiss+knockout (UCL post-2024, UEL post-2024): `calendrier / classement / phase éliminatoire`

### H1 — single per page

Tournament name + edition year, IBM Plex Sans (NOT Fraunces — matching Page 2 H1 treatment):

```
fr: <h1>Coupe du Monde FIFA 2026</h1>
en: <h1>FIFA World Cup 2026</h1>
ar: <h1>كأس العالم فيفا 2026</h1>
```

### Intro paragraph

Below the hero, above the 3-column zone. 25-40 words, keyword-loaded, per locale. Hand-written for priority tournaments.

WC 2026:

```
fr: La Coupe du Monde FIFA 2026 réunit 48 équipes nationales aux États-Unis, 
au Canada, au Mexique et au Maroc, premier hôte africain de l'histoire. 
Suivez le calendrier complet, les 12 groupes, les classements et la phase 
à élimination directe en direct.

en: The FIFA World Cup 2026 brings 48 national teams to the United States, 
Canada, Mexico, and Morocco — the first African co-host in tournament 
history. Follow the full schedule, 12 groups, standings, and knockout 
bracket live.

ar: يجمع كأس العالم فيفا 2026 48 منتخباً وطنياً في الولايات المتحدة وكندا 
والمكسيك والمغرب، أول دولة إفريقية تستضيف في تاريخ البطولة. تابعوا الجدول 
الكامل، 12 مجموعة، الترتيب ومرحلة الأدوار الإقصائية مباشرة.
```

Morocco co-host framing prioritized in all three locales — strongest editorial angle for our audience.

### H2 inside each active tab

Same pattern as Page 2 — each tab content area has a visible H2:

| Tab | French | English | Arabic |
|---|---|---|---|
| Overview | Vue d'ensemble — Coupe du Monde 2026 | Overview — World Cup 2026 | نظرة عامة — كأس العالم 2026 |
| Standings | Classement par groupe — Coupe du Monde 2026 | Standings by group — World Cup 2026 | الترتيب حسب المجموعة |
| Knockout | Phase à élimination directe | Knockout stage | مرحلة الأدوار الإقصائية |

### JSON-LD structured data

Two blocks in `<head>`:

**1. SportsEvent** for the tournament entity (note: tournaments use SportsEvent, not SportsOrganization — they're time-bounded events, not organizations):

```json
{
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  "name": "FIFA World Cup 2026",
  "alternateName": ["كأس العالم فيفا 2026", "Coupe du Monde 2026", "Mundial 2026"],
  "sport": "https://schema.org/Soccer",
  "startDate": "2026-06-11",
  "endDate": "2026-07-19",
  "location": [
    { "@type": "Country", "name": "United States" },
    { "@type": "Country", "name": "Canada" },
    { "@type": "Country", "name": "Mexico" },
    { "@type": "Country", "name": "Morocco" }
  ],
  "organizer": {
    "@type": "Organization",
    "name": "FIFA"
  },
  "url": "https://atlaskings.com/fr/competition/fifa/coupe-du-monde-2026"
}
```

**2. SportsEvent array** for individual fixtures displayed on the page (Featured Match Cards, Matches list). Per-fixture blocks generated server-side. Adds rich-snippet eligibility for "Morocco World Cup fixtures" and similar queries.

### Per-locale image alt text

All flags, crests, trophy logos, stadium photos carry locale-specific alt text. Same pattern as Page 2 Section 2 — `name_fr / name_en / name_ar` fields on entity rows.

### About card at page bottom

Long-form keyword-bearing content. Same structure as Page 2: 6 H2 sections + 6-8 FAQ entries. Documented in Section 11.

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
│ PAGE HEADER (~210-240px, not sticky — Page 2 pattern)                        │
│  Logo · H1 + edition · Region descriptor · Edition label                     │
│  Status descriptor (J-29 pre-tournament / matchday / knockout phase)         │
│  Morocco context line (Group C with rival flags)                             │
│  Intro paragraph                                                             │
├──────────────────────┬───────────────────────────┬──────────────────────────┤
│ LEFT RAIL ~360-380px │ CENTER ~500-520px         │ RIGHT RAIL ~280-300px    │
│                      │                           │ (≥1280px)                │
│ 1. Featured match    │ Tabs row (not sticky):    │ 1. Top scorers           │
│ 2. Matches list      │ Vue d'ensemble · Class.   │ 2. Top assists           │
│    (Par date/tour/   │  · Élimination            │ 3. MeetTheTeamsCard      │
│     groupe)          │                           │ 4. MoreMatchesToday      │
│ 3. Tous les groupes  │ H2 inside active tab      │ 5. Newsletter            │
│    en bref           │                           │                          │
│ 4. Newsletter        │ Overview default:         │                          │
│                      │  • Featured Match Cards   │                          │
│                      │    (2 side-by-side)       │                          │
│                      │  • Mini Standings preview │                          │
│                      │  • Titres (winners)       │                          │
│                      │  • Compétitions liées     │                          │
│                      │  • Faits panel            │                          │
│                      │  • About preview          │                          │
├──────────────────────┴───────────────────────────┴──────────────────────────┤
│ VIDÉOS SECTION (~400-600px tall, full content width)                         │
│  3-up YouTube thumbnail grid · embeds via youtube-nocookie.com               │
├─────────────────────────────────────────────────────────────────────────────┤
│ ABOUT CARD (full keyword surface, 6 H2 sections + 6-8 FAQ)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Section 4 — Inherited chrome (from homepage.md)

Carries over verbatim from `docs/schematics/homepage.md`. No re-spec needed.

| Component | Behaviour on Page 3 |
|---|---|
| AdaptiveTopStrip | Identical. For WC 2026 today (J-29 to kickoff): Mode 1 (countdown) is active globally. Strip displays WC 2026 countdown + 12 group preview pills regardless of which Atlas Kings page user is on. |
| Topbar | Identical. WC 2026 nav item (featured slot 1) gets gold underline (active) when on WC 2026 page. |
| SeoBreadcrumb | Content updates per page: `Football › International › FIFA › Coupe du Monde 2026` (FR), or for Coupe du Trône `Football › Maroc › Coupe du Trône` (FR). Breadcrumb segment routing per Page 2 Section 4 conventions: first segment → homepage; confederation/country segment → confederation/country index (Phase 6+ deferred-affordance, non-clickable until shipped); tournament segment → current page (non-clickable). |
| Footer | Identical. Loi 09-08 notice. |
| Mobile bottom tab bar | Identical 4 tabs (Matchs / Recherche / Favoris / Paramètres). |
| Mobile hamburger drawer | Identical structure. |

---

## Section 5 — Page header (~210-240px)

Same horizontal data-rich strip pattern as Page 2. NOT a Sofascore-style gradient/trophy graphic hero. Atlas Kings differentiation = consistent design language across page types.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Logo 64×64]  Coupe du Monde FIFA 2026          [Édition: 2026 ▾]        │
│ ──────────────  🌍 FIFA · 48 nations · 16 villes hôtes                    │
│                                                                          │
│                Phase: Avant-tournoi · J-29 jusqu'au coup d'envoi         │
│                Maroc dans Groupe C avec 🇦🇷 🇸🇦 🇪🇬                         │
└──────────────────────────────────────────────────────────────────────────┘

La Coupe du Monde FIFA 2026 réunit 48 équipes nationales aux États-Unis, 
au Canada, au Mexique et au Maroc, premier hôte africain de l'histoire. 
Suivez le calendrier complet, les 12 groupes, les classements et la phase 
à élimination directe en direct.
```

### Sub-zones

**Sub-zone A — Identity (left, ~60% width)**:
- Logo 64×64 (tournament logo, rounded 8px corners). Non-clickable (page identity).
- H1: tournament name + edition year, IBM Plex Sans 32px semibold. Non-clickable.
- Confederation badge emoji + descriptor row: confederation name + team count + venue/host count. Non-clickable text in v1; routes to confederation index (Phase 6+) when shipped.

For domestic cups (Coupe du Trône): "🇲🇦 Maroc · 32 clubs · Phase à élimination directe" replaces confederation descriptor.

**Sub-zone B — Edition selector (right of identity, ~20% width)**:
- Dropdown chip: `[Édition: 2026 ▾]`. **At Phase 4.5 launch: renders current edition only as a non-interactive label.** Forward-compatible: when past-edition data is ingested (Phase 6+), the dropdown becomes functional. Selecting an edition routes to `?edition=YYYY` query param at the same URL.

**Sub-zone C — Status descriptor (full width, below identity row)**:

Adapts to tournament state. Computed server-side per request:

| Tournament state | Status descriptor (FR example) |
|---|---|
| Pre-tournament (> 90 days to kickoff) | `Avant-tournoi · Coup d'envoi: 11 juin 2026` |
| Pre-tournament (≤ 90 days, > 0) | `Avant-tournoi · J-29 jusqu'au coup d'envoi` (countdown days) |
| Group stage live | `Phase de groupes · Tour 2/3 · 8 matchs aujourd'hui` |
| Group stage complete | `Phase de groupes terminée · 1/16e de finale dans 2 jours` |
| Knockout live | `Phase à élimination directe · 1/4 de finale en cours` |
| Final pre-kickoff | `Finale · 🇲🇦 Maroc – 🇦🇷 Argentine · dim 19 juillet 20:00` |
| Post-tournament | `Tournoi terminé · 🇲🇦 Maroc vainqueur (1er titre)` |

Refreshes via Pusher when match state transitions through phases; otherwise round-end refresh.

**Sub-zone D — Morocco context line (full width, below status descriptor)**:

For tournaments where Morocco participates:
```
Maroc dans Groupe C avec 🇦🇷 🇸🇦 🇪🇬
```

Each rival flag is clickable → that team's page (Page 4).

For tournaments where Morocco does NOT participate (e.g., past WC editions where Morocco didn't qualify):
```
Marocains dans le tournoi: Hakimi (🇲🇦), Diaz (🇪🇸), Mazraoui (🇲🇦), ...
```
Lists Moroccan players appearing for any participating nation.

For club tournaments (UCL, CAF CL):
```
Clubs marocains engagés: Wydad AC, Raja CA · 8 Marocains dans la compétition
```

For tournaments with zero Morocco signal (rare): line hides entirely.

### Intro paragraph

Below the header strip, above the 3-column zone, full-width:

```
La Coupe du Monde FIFA 2026 réunit 48 équipes nationales aux États-Unis, 
au Canada, au Mexique et au Maroc, premier hôte africain de l'histoire. 
Suivez le calendrier complet, les 12 groupes, les classements et la phase 
à élimination directe en direct.
```

Rendered as a single `<p>` element. Same styling as Page 2: IBM Plex Sans 15px, line-height 1.5, max-width ~720px, locale-aligned (RTL for Arabic).

### No FAVOURITE star

Phase 10 feature. Slot empty in v1, consistent with Page 2.

---

## Section 6 — Left rail (~360-380px)

Fixed 4-card stack. Total rail height ~1700px depending on card content. Scrolls with page (no sticky behaviour on cards).

### Card 1 — Featured match (~180px)

Same component as Page 2 Card 1. Selection algorithm scoped to this tournament:

1. If a tournament match is currently live → that
2. Else next match involving Morocco (if Morocco participates) → that
3. Else next match by stakes: Final > 3rd place > SF > QF > R16 > R32 > Group stage round 3 > round 2 > round 1
4. Else next match by kickoff proximity

For WC 2026 today (J-29 pre-tournament, no live, no Morocco-imminent in the absolute first slot): falls to opening fixture:

```
┌─ À la une ──────────────────────────────────────┐
│                                                 │
│  [crest L]            20:00                     │
│                     JEU 11 JUIN                  │
│                                                 │
│  🇲🇽 Mexique                          🇿🇦 Afrique du Sud │
│                                                 │
│  WC 2026 · Groupe A · Estadio Azteca            │
│                                                 │
│  FIFA: #11 Mexique · #59 Afrique du Sud         │
│                                                 │
└─────────────────────────────────────────────────┘
```

For Morocco's first fixture (when within 7 days), the card swaps to that:

```
┌─ À la une ──────────────────────────────────────┐
│                                                 │
│  [crest L]            21:00                     │
│                     LUN 15 JUIN                  │
│                                                 │
│  🇲🇦 Maroc                            🇦🇷 Argentine    │
│                                                 │
│  WC 2026 · Groupe C · Hassan II Stadium         │
│                                                 │
│  FIFA: #14 Maroc · #1 Argentine                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### FIFA ranking display — Page 3 key addition

**Replaces Page 2's "Forme récente WWLDW vs LWDWW" line with FIFA ranking comparison** for national-team tournaments.

Rationale: pre-tournament national teams haven't played 5 recent matches in the tournament context (national teams play less frequently than clubs). FIFA ranking is the meaningful pre-match comparison signal.

For **club tournaments** (UCL, UEL, UECL, CAF CL, CAF Confed): card reverts to Page 2 pattern with "Forme récente WWLDW vs LWDWW" since clubs play frequently and recent form is meaningful. Gated by `fifa_ranking_applicable: false` flag.

Loi 09-08 still observed — no betting odds in either national-team or club variants.

Tap action: routes to match detail page (Page 6).

### Card 2 — Matches list (~700-800px)

```
┌─ Matchs ────────────────────────────────────────┐
│                                                 │
│ [Par date ●]  [Par tour]  [Par groupe]          │
│                                                 │
│ ‹  Tour 1 · Phase de groupes  ›                 │
│                                                 │
│ ─── 11 juin 2026 ──────────────────────────── │
│ 11/06  20:00 🇲🇽 Mexique         –   🇿🇦 ZAF      │ ☆
│ 11/06  23:00 🇨🇦 Canada          –   🇧🇦 BIH      │ ☆
│                                                 │
│ ─── 12 juin 2026 ──────────────────────────── │
│ 12/06  15:00 🇰🇷 Corée du Sud    –   🇨🇿 TCH      │ ☆
│ 12/06  18:00 🇪🇨 Équateur         –   🇨🇱 Chili    │ ☆
│ ...                                             │
│                                                 │
│ Voir tous les matchs →                          │
└─────────────────────────────────────────────────┘
```

**Sub-tabs**: `Par date | Par tour | Par groupe` — three sub-tabs (vs Page 2's two). The "By group" sub-tab is the Page 3 addition per BACKLOG decision: leagues hide it, tournaments enable it.

- **Par date**: chronological list, grouped by calendar date
- **Par tour**: grouped by round — Tour 1 / Tour 2 / Tour 3 of group stage, then R32 / R16 / QF / SF / 3ème place / Finale
- **Par groupe**: grouped by group (Groupe A through Groupe L) — defaults to Morocco's group when Morocco participates

Default sub-tab on page load:
- Pre-tournament → "Par tour" with Tour 1 selected
- Group stage live → "Par date" with today's date selected
- Knockout phase → "Par tour" with current round selected
- Post-tournament → "Par tour" with Final selected

Round selector (`‹ Tour 1 · Phase de groupes ›`) follows Page 2's chevron-and-label hybrid pattern. Label opens a dropdown grid of all rounds. Rounds include both group-stage matchdays AND knockout rounds in one selector.

Fixture rows reuse the locked `FixtureRow` component from Page 2 — same 3 states (upcoming/live/finished), same favourite star, same FIFA flag/code display for national teams.

### Card 3 — Tous les groupes en bref (~600-700px) — Page 3 specific

```
┌─ Tous les groupes en bref ⓘ ────────────────────┐
│                                                 │
│ ─── Groupe A ──────────────────────────────── │
│  1  🇲🇽 Mexique          0 0  0  0   0   0    0  │
│  2  🇿🇦 Afrique du Sud   0 0  0  0   0   0    0  │
│  3  🇰🇷 Corée du Sud     0 0  0  0   0   0    0  │
│  4  🇨🇿 République Tch.  0 0  0  0   0   0    0  │
│                                                 │
│ ─── Groupe B ──────────────────────────────── │
│  1  🇨🇦 Canada           0 0  0  0   0   0    0  │
│  2  🇧🇦 Bosnie-Herz.     0 0  0  0   0   0    0  │
│  3  🇮🇷 Iran             0 0  0  0   0   0    0  │
│  4  🇨🇭 Suisse           0 0  0  0   0   0    0  │
│                                                 │
│ ─── Groupe C ★ Maroc ──────────────────────── │
│  1  🇦🇷 Argentine        0 0  0  0   0   0    0  │
│  2  🇲🇦 Maroc            0 0  0  0   0   0    0  │
│  3  🇸🇦 Arabie saoudite  0 0  0  0   0   0    0  │
│  4  🇪🇬 Égypte           0 0  0  0   0   0    0  │
│                                                 │
│ ─── Groupe D ──────────────────────────────── │
│  ... (8 more group sections follow)              │
│                                                 │
│ Voir le classement complet →                    │
└─────────────────────────────────────────────────┘
```

Compact view of all groups in one card. Each group section: header (group letter + ★ marker if Morocco's group) + 4 rows. Per row: position + flag + country name + compact stats (P W D L GD GF Pts).

Morocco's group gets a ★ marker in the group header — visual highlight regardless of scroll position.

Pre-tournament state: all rows show zeros across the board. Same structure; data populates as matches play.

**Differentiation from Sofascore**: Sofascore's WC 2026 left rail has "Power Rankings" (FIFA-style top-5-countries card). We replace with "Tous les groupes en bref" — a denser, more functional alternative giving users an at-a-glance view of every group's state, not just a curated top-5. Power Rankings is editorial; Tous les groupes en bref is factual.

"Voir le classement complet →" routes to center Standings tab via hash fragment.

Team row → that team's page (Page 4).

### Card 4 — Newsletter (~140px)

Same component as Page 2 Widget 5 (right rail) and homepage Card 8. On Page 3, moves to left rail to fill the slot vacated by removing POTS race and Team of the Week (which were Page 2's Cards 3 and 4).

Tournament-specific framing:
```
Recevez les actus de la Coupe du Monde 2026 directement.
```

Email input + S'abonner button. Submit → in-place toast confirmation (no navigation).

Implementation deferred to Phase 5+ (newsletter infrastructure decision).

### Cards NOT used on Page 3 vs Page 2

- **POTS race** (Page 2 Card 3): removed. Per-player ratings across 48 national teams have low coverage pre-tournament, and POTS as a concept fits leagues (full-season ratings) better than tournaments (3 group matches + knockout). Could be added as "Joueur du tournoi" via API ratings during/after the tournament — Phase 6+ enhancement candidate.
- **Team of the Week** (Page 2 Card 4): removed. No weekly cadence in tournament structure. Could be added as "Équipe du tour" (tour = round) for tournaments with rich coverage — Phase 6+ enhancement.
---

## Section 7 — Center column tabs (~500-520px)

### Tabs row (~48px, NOT sticky)

```
┌──────────────────────────────────────────────────┐
│ Vue d'ensemble ●  Classement   Élimination       │
│ ━━━━━━━━━━━━━━                                   │
└──────────────────────────────────────────────────┘
```

Active tab: gold underline, semibold weight. Inactive: gray text, regular weight. ~16px text.

Hash fragment updates on tab change. **3 tabs**, not 4. Media removed as a tab — videos appear as a standalone section below the 3-column zone (Section 8).

Default tab: **Vue d'ensemble (Overview)** — diverges from Page 2's Standings default. Tournament context favors a hub view as the entry point; standings make sense as default for leagues (where users come back regularly to check the table) but less for tournaments (where users want context first).

---

### Tab 1 — Vue d'ensemble (Overview, default)

H2: `Vue d'ensemble — Coupe du Monde 2026`

Content stack of 6 blocks. News block deferred to Phase 12+.

#### Block 1 — Featured Match Cards (2 side-by-side)

```
┌─────────────────────────┬─────────────────────────┐
│ [🇲🇽] Mexique           │ [🇰🇷] Corée du Sud      │
│  vs                     │  vs                     │
│ [🇿🇦] Afrique du Sud    │ [🇨🇿] République Tch.   │
│                         │                         │
│ Groupe A                │ Groupe A                │
│ Jeu 11 juin · 20:00     │ Ven 12 juin · 15:00     │
│ Estadio Azteca          │ MetLife Stadium         │
│                         │                         │
│ FIFA: #11 vs #59        │ FIFA: #22 vs #38        │
└─────────────────────────┴─────────────────────────┘
```

Two side-by-side cards. Selection algorithm: highest-stakes upcoming matches in the current/next round, with Morocco-priority bias if Morocco fixtures exist within the window.

State-adaptive selection:
- Pre-tournament: tournament opening fixtures (Tour 1 day 1)
- Group stage: today's biggest matches (Morocco prioritized if playing)
- Knockout: current/next round biggest matches (Final auto-promoted in last week)
- Post-tournament: Final + 3rd-place play-off result (if 3rd-place applicable)

Card tap → match detail page (Page 6). Each crest → that team's page (Page 4).

#### Block 2 — Mini Standings preview

```
┌─ Aperçu classement ─────────────────────────────┐
│ Groupe: [Groupe C ★ Maroc ▾]                    │
│                                                 │
│  #  Équipe         P  W  D  L  GD  GF  PTS      │
│  1  🇦🇷 Argentine   0  0  0  0   0   0   0       │
│  2  🇲🇦 Maroc       0  0  0  0   0   0   0       │
│  3  🇸🇦 Arabie S.   0  0  0  0   0   0   0       │
│  4  🇪🇬 Égypte      0  0  0  0   0   0   0       │
│                                                 │
│  Voir tous les groupes →                        │
└─────────────────────────────────────────────────┘
```

Group selector dropdown defaults to Morocco's group (Group C for WC 2026) when Morocco participates. Otherwise defaults to Group A.

"Voir tous les groupes →" routes to Standings tab via hash fragment (`#classement`).

Team row → team page (Page 4).

#### Block 3 — Titres (Historical winners)

```
┌─ Titres ────────────────────────────────────────┐
│                                                 │
│ 2022  🏆  🇦🇷 Argentine    (3ème titre)         │
│ 2018  🏆  🇫🇷 France       (2ème titre)         │
│ 2014  🏆  🇩🇪 Allemagne    (4ème titre)         │
│ 2010  🏆  🇪🇸 Espagne      (1er titre)          │
│ 2006  🏆  🇮🇹 Italie       (4ème titre)         │
│                                                 │
│ Voir tous les vainqueurs →                      │
└─────────────────────────────────────────────────┘
```

Past 5 editions shown by default. "Voir tous les vainqueurs →" → expanded list inline (Phase 4.5) or POTS-archive-style page (Phase 6+ deferred).

Country flags route to team pages (Page 4). Driven by `historical_winners` field in CALENDAR.md.

#### Block 4 — Compétitions liées (Related Competitions)

```
┌─ Compétitions liées ────────────────────────────┐
│                                                 │
│ [logo] Qualifications WC · UEFA          →      │
│ [logo] Qualifications WC · CAF           →      │
│ [logo] Qualifications WC · CONMEBOL      →      │
│ [logo] Qualifications WC · CONCACAF      →      │
│ [logo] Qualifications WC · AFC           →      │
│ [logo] Qualifications WC · OFC           →      │
└─────────────────────────────────────────────────┘
```

For WC 2026: 6 confederation qualifiers. Each → that tournament's Page 3 (different URLs).

For AFCON: AFCON Qualifiers + previous AFCON edition.
For CAF Champions League: CAF Confederation Cup + CAF Super Cup.
For UCL: UEL + UECL + UEFA Super Cup.
For Coupe du Trône: Botola Pro + Botola Pro 2 (the league competitions that feed into the cup).

Configurable per competition via `related_competitions: string[]` field in CALENDAR.md.

#### Block 5 — Faits (Facts panel)

```
┌─ Faits ─────────────────────────────────────────┐
│                                                 │
│ 48 équipes nationales                            │
│ 12 groupes de 4 équipes                          │
│ 104 matchs au total                              │
│ 16 villes hôtes                                  │
│ 4 pays organisateurs                             │
│ 11 juin → 19 juillet 2026                        │
│ Format élargi: 1ère édition à 48 équipes         │
│                                                 │
│ 1ère présence d'un pays africain comme hôte      │
│ (Maroc, co-organisateur)                         │
└─────────────────────────────────────────────────┘
```

Structured data summary. Plain-text facts pulled from `about_fr/en/ar.facts` field in CALENDAR.md. Non-clickable.

#### Block 6 — About preview

Short paragraph summary anchoring to the full About card at page bottom.

```
À propos de la Coupe du Monde 2026

La Coupe du Monde FIFA 2026, organisée du 11 juin au 19 juillet 2026, 
est la 23ème édition du tournoi mondial de football masculin. C'est la 
première édition à 48 équipes et la première organisée par 4 pays — 
les États-Unis, le Canada, le Mexique et le Maroc. Lisez la suite 
ci-dessous ↓
```

"ci-dessous ↓" anchor → scrolls to the full About card via hash fragment.

---

### Tab 2 — Classement (Standings)

H2: `Classement par groupe — Coupe du Monde 2026`

Renders **multiple mini-tables** for groups+knockout format (WC 2026 = 12 mini-tables). Each follows Page 2's 10-column structure.

#### Group selector strip

```
[Tous]  [Groupe A]  [Groupe B]  [Groupe C★]  [Groupe D]  [Groupe E]  [Groupe F]  
[Groupe G]  [Groupe H]  [Groupe I]  [Groupe J]  [Groupe K]  [Groupe L]
```

Chip carousel at top of Standings tab. "Tous" is the default and shows all groups stacked. Selecting a single group shows that group's table only (more vertical space per row).

Star marker on Morocco's group regardless of scroll position.

#### Group table format

Each group's mini-table follows Page 2's 10-column layout adapted:

```
─── Groupe C ★ Maroc ──────────────────────────────
  #  Équipe              P  W  D  L  GD   GLS    Forme   PTS
🟢 1  🇦🇷 Argentine        0  0  0  0   0   0:0    .....   0
🟢 2  🇲🇦 Maroc            0  0  0  0   0   0:0    .....   0
🟡 3  🇸🇦 Arabie saoudite  0  0  0  0   0   0:0    .....   0
🔴 4  🇪🇬 Égypte           0  0  0  0   0   0:0    .....   0
```

Column widths same as Page 2 Standings table. Same form pill click behaviour (form pill → that match's detail page per Page 2 Edit 1a).

#### Qualification zone markers

For WC 2026 (48-team, 12-group format):

```
qualification_zones (WC 2026):
  { positions: [1, 2], type: 'r16_qualified',   color: 'green' }
  { positions: [3],    type: 'best_third_pool', color: 'yellow' }
  { positions: [4],    type: 'eliminated',      color: 'red' }
```

Top 2 of each group + 8 best 3rd-placed teams = 32 teams advance to Round of 32. The "best third" mechanic uses yellow band representing "qualifies if among top 8 third-placed teams."

For AFCON 2027 (24-team, 6-group format): same structure with adjusted zone allocations.
For UCL pre-2024 (32-team, 8-group format): top 2 advance, 3rd drops to UEL, 4th eliminated.
For Coupe du Trône (pure knockout): zone markers absent — covered in Format Variants Section 18.

Legend and tiebreaker rules accordion below the last group table, same pattern as Page 2.

#### All / Home / Away sub-tabs — gated by `home_away_meaningful`

National-team tournaments typically have neutral venues — All/Home/Away splits are not meaningful. **Recommendation locked: hide A/H/A sub-tabs for national-team tournaments**.

For club tournaments (UCL, CAF CL) where home/away ties exist: A/H/A sub-tabs remain.

Configurable via CALENDAR.md flag `home_away_meaningful: boolean`. Default `true` for clubs; `false` for national teams.

#### Tiebreaker rules accordion

Below the last group table:

```
┌─ Règles de départage ───────────────────────────┐
│ 1. Points obtenus dans le groupe                │
│ 2. Différence de buts dans le groupe            │
│ 3. Buts marqués dans le groupe                  │
│ 4. Points obtenus en confrontations directes    │
│ 5. Différence de buts en confrontations         │
│ 6. Buts marqués en confrontations               │
│ 7. Points fair-play                             │
│ 8. Tirage au sort FIFA                          │
└─────────────────────────────────────────────────┘
```

WC 2026 tiebreaker rules from FIFA. Per-tournament configurable via CALENDAR.md `tiebreaker_rules` field.

#### No Standings Tracker chart

Page 2's Standings Tracker shows position-over-matchdays for 30-round seasons. Tournament group stage = 3 matchdays — too few data points. Tracker hidden on Page 3.

For Phase 6+ enhancement: a "Group progression" mini-chart per group showing 3-matchday position movement could be added. Out of v1 scope.

---

### Tab 3 — Élimination (Knockout)

H2: `Phase à élimination directe`

Bracket visualization, left + right halves converging on the Final.

#### Bracket layout

```
                  ┌─── FINALE ───┐
                  │              │
   SF1            │              │            SF2
 ┌──────┐         │   [SF1 W]    │         ┌──────┐
 │ QF1  │─┐       │     vs       │       ┌─│ QF5  │
 │      │ │       │   [SF2 W]    │       │ │      │
 └──────┘ │       │              │       │ └──────┘
          │       │  Dim 19/07   │       │
 ┌──────┐ │       │  Stade ABC   │       │ ┌──────┐
 │ QF2  │─┘       └──────────────┘       └─│ QF6  │
 │      │                                  │      │
 └──────┘                                  └──────┘
   ...        3ème place (Sam 18/07)         ...
 ┌──────┐    ┌──────────────────┐         ┌──────┐
 │ QF3  │    │  [SF1 L] vs      │         │ QF7  │
 │      │    │  [SF2 L]         │         │      │
 └──────┘    └──────────────────┘         └──────┘
 ┌──────┐                                  ┌──────┐
 │ QF4  │                                  │ QF8  │
 │      │                                  │      │
 └──────┘                                  └──────┘

(LEFT HALF: 8 R32 → 4 R16 → 4 QF → 2 SF)    (RIGHT HALF: 8 R32 → 4 R16 → 4 QF → 2 SF)
```

For WC 2026: 32 teams enter the knockout → R32 (16 matches) → R16 (8) → QF (4) → SF (2) → Final (1) + 3rd place play-off.

Bracket renders as **left + right halves converging into the Final at the center**. 3rd-place play-off sits separately below the Final.

#### Pre-tournament placeholder slots

Before group-stage completion, bracket slots are filled with placeholder text:

```
R32 Match 1:  [1er Groupe A]  vs  [2ème Groupe B]
R32 Match 2:  [1er Groupe C]  vs  [2ème Groupe D]
...
```

As matches play, placeholders resolve to actual team names with crests + flags.

#### Phase selector

```
[R32]  [R16]  [QF]  [SF]  [3ème place]  [Finale]
```

Chip-style selector at top of Knockout tab. Tapping a phase scrolls the bracket to that phase column (or zooms in on it at smaller viewports).

Default selection: current/next round (pre-tournament: R32; group stage: R32 with placeholders; during knockout: current round).

#### Bracket match cell

```
┌─────────────────────────┐
│ R32 · Match 1 · 27/06   │
│                         │
│ 🇦🇷 Argentine        2  │
│ 🇲🇽 Mexique          1  │
│                         │
│ FT · Estadio Azteca     │
└─────────────────────────┘
```

Each cell shows:
- Round + match number + date
- Two teams (flag + name + score if played, or placeholder)
- Match status (FT / Live X' / kickoff time)
- Venue (when available)

Cell tap → match detail page (Page 6). Each team flag/name → team page (Page 4).

For unplayed matches: shows "vs" without score, kickoff time below.
For live matches: animated red wash, current minute, live scores.
For penalties: shows aggregate "AET 1-1, 4-3 p" or similar notation.

#### Zoom controls (desktop)

```
[ −  Zoom  + ]   [ Réinitialiser ]
```

Buttons in top-right of bracket area. Zoom range: 50% to 200% in 25% steps. Default 100%.

For viewports ≥1440px the bracket renders fully without horizontal scroll; for 1280-1439px and zoom levels >100%, horizontal scroll engages.

#### Mobile bracket — horizontal scroll only

At <768px (mobile), zoom controls hidden. Bracket renders horizontally scrollable with current/upcoming round centered by default. Sticky vertical "Phase" label on the left edge identifies which column the user is currently viewing.

#### Embed button — deferred Phase 12+

Sofascore has an `</> Embed` button to embed the bracket as iframe on external sites. Atlas Kings defers this to Phase 12+ (syndication infra).

#### Pre-tournament state — full bracket as "draw preview"

Before group-stage starts, the bracket is fully visible with placeholder slots showing the qualification path (e.g., "1er Groupe A vs 2ème Groupe B"). Users can see the bracket structure even before any teams are confirmed.

#### Group stage live — bracket with partial resolution

As group-stage matches play and teams clinch positions, placeholders progressively resolve to actual team names.

#### Knockout live — bracket with completed paths

Played knockout matches show final scores; upcoming matches show kickoff times; live matches show current minute and animated state.

#### Post-tournament — full bracket with winner highlighted

Final cell shows winner with trophy icon. Winner's path through the bracket visually emphasized (gold border on path cells).

---

## Section 8 — Vidéos section (below center column, full content width)

New section at v1 launch replacing Page 2's Media-tab stub. YouTube embedded videos for tournament content.

```
┌─ Vidéos ────────────────────────────────────────────────────────────┐
│                                                                     │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│ │  Thumbnail   │  │  Thumbnail   │  │  Thumbnail   │                │
│ │  [▶ play]    │  │  [▶ play]    │  │  [▶ play]    │                │
│ ├──────────────┤  ├──────────────┤  ├──────────────┤                │
│ │ Le tirage    │  │ Atlas Lions  │  │ Stades du WC │                │
│ │ du WC 2026   │  │ vers le WC   │  │ 2026 au Maroc│                │
│ │ 3:42 · FIFA  │  │ 5:18         │  │ 8:01         │                │
│ └──────────────┘  └──────────────┘  └──────────────┘                │
│                                                                     │
│  Voir plus →                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

H2: `Vidéos` (FR) / `Videos` (EN) / `فيديوهات` (AR).

### Layout
- 3-up grid at ≥1280px, 2-up at 768-1279px, 1-column on mobile
- Each card: thumbnail + play overlay + title + duration + source/channel
- "Voir plus →" expands grid inline (shows up to 9 videos in v1; more deferred to Phase 6+ video page)

### YouTube embed implementation

**Privacy + performance: `youtube-nocookie.com` domain, lazy-loaded.**

```html
<iframe 
  src="https://www.youtube-nocookie.com/embed/{video_id}?rel=0&modestbranding=1"
  loading="lazy"
  title="{video_title_localized}"
  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
></iframe>
```

Important:
- `youtube-nocookie.com` (not `youtube.com`) — no tracking cookies set until user clicks play. Critical for Loi 09-08 compliance.
- `loading="lazy"` — iframe doesn't load until scrolled near viewport.
- `rel=0` — prevents YouTube from showing related videos from other channels at the end.
- `modestbranding=1` — minimizes YouTube branding overlay.

### Click behaviour — facade pattern

Performance optimization: render a static thumbnail + play button initially. Only swap in the YouTube iframe when user clicks the thumbnail. Saves ~500KB per video on initial page load.

```html
<div class="video-facade" data-video-id="...">
  <img src="{thumbnail_url}" alt="{title}" loading="lazy" />
  <button class="play-overlay" aria-label="Lire la vidéo">▶</button>
</div>
```

JS click handler swaps facade for actual iframe on first user interaction.

### Optional: open in modal vs in-place

Two UX patterns possible:
- **In-place**: thumbnail swaps to iframe inline; user watches in the grid
- **Modal overlay**: thumbnail click opens centered modal with iframe at larger size

Recommendation: **in-place** for simplicity in v1; modal upgrade Phase 6+.

### Content curation — hand-curated per tournament

API-Football doesn't provide video URLs. YouTube IDs are curated in CALENDAR.md:

```typescript
media_youtube_ids: string[]  // e.g. ['dQw4w9WgXcQ', 'oHg5SJYRHA0', ...]
```

For WC 2026: 6-12 videos hand-curated covering tournament intro, group draw, Morocco preview, stadium tours, Atlas Lions journey, historical highlights, etc.

For AFCON, WAFCON, UCL, CAF CL: similar curation, 4-8 videos each.

For Coupe du Trône and lower-priority tournaments: empty array initially; populated when editorial time allows.

### Empty state

If `media_youtube_ids` is empty:

```
Vidéos bientôt disponibles. Suivez-nous sur YouTube →
```

Includes a link to Atlas Kings YouTube channel (Phase 12+ — placeholder URL until channel exists).

### Section visibility

Hides entirely if zero videos AND no YouTube channel link exists. No orphan empty section.

---

## Section 9 — Right rail (~280-300px)

Fixed 5-widget stack. Same structural pattern as Page 2 right rail but with tournament-specific content. Total rail height ~1500-1700px.

### Widget 1 — Top scorers (~240px)

```
┌─ Meilleurs buteurs ─────────┐
│ Coupe du Monde 2026         │
├─────────────────────────────┤
│ #  Joueur          Buts     │
│    (pré-tournoi)            │
│    Aucune donnée disponible │
│    avant le coup d'envoi    │
│                             │
│ Voir tous →                 │
└─────────────────────────────┘
```

Pre-tournament: empty state with explanation. As tournament progresses, top 6 scorers populate.

Post-tournament: final top 6 list with golden boot winner highlighted.

Player row → player page (Page 5). "Voir tous →" routes to tournament-scoped scorers leaderboard (Phase 6+ feature page at `/[locale]/classements/buteurs/coupe-du-monde-2026`).

### Widget 2 — Top assists (~240px)

Same structure as Widget 1 for assists. Empty pre-tournament; populates as matches play. Same routing.

### Widget 3 — MeetTheTeamsCard (~320px) — Page 3 specific

```
┌─ Présentation des équipes ──┐
│                             │
│ Groupe C ★ Maroc            │
│                             │
│ 🇦🇷 [photo] Argentine        │
│    32 ans · Lionel Messi    │
│    capitaine                │
│                             │
│ 🇲🇦 [photo] Maroc            │
│    25 ans · Achraf Hakimi   │
│    capitaine                │
│                             │
│ 🇸🇦 [photo] Arabie saoudite  │
│    27 ans · Salem Al-Dawsari│
│    capitaine                │
│                             │
│ 🇪🇬 [photo] Égypte           │
│    32 ans · Mohamed Salah   │
│    capitaine                │
│                             │
│ Voir toutes les équipes →   │
└─────────────────────────────┘
```

Shows participating nations from Morocco's group (Group C for WC 2026) with each team's captain or marquee player. Photo from API-Football CDN.

For tournaments where Morocco doesn't participate (theoretical for past WC editions): swap to "Marocains dans la compétition" listing Moroccan players appearing for any participating nation.

For club tournaments (UCL, CAF CL): swap to "Clubs marocains engagés" listing Moroccan clubs in the competition, or to "Marocains dans la compétition" listing Moroccan players across all participating clubs.

For tournaments with no Morocco signal at all: widget swaps to generic "Présentation des équipes" showing top 4 highest-FIFA-ranked participating teams.

"Voir toutes les équipes →" expands inline showing all participating teams (Phase 4.5 inline expansion) or routes to a teams-grid page (Phase 6+).

Team photo + name → team page (Page 4).

### Widget 4 — MoreMatchesToday (~280px)

Same component as Page 2. Cross-competition fixtures today, scoped to top leagues + Morocco-relevant matches + matches in OTHER active tournaments. Acts as a back-link to homepage's fixture browser.

### Widget 5 — Newsletter (~140px)

Same component as Page 2. Tournament-specific framing:
```
Recevez les actus de la Coupe du Monde directement.
```

---

## Section 10 — Right rail behaviour

- Visible at ≥1280px viewport (Atlas Kings floor, consistent with Page 2)
- 1280-1343px: rail rendered at ~280px width
- ≥1344px: rail rendered at ~300px width
- Below 1280px: rail hidden, 2-column layout (left rail + center)
- Below 768px: single column mobile (see Section 12)
- Scrolls with page (no sticky behaviour)
- Replaces Sofascore's ad slot — Atlas Kings uses for tournament editorial widgets per Loi 09-08

---

## Section 11 — About card

Long-form keyword-bearing card at page bottom, after the Videos section, before the footer.

Same structure as Page 2 About card: 6 H2 sections + 6-8 FAQ entries. ~600-900 words per locale. Hand-written for priority tournaments.

### Structure for WC 2026

```
## À propos de la Coupe du Monde FIFA 2026

La Coupe du Monde FIFA 2026 est la 23ème édition du tournoi mondial de 
football masculin. Elle se déroule du 11 juin au 19 juillet 2026 dans 
4 pays — les États-Unis, le Canada, le Mexique et le Maroc — marquant 
la première participation africaine à l'organisation de la Coupe du Monde 
et la première édition à 48 équipes.

## Format de la compétition

48 équipes nationales réparties en 12 groupes de 4. Chaque équipe joue 3 
matchs de phase de groupes. Les deux premiers de chaque groupe (24 équipes) 
plus les 8 meilleurs troisièmes (sur les 12) se qualifient pour la phase 
à élimination directe à partir des 1/16e de finale. 104 matchs au total.

## Le Maroc dans la Coupe du Monde 2026

Le Maroc est co-organisateur (en 2030, hôte unique) et participe dans le 
Groupe C aux côtés de l'Argentine (tenant du titre), l'Arabie saoudite et 
l'Égypte. Six villes marocaines accueillent des matchs: Casablanca (Stade 
Hassan II), Rabat (Stade Mohammed V), Tanger (Grand Stade), Marrakech 
(Grand Stade), Agadir (Stade Adrar) et Fès (Stade de Fès). Demi-finale 
historique en 2022 (4ème place), les Lions de l'Atlas visent une nouvelle 
performance majeure.

## Stades et villes hôtes

16 villes hôtes au total: 11 aux États-Unis (incl. New York, Los Angeles, 
Dallas, Boston), 3 au Mexique (Mexico City, Guadalajara, Monterrey), 2 au 
Canada (Toronto, Vancouver), 6 au Maroc (les six citées ci-dessus). La 
finale aura lieu au MetLife Stadium dans le New Jersey.

## Vainqueurs précédents

L'Argentine est tenante du titre (2022), avec 3 titres au total. Le 
Brésil détient le record avec 5 titres. L'Allemagne, l'Italie et la 
France suivent. Aucune équipe africaine n'a remporté la compétition; le 
Maroc et le Cameroun ont atteint la demi-finale (Maroc 2022, Cameroun 
1990 - quart de finale).

## Atlas Kings sur la Coupe du Monde 2026

Atlas Kings couvre la Coupe du Monde 2026 avec un focus particulier sur 
le parcours des Lions de l'Atlas, les Marocains à l'étranger participant 
pour leur sélection, les matchs disputés au Maroc, et les histoires de 
joueurs et entraîneurs du continent africain.

## Questions fréquentes

### Quand commence et finit la Coupe du Monde 2026 ?
Du 11 juin au 19 juillet 2026.

### Dans quel groupe est le Maroc à la Coupe du Monde 2026 ?
Le Maroc est dans le Groupe C avec l'Argentine, l'Arabie saoudite et 
l'Égypte.

### Combien d'équipes participent à la Coupe du Monde 2026 ?
48 équipes nationales, soit 16 de plus qu'en 2022. C'est la 1ère édition 
au format élargi.

### Où regarder la Coupe du Monde 2026 au Maroc ?
Les matchs sont diffusés sur Arryadia TV et SNRT (chaînes publiques 
marocaines).

### Quelles villes marocaines accueillent des matchs ?
Six villes: Casablanca, Rabat, Tanger, Marrakech, Agadir et Fès.

### Quels Marocains de l'étranger jouent pour le Maroc ?
Achraf Hakimi (PSG), Brahim Diaz (Bayern), Noussair Mazraoui (Man Utd), 
Youssef En-Nesyri (Fenerbahce), Sofyan Amrabat (Real Betis), Nayef Aguerd 
(Real Sociedad), entre autres.

### Comment fonctionne la qualification au 1/16e de finale ?
Top 2 de chaque groupe + 8 meilleurs troisièmes (parmi les 12 groupes) = 
32 équipes en 1/16e.

### Le Maroc a-t-il déjà accueilli la Coupe du Monde ?
Non, 2026 est la 1ère participation marocaine à l'organisation. Le Maroc 
sera également hôte (avec l'Espagne et le Portugal) en 2030.
```

Per-locale variants. Arabic uses passionate fan-aligned tone per keyword analysis recommendation. English uses neutral journalistic tone.

### Data source

About card content lives in CALENDAR.md per competition entry:

```
about_fr: {
  intro: string,
  format: string,
  morocco_section: string,    // NEW for Page 3 — Morocco-specific framing
  hosts: string,
  past_winners: string,
  editorial: string,
  faqs: Array<{ q: string, a: string }>
}
about_en: { ... same shape }
about_ar: { ... same shape }
```

Hand-written for 6-8 priority tournaments; templated for the rest.

---

## Section 12 — Live data and caching

### Pusher subscriptions on this page

| Element | Pusher channel | Update cadence |
|---|---|---|
| Adaptive top strip (Mode 1 countdown or Mode 2 LIVE) | `tournament-{id}-state` | per-event |
| Page header status descriptor | `tournament-{id}-state` | round-end |
| Featured match card | `fixture-{id}` of selected fixture | per-event |
| Featured Match Cards (Overview Block 1) | `fixture-{id}` for each shown match | per-event |
| Matches list — live rows | `fixture-{id}` for each visible live match | per-event |
| Mini Standings preview (Overview Block 2) | `tournament-{id}-standings` | round-end |
| Standings tab — all group tables | `tournament-{id}-standings` | round-end |
| Tous les groupes en bref (left rail Card 3) | `tournament-{id}-standings` | round-end |
| Knockout tab — bracket cells | `fixture-{id}` for each visible match | per-event |
| Top scorers / Top assists widgets | `tournament-{id}-leaderboards` | post-match (batch) |

### Server-side caching

| Element | TTL |
|---|---|
| Page header (non-live) | 60s |
| Mini Standings preview | 60s when no live; 0s when live match in selected group |
| Standings tab | 60s when no live; 0s when any live in tournament |
| Knockout bracket | 60s when no live; 0s when any live |
| Stats blocks (where present) | 5 min |
| About card | 24 hours (rarely changes) |
| Top scorers / assists | 5 min |
| MoreMatchesToday widget | 60s |
| MeetTheTeamsCard | 24 hours (largely static team intro data) |
| Videos section | 24 hours (curated content list changes rarely) |

Status descriptor in page header updates at **phase transitions only** (group-stage end, knockout-round end, etc.), not per-fixture. Same approach as Page 2's matchday/leader strip.

---

## Section 13 — Mobile (375px)

### Single-column stacked layout

```
[ADAPTIVE TOP STRIP ~40px]
[TOPBAR ~56px condensed]   ← [≡] [Atlas Kings]  🔍 EN ☾
[SEO breadcrumb ~22px, compact]
[PAGE HEADER — mobile condensed ~180-220px]
  Logo 48×48 + name (smaller) + region + edition label
  Status descriptor
  Morocco context line
  Intro paragraph (full text)
[FEATURED MATCH CARD]
[TABS row]
  Vue d'ensemble ● Classement Élimination
[H2 inside active tab]
[ACTIVE TAB CONTENT]
  Overview default: 6 content blocks stacked
[TOP SCORERS WIDGET]              ← promoted from right rail
[MEET THE TEAMS CARD]             ← promoted from right rail
[MATCHES LIST]                     ← from left rail, full-width
[TOUS LES GROUPES EN BREF]        ← from left rail
[TOP ASSISTS]                      ← from right rail
[MORE MATCHES TODAY]               ← from right rail
[NEWSLETTER]                       ← from right rail (or kept in left rail)
[VIDÉOS SECTION]                   ← single-column video stack
[ABOUT CARD — full content]
[FOOTER vertical stack]
[FIXED BOTTOM TAB BAR ~56px]
```

### Mobile Knockout tab — horizontal scroll only

Zoom controls hidden. Bracket renders horizontally scrollable with current/upcoming round centered by default. Sticky vertical "Phase" label on the left edge identifies which column is in view. Touch swipe to navigate between rounds.

### Mobile group selector

The chip carousel (`[Tous] [Groupe A] [Groupe B] [Groupe C★] ...`) becomes horizontally scrollable on mobile. Morocco's group chip stays initially centered.

### Mobile Videos section

Stacks as 1-column grid. Each video facade ~340px tall (16:9 ratio at 375px width minus padding). Same lazy-load + click-to-iframe pattern.

---

## Section 14 — All locked decisions summary

| Element | Decision |
|---|---|
| Page identity | Cup/Tournament competition family. WC 2026 canonical instance. Repurposes for all international tournaments + domestic cups via Format Variants (Section 18). |
| URL canonical | `/[locale]/competition/[confederation-or-country]/[tournament-slug]` |
| URL — confederation root | `fifa`/`uefa`/`caf`/`afc`/`ioc` for cross-border; country slug for domestic cups |
| URL — `/competition/` segment | Not translated; same across all locales |
| Tab state | Hash fragments per locale (`#vue-densemble` / `#classement` / `#elimination`) |
| Edition history | Forward-compatible EditionSelector; current edition only at v1 launch. Past editions deferred Phase 6+. Same URL + `?edition=YYYY` query param when shipped. |
| hreflang | All three locale variants reference each other; `x-default` → FR |
| Page header | Same horizontal data-rich strip as Page 2 (no Sofascore-style gradient hero). Logo + H1 (IBM Plex Sans) + confederation badge + edition selector + status descriptor + Morocco context line. ~210-240px, not sticky. |
| H1 | Tournament name + edition year, IBM Plex Sans (not Fraunces) |
| Intro paragraph | Keyword-loaded 25-40 words per locale, hand-written for priority tournaments |
| Title + meta | Keyword-loaded with format-appropriate modifiers per locale |
| JSON-LD | SportsEvent block for tournament + per-fixture SportsEvent array |
| Image alt text | Per-locale, all flags/crests/trophy logos/stadium photos |
| Inner-page shell | Inherited from Page 2: ~360-380 left + ~500-520 center + ~280-300 right at 1280px floor |
| Center column tabs | 3 tabs: Vue d'ensemble / Classement / Élimination. Overview is default (NOT Standings — diverges from Page 2). |
| Overview tab content | 6 blocks: Featured Match Cards (2) / Mini Standings preview / Titres / Compétitions liées / Faits / About preview. News deferred Phase 12+. |
| Standings tab | Multi-group mini-tables (12 for WC 2026). 10-column format per group. Group selector chip carousel with "Tous" default. |
| Standings A/H/A sub-tabs | Hidden for national-team tournaments (neutral venues). Shown for club tournaments. Gated by `home_away_meaningful` flag. |
| No Standings Tracker chart | Removed — 3-matchday group stage = too few data points |
| Knockout tab | Bracket viz, left + right halves converging on Final. 3rd place play-off separately. Pre-tournament placeholders ("1er Groupe A vs 2ème Groupe B"). Zoom desktop, horizontal scroll mobile. Embed deferred Phase 12+. |
| Left rail | 4 cards: Featured match → Matches list (with Par groupe sub-tab) → Tous les groupes en bref → Newsletter. POTS race and TOTW removed for tournaments. |
| Featured match algorithm | Live → Morocco-imminent → stakes-based (Final > 3rd > SF > QF > R16 > R32 > group stage) → kickoff proximity. FIFA ranking replaces form line for national-team tournaments. |
| Round selector | Chevron-and-label hybrid per Page 2 pattern, scoped to tournament rounds (group stage + knockout) |
| Right rail | 5 widgets: Top scorers / Top assists / MeetTheTeamsCard / MoreMatchesToday / Newsletter |
| MeetTheTeamsCard | Replaces MoroccoEditorialPicks for tournaments. Shows Morocco's group teams with captain/marquee player photos. Adapts when Morocco not participating or club tournament. |
| FIFA ranking display | Shown alongside team names in national-team tournaments. Hidden for club tournaments. Gated by `fifa_ranking_applicable` flag. |
| Videos section | NEW at v1 launch. Below 3-column zone, above About card. YouTube embeds via `youtube-nocookie.com`, lazy-loaded facade pattern, in-place inline expansion. CALENDAR.md `media_youtube_ids: string[]`. |
| About card | Bottom of page. 6 H2 sections + 6-8 FAQ. Hand-written for priority tournaments. Morocco section explicitly included for tournaments where Morocco participates. |
| Live data | Pusher per-fixture for live matches; tournament-state for phase transitions; round-end for standings |
| Caching | 60s standings non-live / 0s live / 5min stats / 24h about |
| Mobile (375px) | Single-column stack. Knockout bracket horizontally scrollable. Group selector chip carousel horizontally scrollable. Videos 1-column. |
| Compliance | Loi 09-08 (no odds anywhere — replaced by FIFA ranking comparison in Featured card); YouTube via youtube-nocookie.com (no tracking cookies); no Sign In until Phase 10 |
| Placeholder content | Real WC 2026 seed data: 48 teams, 12 groups, Morocco in Group C with Argentina/Saudi Arabia/Egypt, host countries US/CA/MX/MA |

---

## Section 15 — Component inventory for Phase 4.5 implementation

### New components to build (Page 3 specific)

| Component | Location | Reuse on other pages |
|---|---|---|
| TournamentPageHeader | src/components/tournament/TournamentPageHeader.tsx | Page 3 only (vs Page 2's CompetitionPageHeader) |
| EditionSelector | src/components/tournament/EditionSelector.tsx | Page 3 (forward-compatible; renders label only at v1) |
| StatusDescriptor | src/components/tournament/StatusDescriptor.tsx | Page 3 — state-adaptive descriptor |
| MoroccoContextLine | src/components/tournament/MoroccoContextLine.tsx | Page 3 — Morocco's group / Moroccan players / Moroccan clubs |
| OverviewTabContent | src/components/tournament/OverviewTabContent.tsx | Page 3 |
| FeaturedMatchCardsRow | src/components/tournament/FeaturedMatchCardsRow.tsx | Page 3 (Overview block) |
| MiniStandingsPreview | src/components/tournament/MiniStandingsPreview.tsx | Page 3 (Overview block) |
| TitresHistoricalWinners | src/components/tournament/TitresHistoricalWinners.tsx | Page 3 (Overview block) |
| RelatedCompetitions | src/components/tournament/RelatedCompetitions.tsx | Page 3 (Overview block) |
| FactsPanel | src/components/tournament/FactsPanel.tsx | Page 3 (Overview block); reused on Page 4 (team Details) |
| MultiGroupStandings | src/components/tournament/MultiGroupStandings.tsx | Page 3 Standings tab |
| GroupSelectorStrip | src/components/tournament/GroupSelectorStrip.tsx | Page 3 Standings tab |
| KnockoutBracket | src/components/tournament/KnockoutBracket.tsx | Page 3 Knockout tab |
| BracketMatchCell | src/components/tournament/BracketMatchCell.tsx | Page 3 Knockout tab |
| PhaseSelector | src/components/tournament/PhaseSelector.tsx | Page 3 Knockout tab |
| BracketZoomControls | src/components/tournament/BracketZoomControls.tsx | Page 3 Knockout tab (desktop only) |
| TousLesGroupesEnBref | src/components/tournament/TousLesGroupesEnBref.tsx | Page 3 left rail Card 3 |
| MeetTheTeamsCard | src/components/widgets/MeetTheTeamsCard.tsx | Page 3 right rail Widget 3 |
| VideosSection | src/components/tournament/VideosSection.tsx | Page 3 (below 3-column zone); reusable Page 12+ for news |
| YouTubeFacade | src/components/media/YouTubeFacade.tsx | Page 3 + Phase 12+ news/media |
| FifaRankingBadge | src/components/tournament/FifaRankingBadge.tsx | Page 3 + Page 4 (national teams) + Page 6 (national-team fixtures) |
| TournamentTabs | src/components/tournament/TournamentTabs.tsx | Page 3 (variant of CompetitionTabs) |

### Reused from Page 2 (no changes needed)

- InnerPageShell
- FixtureRow (used in Featured card + Matches list)
- AboutCard (with tournament-specific content)
- FAQList
- StructuredDataInjector (with SportsEvent variant for tournaments)
- TopScorersWidget (right rail Widget 1)
- TopAssistsWidget (right rail Widget 2)
- MoreMatchesTodayWidget (right rail Widget 4)
- NewsletterCard

### Reused from homepage.md (no changes needed)

- AdaptiveTopStrip
- Topbar
- SeoBreadcrumb
- Footer
- MobileBottomTabBar
- MobileHamburgerDrawer

### CALENDAR.md schema additions required (Page 3 specific)

```typescript
tournament_format: 'groups_and_knockout' | 'pure_knockout' | 'swiss_and_knockout' | 'league_phase_only'
groups_count: number | null
teams_count: number
host_country_codes: string[]
kickoff_date: ISO date
final_date: ISO date
edition_year: number
fifa_ranking_applicable: boolean
home_away_meaningful: boolean
media_youtube_ids: string[]
related_competitions: string[]
historical_winners: Array<{ year, team_id, runner_up_id, host_country_codes }>
knockout_starts_round: 'r32' | 'r16' | 'qf'
has_third_place_match: boolean
qualification_zones: Array<{ positions, type, color }>  // per-group, adapted from Page 2
about_fr/en/ar: { intro, format, morocco_section, hosts, past_winners, editorial, faqs }
```

---

## Section 16 — Open questions for Phase 4.5 implementation

| Question | Owner | Decision target |
|---|---|---|
| Knockout bracket — exact zoom step (25%? 33%?) and max zoom level (200%? 300%?) | UX | 4.5b implementation |
| Mobile bracket horizontal scroll — snap-to-column or free scroll? | UX | 4.5a |
| Group selector "Tous" view vs single-group view — which is the default on initial Standings tab visit? | UX | 4.5a |
| MeetTheTeamsCard — when Morocco doesn't participate, exact ranking criteria for which players surface? Most minutes for Morocco, or current FIFA ranking, or marquee/highest-profile? | Product | Phase 5 |
| Status descriptor — exact countdown granularity (J-29 vs J-29 H-10? hourly precision near kickoff?) | UX | 4.5a |
| YouTube video curation cadence — when do we refresh `media_youtube_ids`? Per-matchday? Per-phase transition? Manual editorial cycle? | Editorial | 4.5b |
| Videos section "Voir plus →" — inline expansion limit (9 videos? 12?) before requiring Phase 6+ video page | UX | 4.5b |
| Knockout bracket pre-tournament placeholder text — locale-translated by hand or templated string interpolation? | Editorial | 4.5a |
| Featured match card on Page 3 (left rail) vs Featured Match Cards (Overview tab, 2 side-by-side) — duplicate content if both feature Morocco's next match? Coordination rule needed. | Product | Phase 5 |
| FIFA rankings data source — API-Football has it? Manual ingestion required? Refresh cadence? | Engineering | Phase 5 ingestion |
| About card "morocco_section" — when Morocco doesn't participate, does this section hide or swap to alternative editorial framing? | Editorial | 4.5b |

---

## Section 17 — Differences from Sofascore WC 2026 reference

| Element | Sofascore | Atlas Kings |
|---|---|---|
| URL structure | `/football/tournament/world/world-championship/16` (trailing ID, /world region) | `/[locale]/competition/fifa/coupe-du-monde-2026` (no trailing ID, /fifa confederation root, locale-translated slug) |
| Locale handling | One URL (English-dominant) | Locale-translated slugs with hreflang bridges |
| Hero banner | Dark gradient + trophy graphic + year pills carousel + stage progress timeline | Horizontal data-rich strip same as Page 2 (no gradient/graphic/Fraunces). EditionSelector and TournamentProgressBar removed for design consistency. |
| Tabs | Overview / Standings / Knockout / Media (4 tabs) | Overview / Standings / Knockout (3 tabs). Media removed; videos as standalone section below tabs. |
| Left rail card 2 | Power Rankings (top 5 countries pre-tournament) | Tous les groupes en bref (compact view of all 12 groups — more functional, less editorial) |
| Featured Match Cards | Includes bet365 odds row | Replaces with FIFA ranking comparison (Loi 09-08) |
| Right rail | Sofascore Analyst promo + Ad unit | 5 editorial widgets (Top scorers / Top assists / MeetTheTeamsCard / MoreMatchesToday / Newsletter) |
| Media tab | Sub-tabs All/Meet the teams/Highlights/News | Videos section (YouTube embeds) at v1; News deferred Phase 12+ |
| YouTube embeds | Standard `youtube.com` (tracking cookies) | `youtube-nocookie.com` (no tracking; Loi 09-08 compliance) + lazy-loaded facade pattern |
| Standings A/H/A sub-tabs | Always present | Hidden for national-team tournaments (neutral venues); shown for clubs |
| Standings Tracker chart | Present | Removed (3-matchday group stage too few data points) |
| Page header status descriptor | None (static hero) | State-adaptive (pre-tournament countdown / group stage matchday / knockout phase / post-tournament winner) |
| Morocco context line | None | Hero shows Morocco's group with rival flags |
| Edition selector | Year pills carousel 2026→1930 (interactive) | Current edition only at v1 (forward-compatible component) |
| TournamentProgressBar | Present in hero (Group stage → R32 → R16 → QF → SF → Final dots) | Removed entirely — tab structure communicates phase navigation |
| Power Rankings card | Present (left rail Card 2) | Removed — replaced by Tous les groupes en bref |
| Newsletter | Not present | Present (left rail Card 4 + right rail Widget 5) |
| FIFA ranking display on teams | Limited (mentioned in match-detail FIFA Rankings card) | Surfaced everywhere national teams appear (Featured cards, Matches list, MeetTheTeams, Knockout bracket cells) |
| Fan Polls in Featured cards | Not present on tournament page | Carried from Page 2 / homepage pattern (Qui va gagner? vote buttons) |
| Embed bracket button | Present | Deferred Phase 12+ (syndication infra) |
| About card | Short About + FAQ | Long-form 6 H2 sections + 6-8 FAQ + Morocco section explicitly highlighted |

---

## Section 18 — Format variants

Atlas Kings Page 3 template canonically documents WC 2026 (groups+knockout). Other tournament formats use the same template with specific deltas. This section documents each variant's adaptations.

### Variant A — Pure knockout (no groups)

**Applies to**: Coupe du Trône, FIFA Arab Cup (knockout phase), CAF Super Cup, UEFA Super Cup, FIFA Intercontinental Cup, U-17 World Cup (when format is pure-knockout).

**Key reference**: Coupe du Trône — Moroccan domestic cup, 32-club knockout from R32 → R16 → QF → SF → Final.

**Deltas from WC 2026 canonical**:

| Element | WC 2026 canonical | Variant A pure-knockout |
|---|---|---|
| `tournament_format` | `groups_and_knockout` | `pure_knockout` |
| `groups_count` | 12 | `null` |
| Center column tabs | Vue d'ensemble / Classement / Élimination | Vue d'ensemble / **Élimination** (2 tabs — Standings tab hidden because no group stage) |
| Default tab | Vue d'ensemble | Vue d'ensemble |
| Left rail Card 2 (Matches) | Sub-tabs: Par date / Par tour / Par groupe | Sub-tabs: **Par date / Par tour** (no Par groupe — no groups) |
| Left rail Card 3 | Tous les groupes en bref | **Tirage du tableau** — compact view of the bracket showing which clubs face which (functions as Card 3's slot) |
| Overview Block 2 | Mini Standings preview | **Tirage en cours** — abbreviated bracket preview showing current round's pairings |
| Knockout bracket starting round | R32 | R32 or R16 depending on entry count (per `knockout_starts_round` flag) |
| Status descriptor | "Avant-tournoi / Phase de groupes / Phase à élimination directe" | "Avant-tournoi / 1/16e en cours / 1/8e en cours / 1/4 en cours / Demi-finales / Finale" |
| Morocco context line | Morocco's group | **Clubs marocains restants**: list of Moroccan clubs still alive in the tournament |
| Right rail Widget 3 (MeetTheTeams) | Morocco's group teams | **Tableau des clubs**: list of all participating clubs with crests, ranked by current bracket position |
| FIFA ranking | Shown (national teams) | **Hidden** (clubs have no FIFA ranking) — use league position instead |
| Featured match card "FIFA ranking" line | "FIFA: #14 Maroc vs #1 Argentine" | **"Botola Pro: 2ème Raja vs 4ème Wydad"** — league position context |
| About card "morocco_section" | Morocco in the tournament | Moroccan clubs' historic Coupe du Trône records |

All other elements (URL pattern, SEO, page header structure, intro paragraph, About card framework, mobile layout, caching, right rail widgets except #3) remain identical.

### Variant B — Swiss + knockout

**Applies to**: UCL post-2024, UEL post-2024, UECL post-2024.

**Key reference**: UEFA Champions League post-2024 format — 36 clubs play 8 matches in a single league phase, top 8 auto-qualify to R16, places 9-24 enter knockout play-off round, places 25-36 eliminated.

**Deltas from WC 2026 canonical**:

| Element | WC 2026 canonical | Variant B Swiss+knockout |
|---|---|---|
| `tournament_format` | `groups_and_knockout` | `swiss_and_knockout` |
| `groups_count` | 12 | `null` (no groups; single league phase) |
| Center column tabs | Vue d'ensemble / Classement / Élimination | Vue d'ensemble / **Phase de ligue** / Élimination (3 tabs; Classement renamed to Phase de ligue) |
| Standings tab | Multi-group mini-tables | **Single 36-row table** (like Page 2 leagues but with knockout-qualification zone markers instead of relegation) |
| Qualification zones | Top 2 + best thirds → R16; 4th eliminated | **Positions 1-8 → R16 direct; positions 9-24 → R16 play-off; positions 25-36 → eliminated** |
| Standings A/H/A sub-tabs | Hidden (national teams) | **Shown** (clubs play home/away) |
| Left rail Card 3 | Tous les groupes en bref | **Aperçu du classement** — compact top-8 / play-off zone / elimination zone view (replaces all-groups) |
| Overview Block 2 (Mini Standings) | Group selector dropdown | **Top 10 of single table** preview |
| Left rail Card 2 sub-tabs | Par date / Par tour / Par groupe | Par date / Par tour (no Par groupe; matches are paired by Swiss algorithm not group structure) |
| Knockout bracket starting round | R32 | **R16 play-off** (24 teams) + R16 main + QF + SF + Final + 3rd place |
| Status descriptor | "Phase de groupes / Phase à élimination directe" | "Phase de ligue · Journée X/8 / Phase à élimination directe / 1/16e / etc." |
| Morocco context line | Morocco's group | **Marocains dans la compétition**: list of Moroccan players in participating clubs |
| Right rail Widget 3 (MeetTheTeams) | Morocco's group teams | **Tableau des clubs** with current league phase position |
| FIFA ranking | Shown | Hidden (clubs) — league position used |

The 36-team Swiss table is structurally closer to a Page 2 league standings table than to WC 2026's multi-group format — but with knockout-qualification zone markers replacing relegation markers.

### Variant C — League phase only (no knockout)

**Applies to**: UEFA Nations League group stage (when isolated from the finals knockout), regional league competitions occasionally surfacing as standalone tournaments.

**Deltas from WC 2026 canonical**:

| Element | WC 2026 canonical | Variant C league-phase-only |
|---|---|---|
| `tournament_format` | `groups_and_knockout` | `league_phase_only` |
| Center column tabs | Vue d'ensemble / Classement / Élimination | Vue d'ensemble / **Classement** (2 tabs — Knockout hidden) |
| Default tab | Vue d'ensemble | **Classement** (no knockout context; standings is the headline) |
| Knockout-related components | All present | **All hidden** (KnockoutBracket, PhaseSelector, etc.) |
| Featured match algorithm | Includes knockout stakes | Falls back to standings stakes (top-table battle, relegation battle, leader vs second) |
| Status descriptor | Multi-phase | "Phase de ligue · Journée X/Y" only |

Effectively a Page 2 league template, but with tournament-style framing (edition year, multi-edition history potential, group structure if applicable) instead of season-by-season league context.

---

## Section 19 — Outbound link targets

Every clickable destination on the page (WC 2026 canonical instance). Documented against the spec (Sections 4-13), not extrapolated.

Routes documented per the patterns established in Page 1 (homepage.md Section 16) and Page 2 (competition-league.md Section 17). Phase 6+ deferred-affordance rule applies (render as non-clickable text until destination page ships).

### Category 1 — Routes to existing Pages 2-7 (in scope, schematicized separately)

**Inherited chrome (per Section 4)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Topbar — all items | Per homepage Section 16 | Pages 1-7 | Per topbar routing |
| SeoBreadcrumb segment 1 ("Football") | Homepage | Page 1 | `/fr` |
| SeoBreadcrumb segment 3 (current tournament name) | Current page (non-clickable) | — | — |
| Footer — all links | Per homepage Section 16 | Pages 1-7 | Per footer routing |
| Mobile bottom tab bar — Matchs | Homepage | Page 1 | `/fr` |

**Page header (per Section 5)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Logo, H1, confederation descriptor | Non-clickable (page identity) | — | — |
| Edition selector dropdown | Same page, query param change (Phase 6+) | Page 3 | `?edition=YYYY` |
| Status descriptor — fixture references (e.g. "Finale · 🇲🇦 Maroc – 🇦🇷 Argentine") | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Status descriptor — winner reference post-tournament | Team page | Page 4 | `/fr/equipe/maroc/equipe-nationale` |
| Morocco context line — rival flags (Group C) | Team pages | Page 4 | `/fr/equipe/[country]/equipe-nationale` |
| Morocco context line — Moroccan player names (variant) | Player pages | Page 5 | `/fr/joueur/[player-slug]` |
| Morocco context line — Moroccan club names (variant) | Team pages | Page 4 | `/fr/equipe/maroc/[club-slug]` |
| Intro paragraph | Non-clickable prose | — | — |

**Left rail (per Section 6)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Card 1 Featured match — anywhere | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Card 1 Featured match — team flags/names | Team pages | Page 4 | `/fr/equipe/[country]/equipe-nationale` |
| Card 1 Featured match — FIFA ranking badge | Team pages (linked to country) | Page 4 | Same as above |
| Card 2 Matches — fixture row | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Card 2 Matches — favourite star ☆ | Toggle favourite (stub until Phase 10) | — | — |
| Card 2 Matches — Par date/Par tour/Par groupe toggle | In-card filter | — | — |
| Card 2 Matches — round selector chevrons + grid | In-card state | — | — |
| Card 3 Tous les groupes — team row | Team page | Page 4 | `/fr/equipe/[country]/equipe-nationale` |
| Card 3 Tous les groupes — group header | Standings tab via hash + group filter | Page 3 | `#classement` + group selector state |
| Card 3 Tous les groupes — "Voir le classement complet →" | Standings tab via hash | Page 3 | `#classement` |
| Card 4 Newsletter — submit | In-modal confirmation toast | — | — |

**Center column tabs row (per Section 7)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Tab change (Vue d'ensemble / Classement / Élimination) | Same page, hash fragment update | — | `#vue-densemble`, `#classement`, `#elimination` |

**Overview tab (per Section 7)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Block 1 Featured Match Cards — card body | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Block 1 — team crests/flags | Team pages | Page 4 | `/fr/equipe/[country]/equipe-nationale` |
| Block 2 Mini Standings — group selector dropdown | In-card group change | — | — |
| Block 2 — team row | Team page | Page 4 | `/fr/equipe/[country]/equipe-nationale` |
| Block 2 — "Voir tous les groupes →" | Standings tab via hash | Page 3 | `#classement` |
| Block 3 Titres — historical winner row (flag + country) | Team page | Page 4 | `/fr/equipe/[country]/equipe-nationale` |
| Block 3 — "Voir tous les vainqueurs →" | Inline expansion (Phase 4.5) → POTS-archive Phase 6+ | — | (reserved) |
| Block 4 Related Competitions — entry | Competition page (Pages 2 or 3) | Pages 2/3 | `/fr/competition/[country]/[slug]` |
| Block 5 Facts — text | Non-clickable | — | — |
| Block 6 About preview — anchor "ci-dessous ↓" | Same page scroll to About card | — | hash to About card |

**Standings tab (per Section 7)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Group selector chip (Groupe A/B/C/...) | In-tab group change | — | — |
| "Tous" chip | In-tab show-all state | — | — |
| Group table — team row | Team page | Page 4 | `/fr/equipe/[country]/equipe-nationale` |
| Group table — form pill (W/D/L) | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Qualification legend | Non-clickable label | — | — |
| Tiebreaker rules accordion | In-tab expand/collapse | — | — |
| A/H/A sub-tabs (when present for clubs) | In-tab state change | — | — |

**Knockout tab (per Section 7)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Bracket match cell | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Bracket match cell — team flag/name | Team page | Page 4 | `/fr/equipe/[country]/equipe-nationale` |
| Phase selector chip (R32/R16/QF/SF/Finale/3ème) | In-tab phase change (bracket scrolls/zooms) | — | — |
| Zoom controls (−/+/reset) | In-tab zoom state | — | — |
| Mobile horizontal swipe | In-tab navigation between rounds | — | — |
| Embed button (`</>` icon) | Deferred Phase 12+ — non-clickable until shipped | — | (reserved) |

**Videos section (per Section 8)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Video facade thumbnail | Inline iframe swap (in-place YouTube playback) | — | — |
| Video card title text | Same as thumbnail click (in-place playback) | — | — |
| "Voir plus →" | Inline grid expansion (Phase 4.5); Phase 6+ video page when expansion exceeds N | — | (reserved) |
| Empty state YouTube channel link | External (Phase 12+) | — | External |

**Right rail (per Section 9)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Widget 1 Top scorers — player row | Player page | Page 5 | `/fr/joueur/[player-slug]` |
| Widget 1 — "Voir tous →" | Tournament-scoped scorers leaderboard (Phase 6+) | — | `/fr/classements/buteurs/coupe-du-monde-2026` |
| Widget 2 Top assists — player row | Player page | Page 5 | `/fr/joueur/[player-slug]` |
| Widget 2 — "Voir tous →" | Tournament-scoped assists leaderboard (Phase 6+) | — | `/fr/classements/passeurs/coupe-du-monde-2026` |
| Widget 3 MeetTheTeams — team photo/name | Team page | Page 4 | `/fr/equipe/[country]/equipe-nationale` |
| Widget 3 — "Voir toutes les équipes →" | Inline expansion (Phase 4.5); tournament teams page Phase 6+ | — | (reserved) |
| Widget 4 MoreMatchesToday — fixture | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Widget 4 — competition name | Competition page | Pages 2 or 3 | `/fr/competition/[country]/[slug]` |
| Widget 5 Newsletter — submit | In-modal confirmation toast | — | — |

**About card (per Section 11)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Entity name in body copy (team names, player names, competitions, stadiums) | Corresponding entity pages | Pages 2-5 | Per entity URL |
| Internal anchor links | Same page hash scroll | — | — |
| FAQ entity references | Corresponding entity pages | Pages 2-5 | Per entity URL |

### Category 2 — In-page interaction (no navigation)

Summary of types (all marked with em-dashes in Category 1):

- All tab changes (hash fragment update only)
- Edition selector dropdown (renders label-only at v1; query-param state change Phase 6+)
- Status descriptor refresh (state-driven, not user-interactive)
- All sub-tabs and filter pills (in-card state)
- Group selector chips and "Tous" toggle
- Round selector chevrons and grid dropdown
- Bracket phase selector chips
- Bracket zoom controls and reset
- Mobile bracket horizontal swipe
- Video facade click (swaps to inline iframe)
- All accordions (tiebreaker rules, "Voir plus" expansions)
- Favourite star icons (stub until Phase 10 auth)
- Newsletter form submission

### Category 3 — Routes to Phase 6+ feature pages

| Click source | Reserved URL | Phase |
|---|---|---|
| Page header confederation descriptor — confederation segment | `/[locale]/confederation/[confederation-slug]` (e.g. `/fr/confederation/fifa`) | Phase 6+ — render as non-clickable text until shipped |
| Page header — country flag (variant for domestic cups) | `/[locale]/pays/[country-slug]` | Phase 6+ — non-clickable until shipped |
| SeoBreadcrumb — confederation/country segment | Same as above | Phase 6+ — non-clickable until shipped |
| Right rail Widget 1 "Voir tous →" | `/[locale]/classements/buteurs/[tournament-slug]` | Phase 6+ |
| Right rail Widget 2 "Voir tous →" | `/[locale]/classements/passeurs/[tournament-slug]` | Phase 6+ |
| Right rail Widget 3 "Voir toutes les équipes →" | `/[locale]/competition/[confederation]/[tournament-slug]/equipes` OR `/[locale]/classements/equipes/[tournament-slug]` (TBD) | Phase 6+ |
| Overview Block 3 "Voir tous les vainqueurs →" | `/[locale]/classements/vainqueurs/[tournament-slug]` (tournament-specific archive) | Phase 6+ |
| Videos section "Voir plus →" overflow | `/[locale]/competition/[confederation]/[tournament-slug]/videos` OR consolidated `/videos` hub | Phase 6+ |
| Knockout bracket embed button | `/[locale]/competition/[confederation]/[tournament-slug]/embed` (Phase 12+ syndication) | Phase 12+ |
| Empty Videos state YouTube channel link | External link to Atlas Kings YouTube channel | Phase 12+ (channel doesn't exist yet) |
| Edition selector pills (when populated) | Same page + `?edition=YYYY` query param | Phase 6+ |

**Deferred-affordance rule** (consistent with Pages 1 and 2): destinations listed in Category 3 render as non-clickable text or open a "Bientôt disponible" lightweight overlay, never as broken links or 404s, until the destination page ships.

### Category 4 — Explicit divergences from Sofascore routing

| Sofascore pattern | Atlas Kings pattern | Rationale |
|---|---|---|
| Bet365 odds in Featured Match Cards | NO odds — FIFA ranking comparison instead | Loi 09-08 |
| Sofascore Analyst promo card with /upgrade link | NO premium subscription model | Out of v2 scope |
| Power Rankings card linking to Sofascore proprietary algorithm | NO equivalent | Differentiation — replaced by functional Tous les groupes en bref |
| Year pills carousel as interactive radio inputs | EditionSelector renders current-only at v1 | First-edition scope; past editions Phase 6+ |
| TournamentProgressBar as hero visual | NOT present | Atlas Kings differentiation — tab structure + status descriptor convey phase navigation more clearly |
| Media tab with sub-tabs (All/Meet the teams/Highlights/News) | Videos standalone section + News deferred Phase 12+ | Simplify; News needs CMS infra (Phase 12+) |
| YouTube standard embeds (tracking cookies) | youtube-nocookie.com + facade pattern | Loi 09-08 data protection + performance |
| Embed bracket as iframe | Deferred Phase 12+ | No syndication infra in v2 |
| Footer App Store / Google Play links | NOT present | No app until Phase 12+ |
| Sign In CTA | NOT present | No auth until Phase 10 |

---

## Update log

- 2026-05-13 — Initial schematic locked after Phase 4.5+ design session. Inherits chrome from `docs/schematics/homepage.md`, page-shell patterns from `docs/schematics/competition-league.md`. WC 2026 used as canonical instance per primary-source browser analysis (`docs/research/wc26-sofascore-full-analysis.md`). Format Variants section covers pure-knockout (Coupe du Trône), Swiss+knockout (UCL post-2024), and league-phase-only adaptations. Differentiations from Sofascore documented in Section 17. Outbound routing matrix in Section 19 follows established Page 1 + Page 2 conventions including Phase 6+ deferred-affordance rule.
- (Append future updates here with date and change description)
