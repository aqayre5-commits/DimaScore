# Migration from v1 — one-time normalization engine import

The only thing carried over from the v1 prototype is the **trilingual text normalization engine**. Everything else is rebuilt from scratch per `docs/atlaskings-v2-rebuild-plan-final.md`.

This is a **one-time operation** during Phase 0. Do it manually as the user (not via Claude Code) so it lands as a clean, attributed commit.

## What to find in v1

Look in the v1 repo for the file(s) implementing trilingual normalization. Typical locations across your project portfolio:

```
v1-repo/
├── src/lib/normalize.ts            ← most likely
├── src/lib/text/normalize.ts
├── src/utils/normalize.ts
└── packages/normalize/             ← if it was ever extracted
```

Run this in the v1 repo to find it:

```bash
cd /path/to/atlaskings-v1
grep -rn "normalize" src --include="*.ts" -l | head -10
grep -rln "darija\|tamazight\|arabic" src --include="*.ts" | head
```

## Steps

### 1. Find and review

```bash
cd /path/to/atlaskings-v1
git log --oneline --follow src/lib/normalize.ts | head -20    # see its history
cat src/lib/normalize.ts                                       # read the current state
```

Confirm this is the engine you want to carry forward. If there are tests for it (`src/lib/normalize.test.ts` or similar), find those too.

### 2. Copy into v2

From the v2 repo root:

```bash
mkdir -p src/lib

# Copy the engine file(s)
cp /path/to/atlaskings-v1/src/lib/normalize.ts src/lib/normalize.ts

# Copy tests if they exist
cp /path/to/atlaskings-v1/src/lib/normalize.test.ts src/lib/normalize.test.ts 2>/dev/null || true

# Copy any sibling helper files the engine depends on
# (check the imports inside normalize.ts before running this)
```

### 3. Adapt for English (Rule from the plan: extend for EN at Phase 0)

Open `src/lib/normalize.ts` and confirm it handles:

- French (FR) — accents, ligatures, hyphens
- Arabic (AR) — diacritics, hamza variants, alef forms, ta marbuta
- Darija (DR) — Latin-script Moroccan Arabic with French/Arabic loanwords
- **English (EN)** — likely just a passthrough with whitespace/punctuation normalization

If EN handling isn't there yet, this is the only modification you make manually. The full integration into Meilisearch and slug generation happens via Claude Code in Phase 10.

### 4. Commit

```bash
git add src/lib/normalize.ts src/lib/normalize.test.ts
git commit -m "feat(normalize): import trilingual normalization engine from v1, extend for EN

Carried forward from atlaskings v1 as the only reusable infrastructure
per the rebuild plan §L. Adds English handling alongside existing FR/AR/DR.

Source commit: <paste v1 commit hash here>"
```

### 5. Smoke test

```bash
pnpm install                    # if you've already run create-next-app
pnpm test src/lib/normalize     # run the test file
```

If tests pass, you're done. The engine is now part of v2.

### 6. What NOT to copy from v1

To be explicit — per the rebuild plan, **nothing else** comes across. Not:

- React components (atoms, organisms, page layouts)
- Routes / page files
- API route handlers
- Database schemas or migrations
- Tailwind config / design tokens
- Ingestion scripts
- Tests other than the normalization test
- Even README content

The point of v2 is a clean rebuild on a premium palette and modern architecture. Importing v1 fragments would defeat the purpose and confuse Claude Code about what's canonical.

---

## After this migration

1. Update `CURRENT_PHASE.md` if Phase 0 work is complete (probably not yet — the rest of Phase 0 still needs to happen via Claude Code).
2. Note in `BACKLOG.md` if you spotted anything in v1 worth referencing later (but not copying).
3. Resume the normal Claude Code workflow per `README.md`.
