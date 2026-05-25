# Center Column Schematic — Team Page

> Derived from `public/dev-widget-team.html` (808 lines).
> This is the authoritative visual spec for the center column of `/equipe/[...slug]`.

---

## Container

- Wrapper: `.card` — `bg-bg-surface`, `border border-border-subtle`, `rounded-xl`, `overflow-hidden`
- No body padding — tab bar sits flush at the top edge

## Tab Bar

Three tabs, rendered inline:

| # | Tab Label   | Hash (FR)    | Hash (EN)    | Hash (AR)   |
|---|-------------|--------------|--------------|-------------|
| 1 | Standings   | `classement` | `standings`  | `الترتيب`   |
| 2 | Statistics  | `statistiques`| `statistics` | `الإحصائيات`|
| 3 | Players     | `effectif`   | `squad`      | `التشكيلة`  |

- Active tab: `text-accent-green`, `border-b-2 border-accent-green`, `font-medium`
- Inactive tab: `text-text-secondary`, `border-b-2 border-transparent`
- Tab button: `py-2.5 px-5`, `text-sm (14px)`, `font-medium`, `margin-bottom: -2px` (overlaps bar border)
- Bar border: `border-b-2 border-border-subtle`

---

## Tab 1: Standings

### Filter row

```
┌──────────────────────────────────────────────────────┐
│  [Competition ▾]                                     │
└──────────────────────────────────────────────────────┘
```

- Single `<select>` dropdown
- Styling: `py-1.5 px-2.5 pr-7`, `rounded-lg`, `border border-border-subtle`, `bg-bg-page`, `text-text-primary`, `text-[13px]`, `min-w-[160px]`
- Options: all competitions the team participates in (derived from stats index or standings data)
- Changing selection re-renders the standings table for that competition + current season
- Container: `flex gap-2.5 py-3 flex-wrap`

### Table

```
 #  │ Team              │  P │  W │  D │  L │  GD  │ Pts
────┼───────────────────┼────┼────┼────┼────┼──────┼─────
  1 │ [logo] Team A     │ 30 │ 20 │  5 │  5 │  +32 │  65
  2 │ [logo] Team B     │ 30 │ 18 │  7 │  5 │  +25 │  61
► 3 │ [logo] CURRENT    │ 30 │ 17 │  8 │  5 │  +20 │  59   ← highlighted
  4 │ [logo] Team D     │ 30 │ 16 │  6 │  8 │  +14 │  54
 ...│                   │    │    │    │    │      │
```

- Full-width table, `border-collapse: collapse`, `text-[13px]`
- **Header row:**
  - `text-left`, `py-2 px-1.5`, `text-[11px]`, `font-semibold`, `uppercase`, `text-text-tertiary`
  - `border-b border-border-subtle`
  - `#` column: `w-7 text-center`
  - `Pts` column: `font-bold text-text-primary`
- **Body rows:**
  - `py-[7px] px-1.5`, `border-b border-border-subtle`
  - Last row: no bottom border
- **Team cell:**
  - `flex items-center gap-2`
  - Logo: `w-[18px] h-[18px] object-contain`
  - Name: plain text
- **Highlighted row (current team):**
  - All `<td>`: `bg-accent-green/8`
  - Team cell text: `text-accent-green font-semibold`
- **Group headers** (for cup competitions with groups like UCL):
  - Rendered above each sub-table
  - `text-xs font-bold text-accent-green uppercase py-3 pb-1.5`

### Empty state

```
No standings available for this competition.
```
- `text-sm text-text-secondary`

---

## Tab 2: Statistics

### Filter row

```
┌──────────────────────────────────────────────────────┐
│  [Competition ▾]  [Season ▾]                         │
└──────────────────────────────────────────────────────┘
```

- Two `<select>` dropdowns, same styling as Standings dropdown
- Competition: same list as Tab 1
- Season: descending order, format `2024/25`
- Changing either dropdown re-fetches the team statistics detail

### Content

Team statistics detail panel. This renders stat blocks / key-value rows (NOT a table). Content varies by API-Football response but typically includes:

- **Form:** last 5 match results (W/D/L badges)
- **Fixtures:** Played / Wins / Draws / Losses (home + away breakdown)
- **Goals:** Scored / Conceded, with home/away split
- **Biggest:** Biggest win, biggest loss, longest streak
- **Clean sheets / Failed to score:** counts
- **Penalty:** scored / missed / percentage
- **Lineups:** most used formations
- **Cards:** Yellow / Red totals

Each stat group is a labeled section with key-value pairs.

### DB dependency

Requires `team_statistics` table — **not yet populated**. Render a placeholder until data ingestion is done:

```
No statistics for this competition/season.
```

### Empty state

```
Select a competition and season.
```
- `text-sm text-text-secondary`

---

## Tab 3: Players (Squad)

No filter row. Content loads immediately.

### Layout

Grouped by position. Each group:

```
GOALKEEPERS
────────────────────────────────────────
[photo]   [photo]   [photo]
 Name      Name      Name
 25 yrs    28 yrs    22 yrs

DEFENDERS
────────────────────────────────────────
[photo]   [photo]   [photo]   [photo]   [photo]   [photo]
 Name      Name      Name      Name      Name      Name
 24 yrs    29 yrs    ...

MIDFIELDERS
────────────────────────────────────────
... same pattern ...

ATTACKERS
────────────────────────────────────────
... same pattern ...
```

### Position group title

- `text-xs (12px)`, `font-bold`, `uppercase`, `tracking-[0.06em]`
- `text-accent-green`
- `mb-2.5`, `pb-1.5`, `border-b border-border-subtle`

### Player grid

- `grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5`
- Each cell is a clickable card linking to `/[locale]/joueur/[player-slug]`

### Player card

- Container: `flex flex-col items-center gap-1`, `rounded-lg`, `px-1 py-2.5`
- Hover: `bg-accent-green/[0.06]`
- **Photo:** `w-12 h-12 (48px)`, `rounded-full`, `object-cover`, `border-2 border-border-subtle`, `bg-bg-surface-2`
  - On error: `opacity-30`
- **Name:** `text-xs (12px)`, `font-semibold`, `text-center`
- **Age:** `text-[11px]`, `text-text-secondary`

### Empty state

```
No squad data.
```
- `text-sm text-text-secondary`

### Group order

1. Goalkeepers
2. Defenders
3. Midfielders
4. Attackers

Position label comes from `player.position` field in the squad data.

---

## Spacing

- Card body padding (inside each tab content): `p-3 px-4` (12px 16px)
- Tab content container has no extra padding — the card-body inside each tab provides it
- Margin between squad groups: `mb-5`, last group `mb-0`
