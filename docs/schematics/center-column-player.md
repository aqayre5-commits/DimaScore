# Center Column Schematic — Player Page

> Derived from `public/dev-widget-player.html` (663 lines).
> This is the authoritative visual spec for the center column of `/joueur/[...slug]`.

---

## Container

- Wrapper: `.card` — `bg-bg-surface`, `border border-border-subtle`, `rounded-xl`, `overflow-hidden`
- No body padding — tab bar sits flush at the top edge

## Tab Bar

Three tabs, rendered inline:

| # | Tab Label   | Hash (FR)      | Hash (EN)      | Hash (AR)    |
|---|-------------|----------------|----------------|--------------|
| 1 | Statistics  | `saison`       | `season`       | `الموسم`     |
| 2 | Career      | `carriere`     | `career`       | `المسيرة`    |
| 3 | Trophies    | `palmares`     | `trophies`     | `الألقاب`    |

- Active tab: `text-accent-green`, `border-b-2 border-accent-green`, `font-medium`
- Inactive tab: `text-text-secondary`, `border-b-2 border-transparent`
- Tab button: `py-2.5 px-5`, `text-sm (14px)`, `font-medium`, `margin-bottom: -2px`
- Bar border: `border-b-2 border-border-subtle`

---

## Tab 1: Statistics (Current Season)

### Filter row

```
┌──────────────────────────────────────────────────────┐
│  [Season ▾]                                          │
└──────────────────────────────────────────────────────┘
```

- Single `<select>` dropdown
- Styling: `py-1.5 px-2.5 pr-7`, `rounded-lg`, `border border-border-subtle`, `bg-bg-page`, `text-text-primary`, `text-[13px]`, `min-w-[120px]`
- Options: all available seasons for this player, descending order
- Format: `2024/25` (season year / next year last 2 digits)
- Default: most recent season
- Changing selection fetches that season's stats and re-renders the table
- Container: `flex gap-2.5 py-3 flex-wrap`

### Table

```
 Competition            │ App │  G  │  A  │  Min  │ Rating
────────────────────────┼─────┼─────┼─────┼───────┼────────
 [logo] Ligue 1         │  28 │   5 │   8 │  2340 │  7.4 🟢
 [logo] Champions League│  10 │   2 │   3 │   890 │  7.1 🟡
 [logo] Coupe de France │   2 │   0 │   1 │   180 │  6.3 🔴
```

- Full-width table, `border-collapse: collapse`, `text-[13px]`
- **Rows sorted by appearances descending**
- **Header row:**
  - `text-left`, `py-2 px-1.5`, `text-[11px]`, `font-semibold`, `uppercase`, `text-text-tertiary`
  - `border-b border-border-subtle`
  - Numeric columns (`App`, `G`, `A`, `Min`, `Rating`): `text-center`
- **Body rows:**
  - `py-2 px-1.5`, `border-b border-border-subtle`
  - Last row: no bottom border
  - Numeric cells: `text-center`
- **Competition cell:**
  - `flex items-center gap-2`
  - Logo: `w-[18px] h-[18px] object-contain`
  - On logo error: `display: none`
  - Name: plain text
- **Rating cell:**
  - `font-bold`
  - Color coding:
    - `>= 7.5` → `text-accent-green` (good)
    - `>= 6.5` → `text-accent-amber` (average)
    - `< 6.5` → `text-accent-crimson` (low)
    - No rating → display `-`, no color class

### Empty state

```
No statistics for this season.
```
- `text-sm text-text-secondary`

---

## Tab 2: Career (All Seasons)

No filter row. All data loads at once.

### Table

```
 Season  │ Team             │ Competition      │ App │ G │ A │ Rat
─────────┼──────────────────┼──────────────────┼─────┼───┼───┼─────
 2024/25 │ [logo] PSG       │ Ligue 1          │  28 │ 5 │ 8 │ 7.4   ← highlighted
 2024/25 │ [logo] PSG       │ Champions League │  10 │ 2 │ 3 │ 7.1   ← highlighted
 2023/24 │ [logo] PSG       │ Ligue 1          │  32 │ 4 │10 │ 7.2
 2023/24 │ [logo] PSG       │ Champions League │   8 │ 1 │ 2 │ 6.9
 2022/23 │ [logo] PSG       │ Ligue 1          │  30 │ 3 │ 9 │ 7.0
 2021/22 │ [logo] Real Madrid│ La Liga         │  20 │ 2 │ 4 │ 6.8
 ...     │                  │                  │     │   │   │
```

- Full-width table, `border-collapse: collapse`, `text-[13px]`
- **One row per season + competition combination**
- **Sorted:** most recent season first; within each season, by appearances descending
- **Header row:**
  - `text-left`, `py-2 px-1.5`, `text-[11px]`, `font-semibold`, `uppercase`, `text-text-tertiary`
  - `border-b border-border-subtle`
  - Numeric columns: `text-center`
- **Body rows:**
  - `py-[7px] px-1.5`, `border-b border-border-subtle`
  - Last row: no bottom border
- **Season cell:** `text-[13px]`, format `2024/25`
- **Team cell:**
  - `flex items-center gap-1.5`
  - Logo: `w-4 h-4 (16px) object-contain`
  - Name: plain text
- **Rating cell:**
  - Same color coding as Tab 1 (green/amber/crimson)
- **Highlighted rows (current/latest season):**
  - All `<td>` in rows matching the latest season: `bg-accent-green/[0.06]`

### Empty state

```
No career data.
```
- `text-sm text-text-secondary`

---

## Tab 3: Trophies

No filter row. All data loads at once.

### Layout

Two sections: Winners (gold) and Runner-up (muted).

```
WINNERS (4)
────────────────────────────────────────
🏆  Champions League
    2021/22 · Spain

🏆  La Liga
    2021/22 · Spain

🏆  Ligue 1
    2022/23 · France

🏆  Coupe de France
    2023/24 · France


RUNNER-UP (2)
────────────────────────────────────────
🥈  Champions League
    2023/24 · France · Runner-up

🥈  Coupe de France
    2022/23 · France · Runner-up
```

### Section title

- `text-xs (12px)`, `font-bold`, `uppercase`, `tracking-[0.06em]`
- `py-2 pb-1`
- **Winners:** `text-accent-amber` (gold tone)
- **Runner-up:** `text-text-secondary`, `pt-3`
- Format: `WINNERS (count)` / `RUNNER-UP (count)`

### Trophy row

- Container: `flex items-center gap-2.5`, `py-2.5`, `border-b border-border-subtle`
- Last row in each section: no bottom border
- **Icon column:**
  - Width: `w-7 (28px)`, `text-center`, `flex-shrink-0`
  - Winners: trophy emoji `🏆` at `text-lg (18px)`
  - Runner-up: medal emoji `🥈` at `text-lg (18px)`
- **Info column:**
  - `flex-1 min-w-0`
  - **Trophy name:** `font-semibold`, `text-text-primary`
  - **Meta line:** `text-[11px]`, `text-text-secondary`, `mt-0.5`
    - Winners format: `{season} · {country}`
    - Runner-up format: `{season} · {country} · {place}`

### DB dependency

Requires trophies data ingestion from `/trophies?player={id}` API endpoint — **not yet done**. Until data is available, render placeholder:

```
No trophies found.
```
- `text-sm text-text-secondary`

---

## Spacing

- Card body padding (inside each tab content): `p-3 px-4` (12px 16px)
- Tab content container has no extra padding — the card-body inside each tab provides it
