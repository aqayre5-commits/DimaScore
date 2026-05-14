# Atlas Kings Team Schematic — Page 4

Locked schematic for `/[locale]/equipe/[country]/[team-slug]` (team pages — clubs and national teams). Wydad AC is the canonical instance used throughout this document; the same structure repurposes for all club teams (Botola Pro clubs, EPL clubs, LaLiga clubs, etc.) and adapts for national teams (Atlas Lions and other national selections) via a Format Variants subsection.

Reference data source for the schematic: Arsenal (Premier League) browser-session analysis — `docs/research/arsenal-sofascore-team-page-full-analysis.md`. Arsenal was selected as the Sofascore reference because Sofascore's national team pages have weaker design depth; we repurpose the club page structure for national teams with documented deltas (Section 18).

**Status**: Locked, ready for Phase 4.5 implementation
**Last updated**: 2026-05-13
**Reference**: `docs/research/arsenal-sofascore-team-page-full-analysis.md`
**Inherits chrome from**: `docs/schematics/homepage.md`
**Inherits page-shell patterns from**: `docs/schematics/competition-league.md` (Page 2) and `docs/schematics/competition-cup.md` (Page 3)
**Tournament data source**: `docs/tournaments/CALENDAR.md`
**Team data source**: `teams` table (Postgres) + per-team CALENDAR-style enrichments

---

## Page identity

Canonical Atlas Kings page template for **team** entities — both clubs (Wydad AC, Raja CA, Arsenal, PSG, Real Madrid) and national teams (Atlas Lions, France, Argentina). Distinct from Pages 2-3 (competitions) which represent leagues and tournaments rather than the participating entities themselves.

Where Page 2 = "this league plays a season" and Page 3 = "this tournament has a winner". Page 4 = "this team has a squad, plays in competitions, and has a history."

Distinguishing characteristics from Pages 2-3:
- Team identity is the page's defining content — crest, name, country, founded year, coach, stadium
- Previous match and Next match are core hero content (not just left-rail cards)
- Players (squad) is a dedicated tab — Pages 2-3 don't have one
- Trophies (Palmarès) section sits below the 3-column zone — chronological timeline, not a tab
- FIFA ranking display gated by team type (national teams show it; clubs do not)

### Inherited from Pages 2-3

Page 4 uses the same inner-page 3-column shell at ≥1280px floor: ~360-380 left + ~500-520 center + ~280-300 right. Same chrome (top strip, topbar, breadcrumb, footer, mobile tab bar) from homepage.md. Same SEO machinery (per-locale title/meta, hreflang, JSON-LD, image alt text, H1+intro paragraph, About card with FAQ at page bottom). Same Loi 09-08 compliance (no odds anywhere). Same Phase 6+ deferred-affordance rule for unbuilt destinations. Same `youtube-nocookie.com` videos pattern from Page 3.

### Distinguishing characteristics — Page 4 vs Pages 2-3

| Aspect | Pages 2-3 (Competitions) | Page 4 (Team) |
|---|---|---|
| Hero focus | Competition identity (logo, edition, season/edition status) | Team identity (crest, name, country, coach, stadium, league) |
| Hero second sub-zone | Page 2: matchday/leader strip. Page 3: status descriptor + Morocco context. | Previous match + Next match snapshot cards (side-by-side) |
| Tab set | Page 2: 4 tabs. Page 3: 3 tabs. | 3 tabs: Classement / Statistiques / Joueurs |
| Default tab | Page 2: Standings. Page 3: Overview. | Standings |
| Players tab | Not present | Sub-tabs: Effectif / Top joueurs (squad table by position + per-stat leaderboards) |
| Standings tab content | The full league table | The full league table with this team's row highlighted |
| Knockout / Overview / Stats | Page 3 has Knockout tab. Page 2 has separate Stats and Details tabs. | Stats folded into its own tab; no Knockout; no Details |
| Trophies / Palmarès | Page 3 has "Titres" block inside Overview tab | Standalone section below tabs, chronological timeline |
| Right rail Widget 3 | Page 2: MoroccoEditorialPicks. Page 3: MeetTheTeamsCard. | MoroccoConnection (Moroccan players in club; or other Morocco tie) |
| Left rail Card 3 | Page 2: POTS race. Page 3: Tous les groupes en bref. | Recent Form chart (bar chart, last 12 matches) |
| FIFA ranking display | Page 3 shows for national-team tournaments | Page 4 shows for national-team variant; hidden for clubs |
| Standings Tracker chart | Not present (API-Football limitation; see Section 17) | Not present (same reason) |

---

## Section 1 — URL structure

### Canonical pattern

```
/[locale]/equipe/[country]/[team-slug]
```

The `/equipe/` root segment is **not translated** across locales (Next.js routing simplicity, consistent with `/competition/` on Pages 2-3). The country and team slugs **are** translated per locale.

### Per-locale examples

**Wydad AC** — canonical Page 4 instance:
```
/fr/equipe/maroc/wydad-ac
/en/equipe/morocco/wydad-ac
/ar/equipe/المغرب/الوداد-الرياضي
```

**Raja CA** — Wydad's Casablanca rival:
```
/fr/equipe/maroc/raja-ca
/en/equipe/morocco/raja-ca
/ar/equipe/المغرب/الرجاء-البيضاوي
```

**Arsenal** — Premier League club:
```
/fr/equipe/angleterre/arsenal
/en/equipe/england/arsenal
/ar/equipe/إنجلترا/أرسنال
```

**Paris Saint-Germain**:
```
/fr/equipe/france/paris-saint-germain
/en/equipe/france/paris-saint-germain
/ar/equipe/فرنسا/باريس-سان-جيرمان
```

**Atlas Lions** (Morocco men's senior national team) — canonical instance for national-team variant:
```
/fr/equipe/maroc/equipe-nationale
/en/equipe/morocco/national-team
/ar/equipe/المغرب/المنتخب-الوطني
```

For national teams, the slug is consistently `equipe-nationale` (FR) / `national-team` (EN) / `المنتخب-الوطني` (AR) under the country segment — never the country name twice. This keeps "Morocco" and "the Moroccan national team" as distinct URLs even when both root from `maroc`.

For women's national teams (Atlas Lionesses): slug becomes `equipe-nationale-feminine` (FR) / `national-team-women` (EN) / `المنتخب-الوطني-للسيدات` (AR).

For youth selections (Morocco U-23, Morocco U-17): slug becomes `equipe-nationale-u23` etc.

### Country root segment

For clubs, the country segment uses the team's home country slug — `maroc`, `angleterre`, `espagne`, `france`, `allemagne`, `italie`, `arabie-saoudite`, `egypte`, `algerie`, `tunisie`, etc. (translated per locale).

For national teams, the country segment is the country the national team represents.

### Slug stability across renames and franchise moves

If a team's name changes (e.g., Olympique Casablanca renamed historically), the slug stays at the current canonical name. Old slugs redirect via 301 to the canonical URL.

### Team data schema additions

Building on Page 2's `teams` table, Page 4 needs:

```typescript
team_type: 'club' | 'national_men' | 'national_women' | 'national_youth_u23' | 'national_youth_u17'
country_code: string             // 'MA', 'GB', 'FR' — drives flag display
founded_year: number             // 1937 for Wydad; for national teams, federation founded year
coach_id: number                 // FK to coaches table
home_venue_id: number | null     // FK to venues table; null for national teams that rotate
primary_league_id: number | null // FK for clubs; null for national teams
fifa_ranking: number | null      // null for clubs
fifa_ranking_applicable: boolean // gating for FIFA ranking display
nickname_fr: string | null       // "Atlas Lions" / "Atlas Lionesses" / "Les Rouges"
nickname_en: string | null
nickname_ar: string | null
historical_titles: Array<{       // Phase 5 ingestion
  year: number,
  competition_id: number,
  result_type: 'win' | 'runner_up' | 'semifinal' | 'quarterfinal',
  count_at_time: number          // 22 = "22nd title"
}>
media_youtube_ids: string[]      // hand-curated for priority teams
about_fr: { intro, history, players, palmares, editorial, faqs }
about_en: { ... }
about_ar: { ... }
```

The `team_type` flag drives several rendering decisions (FIFA ranking visibility, Stadium handling, transfer/squad handling, About card morocco_section content) — see Section 18 Format Variants.

### Tab state — hash fragments only

```
/fr/equipe/maroc/wydad-ac                → defaults to Standings
/fr/equipe/maroc/wydad-ac#classement     → Standings tab (explicit, same as default)
/fr/equipe/maroc/wydad-ac#statistiques   → Statistics tab
/fr/equipe/maroc/wydad-ac#joueurs        → Players tab
```

Per-locale hash fragments same naming pattern as Pages 2-3.

### hreflang annotations

```html
<link rel="alternate" hreflang="fr" href="https://atlaskings.com/fr/equipe/maroc/wydad-ac" />
<link rel="alternate" hreflang="en" href="https://atlaskings.com/en/equipe/morocco/wydad-ac" />
<link rel="alternate" hreflang="ar" href="https://atlaskings.com/ar/equipe/المغرب/الوداد-الرياضي" />
<link rel="alternate" hreflang="x-default" href="https://atlaskings.com/fr/equipe/maroc/wydad-ac" />
```

---

## Section 2 — SEO and indexability

### Per-locale title and meta description

Hand-written for priority teams (Wydad, Raja, FAR Rabat, Maghreb Fès, Atlas Lions, Atlas Lionesses, MAS Fès, RS Berkane, plus EPL/LaLiga/UCL top clubs). Templated for the rest.

Wydad AC hand-written:

```
fr: <title>Wydad AC — Calendrier, effectif, classement et statistiques | Atlas Kings</title>
    <meta name="description" content="Suivez le Wydad Athletic Club en direct: calendrier des matchs en Botola Pro et CAF Champions League, effectif complet, classement, statistiques de la saison. Le club casablancais le plus titré du Maroc, triple champion d'Afrique." />

en: <title>Wydad AC — Fixtures, squad, standings and statistics | Atlas Kings</title>
    <meta name="description" content="Follow Wydad Athletic Club live: Botola Pro and CAF Champions League fixtures, full squad, standings, season statistics. Casablanca's most-titled club and three-time African champion." />

ar: <title>الوداد الرياضي — الجدول، التشكيلة، الترتيب والإحصائيات | أطلس كينغز</title>
    <meta name="description" content="تابعوا الوداد الرياضي مباشرة: جدول مباريات البطولة الاحترافية ودوري أبطال إفريقيا، التشكيلة الكاملة، الترتيب، إحصائيات الموسم. النادي البيضاوي الأكثر تتويجاً في المغرب وثلاثي بطولة إفريقيا." />
```

Title pattern: `{team_name} — {modifier_1}, {modifier_2}, {modifier_3}, {modifier_4} | Atlas Kings`.

Modifiers tuned per team type:
- Clubs: `calendrier / effectif / classement / statistiques`
- National teams (men's senior): `qualifications / sélection / classement FIFA / statistiques`
- National teams (women's senior, youth): adapted to relevant competitions
- Historic clubs / lower-tier teams: shorter modifiers `calendrier / effectif / classement`

### H1 — single per page

Team name (with optional nickname for priority teams), IBM Plex Sans 32px semibold, NOT Fraunces (matches Pages 2-3 H1 treatment):

```
fr: <h1>Wydad Athletic Club</h1>
en: <h1>Wydad Athletic Club</h1>
ar: <h1>الوداد الرياضي</h1>
```

For national teams, the H1 includes nickname when one is well-known:

```
fr: <h1>Maroc — Lions de l'Atlas</h1>
en: <h1>Morocco — Atlas Lions</h1>
ar: <h1>المغرب — أسود الأطلس</h1>
```

The Arabic "أسود الأطلس" is the emotionally resonant fan term identified in the Ahrefs Morocco keyword analysis — using it in the H1 captures that search intent.

### Intro paragraph

Below the hero, above the 3-column zone. 30-50 words, keyword-loaded, per locale. Hand-written for priority teams.

Wydad AC (FR):

```
Wydad Athletic Club est un club de football marocain basé à Casablanca, 
fondé en 1937. Triple champion d'Afrique (CAF Champions League: 1992, 
2017, 2022) et 22 fois champion du Maroc, le Wydad est le club le plus 
titré du pays. Suivez l'effectif, le classement, les statistiques et les 
matchs en direct.
```

Atlas Lions (FR):

```
La sélection marocaine masculine de football, surnommée les Lions de 
l'Atlas, a marqué l'histoire en atteignant la demi-finale de la Coupe 
du Monde FIFA 2022 — première équipe africaine à y parvenir. Suivez le 
parcours des Lions vers la Coupe du Monde 2026, organisée au Maroc 
co-hôte, leurs qualifications et leurs matchs en direct.
```

### H2 inside each active tab

Same pattern as Pages 2-3 — each tab content area has a visible H2:

| Tab | French | English | Arabic |
|---|---|---|---|
| Standings | Classement — Botola Pro 2025/26 | Standings — Botola Pro 2025/26 | الترتيب — البطولة الاحترافية 2025/26 |
| Statistics | Statistiques de la saison | Season statistics | إحصائيات الموسم |
| Players | Effectif et joueurs | Squad and players | التشكيلة واللاعبون |

For national teams, Standings H2 swaps to whichever current tournament context applies (`Classement — Qualifications WC 2026, Groupe X` etc.).

### JSON-LD structured data

Two blocks in `<head>`:

**1. SportsTeam** for the team entity:

```json
{
  "@context": "https://schema.org",
  "@type": "SportsTeam",
  "name": "Wydad Athletic Club",
  "alternateName": ["Wydad AC", "الوداد الرياضي", "WAC"],
  "sport": "https://schema.org/Soccer",
  "foundingDate": "1937-10-08",
  "memberOf": {
    "@type": "SportsOrganization",
    "name": "Botola Pro",
    "url": "https://atlaskings.com/fr/competition/maroc/botola-pro"
  },
  "location": {
    "@type": "Place",
    "name": "Casablanca, Morocco"
  },
  "url": "https://atlaskings.com/fr/equipe/maroc/wydad-ac",
  "logo": "https://atlaskings.com/images/teams/wydad-ac-crest.png"
}
```

For national teams, `@type` stays `SportsTeam` but `memberOf` points to the federation and adds `country` field:

```json
{
  "@type": "SportsTeam",
  "name": "Morocco national football team",
  "alternateName": ["Lions de l'Atlas", "أسود الأطلس"],
  "sport": "https://schema.org/Soccer",
  "memberOf": {
    "@type": "SportsOrganization",
    "name": "Royal Moroccan Football Federation",
    "url": "https://frmf.ma"
  },
  "country": "Morocco"
}
```

**2. SportsEvent array** for upcoming/recent fixtures displayed on the page (Previous match + Next match in hero, matches list in left rail). Generated server-side. Adds rich-snippet eligibility for "Wydad next match" and similar queries.

### Per-locale image alt text

All crests, flags, player headshots, stadium photos carry locale-specific alt text. Same pattern as Pages 2-3 — `name_fr / name_en / name_ar` fields on entity rows.

### About card at page bottom

Long-form keyword-bearing content. 6 H2 sections + 6-8 FAQ entries, hand-written per locale. Documented in Section 11.

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
│ HERO (~280px, not sticky — hybrid Pages 2/3 strip + match snapshot row)      │
│  Sub-zone A — Identity: crest 80×80 · H1 · country · league · founded        │
│                          coach · stadium                                     │
│  Sub-zone B — Edition selector slot (empty in v1, reserved for Phase 10)    │
│  Sub-zone C — Previous match card    │   Next match card (side-by-side)    │
│  Sub-zone D — Intro paragraph (~40 words, locale-loaded)                    │
├──────────────────────┬───────────────────────────┬──────────────────────────┤
│ LEFT RAIL ~360-380px │ CENTER ~500-520px         │ RIGHT RAIL ~280-300px    │
│                      │                           │ (≥1280px)                │
│ 1. Featured match    │ Tabs row (not sticky):    │ 1. Top scorers           │
│ 2. Matches list      │ Classement · Statistiques │ 2. Top assists           │
│    (Par date / Par   │  · Joueurs                │ 3. MoroccoConnection     │
│     tour with        │                           │ 4. MoreMatchesToday      │
│     competition      │ H2 inside active tab      │ 5. Newsletter            │
│     filter)          │                           │                          │
│ 3. Recent Form chart │ Classement default:       │                          │
│ 4. Newsletter        │  • Competition selector   │                          │
│                      │  • Season selector        │                          │
│                      │  • All/Home/Away pills    │                          │
│                      │  • Full league table      │                          │
│                      │    with this team         │                          │
│                      │    highlighted            │                          │
│                      │  • Tiebreaker rules       │                          │
│                      │    accordion              │                          │
├──────────────────────┴───────────────────────────┴──────────────────────────┤
│ PALMARÈS / TROPHIES section (~150-300px, full content width)                 │
│  Chronological timeline of trophies/titles. Most recent first.               │
├─────────────────────────────────────────────────────────────────────────────┤
│ VIDÉOS section (~400-600px, full content width)                              │
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

| Component | Behaviour on Page 4 |
|---|---|
| AdaptiveTopStrip | Identical to homepage. WC 2026 Mode 1 countdown active globally today. For Wydad team page specifically: no team-specific mode change. |
| Topbar | Identical. For Botola Pro clubs (Wydad, Raja, FAR, etc.): Botola Pro nav item gets gold underline (active). For other clubs accessed via mega-menu: no top-level nav active. For national teams: Sélections nav item active if exposed in topbar (Phase 6+); otherwise no active state. |
| SeoBreadcrumb | Content updates per page. Clubs: `Football › Maroc › Botola Pro › Wydad AC` (FR) for Wydad; `Football › Angleterre › Premier League › Arsenal` for Arsenal. National teams: `Football › Maroc › Sélections › Lions de l'Atlas`. Breadcrumb segment routing per Page 2 Section 4 conventions: first segment → homepage; country/competition segments → respective pages (Phase 6+ deferred-affordance where unbuilt); team segment → current page (non-clickable). |
| Footer | Identical. Loi 09-08 notice. |
| Mobile bottom tab bar | Identical 4 tabs (Matchs / Recherche / Favoris / Paramètres). |
| Mobile hamburger drawer | Identical structure. |

---

## Section 5 — Hero (~280px)

Hybrid horizontal data-rich strip (Pages 2-3 pattern) PLUS a Previous match + Next match snapshot sub-zone below the identity row. Same structural shell as Pages 2-3; tournament/team-specific data fills the slots.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│ [Crest 80×80]  Wydad AC                                                  │
│ ──────────────  🇲🇦 Maroc · Botola Pro · Fondé en 1937                    │
│                                                                          │
│                Coach: Rulani Mokwena · Stade Mohammed V (45 000)         │
│                                                                          │
├────────────────────────────────────┬─────────────────────────────────────┤
│ ─── Dernier match ──────────────── │ ─── Prochain match ─────────────── │
│ Botola Pro · J20 · 17/05/26 · FT   │ Botola Pro · J21 · 23/05/26 · 20:00 │
│                                    │                                     │
│ Wydad AC      2 – 1     FAR Rabat  │ Wydad AC      vs      Raja CA       │
│                                    │                                     │
│ Tap → match detail (Page 6)        │ Tap → match detail (Page 6)         │
└────────────────────────────────────┴─────────────────────────────────────┘

Wydad Athletic Club est un club de football marocain basé à Casablanca, 
fondé en 1937. Triple champion d'Afrique (CAF Champions League: 1992, 
2017, 2022) et 22 fois champion du Maroc, le Wydad est le club le plus 
titré du pays. Suivez l'effectif, le classement, les statistiques et les 
matchs en direct.
```

Total height: ~280px (slightly taller than Pages 2-3 hero ~210-240px due to the match snapshot sub-zone).

### Sub-zones

**Sub-zone A — Identity (top, full width, ~140px)**:

- Crest 80×80 (larger than Pages 2-3's 64×64 for stronger team identity). Rounded 8px corners, light shadow. Non-clickable (page identity).
- H1: team name, IBM Plex Sans 32px semibold. Non-clickable.
- Country flag emoji + country name + primary league + "Fondé en YYYY" — compact muted row, IBM Plex Sans 14px. Country segment routes to country index (Phase 6+ deferred-affordance, non-clickable until shipped). League name routes to that league's Page 2.
- Coach + Stadium row — compact muted row. Coach name: non-clickable text in v1 (manager page deferred Phase 6+, see Section 17). Stadium name: non-clickable text in v1 (stadium page deferred Phase 6+, see Section 17). Capacity in parentheses.

For Arsenal example:
- Country line: `🇬🇧 Angleterre · Premier League · Fondé en 1886`
- Coach/Stadium line: `Coach: Mikel Arteta · Emirates Stadium (60 704)`

For national-team variant (Atlas Lions):
- Country line: `🇲🇦 Maroc · CAF · Fédération fondée en 1955`
- Coach/Stadium line: `Sélectionneur: Walid Regragui · Stades multiples`
- FIFA ranking badge appended: `FIFA #14`

**Sub-zone B — Edition selector slot (right of identity, ~20% width)**:

Currently empty in v1. Reserved layout slot for FAVOURITE star (Phase 10 auth feature) and any future per-team selector. Slot stays empty; design accommodates additions without disrupting layout.

**Sub-zone C — Previous match + Next match snapshot cards (full width, side-by-side, ~120px)**:

Two cards, each ~50% width with 16px gap between them.

```
┌─ Dernier match ────────────────┐  ┌─ Prochain match ────────────────┐
│ Botola Pro · J20 · 17/05 · FT  │  │ Botola Pro · J21 · 23/05 · 20:00│
│                                │  │                                 │
│ 🇲🇦 Wydad AC      2 – 1   FAR  │  │ 🇲🇦 Wydad AC      vs   Raja CA  │
│                                │  │                                 │
│ → Voir le match                │  │ → Voir le match                 │
└────────────────────────────────┘  └─────────────────────────────────┘
```

Each card structure:
- Top label: competition name + matchday/round + date + status (FT / minute / kickoff time)
- Score line: this team always on left, opponent on right. Crests + team names + score (or "vs" for upcoming).
- Bottom action: implicit "tap to view" (entire card is clickable)

Click destinations:
- Entire card → that match's detail page (Page 6)
- This team's crest → non-clickable (current page identity)
- Opponent crest/name → opponent's team page (Page 4)

### Edge cases for match snapshot cards

| State | Previous card | Next card |
|---|---|---|
| Live match in progress | Swaps to "LIVE · 67' · Wydad 2-1 Raja" with animated red wash | Next match card stays; if next match is the live one, both cards show the same with appropriate states |
| No matches in last 90 days (off-season) | Swaps to "Saison 2025-26: 1er · Champion" summary | Next card swaps to "Saison 2026-27 commence le [date]" |
| No upcoming match scheduled | Previous card stays | Swaps to "Prochain match à confirmer" |
| Brand new team / first-time covered | Both cards show "Aucun match récent · Couverture débute le [date]" | Same |
| Recent transfer of head coach mid-season | No change — match cards are unaffected | Same |

Implementation: both cards live as state-adaptive components. Server-side data determines which state renders. Pusher subscription on `team-{id}-state` updates the cards when a match transitions (kickoff, FT, etc.).

**Sub-zone D — Intro paragraph (below match cards, full width, ~70-90px)**:

Same pattern as Pages 2-3 intro. Keyword-loaded 30-50 words. Hand-written for priority teams.

Wydad AC FR shown above. For Arsenal:

```
Arsenal Football Club is a London-based Premier League club founded in 
1886. With 13 league titles, 14 FA Cups, and a UEFA Champions League 
final appearance in 2006, the Gunners are among England's most-decorated 
clubs. Follow the squad, fixtures, standings and statistics live.
```

Rendered as a single `<p>` element. IBM Plex Sans 15px, line-height 1.5, max-width ~720px, locale-aligned (RTL for Arabic).

### No FAVOURITE star, no sticky mini-header on scroll

Page 10 features. Slot in Sub-zone B stays empty in v1.

Sticky mini-header on scroll (Sofascore shows a contextual bar with crest + name + favourite toggle when user scrolls past the hero) is **explicitly deferred to Phase 6+ enhancement** to avoid visual stacking with the already-sticky topbar.

---

## Section 6 — Left rail (~360-380px)

Fixed 4-card stack. Total rail height ~1500-1700px. Scrolls with page (no sticky behaviour on cards).

### Card 1 — Featured match (~180px)

Same component as Page 2 Card 1 and Page 3 Card 1. Selection algorithm scoped to this team:

1. If a match involving this team is currently live → that
2. Else this team's next scheduled match (across all competitions) → that
3. Else this team's most recent finished match (within last 7 days)
4. Else show empty state: "Pas de match dans les 7 prochains jours"

For Wydad AC, with next match being the Casablanca derby:

```
┌─ À la une ──────────────────────────────────────┐
│                                                 │
│  [crest L]            20:00                     │
│                     SAM 23 MAI                   │
│                                                 │
│  Wydad AC                              Raja CA   │
│                                                 │
│  Botola Pro · J21 · Stade Mohammed V            │
│                                                 │
│  Forme récente:                                 │
│  W W L D W   vs   L W D W W                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Form line** (`Forme récente: WWLDW vs LWDWW`) is Page 2's pattern, used for clubs since clubs play frequently and recent form is meaningful. Replaces Sofascore's bet365 odds row per Loi 09-08.

For national-team variant (Atlas Lions): replaces form line with **FIFA ranking comparison** (`FIFA: #14 Maroc · #1 Argentine`) per Page 3's pattern. Gated by `fifa_ranking_applicable: true` flag.

Tap action: routes to match detail page (Page 6).

### Card 2 — Matches list (~700-800px)

```
┌─ Matchs ────────────────────────────────────────┐
│                                                 │
│ Compétition: [Toutes ▾]                         │
│                                                 │
│ [Par date ●]  [Par tour]                        │
│                                                 │
│ ‹  Mai 2026  ›                                  │
│                                                 │
│ ─── 17 mai · Botola Pro J20 ──────────────── │
│ 17/05  FT   Wydad AC          2 – 1   FAR     │ W ☆
│                                                 │
│ ─── 10 mai · Botola Pro J19 ──────────────── │
│ 10/05  FT   HUSA              0 – 1   Wydad   │ W ☆
│                                                 │
│ ─── 03 mai · CAF CL Demi-finale ────────────  │
│ 03/05  FT   Wydad AC          1 – 0   Mamelodi│ W ☆
│                                                 │
│ ─── 23 mai · Botola Pro J21 ──────────────── │
│ 23/05  20:00 Wydad AC          –     Raja CA  │ ☆
│                                                 │
│ ─── 30 mai · CAF CL Finale ───────────────── │
│ 30/05  21:00 Al Ahly          –      Wydad    │ ☆
│                                                 │
│ Voir tous les matchs →                          │
└─────────────────────────────────────────────────┘
```

**Competition filter dropdown**: defaults to "Toutes" showing all competitions this team plays. Options:
- Toutes (default)
- [Per primary league] — Botola Pro for Wydad; Premier League for Arsenal
- [Per cup] — Coupe du Trône, FA Cup
- [Per continental] — CAF Champions League, UEFA Champions League
- [Per other] — Club friendlies, regional cups

For national teams: dropdown options are the international competitions the team participates in (WC 2026 qualifying, AFCON, friendlies, etc.).

**Sub-tabs**: `Par date | Par tour` — two sub-tabs (vs Page 3's three; no "Par groupe" since this is one team's matches, not a tournament). Default: "Par date".

Page 3's "Par tour" sub-tab carries over for users navigating by round/matchday rather than calendar date.

**Date navigator**: ‹ Mai 2026 › chevrons + label. Tap label opens month grid (calendar dropdown) — same hybrid pattern as Page 2 round selector.

**Status filter**: not exposed as pills here (different from Sofascore's Finished/Upcoming toggle). Reasoning: showing both past and upcoming matches in chronological order is more useful than forcing the user to toggle. For users who want only finished or only upcoming, "Par tour" sub-tab effectively scopes to a single round which is usually one type.

Fixture rows reuse the locked `FixtureRow` component from Pages 2-3. Three states (upcoming/live/finished), same favourite star, same crest/name/result-badge format.

Tap row → match detail (Page 6). Tap opponent crest/name → opponent team page (Page 4). Tap competition label inside row → that competition's page (Page 2 or 3).

### Card 3 — Recent Form chart (~180-220px) — Page 4 specific

```
┌─ Forme récente ⓘ ────────────────────────────────┐
│                                                 │
│  ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒                       │
│  ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒                       │
│  █ ░ █ ▒ █ █ ▒ █ ░ █ █ ▒                       │
│  █ ░ █ ▒ █ █ ▒ █ ░ █ █ ▒                       │
│  █ ░ █ ▒ █ █ ▒ █ ░ █ █ ▒                       │
│                                                 │
│  ↑ oldest             newest ↑                  │
│                                                 │
│  Survolez les barres pour les scores.           │
└─────────────────────────────────────────────────┘
```

Vertical bar chart, last 10-12 matches across all competitions for this team.

- Bar height encodes match outcome quality (win > draw > loss baseline)
- Bar color: green = win, gray = draw, red = loss
- Hover tooltip: opponent + competition + score + date
- Bars NOT clickable in v1 (tooltip only). Phase 6+ enhancement: bar click → match detail.

Opponent crest strip optional below the bar chart (Sofascore has this; we can include if visual budget allows). For v1: omit, keep card compact.

The chart's "12 most recent matches" mirrors Sofascore's pattern. Configurable per-team via constant `RECENT_FORM_MATCH_COUNT = 12`.

Data source: API-Football `/fixtures?team=X&season=Y` plus filtering and sorting. No new ingestion required — already in our pipeline.

ⓘ info icon top-right shows tooltip explaining the chart: `Forme sur les 12 derniers matchs toutes compétitions confondues. La hauteur des barres reflète le résultat (victoire / nul / défaite).`

### Card 4 — Newsletter (~140px)

Same component as Pages 2-3 newsletter card. Team-specific framing:

```
Recevez les actus de Wydad AC directement.
```

Email input + S'abonner button. Submit → in-place toast (no navigation).

For national-team variant: `Recevez les actus des Lions de l'Atlas directement.`

Implementation deferred to Phase 5+ (newsletter infrastructure decision).

### Cards NOT used on Page 4 vs Pages 2-3

- **POTS race** (Page 2 Card 3): removed. POTS is league-context, not team-context. Top players for THIS team appear in the Players tab "Top joueurs" sub-tab instead.
- **Team of the Week** (Page 2 Card 4): removed. Same reasoning.
- **Tous les groupes en bref** (Page 3 Card 3): removed. Not applicable (this is one team, not a tournament with multiple groups).
- **Featured match algorithm** (clubs): uses form line. (Nationals): uses FIFA ranking. Same selection rules either way.
---

## Section 7 — Center column tabs (~500-520px)

### Tabs row (~48px, NOT sticky)

```
┌──────────────────────────────────────────────────┐
│ Classement ●  Statistiques   Joueurs             │
│ ━━━━━━━━━━                                       │
└──────────────────────────────────────────────────┘
```

Active tab: gold underline, semibold weight. Inactive: gray text, regular weight. ~16px text.

Hash fragment updates on tab change. **3 tabs**:
- Classement (default)
- Statistiques
- Joueurs

Default tab: **Classement**. Reasoning: most frequent return-visit intent ("where does this team sit"). Same default rationale as Page 2.

Media and Details tabs are NOT present (removed per Q-P4-3 decision). Media content surfaces as the Videos section below the 3-column zone. Details content removed entirely — team metadata (coach, stadium, founded) already in hero; transfers/competitions list/team info tiles not in v1 scope (Q-P4-3b).

---

### Tab 1 — Classement (Standings, default)

H2: `Classement — Botola Pro 2025/26`

Renders the full league/competition table with **this team's row highlighted** (gold border or background tint, same treatment Sofascore uses).

#### Competition + Season selectors

```
Compétition: [Botola Pro ▾]   Saison: [25/26 ▾]
```

Default competition: this team's primary league (`primary_league_id`). Other dropdown options: any cup/continental competition this team participates in this season (Coupe du Trône, CAF CL, etc.) — switching displays the standings/group for that competition.

For national teams: dropdown options are the international competitions with standings (WC qualifying group, current AFCON edition group, Nations League). Default: most-current tournament context.

Season selector: defaults to current season. Past seasons available via dropdown (Phase 6+ when historical standings ingestion exists; v1 shows current season only with dropdown disabled).

#### View filter pills

```
[Tous ●]  [Domicile]  [Extérieur]
```

For competitions where `home_away_meaningful: true` (clubs, most leagues): pills filter the table to all/home/away matches.

For competitions where `home_away_meaningful: false` (national-team tournaments at neutral venues): pills hidden.

#### Standings table

Same component as Page 2 Standings table — 10-column structure (`# / Team / P / W / D / L / GD / GLS / Form / Pts`), same sticky header behavior, same form pill click → match detail (Page 6).

This team's row gets visual highlight:
- Background tint (gold 50 stop in light mode, gold 800 stop in dark mode)
- Slightly bolder text in that row
- Sticky vertical scroll position: if user lands on the page and the highlighted row is below the fold, table auto-scrolls to bring it into view

For Botola Pro 2025/26 with Wydad highlighted as 1st:

```
─── Botola Pro 2025/26 ─────────────────────────────────
  #  Équipe              P   W  D  L  GD   GLS    Forme   PTS
🟢 1  Wydad AC           20  14 4  2  +22  35:13  WWLDW   46  ← highlighted
🟢 2  Raja CA            20  13 4  3  +18  32:14  LWDWW   43
   3  Maghreb Fès        20  12 5  3  +14  28:14  WDDWW   41
   4  FAR Rabat          20  11 5  4  +10  26:16  WWLDL   38
   ...
🔴 14 KAC Khouribga      20   4 4 12  -18  14:32  LLDLL   16
🔴 15 RC Oued Zem        20   3 4 13  -22  10:32  DLLLW   13
🔴 16 KAC                20   3 4 13  -25  13:38  LLLLD   13
```

#### Tiebreaker rules accordion

Same component as Page 2. Below the table. Per-competition tiebreaker rules listed.

#### NO Standings Tracker chart

Sofascore shows a Standings Tracker line chart (team position week-by-week across the season) below the tiebreaker rules. **Atlas Kings does not implement this chart on Page 4 (or Page 2).**

Reasoning: API-Football does not provide round-by-round historical standings — only the current snapshot. Recomputing 38 weekly snapshots from `/fixtures` data and storing them would be a meaningful engineering pipeline benefiting only this one visualization. Form column in the table + Recent Form chart in left rail (Section 6 Card 3) deliver equivalent trajectory information.

If we eventually build the historical-standings aggregation pipeline (Phase 6+ enhancement candidate), the chart slot can be added — for v1 launch, the slot does not exist.

#### Empty state

For lower-tier leagues with `standings: false` coverage (Algeria, Tunisia per coverage flags), the Standings tab renders an empty state:

```
Données de classement indisponibles pour cette compétition.
```

Sub-tabs (All/Home/Away) hide. Tiebreaker rules accordion hides. Card structure stays but data slots are empty.

#### National team variant

For Atlas Lions and other national teams, the Standings tab shows the team's group within the current tournament context:

```
H2: Classement — Qualifications WC 2026, Groupe E
```

If multiple tournament contexts are active (qualifying + friendlies + Nations League), the competition selector lets the user switch between them. FIFA ranking displayed as small badge alongside team names. A/H/A pills hidden (national teams play at neutral venues).

If no current tournament context (between cycles), Standings tab renders:

```
Pas de tournoi en cours pour cette sélection.
Prochaine compétition: AFCON 2027 (qualifications à venir).
```

---

### Tab 2 — Statistiques (Statistics)

H2: `Statistiques de la saison`

Comprehensive team statistics organized in 4 categories, mirroring Sofascore's structure but adapted for our Loi 09-08 compliance (no betting-derived stats).

#### Competition + Season selectors

Same as Standings tab. Stats scoped to selected competition + season.

#### Summary tiles row (top, 5 tiles)

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ MATCHS   │ BUTS     │ BUTS     │ ASSISTS  │ NOTE      │
│ JOUÉS    │ INSCRITS │ ENCAISSÉS│          │ MOYENNE   │
│   20     │   35     │   13     │   28     │   7.4 ⓘ   │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

Glanceable headline metrics. Note (rating) ⓘ tooltip explains the rating source: `Note moyenne d'équipe basée sur API-Football, agrégée sur les matchs de la compétition sélectionnée.`

#### 4-category stat blocks (2-column grid below tiles)

**Block 1 — Attaque (Attacking)**: Buts par match, Buts à l'extérieur de la surface, Buts du pied gauche/droit, Buts de la tête, Grosses occasions par match, Tirs par match, Tirs cadrés par match, Tirs hors-cadre par match, Dribbles réussis par match, Corners par match, Coups francs par match, Bois (poteau/transversale), Contre-attaques.

**Block 2 — Passes**: Possession moyenne, Passes réussies (compte + pourcentage), Passes dans la moitié défensive, Passes dans la moitié offensive, Longs ballons réussis, Centres réussis.

**Block 3 — Défense (Defending)**: Cleans sheets, Buts encaissés par match, Tacles par match, Interceptions par match, Dégagements par match, Arrêts par match, Ballons récupérés par match, Erreurs menant à un tir, Erreurs menant à un but, Penalties commis, Dégagement sur la ligne, Dernier tacle.

**Block 4 — Autres (Other)**: Duels gagnés (compte + pourcentage), Duels au sol gagnés, Duels aériens gagnés, Ballons perdus par match, Touches par match, Coups francs adverses par match, Hors-jeu par match, Fautes par match, Cartons jaunes par match, Cartons rouges.

Each stat: label + value + optional unit. Hover ⓘ where ambiguous (e.g., what "big chance" means).

Layout: 2 columns at desktop (Block 1 + Block 2 on left, Block 3 + Block 4 on right). 1 column on mobile.

#### Coverage gating

Stats blocks depend on `statistics_fixtures: true` coverage flag per league per API-Football. Leagues with `false` (Algeria Ligue 1, Tunisia Ligue 1 currently): Stats tab renders empty state:

```
Statistiques détaillées indisponibles pour cette compétition.
Suivez le classement et l'effectif dans les autres onglets.
```

Tab stays present (consistent navigation across all team pages); content is the empty state.

#### Data refresh cadence

Stats refresh post-match (batch update after each finished fixture in the selected competition + season). Caching: 5 minutes server-side.

---

### Tab 3 — Joueurs (Players)

H2: `Effectif et joueurs`

Two sub-tabs: **Effectif** (Squad, default) and **Top joueurs** (Top players).

```
[Effectif ●]  [Top joueurs]
```

#### Sub-tab 1 — Effectif (Squad)

Roster organized by position group. Single view at v1 launch (General data only — no category pills for market value / previous club / contract, per Q-P4-4 decision).

```
─── Attaquants (6) ─────────────────────────────────────
14  [photo]  Mohamed Hamoutim  · 28 ans · 1m83 · ATT  · 🇲🇦 MAR
 9  [photo]  Bouzok            · 26 ans · 1m76 · ATT  · 🇩🇿 ALG
11  [photo]  Reda Slim         · 24 ans · 1m80 · AIL  · 🇲🇦 MAR
...

─── Milieux (8) ────────────────────────────────────────
 8  [photo]  Achraf Dari       · 27 ans · 1m85 · MIL  · 🇲🇦 MAR
...

─── Défenseurs (7) ─────────────────────────────────────
 5  [photo]  Yahya Attiyatallah · 28 ans · 1m82 · DEF  · 🇲🇦 MAR
...

─── Gardiens (3) ───────────────────────────────────────
 1  [photo]  Mehdi Benabid     · 30 ans · 1m92 · G    · 🇲🇦 MAR
...
```

Per row, left to right:
- Squad number badge (small circle, 24×24)
- Player headshot (circular, 40×40)
- Player name (semibold) + position abbreviation (ATT/AIL/MIL/DEF/G)
- Age + height
- Nationality flag emoji + 3-letter country code

Each row → player page (Page 5).

#### Position group ordering

Default: ATT → MIL → DEF → G. Configurable: alternative `goalkeeper_first` flag for editors who prefer the opposite order. (Not exposed in UI; data-side config.)

#### Player status indicators

Inline next to player name, before age:
- `Blessé · [type]` (Injured · Type) — red text
- `Suspendu · [match count]` (Suspended · N matches) — orange text
- `Doutful · [type]` (Doubtful · Type) — yellow text
- `Sélection nationale · [country]` (On international duty) — blue text

Injuries data source: API-Football `/injuries` endpoint. Updates daily.

#### Category pills — NOT shown in v1

Per Q-P4-4 lock: only General view at v1 launch.
- Market value pills: dropped entirely (no data source)
- Previous club pills: deferred Phase 5+ (transfers ingestion required)
- Contract pills: deferred Phase 5+ (contract data coverage incomplete)

When Phase 5+ adds the data, category pills can be re-introduced in this tab.

#### Sub-tab 2 — Top joueurs (Top players)

```
─── Note moyenne (Average rating) ───────────────────
1. [photo] Achraf Dari (MIL)       8.42  (15 matchs)
2. [photo] Mehdi Benabid (G)       8.18  (20 matchs)
3. [photo] Yahya Attiyatallah (DEF) 7.95  (18 matchs)
     [ Voir tous les joueurs notés → ]

─── Buts ───────────────────────────────────────────
1. [photo] Mohamed Hamoutim (ATT)  14
2. [photo] Bouzok (ATT)             9
3. [photo] Reda Slim (AIL)          7
     [ Voir tous les buteurs → ]

─── Passes décisives ───────────────────────────────
1. [photo] Achraf Dari (MIL)        8
2. [photo] Reda Slim (AIL)          6
3. [photo] Bouzok (ATT)             5
     [ Voir tous les passeurs → ]

─── Tirs cadrés par match ──────────────────────────
... (additional leaderboard sections follow)
```

Multiple per-stat leaderboard cards. Each card: top 3 of N for this team in this competition+season. "Voir tous" link routes to that stat's full leaderboard scoped to this competition (Phase 6+ feature page).

Stat categories on this sub-tab:
- Note moyenne (Average Sofascore-style rating)
- Buts (Goals)
- Passes décisives (Assists)
- Tirs cadrés par match (Shots on target per game)
- Dribbles réussis (Successful dribbles)
- Tacles (Tackles)
- Interceptions (Interceptions)
- Cartons jaunes (Yellow cards)
- Cartons rouges (Red cards)

Each player row → player page (Page 5). Each "Voir tous" → Phase 6+ scorers/assists/etc. leaderboard for the competition.

#### Coverage gating

Top players sub-tab requires `statistics_players: true` coverage. For leagues without it, sub-tab renders:

```
Classements joueurs indisponibles pour cette compétition.
```

Effectif (Squad) sub-tab works with `players: true` coverage only (squad rosters are widely available).

---

## Section 8 — Palmarès (Trophies timeline) — below center column, full content width

NEW section at v1 launch, replacing the Details tab's "Titles" subsection content. Sits below the 3-column zone, above the Videos section.

```
┌─ Palmarès ────────────────────────────────────────────────────────────┐
│                                                                       │
│  2022     🏆  CAF Champions League (3ème titre)                       │
│  2021-22  🏆  Botola Pro (22ème titre)                                │
│  2018-19  🏆  Botola Pro (21ème titre)                                │
│  2017     🏆  CAF Champions League (2ème titre)                       │
│  2016-17  🏆  Botola Pro (20ème titre)                                │
│  2015     🥈  CAF Champions League (finaliste)                        │
│  2014-15  🏆  Botola Pro (19ème titre)                                │
│                                                                       │
│  Voir tous les titres →                                               │
└───────────────────────────────────────────────────────────────────────┘
```

H2: `Palmarès` (FR) / `Trophies` (EN) / `الألقاب` (AR).

### Layout

Chronological list (vertical), most recent first. Per entry:
- Year or season label (left, fixed-width column)
- Result icon (🏆 win / 🥈 final / 🥉 semifinal-or-better deep run)
- Competition name + count context (e.g., "22ème titre")

Render styling: simple list, IBM Plex Sans 15px, ~32px per row vertical spacing. No card backgrounds — clean text-only timeline with subtle dividing rules between entries.

### Initial display + expand

Show top 8 entries by default (most recent). "Voir tous les titres →" expands inline showing all entries (or routes to a Phase 6+ team-trophies archive page if list is very long; for Wydad, ~25 total entries — inline expansion sufficient).

### Data source

`historical_titles` field in `teams` table:

```typescript
historical_titles: Array<{
  year: number              // 2022 (for cup wins) or 'season_end_year' (for league wins)
  season_label: string      // "2021-22" for league seasons; "2022" for cups
  competition_id: number
  result_type: 'win' | 'runner_up' | 'semifinal'
  count_at_time: number     // 22 = "22nd league title"
}>
```

Phase 5 ingestion concern — needs historical data not in API-Football's standard endpoints. Sources:
- Manual curation for priority Moroccan clubs (Wydad, Raja, FAR, MAS, KAC) — editorial seeding
- Wikipedia-derived data for European top clubs (UCL/EPL/LaLiga winners are well-documented)
- API-Football `/trophies?team=X` endpoint provides some data (varies by coverage)

Empty state for teams with no trophy data ingested yet:

```
Palmarès en cours de constitution. Suivez Wydad AC pour les prochains titres.
```

### Editorial framing — counts that contextualize

Each entry shows "Xème titre" or similar count context next to the competition. The schematic UX rewards "Xème titre" framing because it conveys magnitude at a glance — "22ème titre" reads more impressively than just "Botola Pro 2021-22". For deep runs (semifinals, finals), no count needed — the result IS the headline.

### National team variant

For Atlas Lions and national teams, this section shows tournament results (wins + notable deep runs), not just wins:

```
─── Palmarès — Lions de l'Atlas ────────────────────────────────────────

  2022  🥉 4ème  Coupe du Monde FIFA (demi-finale historique)
  2022  🥉 4ème  Coupe d'Afrique des Nations (demi-finale)
  2018  🏆 1er   CHAN (Championnat d'Afrique des Nations)
  2012  🏆 1er   Coupe arabe FIFA
  1980  🥈 2ème  Coupe d'Afrique des Nations (finaliste)
  1976  🏆 1er   Coupe d'Afrique des Nations
  1976  🏆 1er   Jeux méditerranéens
```

For national teams, "demi-finale" entries are surfaced because reaching the WC semifinal (Morocco 2022) is among the team's most-defining achievements. Custom rendering per `result_type` field — 'semifinal' result types render as "🥉 4ème" with the achievement context inline.

### Empty/sparse teams

For newly-promoted or smaller clubs with limited trophy history (Botola Pro 2 entrants, regional sides): section renders a sparse list, may show just 1-2 entries plus the empty-state framing. Section visibility threshold: hide entirely if team has zero recorded titles AND `team_type !== 'national_*'` (newly promoted clubs with nothing to display).

---

## Section 9 — Vidéos section (below Palmarès, full content width)

Same component pattern as Page 3 Section 8. YouTube embedded videos via `youtube-nocookie.com`, lazy-loaded facade pattern, hand-curated content.

```
┌─ Vidéos ────────────────────────────────────────────────────────────┐
│                                                                     │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│ │  Thumbnail   │  │  Thumbnail   │  │  Thumbnail   │                │
│ │  [▶ play]    │  │  [▶ play]    │  │  [▶ play]    │                │
│ ├──────────────┤  ├──────────────┤  ├──────────────┤                │
│ │ Wydad vs     │  │ Best of      │  │ Le derby     │                │
│ │ Raja 2022    │  │ Bouzok 2025  │  │ casablancais │                │
│ │ 5:42 · YT    │  │ 8:18         │  │ 12:01        │                │
│ └──────────────┘  └──────────────┘  └──────────────┘                │
│                                                                     │
│  Voir plus →                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

H2: `Vidéos` (FR) / `Videos` (EN) / `فيديوهات` (AR).

### Layout

3-up grid at ≥1280px, 2-up at 768-1279px, 1-column on mobile.

Each card: thumbnail (16:9) + play overlay + title + duration + source/channel.

### YouTube embed implementation

Identical to Page 3 spec:
- `youtube-nocookie.com` domain (no tracking cookies until user interacts) — Loi 09-08 compliance
- `loading="lazy"` on iframes
- `rel=0` + `modestbranding=1` query params
- Facade pattern: render static thumbnail + play button initially; swap to iframe on first user click
- In-place inline playback (no modal in v1; modal upgrade Phase 6+)

### Content curation

`media_youtube_ids: string[]` field per team in `teams` table. Hand-curated for priority teams:
- Botola top clubs (Wydad, Raja, FAR, Maghreb, RS Berkane): 6-10 videos each (historic matches, derby moments, key transfers)
- Atlas Lions: 8-12 videos (WC 2022 highlights, recent friendlies, goal compilations, team intros)
- Atlas Lionesses: 4-6 videos (recent tournaments, key players)
- EPL top clubs (Arsenal, Man City, Liverpool, etc.): 4-6 videos each
- Other clubs: empty arrays until editorial time allows

Editorial cadence: refresh after major matches; quarterly content review.

### Empty state

If `media_youtube_ids` is empty:

```
Vidéos bientôt disponibles. Suivez-nous sur YouTube →
```

Includes Atlas Kings YouTube channel link (Phase 12+ — placeholder URL until channel exists).

### Section visibility

Hides entirely if zero videos AND no YouTube channel link exists.

---

## Section 10 — Right rail (~280-300px)

Fixed 5-widget stack. Same structural pattern as Pages 2-3 right rail. Total rail height ~1500-1700px.

### Widget 1 — Top scorers (~240px)

```
┌─ Buteurs · Botola Pro 25/26 ┐
├─────────────────────────────┤
│ #  Joueur          Buts     │
│ 1  Hamoutim        14       │
│ 2  Bouzok           9       │
│ 3  Slim             7       │
│ 4  Dari             6       │
│ 5  Boutaib          5       │
│                             │
│ Voir tous →                 │
└─────────────────────────────┘
```

Top 5-6 scorers from THIS team in the selected primary competition. Players → player pages (Page 5). "Voir tous →" → tournament-scoped scorers leaderboard (Phase 6+).

For competitions with multi-competition coverage (Wydad plays Botola + Coupe du Trône + CAF CL): widget defaults to primary league. Hover info icon or dropdown selector switches competitions (Phase 6+ enhancement; v1 shows primary league only).

### Widget 2 — Top assists (~240px)

Same structure as Widget 1, scoped to assists. Same routing.

### Widget 3 — MoroccoConnection (~280px) — Page 4 specific

Page 4's distinctive right-rail widget. Adapts per team type and Morocco signal.

**State 1 — Moroccan club (Wydad, Raja, FAR, etc.)**:

```
┌─ Connection marocaine ──────┐
│                             │
│ 🇲🇦 Internationaux dans le   │
│    club                     │
│                             │
│ [photo] Hakimi (ex-Wydad,   │
│         maintenant PSG)     │
│ [photo] Aguerd (ex-Wydad,   │
│         maintenant R. S.)   │
│ [photo] Mokwena (entr.)     │
│                             │
│ Voir tous →                 │
└─────────────────────────────┘
```

For Moroccan clubs, lists historic Moroccan internationals who passed through this club. Distinguishes the club's role in Atlas Lions production.

**State 2 — Non-Moroccan club with Moroccan players in squad**:

```
┌─ Connection marocaine ──────┐
│                             │
│ 🇲🇦 Marocains dans l'effectif│
│                             │
│ [photo] Achraf Hakimi · LD  │
│         3.4M followers      │
│         Capitaine du Maroc  │
│                             │
│ [photo] Noussair Mazraoui   │
│         (de retour de pret) │
│                             │
└─────────────────────────────┘
```

For non-Moroccan clubs with Moroccan players currently in the squad (Hakimi at PSG, Diaz at Bayern, Mazraoui at Man United, En-Nesyri at Fenerbahce, etc.). Each player → player page (Page 5).

**State 3 — Non-Moroccan club with editorial Morocco tie**:

```
┌─ Connection marocaine ──────┐
│                             │
│ 🇲🇦 Liens historiques        │
│                             │
│ • Mahrez (Algérie) a joué   │
│   ici 2014-2018             │
│ • Adversaire de Wydad en    │
│   CAF CL 2017               │
│                             │
└─────────────────────────────┘
```

For non-Moroccan clubs without current Moroccan players but with editorial context (e.g., Leicester City — Mahrez's club). Hand-curated editorial copy.

**State 4 — No Morocco tie (rare)**:

Widget hides entirely. Right rail collapses to 4 widgets. Or, alternative: swap to a generic "Joueurs internationaux" widget showing the squad's marquee internationals from any country.

**National team variant (Atlas Lions)**:

Widget irrelevant — entire roster is Moroccan. Replaces with **"Capitaines récents"** or **"Sélectionneurs récents"** card showing recent national-team captains or coaches with their tenure dates.

### Widget 4 — MoreMatchesToday (~280px)

Same component as Pages 2-3. Cross-competition fixtures today (not necessarily involving this team). Acts as a back-link to homepage's fixture browser.

For days with no other significant fixtures: widget shows "Aucun autre match d'importance aujourd'hui."

### Widget 5 — Newsletter (~140px)

Same component as Pages 2-3. Team-specific framing:
```
Recevez les actus de Wydad AC directement.
```

---

## Section 11 — About card

Long-form keyword-bearing card. 6 H2 sections + 6-8 FAQ entries, hand-written per locale for priority teams.

### Structure for Wydad AC

```
## À propos du Wydad Athletic Club

Le Wydad Athletic Club est un club de football marocain basé à Casablanca, 
fondé le 8 octobre 1937. Connu sous l'abréviation WAC ou simplement le 
Wydad, il est l'un des clubs les plus emblématiques d'Afrique et le plus 
titré du football marocain.

## Histoire et palmarès

Avec 22 championnats du Maroc et 3 victoires en CAF Champions League 
(1992, 2017, 2022), le Wydad domine historiquement le football marocain. 
Le club a également remporté la Coupe du Trône à plusieurs reprises. Son 
derby contre le Raja Club Athletic est l'un des matchs les plus 
emblématiques d'Afrique.

## Effectif actuel et joueurs marquants

L'effectif 2025-26 sous Rulani Mokwena compte des cadres comme Achraf 
Dari, Mehdi Benabid, Mohamed Hamoutim et Yahya Attiyatallah. Le Wydad a 
formé ou révélé de nombreux internationaux marocains, dont Achraf Hakimi 
et Nayef Aguerd qui sont passés par le club avant leurs carrières 
européennes.

## Stade et infrastructure

Le Wydad joue ses matchs à domicile au Stade Mohammed V de Casablanca 
(capacité ~45 000 places), partagé avec son rival le Raja CA. Le centre 
d'entraînement du club se trouve dans la périphérie de Casablanca.

## Le Wydad dans la Coupe du Monde 2026

En tant que club marocain, le Wydad bénéficie de l'élan du Maroc 
co-organisateur de la Coupe du Monde 2026. Plusieurs anciens joueurs du 
WAC font partie de la sélection nationale qui participera à la 
compétition au Stade Hassan II et dans cinq autres villes marocaines.

## Atlas Kings et le Wydad AC

Atlas Kings couvre Wydad AC avec une attention particulière au derby 
casablancais Wydad-Raja, au parcours du club en CAF Champions League, 
aux performances de ses joueurs marocains et à la formation des futurs 
internationaux.

## Questions fréquentes

### Quand a été fondé le Wydad AC ?
Le Wydad Athletic Club a été fondé le 8 octobre 1937 à Casablanca.

### Combien de titres a remporté le Wydad ?
Le Wydad détient 22 championnats du Maroc et 3 CAF Champions League 
(1992, 2017, 2022), ce qui en fait le club le plus titré du pays.

### Où joue le Wydad AC ?
Le Wydad joue au Stade Mohammed V de Casablanca, partagé avec son rival 
le Raja CA, d'une capacité d'environ 45 000 places.

### Qui est l'entraîneur actuel du Wydad ?
Rulani Mokwena est l'entraîneur en chef du Wydad AC pour la saison 2025-26.

### Quand est le prochain Wydad-Raja ?
Le prochain derby Wydad-Raja est prévu pour le 23 mai 2026 dans le cadre 
de la Botola Pro J21.

### Quels joueurs marquants sont passés par le Wydad ?
Achraf Hakimi (PSG), Nayef Aguerd (Real Sociedad), Yahya Jabrane, Salaheddine 
Saidi et de nombreux internationaux marocains. Le Wydad est traditionnellement 
un fournisseur clé de la sélection marocaine.

### Comment regarder les matchs du Wydad ?
Les matchs de Botola Pro sont diffusés sur Arryadia TV; les matchs de 
CAF Champions League sur BeIN Sports.

### Le Wydad participe-t-il à la CAF Champions League 2025-26 ?
Oui, le Wydad est en demi-finale de la CAF Champions League 2025-26 et 
affronte les Mamelodi Sundowns le 03 mai.
```

### Atlas Lions variant

About card structure for national-team variant adapts:

```
## À propos des Lions de l'Atlas

La sélection marocaine masculine de football, surnommée les Lions de 
l'Atlas, représente le Royaume du Maroc dans les compétitions 
internationales. Affiliée à la FRMF (fédération fondée en 1955) et à la 
CAF, l'équipe est entraînée par Walid Regragui depuis 2022.

## Histoire et palmarès

Le Maroc a marqué l'histoire du football mondial en atteignant la 
demi-finale de la Coupe du Monde FIFA 2022 — première équipe africaine 
et arabe à y parvenir. La sélection a remporté la CAN en 1976, la Coupe 
arabe FIFA en 2012, et le CHAN en 2018 et 2020.

## Coupe du Monde 2026

Le Maroc est co-organisateur de la Coupe du Monde FIFA 2026 (avec les 
États-Unis, le Canada et le Mexique) et participe dans le Groupe C aux 
côtés de l'Argentine (tenant du titre), l'Arabie saoudite et l'Égypte. 
Six villes marocaines accueillent des matchs.

## Sélectionneur et staff

Walid Regragui dirige la sélection depuis 2022, après avoir guidé l'équipe 
en demi-finale de la WC 2022. Il succède à Vahid Halilhodžić. L'effectif 
type combine talents domestiques (Botola Pro) et joueurs évoluant en 
Europe.

## Marocains à l'étranger

L'effectif des Lions est principalement composé de joueurs évoluant en 
Europe: Achraf Hakimi (PSG), Brahim Diaz (Bayern), Noussair Mazraoui 
(Manchester United), Youssef En-Nesyri (Fenerbahce), Sofyan Amrabat 
(Real Betis), Nayef Aguerd (Real Sociedad), entre autres. Les talents 
domestiques en Botola Pro complètent la sélection.

## Atlas Kings et les Lions de l'Atlas

Atlas Kings couvre les Lions de l'Atlas avec une attention particulière 
au parcours vers la WC 2026, aux qualifications AFCON et WC, aux 
Marocains à l'étranger, et aux talents émergents du football marocain.

## Questions fréquentes

### Dans quel groupe est le Maroc à la Coupe du Monde 2026 ?
Le Maroc est dans le Groupe C avec l'Argentine, l'Arabie saoudite et 
l'Égypte.

### Qui est le sélectionneur du Maroc ?
Walid Regragui est le sélectionneur de la sélection marocaine depuis 
2022.

### Quel est le classement FIFA du Maroc ?
Le Maroc est actuellement #14 au classement FIFA mondial.

### Comment le Maroc s'est-il qualifié à la WC 2026 ?
Le Maroc est qualifié d'office en tant que pays co-organisateur de la 
Coupe du Monde 2026.

### Quels Marocains à l'étranger jouent pour la sélection ?
Achraf Hakimi (PSG), Brahim Diaz (Bayern), Noussair Mazraoui 
(Manchester United), Youssef En-Nesyri, Sofyan Amrabat, Nayef Aguerd, 
entre autres.

### Quelle a été la meilleure performance du Maroc en Coupe du Monde ?
Demi-finale (4ème place) à la WC 2022 au Qatar — meilleure performance 
historique d'une équipe africaine ou arabe.

### Quand le Maroc a-t-il remporté la Coupe d'Afrique des Nations ?
Le Maroc a remporté la CAN en 1976. La sélection a atteint la 
demi-finale en 2022 et la finale en 1980.

### Comment regarder les Lions de l'Atlas ?
Les matchs des Lions sont diffusés sur Arryadia TV et SNRT (chaînes 
publiques marocaines).
```

Per-locale variants. Arabic uses passionate fan-aligned tone per the keyword analysis. The "أسود الأطلس" term used prominently.

### Data source

About card content lives in `teams` table per team entry:

```typescript
about_fr: {
  intro: string,
  history: string,
  players: string,
  venue: string,           // for clubs; for national teams: "wc_2026" or current tournament context
  morocco_section: string, // for non-Moroccan clubs: optional Morocco tie editorial
  editorial: string,
  faqs: Array<{ q: string, a: string }>
}
about_en: { ... }
about_ar: { ... }
```

Hand-written for priority teams; templated for the rest.

---

## Section 12 — Live data and caching

### Pusher subscriptions on this page

| Element | Pusher channel | Update cadence |
|---|---|---|
| Adaptive top strip (Mode 1 countdown / Mode 2 LIVE) | (global, not team-specific) | per-event |
| Hero status descriptor | `team-{id}-state` | match-end transitions |
| Hero Previous/Next match cards | `fixture-{id}` for each shown match | per-event |
| Featured match card (left rail) | `fixture-{id}` of selected fixture | per-event |
| Matches list — live rows | `fixture-{id}` for each visible live match | per-event |
| Standings table — affected rows | `competition-{id}-standings` | round-end (or per-match if live in this league) |
| Stats tab content | `team-{id}-stats` | post-match (batch) |
| Players tab Top players sub-tab | `competition-{id}-leaderboards` | post-match (batch) |
| Recent Form chart (left rail) | `team-{id}-form` | match-end |
| MoroccoConnection widget | `team-{id}-squad` | weekly (transfer-related changes); daily sanity check |
| Top scorers / assists widgets | `competition-{id}-leaderboards` | post-match |

### Server-side caching

| Element | TTL |
|---|---|
| Hero (non-live) | 60s |
| Hero (any live match for this team) | 0s |
| Matches list | 60s when no live; 0s when live |
| Standings table | 60s when no live in selected competition; 0s when any live |
| Stats tab | 5 min |
| Players tab Effectif | 24 hours (squad changes are rare) |
| Players tab Top joueurs | 5 min |
| Recent Form chart | 60s when no live; 5 min otherwise |
| MoroccoConnection widget | 24 hours (relationships rarely change mid-season) |
| Palmarès section | 24 hours (historical data; only refreshes when new title added) |
| Videos section | 24 hours |
| About card | 24 hours (manually edited content) |
| MoreMatchesToday widget | 60s |

Hero state transitions (kickoff, FT, etc.) invalidate cache immediately for affected elements.

---

## Section 13 — Mobile (375px)

### Single-column stacked layout

```
[ADAPTIVE TOP STRIP ~40px]
[TOPBAR ~56px condensed]    ← [≡] [Atlas Kings] 🔍 EN ☾
[SEO breadcrumb ~22px, compact]
[HERO — mobile condensed ~360-400px]
  Crest 64×64 + name + country + league + founded + coach + stadium
  Previous match card (full width)
  Next match card (full width, stacked below)
  Intro paragraph
[FEATURED MATCH CARD]
[TABS row]
  Classement ● Statistiques Joueurs
[H2 inside active tab]
[ACTIVE TAB CONTENT]
[MATCHES LIST]                     ← from left rail
[RECENT FORM CHART]                ← from left rail
[TOP SCORERS WIDGET]               ← from right rail
[TOP ASSISTS WIDGET]               ← from right rail
[MOROCCOCONNECTION CARD]           ← from right rail
[NEWSLETTER]                       ← from rails
[MORE MATCHES TODAY]               ← from right rail
[PALMARÈS SECTION]                 ← stacked timeline
[VIDÉOS SECTION]                   ← 1-column video stack
[ABOUT CARD — full content]
[FOOTER vertical stack]
[FIXED BOTTOM TAB BAR ~56px]
```

### Mobile hero — Previous/Next match cards stacked

The side-by-side desktop layout (Sub-zone C) stacks to two full-width cards on mobile:

```
[Previous match card — full width, ~80px]
[Next match card — full width, ~80px]
```

Hero height on mobile: ~360-400px (taller than desktop due to stacked match cards + stacked identity line wrapping).

### Mobile Players tab — position groups collapsed by default

To prevent very long single-screen scroll, position groups (Attaquants, Milieux, Défenseurs, Gardiens) render collapsed by default on mobile:

```
[Attaquants (6) ▾]
[Milieux (8) ▾]
[Défenseurs (7) ▾]
[Gardiens (3) ▾]
```

Tap chevron expands one group at a time (other groups remain collapsed). User can expand multiple if desired.

Desktop: all groups expanded by default. Mobile: collapsed for navigability.

### Mobile Palmarès section

Stacks as a chronological list (same as desktop, just narrower). "Voir tous" expansion inline.

---

## Section 14 — All locked decisions summary

| Element | Decision |
|---|---|
| Page identity | Team page family. Wydad AC canonical for clubs. Atlas Lions canonical for national-team variant. Single schematic + Format Variants subsection (Section 18). |
| URL canonical | `/[locale]/equipe/[country]/[team-slug]` |
| URL — `/equipe/` segment | Not translated; same across all locales |
| URL — national team slug pattern | `equipe-nationale` / `national-team` / `المنتخب-الوطني` (consistent across all countries) |
| Tab state | Hash fragments per locale (`#classement` / `#statistiques` / `#joueurs`) |
| hreflang | All three locale variants reference each other; `x-default` → FR |
| Hero | Hybrid: horizontal data-rich identity strip (Pages 2-3 pattern) + Previous/Next match snapshot sub-zone + intro paragraph. ~280px height. No gradient, no Fraunces, no edition pills carousel. |
| H1 | Team name (+ optional nickname for national teams), IBM Plex Sans 32px semibold |
| Sticky mini-header on scroll | Deferred Phase 6+ — not in v1 |
| Intro paragraph | Keyword-loaded 30-50 words per locale, hand-written for priority teams |
| Center column tabs | 3 tabs: Classement (default) / Statistiques / Joueurs. Media removed; videos below 3-column zone. Details removed entirely. |
| Standings tab | Full league/competition table with this team's row highlighted. Competition + season selectors. All/Home/Away pills (gated by `home_away_meaningful`). Tiebreaker rules accordion. **NO Standings Tracker chart** (API-Football data limitation). |
| Statistics tab | 4-category stat blocks (Attaque/Passes/Défense/Autres) + 5 summary tiles. Coverage-gated by `statistics_fixtures`. |
| Players tab | Two sub-tabs: Effectif (squad by position) + Top joueurs (per-stat leaderboards). General-only view at v1; market value/previous club/contract pills deferred Phase 5+. |
| Left rail | 4 cards: Featured match → Matches list (Par date/Par tour) → Recent Form chart (last 12 matches) → Newsletter |
| Right rail | 5 widgets: Top scorers / Top assists / MoroccoConnection / MoreMatchesToday / Newsletter |
| MoroccoConnection card | 4 state variants per team type (Moroccan club / non-Moroccan with players / non-Moroccan with editorial tie / national team). |
| FIFA ranking display | Shown for national-team variant (badge alongside team names). Hidden for clubs. Gated by `fifa_ranking_applicable`. |
| Featured match (left rail Card 1) | Form line for clubs; FIFA ranking comparison for national teams. Replaces Sofascore odds (Loi 09-08). |
| Recent Form chart | Build for v1 as left rail Card 3. Bar chart, last 12 matches across all competitions. Bar color: green/gray/red. Hover tooltips with scores. Bars not clickable in v1. |
| Palmarès | Standalone section below center column, full content width. Chronological timeline, most recent first. Top 8 shown by default + "Voir tous" expansion. For national teams: include deep-run results (semis, finals) not just wins. |
| Vidéos | Standalone section below Palmarès. Same component as Page 3. YouTube `youtube-nocookie.com` + facade lazy-load. Hand-curated `media_youtube_ids`. |
| Manager / coach destination | Reserved URL `/[locale]/entraineur/[slug]`, deferred Phase 6+. Manager name on team page = non-clickable text in v1. |
| Stadium / venue destination | Reserved URL `/[locale]/stade/[slug]`, deferred Phase 6+. Stadium name on team page = non-clickable text in v1. |
| About card | Bottom of page. 6 H2 sections + 6-8 FAQ. Hand-written per locale for priority teams. Morocco section explicitly included for non-Moroccan clubs with Morocco ties. |
| Live data | Pusher per-fixture for live matches; team-state for status transitions; competition-standings round-end |
| Caching | 60s standings non-live / 0s live / 5min stats / 24h squad / 24h palmarès / 24h about |
| Mobile (375px) | Single-column stack. Hero match cards stack vertically. Players tab position groups collapsed by default. |
| Compliance | Loi 09-08 (no odds anywhere — form line / FIFA ranking replaces Sofascore odds); YouTube via youtube-nocookie.com; no Sign In until Phase 10 |
| Placeholder content | Real Wydad AC seed data for canonical instance. Atlas Lions seed data for national-team variant. Arsenal data used as Sofascore reference (richer coverage in API-Football). |

---

## Section 15 — Component inventory for Phase 4.5 implementation

### New components to build (Page 4 specific)

| Component | Location | Reuse on other pages |
|---|---|---|
| TeamPageHeader | src/components/team/TeamPageHeader.tsx | Page 4 only |
| MatchSnapshotCard | src/components/team/MatchSnapshotCard.tsx | Page 4 (Previous + Next sub-zone) |
| StandingsTabWithHighlight | src/components/team/StandingsTabWithHighlight.tsx | Page 4 (extends Page 2 StandingsTab) |
| TeamStatisticsTab | src/components/team/TeamStatisticsTab.tsx | Page 4 |
| StatBlock | src/components/team/StatBlock.tsx | Page 4 (used 4x in stats tab) |
| StatSummaryTile | src/components/team/StatSummaryTile.tsx | Page 4 (5x in stats tab) |
| PlayersTab | src/components/team/PlayersTab.tsx | Page 4 (with Effectif + Top joueurs sub-tabs) |
| SquadByPosition | src/components/team/SquadByPosition.tsx | Page 4 (Effectif sub-tab) |
| PlayerRosterRow | src/components/team/PlayerRosterRow.tsx | Page 4 (and reusable on Page 5 for "Effectif" cross-references) |
| TopPlayersLeaderboards | src/components/team/TopPlayersLeaderboards.tsx | Page 4 (Top joueurs sub-tab) |
| RecentFormChart | src/components/team/RecentFormChart.tsx | Page 4 (left rail Card 3) |
| PalmaresTimeline | src/components/team/PalmaresTimeline.tsx | Page 4 (below center column) |
| MoroccoConnectionCard | src/components/widgets/MoroccoConnectionCard.tsx | Page 4 right rail Widget 3 (4 state variants) |
| FifaRankingBadge | src/components/shared/FifaRankingBadge.tsx | Page 3 + Page 4 (national teams) + Page 6 (national-team fixtures) |
| TeamAboutCard | src/components/team/TeamAboutCard.tsx | Page 4 (extends Page 2/3 AboutCard with team-specific content) |

### Reused from Pages 2-3 (no changes needed)

- InnerPageShell
- FixtureRow (used in Featured card + Matches list + Match Snapshot Cards)
- VideosSection (from Page 3, identical implementation)
- YouTubeFacade (from Page 3)
- AboutCard structure
- FAQList
- StructuredDataInjector (with SportsTeam variant)
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

### Database schema additions required

```typescript
// teams table additions
team_type: 'club' | 'national_men' | 'national_women' | 'national_youth_u23' | 'national_youth_u17'
country_code: string
founded_year: number
coach_id: number
home_venue_id: number | null
primary_league_id: number | null
fifa_ranking: number | null
fifa_ranking_applicable: boolean
nickname_fr / nickname_en / nickname_ar: string | null
historical_titles: jsonb
media_youtube_ids: string[]
about_fr / about_en / about_ar: jsonb

// New tables (Phase 6+ population)
coaches: { id, name, nationality_code, image_url, ... }
venues: { id, name, city_id, capacity, country_code, ... }
```

`coaches` and `venues` tables can be NULL-foreign-key from `teams` at v1 launch; Phase 6+ enrichment ingests them when manager/stadium pages ship.

---

## Section 16 — Open questions for Phase 4.5 implementation

| Question | Owner | Decision target |
|---|---|---|
| MatchSnapshotCard hover/tap states — match-detail navigation also via crest, or only via card body? | UX | 4.5a |
| Standings tab — auto-scroll behavior to highlighted row: instant or smooth scroll? | UX | 4.5a |
| Players tab — Effectif sub-tab on mobile: collapsed-by-default or expanded-with-anchor-jump? | UX | 4.5a |
| Recent Form chart — exactly 12 matches across all competitions, or 12 in primary league only? | Product | 4.5a |
| MoroccoConnection card state-2: how many Moroccan players surface (max 3? max 5?) | UX | 4.5b |
| Palmarès — "Voir tous" threshold (8 default → expand; or paginate?) | UX | 4.5b |
| YouTube videos curation cadence | Editorial | 4.5b |
| Top scorers/assists widget — show multiple competitions or primary league only? Editorial choice. | Product | Phase 5 |
| Featured match card — exact algorithm priority when this team has both a live league match AND an upcoming continental cup tie | Product | 4.5a |
| About card morocco_section for non-Moroccan clubs — hide entirely if no Morocco tie, or show generic editorial framing? | Editorial | 4.5b |
| Players tab Top joueurs — how many per-stat leaderboards (just 3-4 essentials, or all 9 categories?) | UX | 4.5b |

---

## Section 17 — Differences from Sofascore Arsenal reference

| Element | Sofascore | Atlas Kings |
|---|---|---|
| URL structure | `/football/team/arsenal/42` (trailing ID, /football root) | `/[locale]/equipe/[country]/[team-slug]` (locale-translated slugs, no trailing ID) |
| Locale handling | One URL (English-dominant) | Locale-translated slugs with hreflang bridges |
| Hero | Split layout: identity LEFT, match snapshot cards RIGHT | Stacked layout: identity row TOP + match snapshot row BELOW. Cleaner at 1280px floor; cleaner mobile flow. |
| Sticky mini-header on scroll | Present (crest + name + favourite toggle) | Deferred Phase 6+ — avoids visual stacking with already-sticky topbar |
| Center column tabs | 5 tabs (Standings/Statistics/Players/Details/Media) | 3 tabs (Classement/Statistiques/Joueurs). Details removed entirely; Media → Videos section below tabs. |
| Default tab | Standings | Classement (same — both default to standings for return-visit utility) |
| Standings Tracker chart | Present (line chart of team position week-by-week) | NOT PRESENT. API-Football does not provide round-by-round historical standings. Form column + Recent Form chart (left rail) deliver equivalent trajectory information. |
| Players Squad category pills | 4 pills (General/Market value/Previous club/Contract) | General-only at v1. Market value dropped entirely (no data source). Previous club + Contract deferred Phase 5+. |
| Featured match card odds row | bet365 odds (1/X/2) | Form line WWLDW (clubs) or FIFA ranking comparison (national teams). Loi 09-08. |
| Sofascore Fantasy promo card | Present | NOT present — out of scope per CLAUDE.md Rule 11 |
| Sofascore Analyst /upgrade promo | Present | NOT present — no premium tier in v2 |
| Gambling disclaimer notice | Present below ad unit | NOT present — Loi 09-08, no betting content to disclaim |
| Standings ad slot at ≥1344px | Ad unit | Replaced with editorial widgets (Top scorers / assists / MoroccoConnection / MoreMatchesToday / Newsletter) |
| Manager/coach page | Dedicated `/football/manager/[name]/[id]` page | Page deferred Phase 6+. Manager name on team page = non-clickable text in v1. URL `/[locale]/entraineur/[slug]` reserved. |
| Stadium/venue page | Dedicated `/venue/[country]/[name]/[id]` page | Page deferred Phase 6+. Stadium name on team page = non-clickable text in v1. URL `/[locale]/stade/[slug]` reserved. |
| Details tab content | Titles + Competitions + Latest transfers + Info + About SEO | Removed entirely. Titles → Palmarès section below center column. Competitions → not in v1 (folded into About card if needed). Transfers → deferred (no clean data source for all leagues). Info → hero. About SEO → About card at bottom. |
| Latest transfers section | Two-column Arrivals/Departures with player photos and fees | NOT present. API-Football transfer coverage varies; data not consistent enough for v1. Phase 6+ enhancement candidate. |
| Embed button on Standings | Present (opens embed-code modal) | NOT present in v1. Phase 12+ syndication feature. |
| Recent Form chart in left rail | Vertical bar chart of last ~12 matches | YES — same component pattern. Page 4 specific addition (Pages 2-3 don't have it). |
| Match snapshot Previous + Next in hero | Side-by-side cards in right half of hero | Stacked sub-zone below identity row (same content, different layout) |
| FIFA ranking display | Mentioned in match detail prematch info card | Surfaced in Page 4 hero (national-team variant) and in fixtures/match contexts. Gated by `fifa_ranking_applicable`. |
| About SEO at bottom | Short paragraph | Long-form 6 H2 sections + 6-8 FAQ. Hand-written. Morocco section explicitly included where applicable. |
| Trophies / Titles display | "Titles" section in Details tab | Standalone Palmarès section below center column. Chronological timeline, not a grid. Includes deep-run results for national teams. |

---

## Section 18 — Format variants

Atlas Kings Page 4 template canonically documents Wydad AC (club). The same template adapts for national teams. This section documents national-team deltas from the canonical club spec.

### Variant — National team (Atlas Lions reference)

**Applies to**: All national selections — Atlas Lions (men's senior), Atlas Lionesses (women's senior), Morocco U-23, Morocco U-17. Same structure applies to any country's national teams covered by the platform.

**Key reference**: Atlas Lions — Morocco men's senior national team.

**Deltas from Wydad AC canonical**:

| Element | Wydad AC (club canonical) | Atlas Lions (national team variant) |
|---|---|---|
| `team_type` | `club` | `national_men` (or `national_women`, etc.) |
| URL slug | `wydad-ac` | `equipe-nationale` (FR) / `national-team` (EN) / `المنتخب-الوطني` (AR) |
| H1 | Team name only | Team name + nickname inline: "Maroc — Lions de l'Atlas" |
| Hero identity sub-zone | Crest + league + founded + coach + stadium | Federation badge + FIFA ranking badge + federation founded + selectionneur (no permanent stadium) |
| Hero country line | `🇲🇦 Maroc · Botola Pro · Fondé en 1937` | `🇲🇦 Maroc · CAF · Fédération fondée en 1955` |
| Hero coach line | `Coach: Rulani Mokwena · Stade Mohammed V (45 000)` | `Sélectionneur: Walid Regragui · Stades multiples` |
| FIFA ranking badge | Hidden | Shown next to team name in hero, in MatchSnapshot cards, in Standings table rows |
| Previous/Next match | Domestic + cups + continental fixtures | International windows: WC qualifying, AFCON, friendlies, Nations League |
| Featured match card (left rail) | Form line WWLDW vs LWDWW | FIFA ranking comparison (`FIFA: #14 vs #1`) |
| Standings tab content | League table (Botola Pro) | Current tournament group standings (WC qualifying group, AFCON group, etc.) |
| Standings A/H/A sub-tabs | Shown (clubs play home/away) | Hidden (national teams play at neutral venues mostly) |
| Standings tab between tournaments | Always shows current league | Empty state: "Pas de tournoi en cours. Prochaine compétition: ..." |
| Statistics tab | Per-competition stats | Stats from recent competitive matches (qualifiers + friendlies + tournaments) |
| Players tab Effectif | Current full club roster (25-30 players) | Current call-up for the international window (23-26 players) + recent caps list |
| Players tab Top joueurs | Per-competition leaderboards | Per-recent-window leaderboards |
| Right rail Widget 3 MoroccoConnection | 4 state variants per club type | Replaced entirely: "Capitaines récents" or "Sélectionneurs récents" card showing recent captains/coaches with tenure dates |
| Right rail Widget 4 MoreMatchesToday | Cross-competition fixtures today | International fixtures only (or scoped to today's relevant tournament window) |
| Palmarès section | Club trophy wins + cup wins + continental wins | Tournament results: wins + notable deep runs (WC 2022 4th place, AFCON 2022 4th place). Custom rendering for `result_type: 'semifinal'` |
| Videos section | Club highlights + key matches + player intros | National team highlights + WC 2022 retrospectives + Atlas Lions team intros + match-day clips |
| About card sections | History/Players/Venue/Editorial/FAQs | History/WC 2026 section/Selectionneur/Marocains à l'étranger/Editorial/FAQs |
| About card morocco_section | For non-Moroccan clubs: Morocco tie editorial | N/A — entire entity IS Morocco |

All other elements (URL pattern structure, SEO machinery, page header overall shape, intro paragraph, mobile layout, caching strategy) remain identical.

### Cross-country national teams (non-Moroccan)

For Argentina, France, England, etc. national team pages: same template, same variant adaptations. The MoroccoConnection card adapts:

| Country | Right rail Widget 3 |
|---|---|
| Morocco (Atlas Lions) | Capitaines récents / Sélectionneurs récents |
| Argentina | Marocains liés (if any historical connection: opponent in WC 2022, friendly opponent, etc.) OR generic "Sélectionneurs récents" |
| Other countries | Same pattern — Morocco tie if exists; otherwise generic captain/coach card |

### Women's national teams (Atlas Lionesses)

Same variant rules as men's national teams, with these specifics:
- Slug: `equipe-nationale-feminine`
- Competition context: WAFCON, Olympic Games Women, WC Women, friendlies
- Squad data: typically smaller scope in API-Football; coverage flag check matters more
- About card focuses on rapid rise of Moroccan women's football and WAFCON 2022 final / 2024 results

### Youth selections (Morocco U-23, U-17, etc.)

Same variant rules with sparser data:
- Tournament context: AFCON U-23, U-17 World Cup, Olympic Games (U-23 men only)
- Squad data often limited
- Trophies sparse — schematic supports sparse Palmarès gracefully
- About card emphasizes development pipeline angle

---

## Section 19 — Outbound link targets

Every clickable destination on the page (Wydad AC canonical instance). Documented against the spec (Sections 4-13), not extrapolated.

Routes documented per the patterns established in Pages 1-3. Phase 6+ deferred-affordance rule applies (render as non-clickable text until destination page ships).

### Category 1 — Routes to existing Pages 1-7

**Inherited chrome (per Section 4)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Topbar — all items | Per homepage Section 16 | Pages 1-7 | Per topbar routing |
| SeoBreadcrumb segment 1 ("Football") | Homepage | Page 1 | `/fr` |
| SeoBreadcrumb segment 3 (current league/competition) | Competition page | Page 2 or 3 | `/fr/competition/[country]/[slug]` |
| SeoBreadcrumb segment 4 (current team name) | Current page (non-clickable) | — | — |
| Footer — all links | Per homepage Section 16 | Pages 1-7 | Per footer routing |
| Mobile bottom tab bar — Matchs | Homepage | Page 1 | `/fr` |

**Hero (per Section 5)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Crest, H1, nickname | Non-clickable (page identity) | — | — |
| Country flag + country name (Sub-zone A line 1) | Country index page (Phase 6+ deferred) | — | (reserved) |
| League name in identity line | That league's page | Page 2 | `/fr/competition/[country]/[slug]` |
| Coach name | Manager page (Phase 6+ deferred — non-clickable in v1) | — | (reserved) |
| Stadium name | Stadium page (Phase 6+ deferred — non-clickable in v1) | — | (reserved) |
| Stadium capacity in parentheses | Non-clickable label | — | — |
| FIFA ranking badge (national-team variant) | FIFA rankings page (Phase 6+) | — | `/fr/classements/fifa` |
| Edition selector slot (Sub-zone B) | Empty in v1, reserved for Phase 10 FAVOURITE | — | — |
| Previous match card (entire card) | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Previous match card — opponent crest/name | Opponent team page | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| Previous match card — competition label | Competition page | Page 2 or 3 | `/fr/competition/[country]/[slug]` |
| Next match card (entire card) | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Next match card — opponent crest/name | Opponent team page | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| Next match card — competition label | Competition page | Page 2 or 3 | `/fr/competition/[country]/[slug]` |
| Intro paragraph | Non-clickable prose | — | — |

**Left rail (per Section 6)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Card 1 Featured match — anywhere | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Card 1 — team crests/names | Team pages | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| Card 1 — competition label | Competition page | Page 2 or 3 | `/fr/competition/[country]/[slug]` |
| Card 2 Matches — fixture row | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Card 2 — opponent crest in row | Opponent team page | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| Card 2 — competition label in row | Competition page | Page 2 or 3 | `/fr/competition/[country]/[slug]` |
| Card 2 — favourite star ☆ | Toggle favourite (stub until Phase 10) | — | — |
| Card 2 — competition filter dropdown | In-card filter change | — | — |
| Card 2 — Par date/Par tour toggle | In-card filter | — | — |
| Card 2 — date navigator chevrons + label | In-card state change | — | — |
| Card 2 — "Voir tous les matchs →" | Same page Matches list scrolled / no destination | — | — |
| Card 3 Recent Form chart — bar | Non-clickable in v1 (hover tooltip only). Phase 6+: match detail | — | (Phase 6+ enhancement) |
| Card 3 — ⓘ info icon | Tooltip (no navigation) | — | — |
| Card 4 Newsletter — submit | In-place toast | — | — |

**Center column tabs row (per Section 7)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Tab change (Classement / Statistiques / Joueurs) | Same page, hash fragment update | — | `#classement`, `#statistiques`, `#joueurs` |

**Standings tab (per Section 7)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Competition selector dropdown | In-tab competition switch | — | — |
| Season selector dropdown | In-tab season switch (Phase 6+ historical) | — | (Phase 6+) |
| All/Home/Away pills | In-tab state change | — | — |
| Team row (other teams) | Other team page | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| Team row (this team, highlighted) | Non-clickable (current page) | — | — |
| Form pill (W/D/L) | Match detail of that result | Page 6 | `/fr/match/[match-slug]` |
| Tiebreaker rules accordion | In-tab expand/collapse | — | — |
| Qualification legend dots | Non-clickable labels | — | — |

**Statistics tab (per Section 7)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Competition + season selectors | In-tab state changes | — | — |
| Summary tiles (matchs, buts, etc.) | Non-clickable | — | — |
| Stat block sub-headings | Non-clickable | — | — |
| ⓘ info icons on stat tiles | Tooltip (no navigation) | — | — |

**Players tab (per Section 7)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Effectif / Top joueurs sub-tabs | In-tab state change | — | — |
| Player row (squad) | Player page | Page 5 | `/fr/joueur/[player-slug]` |
| Player photo (squad) | Player page | Page 5 | `/fr/joueur/[player-slug]` |
| Player status indicator (Blessé/Suspendu/Doutful) | Non-clickable label (tooltip optional) | — | — |
| Top joueurs — player row in leaderboard | Player page | Page 5 | `/fr/joueur/[player-slug]` |
| Top joueurs — "Voir tous →" per leaderboard | Tournament-scoped leaderboard | Phase 6+ feature page | `/fr/classements/[stat]/[competition-slug]` |
| Position group headers (Attaquants/Milieux/etc.) | Non-clickable / collapse-toggle on mobile | — | — |

**Palmarès section (per Section 8)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Trophy entry — competition name | Competition page | Page 2 or 3 | `/fr/competition/[country]/[slug]` |
| Trophy entry — year/season label | Non-clickable (date label) | — | — |
| "Voir tous les titres →" | Inline expansion (Phase 4.5); team-trophies archive Phase 6+ | — | (reserved) |

**Videos section (per Section 9)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Video facade thumbnail | Inline iframe swap (in-place YouTube playback) | — | — |
| Video card title | Same as thumbnail click | — | — |
| "Voir plus →" | Inline grid expansion (Phase 4.5); Phase 6+ video page when expansion exceeds N | — | (reserved) |
| Empty state YouTube channel link | External (Phase 12+) | — | External |

**Right rail (per Section 10)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Widget 1 Top scorers — header | Standings or Stats tab (this team's primary league) | Page 2 | `/fr/competition/[country]/[slug]#stats` |
| Widget 1 — player row | Player page | Page 5 | `/fr/joueur/[player-slug]` |
| Widget 1 — "Voir tous →" | Tournament-scoped scorers leaderboard | Phase 6+ feature page | `/fr/classements/buteurs/[competition-slug]` |
| Widget 2 Top assists — same pattern | Player page / Phase 6+ leaderboard | Page 5 / Phase 6+ | `/fr/joueur/[player-slug]` / `/fr/classements/passeurs/[competition-slug]` |
| Widget 3 MoroccoConnection — player rows | Player pages | Page 5 | `/fr/joueur/[player-slug]` |
| Widget 3 — "Voir tous →" | Phase 6+ filter page (Moroccan players by criteria) | — | (reserved) |
| Widget 4 MoreMatchesToday — fixture | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Widget 4 — competition name | Competition page | Page 2 or 3 | `/fr/competition/[country]/[slug]` |
| Widget 5 Newsletter — submit | In-modal confirmation toast | — | — |

**About card (per Section 11)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Entity name in body copy (team names, player names, competitions, stadiums, coaches) | Corresponding entity pages where shipped; non-clickable text where Phase 6+ deferred | Pages 2-5 | Per entity URL |
| Internal anchor links | Same page hash scroll | — | — |
| FAQ entity references | Corresponding entity pages | Pages 2-5 | Per entity URL |

### Category 2 — In-page interaction (no navigation)

Summary of types (all marked with em-dashes in Category 1):

- All tab changes (hash fragment update only)
- Competition + season selectors in Standings and Statistics
- All sub-tabs and filter pills
- Date navigator in Matches list
- Status indicators on player rows (tooltip only)
- Position group collapse/expand on mobile
- All accordions (tiebreaker rules, "Voir plus" expansions)
- Video facade clicks (swap to iframe)
- Newsletter form submission

### Category 3 — Routes to Phase 6+ feature pages

| Click source | Reserved URL | Phase |
|---|---|---|
| Hero country flag/name | `/[locale]/pays/[country-slug]` | Phase 6+ — render as non-clickable text until shipped |
| Hero coach name | `/[locale]/entraineur/[slug]` | Phase 6+ — render as non-clickable text until shipped |
| Hero stadium name | `/[locale]/stade/[slug]` | Phase 6+ — render as non-clickable text until shipped |
| Hero FIFA ranking badge (national teams) | `/[locale]/classements/fifa` | Phase 6+ |
| SeoBreadcrumb confederation/country segment | `/[locale]/pays/[country-slug]` or `/[locale]/confederation/[slug]` | Phase 6+ |
| Right rail Widget 1 "Voir tous →" | `/[locale]/classements/buteurs/[competition-slug]` | Phase 6+ |
| Right rail Widget 2 "Voir tous →" | `/[locale]/classements/passeurs/[competition-slug]` | Phase 6+ |
| Right rail Widget 3 "Voir tous →" | Phase 6+ Moroccan players filter page | Phase 6+ |
| Players tab Top joueurs "Voir tous →" per leaderboard | `/[locale]/classements/[stat]/[competition-slug]` | Phase 6+ |
| Palmarès "Voir tous les titres →" | Team trophies archive page | Phase 6+ |
| Videos section "Voir plus →" overflow | Phase 6+ team videos page | Phase 6+ |
| Empty Videos state YouTube channel link | External Atlas Kings YouTube channel | Phase 12+ |
| Recent Form chart bar click | Match detail (Phase 6+ enhancement) | Phase 6+ |
| Topbar 🔍 Search trigger | `/[locale]/recherche` | Phase 6+ |
| Mobile bottom tab bar — Recherche / Favoris / Paramètres | Various Phase 6+/10 URLs | Phase 6+ / Phase 10 |

**Deferred-affordance rule** (consistent with Pages 1-3): destinations listed in Category 3 render as non-clickable text or open a "Bientôt disponible" lightweight overlay, never as broken links or 404s, until the destination page ships.

### Category 4 — Explicit divergences from Sofascore routing

| Sofascore pattern | Atlas Kings pattern | Rationale |
|---|---|---|
| bet365 odds in Featured match card | NO odds — form line (clubs) or FIFA ranking (national teams) | Loi 09-08 |
| Sofascore Analyst /upgrade link | NO equivalent | No premium tier in v2 |
| Sofascore Fantasy promo | NO equivalent | Out of scope per Rule 11 |
| Gambling disclaimer | NO equivalent | Loi 09-08 |
| Embed bracket / standings button | Deferred Phase 12+ | No syndication infra in v2 |
| Manager profile as own page | Deferred Phase 6+ | Avoid scope creep beyond 7-page model; reserve URL |
| Stadium/venue profile as own page | Deferred Phase 6+ | Same |
| Standings Tracker line chart | NOT PRESENT | API-Football data limitation (no round-by-round historical standings); recomputation pipeline is real engineering work benefiting only this chart. Form column + Recent Form chart deliver equivalent. |
| Latest transfers two-column section | NOT PRESENT | API-Football transfer coverage varies by league; data not consistent enough for v1. Phase 6+ enhancement. |
| Squad category pills (Market value / Previous club / Contract) | General-only at v1 | Market value: no data source. Others: Phase 5+ ingestion. |
| Sticky mini-header on scroll | NOT PRESENT | Visual stacking concern with already-sticky topbar; Phase 6+ enhancement |
| Standings ad slot at ≥1344px | Editorial widgets | Loi 09-08 — no ads in v2 |

---

## Update log

- 2026-05-13 — Initial schematic locked after Phase 4.5+ design session. Wydad AC canonical instance for club teams; Atlas Lions canonical for national-team variant. Inherits chrome from `docs/schematics/homepage.md`, page-shell patterns from `docs/schematics/competition-league.md` (Page 2) and `docs/schematics/competition-cup.md` (Page 3). Reference: `docs/research/arsenal-sofascore-team-page-full-analysis.md`. 3-tab center column (Classement default / Statistiques / Joueurs); Details and Media tabs removed; Palmarès chronological timeline and Videos section moved below center column. Standings Tracker chart removed entirely (API-Football data limitation; documented in Section 17 and Section 19 Category 4). MoroccoConnection card (right rail Widget 3) introduced with 4 state variants. Manager and Stadium pages deferred Phase 6+ with reserved URLs. Format Variants section (18) covers national-team adaptations.
- (Append future updates here with date and change description)
