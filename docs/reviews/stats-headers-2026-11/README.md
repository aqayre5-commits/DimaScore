# Stats tab: remove the Match chip, restyle group headers

Abdilahi (25 Nov 2026, 02:45 Europe/London): under the match-page Stats tab, remove the word “Match” and its green background; in the stats card, remove the greenish band under Attack, Passing and Discipline and make those words black and bold.

## Changes

- The stats period selector currently has one option (`Match`). `Choices` now renders nothing when it has fewer than two items, so the green pill and its spacing go away and the stats card sits flush under the tabs. The component is unchanged for the Events filters (four items) and will show again if a half/full split is added later.
- Group headers use `color: var(--ink)` and `font-weight: 700`, with no `--hover` band. `--ink` is `#101512` in light mode and `#f0f3f1` in dark, so the text is not black-on-dark. The first header drops its top border because `.mc-cols` already divides the team row.

Navbar and logo are unchanged. No other tabs or pages were restyled.

## Evidence

Fixture: Manchester City 3–2 Ipswich (`1557433`), English Stats tab.

| | 1440 light | 390 light | 1440 dark |
|---|---|---|---|
| Before | [before-stats-en-d1440.png](shots/before-stats-en-d1440.png) | [before-stats-en-m390.png](shots/before-stats-en-m390.png) | [before-stats-en-d1440-dark.png](shots/before-stats-en-d1440-dark.png) |
| After | [after-stats-en-d1440.png](shots/after-stats-en-d1440.png) | [after-stats-en-m390.png](shots/after-stats-en-m390.png) | [after-stats-en-d1440-dark.png](shots/after-stats-en-d1440-dark.png) |

Also checked (not in the PR shot set): Arabic 1440/390, light and dark. Headers are الهجوم / التمرير / الانضباط in `--ink` at weight 700, no chip, no band. Events tab still shows All / Goals / Cards / Substitution. Header and metric type size and padding are unchanged (first header is 1px shorter after dropping the doubled top border). The only layout height change is the intentional removal of the chip and its margin.
