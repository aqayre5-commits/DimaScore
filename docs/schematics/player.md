# Atlas Kings Player Schematic — Page 5

Locked schematic for `/[locale]/joueur/[country]/[player-slug]` (player profile pages). Achraf Hakimi is the canonical instance used throughout this document; the same structure repurposes for all player types — Moroccan internationals abroad, domestic-league players, non-Moroccan players, goalkeepers, women's football, retired legends. A Format Variants subsection covers position-specific and player-type adaptations.

Reference data sources for the schematic:
- Bernardo Silva (Manchester City) browser-session analysis — `docs/research/bernardo-silva-sofascore-player-page-full-analysis.md` (Sofascore reference for data coverage)
- Transfermarkt structural patterns (career history, transfer list, palmarès grouping — informed editorial)

API-Football data-availability sweep conducted 2026-05-13 confirmed what's buildable in v1 versus what's been deliberately cut for lack of data source (see Section 17 — Differences from Sofascore reference).

**Status**: Locked, ready for Phase 4.5 implementation
**Last updated**: 2026-05-13
**Reference**: `docs/research/bernardo-silva-sofascore-player-page-full-analysis.md`
**Inherits chrome from**: `docs/schematics/homepage.md`
**Inherits page-shell patterns from**: `docs/schematics/competition-league.md` (Page 2), `docs/schematics/competition-cup.md` (Page 3), `docs/schematics/team.md` (Page 4)
**Player data source**: `players` table (Postgres) + API-Football `/players`, `/players/teams`, `/transfers`, `/trophies`, `/fixtures/players` endpoints

---

## Page identity

Canonical Atlas Kings page template for **player** entities — individual footballers (current professionals + recent retirees relevant to ongoing editorial). Distinct from Page 4 (Team) which represents the collective entity; Page 5 is the individual within that team.

Where Pages 2-3 = "this competition", Page 4 = "this team has a squad, plays in competitions, has a history", Page 5 = "this player belongs to a team, plays competitions, has a career arc."

The player page is the **richest entity page** in our seven-page model — it's the surface where editorial narrative, factual data, and Morocco-specific framing combine most densely. Hakimi as canonical exemplifies that: Moroccan international, plays at PSG, captain of Atlas Lions, key figure in WC 2022 semifinal, plays role in WC 2026 co-hosted by Morocco.

### Distinguishing characteristics — Page 5 vs Page 4

| Aspect | Page 4 (Team) | Page 5 (Player) |
|---|---|---|
| Hero focus | Team crest + name + country + league + coach + stadium | Player photo + name + bio facts + current club + contract end |
| Hero narrative line | Not present | **YES — second sub-zone** with role + achievements ("Capitaine des Lions de l'Atlas · Demi-finaliste WC 2022") — distinguishes from Sofascore's bare bio facts |
| Hero match snapshots | Previous + Next match (no rating) | Previous + Next match **with per-match rating** displayed on previous |
| Hero height | ~280px | ~300px (taller due to narrative line sub-zone) |
| Center column tabs | Classement / Statistiques / Joueurs | Saison / Carrière / Sélection |
| Default tab | Classement | Saison |
| Tab purpose | Where the team sits + team stats + team's players | The player's current season + career history + national team |
| Standings tab | League table with team highlighted | Not present |
| Players tab | Squad roster | Not present |
| Career history | In the team's Players tab | Dedicated Carrière tab with season-by-season + transfer list |
| National team | Optional context | Dedicated Sélection tab |
| Left rail Card 3 | Recent Form vertical bar chart | Recent Form sparkline (cleaner aesthetic for individual) |
| Right rail Widget 3 | MoroccoConnection (4 variants: club state) | MoroccoConnection (player state — Coéquipiers en sélection / Moroccan tie / etc.) |
| Palmarès content | Team trophy wins + cup wins + continental wins | Player's trophies across all clubs + national team achievements |

### Inherited from Pages 2-4

- Inner-page 3-column shell at ≥1280px floor (~360-380 left + ~500-520 center + ~280-300 right)
- Chrome from homepage.md (top strip, topbar, breadcrumb, footer, mobile tab bar)
- SEO machinery (per-locale title/meta/H1/intro/JSON-LD/hreflang/image alt text)
- Loi 09-08 compliance throughout
- Phase 6+ deferred-affordance rule
- Videos section pattern from Pages 3-4 (`youtube-nocookie.com` + facade lazy-load)
- Palmarès chronological timeline pattern from Page 4
- About card at page bottom with 6 H2 sections + 6-8 FAQ

---

## Section 1 — URL structure

### Canonical pattern

```
/[locale]/joueur/[country]/[player-slug]
```

The `/joueur/` root segment is **not translated** across locales (Next.js routing simplicity, consistent with `/competition/` and `/equipe/` on Pages 2-4). The country and player-slug segments **are** translated per locale.

The `[country]` segment is the player's **primary nationality** (for dual-nationality cases — Hakimi: Morocco / Spain — we use the country they represent at international level). This places the URL in a logical hierarchy: Moroccan players cluster under `/joueur/maroc/`, English players under `/joueur/angleterre/`, etc.

### Per-locale examples

**Achraf Hakimi** — canonical Page 5 instance:
```
/fr/joueur/maroc/achraf-hakimi
/en/joueur/morocco/achraf-hakimi
/ar/joueur/المغرب/أشرف-حكيمي
```

**Brahim Diaz** — Moroccan international at Bayern:
```
/fr/joueur/maroc/brahim-diaz
/en/joueur/morocco/brahim-diaz
/ar/joueur/المغرب/إبراهيم-دياز
```

**Bernardo Silva** — Portuguese international (Sofascore reference):
```
/fr/joueur/portugal/bernardo-silva
/en/joueur/portugal/bernardo-silva
/ar/joueur/البرتغال/برناردو-سيلفا
```

**Kylian Mbappé** — French international (Transfermarkt reference):
```
/fr/joueur/france/kylian-mbappe
/en/joueur/france/kylian-mbappe
/ar/joueur/فرنسا/كيليان-مبابي
```

**Mohamed Hamoutim** — domestic-league Moroccan player (Botola Pro at Wydad):
```
/fr/joueur/maroc/mohamed-hamoutim
/en/joueur/morocco/mohamed-hamoutim
/ar/joueur/المغرب/محمد-حموتيم
```

### Slug strategy

Player slugs use **firstname-lastname** romanized for FR and EN locales. Arabic uses native script for the canonical Arabic name.

Slug collision handling: when two players share names (rare but happens — e.g., multiple "Mohamed Salah" historically), append a disambiguation suffix:
- `mohamed-salah` (Liverpool / Al-Ittihad — Egyptian)
- `mohamed-salah-defender` (lesser-known player needing disambiguation)

Disambiguation suffix is hand-curated, not algorithmic. The `players` table has a `slug_suffix` field for this purpose. Collisions are surfaced during ingestion review.

### Special player categories — URL conventions

**Dual nationality**: Use the country they currently represent or last represented at senior international level. If a player switches international allegiance mid-career (e.g., from one nation to another), the URL stays at the canonical (current) nationality with old slug redirecting 301.

**Retired players**: Same URL pattern. The `players` table has a `status: 'active' | 'retired' | 'deceased'` flag. Retired-player pages render with adjusted live-data subscriptions (no live matches; no next-match card) but otherwise identical structure.

**Female players**: Same URL convention. `gender: 'M' | 'F'` flag on players table drives appropriate competition context (women's national team, women's league competitions).

**Youth players** (academy / U-23 / U-17): Same URL pattern. Often have sparser data; coverage gating handles empty states.

### Player data schema additions

Building on a `players` table that captures API-Football's `/players` profile, Page 5 needs:

```typescript
// Profile fields (mostly from API-Football)
id: number
api_football_id: number
slug: string                       // 'achraf-hakimi'
slug_suffix: string | null         // disambiguation when needed
slug_ar: string                    // Arabic-native script slug
country_code: string               // primary nationality code 'MA'
country_code_secondary: string | null  // dual nationality 'ES' for Hakimi
firstname: string
lastname: string
name_full: string                  // 'Achraf Hakimi'
name_ar: string                    // 'أشرف حكيمي'
nickname_fr: string | null         // 'Le Roi' or "AH2"
nickname_en: string | null
nickname_ar: string | null
date_of_birth: ISO date
place_of_birth: string             // 'Madrid, Spain'
height_cm: number | null
weight_kg: number | null
preferred_foot: 'L' | 'R' | 'B' | null  // 'B' = both
position_primary: 'GK' | 'DEF' | 'MID' | 'FWD'
position_specific: string          // 'RB' / 'CDM' / 'LW' / etc.
photo_url: string

// Status
status: 'active' | 'retired' | 'deceased'
gender: 'M' | 'F'
current_team_id: number | null     // null for retired/unsigned
current_squad_number: number | null
contract_until: ISO date | null

// National team
national_team_id: number | null    // FK to teams table for national team
captain_of_national: boolean
national_caps: number              // aggregated; refreshed post-match
national_goals: number

// Editorial / hand-curated
narrative_line_fr: string | null   // Hero sub-zone B: "Capitaine des Lions · Demi-finaliste WC 2022"
narrative_line_en: string | null
narrative_line_ar: string | null
media_youtube_ids: string[]
about_fr: { intro, journey, national_team_section, style, editorial, faqs }
about_en: { ... }
about_ar: { ... }
```

The `narrative_line_*` fields are **hand-curated for priority players** (Atlas Lions members, top global stars, headline-relevant figures). For all other players, the line is generated via template:
```
{Position} {at_club} · {age} ans · {primary_competition_appearances} matchs cette saison
```
Generic but accurate fallback. Hand-curation prioritized for ~60-80 players at launch.

### Tab state — hash fragments only

```
/fr/joueur/maroc/achraf-hakimi                → defaults to Saison
/fr/joueur/maroc/achraf-hakimi#saison         → Saison (explicit, same as default)
/fr/joueur/maroc/achraf-hakimi#carriere       → Carrière tab
/fr/joueur/maroc/achraf-hakimi#selection      → Sélection tab (national team)
```

Per-locale hash fragments:
- Saison: `#saison` (FR) / `#season` (EN) / `#الموسم` (AR)
- Carrière: `#carriere` (FR) / `#career` (EN) / `#المسيرة` (AR)
- Sélection: `#selection` (FR) / `#national-team` (EN) / `#المنتخب` (AR)

### hreflang annotations

```html
<link rel="alternate" hreflang="fr" href="https://atlaskings.com/fr/joueur/maroc/achraf-hakimi" />
<link rel="alternate" hreflang="en" href="https://atlaskings.com/en/joueur/morocco/achraf-hakimi" />
<link rel="alternate" hreflang="ar" href="https://atlaskings.com/ar/joueur/المغرب/أشرف-حكيمي" />
<link rel="alternate" hreflang="x-default" href="https://atlaskings.com/fr/joueur/maroc/achraf-hakimi" />
```

---

## Section 2 — SEO and indexability

### Per-locale title and meta description

Hand-written for priority players (~60-80 at launch). Templated for the rest.

Hakimi hand-written:

```
fr: <title>Achraf Hakimi — Calendrier, statistiques et palmarès | Atlas Kings</title>
    <meta name="description" content="Suivez Achraf Hakimi, latéral droit international marocain au Paris Saint-Germain et capitaine des Lions de l'Atlas. Calendrier, statistiques de la saison, palmarès, sélection nationale et trajectoire vers la Coupe du Monde 2026 co-organisée par le Maroc." />

en: <title>Achraf Hakimi — Fixtures, statistics and trophies | Atlas Kings</title>
    <meta name="description" content="Follow Achraf Hakimi, Moroccan international right-back at Paris Saint-Germain and captain of the Atlas Lions. Fixtures, season statistics, trophies, national team career and Morocco's road to the FIFA World Cup 2026 co-hosting." />

ar: <title>أشرف حكيمي — الجدول، الإحصائيات والألقاب | أطلس كينغز</title>
    <meta name="description" content="تابعوا أشرف حكيمي، الظهير الأيمن الدولي المغربي في باريس سان جيرمان وقائد أسود الأطلس. الجدول، إحصائيات الموسم، الألقاب، المسيرة الدولية ومسار المغرب نحو كأس العالم 2026." />
```

Title pattern: `{player_name} — {modifier_1}, {modifier_2}, {modifier_3} | Atlas Kings`.

Modifiers tuned per player type:
- Outfield active: `calendrier / statistiques / palmarès`
- Goalkeeper active: `calendrier / clean sheets / palmarès`
- National-team-focused (Moroccan internationals, captains): adds `sélection nationale` modifier
- Retired: `parcours / palmarès / statistiques carrière`

### H1 — single per page

Player full name, IBM Plex Sans 32px semibold:

```
fr: <h1>Achraf Hakimi</h1>
en: <h1>Achraf Hakimi</h1>
ar: <h1>أشرف حكيمي</h1>
```

For players with widely-known nicknames, H1 stays at the legal name; the nickname appears in Sub-zone B narrative line below ("Surnom: Le Roi"). H1 is the SEO surface; nicknames serve editorial.

For Atlas Lions context specifically, the "أسود الأطلس" team term is referenced in Arabic intro paragraph and About card content, not in the player's H1.

### Intro paragraph

Below the hero, above the 3-column zone. 30-50 words, keyword-loaded, per locale. Hand-written for priority players.

Hakimi (FR):

```
Achraf Hakimi est le latéral droit international marocain du Paris 
Saint-Germain et capitaine des Lions de l'Atlas. Formé au Real Madrid, 
révélé au Borussia Dortmund, il est l'un des piliers de la sélection 
qui a atteint la demi-finale historique de la Coupe du Monde FIFA 2022.
```

For domestic-league Moroccan players (less internationally known):

```
Mohamed Hamoutim est attaquant du Wydad Athletic Club et international 
marocain. Formé au sein de l'académie du Wydad, il s'impose comme l'un 
des buteurs réguliers de la Botola Pro et fait partie des sélections 
récentes des Lions de l'Atlas.
```

For non-Moroccan players (e.g., Bernardo Silva):

```
Bernardo Silva est milieu offensif international portugais de 
Manchester City, où il évolue depuis 2017 après une formation au 
Benfica et un passage à l'AS Monaco. Pilier de la sélection portugaise, 
il compte plusieurs titres de Premier League et de Coupes nationales 
avec les Citizens.
```

### H2 inside each active tab

Same pattern as Pages 2-4. Each tab content area has a visible H2:

| Tab | French | English | Arabic |
|---|---|---|---|
| Saison | Saison 2025/26 — Achraf Hakimi | Season 2025/26 — Achraf Hakimi | الموسم 2025/26 — أشرف حكيمي |
| Carrière | Carrière complète d'Achraf Hakimi | Achraf Hakimi's full career | المسيرة الكاملة لأشرف حكيمي |
| Sélection | Achraf Hakimi en sélection nationale | Achraf Hakimi with the national team | أشرف حكيمي مع المنتخب الوطني |

For retired players, Saison tab H2 becomes "Dernière saison" or hides if data sparse; Sélection tab H2 hides if no national-team association.

### JSON-LD structured data

Two blocks in `<head>`:

**1. Person** (schema.org/Person with sport context):

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Achraf Hakimi",
  "alternateName": ["أشرف حكيمي", "Achraf Hakimi Mouh"],
  "birthDate": "1998-11-04",
  "birthPlace": {
    "@type": "Place",
    "name": "Madrid, Spain"
  },
  "nationality": "Moroccan",
  "height": "181 cm",
  "memberOf": {
    "@type": "SportsTeam",
    "name": "Paris Saint-Germain",
    "url": "https://atlaskings.com/fr/equipe/france/paris-saint-germain"
  },
  "url": "https://atlaskings.com/fr/joueur/maroc/achraf-hakimi",
  "image": "https://atlaskings.com/images/players/achraf-hakimi.jpg",
  "jobTitle": "Professional footballer"
}
```

**2. SportsEvent array** for upcoming/recent fixtures shown in the hero match snapshots and matches list (similar to Pages 3-4). Generated server-side. Adds rich-snippet eligibility for "Hakimi next match" and similar queries.

### Per-locale image alt text

Player photos, national team flag, club crests carry locale-specific alt text:

```
Player photo:        alt="Photo d'Achraf Hakimi, latéral droit du PSG" (fr)
                     alt="Photo of Achraf Hakimi, PSG right-back" (en)
                     alt="صورة أشرف حكيمي، الظهير الأيمن لباريس سان جيرمان" (ar)

National team flag:  alt="Drapeau du Maroc" (fr)
Club crest:          alt="Écusson du Paris Saint-Germain" (fr)
```

### About card at page bottom

Long-form keyword-bearing content. 6 H2 sections + 6-8 FAQ entries, hand-written per locale for priority players. Documented in Section 11. **Market value mention lives here** (no dedicated hero badge per Q-P5-C decision).

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
│ HERO (~300px, not sticky — Player-specific structure)                        │
│  Sub-zone A — Identity: photo 96×96 · H1 · bio facts · club · contract       │
│  Sub-zone B — Narrative line (role + achievements) ← Page 5 differentiator   │
│  Sub-zone C — Previous match card (with rating) │ Next match card            │
│  Sub-zone D — Intro paragraph (~40 words, locale-loaded)                    │
├──────────────────────┬───────────────────────────┬──────────────────────────┤
│ LEFT RAIL ~360-380px │ CENTER ~500-520px         │ RIGHT RAIL ~280-300px    │
│                      │                           │ (≥1280px)                │
│ 1. Featured match    │ Tabs row (not sticky):    │ 1. Top scorers           │
│ 2. Matches list      │ Saison · Carrière ·       │    (player's league)     │
│    (with per-match   │  Sélection                │ 2. Top assists           │
│     rating column)   │                           │ 3. MoroccoConnection     │
│ 3. Recent Form       │ H2 inside active tab      │    (player variant)      │
│    SPARKLINE         │                           │ 4. MoreMatchesToday      │
│ 4. Newsletter        │ Saison default:           │ 5. Newsletter            │
│                      │  • Summary tiles          │                          │
│                      │  • Per-competition table  │                          │
│                      │  • Recent matches list    │                          │
│                      │    (with ratings)         │                          │
│                      │                           │                          │
│                      │ Carrière:                 │                          │
│                      │  • Season-by-season       │                          │
│                      │  • Transfer history list  │                          │
│                      │                           │                          │
│                      │ Sélection:                │                          │
│                      │  • Caps/goals header      │                          │
│                      │  • Tournament history     │                          │
│                      │  • Recent national matches│                          │
├──────────────────────┴───────────────────────────┴──────────────────────────┤
│ PALMARÈS / TROPHIES section (~150-300px, full content width)                 │
│  Chronological timeline of trophies/achievements. Most recent first.         │
├─────────────────────────────────────────────────────────────────────────────┤
│ VIDÉOS section (~400-600px, full content width)                              │
│  3-up YouTube thumbnail grid · embeds via youtube-nocookie.com               │
├─────────────────────────────────────────────────────────────────────────────┤
│ ABOUT CARD (full keyword surface, 6 H2 sections + 6-8 FAQ)                   │
│  Market value mention lives in this section (no dedicated hero badge)        │
├─────────────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Section 4 — Inherited chrome (from homepage.md)

Carries over verbatim from `docs/schematics/homepage.md`. No re-spec needed.

| Component | Behaviour on Page 5 |
|---|---|
| AdaptiveTopStrip | Identical. WC 2026 Mode 1 countdown active globally today. For Moroccan international players: no player-specific mode change. |
| Topbar | Identical. For players in Botola Pro: Botola Pro nav item active when on page. For Moroccan internationals abroad (Hakimi/Diaz/Mazraoui): no top-level nav active (their league isn't in our topbar pinned set). |
| SeoBreadcrumb | Content updates per page. For Hakimi: `Football › France › Ligue 1 › Achraf Hakimi` (FR). For Moroccan international, the country segment uses the **current club's country** (where they play day-to-day), not their nationality. The "Maroc" national-team context surfaces in the hero (Sub-zone B narrative line) and Sélection tab — not breadcrumb. For domestic-league Moroccan players: `Football › Maroc › Botola Pro › Mohamed Hamoutim`. Breadcrumb segment routing per Page 2 Section 4 conventions: first segment → homepage; country/competition segments → respective pages (Phase 6+ deferred-affordance where unbuilt); player segment → current page (non-clickable). |
| Footer | Identical. Loi 09-08 notice. |
| Mobile bottom tab bar | Identical 4 tabs (Matchs / Recherche / Favoris / Paramètres). |
| Mobile hamburger drawer | Identical structure. |

---

## Section 5 — Hero (~300px)

Player-specific hero structure. Hybrid of Page 4's hero (identity + match snapshots) PLUS a **narrative line sub-zone** that's unique to Page 5. The narrative line is the key differentiator from Sofascore's bare bio-facts approach.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [photo 96×96]  Achraf Hakimi                                             │
│                🇲🇦 Maroc · Latéral droit · 26 ans · 1m81 · Pied droit     │
│                                                                          │
│                PSG (depuis 2021) · #2 · Contrat jusqu'en 2029            │
├──────────────────────────────────────────────────────────────────────────┤
│                Capitaine des Lions de l'Atlas                            │
│                Demi-finaliste WC 2022 · 92 sélections / 12 buts          │
├────────────────────────────────────┬─────────────────────────────────────┤
│ ─── Dernier match ────────────────│─── Prochain match ────────────────── │
│ Ligue 1 · J34 · 17/05 · FT        │ Ligue 1 · J35 · 24/05 · 21:00       │
│ PSG  2 – 0  OM · Note: 7.4        │ PSG vs Monaco                       │
└────────────────────────────────────┴─────────────────────────────────────┘

Achraf Hakimi est le latéral droit international marocain du Paris 
Saint-Germain et capitaine des Lions de l'Atlas. Formé au Real Madrid, 
révélé au Borussia Dortmund, il est l'un des piliers de la sélection 
qui a atteint la demi-finale historique de la Coupe du Monde FIFA 2022.
```

Total height: ~300px. Slightly taller than Pages 2-4 hero (~210-280px) due to the narrative line sub-zone.

### Sub-zones

**Sub-zone A — Identity (top, ~140px)**:
- Player photo 96×96 (circular, light shadow). Non-clickable (page identity).
- H1: player full name, IBM Plex Sans 32px semibold. Non-clickable.
- Country flag emoji + nationality + position-specific + age + height + preferred foot — compact muted row, IBM Plex Sans 14px. Country segment routes to country index (Phase 6+ deferred-affordance, non-clickable until shipped).
- Below: Current club + squad number + contract end — compact muted row. Club name routes to that team's Page 4. Squad number non-clickable. Contract end non-clickable.

For retired players: Sub-zone A omits squad number and contract end; replaces with "Retraité depuis YYYY" line.

For dual-nationality players, primary nationality flag shown; secondary mentioned in About card only (avoids visual clutter).

**Sub-zone B — Narrative line (~60px) — Page 5 specific**:

Two lines of editorial framing in muted-but-prominent text. Distinguishes the player in 15-30 words.

For Hakimi:
```
Capitaine des Lions de l'Atlas
Demi-finaliste WC 2022 · 92 sélections / 12 buts
```

For Brahim Diaz (Moroccan international, less famous globally):
```
International marocain · Né à Málaga, choisi le Maroc en 2024
Membre des Lions vers la WC 2026
```

For Mohamed Hamoutim (Moroccan domestic-league):
```
Attaquant régulier du Wydad AC
Buteur de Botola Pro · Sélection récente des Lions
```

For Bernardo Silva (non-Moroccan):
```
Milieu offensif international portugais
Pilier de Manchester City depuis 2017 · UCL 2023
```

For young / less-established players, narrative line uses template:
```
{Position_descriptor} {at_club}
{Career_highlight_or_recent_milestone}
```

For older / retired players:
```
{Iconic_role} {at_club_during_peak}
{Defining_achievement}
```

Content sourced from `narrative_line_fr/en/ar` fields in `players` table. Hand-curated for ~60-80 priority players at launch. Templated for the rest.

**Sub-zone C — Previous match + Next match snapshot cards (~100px, side-by-side)**:

Two cards, each ~50% width, 16px gap.

```
┌─ Dernier match ────────────────┐  ┌─ Prochain match ────────────────┐
│ Ligue 1 · J34 · 17/05 · FT     │  │ Ligue 1 · J35 · 24/05 · 21:00   │
│                                │  │                                 │
│ PSG  2 – 0  OM                 │  │ PSG  vs  Monaco                 │
│ Note: 7.4                      │  │                                 │
│                                │  │                                 │
│ → Voir le match                │  │ → Voir le match                 │
└────────────────────────────────┘  └─────────────────────────────────┘
```

Each card structure:
- Top label: competition name + matchday + date + status (FT / minute / kickoff time)
- Score line: this player's team always on left, opponent on right
- **Previous match adds: Per-match rating from API-Football** (`/fixtures/players` rating field, range 0-10)
- Next match doesn't show rating (match hasn't been played)
- Bottom action: implicit "tap to view" (entire card is clickable)

Click destinations:
- Entire card → that match's detail page (Page 6)
- Player's team crest → that team's Page 4 (e.g., PSG link)
- Opponent crest/name → opponent's Page 4
- Rating number → non-clickable (informational only)

### Edge cases for match snapshot cards

Same edge cases as Page 4 Section 5 (live match in progress, off-season, no upcoming match, etc.), plus player-specific:

| State | Previous card | Next card |
|---|---|---|
| Player started but substituted off | Match summary shows "Sorti 73'" alongside rating | Standard |
| Player on bench (unused sub) | "Banc" status; no rating | Standard |
| Player injured / suspended | Previous card shows last played match; "Blessé" or "Suspendu" badge | Next card shows team's next match with "Indisponible" label |
| Player on international duty during club fixture | Both cards show team fixtures; "International" badge | Same |
| Player transferred mid-season | Previous card may show last match for old club; Next card shows first match at new club | Standard |
| Retired player | Previous card shows final professional match | Next card swaps to "Retraité depuis YYYY" summary card |

Player-status field on `players` table (`status_extra: 'injured' | 'suspended' | 'international_duty' | 'fit'`) drives state. Pusher subscription `player-{id}-status` invalidates cache when status changes.

**Sub-zone D — Intro paragraph (full width)**:

Same pattern as Pages 2-4 intro. 30-50 words, keyword-loaded, per locale. Hand-written for priority players.

Rendered as a single `<p>` element. IBM Plex Sans 15px, line-height 1.5, max-width ~720px, locale-aligned (RTL for Arabic).

### No FAVOURITE star, no sticky mini-header

Page 10 features. Slot in top-right area stays empty in v1. Sticky mini-header on scroll explicitly deferred (avoids visual stacking with already-sticky topbar — consistent with Page 4 decision).

### No COMPARE button in hero top-right

Sofascore puts COMPARE prominently in hero top-right. We don't — moves to a smaller affordance accessible via the right-rail context (Phase 6+ when compare-players feature page ships). Reduces hero clutter.

---

## Section 6 — Left rail (~360-380px)

Fixed 4-card stack. Total rail height ~1500-1700px. Scrolls with page.

### Card 1 — Featured match (~180px)

Same component as Pages 2-4 Card 1. Selection algorithm scoped to this player:

1. If a match involving this player's team is currently live AND player is in lineup → that
2. Else this player's team's next scheduled match → that (assumes player will be available)
3. Else this player's team's most recent finished match → that
4. Else show empty state: "Pas de match dans les 7 prochains jours"

For Hakimi during a typical week:

```
┌─ À la une ──────────────────────────────────────┐
│                                                 │
│  [crest L]            21:00                     │
│                     SAM 24 MAI                   │
│                                                 │
│  PSG                                  Monaco     │
│                                                 │
│  Ligue 1 · J35 · Parc des Princes               │
│                                                 │
│  Forme récente:                                 │
│  W W W L W   vs   W D L W D                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Form line** (`Forme récente: WWWLW vs WDLWD`) reuses Pages 2/4 pattern. Replaces Sofascore's bet365 odds row per Loi 09-08.

For Atlas Lions context (during international windows when Hakimi plays for Morocco), card swaps to the national-team fixture:

```
┌─ À la une ──────────────────────────────────────┐
│                                                 │
│  [crest L]            20:00                     │
│                     VEN 06 JUIN                  │
│                                                 │
│  Maroc                            Tanzanie       │
│                                                 │
│  Qualif WC 2026 · Stade Mohammed V              │
│                                                 │
│  FIFA: #14 Maroc · #99 Tanzanie                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

For Moroccan-international-abroad context, **FIFA ranking comparison replaces form line** when match involves national team (per Page 3 pattern). For club context, form line.

Tap action: routes to match detail page (Page 6).

### Card 2 — Matches list with per-match ratings (~700-800px)

Page 5 differentiator: **per-match rating column** prominently displayed alongside each match row.

```
┌─ Matchs ────────────────────────────────────────┐
│                                                 │
│ Compétition: [Toutes ▾]                         │
│                                                 │
│ [Par date ●]  [Par tour]                        │
│                                                 │
│ ‹  Mai 2026  ›                                  │
│                                                 │
│ ─── 17 mai · Ligue 1 J34 ──────────────────── │
│ 17/05  FT   PSG          2 – 0    OM       7.4 │
│              79'                                │
│                                                 │
│ ─── 10 mai · Ligue 1 J33 ──────────────────── │
│ 10/05  FT   Reims        0 – 3    PSG      7.8 │
│              90' · 1 passe décisive             │
│                                                 │
│ ─── 06 mai · UCL Demi-finale ─────────────── │
│ 06/05  FT   Real Madrid  1 – 0    PSG      6.2 │
│              90'                                │
│                                                 │
│ ─── 24 mai · Ligue 1 J35 ──────────────────── │
│ 24/05  21:00 PSG          –       Monaco        │
│                                                 │
│ Voir tous les matchs →                          │
└─────────────────────────────────────────────────┘
```

**Per-match rating column on the right** (range 0-10, color-tinted: green ≥7.5 / amber 6.0-7.4 / red <6.0). Source: API-Football `/fixtures/players` rating field.

**Sub-row below each fixture** shows minutes played + notable contributions (goals / assists / yellow cards / red cards). Compact secondary text.

For upcoming matches: no rating column (match hasn't been played); minutes/contributions row hidden.

**Sub-tabs**: `Par date | Par tour` — two sub-tabs (same as Page 4 Card 2). No "Par groupe" sub-tab (Page 3 specific to tournament context).

**Competition filter dropdown**: defaults to "Toutes" showing matches across all competitions this player participated in (Ligue 1 + UCL + Coupe de France + Coupe de la Ligue + Trophée des Champions + national team). Switching scopes the list.

For international-window context, dropdown enables "Sélection nationale" filter showing only national-team matches.

Status filter NOT exposed as pills (same as Page 4 — chronological mixed past+upcoming is more useful).

Fixture rows tap → match detail (Page 6). Team crests → team pages (Page 4). Competition labels → competition pages (Page 2/3).

### Card 3 — Recent Form sparkline (~120px) — Page 5 specific

Sparkline (not vertical bars like Page 4). Cleaner aesthetic for individual rather than team. Last 10 ratings.

```
┌─ Forme récente ⓘ ────────────────────────────────┐
│                                                 │
│       8.0                                        │
│  7.8 ╭─╮       ╭─╮                              │
│  7.5 │ ╰─╮ ╭─╮ │ ╰─╮                            │
│  7.0     ╰─╯ ╰─╯   ╰─╮ ╭─╮                      │
│  6.5                  ╰─╯ ╰─╮                  │
│  6.0                          ╰─                │
│                                                 │
│  ↑ oldest                       newest ↑        │
│                                                 │
│  Note moyenne sur 10 derniers matchs: 7.2       │
└─────────────────────────────────────────────────┘
```

Horizontal sparkline. Each point = one match's rating (0-10 scale). X-axis: chronological. Y-axis: rating value (visible range typically 5.5-9.0).

Bottom label shows the average over those 10 matches — a single headline metric.

Hover tooltips on points: opponent + competition + date + rating + key contribution (goals/assists if applicable).

Points NOT clickable in v1 (tooltip only). Phase 6+ enhancement: point click → match detail.

Data source: API-Football `/fixtures/players` rating field aggregated across last 10 matches for this player. No new ingestion required.

ⓘ info icon top-right shows tooltip explaining the chart: `Note basée sur API-Football, 0-10. Survolez les points pour le détail.`

### Card 4 — Newsletter (~140px)

Same component as Pages 2-4. Player-specific framing:

```
Recevez les actus d'Achraf Hakimi directement.
```

Email input + S'abonner button. Submit → in-place toast (no navigation).

Implementation deferred to Phase 5+ (newsletter infrastructure decision).

### Cards NOT used on Page 5 vs Pages 2-4

- **POTS race** (Page 2 Card 3): removed. Not relevant to individual player.
- **Team of the Week** (Page 2 Card 4): removed. Same reasoning.
- **Tous les groupes en bref** (Page 3 Card 3): removed. Player isn't a tournament.
- **Featured match algorithm** behaves as for clubs (form line) unless context is national-team match (FIFA ranking line).
---

## Section 7 — Center column tabs (~500-520px)

### Tabs row (~48px, NOT sticky)

```
┌──────────────────────────────────────────────────┐
│ Saison ●  Carrière   Sélection                   │
│ ━━━━━━                                           │
└──────────────────────────────────────────────────┘
```

Active tab: gold underline, semibold weight. Inactive: gray text, regular weight. ~16px text.

Hash fragment updates on tab change. **3 tabs**:
- Saison (default)
- Carrière
- Sélection — **hides entirely if `national_team_id` is null** (player has no national team association)

Default tab: **Saison**. Reasoning: current-season context is the most-frequent return-visit intent for an active player ("what's Hakimi doing this season?"). For retired players where season data is sparse, default shifts to Carrière (data-driven default; player record flag).

Media as tab NOT present — videos surface as standalone section below 3-column zone (consistent with Pages 3-4 pattern).

---

### Tab 1 — Saison (Season, default for active players)

H2: `Saison 2025/26 — Achraf Hakimi`

The player's current-season story. Three content blocks stacked.

#### Block 1 — Summary tiles (5 tiles)

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ MATCHS   │ MIN      │ BUTS     │ ASSISTS  │ NOTE      │
│ JOUÉS    │ JOUÉES   │          │          │ MOYENNE   │
│   36     │  2775    │   2      │   5      │   7.2 ⓘ   │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

Glanceable headline metrics aggregated across all competitions this season. Sourced from API-Football `/players?id&season` statistics array (sum across competitions).

Note (rating) ⓘ tooltip: `Note moyenne API-Football, agrégée sur toutes les compétitions de la saison.`

For goalkeepers, the tile layout swaps:

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ MATCHS   │ MIN      │ CLEAN    │ ARRÊTS   │ NOTE      │
│ JOUÉS    │ JOUÉES   │ SHEETS   │          │ MOYENNE   │
│   30     │  2700    │   12     │  78      │   7.0 ⓘ   │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

Position-aware tile rendering per Q-P5-H decision. GK = clean sheets + saves prominently. Outfield = goals + assists.

For defenders, the layout adds a tackles metric:

```
... MATCHS · MIN · BUTS · ASSISTS · TACLES/MATCH ...
```

For forwards, an extra "Buts par 90min" tile may surface depending on display width.

#### Block 2 — Per-competition statistics table

```
┌─ Statistiques par compétition ──────────────────────┐
│ Compétition          MJ   Min   Buts  Ass  Note     │
├─────────────────────────────────────────────────────┤
│ Ligue 1               30  2775     2    4   7.4     │
│ UCL                    8   551     0    0   6.9     │
│ Coupe de France        3   129     0    0   7.0     │
│ Coupe de la Ligue      3   204     0    1   7.0     │
│ Qualif WC (Maroc)      6   540     1    2   7.5     │
│ Amicaux (Maroc)        2   135     0    1   7.3     │
├─────────────────────────────────────────────────────┤
│ Total                 52  4334     3    8   7.2     │
└─────────────────────────────────────────────────────┘
```

Sourced directly from API-Football `/players?id&season=current` statistics array — one entry per competition.

Each row is clickable → that competition's Page 2/3.

Columns (default visible):
- Compétition
- MJ (matchs joués)
- Min (minutes)
- Buts
- Assists
- Note (Sofascore-style rating, 0-10)

For goalkeepers, column set adapts:
- Compétition / MJ / Min / Clean sheets / Arrêts / Note

For all positions, additional columns available on expanded view (Phase 6+ "Voir plus"):
- Tirs (total / cadrés)
- Passes (total / clés / précision %)
- Tacles / Interceptions
- Cartons (jaunes / rouges)

V1: simplified position-aware default columns. Phase 6+ adds expansion.

#### Block 3 — Recent matches with ratings

```
┌─ Derniers matchs ───────────────────────────────────┐
│                                                     │
│ 17/05  Ligue 1     PSG 2-0 OM         79'    7.4    │
│ 10/05  Ligue 1     Reims 0-3 PSG      90'+1A 7.8    │
│ 06/05  UCL SF      Real 1-0 PSG       90'    6.2    │
│ 03/05  UCL SF 1L   PSG 0-1 Real       90'    6.5    │
│ 28/04  Ligue 1     Lyon 1-1 PSG       90'    7.0    │
│ 22/04  Ligue 1     PSG 3-0 Brest      75'    7.5    │
│ 15/04  Ligue 1     Nantes 0-2 PSG     90'+1B 8.2    │
│ 08/04  Ligue 1     PSG 4-1 Lens       82'    7.6    │
│                                                     │
│ Voir tous les matchs →                              │
└─────────────────────────────────────────────────────┘
```

Last 8-10 matches with per-match rating + minutes + key contributions (goals/assists notation: "+1A" = 1 assist, "+1B" = 1 goal).

Each row → match detail (Page 6).

Data source: API-Football `/fixtures/players` for each fixture the player participated in. Cached per fixture (24h TTL — past matches don't change).

#### NO heatmap

Sofascore shows a positional activity heatmap on a pitch in the Season tab. **Atlas Kings does NOT implement this on Page 5.**

Reasoning: API-Football does not provide heatmap data — Sofascore generates this from proprietary positional tracking. Building our own would require fixture-level positional data we don't have. Cut from v1 per data-availability sweep (2026-05-13). Documented in Section 17.

If a position-visualization need arises later, Phase 6+ enhancement could consider deriving approximate zones from event coordinates (when available), but this is real engineering work that isn't justified for v1.

#### Coverage gating

Saison tab requires `statistics_players: true` coverage flag for at least one competition the player participated in. For lower-coverage leagues (Algeria Ligue 1, Tunisia Ligue 1), stats may be partial (appearances visible, detailed metrics null). The tab still renders; null-valued stats show "—" placeholders.

Empty state if zero appearances this season:

```
Pas de matchs joués cette saison.
Consultez la carrière complète →
```

Routes to Carrière tab.

---

### Tab 2 — Carrière (Career)

H2: `Carrière complète d'Achraf Hakimi`

Multi-season career history table PLUS transfer history list. Transfermarkt-style structure adapted with Sofascore-style per-season detail.

#### Block 1 — Season-by-season table

```
┌─ Saison par saison ─────────────────────────────────────┐
│ Saison   Club          Pays    MJ   Min   Buts  Ass  Note│
├─────────────────────────────────────────────────────────┤
│ 25/26    PSG           🇫🇷       52  4334    3    8   7.2 │
│ 24/25    PSG           🇫🇷       50  4234    4   10   7.3 │
│ 23/24    PSG           🇫🇷       54  4711    5    9   7.4 │
│ 22/23    PSG           🇫🇷       43  3589    2    7   7.1 │
│ 21/22    PSG           🇫🇷       40  3445    4    6   7.3 │
│ 20/21    Inter Milan   🇮🇹       45  3856    7   10   7.5 │
│ 19/20    Inter Milan   🇮🇹       43  3712    7    9   7.4 │
│ 18/19    Dortmund      🇩🇪       38  3225    9    7   7.5 │
│ 17/18    Dortmund      🇩🇪       29  2412    4    1   7.0 │
│ 16/17    Real Madrid B 🇪🇸       33  2890    9    7   7.2 │
│ 15/16    Real Madrid B 🇪🇸       20  1654    2    1   6.9 │
├─────────────────────────────────────────────────────────┤
│ TOTAL    Carrière       —      447 38062   56   75   7.3 │
└─────────────────────────────────────────────────────────┘
```

Each row expandable (chevron right of row) to reveal per-competition breakdown for that season:

```
─── 25/26 Manchester City — détaillé ───────────────────
   Premier League   30  2775   2   4   7.4
   FA Cup            3   129   0   0   7.0
   EFL Cup           3   204   0   1   7.0
   UCL               8   551   0   0   6.9
   Maroc · Qualif   6   540   1   2   7.5
   Maroc · Amicaux  2   135   0   1   7.3
```

Source: API-Football `/players/teams?player=X` provides career path (every team + seasons), then per-season call to `/players?id=X&season=Y` for stats. Multiple API calls but cached per (player, season) with 24h TTL — historical seasons rarely change.

Filters at top of table:
- **Compétition** dropdown: `Toutes` (default) / `Domestiques` / `Continentales` / `Internationales`
- **Total / Par 90min** toggle: changes display of buts/ass/etc. from totals to per-90-minute rates

Pagination: not needed for most players (≤15 rows typical). For 20+ season careers (very long-tenured veterans), "Voir plus" expands.

#### Block 2 — Transfer history list

Below the season-by-season table:

```
┌─ Historique des transferts ─────────────────────────────┐
│                                                         │
│  Juillet 2021  Inter Milan       → PSG          €60M    │
│  Juillet 2020  Real Madrid       → Inter Milan  €40M    │
│  Juillet 2018  Real Madrid       → Dortmund     Prêt    │
│  Juillet 2017  Real Madrid B     → Real Madrid  Promo   │
│  Juillet 2015  Académie          → Real Madrid B Promo  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Chronological list, most recent first. Each entry:
- Date (month + year)
- From club name
- To club name
- Fee (€XM / Prêt / Free / N/A — depends on transfer type from API)

Source: API-Football `/transfers?player=X`. Returns every transfer with `type` field formatted as fee string ("€60M"), "Free", "Loan", or "N/A".

Each club name → that team's Page 4.

**No overlay chart** — Sofascore overlays market value curve with transfer fees. We do NOT. Reasoning: market value chart requires Transfermarkt-source data we don't ingest, and overlaying it with fees creates data-theater (two unrelated series sharing axes). Clean list is more honest.

#### Coverage gating

For lower-coverage leagues with `statistics_players: false`, per-season stats may show appearances only (Buts/Ass/Note as "—"). Career table still renders; data gracefully degrades.

For very young players (< 3 seasons), the table is short but valid. Empty state for first-season debutants:

```
Carrière en construction. Première saison: 25/26.
```

---

### Tab 3 — Sélection (National team)

H2: `Achraf Hakimi en sélection nationale`

**Tab hides entirely if `national_team_id` is null** (player has no national team association — rare for senior professionals but applies to certain academy / unlisted-eligibility cases).

For Hakimi, this is a first-class surface — Atlas Lions captain is part of his core identity. Sofascore buries national team in a small left-column card; we elevate it to a dedicated tab.

#### Block 1 — National team header

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  🇲🇦  Lions de l'Atlas (Maroc)                          │
│                                                         │
│  Sélections: 92     Buts: 12     Premier match: 31/03/15│
│                                                         │
│  Capitaine depuis: 2024                                 │
│  Sélectionneur: Walid Regragui                          │
│                                                         │
│  → Voir l'équipe nationale du Maroc                     │
└─────────────────────────────────────────────────────────┘
```

National team link → that national team's Page 4.

Source: API-Football `/players?id=X&season=Y` filtered to national-team leagues. Caps/goals aggregated across all seasons.

Captain flag from `players.captain_of_national` field (hand-curated; updated as captaincy changes).

#### Block 2 — Tournament participation

```
┌─ Tournois ──────────────────────────────────────────────┐
│                                                         │
│  Coupe du Monde 2026     [À venir]                      │
│  Coupe du Monde 2022     Demi-finale (4ème place)       │
│  AFCON 2024              Demi-finale                    │
│  AFCON 2022              Demi-finale                    │
│  AFCON 2019              1/8 de finale                  │
│  Coupe du Monde 2018     Groupes                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

List of major tournaments this player has been called up for, with the team's result in each.

For "À venir" tournaments (WC 2026 for currently active players): shows the upcoming context with a forward-looking framing.

Source: cross-reference `/fixtures?team=NATIONAL_TEAM_ID&season=Y` with `/fixtures/players` to detect player participation. The participation list is derivable but requires aggregation. Cached per (player, tournament) with 24h TTL.

Each tournament name → that tournament's Page 3.

#### Block 3 — Recent national-team matches

```
┌─ Derniers matchs en sélection ──────────────────────────┐
│                                                         │
│ 19/03  Amical      Maroc 3-1 Côte d'Ivoire    90'   7.8 │
│ 18/11  Qualif WC   Maroc 2-1 Tanzanie         90'+1A 7.9│
│ 15/10  Qualif WC   Niger 0-1 Maroc            90'   7.3 │
│ 12/10  Qualif WC   Zambie 0-2 Maroc           67'   7.5 │
│                                                         │
│ Voir tous les matchs en sélection →                     │
└─────────────────────────────────────────────────────────┘
```

Last 6-8 national-team matches. Same format as Saison tab Block 3 but scoped to national team only.

#### Empty state — no national team

If `national_team_id` is null, the entire Sélection tab hides. Center column reverts to 2-tab structure: `Saison ● Carrière`.

For retired players who had a national-team career, tab persists and shows historical participation (no upcoming context).

---

## Section 8 — Palmarès (Trophies timeline) — below center column, full content width

Standalone section below the 3-column zone. Chronological timeline pattern from Page 4, adapted for player context.

```
┌─ Palmarès ──────────────────────────────────────────────┐
│                                                         │
│  2024       🏆  Ligue 1 (avec PSG, 3ème titre)          │
│  2024       🏆  Coupe de France (avec PSG)              │
│  2023       🏆  Trophée des Champions (avec PSG)        │
│  2022-23    🏆  Ligue 1 (avec PSG, 2ème titre)          │
│  2022       🥉  Coupe du Monde, demi-finale (Maroc)     │
│  2022       🥉  AFCON, demi-finale (Maroc)              │
│  2021-22    🏆  Ligue 1 (avec PSG, 1er titre)           │
│  2020-21    🏆  Serie A (avec Inter Milan)              │
│                                                         │
│  Voir tous les titres →                                 │
└─────────────────────────────────────────────────────────┘
```

H2: `Palmarès` (FR) / `Trophies` (EN) / `الألقاب` (AR).

### Layout

Chronological list, most recent first. Per entry:
- Year or season label (left, fixed-width column)
- Result icon: 🏆 win / 🥈 final / 🥉 semifinal-or-deep-run / 🏅 individual award
- Achievement description with club/team context in parentheses

### Initial display + expand

Show top 8-10 entries by default. "Voir tous les titres →" expands inline.

### Data source

API-Football `/trophies?player=X` provides career trophies with competition, country, season, and result ("Winner" / "Runner-up" / "3rd Place" / etc.).

Mapped to display format:
- `Winner` → 🏆
- `Runner-up` → 🥈 (with "finaliste" qualifier)
- `3rd Place` → 🥉 (with "3ème" or "demi-finale" qualifier)

For national-team deep runs not covered by `/trophies` (e.g., WC 2022 semifinal — Morocco didn't win), add manual entries via `players.historical_titles_extra` field. Hand-curated for priority players.

### Editorial framing

Where possible, count context shown: "3ème titre" indicates how many times the player has won that specific competition. This is computed by ordering wins and numbering.

For individual awards (Player of the Tournament, Top Scorer, etc.), display:
```
2022   🏅  Joueur africain de l'année (CAF)
2021   🏅  Équipe-type Serie A
```

Source: hand-curated `players.individual_awards` field (not in API-Football's `/trophies` endpoint).

### National team variant — deep runs included

For Atlas Lions and other national-team contexts, semifinal and final appearances surface as trophy-level achievements:

```
2022   🥉  Coupe du Monde, demi-finale historique (4ème place)
2022   🥉  AFCON, demi-finale
```

Custom rendering per `result_type`: 'semifinal' / 'final' / 'quarterfinal' (player-page specific extension of Page 4 pattern).

### Empty / sparse players

For young or low-profile players with sparse trophy history:

```
Palmarès en construction. Suivez Mohamed Hamoutim pour les prochains titres.
```

Section hides entirely if zero recorded trophies AND player is currently active in their first 1-2 seasons.

---

## Section 9 — Vidéos section (below Palmarès, full content width)

Same component pattern as Pages 3-4. YouTube embeds via `youtube-nocookie.com`, lazy-loaded facade.

```
┌─ Vidéos ────────────────────────────────────────────────┐
│                                                         │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│ │  Thumbnail   │  │  Thumbnail   │  │  Thumbnail   │    │
│ │  [▶ play]    │  │  [▶ play]    │  │  [▶ play]    │    │
│ ├──────────────┤  ├──────────────┤  ├──────────────┤    │
│ │ Hakimi vs    │  │ But contre   │  │ Best of      │    │
│ │ Espagne 2022 │  │ Canada WC22  │  │ Hakimi PSG   │    │
│ │ 4:12 · YT    │  │ 0:45         │  │ 8:20         │    │
│ └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                         │
│  Voir plus →                                            │
└─────────────────────────────────────────────────────────┘
```

H2: `Vidéos` (FR) / `Videos` (EN) / `فيديوهات` (AR).

### Layout + implementation

Identical to Pages 3-4 Section 9 spec:
- 3-up grid at ≥1280px, 2-up at 768-1279px, 1-column on mobile
- `youtube-nocookie.com` domain (no tracking cookies until user clicks)
- `loading="lazy"` on iframes
- Facade pattern: thumbnail + play button initially; swap to iframe on first user click
- In-place inline playback (modal upgrade Phase 6+)

### Content curation

`media_youtube_ids: string[]` field per player. Hand-curated:
- Atlas Lions priority players (Hakimi, Diaz, Mazraoui, En-Nesyri, Amrabat, Aguerd, Bono, etc.): 6-12 videos each (WC 2022 highlights, key goals, interviews, hype reels)
- Botola Pro top players: 3-6 videos each
- Global stars (Mbappé, Vinicius, Bellingham, etc.): 6-12 videos
- Other covered players: empty arrays initially; populated when editorial time allows

Editorial cadence: refresh after major matches; quarterly content review.

### Empty state

If `media_youtube_ids` is empty:

```
Vidéos bientôt disponibles. Suivez-nous sur YouTube →
```

Includes Atlas Kings YouTube channel link (Phase 12+ placeholder until channel exists).

### Section visibility

Hides entirely if zero videos AND no YouTube channel link exists.

---

## Section 10 — Right rail (~280-300px)

Fixed 5-widget stack. Total rail height ~1500-1700px.

### Widget 1 — Top scorers (player's primary league) (~240px)

```
┌─ Buteurs · Ligue 1 25/26 ───┐
├─────────────────────────────┤
│ #  Joueur          Buts     │
│ 1  Dembélé          21      │
│ 2  Lacazette        17      │
│ 3  Mbappé           16      │
│ 4  Akliouche        13      │
│ 5  David            11      │
│                             │
│ Voir tous →                 │
└─────────────────────────────┘
```

Top 5-6 scorers from THIS player's primary competition (Ligue 1 for Hakimi, EPL for Bernardo Silva, Botola Pro for Wydad players, etc.). Context for ranking the player against their peers.

If the current player is in the top 5-6, their row is highlighted (gold border or background tint).

Each player row → player page (Page 5). "Voir tous →" → tournament-scoped scorers leaderboard (Phase 6+).

### Widget 2 — Top assists (~240px)

Same structure as Widget 1, scoped to assists. Same routing.

### Widget 3 — MoroccoConnection (~280px) — Page 5 specific

Page 5's distinctive right-rail widget. **Four state variants** per player type and Morocco signal.

**State 1 — Player is Moroccan (Atlas Lions member)**:

```
┌─ Connection marocaine ──────┐
│                             │
│ 🇲🇦 Coéquipiers en sélection │
│                             │
│ [photo] Brahim Diaz         │
│         Bayern Munich       │
│                             │
│ [photo] N. Mazraoui         │
│         Man United          │
│                             │
│ [photo] Youssef En-Nesyri   │
│         Fenerbahce          │
│                             │
│ [photo] Nayef Aguerd        │
│         Real Sociedad       │
│                             │
│ Voir tous →                 │
└─────────────────────────────┘
```

For Moroccan internationals, shows other Atlas Lions members with photos and current clubs. Up to 4-5 names visible; "Voir tous" expands.

Source: `players` table filtered by `national_team_id = MOROCCO_ID AND id != current_player_id`, sorted by recent international appearances.

Each player → that player's Page 5.

**State 2 — Player has Moroccan tie (played for Moroccan club, played against Morocco, ancestry, etc.)**:

```
┌─ Connection marocaine ──────┐
│                             │
│ 🇲🇦 Liens avec le Maroc     │
│                             │
│ • A joué au Wydad AC       │
│   2014-2016                 │
│                             │
│ • Adversaire de la sélection │
│   marocaine en 2018         │
│                             │
└─────────────────────────────┘
```

Hand-curated editorial copy. Surfaces players with notable Morocco connections without being Moroccan themselves (e.g., Riyad Mahrez — born in France, plays for Algeria, but had a notable rivalry with Morocco).

**State 3 — Non-Moroccan player at non-Moroccan club, no Morocco tie**:

Widget hides entirely. Right rail collapses to 4 widgets (Top scorers / Top assists / MoreMatchesToday / Newsletter).

This is the default for most non-Moroccan players in covered competitions. Examples: Bernardo Silva (no Morocco tie), Vinicius (no Morocco tie), most Premier League players.

**State 4 — Retired Moroccan international**:

```
┌─ Connection marocaine ──────┐
│                             │
│ 🇲🇦 Génération précédente   │
│                             │
│ Coéquipier de:              │
│                             │
│ [photo] Mehdi Benatia       │
│ [photo] Younès Belhanda     │
│ [photo] Mbark Boussoufa     │
│                             │
└─────────────────────────────┘
```

For retired Moroccan internationals, shows their generation of teammates (peer set from their playing era).

Source: Hand-curated editorial via `players.morocco_connection_override` field per priority player.

### Widget 4 — MoreMatchesToday (~280px)

Same component as Pages 2-4. Cross-competition fixtures today. Acts as back-link to homepage fixture browser.

For player pages, MoreMatchesToday prioritizes matches in the player's primary league + any international windows active. Provides "what else is happening in football" context without making the player page feel isolated.

### Widget 5 — Newsletter (~140px)

Same component as Pages 2-4. Player-specific framing:
```
Recevez les actus d'Achraf Hakimi directement.
```

---

## Section 11 — About card

Long-form keyword-bearing card at page bottom, after the Videos section, before the footer.

6 H2 sections + 6-8 FAQ entries, hand-written per locale for priority players. **Market value mention lives in this section** (no dedicated hero badge per Q-P5-C decision).

### Structure for Achraf Hakimi (FR worked example)

```
## À propos d'Achraf Hakimi

Achraf Hakimi Mouh, né le 4 novembre 1998 à Madrid, est un footballeur 
international marocain évoluant comme latéral droit au Paris Saint-Germain 
et capitaine de la sélection marocaine, les Lions de l'Atlas.

## Le parcours de Hakimi

Formé au Real Madrid à partir de 2006, Hakimi fait ses débuts en équipe 
première en 2017 avant un prêt à Borussia Dortmund (2018-2020). Transféré 
à l'Inter Milan en 2020 pour 40M €, il y remporte la Serie A 2020-21 puis 
rejoint le Paris Saint-Germain en 2021 pour environ 60M €. Selon 
Transfermarkt, sa valeur marchande actuelle est estimée autour de 70M €. 
Il fait partie de l'effectif type du PSG depuis son arrivée, avec lequel 
il a remporté plusieurs titres de Ligue 1 et coupes nationales.

## Capitaine des Lions de l'Atlas

Né à Madrid de parents marocains, Hakimi a choisi la sélection marocaine 
plutôt que l'Espagne. Il fait ses débuts internationaux en mars 2015 et 
compte aujourd'hui 92 sélections pour 12 buts. Capitaine des Lions depuis 
2024, il a été l'un des grands artisans de la demi-finale historique du 
Maroc à la Coupe du Monde FIFA 2022 au Qatar, et de la demi-finale CAN 2022.

## Style de jeu

Latéral droit moderne, Hakimi se distingue par sa vitesse exceptionnelle, 
ses montées offensives répétées, sa qualité de centre et sa capacité 
à marquer. Souvent comparé aux meilleurs latéraux européens, il combine 
contributions offensives (buts, passes décisives) et solidité défensive 
sur son côté. Sa polyvalence permet aussi de l'aligner en milieu droit 
selon les systèmes.

## Hakimi et la Coupe du Monde 2026

Comme tous les Lions de l'Atlas, Hakimi se prépare pour la Coupe du Monde 
FIFA 2026, co-organisée par le Maroc. Le Maroc évolue dans le Groupe C 
aux côtés de l'Argentine, l'Arabie saoudite et l'Égypte. Hakimi devrait 
être titulaire au poste de latéral droit et porter le brassard de 
capitaine sur les six villes marocaines accueillant des matchs.

## Atlas Kings et Achraf Hakimi

Atlas Kings couvre Hakimi avec une attention particulière à son parcours 
en Ligue 1 avec le PSG, à ses sélections avec les Lions de l'Atlas, et 
aux confrontations contre les autres internationaux marocains à 
l'étranger (Diaz au Bayern, Mazraoui à Man United, etc.).

## Questions fréquentes

### Quand est né Achraf Hakimi ?
Le 4 novembre 1998 à Madrid, en Espagne, de parents marocains originaires 
de Tétouan et Ksar el-Kébir.

### Pour quel pays joue Hakimi en sélection ?
Pour le Maroc (Lions de l'Atlas). Bien que né à Madrid et formé au Real 
Madrid, il a choisi la sélection marocaine, dont il est capitaine 
depuis 2024.

### Combien de sélections a Achraf Hakimi avec le Maroc ?
92 sélections pour 12 buts (au 17 mai 2026). Il fait ses débuts 
internationaux le 31 mars 2015.

### Quelle est la valeur marchande d'Achraf Hakimi ?
Selon Transfermarkt (référence publique standard), sa valeur marchande 
est estimée autour de 70M € en mai 2026. Cette estimation peut évoluer 
selon ses performances et l'état du marché.

### Quel a été le rôle d'Hakimi à la Coupe du Monde 2022 ?
Titulaire au poste de latéral droit tout au long de la compétition, il 
a marqué le penalty décisif face à l'Espagne en 1/8e de finale qui a 
qualifié le Maroc pour les quarts. Le Maroc a atteint la demi-finale, 
meilleure performance africaine et arabe de l'histoire de la WC.

### Quels clubs Hakimi a-t-il représentés ?
Real Madrid (2017-2020, formation puis première équipe), Borussia Dortmund 
(2018-2020, prêt), Inter Milan (2020-2021), et Paris Saint-Germain 
(depuis 2021).

### Quel est le poste préféré d'Hakimi ?
Latéral droit. Il peut aussi évoluer en milieu droit ou piston droit 
selon le système, mais latéral droit reste son poste principal.

### Hakimi est-il sous contrat avec le PSG ?
Oui, contrat jusqu'au 30 juin 2029 selon les sources publiques.
```

Per-locale variants. Arabic uses passionate fan-aligned tone per the keyword analysis. The "أسود الأطلس" team term used prominently.

### About card morocco_section for non-Moroccan players

For non-Moroccan players, the H2 "Morocco section" either:
- **Has Morocco tie**: explicitly framed (e.g., "Bernardo Silva contre les Lions" — describing matchups vs Morocco)
- **No Morocco tie**: section omitted entirely; About card has 5 H2 sections instead of 6

Hand-curated per priority player. For templated About cards (lower-priority players), the Morocco section template inserts only if a Morocco tie exists in editorial data.

### Market value editorial framing

For all priority players, Carrière section paragraph mentions market value with **Transfermarkt attribution**:

```
... Selon Transfermarkt, sa valeur marchande actuelle est estimée autour 
de 70M €.
```

For non-priority players (templated About cards), market value mention may be absent — only included when editorial data has been entered.

No automated/syndicated integration with Transfermarkt — editorial copy is hand-updated when valuations change significantly (quarterly or after major transfers).

### Data source

About card content lives in `players` table per entry:

```typescript
about_fr: {
  intro: string,
  journey: string,              // career arc narrative
  national_team_section: string, // Atlas Lions / national team context (player-specific)
  style: string,                // playing style description
  morocco_section: string | null, // for non-Moroccan players with ties; null otherwise
  editorial: string,            // Atlas Kings editorial framing
  faqs: Array<{ q: string, a: string }>
}
about_en: { ... }
about_ar: { ... }
```

Hand-written for priority players; templated for the rest.

---

## Section 12 — Live data and caching

### Pusher subscriptions on this page

| Element | Pusher channel | Update cadence |
|---|---|---|
| Adaptive top strip | (global, not player-specific) | per-event |
| Hero Previous/Next match cards | `fixture-{id}` for each shown match | per-event |
| Hero match snapshot rating (previous) | `fixture-{id}-player-{id}` rating | match-end |
| Hero player status indicator (injured / suspended / international duty) | `player-{id}-status` | as-status-changes |
| Featured match card (left rail) | `fixture-{id}` of selected fixture | per-event |
| Matches list — live rows | `fixture-{id}` for each visible live match | per-event |
| Matches list — per-match ratings | `fixture-{id}-player-{id}` rating | match-end |
| Recent Form sparkline | `player-{id}-form` | match-end |
| Saison tab summary tiles | `player-{id}-season-stats` | match-end |
| Saison tab recent matches with ratings | `fixture-{id}-player-{id}` for each | match-end |
| Carrière tab | (mostly static historical data) | weekly |
| Sélection tab caps/goals | `player-{id}-national-stats` | match-end (national-team windows only) |
| MoroccoConnection widget | `player-{id}-connection` | weekly (squad-related changes) |
| Top scorers / Top assists widgets | `competition-{id}-leaderboards` | post-match (batch) |

### Server-side caching

| Element | TTL |
|---|---|
| Hero (non-live, no status change) | 60s |
| Hero (live match featuring player) | 0s |
| Featured match card | 60s when no live; 0s when live |
| Matches list | 60s when no live; 0s when live |
| Recent Form sparkline | 60s when no live; 5 min otherwise |
| Saison tab Block 1+2 | 5 min |
| Saison tab Block 3 (recent matches) | 60s when live; 5 min otherwise |
| Carrière tab season-by-season | 24 hours (historical seasons rarely change) |
| Carrière tab transfers list | 24 hours (transfers happen in windows, not daily) |
| Sélection tab | 5 min during international windows; 24 hours otherwise |
| Palmarès section | 24 hours (trophy history; updates after tournament wins) |
| Videos section | 24 hours |
| About card | 24 hours (manually edited content) |
| MoroccoConnection widget | 24 hours |
| MoreMatchesToday widget | 60s |

Player status transitions (injury reported, suspension applied, international call-up) invalidate Hero cache immediately via Pusher.

### Multi-API-call mitigation for Carrière tab

Loading the Carrière tab requires `/players/teams?player=X` to get the career path, then one `/players?id=X&season=Y` call per season the player played. For a 10-year career: ~10 sequential API calls.

**Mitigation strategy**:
- First page load pre-fetches Carrière data lazily (don't block above-the-fold render)
- Server-side aggressively caches per (player, season) tuple — historical seasons effectively immutable
- 24-hour TTL on cached season stats; first load after 24h pays cost again, all subsequent loads within 24h served from Redis
- Background worker can pre-populate cache for top-N priority players to ensure first-load hit

For lower-traffic players, first Carrière tab load may take 1-2 seconds while season stats fetch sequentially. Acceptable — Carrière isn't the default tab; users explicitly opt in.

---

## Section 13 — Mobile (375px)

### Single-column stacked layout

```
[ADAPTIVE TOP STRIP ~40px]
[TOPBAR ~56px condensed]
[SEO breadcrumb ~22px, compact]
[HERO — mobile condensed ~380-420px]
  Photo 80×80 + name + bio facts (stacked)
  Narrative line (full text)
  Previous match card (full width)
  Next match card (full width, stacked below)
  Intro paragraph (full text)
[FEATURED MATCH CARD]
[TABS row]
  Saison ● Carrière Sélection
[H2 inside active tab]
[ACTIVE TAB CONTENT]
[MATCHES LIST]                     ← from left rail
[RECENT FORM SPARKLINE]            ← from left rail
[TOP SCORERS WIDGET]               ← from right rail
[TOP ASSISTS WIDGET]               ← from right rail
[MOROCCOCONNECTION CARD]           ← from right rail (if visible)
[NEWSLETTER]                       ← from rails
[MORE MATCHES TODAY]               ← from right rail
[PALMARÈS SECTION]                 ← stacked timeline
[VIDÉOS SECTION]                   ← 1-column video stack
[ABOUT CARD — full content]
[FOOTER vertical stack]
[FIXED BOTTOM TAB BAR ~56px]
```

### Mobile hero — Previous/Next match cards stacked

Side-by-side desktop layout (Sub-zone C) stacks to two full-width cards on mobile. Narrative line (Sub-zone B) wraps to 3 lines if needed.

Hero height on mobile: ~420-460px (taller than desktop due to stacked sub-zones).

### Mobile Saison tab — table simplification

Per-competition table on mobile reduces column count for narrow viewport:
- Compétition / MJ / Buts / Note (4 columns)

Other columns hidden but accessible via horizontal scroll OR per-row expansion.

### Mobile Carrière tab — season-by-season table

Same column reduction: Saison / Club / MJ / Note (4 columns).

Per-season expansion (per-competition breakdown) renders as inset card below row when tapped.

Transfer history list stacks naturally — date + arrow + clubs + fee fits 1-line on mobile.

### Mobile Sélection tab

Tournament participation table renders 1 row per tournament; Recent matches list scrolls horizontally if many.

### Mobile Palmarès

Same chronological list, narrower. "Voir tous" expands inline.

### Mobile Videos

1-column stack. Each video facade ~340px tall (16:9 ratio at 375px width minus padding).

---

## Section 14 — All locked decisions summary

| Element | Decision |
|---|---|
| Page identity | Player profile family. Hakimi canonical instance for Moroccan international variant. Bernardo Silva = Sofascore reference data. Format Variants (Section 18) covers position-specific, domestic-league, non-Moroccan, women, retired adaptations. |
| URL canonical | `/[locale]/joueur/[country]/[player-slug]` |
| URL — `/joueur/` segment | Not translated; same across all locales |
| URL — country segment | Primary nationality (per international representation) |
| Tab state | Hash fragments per locale (`#saison` / `#carriere` / `#selection`) |
| hreflang | All three locale variants reference each other; `x-default` → FR |
| Hero | Player-specific structure: identity sub-zone + **narrative line sub-zone** + Previous/Next match snapshots + intro paragraph. ~300px height. Narrative line is the Page 5 differentiator. |
| H1 | Player full name, IBM Plex Sans 32px semibold |
| Narrative line | Hand-curated `narrative_line_fr/en/ar` for ~60-80 priority players at launch. Templated fallback for the rest. |
| Sticky mini-header on scroll | Deferred Phase 6+ (consistent with Page 4) |
| COMPARE button in hero top-right | NOT present — moved to Phase 6+ right-rail affordance |
| Intro paragraph | Keyword-loaded 30-50 words per locale, hand-written for priority players |
| Center column tabs | 3 tabs: Saison (default) / Carrière / Sélection. Sélection hides if `national_team_id` null. |
| Saison tab default | Yes for active players. For retired, defaults to Carrière. |
| Saison tab content | 5 summary tiles + per-competition stats table + recent matches with ratings. Position-aware tile rendering (GK vs outfield). |
| Saison tab heatmap | NOT present — API-Football no positional data; Sofascore proprietary. Cut per data-availability sweep. |
| Carrière tab content | Season-by-season table (expandable per-competition rows) + transfer history list. Transfermarkt-pattern, no overlay chart. |
| Sélection tab content | National team header + tournament participation + recent national matches. Hidden if no national team. |
| Per-match ratings | Displayed throughout: left rail matches list, hero Previous match snapshot, Saison tab Block 3, Carrière tab season aggregates. API-Football `/fixtures/players` rating field. |
| Left rail | 4 cards: Featured match → Matches list (with per-match ratings) → Recent Form **sparkline** → Newsletter |
| Right rail | 5 widgets: Top scorers / Top assists / MoroccoConnection (4 variants) / MoreMatchesToday / Newsletter |
| MoroccoConnection variants | 4 states: (1) Moroccan player → Coéquipiers en sélection / (2) Non-Moroccan with tie → editorial / (3) No tie → hide widget / (4) Retired Moroccan → Génération précédente |
| Featured match (left rail Card 1) | Form line for club fixtures; FIFA ranking comparison for national-team fixtures. Same Loi 09-08 replacement as Pages 3-4. |
| Recent Form chart | Sparkline (last 10 ratings) — cleaner aesthetic than Page 4 vertical bars. Hover tooltips with match detail. |
| Palmarès | Standalone section below center column. Chronological timeline. Includes deep-run results for national-team appearances (semifinals, etc.) — Page 5 specific extension. |
| Vidéos | Standalone section below Palmarès. Same component as Pages 3-4. youtube-nocookie.com + facade lazy-load. |
| Market value display | NOT in hero, NOT in dedicated card. Editorial mention in About card with Transfermarkt attribution. |
| Attribute pentagon | NOT present — Sofascore proprietary, no API source. |
| Position diagram with strengths/weaknesses | NOT present — editorial guesses, no API source. |
| Fantasy tab | NOT present — out of scope per CLAUDE.md Rule 11 |
| Coverage gating | Stats blocks gated by `statistics_players: true` flag per league. Empty states for low-coverage leagues. |
| About card | Bottom of page. 6 H2 sections + 6-8 FAQ. Hand-written per locale for priority players. Morocco section for non-Moroccan players with ties. Market value mention here. |
| Live data | Pusher per-fixture for live matches; player-state for status changes; player-form for rating updates |
| Caching | 60s live / 5min stats / 24h career history / 24h palmarès / 24h about |
| Mobile (375px) | Single-column stack. Hero match cards stack vertically. Per-competition table column reduction. |
| Compliance | Loi 09-08 (no odds — form line / FIFA ranking replaces). YouTube via youtube-nocookie.com. No Sign In until Phase 10. |
| Placeholder content | Real Hakimi seed data for canonical instance. Bernardo Silva data referenced via research file. Mbappé/Vinicius/other priority players seeded by editorial. |

---

## Section 15 — Component inventory for Phase 4.5 implementation

### New components to build (Page 5 specific)

| Component | Location | Reuse on other pages |
|---|---|---|
| PlayerPageHeader | src/components/player/PlayerPageHeader.tsx | Page 5 only |
| PlayerNarrativeLine | src/components/player/PlayerNarrativeLine.tsx | Page 5 specific differentiator |
| PlayerMatchSnapshotCard | src/components/player/PlayerMatchSnapshotCard.tsx | Page 5 (Previous + Next with rating display) |
| PlayerStatusBadge | src/components/player/PlayerStatusBadge.tsx | Page 5 (injured/suspended/international duty) |
| SaisonTabContent | src/components/player/SaisonTabContent.tsx | Page 5 |
| SaisonSummaryTiles | src/components/player/SaisonSummaryTiles.tsx | Page 5 (position-aware: GK vs outfield) |
| PerCompetitionStatsTable | src/components/player/PerCompetitionStatsTable.tsx | Page 5 (Saison tab Block 2) |
| RecentMatchesWithRatings | src/components/player/RecentMatchesWithRatings.tsx | Page 5 (Saison tab Block 3) |
| CarriereTabContent | src/components/player/CarriereTabContent.tsx | Page 5 |
| SeasonByCareerTable | src/components/player/SeasonByCareerTable.tsx | Page 5 (Carrière tab Block 1, expandable rows) |
| TransferHistoryList | src/components/player/TransferHistoryList.tsx | Page 5 (Carrière tab Block 2) |
| SelectionTabContent | src/components/player/SelectionTabContent.tsx | Page 5 (national team tab) |
| NationalTeamHeader | src/components/player/NationalTeamHeader.tsx | Page 5 (Sélection tab Block 1) |
| TournamentParticipationList | src/components/player/TournamentParticipationList.tsx | Page 5 (Sélection tab Block 2) |
| RecentFormSparkline | src/components/player/RecentFormSparkline.tsx | Page 5 (left rail Card 3) — distinct from Page 4's vertical bar chart |
| PlayerMatchesListWithRatings | src/components/player/PlayerMatchesListWithRatings.tsx | Page 5 (left rail Card 2 — per-match rating column) |
| PlayerPalmaresTimeline | src/components/player/PlayerPalmaresTimeline.tsx | Page 5 (extends Page 4 PalmaresTimeline with player-specific result_types) |
| PlayerMoroccoConnectionCard | src/components/widgets/PlayerMoroccoConnectionCard.tsx | Page 5 right rail (4 state variants) |
| PlayerAboutCard | src/components/player/PlayerAboutCard.tsx | Page 5 (with market value editorial framing) |

### Reused from Pages 2-4 (no changes needed)

- InnerPageShell
- FixtureRow (used in Featured card + Matches list + Match Snapshot cards)
- VideosSection (from Pages 3-4)
- YouTubeFacade (from Pages 3-4)
- AboutCard structure (from Pages 2-4)
- FAQList
- StructuredDataInjector (with Person variant for players)
- TopScorersWidget (right rail Widget 1)
- TopAssistsWidget (right rail Widget 2)
- MoreMatchesTodayWidget (right rail Widget 4)
- NewsletterCard
- FifaRankingBadge (when national-team context surfaces)

### Reused from homepage.md (no changes needed)

- AdaptiveTopStrip
- Topbar
- SeoBreadcrumb
- Footer
- MobileBottomTabBar
- MobileHamburgerDrawer

### Database schema additions required

```typescript
// players table (new)
team_type, country_code, country_code_secondary,
firstname, lastname, name_full, name_ar,
nickname_fr/en/ar,
date_of_birth, place_of_birth, height_cm, weight_kg, preferred_foot,
position_primary, position_specific,
photo_url, status, gender,
current_team_id, current_squad_number, contract_until,
national_team_id, captain_of_national, national_caps, national_goals,
narrative_line_fr/en/ar,
media_youtube_ids,
about_fr/en/ar (jsonb with sections),
slug, slug_suffix, slug_ar,
historical_titles_extra (for non-API trophies like WC2022 4th place),
individual_awards,
morocco_connection_override (for editorial States 2/4)

// Indexes
country_code, national_team_id, current_team_id, status, slug
```

---

## Section 16 — Open questions for Phase 4.5 implementation

| Question | Owner | Decision target |
|---|---|---|
| Narrative line — exact character limit (~80 chars across 2 lines? 120?) | Editorial | 4.5a |
| Match snapshot rating display — visual emphasis (badge? inline text? color-tinted number?) | UX | 4.5a |
| Recent Form sparkline — exact match count: 10 or 12? Cross-competition or primary league only? | Product | 4.5a |
| Saison tab per-competition table — which expansion to show on mobile vs desktop? | UX | 4.5a |
| Carrière tab — handling players with 20+ season careers (pagination? "Voir plus" expansion threshold?) | UX | 4.5b |
| Sélection tab — what counts as "tournament participation" exactly (any minute played? minimum 5 minutes? in squad but unused?) | Product | Phase 5 |
| MoroccoConnection — for State 2 (editorial Morocco tie), how is the "tie" surfaced in data? Tagged field per player? | Editorial | 4.5b |
| Palmarès — semifinal/quarterfinal national team runs: which qualify? (WC and AFCON semis = yes; Friendly tournament wins?) | Editorial | 4.5b |
| Position-aware tiles — exact column sets for each position (GK / DEF / MID / FWD)? Fine-grained or coarse? | Product | 4.5a |
| About card — market value update cadence editorially (monthly? quarterly?) | Editorial | 4.5b |
| Carrière tab caching strategy — pre-warm cache for top-100 players? Lazy fetch only? | Engineering | 4.5b |

---

## Section 17 — Differences from Sofascore Bernardo Silva reference

| Element | Sofascore | Atlas Kings |
|---|---|---|
| URL structure | `/football/player/bernardo-silva/331209` (trailing ID, /football root) | `/[locale]/joueur/[country]/[player-slug]` (locale-translated slugs, no trailing ID) |
| Locale handling | One URL (English-dominant) | Locale-translated slugs with hreflang bridges |
| Hero structure | Split: identity LEFT, match snapshots RIGHT | Stacked: identity TOP, narrative line MIDDLE, match snapshots BELOW |
| Narrative line | Not present (bare bio facts only) | YES — Page 5 differentiator. Hand-curated for priority players. |
| Sticky mini-header on scroll | Present (crest + name + favourite toggle) | Deferred Phase 6+ — avoids visual stacking with already-sticky topbar |
| COMPARE button hero top-right | Present | Removed from hero. Phase 6+ as right-rail affordance. |
| Followers count | Present (e.g., 64k) | Not present — Sofascore-specific feature |
| Left column cards | 7 cards: Player value (with voting) / Summary chart / Attribute pentagon / Position diagram / Transfer chart+list / National team / Fantasy promo | 4 cards: Featured match / Matches with ratings / Recent Form sparkline / Newsletter |
| Player value card with voting | Present | NOT present — speculative data, no source, gamification noise. Market value as editorial mention in About card only. |
| Attribute pentagon (ATT/TEC/TAC/DEF/CRE) | Present | NOT present — Sofascore proprietary composite. No data source. |
| Position diagram with Strengths/Weaknesses | Present | NOT present — editorial guesses dressed as data. |
| Transfer history line chart | Present | NOT present — overlay of market value + fees is data theater. Transfer list kept in Carrière tab. |
| Center column tabs | 5 tabs (Matches / Season / Career / Fantasy / Media) | 3 tabs (Saison / Carrière / Sélection). Media → Videos section below tabs. Matches → left rail (more useful as ongoing context than a tab). Fantasy → Rule 11 |
| Default tab | Matches | Saison (current-season focus matches return-visit intent) |
| Season tab heatmap | Full-pitch positional activity heatmap | NOT present — API-Football no positional data. Sofascore proprietary. Documented cut. |
| Season tab xG/xA columns | Present | NOT present — not in API-Football |
| Season tab monthly rating chart | Present (12-month bar chart) | NOT present — would require expensive aggregation; per-season aggregate rating displayed instead |
| Career tab table | Present (similar structure) | YES, same pattern. Expandable per-competition rows. |
| Career tab data | Includes xG/xA columns | Excluded — not in API-Football |
| Fantasy tab | Present (UCL fantasy data) | NOT present — Rule 11 |
| Media tab | Sub-tabs All/Highlights/Social/News | Standalone Videos section below tabs (consistent with Pages 3-4). News deferred Phase 12+. |
| YouTube embeds | Standard `youtube.com` (tracking cookies) | `youtube-nocookie.com` (no tracking) + facade lazy-load pattern |
| National team card | Small left-column card with caps/goals + flag | First-class Sélection tab — header + tournament participation + recent matches. Major elevation. |
| Per-match rating display | In Matches tab table | YES — displayed throughout: hero Previous match, left rail Matches list, Saison tab Block 3, Carrière tab season averages |
| Sofascore Analyst /upgrade promo | Present | NOT present — no premium tier in v2 |
| bet365 odds in Featured match | Present in match-detail context | NOT present — Loi 09-08 |
| MoroccoConnection widget | Not present | Page 5 addition. 4 state variants. |
| Hero match snapshot rating | Not shown on Previous card | YES — Page 5 surfaces it (API-Football has the data) |
| Recent Form chart in left rail | Not present on player page | YES — sparkline (Page 5 addition) |
| Palmarès / Trophies | In Details tab as a list | Standalone chronological timeline section below center column (consistent with Page 4 pattern, extended for player-specific result_types like semifinal/final) |
| About card | Brief description | Long-form 6 H2 sections + 6-8 FAQ. Market value editorial mention with Transfermarkt attribution. |
| Compare button | Hero top-right | Phase 6+ affordance |
| Embed widget button | Present | Deferred Phase 12+ (syndication) |

---

## Section 18 — Format variants

Atlas Kings Page 5 template canonically documents Achraf Hakimi (Moroccan international abroad). This section documents deltas for other player types.

### Variant A — Domestic-league Moroccan player

**Applies to**: Moroccan players in Botola Pro (Wydad / Raja / FAR / Maghreb / RS Berkane players who haven't moved abroad).

**Key reference**: Mohamed Hamoutim (Wydad AC striker, Moroccan international).

**Deltas from Hakimi canonical**:

| Element | Hakimi (canonical) | Variant A (domestic Moroccan) |
|---|---|---|
| URL country segment | `maroc` | Same |
| Hero current club line | "PSG (depuis 2021) · #14 · Contrat jusqu'en 2029" | "Wydad AC (depuis 2020) · #14 · Contrat jusqu'en 2027" |
| Hero narrative line | International + WC2022 + caps | "Attaquant régulier du Wydad" + "Buteur de Botola Pro · Sélection récente des Lions" |
| Featured match competition context | Ligue 1 / UCL primary | Botola Pro / CAF CL primary |
| Right rail Widget 1+2 (Top scorers/assists) | Ligue 1 25/26 | Botola Pro 25/26 |
| MoroccoConnection variant | State 1: Coéquipiers en sélection (mix of Botola + abroad players) | State 1: Coéquipiers en sélection (mix of Botola teammates + abroad players) |
| Carrière tab transfer history | Multi-country journey (Spain → Germany → Italy → France) | May be single-country (Wydad youth → first team) or limited domestic moves |
| About card morocco_section | Implicit — player IS Moroccan | Same |
| Palmarès | International + club | Mostly club (Botola titles, CAF appearances) |

Same template, content adapts to data. URL pattern identical (`/joueur/maroc/[slug]`).

### Variant B — Non-Moroccan international (global star)

**Applies to**: Players from other nations covered by Atlas Kings (Mbappé, Vinicius, Bellingham, Bernardo Silva, etc.) — selected because their leagues/competitions are covered.

**Key reference**: Kylian Mbappé (French, Real Madrid) / Bernardo Silva (Portuguese, Manchester City).

**Deltas from Hakimi canonical**:

| Element | Hakimi (canonical) | Variant B (non-Moroccan international) |
|---|---|---|
| URL country segment | `maroc` | `france` / `portugal` / `angleterre` / `bresil` / etc. |
| Hero narrative line | Atlas Lions captain + WC2022 demi | "Pilier du Portugal · UCL 2023 · 99 sélections" / "Star du Real Madrid · WC 2018 + 2022 finaliste · 96 sélections France" |
| Sélection tab Maroc context | Tournament participation includes WC2022 demi, AFCON, etc. | Tournament participation includes that player's national-team history (Euros, WC for their country, etc.) |
| MoroccoConnection widget | State 1 — Coéquipiers en sélection | **State 3 — widget hides entirely** for most non-Moroccan players. State 2 (editorial Morocco tie) for the rare case of historical connection. |
| About card morocco_section | Implicit | Optional H2 section — only present if player has notable Morocco tie. For Mbappé: present if WC2022 round-of-16 vs Morocco is editorial-noted. For Bernardo Silva: hidden. |
| Right rail Widget 1+2 context | Ligue 1 | EPL (Bernardo) / La Liga (Mbappé) / Bundesliga / Serie A — player's primary league |
| Featured match algorithm priority | Club + Atlas Lions | Club + their national team (different national team) |

URL pattern same template (`/joueur/[country]/[player-slug]`). Variant B is the broadest in coverage scope — most non-Moroccan covered players fall here.

### Variant C — Goalkeeper

**Applies to**: All goalkeepers regardless of nationality.

**Key reference**: Yassine Bounou (Bono — Atlas Lions goalkeeper, Al-Hilal) for Moroccan GK; Ederson (Manchester City) for non-Moroccan GK.

**Deltas from Hakimi canonical** (position-aware rendering per Q-P5-H):

| Element | Outfield (canonical) | Goalkeeper variant |
|---|---|---|
| Saison tab Summary tiles | MATCHS / MIN / BUTS / ASSISTS / NOTE | MATCHS / MIN / **CLEAN SHEETS** / **ARRÊTS** / NOTE |
| Saison tab Per-competition table columns | MJ / Min / Buts / Assists / Note | MJ / Min / **Clean sheets** / **Arrêts** / Note |
| Carrière tab table columns | Buts / Ass / Note | **Clean sheets** / **Arrêts** / Note |
| Right rail Widget 1 (Top scorers) | Top scorers from player's league | Same — relevant to provide league context, not GK-specific |
| Right rail Widget 2 | Top assists | Could swap to "Top clean sheets" / "Top arrêts" leaderboard if API-Football provides — currently NOT in API. Stays as Top assists for v1 consistency. |
| Narrative line common modifiers | "Buteur" / "Passeur" / "Capitaine" | "Gardien titulaire" / "Capitaine défensif" / "Spécialiste des arrêts" |
| Palmarès | Trophies + assists/goals records | Trophies + clean-sheet records / Golden Glove awards (where applicable) |

The position_primary='GK' flag on `players` table drives all GK-specific rendering. Implementation: position-aware components check the player's `position_primary` and select appropriate tile/column sets.

### Variant D — Women's football

**Applies to**: All female players (Atlas Lionesses, women's club players in covered competitions).

**Key reference**: Ghizlane Chebbak (Atlas Lionesses captain).

**Deltas from Hakimi canonical**:

| Element | Men's (canonical) | Women's variant |
|---|---|---|
| URL country segment | Same | Same — gender doesn't affect country slug |
| URL player slug | Same first-last format | Same |
| Hero national team line | "Capitaine des Lions de l'Atlas" | "Capitaine des Lionnes de l'Atlas" |
| Featured match competition context | Men's primary league | Women's primary league (typically smaller list — fewer covered) |
| Sélection tab tournaments | WC 2022, AFCON 2022, WC 2026 qualif | WAFCON 2022 final, WC Women 2023, Olympics |
| Right rail Top scorers/assists context | Men's league | Women's league |
| MoroccoConnection widget | Atlas Lions teammates | **Atlas Lionesses teammates** — different player pool |
| About card morocco_section | Same | Same — women's Morocco context |

Implementation: `gender: 'F'` flag drives women's-competition context selection. Component reuse is high (~95% identical to men's) with field substitutions.

### Variant E — Retired player

**Applies to**: Recently-retired players still editorially relevant (post-2018 retirement, key Atlas Lions figures like Younès Belhanda, Medhi Benatia).

**Deltas from Hakimi canonical**:

| Element | Active (canonical) | Retired variant |
|---|---|---|
| Hero identity | Photo + name + bio + current club + contract end | Photo + name + bio + **"Retraité depuis YYYY"** label |
| Hero Sub-zone C | Previous + Next match | Previous match (final career match) + **"Retraité"** card (no next match) |
| Featured match (left rail) | Current/next match | Empty state: "Carrière terminée. Voir le palmarès complet ↓" routing to Palmarès |
| Matches list (left rail) | Recent + upcoming | Historical only, capped at "Carrière complète" link to Carrière tab |
| Recent Form sparkline | Last 10 matches | Hidden — no recent activity |
| Default tab | Saison (current) | **Carrière** (no current season) |
| Saison tab | Current season stats | Last active season stats with retirement context. Or hides entirely if no season data within last 12 months. |
| Sélection tab | Current + recent national-team activity | Historical only — last call-up date highlighted. Hides if no national team. |
| Palmarès | Active career trophies | Final career palmarès — typically the strongest content on a retired-player page |
| Pusher subscriptions | Player-state, fixture updates | Minimal — historical data only |
| Caching TTL | 60s-5min for live data | 24h-7d (retired data effectively immutable) |

Component reuse same as active players; state machine adapts via `status: 'retired'` flag.

### Variant F — Young / academy player

**Applies to**: Players with sparse data (first 1-2 senior seasons), academy-level or U-23 players gaining coverage.

**Deltas from Hakimi canonical**:

| Element | Established (canonical) | Young variant |
|---|---|---|
| Hero narrative line | Polished hand-curated | Generic template ("Jeune attaquant du PSG · Équipe-type des moins de 23 ans") |
| Saison tab | Rich stats across competitions | Often sparse — first season has limited per-competition coverage |
| Carrière tab | Multi-season journey | Short — 1-2 rows. "Carrière en construction" framing. |
| Transfer history | Multiple moves | Often empty — single academy promotion only |
| Sélection tab | Full national team history | Often shows only U-23 / U-17 selections if no senior caps |
| Palmarès | Multiple titles | Sparse or empty. "Palmarès en construction" framing. |
| Videos section | Hand-curated clips | May be empty initially. Empty state surfaces. |
| About card | Long-form hand-written | Templated until editorial bandwidth covers them |

Components handle empty states gracefully — every section has a documented empty state. No layout breaks when data is sparse.

---

## Section 19 — Outbound link targets

Every clickable destination on the page (Achraf Hakimi canonical instance). Documented against the spec (Sections 4-13), not extrapolated.

Routes documented per the patterns established in Pages 1-4. Phase 6+ deferred-affordance rule applies (render as non-clickable text until destination ships).

### Category 1 — Routes to existing Pages 1-7

**Inherited chrome (per Section 4)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Topbar — all items | Per homepage Section 16 | Pages 1-7 | Per topbar routing |
| SeoBreadcrumb segment 1 ("Football") | Homepage | Page 1 | `/fr` |
| SeoBreadcrumb segment 2 (country) | Country index (Phase 6+ deferred) | — | (reserved) |
| SeoBreadcrumb segment 3 (current competition for context) | Competition page | Page 2 or 3 | `/fr/competition/[country]/[slug]` |
| SeoBreadcrumb segment 4 (player name) | Current page (non-clickable) | — | — |
| Footer — all links | Per homepage Section 16 | Pages 1-7 | Per footer routing |
| Mobile bottom tab bar — Matchs | Homepage | Page 1 | `/fr` |

**Hero (per Section 5)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Player photo, H1, narrative line text | Non-clickable (page identity) | — | — |
| Country flag + nationality (Sub-zone A line 2) | Country index (Phase 6+ deferred) | — | (reserved) |
| Current club name | Team page | Page 4 | `/fr/equipe/[country]/[club-slug]` |
| Squad number | Non-clickable | — | — |
| Contract until date | Non-clickable | — | — |
| FIFA ranking badge (when shown for national team context) | FIFA rankings page (Phase 6+) | — | `/fr/classements/fifa` |
| Previous match card (entire card) | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Previous match card — player's team crest | Team page | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| Previous match card — opponent crest/name | Opponent team page | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| Previous match card — rating number | Non-clickable | — | — |
| Previous match card — competition label | Competition page | Page 2 or 3 | `/fr/competition/[country]/[slug]` |
| Next match card (same pattern) | Match detail | Page 6 | `/fr/match/[match-slug]` |
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
| Card 2 — per-match rating column | Non-clickable | — | — |
| Card 2 — "Voir tous les matchs →" | Same page Matches list scrolled / no destination | — | — |
| Card 3 Recent Form sparkline — points | Non-clickable in v1 (tooltip only). Phase 6+: match detail | — | (Phase 6+ enhancement) |
| Card 3 — ⓘ info icon | Tooltip (no navigation) | — | — |
| Card 4 Newsletter — submit | In-place toast | — | — |

**Center column tabs row (per Section 7)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Tab change (Saison / Carrière / Sélection) | Same page, hash fragment update | — | `#saison`, `#carriere`, `#selection` |

**Saison tab (per Section 7)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Summary tile values | Non-clickable | — | — |
| Per-competition table row | That competition's page | Page 2 or 3 | `/fr/competition/[country]/[slug]` |
| Per-competition table — competition logo | Same as row | Page 2 or 3 | Same |
| Recent matches row | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Recent matches — opponent crest/name | Team page | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| Recent matches — rating | Non-clickable | — | — |
| "Voir tous les matchs →" | Phase 6+ player matches archive page | — | (reserved) |

**Carrière tab (per Section 7)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Season-by-season — club name | Team page | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| Season-by-season — row chevron (expand) | In-tab expansion | — | — |
| Per-competition breakdown — competition name | Competition page | Page 2 or 3 | `/fr/competition/[country]/[slug]` |
| Transfer history — from club name | Team page | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| Transfer history — to club name | Team page | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| Transfer history — fee amount | Non-clickable | — | — |
| Filters (Compétition / Total-Per90) | In-tab state change | — | — |

**Sélection tab (per Section 7)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| National team name + flag (Header Block 1) | National team page | Page 4 | `/fr/equipe/[country]/equipe-nationale` |
| Sélectionneur name | Manager page (Phase 6+ deferred — non-clickable in v1) | — | (reserved) |
| "Voir l'équipe nationale" link | National team page | Page 4 | Same as above |
| Tournament participation — tournament name | Tournament page | Page 3 | `/fr/competition/[confederation]/[tournament-slug]` |
| Recent national matches row | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Recent national matches — opponent crest/name | Opponent team page | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| "Voir tous les matchs en sélection" | Phase 6+ scoped matches archive | — | (reserved) |

**Palmarès section (per Section 8)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Trophy entry — competition name | Competition page | Page 2 or 3 | `/fr/competition/[country]/[slug]` |
| Trophy entry — club context | Team page | Page 4 | `/fr/equipe/[country]/[team-slug]` |
| Trophy entry — year/season label | Non-clickable | — | — |
| Trophy entry — result icon | Non-clickable | — | — |
| "Voir tous les titres →" | Inline expansion (Phase 4.5); player-trophies archive Phase 6+ | — | (reserved) |

**Videos section (per Section 9)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Video facade thumbnail | Inline iframe swap (in-place YouTube playback) | — | — |
| Video card title | Same as thumbnail click | — | — |
| "Voir plus →" | Inline expansion (Phase 4.5); Phase 6+ video page when expansion exceeds N | — | (reserved) |
| Empty state YouTube channel link | External (Phase 12+) | — | External |

**Right rail (per Section 10)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Widget 1 Top scorers — header | Player's primary league page | Page 2 | `/fr/competition/[country]/[slug]` |
| Widget 1 — player row | Player page | Page 5 | `/fr/joueur/[country]/[player-slug]` |
| Widget 1 — "Voir tous →" | Tournament-scoped scorers leaderboard | Phase 6+ feature page | `/fr/classements/buteurs/[competition-slug]` |
| Widget 2 Top assists — same pattern | Player page / Phase 6+ | Page 5 / Phase 6+ | Same pattern |
| Widget 3 MoroccoConnection — player rows | Player pages | Page 5 | `/fr/joueur/[country]/[player-slug]` |
| Widget 3 — "Voir tous →" | Phase 6+ Moroccan players filter page | — | (reserved) |
| Widget 4 MoreMatchesToday — fixture | Match detail | Page 6 | `/fr/match/[match-slug]` |
| Widget 4 — competition name | Competition page | Page 2 or 3 | `/fr/competition/[country]/[slug]` |
| Widget 5 Newsletter — submit | In-modal confirmation toast | — | — |

**About card (per Section 11)**:

| Click source | Destination | Page template | URL pattern (FR example) |
|---|---|---|---|
| Entity name in body copy (team names, player names, competitions, stadiums, coaches) | Corresponding entity pages where shipped; non-clickable text where Phase 6+ deferred | Pages 2-5 | Per entity URL |
| Internal anchor links | Same page hash scroll | — | — |
| FAQ entity references | Corresponding entity pages | Pages 2-5 | Per entity URL |
| "Transfermarkt" mention in market value text | Non-clickable text (no external link in v1 — Phase 6+ could add attribution link) | — | (reserved) |

### Category 2 — In-page interaction (no navigation)

Summary of types (all marked with em-dashes in Category 1):

- All tab changes (hash fragment update only)
- All sub-tabs and filter pills
- Competition + season selectors
- Date navigator chevrons
- Position-aware tile rendering (server-side, not user-triggered)
- Per-season expansion in Carrière tab
- All accordions ("Voir plus" expansions)
- Sparkline point hover (tooltip)
- Video facade clicks (swap to iframe)
- Newsletter form submission
- Favourite star icons (stub until Phase 10)

### Category 3 — Routes to Phase 6+ feature pages

| Click source | Reserved URL | Phase |
|---|---|---|
| Hero country flag/name (Sub-zone A line 2) | `/[locale]/pays/[country-slug]` | Phase 6+ |
| Hero FIFA ranking badge (national team context) | `/[locale]/classements/fifa` | Phase 6+ |
| Sélection tab — sélectionneur name | `/[locale]/entraineur/[slug]` | Phase 6+ (manager page reserved across all schematics) |
| Right rail Widget 1 "Voir tous →" | `/[locale]/classements/buteurs/[competition-slug]` | Phase 6+ |
| Right rail Widget 2 "Voir tous →" | `/[locale]/classements/passeurs/[competition-slug]` | Phase 6+ |
| Right rail Widget 3 "Voir tous →" | Phase 6+ Moroccan players filter page | Phase 6+ |
| Saison tab "Voir tous les matchs →" | Phase 6+ player matches archive page | Phase 6+ |
| Sélection tab "Voir tous les matchs en sélection" | Phase 6+ scoped matches archive | Phase 6+ |
| Palmarès "Voir tous les titres →" overflow | Player trophies archive page | Phase 6+ |
| Videos section "Voir plus →" overflow | Phase 6+ player videos page | Phase 6+ |
| Recent Form sparkline point click | Match detail (Phase 6+ enhancement) | Phase 6+ |
| About card Transfermarkt attribution link | External Transfermarkt link (with `rel="noopener nofollow"` if added Phase 6+) | Phase 6+ (currently non-clickable text) |
| Hero "Compare" affordance (when added) | `/[locale]/comparer/joueurs/[id]` | Phase 6+ |
| Topbar 🔍 Search trigger | `/[locale]/recherche` | Phase 6+ |
| Mobile bottom tab bar — Recherche / Favoris / Paramètres | Various Phase 6+/10 URLs | Phase 6+ / Phase 10 |

**Deferred-affordance rule** (consistent with Pages 1-4): destinations listed in Category 3 render as non-clickable text or open a "Bientôt disponible" lightweight overlay, never as broken links or 404s, until destination ships.

### Category 4 — Explicit divergences from Sofascore routing

| Sofascore pattern | Atlas Kings pattern | Rationale |
|---|---|---|
| bet365 odds in Featured match cards | Form line (clubs) or FIFA ranking (national-team contexts) | Loi 09-08 |
| Sofascore Analyst /upgrade promo | NOT present | No premium tier in v2 |
| Sofascore Fantasy promo | NOT present | Out of scope per Rule 11 |
| Player value card with voting | NOT present — editorial mention in About card with Transfermarkt attribution | No speculative data; Transfermarkt is the public reference |
| Attribute pentagon | NOT present | Proprietary composite, no API source |
| Position diagram with Strengths/Weaknesses | NOT present | Editorial guesses dressed as data; no source |
| Transfer history line chart overlay | NOT present (list kept) | Overlay is data theater; list is clean and factual |
| Season heatmap (positional activity) | NOT present | API-Football no positional data; Sofascore proprietary |
| xG / xA columns | NOT present | Not in API-Football |
| Monthly rating chart (12-month bar chart) | NOT present | Expensive aggregation for marginal value; per-season aggregate suffices |
| 5 tabs (Matches/Season/Career/Fantasy/Media) | 3 tabs (Saison/Carrière/Sélection) | Tab consolidation; Matches in left rail; Fantasy/Media removed |
| National team data in small left-column card | First-class Sélection tab | Major elevation — national team identity matters more for player narrative than Sofascore acknowledges |
| Sticky mini-header on scroll | Deferred Phase 6+ | Avoid visual stacking with already-sticky topbar |
| COMPARE button hero top-right | Removed | Reduce hero clutter; affordance moved to Phase 6+ right rail |
| Embed widget button | Deferred Phase 12+ | No syndication in v2 |
| YouTube standard embeds (tracking cookies) | youtube-nocookie.com + facade pattern | Loi 09-08 data protection |

---

## Update log

- 2026-05-13 — Initial schematic locked after Phase 4.5+ design session. Achraf Hakimi canonical instance for Moroccan international variant; Bernardo Silva (Sofascore reference) + Mbappé/Vinicius/etc. as additional reference points; Mohamed Hamoutim canonical for domestic-league Moroccan player variant. Bono / Atlas Lionesses captain canonical for GK / women's variants. Inherits chrome from `docs/schematics/homepage.md`, page-shell patterns from `docs/schematics/competition-league.md` (Page 2), `docs/schematics/competition-cup.md` (Page 3), and `docs/schematics/team.md` (Page 4). Reference: `docs/research/bernardo-silva-sofascore-player-page-full-analysis.md`.

Page 5 differentiators from Sofascore: narrative line sub-zone in hero (Atlas Kings differentiator); 3-tab consolidation (Saison/Carrière/Sélection); Sélection elevated to first-class tab; per-match ratings displayed throughout (left rail matches list, hero Previous match, Saison tab Block 3); Recent Form as sparkline (not bars); MoroccoConnection right-rail widget with 4 state variants; Palmarès chronological timeline including national-team deep runs (semifinals).

Critical Sofascore elements cut per data-availability sweep (2026-05-13): player value card with voting (no data source); attribute pentagon (proprietary composite); position diagram with strengths/weaknesses (editorial guesses); transfer history line chart overlay (data theater); season heatmap (no positional data in API-Football); xG/xA columns (not in API); monthly rating chart (expensive aggregation, marginal value); Fantasy tab (Rule 11); news stream widget (Phase 12+).

Buildable from API-Football confirmed: profile + bio facts + injured status + per-season stats per competition with rating field + per-match rating via `/fixtures/players` + career history via `/players/teams` + transfer history via `/transfers` + trophies via `/trophies` + injury history via `/sidelined` + top scorers/assists per competition.

Schema additions: extensive `players` table with team_type, country_code, country_code_secondary, name fields per locale, nicknames, narrative_line_fr/en/ar (hand-curated), bio facts, current_team_id, contract_until, national_team_id, captain_of_national, national_caps, national_goals, media_youtube_ids, about_fr/en/ar with sections (intro/journey/national_team_section/style/morocco_section/editorial/faqs), historical_titles_extra (for non-API trophies like national-team semifinals), individual_awards, morocco_connection_override (for editorial Morocco-tie states).

Outbound routing matrix in Section 19 follows Pages 1-4 conventions with Phase 6+ deferred-affordance rule. Manager and Stadium pages reserved at `/[locale]/entraineur/[slug]` and `/[locale]/stade/[slug]` (consistent with Page 4).

- (Append future updates here with date and change description)
