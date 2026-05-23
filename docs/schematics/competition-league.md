# Atlas Kings Competition (League) Schematic — Page 2

Locked schematic for `/[locale]/competition/[country]/[league-slug]` (league competition page family). Botola Pro is the canonical instance used throughout this document; the same structure repurposes for every league in `VERIFIED_COMPETITIONS` (EPL, LaLiga, Bundesliga, Serie A, Ligue 1, Saudi Pro League, Egyptian Premier, Algeria Ligue 1, Tunisia Ligue 1, etc.). What varies per league is the **data inside the slots**, not the slots themselves.

**Status**: Locked, ready for Phase 4.5 implementation
**Last updated**: 2026-05-13
**Reference**: `docs/research/sofascore-analysis-atlas-kings-phase4-5.md` + `docs/research/sofascore-analysis-page2-premier-league.md`
**Inherits chrome from**: `docs/schematics/homepage.md`
**Tournament data source**: `docs/tournaments/CALENDAR.md`
**Keyword data source**: Ahrefs Morocco SERP analysis (363K SV, 366 matching terms for football queries; Arabic parallel-volume analysis)

---

## Page identity

This is the canonical Atlas Kings competition page for **league** competitions. Distinct from Page 3 (Competition Cup/Tournament) which has knockout stages, edition history, and TournamentProgressBar. Leagues are round-robin season competitions with no knockout structure.

The page uses the **inner-page 3-column shell** (256px left rail + 1fr center + 320px right rail, max-width 1440px, 32px container padding, 24px column gap) adapted from the matchwire reference prototype. Left rail is sticky below the header stack. This is distinct from the homepage layout, which is single-column.

**Single URL per league per locale.** Tabs (Standings / Stats / Details / Media) are in-page state with hash fragments (`#classement`, `#stats`, `#details`, `#media`) for shareability. No tab-as-path-segment routes. This keeps the build simple while enriching the single URL with SEO content (see Section 2 — SEO and Indexability).

---

## Section 1 — URL structure

### Canonical pattern

```
/[locale]/competition/[country]/[league-slug]
```

The `/competition/` root segment is **not translated** across locales — Next.js routing simplicity. The country and league slugs **are** translated per locale because they carry ranking signal.

### Per-locale examples

**Botola Pro:**
```
/fr/competition/maroc/botola-pro
/en/competition/morocco/botola-pro
/ar/competition/المغرب/البطولة-الاحترافية
```

**Premier League:**
```
/fr/competition/angleterre/premier-league
/en/competition/england/premier-league
/ar/competition/إنجلترا/الدوري-الإنجليزي-الممتاز
```

**UEFA Champions League** (international, confederation-rooted):
```
/fr/competition/uefa/ligue-des-champions
/en/competition/uefa/champions-league
/ar/competition/أوروبا/دوري-أبطال-أوروبا
```

**Coupe du Trône** (Morocco knockout — Page 3 territory, URL pattern same):
```
/fr/competition/maroc/coupe-du-trone
/en/competition/morocco/coupe-du-trone
/ar/competition/المغرب/كأس-العرش
```

### International tournament country segment

Cross-border tournaments use **confederation** as the country segment, not generic "international":

| Tournament class | Country segment |
|---|---|
| FIFA World Cup, FIFA Arab Cup, FIFA U-17 WC | `fifa` |
| UEFA Champions League, Europa, Conference, Women's UCL, Euros | `uefa` |
| CAF Champions League, CAF Confed, AFCON, WAFCON, CHAN, AFCON U-23, AFCON Qualifiers, CAF Super Cup | `caf` |
| AFC Asian Cup | `afc` |
| Olympics Football | `ioc` |

More semantic than "international" and matches how fans search ("ligue des champions UEFA", "coupe du monde FIFA").

### Slug source — CALENDAR.md schema additions

Each competition entry in `CALENDAR.md` gains three slug fields:

```
slug_fr: "botola-pro"
slug_en: "botola-pro"
slug_ar: "البطولة-الاحترافية"
```

Country slugs by locale live in a separate canonical lookup at `src/lib/constants/country-slugs.ts`:

```typescript
export const COUNTRY_SLUGS: Record<CountryCode, Record<Locale, string>> = {
  MA: { fr: 'maroc', en: 'morocco', ar: 'المغرب' },
  GB: { fr: 'angleterre', en: 'england', ar: 'إنجلترا' },
  // ... all verified countries
  // pseudo-countries for confederations:
  'fifa': { fr: 'fifa', en: 'fifa', ar: 'فيفا' },
  'uefa': { fr: 'uefa', en: 'uefa', ar: 'أوروبا' },
  'caf': { fr: 'caf', en: 'caf', ar: 'إفريقيا' },
};
```

Phase 4.5 implementation creates this lookup table. Phase 4.5+ extends `CALENDAR.md` schema with per-locale slugs.

### Tab state — hash fragments only

```
/fr/competition/maroc/botola-pro              → defaults to Standings
/fr/competition/maroc/botola-pro#classement   → Standings (explicit, same)
/fr/competition/maroc/botola-pro#stats        → Stats tab
/fr/competition/maroc/botola-pro#details      → Details tab
/fr/competition/maroc/botola-pro#media        → Media tab
```

Hash fragments are user-shareable but **not separately indexable**. The page is indexed at the canonical URL; tab content gets SEO surface via H2 headings inside the page DOM (see Section 2).

### hreflang annotations

Each locale variant references the other two:

```html
<link rel="alternate" hreflang="fr" href="https://atlaskings.com/fr/competition/maroc/botola-pro" />
<link rel="alternate" hreflang="en" href="https://atlaskings.com/en/competition/morocco/botola-pro" />
<link rel="alternate" hreflang="ar" href="https://atlaskings.com/ar/competition/المغرب/البطولة-الاحترافية" />
<link rel="alternate" hreflang="x-default" href="https://atlaskings.com/fr/competition/maroc/botola-pro" />
```

`x-default` points to French (primary Morocco audience language).

---

## Section 2 — SEO and indexability

The single URL must rank for three keyword clusters per locale: the entity root ("botola pro"), the modifier extensions ("botola pro classement", "botola pro matchs", "botola pro statistiques"), and long-tail ("derby de casablanca", "wydad classement"). Sofascore demonstrates this is achievable from a single URL when the page is rich enough. We enrich more.

### Per-locale title and meta description

Built from a template using the highest-volume modifiers per locale:

```
fr: <title>Botola Pro 2025/26 — Classement, matchs et statistiques | Atlas Kings</title>
fr: <meta name="description" content="Suivez la Botola Pro 2025-26 en direct : classement complet, calendrier des matchs, meilleurs buteurs, statistiques des 16 clubs marocains dont Wydad AC, Raja CA et AS FAR." />

en: <title>Botola Pro 2025/26 — Standings, matches and stats | Atlas Kings</title>
en: <meta name="description" content="Follow the Botola Pro 2025-26 live: full standings, fixture schedule, top scorers, statistics for Morocco's 16 top-flight clubs including Wydad AC, Raja CA, and AS FAR." />

ar: <title>البطولة الاحترافية 2025/26 — الترتيب، المباريات والإحصائيات | أطلس كينغز</title>
ar: <meta name="description" content="تابعوا البطولة الاحترافية 2025-26 مباشرة: الترتيب الكامل، جدول المباريات، أفضل الهدافين، إحصائيات 16 ناديًا مغربيًا من بينها الوداد الرياضي والرجاء الرياضي والجيش الملكي." />
```

Title pattern: `{league_name} {season} — {modifier_1}, {modifier_2}, {modifier_3} | Atlas Kings`.

The three modifiers are locale-specific and chosen to match keyword volume:
- French: `Classement / matchs / statistiques`
- English: `Standings / matches / stats`
- Arabic: `الترتيب / المباريات / الإحصائيات`

### H1 — single per page

The competition name in the page header. Rendered in **Fraunces** display face. Includes the season:

```
fr: <h1>Botola Pro 2025/26</h1>
en: <h1>Botola Pro 2025/26</h1>
ar: <h1>البطولة الاحترافية 2025/26</h1>
```

### Intro paragraph — keyword-loaded body content above the fold

Below the page header strip, before the 3-column zone begins, a 25-40 word paragraph that names the entity + the highest-volume modifiers + marquee teams + season.

**Templated by default; hand-written overrides per priority league.**

Template:
```
{league_name} {season_descriptor} {country_descriptor}, {team_count_phrase} 
{marquee_teams_phrase}. {follow_verb} {modifier_list_phrase} {season}.
```

**Hand-written overrides** for the 8 priority leagues — Botola Pro, EPL, LaLiga, Ligue 1, Bundesliga, Serie A, CAF Champions League, UEFA Champions League. Other leagues use the template until editorial time allows hand-writing.

Botola Pro (hand-written):

```
fr: La Botola Pro est le championnat de football professionnel du Maroc, 
réunissant 16 clubs dont Wydad AC, Raja CA et AS FAR. Suivez en direct le 
classement, les matchs et les statistiques de la saison 2025-26.

en: The Botola Pro is Morocco's top professional football league, featuring 
16 clubs including Wydad AC, Raja CA, and AS FAR. Follow live standings, 
matches, and statistics for the 2025-26 season.

ar: البطولة الاحترافية هي بطولة كرة القدم للمحترفين في المغرب، تضم 16 ناديًا 
من بينها الوداد الرياضي والرجاء الرياضي والجيش الملكي. تابعوا مباشرة ترتيب 
ومباريات وإحصائيات موسم 2025-26.
```

CALENDAR.md schema additions:

```
intro_fr: null | string   // when null, falls back to template
intro_en: null | string
intro_ar: null | string
```

### H2 inside each active tab

Each tab's content area starts with an H2 visible heading that includes the entity + the tab's modifier:

| Tab | French | English | Arabic |
|---|---|---|---|
| Standings | Classement de la saison 2025-26 | 2025-26 season standings | ترتيب موسم 2025-26 |
| Stats | Statistiques de la Botola Pro | Botola Pro statistics | إحصائيات البطولة الاحترافية |
| Details | Détails de la compétition | Competition details | تفاصيل المسابقة |
| Media | Vidéos et actualités | Videos and news | فيديوهات وأخبار |

Visible as small heading text (~16-18px, semibold, IBM Plex Sans). Sits above the table / stats panel / details panel / media gallery.

### About card at page bottom — full keyword surface

After the 3-column zone, before the footer, a long-form About card containing H2/H3 hierarchy + 6-8 FAQ entries. This is where long-tail keywords live.

Structure documented in Section 11.

### JSON-LD structured data

In `<head>`. Two blocks: `SportsOrganization` for the league entity + an array of `SportsEvent` for upcoming matches displayed on the page.

```json
{
  "@context": "https://schema.org",
  "@type": "SportsOrganization",
  "name": "Botola Pro",
  "alternateName": ["البطولة الاحترافية", "Botola Pro Inwi"],
  "sport": "https://schema.org/Soccer",
  "memberOf": {
    "@type": "Country",
    "name": "Morocco"
  },
  "url": "https://atlaskings.com/fr/competition/maroc/botola-pro",
  "logo": "https://atlaskings.com/competitions/botola-pro.svg",
  "currentSeason": "2025/26"
}
```

Per-fixture `SportsEvent` blocks generated server-side for matches shown on the page. Adds rich snippet eligibility for "next Botola match", "Wydad vs Raja date", and similar queries.

### Per-locale image alt text

All crests, player photos, stadium photos carry locale-specific alt text:

```
Crest:        alt="Logo du Wydad AC" (fr)
              alt="Wydad AC crest" (en)
              alt="شعار الوداد الرياضي" (ar)

Player photo: alt="Photo de Achraf Hakimi" (fr)
              alt="Achraf Hakimi photo" (en)
              alt="صورة أشرف حكيمي" (ar)
```

Seed data needs `name_fr / name_en / name_ar` fields for teams and players. Phase 5 ingestion concern.

### Internal anchor links from About card

The About card's editorial paragraphs reference the page's tab sections via hash anchors:

```
"Voir le classement complet de la saison" → href="#classement"
"Consulter les matchs de la journée" → href="#standings" (with scroll target = left-rail Matches card)
```

Doesn't create indexable URLs but reinforces semantic structure for Google's content-area parsing.

---

## Section 3 — Layout at desktop (max-width 1440px)

Adapted from matchwire reference prototype (`docs/schematics/reference-matchwire-epl.md`).

### Dimensions

| Property | Value |
|---|---|
| Container max-width | 1440px |
| Container padding | 32px each side |
| Column grid | `256px / 1fr / 320px` |
| Column gap | 24px |
| Effective content width | 1440 − 64 = 1376px |
| Center col width | 1376 − 256 − 320 − 48 = ~752px |
| Breakpoint ≤1280px | Left rail → 224px, right rail → 300px |
| Breakpoint ≤1180px | Right rail hidden entirely (2-col layout) |
| Below 768px | Single column mobile (Section 12) |

### Sticky stack

| Layer | Position | Height | Z-index |
|---|---|---|---|
| Adaptive top strip | sticky, top: 0 | ~40px | 51 |
| Topbar | sticky, top: 40px | ~64px | 50 |
| Tab strip | sticky, top: 104px | 48px | 49 |
| Left rail | sticky, top: 156px | max-height: calc(100vh - 172px) | — |

Total sticky header stack: **152px** (40 + 64 + 48).

### Card system (from matchwire)

All content blocks (left rail cards, center column panels, right rail widgets) use a unified card style:

| Property | Value |
|---|---|
| Border-radius | 12px |
| Padding | 16px (or `no-pad` variant for flush tables/lists) |
| Background | `--c-surface-1` |
| Border | 1px solid `--c-border` |
| Hover (interactive cards) | bg → `--c-surface-2` |

### Full-page wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADAPTIVE TOP STRIP (sticky, top:0, h:~40, z:51)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ TOPBAR (sticky, top:40, h:~64, z:50)                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ SEO breadcrumb (~22px, scrolls away)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ LEAGUE HERO (not sticky, scrolls away)                                      │
│  ┌──────┐                                                                   │
│  │ 96px │  Eyebrow: flag + country + tier + season/MW                       │
│  │CREST │  H1: Botola Pro 2025/26                                           │
│  └──────┘  Meta: season selector + live chip                                │
│            Season progress bar + matchday/leader strip                       │
│  ═══════════════════════ accent gradient stripe ═════════════════            │
│  Intro paragraph (keyword-loaded, 25-40 words)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ TAB STRIP (sticky, top:104, h:48, z:49)                                     │
│   Classement    Stats    Détails    Média                                    │
│   ══════════                                  (accent underline, animated)   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐  ┌──────────────────────────────────┐  ┌───────────────┐     │
│  │ LEFT     │  │ CENTER COLUMN (1fr, ~752px)       │  │ RIGHT RAIL    │     │
│  │ RAIL     │  │                                    │  │ (320px)       │     │
│  │ (256px)  │  │  H2 inside active tab              │  │               │     │
│  │ sticky   │  │                                    │  │ 1. Top        │     │
│  │ top:156  │  │  Standings tab:                    │  │    scorers    │     │
│  │          │  │   • All/Home/Away sub-tabs         │  │ 2. Top        │     │
│  │ 1. Feat. │  │   • 10-col table (sticky header)  │  │    assists    │     │
│  │    match │  │   • Qualification legend           │  │ 3. Editorial  │     │
│  │ 2. Match │  │   • Tiebreaker panel               │  │    Picks      │     │
│  │    list  │  │   • Standings Tracker chart        │  │ 4. More       │     │
│  │ 3. POTS  │  │                                    │  │    Matches    │     │
│  │ 4. TOTW  │  │  [other tabs render here]          │  │ 5. Newsletter │     │
│  │          │  │                                    │  │               │     │
│  └──────────┘  └──────────────────────────────────┘  └───────────────┘     │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ ABOUT CARD (full width, ~800-1000px tall)                                   │
│  H2 sections + 6-8 FAQ entries + Atlas Kings editorial slot                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ FOOTER (dark)                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Section 4 — Inherited chrome (from homepage.md)

These sections carry over verbatim from `docs/schematics/homepage.md`. No re-spec needed; see homepage.md for the source-of-truth definitions.

| Component | Behaviour on Page 2 |
|---|---|
| AdaptiveTopStrip | Identical. 4 modes (countdown / live / upcoming ticker / fallback). Same `getCountdownStripMode(today)` logic. |
| Topbar | Identical. Featured slots auto-promoted via `getFeaturedCompetitions()`. Today: WC 2026 🔥 + WAFCON 2026. Botola Pro nav item highlighted as active when on a Botola page. |
| Topbar — active state | The current league's parent nav item gains a gold underline. For Botola Pro page, the Botola Pro nav item is active. For EPL page (when accessed via mega-menu), no top-level nav item is active (EPL lives inside Compétitions ▾). |
| SeoBreadcrumb | Content updates per page: `Football › Maroc › Botola Pro` (FR), `Football › Morocco › Botola Pro` (EN), `كرة القدم › المغرب › البطولة الاحترافية` (AR). Renders below topbar. |
| Footer | Identical. Loi 09-08 notice. No 18+. No app store links. |
| Mobile bottom tab bar | Identical 4 tabs (Matchs / Recherche / Favoris / Paramètres). "Matchs" remains active on competition pages — we're still in the football product. |
| Mobile hamburger drawer | Identical structure. |

---

## Section 5 — League Hero (matchwire-derived)

Full-width hero section below the breadcrumb, above the tab strip. Not sticky — scrolls away. Visual structure adapted from matchwire reference (`docs/schematics/reference-matchwire-epl.md`); content is Atlas Kings.

### Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌──────────┐                                                            │
│  │  96×96   │  🇲🇦 Maroc · Tier 2 · Saison 2025/26 · J20        eyebrow │
│  │  CREST   │  Botola Pro 2025/26                                   H1  │
│  │  accent- │  [Saison 2025/26 ▾]   ● 2 en direct                 meta │
│  │  tinted  │                                                           │
│  │  bg      │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          │
│  └──────────┘  15 août 2025  ●━━━━━━━━━━━━━━━━━━━○  25 mai 2026        │
│                              J20/30  ·  Leader: Maghreb Fès             │
│                                                                          │
│  ═══════════════════════ accent gradient stripe (3px) ═══════════════    │
│                                                                          │
│  La Botola Pro est le championnat de football professionnel du Maroc,   │
│  réunissant 16 clubs dont Wydad AC, Raja CA et AS FAR. Suivez en        │
│  direct le classement, les matchs et les statistiques de la saison.     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Crest wrap (from matchwire)

- 96×96px container, 16px border-radius
- Background: accent color at 12% opacity (`--c-accent-soft`)
- Crest image centered inside (64×64 actual crest, padded)
- Subtle gradient overlay for depth

### Eyebrow row

- Country flag emoji + country name + `·` + tier descriptor + `·` + season/matchweek
- Inter 500, 12px, uppercase, letter-spacing 0.5px, `--c-text-muted`

### H1

- Competition name + season: `Botola Pro 2025/26`
- Inter 800, 38px, line-height 1.15
- Single H1 per page (SEO)

### Meta row

- Season selector dropdown: `[Saison 2025/26 ▾]` — opens list of available seasons
  - Selecting routes to `?season=2024-25` (query param, keeps canonical URL stable)
  - Default (no query param) = current season
- Live chip: red LiveDot + "2 en direct" (count of live matches in this competition)
  - Hidden when no live matches

### Season progress bar + matchday strip

- Below meta row, full width within hero
- Horizontal progress bar: start date → end date, accent-colored fill showing season progress
- Below bar: `J20/30 · Leader: Maghreb Fès` (or "Co-leaders: X & Y" if tied)
- Refreshes at round-end only (per Q13 locked decision)

### Accent gradient stripe

- 3px horizontal gradient at bottom edge: `--c-accent → transparent`
- Visual separator between hero and tab strip below

### Intro paragraph

Below the stripe, still inside hero container:

```
La Botola Pro est le championnat de football professionnel du Maroc,
réunissant 16 clubs dont Wydad AC, Raja CA et AS FAR. Suivez en direct le
classement, les matchs et les statistiques de la saison 2025-26.
```

Inter 400, 14px, line-height 1.5, max-width ~720px (constrained for readability), left-aligned (RTL flip for Arabic). Keyword-loaded 25-40 words. Hand-written for 8 priority leagues; templated for rest.

### No Follow/Share, no FAVOURITE star

Matchwire has Follow + Share buttons. Atlas Kings omits these — favourites are Phase 10 (requires auth), share is Phase 6+. Design accommodates adding them later in the meta row without disrupting layout.

---

## Section 6 — Left rail (256px, sticky)

256px wide (224px at ≤1280px). Sticky at `top: 156px` (below the full header stack), `max-height: calc(100vh - 172px)`, `overflow-y: auto` with thin scrollbar. Contains a 4-card stack with 16px vertical gap between cards. All cards use the matchwire card system (12px radius, 16px padding, surface-1 bg, 1px border).

### Card 1 — Featured match (~180px)

```
┌─ À la une ──────────────────────────────────────┐
│                                                 │
│  [crest L]            18:00                     │
│                     SAM 17 MAI                  │
│                                                 │
│  Wydad AC                            Raja CA    │
│                          [crest R]              │
│                                                 │
│  Botola Pro · Journée 21 · Stade Mohammed V    │
│                                                 │
│  Forme récente:                                 │
│  W W L D W   vs   L W D W W                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

Selection algorithm (per Q4 locked):

1. Live Botola match → that
2. Next match involving highest-Morocco-signal team (for Botola: all teams have equal signal; for foreign leagues: Moroccan player minutes-played ranking)
3. Next match by stakes (rivalry / title race / relegation battle / cup-tie)
4. Next match by kickoff proximity

When live: large score in place of kickoff time, "67' R" minute indicator, red wash background animation (10% opacity sweep, left-to-right).

When upcoming: kickoff date + time, "Forme récente" line showing both teams' last 5 results as WWLDW vs LWDWW. **Replaces Sofascore's bet365 odds row.** Loi 09-08 compliance.

When finished: FT status + final score + winner-bold/loser-45%-opacity treatment per locked fixture row pattern.

Tap action: routes to match detail page (Page 6).

### Card 2 — Matches with round selector (~700px)

The longest card in the rail. Contains the matches list scoped to the selected round.

```
┌─ Matchs ────────────────────────────────────────┐
│                                                 │
│ [Par date ●]  [Par journée]                     │
│                                                 │
│ ‹  Journée 20  ›                                │
│                                                 │
│ ─── Journée 20 · 17-22 mai 2026 ─────────────── │
│                                                 │
│ 17/05  FT   Wydad AC          2 – 1   FAR Rabat │ ☆
│ 17/05  FT   Raja CA           0 – 0   IRT       │ ☆
│ 18/05  FT   Maghreb Fès       3 – 1   OCS Settat│ ☆
│ 18/05  67'R OCS Khouribga     1 – 1   HUSA      │ ☆ ← live
│ 18/05  18:00 RC OUJDA         –       MAS Fès   │ ☆
│ ...                                             │
│                                                 │
│ Voir tous les matchs →                          │
└─────────────────────────────────────────────────┘
```

### Card 2 — sub-tabs

**Top toggle**: `Par date | Par journée` (default: Par journée).
- "Par journée" groups by round (1 round shown at a time, navigated via the round selector below)
- "Par date" groups by calendar date across the whole season (single scrollable list)

### Card 2 — round selector (Q5)

`‹ Journée 20 ›` chevron-and-label hybrid:
- Left chevron: previous round
- Center label: clickable, opens a grid dropdown of all rounds (1-30 for Botola Pro, 1-38 for EPL, etc.)
- Right chevron: next round
- Disabled chevrons at season ends (no round 0, no round 31)

Default round on page load:
- If at least one match today → current round
- Else most recent completed round

### Card 2 — fixture row

Reuses the locked `FixtureRow` component from homepage.md Section 5. Three states (upcoming/live/finished) with identical visual treatment.

Rendered without competition group header (this card is already scoped to one competition by virtue of the page context).

### Card 2 — empty state

If a round has no matches (rare — only for unscheduled rounds or postponed weekends):
```
Aucun match programmé pour cette journée.
```

### Card 3 — Player of the Season race (~220px)

```
┌─ 🏆 Joueur de la saison ⓘ ──────────────────────┐
│                                                 │
│ 1  [photo]  Diasty             Wydad AC   8.42  │
│ 2  [photo]  Kasami             Raja CA    8.18  │
│ 3  [photo]  M'Hand             FAR Rabat  7.95  │
│                                                 │
│ Voir le classement complet →                    │
└─────────────────────────────────────────────────┘
```

Top 3 Botola Pro players ranked by Atlas Kings rating (or API-Football average rating where coverage exists). Per row: photo 32×32, name, club name, rating badge (color-coded: green 8.0+, yellow 7.0-7.9, gray <7.0).

Tap row → routes to player page (Page 5).

Coverage gating (Rule 12): for leagues with `statistics_fixtures=false` (Algeria, Tunisia), card renders empty state:

```
Données joueur indisponibles pour cette compétition.
```

Card structure stays; data slot is what's gated.

### Card 4 — Team of the Week (~470px)

```
┌─ ⚽ Équipe de la journée ────────────────────────┐
│ Journée 20 ▾                  Publié 18 mai     │
│                                                 │
│                  [Pitch formation graphic]       │
│                                                 │
│              [photo] Bono                       │
│                 9.3                             │
│                                                 │
│   [photo] Mendy  [photo] Saiss  [photo] Aguerd  │
│      8.4         8.7           8.5              │
│                                                 │
│   [photo] Hakimi   ...     ...   [photo] Mazraoui│
│      9.1                          8.2           │
│                                                 │
│   [photo] Ziyech   [photo] Ounahi  [photo] Sabiri│
│      8.6           8.4           8.0            │
│                                                 │
│         [photo] En-Nesyri   [photo] Diaz        │
│            8.8                 9.4              │
│                                                 │
└─────────────────────────────────────────────────┘
```

Pitch formation graphic (4-3-3 default, formation adapts to actual most-common-in-round). 11 player photos overlaid on pitch positions with rating badges.

Round selector dropdown in header (changes which TOTW is shown).

Coverage gating same as Card 3 — empty state if no rating coverage.

### Card 4 — note on data source

Atlas Kings TOTW selection algorithm (Phase 5+ work):
- Pool: all players in API-Football `/fixtures/players` for fixtures in selected round
- Filter to coverage-available leagues
- Sort by rating per position
- Pick top GK, top 4 DEF, top 3 MID, top 3 FWD (or formation variant)
- Resolve ties by minutes played

Algorithm spec deferred to Phase 5; schematic locks the visual treatment only.

---

## Section 7 — Center column (1fr, ~752px)

Center column fills remaining space between the two rails. Tab content renders inside matchwire-style cards (12px radius, surface-1 bg, 1px border). Tabs row is part of the sticky header stack (see Section 3).

### Tabs row (sticky, from matchwire)

The tab strip is **sticky at top: 104px** (below adaptive strip + topbar), 48px height, z-index 49. This differs from the original schematic where tabs were not sticky — matchwire's sticky tab strip provides better UX for long content.

```
┌──────────────────────────────────────────────────┐
│ Classement    Stats    Détails    Média           │
│ ══════════                                        │
└──────────────────────────────────────────────────┘
```

- Active tab: accent-colored text + accent underline (2px, animated via offsetLeft/offsetWidth transition)
- Inactive: `--c-text-muted`, regular weight
- Inter 600, 13px, uppercase, letter-spacing 0.3px
- Background: `--c-surface-0`, border-bottom
- Hash fragment updates on tab change (`#classement` → `#stats` etc)

Per Q2 locked: **Primary tabs not sticky. Secondary column headers inside Standings table ARE sticky.**

### Tab 1 — Classement (Standings)

#### H2 above table

```
Classement de la saison 2025-26
```

Visible heading, ~18px, IBM Plex Sans semibold. Sits above the All/Home/Away sub-tabs.

#### All / Home / Away sub-tabs (~36px)

```
[Tous ●]  [Domicile]  [Extérieur]
```

Pill chips, gold background on active. Switches the table data source — Sofascore standard.

#### 10-column standings table

```
┌─────────────────────────────────────────────────────────────────┐
│ #  Équipe              P   W   D   L   DIFF  GLS    Forme   Pts │ ← sticky
├─────────────────────────────────────────────────────────────────┤
│🟢 1 [c] Maghreb Fès    20  13  2   5   +15   41:26  WWDWW   41  │
│🟢 2 [c] AS FAR         20  12  4   4   +18   38:20  WWWDL   40  │
│🟡 3 [c] Raja CA        20  12  3   5   +14   40:26  WLWWW   39  │
│🟡 4 [c] Wydad AC       20  11  4   5   +10   33:23  WDWWL   37  │
│   5 [c] Renaissance B. 20  11  4   5   +8    32:24  LWWWD   37  │
│   6 [c] OCS Settat     20  10  5   5   +6    30:24  DWWLW   35  │
│   ... (rows 7-14)                                                │
│🔴 15 [c] Chabab Rif H.  20   4  4  12   -16   18:34  LLDLL   16  │
│🔴 16 [c] FUS Rabat      20   3  4  13   -22   15:37  LLLLD   13  │
└─────────────────────────────────────────────────────────────────┘
```

Column specs:

| Column | Width | Content | Alignment |
|---|---|---|---|
| Zone marker | 3px | Green/yellow/red bar (CL/CC/relegation), or transparent | left edge |
| `#` | 28px | Position number | center |
| `Équipe` | flex | Crest 20×20 + team name | left |
| `P` | 32px | Played | center, tabular |
| `W` | 32px | Wins | center, tabular |
| `D` | 32px | Draws | center, tabular |
| `L` | 32px | Losses | center, tabular |
| `DIFF` | 44px | Goal difference, signed (+/-/0), bold sign | center, tabular |
| `GLS` | 64px | Goals for:against (e.g. `41:26`) | center, tabular |
| `Forme` | 70px | Last 5 results as 5 W/D/L pills, 10×10 each | center |
| `Pts` | 36px | Points, bold | center, tabular |

All numeric columns use `font-variant-numeric: tabular-nums` for column alignment.

#### Form pills

Five colored squares, 10×10px, 2px gap:
- W: green (`#16a34a`)
- D: gray (`#71717a`)  
- L: red (`#dc2626`)

Ordered left-to-right oldest-to-newest. Hovering a pill shows tooltip: "vs Raja CA, 3-1 W, 10 mai".

#### Zone marker bar

3px wide vertical bar on left edge of the row:
- Top 2 (CAF CL): green `#16a34a`
- Places 3-4 (CAF Confed): yellow `#eab308`
- Bottom 2 (relegation to Botola Pro 2): red `#dc2626`
- Middle 5-14: no bar (transparent)

Zone allocation is **per-league configurable** in CALENDAR.md:

```
qualification_zones: [
  { positions: [1, 2], type: 'caf_champions_league', color: 'green' },
  { positions: [3, 4], type: 'caf_confederation', color: 'yellow' },
  { positions: [15, 16], type: 'relegation', color: 'red' }
]
```

EPL would have:
```
qualification_zones: [
  { positions: [1, 4], type: 'champions_league', color: 'green' },
  { positions: [5], type: 'europa_league', color: 'blue' },
  { positions: [6], type: 'conference_league', color: 'lightblue' },
  { positions: [18, 20], type: 'relegation', color: 'red' }
]
```

#### Qualification legend (below table)

```
🟢 Ligue des Champions CAF    🟡 Coupe de la Confédération CAF    🔴 Relégation
```

Small text, ~12px, muted. One row, locale-translated. Pulls from `qualification_zones` config.

#### Tiebreaker rules panel

```
┌─ Règles de départage ───────────────────────────┐
│ 1. Différence de buts                            │
│ 2. Buts marqués                                  │
│ 3. Confrontations directes                       │
└─────────────────────────────────────────────────┘
```

Small grey card below the legend. Locale-translated. Per-league configurable (different leagues use different tiebreakers — EPL is GD then GF then H2H; LaLiga is H2H then GD).

#### Standings Tracker chart (Q10)

Below the tiebreaker panel:

```
┌─ Tracker du classement ⓘ ────────────────────────┐
│                                                  │
│  16 ┤    ╱╲                                      │
│  ...│   ╱  ╲       Maghreb Fès                   │
│   2 ┤━━╱    ╲━━━━━━━━━━━━━━━━━━━━━━━━━━          │
│   1 ┤      ╲╱       AS FAR                       │
│     └─────────────────────────────────────       │
│      J1   J5   J10   J15   J20                   │
│                                                  │
│  Comparer: [Wydad AC ▾] vs [Raja CA ▾]           │
│  ‹  Journée 20 (10-17 mai)  ›                    │
└──────────────────────────────────────────────────┘
```

Line chart, x-axis = matchdays played, y-axis = standings position (inverted, 1 at top).

Default plot: top 3 + bottom 3 teams emphasized; other 10 teams as faint background lines.
Default comparison pickers (Botola): Wydad AC vs Raja CA (the Casa derby pair — strongest narrative pair for Botola).

For other leagues, default comparison:
- EPL: top-2 currently
- LaLiga: top-2 currently
- Saudi Pro: top-2 currently
- Fallback: leader vs second

Round navigator at bottom: scrubs the "current position" indicator across the season.

**Data dependency: per-round historical standings snapshots.** Ingestion is Phase 5+. Until then, the chart renders empty state:

```
Données de saison complète disponibles à partir de la fin de la saison.
```

(Or for ongoing season: "Tracker disponible après la J5". We need 5+ rounds played for the chart to be useful.)

### Tab 2 — Stats

H2: `Statistiques de la Botola Pro`

Content blocks (Phase 5+ data wiring):
- Buts par match (average goals per game across the season)
- Distribution des buts (heatmap or histogram of goal-scoring minutes)
- Cartons (yellow/red card frequency by team)
- Présences (average attendance per team)
- Possession moyenne (if coverage)
- Tirs cadrés (if coverage)

Each block has its own sub-heading. Sofascore puts these in dropdown sections — we can mirror or expand. Schematic locks the section list; detailed visuals are Phase 5+ work.

Coverage gating: blocks that depend on `statistics_fixtures` hide for Algeria/Tunisia.

### Tab 3 — Details

H2: `Détails de la compétition`

Static informational content per league:
- Pays
- Confédération
- Premier vainqueur (historical)
- Tenant du titre (current champion)
- Nombre d'éditions
- Format actuel (16 teams, double round-robin, 30 matchdays)
- Promoted teams this season
- Relegated teams last season
- Top all-time scorer
- Top all-time appearances
- Trophée (image)

Mostly editorial; doesn't require fixture-by-fixture data.

### Tab 4 — Media

H2: `Vidéos et actualités`

Stub for Phase 12+. For Phase 4.5, renders an empty state:

```
Section vidéo bientôt disponible.
```

Tab is present in the row but its content is the empty state. Keeps the tab grid stable as we scale into Phase 12.

---

## Section 8 — Right rail (320px)

320px wide (300px at ≤1280px, hidden entirely at ≤1180px). Scrolls with page (not sticky). Contains a 5-widget stack with 16px vertical gap. All widgets use the matchwire card system (12px radius, 16px padding, surface-1 bg, 1px border).

### Widget 1 — Top scorers (~240px)

```
┌─ Meilleurs buteurs ─────────┐
│ Botola Pro · Maroc          │
├─────────────────────────────┤
│ #  Joueur          Buts     │
│ 1  Diasty             14    │
│ 2  Kasami             12    │
│ 3  M'Hand              9    │
│ 4  El Idrissi          9    │
│ 5  Naciri              8    │
│ 6  Belghazi            7    │
│ Voir tous →                 │
└─────────────────────────────┘
```

Top 6 by goals. Per-row: position, player name, goal count. "Voir tous →" routes to a future scorers leaderboard page (Phase 6+).

Reuses `RightRailTopScorers` component from homepage right rail (homepage uses for UCL; here scoped to current league).

### Widget 2 — Top assists (~240px)

```
┌─ Meilleurs passeurs ────────┐
│ Botola Pro · Maroc          │
├─────────────────────────────┤
│ #  Joueur          Passes   │
│ 1  Bensaid             8    │
│ 2  Tahir               7    │
│ 3  El Khaldi           6    │
│ 4  Diasty              5    │
│ 5  Ounahi              5    │
│ 6  Saidi               4    │
│ Voir tous →                 │
└─────────────────────────────┘
```

Same shape as Widget 1, different metric. Coverage gating (Rule 12): hides or shows empty state for leagues without assists tracking.

For Algeria Ligue 1 / Tunisia Ligue 1 (statistics_fixtures=false), this widget shows:

```
┌─ Meilleurs passeurs ────────┐
│ Données indisponibles       │
│ pour cette compétition.     │
└─────────────────────────────┘
```

### Widget 3 — MoroccoEditorialPicks (~280px)

```
┌─ Pourquoi suivre la Botola Pro ───┐
│                                   │
│ ### Atlas Kings sur la Botola Pro │
│                                   │
│ Le championnat marocain abrite    │
│ les rivalités les plus passionnées│
│ d'Afrique du Nord. Le derby de    │
│ Casablanca entre Wydad et Raja    │
│ remplit le Stade Mohammed V à     │
│ chaque édition. Cette saison, AS  │
│ FAR vise un retour au titre après │
│ trois ans de domination Wydad.    │
│                                   │
│ Voir le derby Wydad – Raja →      │
└───────────────────────────────────┘
```

Hand-written editorial copy per league. Keyword-bearing — names the entity, marquee teams, marquee fixtures, narrative beats.

CALENDAR.md schema additions:

```
editorial_pick_fr: string (200-400 chars)
editorial_pick_en: string
editorial_pick_ar: string
```

Refreshed editorially per season or major narrative beat (relegation battle phase, title decider phase, derby weekends).

For leagues without Morocco signal, content stays neutral but engaging — names the league's marquee teams, biggest derby, narrative. Same structure, different copy.

### Widget 4 — MoreMatchesToday (~280px)

```
┌─ Plus de matchs aujourd'hui ──────┐
│                                   │
│ Premier League                    │
│  17:30  Man City – Arsenal        │
│  20:00  Liverpool – Chelsea       │
│                                   │
│ LaLiga                            │
│  21:00  Real Madrid – Barcelona   │
│                                   │
│ UCL                               │
│  21:00  PSG – Bayern (SF)         │
│                                   │
│ Voir tous les matchs →            │
└───────────────────────────────────┘
```

Cross-competition fixtures today, scoped to top leagues + Morocco-relevant matches. Acts as a back-link to the homepage fixture browser without literally being one.

Selection: same Morocco-priority signal as homepage featured-fixture ticker, scoped to today only, top 4-6 matches.

### Widget 5 — Newsletter (~140px)

```
┌─ Recevez l'actu marocaine ────────┐
│                                   │
│ [email@exemple.com  ] [S'abonner →]│
│                                   │
└───────────────────────────────────┘
```

Mirrors homepage Card 8. Implementation deferred to Phase 5+ (newsletter infrastructure decision).

---

## Section 9 — Right rail behaviour (matchwire breakpoints)

- ≥1440px: rail at full 320px width
- 1281-1439px: rail at 300px width, left rail at 224px
- ≤1280px: right rail hidden entirely — 2-column layout (left rail 224px + center)
- ≤1180px: right rail hidden, left rail at 224px
- Below 768px: single column mobile (see Section 12)
- Scrolls with page (not sticky — only the left rail is sticky)
- Replaces Sofascore's ad slot — Atlas Kings uses for editorial/data widgets per Loi 09-08 (no betting/ads)

---

## Section 10 — About card

Long-form keyword-bearing card at page bottom, before the footer. Full container width, matchwire card system (12px radius, 16px padding, surface-1 bg, 1px border). Max prose width ~720px inside the card for readability.

### Structure

```
┌─ À propos ────────────────────────────────────────────┐
│                                                       │
│ ## À propos de la Botola Pro                          │
│                                                       │
│ La Botola Pro Inwi, officiellement nommée Botola      │
│ Pro Inwi 1 depuis le partenariat avec Inwi en 2020,   │
│ est la première division du championnat marocain de   │
│ football. Fondée en 1956 après l'indépendance,        │
│ elle réunit 16 clubs qui s'affrontent en matchs       │
│ aller-retour sur 30 journées entre août et mai.       │
│                                                       │
│ ## Format de la compétition                           │
│                                                       │
│ 16 clubs disputent 30 journées. Les deux premiers     │
│ se qualifient pour la CAF Champions League,           │
│ les troisième et quatrième pour la Coupe de la        │
│ Confédération CAF. Les deux derniers sont relégués    │
│ en Botola Pro 2.                                      │
│                                                       │
│ ## Meilleurs buteurs de la saison 2024-25             │
│                                                       │
│ Ayoub El Kaabi (RSB) a terminé meilleur buteur avec   │
│ 18 buts. Hamza Hannouri (Wydad) suivait avec 14 buts. │
│                                                       │
│ ## Stades et affluence                                │
│                                                       │
│ Le Stade Mohammed V à Casablanca, partagé par Wydad   │
│ et Raja, est le plus grand avec 67 000 places. Le     │
│ Stade Adrar à Agadir (Hassania) suit avec 45 000. La  │
│ moyenne d'affluence sur la saison 2024-25 était de    │
│ 12 800 spectateurs par match.                         │
│                                                       │
│ ## Atlas Kings sur la Botola Pro                      │
│                                                       │
│ [editorial paragraph — Morocco-specific framing]      │
│ Atlas Kings couvre la Botola Pro avec les classements │
│ en direct, les fiches de chaque club, les statistiques│
│ des 320+ joueurs en activité, et l'actualité des      │
│ derbies, du Wydad – Raja au choc Maghreb Fès – AS FAR.│
│                                                       │
│ ## Questions fréquentes                               │
│                                                       │
│ ### Combien d'équipes participent à la Botola Pro ?   │
│ 16 équipes en Botola Pro 1 (première division).       │
│                                                       │
│ ### Quel est le format de la Botola Pro ?             │
│ Championnat à matchs aller-retour, 30 journées,       │
│ d'août à mai. Deux montées et deux descentes par      │
│ saison entre Botola Pro 1 et Botola Pro 2.            │
│                                                       │
│ ### Quand commence et finit la saison 2025-26 ?       │
│ Saison commencée le 15 août 2025, fin prévue le 25    │
│ mai 2026.                                             │
│                                                       │
│ ### Quelles équipes se qualifient pour la CAF         │
│ Champions League ?                                    │
│ Les deux premiers de la Botola Pro à la fin de la     │
│ saison.                                               │
│                                                       │
│ ### Qui a remporté le dernier titre de la Botola Pro ?│
│ Wydad AC a remporté le championnat 2024-25, son       │
│ 23ème titre national.                                 │
│                                                       │
│ ### Qui détient le record de titres en Botola Pro ?   │
│ Wydad AC, avec 23 titres, devant Raja CA (12) et      │
│ AS FAR (13).                                          │
│                                                       │
│ ### Où regarder les matchs de la Botola Pro ?         │
│ Les matchs sont diffusés sur Arryadia TV (chaîne      │
│ publique marocaine) et sur la plateforme officielle   │
│ de la Botola.                                         │
│                                                       │
│ ### La Botola Pro a-t-elle une compétition féminine ? │
│ Oui, la Botola Pro Féminine, créée en 2017.           │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### Section ordering principle

```
1. À propos                    [entity description, history]
2. Format                      [structure, qualification, relegation]
3. Buteurs (saison précédente) [historical scorers]
4. Stades et affluence         [stadium/attendance facts]
5. Atlas Kings sur cette league [editorial differentiation slot]
6. Questions fréquentes         [6-8 FAQ entries — long-tail SEO]
```

H2 for each main section. H3 for each FAQ question. The H2/H3 hierarchy is crawlable structure.

### Per-locale variants

All sections translated. Arabic version uses passionate fan-aligned language per the Arabic keyword analysis recommendation ("تابع معنا أسود الأطلس..."). English version uses neutral journalistic tone. French version (primary Morocco audience) balances both.

### Data dependency

About card content lives in CALENDAR.md entry per competition:

```
about_fr: {
  history: string,
  format: string,
  last_season_scorers: string,
  stadiums: string,
  editorial: string,
  faqs: Array<{ q: string, a: string }>
}
about_en: { ... same shape }
about_ar: { ... same shape }
```

Hand-written for the 8 priority leagues; templated for the rest until editorial time allows hand-writing (same pattern as intro paragraph in Section 2).

---

## Section 11 — Live data and caching

### Pusher subscriptions on this page

| Element | Pusher channel | Update cadence |
|---|---|---|
| Adaptive top strip (Mode 2 LIVE) | per-fixture channels for tournament matches | per-event |
| Featured match card | `fixture-{id}` of selected featured fixture | per-event |
| Matches list — live rows | `fixture-{id}` for each visible live match | per-event |
| Standings table | `competition-{id}-standings` | round-end only |
| Page header matchday/leader | `competition-{id}-standings` | round-end only |
| Top scorers / Top assists widgets | `competition-{id}-leaderboards` | nightly batch |

### Server-side caching

| Element | TTL |
|---|---|
| Page header (non-live data) | 60s |
| Standings table | 60s when no live match in round; 0s when live |
| Stats tab | 5 min |
| Details tab | 1 hour |
| About card | 24 hours (rarely changes) |
| Top scorers / assists | 5 min |
| MoreMatchesToday widget | 60s (since fixtures complete throughout day) |
| MoroccoEditorialPicks | 24 hours (editorial content changes rarely) |

Per Q13 locked: matchday-and-leader strip updates **at round-end only**, never mid-round.

---

## Section 12 — Mobile (375px)

### Single-column stacked layout

```
[ADAPTIVE TOP STRIP ~40px]
[TOPBAR ~56px condensed]   ← [≡] [Atlas Kings]  🔍 EN ☾
[SEO breadcrumb ~22px, compact]
[PAGE HEADER — mobile condensed ~140px]
  Crest 48×48 + name (smaller) + country + season selector
  Season progress bar
  Matchday/leader strip
  Intro paragraph (full text)
[FEATURED MATCH CARD]
[TABS row, scrollable horizontally if overflow]
  Classement ● Stats Détails Média
[H2 inside active tab]
[ACTIVE TAB CONTENT]
  e.g. Standings: All/Home/Away sub-tabs, table (responsive collapse), Tracker
[TOP SCORERS WIDGET]              ← promoted from right rail
[MOROCCO EDITORIAL PICKS]         ← promoted from right rail
[MATCHES (round selector + list)] ← from left rail, full-width
[POTS RACE]                        ← from left rail
[TEAM OF THE WEEK]                ← from left rail
[TOP ASSISTS]                      ← from right rail
[MORE MATCHES TODAY]               ← from right rail
[NEWSLETTER]                       ← from right rail
[ABOUT CARD — full content]
[FOOTER vertical stack]
[FIXED BOTTOM TAB BAR ~56px]
```

### Mobile responsive collapse — standings table

| Viewport | Visible columns |
|---|---|
| ≥1280px | # / Team / P / W / D / L / DIFF / GLS / Form / Pts |
| 768-1279px (rail hidden) | # / Team / P / W / D / L / DIFF / GLS / Pts |
| 375-767px | # / Team / P / +/- / Pts |
| <375px | # / Team / Pts |

Form column drops first (high width, lowest essential info). DIFF + GLS merge into a single `+/-` column at small viewports. Below 375px, only the absolute essentials remain.

### Mobile-specific note: where Top scorers goes

On desktop, Top scorers is right rail. On mobile, **it surfaces between the center tab content and the left-rail content** — placing it at the most-likely-scrolled-to position. Rationale: scorers are high-value Morocco-signal content (Hakimi appears in top scorers lists of every league); putting them above the Matches list prioritizes the highest editorial-value content.

### Mobile-specific: TOTW

Team of the Week pitch formation is hardest to render at 375px (11 player photos on a pitch). Falls back to a list view:

```
[Pitch formation — small, illustrative]

Équipe de la Journée 20
  GK   Bono           9.3
  DEF  Saiss          8.7
  DEF  Aguerd         8.5
  DEF  Mendy          8.4
  ...
```

Pitch graphic stays visible above the list for visual continuity, but the list is the data-bearing component on mobile.

---

## Section 13 — All locked decisions summary

| Element | Decision |
|---|---|
| Page identity | League competition page family. Botola Pro canonical instance. Same structure repurposes for all leagues in VERIFIED_COMPETITIONS. |
| URL canonical | `/[locale]/competition/[country]/[league-slug]` — single URL per league per locale |
| URL — country segment | Included, locale-translated (`maroc` / `morocco` / `المغرب`). Confederation-rooted for international (`fifa` / `uefa` / `caf` / `afc` / `ioc`) |
| URL — league slug | Per-locale slug fields (`slug_fr` / `slug_en` / `slug_ar`) in CALENDAR.md; Arabic-script for Arabic locale |
| URL — `/competition/` segment | Not translated; same across all locales (Next.js routing simplicity) |
| Tab state | Hash fragments (`#classement`, `#stats`, `#details`, `#media`); not separately indexable |
| hreflang | All three locale variants reference each other; `x-default` → FR |
| League Hero | Matchwire-derived. 96px accent-tinted crest wrap, eyebrow (flag+country+tier+season), H1 Inter 800 38px, meta row (season selector + live chip), progress bar + matchday/leader, accent gradient stripe (3px), intro paragraph. Not sticky. |
| Page H1 | Competition name + season, Inter 800 38px |
| Intro paragraph | Keyword-loaded 25-40 words, per-locale. Hand-written for 8 priority leagues; templated for rest |
| Title + meta | Keyword-loaded with three highest-volume modifiers per locale |
| Structured data | JSON-LD: SportsOrganization + per-fixture SportsEvent |
| About card location | Page bottom, before footer, full container width. Long-form H2/H3 + 6-8 FAQ. Hand-written for priority leagues. Matchwire card system. |
| Image alt text | Locale-specific. Crests, player photos, stadium photos |
| Inner-page shell | 3-column: 256px left (sticky) + 1fr center (~752px) + 320px right. Max-width 1440px, 32px container padding, 24px gap. Matchwire-derived. |
| Card system | Matchwire: 12px radius, 16px padding (or no-pad), surface-1 bg, 1px border. Applied to all content blocks. |
| Center column tabs | Standings / Stats / Details / Media. Tab strip sticky at top:104px, z:49, accent underline animated. Standings table column headers also sticky. |
| Standings table columns | 10 cols at ≥1280px: # / Team / P / W / D / L / DIFF / GLS / Form / Pts |
| Standings sub-tabs | All / Home / Away |
| Zone markers | Per-league configurable colored bars on row left edge. Botola: top 2 green (CAF CL), 3-4 yellow (CAF Confed), 15-16 red (relegation) |
| Tiebreaker rules | Per-league grey panel below legend, locale-translated |
| Standings Tracker chart | Below table. Phase 5+ data dependency. Empty state when no historical data |
| Left rail | 256px, sticky top:156px, max-height calc(100vh-172px), overflow-y auto. 4 cards: Featured match → Matches with round selector → POTS race → Team of the Week |
| Round selector | Chevron + dropdown hybrid (`‹ Journée 20 ›`, label opens grid) |
| Featured match algorithm | Live → highest-Morocco-signal team's next → stakes-based → kickoff proximity. No odds; replaced with "Forme récente" |
| POTS + TOTW gating | Empty state ("Données indisponibles") for leagues without statistics_fixtures coverage (Algeria, Tunisia) |
| Right rail | 5 widgets: Top scorers → Top assists → MoroccoEditorialPicks → MoreMatchesToday → Newsletter |
| Right rail breakpoint | 320px at ≥1440px, 300px at 1281-1439px, hidden at ≤1280px (matchwire breakpoints) |
| MoroccoEditorialPicks | Hand-written copy per league in CALENDAR.md. H3 + 200-400 char paragraph |
| Live data | Pusher per-fixture for featured + matches list rows; round-end refresh for standings + header strip |
| Caching | 60s standings non-live / 0s live / 5min stats / 1h details / 24h about |
| Mobile (375px) | Single-column stack: header → featured → tabs → top scorers → editorial picks → matches → POTS → TOTW → top assists → more matches → newsletter → about → footer |
| Mobile table | Responsive collapse: Form → DIFF/GLS merge → min cols # Team P +/- Pts |
| Compliance | Loi 09-08 footer notice; no odds anywhere; no Sign In until Phase 10; Featured card uses Forme récente in lieu of odds |
| Placeholder content | Real Botola seed data from Neon DB: real team names (Wydad/Raja/AS FAR/Maghreb Fès/etc.), real-style scores, real player names |

---

## Section 14 — Component inventory for Phase 4.5 implementation

### New components to build (League-specific, Phase 4.5)

| Component | Location | Reuse on other pages |
|---|---|---|
| InnerPageShell | src/components/layout/InnerPageShell.tsx | Pages 2-7. Matchwire 3-col grid: 256px/1fr/320px, 1440px max, 32px pad, 24px gap. Left rail sticky. |
| LeagueHero | src/components/competition/LeagueHero.tsx | Pages 2, 3. Matchwire-derived: 96px crest wrap, eyebrow, H1, meta, stripe. |
| SeasonSelector | src/components/competition/SeasonSelector.tsx | Pages 2, 3 |
| SeasonProgressBar | src/components/competition/SeasonProgressBar.tsx | Pages 2, 3 |
| MatchdayLeaderStrip | src/components/competition/MatchdayLeaderStrip.tsx | Page 2 |
| IntroParagraph | src/components/competition/IntroParagraph.tsx | Pages 2, 3 (different content) |
| CompetitionTabs | src/components/competition/CompetitionTabs.tsx | Pages 2, 3 (variant: Page 3 adds Knockout tab) |
| StandingsTable | src/components/standings/StandingsTable.tsx | Page 2, Page 4 (team page sub-section) |
| StandingsSubTabs | src/components/standings/StandingsSubTabs.tsx | Page 2 |
| QualificationLegend | src/components/standings/QualificationLegend.tsx | Page 2 |
| TiebreakerPanel | src/components/standings/TiebreakerPanel.tsx | Page 2 |
| StandingsTracker | src/components/standings/StandingsTracker.tsx | Page 2 |
| FeaturedMatchCard | src/components/competition/FeaturedMatchCard.tsx | Pages 2, 3, 4 |
| MatchesListCard | src/components/competition/MatchesListCard.tsx | Pages 2, 3, 4 |
| RoundSelector | src/components/competition/RoundSelector.tsx | Pages 2, 3 |
| POTSRaceCard | src/components/competition/POTSRaceCard.tsx | Pages 2, 3 |
| TeamOfTheWeekCard | src/components/competition/TeamOfTheWeekCard.tsx | Pages 2, 3 |
| MoroccoEditorialPicks | src/components/widgets/MoroccoEditorialPicks.tsx | Pages 2, 3, 4, 5 |
| MoreMatchesTodayWidget | src/components/widgets/MoreMatchesTodayWidget.tsx | Pages 2-7 (right rail standard) |
| AboutCard | src/components/competition/AboutCard.tsx | Pages 2, 3 |
| FAQList | src/components/competition/FAQList.tsx | Pages 2, 3 |
| StructuredDataInjector | src/components/seo/StructuredDataInjector.tsx | All pages |

### Reused from homepage.md (no changes needed)

- AdaptiveTopStrip
- Topbar (with featured slots)
- SeoBreadcrumb
- FixtureRow (used in Featured card + Matches list)
- CompetitionGroupHeader (not needed inside Matches card — scoped to single league)
- RightRailTopScorers (renamed → TopScorersWidget; same component)
- NewsletterCard
- MobileBottomTabBar
- MobileHamburgerDrawer
- Footer

### CALENDAR.md schema additions required

```
slug_fr: string
slug_en: string
slug_ar: string
intro_fr: string | null   // null = use template
intro_en: string | null
intro_ar: string | null
editorial_pick_fr: string | null
editorial_pick_en: string | null
editorial_pick_ar: string | null
qualification_zones: Array<{
  positions: number[],
  type: 'champions_league' | 'caf_champions_league' | 'europa_league' | 
        'caf_confederation' | 'conference_league' | 'relegation',
  color: 'green' | 'yellow' | 'red' | 'blue' | 'lightblue'
}>
tiebreaker_rules: Array<'goal_difference' | 'goals_for' | 'h2h' | 'wins' | 'away_goals'>
about_fr: { history, format, last_season_scorers, stadiums, editorial, faqs }
about_en: { ... }
about_ar: { ... }
```

### New backend resource

`src/lib/constants/country-slugs.ts` — country code → per-locale slug lookup.

---

## Section 15 — Open questions for Phase 4.5 implementation

| Question | Owner | Decision target |
|---|---|---|
| Standings Tracker — first valid render round (J5? J10?) — when do we start showing the chart? | UX | 4.5b implementation |
| Stats tab block list — final set of blocks (which API-Football metrics surface vs. which we skip in Phase 4.5) | Engineering | Phase 5 ingestion |
| Mobile table responsive breakpoints — exact column drop ordering and minimum viable column set | UX | 4.5a implementation |
| Season selector — past seasons available via query param OR generated as separate routes for SEO? | Engineering | 4.5b implementation |
| TOTW algorithm — confirm position selection rules (4-3-3 default; adapt to formation in round?) | Product | Phase 5 |
| ~~About card width~~ | ~~Resolved~~ | Full container width with 720px max prose width inside (matchwire update 2026-05-23) |
| FAQ count per league — 6 minimum, 8 maximum, or league-dependent? | Editorial | 4.5b |
| Editorial picks rotation cadence — manual updates or scheduled per matchday? | Product | Phase 5 |
| Standings Tracker — alternative visualization (heatmap, slopegraph) considered? | UX | 4.5b |
| Hash fragment → tab scroll behaviour — smooth scroll on tab change or jump? | UX | 4.5a |

---

## Section 16 — Differences from Sofascore Premier League reference

| Element | Sofascore | Atlas Kings |
|---|---|---|
| URL structure | `/football/tournament/england/premier-league/17` (trailing ID) | `/[locale]/competition/[country]/[league-slug]` (no ID) |
| Tab state | URL with `#id:76986` fragment | Hash fragments per tab (`#classement`) |
| Locale handling | One URL per language (English-dominant) | Locale-translated slugs with hreflang bridges |
| League Hero | 185px non-sticky | Matchwire-derived: 96px accent-tinted crest, eyebrow, Inter 800 38px H1, meta row, progress bar, accent stripe, intro paragraph. Not sticky. |
| Featured match card | Includes bet365 odds row | Replaces with "Forme récente" WWLDW (Loi 09-08) |
| Left rail | 366px, includes Fantasy promo + gambling disclaimer + ad unit | 256px, sticky top:156px, no fantasy/gambling/ads — Featured + Matches + POTS + TOTW. Matchwire card system. |
| Center column | 731px | 1fr (~752px at 1440px). Matchwire card system. |
| Right rail | Ad slot, requires ≥1344px | 320px editorial widget stack, hidden at ≤1280px (matchwire breakpoints) |
| Right rail content | Vertical ad | Top scorers + Top assists + MoroccoEditorialPicks + MoreMatchesToday + Newsletter |
| Card system | Standard Sofascore cards | Matchwire: 12px radius, 16px padding, surface-1 bg, 1px border, no-pad variant |
| Tab strip | Inline in center column, not sticky | Sticky at top:104px, z:49, accent underline animated (matchwire pattern) |
| About card | Bottom, ~978px, format/scorers/stadiums + FAQ | Bottom, same structure + Atlas Kings editorial section + 6-8 FAQs (more) |
| Intro paragraph | None | 25-40 word keyword-loaded paragraph below page header |
| Zone markers in table | Generic CL/EL/ECL/relegation colors | Per-league configurable (CAF CL/CAF Confed/relegation for Botola) |
| H2 inside tabs | No visible H2 | Visible H2 per active tab (SEO) |
| Structured data | SportsOrganization + SportsEvent | Same + per-locale altName |
| Standings Tracker | Visible chart | Same (Phase 5+ data) |
| Bottom mobile nav | 5 tabs incl. Fantasy + Profile | 4 tabs (no Fantasy, no Profile until Phase 10) |
| Footer | 18+ gambling notice | Loi 09-08 notice |

## Section 17 — Outbound link targets

Every clickable destination on the league competition page (Botola Pro canonical instance). Same routing structure applies to all leagues using this template (EPL, LaLiga, Bundesliga, Serie A, Ligue 1, etc.).

Routes are documented against the schematic spec (Sections 4-12), not extrapolated from Sofascore patterns. Where Sofascore offers a click destination that our schematic chose not to spec, this section reflects our spec — not Sofascore's.

### Category 1 — Routes to existing Pages 2-7 (in scope, schematicized separately)

**Inherited chrome (per Section 4)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Topbar — all items | Same as homepage chrome | Pages 1-7 | Per topbar routing |
| SeoBreadcrumb segment 1 ("Football") | Homepage | Page 1 | `/fr` |
| SeoBreadcrumb segment 3 (current competition) | Current page (non-clickable) | — | — |
| Footer — all links | Same as homepage chrome | Pages 1-7 | Per footer routing |
| Mobile bottom tab bar — Matchs | Homepage | Page 1 | `/fr` |

**Page header (per Section 5)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Crest, H1, tier descriptor | Non-clickable (page identity) | — | — |
| Season selector dropdown | Same league, different season | Page 2 (query param) | `/fr/competition/maroc/botola-pro?season=2024-25` |
| Intro paragraph | Non-clickable prose | — | — |

**Left rail (per Section 6)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Card 1 Featured match — anywhere on card | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Card 1 Featured match — team crests/names | Team page | Page 4 | `/fr/equipe/maroc/[team-slug]` |
| Card 2 Matches — fixture row | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Card 2 Matches — favourite star ☆ | Toggle favourite (stub until Phase 10) | — | — |
| Card 2 Matches — "Par date / Par journée" toggle | In-card state change | — | — |
| Card 2 Matches — round selector chevrons | In-card round change | — | — |
| Card 2 Matches — round selector label (opens grid) | In-card grid → in-card round change | — | — |
| Card 3 POTS — player row | Player page | Page 5 | `/fr/joueur/[player-slug]` |
| Card 4 TOTW — player photo on pitch | Player page | Page 5 | `/fr/joueur/[player-slug]` |
| Card 4 TOTW — round selector dropdown | In-card TOTW round change | — | — |

**Center column tabs row (per Section 7)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Tab change (Classement / Stats / Détails / Média) | Same page, hash fragment update | — | `#classement`, `#stats`, `#details`, `#media` |

**Center column Standings tab (per Section 7 + Edit 1a, 1b)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Sub-tabs All / Domicile / Extérieur | In-tab state change | — | — |
| Team row (anywhere) | Team page | Page 4 | `/fr/equipe/maroc/[team-slug]` |
| Form pill (W/D/L) — Edit 1a | Match detail for that result | Page 6 | `/fr/match/[match-slug]` |
| Qualification legend | Non-clickable label | — | — |
| Tiebreaker rules panel | Non-clickable info | — | — |
| Standings Tracker team comparison pickers | In-chart state change | — | — |
| Standings Tracker round navigator | In-chart cursor change | — | — |
| Standings Tracker data points (round markers) | Not clickable in Phase 4.5 (Edit 1b) | — | Phase 5+ enhancement |

**Center column Stats tab (per Section 7 + Edit 1c)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Block sub-headings | Non-clickable | — | — |
| Player row inside any stats block | Player page | Page 5 | `/fr/joueur/[player-slug]` |
| Team crest or team name inside any stats block | Team page | Page 4 | `/fr/equipe/maroc/[team-slug]` |

**Center column Details tab (per Section 7 + Edit 1d)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Premier vainqueur team name | Team page | Page 4 | `/fr/equipe/maroc/[team-slug]` |
| Tenant du titre team name | Team page | Page 4 | `/fr/equipe/maroc/[team-slug]` |
| Promoted teams team names | Team pages | Page 4 | `/fr/equipe/maroc/[team-slug]` |
| Relegated teams team names | Team pages | Page 4 | `/fr/equipe/maroc/[team-slug]` |
| Top all-time scorer player name | Player page | Page 5 | `/fr/joueur/[player-slug]` |
| Top all-time appearances player name | Player page | Page 5 | `/fr/joueur/[player-slug]` |
| Lower division reference | That competition's page | Page 2 | `/fr/competition/maroc/botola-pro-2` |
| Trophée image | Non-clickable | — | — |
| Format actuel / Nombre d'éditions | Non-clickable info | — | — |

**Center column Media tab**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| News article (Phase 12+) | News article page | Phase 12+ | `/fr/actualites/[slug]` |
| Video thumbnail (Phase 12+) | Video modal overlay | — | — |

**Right rail (per Section 8)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Widget 1 Top scorers — header | Same league, Stats tab | Page 2 #stats | `/fr/competition/maroc/botola-pro#stats` |
| Widget 1 Top scorers — player row | Player page | Page 5 | `/fr/joueur/[player-slug]` |
| Widget 2 Top assists — player row | Player page | Page 5 | `/fr/joueur/[player-slug]` |
| Widget 3 MoroccoEditorialPicks — links | Hand-curated per league; routes to Pages 2/4/5/6 entities mentioned | Various | Per editorial copy |
| Widget 4 MoreMatchesToday — fixture | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Widget 4 MoreMatchesToday — competition name | Competition page | Page 2 or 3 | `/fr/competition/[country]/[slug]` |
| Widget 5 Newsletter — submit | In-modal confirmation toast (no nav) | — | — |

**About card (per Section 10)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Entity name in body copy (team names, player names, competitions) | Corresponding entity page | Pages 2-5 | Per entity URL pattern |
| Internal anchor links (#classement, #stats etc.) | Same page, hash fragment scroll | — | Same URL + hash |
| FAQ entity references | Corresponding entity page | Pages 2-5 | Per entity URL pattern |

### Category 2 — In-page interaction (no navigation)

Documented exhaustively above in Category 1 marked with em-dashes. Summary of types:

- All tab/sub-tab changes (hash fragment update only)
- All filter pills (in-card state change)
- All dropdowns (season, round, TOTW round, view-mode, sub-tab)
- All toggle controls (Par date / Par journée)
- All chart interactivity (Standings Tracker pickers and navigator)
- Favourite star (toggle stub until Phase 10 auth)
- Mega-menu open/close
- Language switcher
- Theme toggle

### Category 3 — Routes to Phase 6+ feature pages (NOT in current 7-page scope)

| Click source | Reserved URL | Phase |
|---|---|---|
| SeoBreadcrumb segment 2 (country, e.g. "Maroc") | `/fr/pays/maroc` | Phase 6+ — render as non-clickable text until shipped |
| Page header country flag/name (Sub-zone A) | `/fr/pays/maroc` | Phase 6+ — render as non-clickable text until shipped |
| Details tab "Pays" entity | `/fr/pays/maroc` | Phase 6+ — non-clickable until shipped |
| Details tab "Confédération" entity | `/fr/confederation/caf` | Phase 6+ — non-clickable until shipped |
| Widget 1 Top scorers "Voir tous →" | `/fr/classements/buteurs/botola-pro` | Phase 6+ |
| Widget 2 Top assists "Voir tous →" | `/fr/classements/passeurs/botola-pro` | Phase 6+ |
| Card 3 POTS "Voir le classement complet →" | `/fr/classements/notes/botola-pro` | Phase 6+ |
| Topbar 🔍 Search | `/fr/recherche` (or overlay) | Phase 6+ |
| Mobile bottom tab bar — Recherche / Favoris / Paramètres | Various Phase 6+/10 URLs | Phase 6+ / Phase 10 |

**Phase 6+ deferred-affordance rule**: any destination listed in Category 3 renders as non-clickable text (not a disabled link, not a broken link) until the destination page ships. Breadcrumb segments and page-header country segments specifically follow this rule per Edits 1e and 1f.

**Newly surfaced Phase 6+ feature pages from this routing analysis**: country index (`/[locale]/pays/[country-slug]`) and confederation index (`/[locale]/confederation/[confederation-slug]`). Both already tracked in BACKLOG.md.
```

---

## Apply order

1. Apply Edits 1a-1f to Section 5 + Section 7 first (small inline changes; no merge risk).
2. Then append the rewritten Section 17 before the `## Update log` section.
3. Then add this update log entry:

```
- 2026-05-13 — Section 7 click specs added (form pill→match detail; Stats tab player/team rows linked; Details tab entity names linked; Standings Tracker data-point click explicitly deferred to Phase 5+). Section 5 page header country segment + Section 4 breadcrumb segments now spec routing behaviour with Phase 6+ deferred-affordance rule. Section 17 (Outbound link targets) added with exhaustive routing matrix.
```

## Discard

The earlier `outbound-link-targets-patch.md` Section 17 (PATCH 2) — replaced entirely by this corrected version. Don't paste the earlier one.

The earlier patch's Section 16 for homepage.md — still on hold, pending fresh Sofascore /football landing-page browser analysis.

---

## Update log

- 2026-05-13 — Initial schematic locked after Phase 4.5+ design session. Inherits chrome from `docs/schematics/homepage.md`. Sofascore Premier League reference used (`docs/research/sofascore-analysis-page2-premier-league.md`). Ahrefs Morocco keyword analysis + Arabic parallel analysis informed URL structure and SEO enrichment decisions.
- 2026-05-13 — Section 7 click specs added (form pill→match detail; Stats tab player/team rows linked; Details tab entity names linked; Standings Tracker data-point click explicitly deferred to Phase 5+). Section 5 page header country segment + Section 4 breadcrumb segments now spec routing behaviour with Phase 6+ deferred-affordance rule. Section 17 (Outbound link targets) added with exhaustive routing matrix.
- 2026-05-23 — Matchwire EPL prototype integration: (a) Section 3 layout updated to matchwire 3-column grid (256px/1fr/320px at 1440px max-width, 32px padding, 24px gap), left rail now sticky; (b) Section 5 page header replaced with matchwire-derived League Hero (96px accent-tinted crest wrap, eyebrow, Inter 800 38px H1, meta row with live chip, accent gradient stripe) keeping Atlas Kings content (season selector, progress bar, matchday/leader strip, intro paragraph); (c) Matchwire card system adopted across all content blocks (12px radius, 16px padding, surface-1 bg, 1px border); (d) Tab strip made sticky at top:104px with accent underline animation; (e) Right rail breakpoints updated to matchwire pattern (hidden at ≤1280px instead of ≤1180px). Reference: `docs/schematics/reference-matchwire-epl.md`.
- (Append future updates here with date and change description)
