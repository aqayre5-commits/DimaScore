# DimaScore — Style Guide
Status: INFERRED (reverse-engineered from code, tokens, i18n and screenshots during the 2026-10-01 audit; confirm with native FR/AR reviewers where marked). Source: consistency-reviewer. See docs/audits/2026-10-01-audit.md for the findings this encodes.

## Brand voice
Fast, factual, Morocco-proud. No betting/odds language anywhere (Loi 09-08). Short, data-first sentences; answer-first on match/competition pages. No hype, no "why choose us".

## Brand name
- Latin: **DimaScore** (one word, capital D + capital S). Wordmark: "Dima" in brand-green, "Score" in brand-red.
- Arabic copy: **ديماسكور** (one word, no space). Do not use "ديما سكور".
- Decide once whether the logo stays Latin on AR pages (current behaviour) — document the choice.

## Terminology glossary (canonical per locale)
| Concept | EN | FR | AR (Moroccan) |
|--------|----|----|----|
| Live (badge) | LIVE | DIRECT | مباشر |
| Live (prose/filter) | Live | En direct | مباشر |
| vs | vs | vs | ضد |
| World Cup | World Cup / WC26 | Coupe du Monde / CM26 | كأس العالم / المونديال (pick one short form) |
| AFCON | AFCON | CAN | كأس أمم إفريقيا |
| Champions League | Champions League / UCL | Ligue des Champions / LdC | دوري أبطال أوروبا |
| Botola (1st tier) | Botola Pro | Botola Pro | البطولة الاحترافية |
| Botola (2nd tier) | Botola 2 | Botola 2 | القسم الثاني |
| Coupe du Trône | Coupe du Trône | Coupe du Trône | كأس العرش |
| Atlas Lions | Atlas Lions | Lions de l'Atlas | أسود الأطلس |
| Lions Abroad | Lions Abroad | Lions à l'étranger | أسود الأطلس بالخارج |
- Africa (AR): standardize one spelling — **إفريقيا** or **أفريقيا** — currently both appear (megaMenu "أفريقيا" vs topNav "إفريقيا"). NEEDS-NATIVE-REVIEW.
- All team/country/club/competition/round/stat names must resolve through the display-name localization layer; never render raw provider English.

## CTA labels
- Primary filled button (accent-green or azure): one per view. Cookie: Accept filled / Reject outline (en Accept/Reject, fr Accepter/Refuser, ar قبول/رفض).
- "View all" family: EN "View all", FR "Voir tout", AR "عرض الكل" — do not mix with "See all"/"Tout voir" variants.
- 404 CTA: EN "Go home", FR "Retour à l'accueil", AR "العودة إلى الرئيسية".

## Writing rules
- Headings: Sentence case EN/FR; section labels use the `.label-caps` uppercase treatment only.
- Numerals: scores/stats/dates use Western digits in all three locales (recommended); sample in style-guide must match.
- Dashes: en dash for scores (2–0); hyphen in "Kick-off". Standardize "Kick-off" (EN).
- EN spelling: one variety (recommend British: favourite, centre) — align nav.favorites.
- AR dates: locale ar-MA, Moroccan months (يناير، فبراير، مارس، أبريل، ماي، يونيو، يوليوز، غشت، شتنبر، أكتوبر، نونبر، دجنبر). Do not mix MSA (سبتمبر/نوفمبر) with Moroccan copy. NEEDS-NATIVE-REVIEW.

## Allowed component variants
- Buttons: filled (primary), outline (secondary), ghost/link. No ad-hoc styles.
- Cards: one surface card (bg-surface + border-subtle + rounded-xl).
- Badges: live (score-live), rating scale green≥7 / amber 6–7 / crimson <6, event tags (derby/knockout/opener).
- Standings table: ONE component, one column-label convention, locale-correct form pills (W/D/L ↔ V/N/D ↔ ف/ت/خ).
- Countdown: ONE component, one unit format (localized words) across hero and next-match cards.
- Tabs: one tab bar component; labels fully localized.

## Token rules
- Colours only from src/styles/tokens.css (`--color-*`). No hex/rgba in TSX. Add pitch + shadow tokens for LineupPitch and the one arbitrary shadow.
- Type: use the Tailwind scale / defined caption+micro tokens; no arbitrary text-[Npx].
- Fonts: body IBM Plex Sans (Latin) + IBM Plex Sans Arabic (AR). Display: decide Fraunces-or-IBM-Plex and wire `--font-display` accordingly; remove unused font imports and the dead `--font-mono`→geist mapping.
- Palette name: one name repo-wide (tokens.css, globals.css comments, styleGuide.palette, /dev/style-guide) — "Midnight Pitch" or "Atlas Royal", not both.
- No undefined token classes: every `*-token` class must exist in the `@theme` block (CI guard recommended).
- Theme: document which page types are light vs dark and make About/Media match the documented choice.

## Icon & image rules
- Icons: lucide-react only (already enforced in practice).
- Crests/logos: use `.logo-invert` for dark-artwork logos on dark theme; revert on light.
- Pitch illustration: colours come from tokens, not inline hex.

## Format rules (per locale)
- Date: EN "Thursday, 1 October 2026" / "1 Oct"; FR "jeudi 1 octobre 2026" / "1 oct."; AR ar-MA "الخميس، 1 أكتوبر 2026" with Moroccan months.
- Time: 24h, device timezone; unknown kickoff → EN "Kickoff to confirm" / FR "Horaire à confirmer" / AR "التوقيت غير مؤكد".
- Numbers: Western digits; tabular-nums for stats/scores.
- Currency/phone: none on site (no commerce) — N/A.
