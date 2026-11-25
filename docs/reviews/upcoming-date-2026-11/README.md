# Upcoming cards: quieter date label

Abdilahi (25 Nov 2026, via Chief of Staff): the date heading on match-page Upcoming cards (e.g. “Fri 27 Nov”, also “Tomorrow”) is too big and dominates. Hierarchy should be teams > time > date.

## Changes

Scoped to `.mc .soon .sooncard .cardtop` (the Upcoming date only). `cardtop` is not used by any other component; the typography change is still scoped so a later reuse of `.mc .cardtop` would not pick it up. Crests, team names, and kickoff times are unchanged.

| | Before | After |
|---|---|---|
| Desktop 1440 date | 21.024px, weight 720, `--ink` | **14px**, weight **500**, `--muted` |
| Mobile ≤767 date | 15px, weight 720, `--ink` | **13px**, weight **500**, `--muted` |
| Team names | 17.568px / 14px, weight 610, `--ink` | unchanged |
| Time | 17.568px / 14px, weight 550, `--ink` | unchanged |
| Crests | 28px desktop / 21px mobile | unchanged |
| Card height | 112.8px / 88.7px | 102.5px / 84.3px (tidier from the smaller date + 7px→4px margin) |

`--muted` contrast against the card surface: **6.6:1** light (`#52605b` on white) and **8.98:1** dark (`#afbab5` on `#131817`). Hover (on `--hover`) is 6.16:1 / 6.95:1. All pass AA (4.5:1) for 13–14px text.

## Evidence

Fixture: Manchester City 3–2 Ipswich (`1557433`), Upcoming rail.

| | 1440 | 390 |
|---|---|---|
| en before | [before-upcoming-en-d1440.png](shots/before-upcoming-en-d1440.png) | [before-upcoming-en-m390.png](shots/before-upcoming-en-m390.png) |
| en after | [after-upcoming-en-d1440.png](shots/after-upcoming-en-d1440.png) | [after-upcoming-en-m390.png](shots/after-upcoming-en-m390.png) |
| ar before | [before-upcoming-ar-d1440.png](shots/before-upcoming-ar-d1440.png) | [before-upcoming-ar-m390.png](shots/before-upcoming-ar-m390.png) |
| ar after | [after-upcoming-ar-d1440.png](shots/after-upcoming-ar-d1440.png) | [after-upcoming-ar-m390.png](shots/after-upcoming-ar-m390.png) |

Dark-mode check: [before-upcoming-en-d1440-dark.png](shots/before-upcoming-en-d1440-dark.png) / [after-upcoming-en-d1440-dark.png](shots/after-upcoming-en-d1440-dark.png).

Navbar and logo are unchanged. No Infra steps.
