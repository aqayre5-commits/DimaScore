# Atlas Kings v2

Morocco's premium football data and media site. Built fresh for season 2026/27.

**Status:** Phase 0 — Greenfield setup.

## Repository overview

This is a clean-slate rebuild. Nothing from the v1 prototype is reused except the trilingual text normalization engine, which will be cherry-picked in Phase 0.

The master plan lives in [`docs/atlaskings-v2-rebuild-plan-final.md`](docs/atlaskings-v2-rebuild-plan-final.md). Read it before doing anything.

## How work happens in this repo

Every change goes through a **propose → approve → implement** loop, enforced mechanically by Claude Code hooks (see `.claude/hooks/`). You cannot skip steps or fire parallel writes — the hooks will reject the tool call.

### The rhythm

1. Open Claude Code in this repo. The SessionStart hook prints the current phase from `CURRENT_PHASE.md`.
2. Give Claude Code a task in this exact shape:
   ```
   Phase {N}, Task {M}. Per §{section} of the plan, build {feature}.
   Propose the implementation plan. Do not write code.
   ```
3. Claude produces a markdown proposal. **No files are written.** Hooks would block any write attempt.
4. You review. If good, reply `Approved.` If not, request a revision.
5. Claude writes the approval token to `.claude/state/approvals.log`, then implements one file at a time, pausing between each. Hooks enforce sequential writes.
6. You verify the exit criteria from the plan.
7. **You** (not Claude) update `CURRENT_PHASE.md` to the next task. Claude cannot — that file is write-protected.

That's the entire loop. The hooks ensure you never get ahead of yourself.

## Day one — initial setup

```bash
# 1. Clone this repo (already done if you're reading this in the repo)
git clone git@github.com:<you>/atlaskings-v2.git
cd atlaskings-v2

# 2. Make the hook scripts executable
chmod +x .claude/hooks/*.sh

# 3. Create the empty state directory
mkdir -p .claude/state
touch .claude/state/approvals.log

# 4. Verify the setup
cat CURRENT_PHASE.md          # → "Phase 0 — Greenfield setup..."
ls -la .claude/hooks/         # → 6 .sh files, all executable
cat .claude/settings.json | head -5

# 5. Open Claude Code
claude

# 6. Give it the opening prompt (from docs/atlaskings-v2-rebuild-plan-final.md §M)
```

## Day-one Claude Code opening prompt

Paste this into your first Claude Code session:

> Read `CLAUDE.md` and `docs/atlaskings-v2-rebuild-plan-final.md` at the repo root. Confirm you understand:
>
> 1. The Atlas Royal palette and that all colours come from CSS variables in `src/styles/tokens.css`.
> 2. The provider-agnostic `DataProvider` interface and the `ApiFootballAdapter` pattern.
> 3. The `coverage` flag system — UI tabs are gated on `league_coverage`, never hardcoded.
> 4. That we are NOT reusing anything from the v1 prototype except the text normalization engine, extended for EN.
> 5. The Phase 0 → Phase 12 sequence.
> 6. The directory structure in Part I — no CMS folder, editorial replaced by `/admin/media`.
> 7. Three locales: FR (default), EN, AR (RTL).
> 8. **No betting/odds UI ships, ever. Predictions surface as editorial only.**
> 9. **Every league/cup/team/match/player has a Media tab with embedded YouTube videos curated through `/admin/media`.**
> 10. **Women's football is first-class — same schema, same depth, same UI.** WAFCON 2026 (25 July, Morocco) is the launch event.
>
> Then propose Phase 0 as a step-by-step plan with file paths and commands. Do not write code yet.

## Files in this starter bundle

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Operating rules read by Claude Code on every session |
| `CURRENT_PHASE.md` | One-line phase lock; only the user updates it |
| `BACKLOG.md` | Where Claude deposits observations it cannot act on |
| `MIGRATION-FROM-V1.md` | One-time steps to cherry-pick the normalization engine from v1 |
| `docs/atlaskings-v2-rebuild-plan-final.md` | The master plan |
| `.claude/settings.json` | Permission rules + hook registration |
| `.claude/hooks/*.sh` | Pre-tool guards that enforce the rules |
| `.claude/state/approvals.log` | Approval token log (created at first approval) |
| `.gitignore` | Standard Next.js + secrets ignore |

## What the hooks actually block

The harness rejects, at the tool-call layer:

- Any write to `.env*`, `.git/`, `.claude/`, `CURRENT_PHASE.md`, `CLAUDE.md`, or the master plan
- Any write without a fresh user approval token (< 30 minutes old)
- Any second write within 5 seconds of the previous one (parallel writes)
- `npm`, `yarn`, `git push`, `git reset --hard`, `git commit`, `sudo`, `chmod 777`
- Any write that doesn't reference the active phase

These are enforced by `.claude/hooks/*.sh`, not just by instructions. The model cannot work around them.

## Recovering from a stuck state

If a hook blocks something legitimate (rare but possible):

1. **Do not edit the hooks.** That defeats the purpose.
2. Make the change yourself in your editor.
3. Commit it manually.
4. Resume the Claude Code session.

If the propose-then-implement hook is rejecting work that was approved more than 30 minutes ago, that's by design — re-propose and re-approve. Long sessions drift; freshness checks catch it.
