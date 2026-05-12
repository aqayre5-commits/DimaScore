# Atlas Kings v2 — Card Navigation & Page Architecture Supplement

> **Generated:** 2026-05-12T14:45:13.458Z  
> **Research source:** Live sofascore.com browser inspection  
> **Extends:** atlaskings-v2-spec.md (core spec)  
> **Scope:** How every card/link connects to its destination page

---

## 1. CORE URL ROUTING ARCHITECTURE

### 1.1 URL Pattern Table

| Page Type | URL Pattern | Example |
|-----------|-------------|---------|
| Homepage | `/` or `/football` | `/football` |
| Country page | `/football/{category.slug}` | `/football/morocco` |
| Tournament/League | `/football/tournament/{category.slug}/{tournament.slug}/{uniqueTournamentId}#id:{seasonId}` | `/football/tournament/morocco/botola-pro/937#id:78750` |
| Match detail | `/football/match/{awayTeamSlug}-{homeTeamSlug}/{event.customId}#id:{event.id}` | `/football/match/atletico-madrid-osasuna/vgbsLgb#id:14083634` |
| Team page | `/football/team/{team.slug}/{team.id}` | `/football/team/raja-club-athletic/41757` |
| Player page | `/football/player/{player.slug}/{player.id}` | `/football/player/mathias-oyewusi-kehinde/960403` |

### 1.2 Critical: Match URL Slug Format

The match URL slug is **{awayTeam.slug}-{homeTeam.slug}** (AWAY first, then HOME):

```
event.homeTeam = Osasuna, event.awayTeam = Atlético Madrid
→ slug = "atletico-madrid-osasuna"  (away-home order)

event.homeTeam = Wydad Casablanca, event.awayTeam = USYM
→ slug = "union-sportive-yacoub-el-mansour-wydad-casablanca"  (away-home order)
```

### 1.3 Event CustomId (Short ID)

The `customId` field in the API response is the short alphanumeric string in the URL (e.g. `VMisatj`). It is NOT a base62 encoding of the numeric ID — it is a server-assigned opaque identifier. You MUST read it from the API response:

```typescript
// From GET /event/{eventId}
const { event } = await fetchEvent(eventId);
const matchUrl = `/football/match/${event.slug}/${event.customId}#id:${event.id}`;
// event.slug is already in "awaySlug-homeSlug" format from API
```

### 1.4 Tab URL Hash Patterns

All tab navigation uses URL hash parameters:

| Page Type | Tab | Hash |
|-----------|-----|------|
| Match detail | Lineups | `#tab:lineups` |
| Match detail | Statistics | `#tab:statistics` |
| Match detail | Standings | `#tab:standings` |
| Match detail | H2H | `#tab:matches` ← NOTE: hash is "matches" not "h2h" |
| Match detail | Media | `#tab:media` |
| Tournament | Standings | `#tab:standings` |
| Tournament | Stats | `#tab:stats` |
| Tournament | Details | `#tab:details` |
| Tournament | Media | `#tab:media` |
| Team | Standings | `#tab:standings` |
| Team | Statistics | `#tab:statistics` |
| Team | Players | `#tab:players` |
| Team | Details | `#tab:details` |

---

## 2. HOMEPAGE CARD NAVIGATION

### 2.1 Left Panel — Match List Cards

Every row in the match list is an `<a>` tag with the match URL:

```
URL: /football/match/{event.slug}/{event.customId}#id:{event.id}
```

Data source: `GET /sport/football/scheduled-events/{YYYY-MM-DD}`

Each event object in the response provides:
- `event.id` → numeric event ID
- `event.customId` → short URL identifier  
- `event.slug` → "awayTeam-homeTeam" slug
- `event.homeTeam.name`, `event.awayTeam.name` → displayed names
- `event.status.type` → "notstarted" | "inprogress" | "finished"
- `event.homeScore.current`, `event.awayScore.current` → scores
- `event.startTimestamp` → Unix timestamp for match time
- `event.tournament.uniqueTournament.id` → for grouping by league

### 2.2 Right Panel — Carousel Slide Cards

Each carousel slide is a **featured match card** that links to the match detail page.

**Data source:** Top 5 events sorted by `(homeTeam.userCount + awayTeam.userCount)` descending, from today's scheduled events. If today's matches are all finished, scan forward up to 4 days.

**Card content:**
```
├── Tournament name + logo
│   └── GET /unique-tournament/{id}/image
├── Home team badge + name
│   └── GET /team/{homeTeamId}/image
├── Match time (HH:MM) or score if live/finished
├── Countdown timer (if upcoming)
├── Away team badge + name  
│   └── GET /team/{awayTeamId}/image
├── "Who will win?" vote widget
│   └── GET /event/{id}/odds/1/all (for 1X2 fractional odds display)
├── Full-time 1X2 odds (fractional)
└── Link to match: /football/match/{slug}/{customId}#id:{eventId}
```

**Carousel behavior (confirmed values):**
- Auto-advance: 7000ms (7 seconds)
- Manual click debounce: 1000ms before resuming auto-advance
- CSS transition: `transform 200ms ease-in-out`
- Active dot: `rgb(55, 77, 245)` solid
- Inactive dot: `rgba(55, 77, 245, 0.15)`
- Dot size: 8×8px, `border-radius: 50%`

---

## 3. TOURNAMENT PAGE CARD NAVIGATION

### 3.1 URL Structure

```
/football/tournament/{category.slug}/{tournament.slug}/{uniqueTournamentId}#id:{seasonId}
```

**Botola Pro:** `/football/tournament/morocco/botola-pro/937#id:78750`

Data for building this URL:
```typescript
// From GET /unique-tournament/{id}
const t = data.uniqueTournament;
const tournamentUrl = `/football/tournament/${t.category.slug}/${t.slug}/${t.id}#id:${seasonId}`;

// From GET /unique-tournament/{id}/seasons
const currentSeason = data.seasons[0]; // Most recent season
const seasonId = currentSeason.id;
```

### 3.2 Left Panel — Featured Match Card

Shows the most recently played (or current/next) match in the tournament.

**How "Featured" match is selected:**
1. Call `GET /unique-tournament/{id}/season/{sid}/events/last/0`
2. Take `events[0]` (most recent finished match)
3. Display as featured card — links to match detail page

**Featured card content:**
```
├── "Featured" heading
├── Match date + time
├── Home team logo + name + score
├── Status ("Finished", "Live", match time)
├── Away team logo + name + score
├── 1X2 odds (fractional, from /event/{id}/odds/1/all)
└── Link: /football/match/{slug}/{customId}#id:{eventId}
```

### 3.3 Left Panel — Round Match List

Shows all matches in the selected round.

**API:** `GET /unique-tournament/{id}/season/{sid}/events/round/{roundNumber}`

**Round navigation:**
- Dropdown shows all rounds (1..N)
- `GET /unique-tournament/{id}/season/{sid}/rounds` → `{rounds: [{round: 1}, {round: 2}...]}`
- Default: load the most recent completed round
- When user selects round N: fetch `events/round/N`

Each match card in the list:
```
├── Date (DD/MM/YY)
├── Status badge (FT / Live minute / HH:MM upcoming)
├── Home team name + logo
├── Score (or dash if upcoming)
├── Away team name + logo
└── Link: /football/match/{slug}/{customId}#id:{eventId}
```

### 3.4 Right Panel — Tabs

```
Standings | Stats | Details | Media
```

**Standings tab APIs:**
```
GET /unique-tournament/{id}/season/{sid}/standings/total    → All standings
GET /unique-tournament/{id}/season/{sid}/standings/home     → Home record
GET /unique-tournament/{id}/season/{sid}/groups             → Group info
GET /unique-tournament/{id}/season/{sid}/rounds             → Round list
```

Standings row renders Last 5 form badges (W/D/L colored chips).  
Each team in standings links to: `/football/team/{team.slug}/{team.id}`

**Stats tab APIs:**
```
GET /unique-tournament/{id}/season/{sid}/top-players/overall
GET /unique-tournament/{id}/season/{sid}/top-players-per-game/all/overall
GET /unique-tournament/{id}/season/{sid}/top-teams/overall
GET /unique-tournament/{id}/season/{sid}/statistics/info
GET /unique-tournament/{id}/season/{sid}/statistics
```

**Details tab:** Uses `GET /unique-tournament/{id}` data (titleHolder, mostTitles, related leagues)

---

## 4. MATCH DETAIL PAGE NAVIGATION

### 4.1 URL Breakdown

```
/football/match/{event.slug}/{event.customId}#id:{event.id}
      ↑ sport    ↑ away-home slug  ↑ short id    ↑ event id
```

### 4.2 Breadcrumb Chain

```
Football → {country.name} → {tournament.name}, Round {N} → {Match title}
    ↓           ↓                    ↓
   /football   /football/{cat.slug}  /football/tournament/{cat.slug}/{t.slug}/{tid}#id:{sid}
```

For Botola Pro match:
```
Football → Morocco → Botola Pro, Round 19 → FUS Rabat vs Ittihad Tanger
```

Breadcrumb data from event:
- country: `event.tournament.category.country`
- tournament slug: `event.tournament.uniqueTournament.slug` (or `event.tournament.uniqueTournament.id`)
- round: `event.roundInfo.round`

### 4.3 Page Header (Always Visible)

```
Data source: GET /event/{eventId}

Displays:
├── Home team name + badge image
├── Score (current, or HH:MM if upcoming, or "FT" if finished)
├── Status badge  
├── Goal scorers list (player name + minute)
├── Away team name + badge image
├── Date + time + tournament name + stadium name (from event.venue)
```

**Goal scorers** come from incidents:
- Source: `GET /event/{eventId}/incidents`
- Filter: `incidentType === "goal"`
- For each: `{player.name} {time}'` (with `assist1.name` for assist)
- Home goals: `isHome === true`
- Away goals: `isHome === false`

### 4.4 Lineups Tab

**Available for:** Upcoming (possible lineups) + Finished (confirmed lineups)

```
GET /event/{eventId}/lineups

Response:
{
  confirmed: boolean,       // true = confirmed, false = possible
  home: {
    players: [{
      player: { id, name, position, slug, country },
      jerseyNumber: "10",
      position: "G" | "D" | "M" | "F",
      substitute: boolean,
      statistics: { rating, minutesPlayed, goals, assists, ... }  // null if upcoming
    }],
    formation: "4-3-3",
    playerColor: { primary, number, outline, fading },
    goalkeeperColor: {...},
    missingPlayers: [...]
  },
  away: { same structure }
}
```

**Additional for Lineups tab (when loading):**
- `GET /fantasy/event/{eventId}` → fantasy scores for player rating bubbles

### 4.5 Statistics Tab

**Only available for finished matches.** For upcoming matches, shows team season stats comparison.

```
Finished match APIs:
GET /event/{eventId}/statistics
  → { statistics: [{ period: "ALL", groups: [
       { groupName: "Match overview", statisticsItems: [
           { name: "Ball possession", home: "62%", away: "38%", homePercentage: 62 },
           { name: "Expected goals (xG)", home: "1.76", away: "0.16" },
           { name: "Total shots", home: "15", away: "7" },
           ...
       ]}
     ]}]}

GET /event/{eventId}/shotmap
  → { shotmap: [{ 
       player: { name, id },
       isHome: boolean,
       shotType: "goal" | "block" | "miss" | "save" | "post",
       situation: "open-play" | "set-piece" | "penalty" | "free-kick",
       xg: 0.0007,
       playerCoordinates: { x, y },  // 0-100 scale
       bodyPart: "right-foot" | "left-foot" | "head",
       goalMouthLocation: "...",
       time: 90
    }]}

GET /event/{eventId}/graph
  → { graphPoints: [{ minute: 1, value: -6 }, ...],  // negative=away dominating
       periodTime: 45, periodCount: 2 }

GET /event/{eventId}/heatmap/{playerId}
  → Player heatmap data

Upcoming match APIs (season stats comparison):
GET /team/{homeTeamId}/unique-tournament/{tid}/season/{sid}/statistics/overall
GET /team/{awayTeamId}/unique-tournament/{tid}/season/{sid}/statistics/overall
GET /team/{homeTeamId}/unique-tournament/{tid}/season/{sid}/ranks/overall
GET /team/{awayTeamId}/unique-tournament/{tid}/season/{sid}/ranks/overall
GET /unique-tournament/{tid}/season/{sid}/top-teams/overall
GET /team/{homeTeamId}/unique-tournament/{tid}/season/{sid}/top-players/overall
GET /team/{awayTeamId}/unique-tournament/{tid}/season/{sid}/top-players/overall
```

### 4.6 Standings Tab

**Note:** Uses `tournament.id` (not `uniqueTournament.id`) for standings calls from match page.

```
GET /tournament/{tid}/season/{sid}/standings/total
GET /tournament/{tid}/season/{sid}/standings/home
GET /tournament/{tid}/season/{sid}/team-events/total
GET /unique-tournament/{uid}/season/{sid}/team/{homeTeamId}/team-performance-graph-data
GET /unique-tournament/{uid}/season/{sid}/team/{awayTeamId}/team-performance-graph-data
```

### 4.7 H2H Tab (hash: #tab:matches)

```
GET /event/{eventId}/h2h
  → { teamDuel: { homeWins: 2, awayWins: 6, draws: 2 },
       managerDuel: { homeWins: 0, awayWins: 1, draws: 0 } }

GET /event/{customId}/h2h/events   ← Uses customId (short string), NOT numeric ID
  → Last N meetings between the two teams (404 if no history)

GET /team/{homeTeamId}/events/last/0   → Home team form (last 30 events)
GET /team/{homeTeamId}/events/next/0   → Home team upcoming fixtures

GET /event/{eventId}/team-streaks
GET /event/{eventId}/team-streaks/betting-odds/1
GET /team/{homeTeamId}/unique-tournament/{tid}/season/{sid}/goal-distributions
GET /team/{awayTeamId}/unique-tournament/{tid}/season/{sid}/goal-distributions
GET /event/{eventId}/provider/1/winning-odds
GET /team/{homeTeamId}/team-statistics/seasons
GET /team/{awayTeamId}/team-statistics/seasons
```

**Form calculation from /team/{id}/events/last/0:**
```typescript
function getFormResult(event: Event, teamId: number): 'W' | 'D' | 'L' {
  const isHome = event.homeTeam.id === teamId;
  const homeScore = event.homeScore.current;
  const awayScore = event.awayScore.current;
  if (homeScore === awayScore) return 'D';
  const homeWon = homeScore > awayScore;
  return (isHome && homeWon) || (!isHome && !homeWon) ? 'W' : 'L';
}
```

### 4.8 Media Tab

```
GET /event/{eventId}/highlights
  → { highlights: [{
       title: "FUS Rabat 1 - 1 Ittihad Tanger",
       url: "https://www.youtube.com/watch?v=blEreeQcDJA",
       thumbnailUrl: "https://i.ytimg.com/vi/blEreeQcDJA/hqdefault.jpg"
    }]}
```

### 4.9 Left Side Odds Widget

```
GET /event/{eventId}/odds/1/all
  → { markets: [
       { marketName: "Full time", choices: [
           { name: "1", fractionalValue: "5/4" },
           { name: "X", fractionalValue: "12/5" },
           { name: "2", fractionalValue: "7/4" }
       ]},
       { marketName: "Double chance", choices: [...] },
       { marketName: "1st half", choices: [...] },
       { marketName: "Draw no bet", choices: [...] },
       { marketName: "Both teams to score", choices: [...] },
       ... (17 total markets)
    ]}
```

---

## 5. TEAM PAGE CARD NAVIGATION

### 5.1 URL Structure

```
/football/team/{team.slug}/{team.id}
```

**Raja Club Athletic:** `/football/team/raja-club-athletic/41757`

### 5.2 Page Header Data

```
GET /team/{teamId}
  → team.name, team.slug, team.country, team.userCount
  → team.venue.name (stadium)
  → team.primaryUniqueTournament (main league)
  → team.coach (if available — separate call needed)
```

### 5.3 Left Panel — Match List

Two sub-tabs: **List** | **Calendar**

```
GET /team/{teamId}/events/last/0  → Recent results (paginated, hasNextPage)
GET /team/{teamId}/events/next/0  → Upcoming fixtures (paginated)
```

Optional filter dropdown: All | Botola Pro | Coupe du Trône | etc.

Each match row links to: `/football/match/{event.slug}/{event.customId}#id:{event.id}`

**Previous match** (most recent finished):
```
events/last/0 → events[0] (most recent finished)
```

**Next match** (nearest upcoming):
```
events/next/0 → events[0] (nearest upcoming)
```

### 5.4 Right Panel — Tabs

**Standings tab:**
```
GET /unique-tournament/{tid}/season/{sid}/standings/total
(tid = team's primary tournament ID, from team.primaryUniqueTournament.id)
```

**Statistics tab:**
```
GET /team/{teamId}/team-statistics/seasons
GET /team/{teamId}/unique-tournament/{tid}/season/{sid}/statistics/overall
GET /team/{teamId}/unique-tournament/{tid}/season/{sid}/ranks/overall
GET /unique-tournament/{tid}/season/{sid}/top-teams/overall
GET /team/{teamId}/season/{sid}/best-result
GET /unique-tournament/{tid}/season/{sid}/team-statistics/types
```

**Players tab:**
```
GET /team/{teamId}/players
  → { 
       players: [{ 
         player: { id, name, slug, position, country, height, dateOfBirth },
         jerseyNumber: "10",
         statistics: { rating, goals, assists, minutesPlayed }
       }],
       foreignPlayers: number,
       nationalPlayers: number,
       supportStaff: [{ player: { name, position: "Coach" }}]
    }
```

Each player links to: `/football/player/{player.slug}/{player.id}`

---

## 6. ASSET URLS (Images)

```
Team logo:         GET /api/v1/team/{teamId}/image
                   → PNG, max-age=86400 (1 day), s-maxage=604800 (1 week)
                   
Tournament logo:   GET /api/v1/unique-tournament/{uniqueTournamentId}/image
                   
Player photo:      GET /api/v1/player/{playerId}/image

Country flag:      GET /api/v1/country/{alpha2}/image   (e.g. /country/MA/image)
```

For Next.js, configure in `next.config.ts`:
```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'api.sofascore.com', pathname: '/api/v1/**' }
  ]
}
```

---

## 7. EVENT STATUS TYPES & SCORE STRUCTURE

### 7.1 Status Types

```typescript
type EventStatusType = 
  | 'notstarted'   // Upcoming (status.code: 0)
  | 'inprogress'   // Live (code: 6=1H, 7=HT, 8=2H, 31=ET1, 32=ET2)
  | 'finished'     // Full-time (code: 100)
  | 'postponed'    // Postponed (code: 60)
  | 'cancelled'    // Cancelled (code: 70)
  | 'suspended'    // Suspended
  | 'interrupted'  // Interrupted
```

### 7.2 Score Structure

```typescript
interface Score {
  current: number;       // Current/final score
  display: number;       // Display score (same as current for most cases)
  period1: number;       // First half score
  period2?: number;      // Second half score (finished)
  normaltime?: number;   // 90 min score (if ET played)
  overtime?: number;     // Extra time score
}
```

### 7.3 Live Match Time Calculation

```typescript
function getLiveMinute(event: Event): number {
  const { currentPeriodStartTimestamp, initial } = event.time;
  const elapsed = Math.floor(Date.now() / 1000) - currentPeriodStartTimestamp + initial;
  return Math.floor(elapsed / 60) + 1;
}

// For status.code:
// 6 = First half → minute 1-45
// 7 = Half time  → display "HT"
// 8 = Second half → minute 46-90+
// 31 = Extra time 1st half
// 32 = Extra time 2nd half
```

---

## 8. INCIDENT TYPES (Timeline Events)

```typescript
interface Incident {
  incidentType: 'goal' | 'card' | 'substitution' | 'period';
  incidentClass: 'regular' | 'yellow' | 'red' | 'yellowRed' | 'ownGoal' | 'penalty';
  time: number;           // Minute
  addedTime?: number;     // Added time minutes
  timeSeconds: number;
  isHome: boolean;        // true = home team's incident
  id: number;
  
  // For goal:
  player?: Player;        // Scorer
  assist1?: Player;       // Primary assist
  homeScore?: number;     // Score after goal
  awayScore?: number;
  
  // For card:
  player?: Player;
  reason?: string;
  rescinded?: boolean;
  
  // For substitution:
  playerIn?: Player;
  playerOut?: Player;
  injury?: boolean;
  
  // For period:
  // incidentClass = "kickOff" | "finalWhistle"
}
```

---

## 9. IMPLEMENTATION GUIDE FOR CLAUDE CODE

### 9.1 Next.js App Router Pages to Create

```
src/app/
├── page.tsx                                              → Homepage
├── football/
│   ├── page.tsx                                          → Football landing
│   ├── [country]/
│   │   └── page.tsx                                      → Country page
│   ├── tournament/
│   │   └── [country]/
│   │       └── [slug]/
│   │           └── [tid]/
│   │               └── page.tsx                         → Tournament page
│   ├── match/
│   │   └── [slug]/
│   │       └── [customId]/
│   │           └── page.tsx                             → Match detail page
│   ├── team/
│   │   └── [slug]/
│   │       └── [teamId]/
│   │           └── page.tsx                             → Team page
│   └── player/
│       └── [slug]/
│           └── [playerId]/
│               └── page.tsx                             → Player page
```

### 9.2 URL Hash → Tab State Management

Since Next.js App Router handles URL hashes client-side only, use:

```typescript
// hooks/useTabFromHash.ts
'use client';
import { useState, useEffect } from 'react';

export function useTabFromHash(defaultTab: string) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/#(?:id:\d+,)?tab:([\w]+)/);
    if (match) setActiveTab(match[1]);
  }, []);
  
  const switchTab = (tab: string) => {
    const currentHash = window.location.hash;
    const idMatch = currentHash.match(/#id:(\d+)/);
    const idPart = idMatch ? `#id:${idMatch[1]},` : '#';
    window.history.pushState(null, '', `${window.location.pathname}${idPart}tab:${tab}`);
    setActiveTab(tab);
  };
  
  return { activeTab, switchTab };
}
```

### 9.3 Match Card Component

```typescript
// components/MatchCard.tsx
interface MatchCardProps {
  event: Event;
  variant: 'list' | 'carousel' | 'featured' | 'mini';
}

// URL generation:
function getMatchUrl(event: Event): string {
  return `/football/match/${event.slug}/${event.customId}#id:${event.id}`;
}

// Note: event.slug from API is already in "awaySlug-homeSlug" format
```

### 9.4 Tournament Card Component

```typescript
// URL generation for tournament:
function getTournamentUrl(tid: number, seasonId: number, t: UniqueTournament): string {
  return `/football/tournament/${t.category.slug}/${t.slug}/${tid}#id:${seasonId}`;
}
```

### 9.5 SWR Hooks for Match Detail Page

```typescript
// hooks/useMatchDetail.ts
export function useMatchDetail(eventId: number) {
  return useSWR(`/api/event/${eventId}`, fetcher, {
    refreshInterval: (data) => {
      const status = data?.event?.status?.type;
      if (status === 'inprogress') return 5000;  // 5s when live
      if (status === 'notstarted') return 30000; // 30s when upcoming
      return 0;                                   // 0 = no refresh when finished
    }
  });
}

export function useMatchIncidents(eventId: number) {
  return useSWR(`/api/event/${eventId}/incidents`, fetcher, {
    refreshInterval: 5000  // Always poll incidents (for live goals/cards)
  });
}

export function useMatchLineups(eventId: number) {
  return useSWR(`/api/event/${eventId}/lineups`, fetcher, {
    refreshInterval: 60000 // 60s - lineups don't change often
  });
}

export function useMatchH2H(eventId: number) {
  return useSWR(`/api/event/${eventId}/h2h`, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 0  // Static data
  });
}

export function useMatchOdds(eventId: number) {
  return useSWR(`/api/event/${eventId}/odds/1/all`, fetcher, {
    refreshInterval: 30000 // 30s for odds
  });
}
```

### 9.6 API Proxy Routes Required

```
src/app/api/
├── event/
│   └── [id]/
│       ├── route.ts           → GET /event/{id}
│       ├── lineups/route.ts   → GET /event/{id}/lineups
│       ├── incidents/route.ts → GET /event/{id}/incidents
│       ├── statistics/route.ts
│       ├── shotmap/route.ts
│       ├── graph/route.ts
│       ├── h2h/route.ts
│       ├── highlights/route.ts
│       └── odds/
│           └── 1/
│               └── all/route.ts
├── unique-tournament/
│   └── [tid]/
│       ├── route.ts
│       ├── seasons/route.ts
│       └── season/
│           └── [sid]/
│               ├── standings/
│               │   ├── total/route.ts
│               │   └── home/route.ts
│               ├── events/
│               │   ├── round/[n]/route.ts
│               │   ├── last/[page]/route.ts
│               │   └── next/[page]/route.ts
│               └── top-players/
│                   └── overall/route.ts
├── team/
│   └── [teamId]/
│       ├── route.ts
│       ├── players/route.ts
│       └── events/
│           ├── last/[page]/route.ts
│           └── next/[page]/route.ts
└── sport/
    └── football/
        ├── events/
        │   └── live/route.ts
        └── scheduled-events/
            └── [date]/route.ts
```

---

## 10. IMPORTANT NUANCES FOR IMPLEMENTATION

### 10.1 H2H Events Uses customId (Not Numeric ID)

```typescript
// WRONG:
const h2hEvents = await fetch(`/event/${event.id}/h2h/events`);

// CORRECT:
const h2hEvents = await fetch(`/event/${event.customId}/h2h/events`);
// customId is the short string like "VMisatj", not the number 14771891
```

### 10.2 Tournament vs UniqueTournament

Sofascore has TWO tournament ID types:
- `event.tournament.id` → used in standings calls from match page: `/tournament/{id}/season/{sid}/standings/total`  
- `event.tournament.uniqueTournament.id` → used in most other calls: `/unique-tournament/{id}/....`

The tournament page URL uses `uniqueTournamentId`.

### 10.3 Statistics Available Only Post-Match

`event/{id}/statistics` returns **404** for upcoming/live matches.  
For upcoming matches, the Statistics tab shows **team season statistics comparison** instead.

### 10.4 Incidents Only Available Post-Match

`event/{id}/incidents` is for finished matches.  
For live matches, poll `event/{id}` for score changes, and `event/{id}/incidents` for the timeline.

### 10.5 Cache Headers Summary

| Endpoint | Cache |
|----------|-------|
| `/sport/football/events/live` | max-age=5s |
| `/sport/football/scheduled-events/{date}` | max-age=10s |
| `/event/{id}` | max-age=5s (live), max-age=60s (finished) |
| `/unique-tournament/{id}/season/{sid}/standings/total` | max-age=60s |
| `/team/{id}/image` | max-age=86400 (1 day) |
| `/unique-tournament/{id}/image` | max-age=86400 (1 day) |

---

## 11. NAVIGATION FLOW DIAGRAM

```
Homepage / Football Landing Page
│
├── LEFT PANEL: Match List
│   └── Click match row → Match Detail Page
│       (/football/match/{awaySlug}-{homeSlug}/{customId}#id:{eventId})
│
├── RIGHT PANEL: Carousel (Featured Matches)  
│   └── Click carousel card → Match Detail Page
│
└── Click league name → Tournament Page
    (/football/tournament/{catSlug}/{tSlug}/{tid}#id:{sid})
    │
    └── Tournament Page
        ├── LEFT: Featured Card → Match Detail Page
        ├── LEFT: Round List → Click match → Match Detail Page
        └── RIGHT: Standings row team name → Team Page
            (/football/team/{teamSlug}/{teamId})
            │
            └── Team Page
                ├── LEFT: Match list item → Match Detail Page
                ├── Header: Previous/Next match → Match Detail Page
                └── RIGHT: Players tab player → Player Page
                    (/football/player/{playerSlug}/{playerId})

Match Detail Page
├── Tab: Lineups → (same page, #tab:lineups)
├── Tab: Statistics → (same page, #tab:statistics)
├── Tab: Standings → (same page, #tab:standings) → click team → Team Page
├── Tab: H2H → (same page, #tab:matches)
└── Tab: Media → (same page, #tab:media)
```

---

*End of Card Navigation & Page Architecture Supplement*
