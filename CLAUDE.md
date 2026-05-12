# Atlas Kings v2 — Operating Rules for Claude Code

You are working on **Atlas Kings v2**, a Morocco-focused football data and media site.

The master plan is at `docs/atlaskings-v2-rebuild-plan-final.md`.
You MUST read that file in full at the start of every session before doing anything else.

The current phase is recorded in `CURRENT_PHASE.md`. Read it now.

---

## ABSOLUTE RULES (non-negotiable, enforced by hooks)

Violating any of the rules below will be blocked by hooks at the tool-call layer. Do not attempt to work around them. If a rule blocks something you believe is necessary, stop and ask the user.

### Rule 1 — One phase at a time

Read `CURRENT_PHASE.md` at the start of every session and again at the start of every task. You may ONLY work on tasks within the named phase. If a task belongs to a later phase, refuse it and explain. You may not advance the phase yourself — only the user updates `CURRENT_PHASE.md`. That file is write-protected at the hooks layer.

### Rule 2 — Propose, then implement

Every task is two turns minimum:

  **(a)** Produce a written plan in markdown — files to create, files to modify, commands to run, exit criteria to verify, assumptions you are making. Do NOT create or edit any files in this turn.

  **(b)** Wait for the user to reply "approved" (or a revision). Only then implement exactly the approved plan. No improvisation, no scope additions.

A token (`PROPOSAL_APPROVED_AT: <ISO timestamp>`) must be present in `.claude/state/approvals.log` for the current task before any write tool is used. The hook `enforce-propose-then-implement.sh` blocks Write/Edit/MultiEdit if no fresh approval token (< 30 minutes old) exists.

When the user says "approved", your very first action must be:

```bash
echo "PROPOSAL_APPROVED_AT: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> .claude/state/approvals.log
```

This format (`2026-05-11T22:17:30Z`) is unambiguous across macOS BSD `date` and GNU `date`. Do not use `date -Iseconds` — it produces slightly different output on different platforms.

### Rule 3 — One task per turn

If a task reveals a second task, stop. Surface it in `BACKLOG.md` and wait for the user to decide whether to address it. Do not chain unrelated work.

### Rule 4 — Sequential writes only

Read tools (Read, Glob, Grep, Bash with read-only commands) may run in parallel. Write tools (Write, Edit, MultiEdit, Bash with side effects) must run sequentially — one tool call per assistant response, with the user able to inspect each result before the next is proposed.

The hook `enforce-single-write.sh` rejects any write within 5 seconds of the previous write.

### Rule 5 — No scope creep

If you notice unrelated code that should be improved, refactored, or fixed, add it to `BACKLOG.md` and continue. Do not touch it in the current task. Refactoring "while I'm here" is forbidden.

### Rule 6 — Stop on uncertainty

If a decision is not covered by the plan or the current task description, do not guess. Stop and ask the user. Naming, library choice, file layout, architectural patterns — none of these may be improvised.

### Rule 7 — No protected-path writes

You may not write to:

- `.env*`
- `.git/**`
- `node_modules/**`
- `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`
- `.claude/**`
- `CURRENT_PHASE.md`
- `CLAUDE.md`
- `docs/atlaskings-v2-rebuild-plan-final.md`

This is enforced by both `.claude/settings.json` deny rules and the `enforce-no-protected-paths.sh` hook. Defense in depth.

### Rule 8 — pnpm only

This repo uses pnpm. Never run `npm` or `yarn` commands. Use pnpm equivalents. Blocked by `enforce-pnpm.sh`.

### Rule 9 — Conventional commits, one commit per task, never push

When a task completes, propose a single commit message in conventional-commit format (`feat(scope): …`, `fix(scope): …`, `chore(scope): …`, `docs(scope): …`). Do NOT run `git commit` yourself unless the user explicitly says "commit it." Do NOT run `git push` ever. Both are blocked at the hooks layer.

### Rule 10 — No model deviation from the locked stack

Do not switch frameworks, libraries, ORMs, or services from those locked in the plan:

- Next.js 15 (App Router, RSC)
- TypeScript strict
- Tailwind CSS 4
- Radix UI + shadcn/ui
- Lucide React icons
- Inter + IBM Plex Sans Arabic fonts
- Drizzle ORM
- Supabase Postgres + Realtime
- next-intl (FR, EN, AR)
- Zustand + SWR
- Meilisearch (Railway-hosted)
- Upstash Redis (quota tracking)
- Vercel (frontend) + Railway (live poller, Meilisearch)
- Plausible + Vercel Analytics
- Sentry + BetterStack
- Payload CMS is NOT used — the Media tab + `/admin/media` replaces it

If you believe a different choice is better, surface it in `BACKLOG.md` and continue with the locked choice.

### Rule 11 — No betting / odds UI, ever

API-Football provides odds endpoints (`/odds`, `/odds/live`, `/odds/bookmakers`, `/odds/bets`, `/odds/mapping`). You will not call them. You will not build UI for them. Predictions are surfaced as "Atlas Kings prediction" — editorial framing only, no odds shown anywhere. Loi 09-08 + brand protection.

### Rule 12 — Coverage-gated UI

Every UI tab that depends on optional API-Football data must be gated on the corresponding `league_coverage` flag at render time. Never hardcode "this league has injuries" — always query the coverage table. Empty tabs are not acceptable.

---

## REQUIRED SESSION-START SEQUENCE

At the start of EVERY session, do exactly these steps before responding to any other prompt:

1. Read `CURRENT_PHASE.md` and state the active phase to the user.
2. Read `docs/atlaskings-v2-rebuild-plan-final.md` if not already in context.
3. Read `BACKLOG.md` to be aware of pending observations.
4. Wait for the user's task. Do not proactively suggest tasks.

The SessionStart hook in `.claude/settings.json` already prints the current phase to your transcript automatically. Confirm you've read it before proceeding.

---

## TASK FORMAT YOU EXPECT FROM THE USER

The user will give you tasks in this shape:

> Phase {N}, Task {M}. Per §{section} of the plan, build {component/feature}.
> **Propose** the implementation plan. Do not write code.

If a task is missing the phase reference, the task number, or the "propose" instruction, **ask for clarification rather than proceeding**. Do not assume.

---

## WHAT A PROPOSAL LOOKS LIKE

A proposal is a markdown block containing:

- **Phase / task reference** — must match `CURRENT_PHASE.md` exactly
- **Files to create** — full paths
- **Files to modify** — full paths and what changes
- **Commands to run** — with their working directory
- **Exit criteria** — copied verbatim from the relevant phase in the plan
- **Open questions** — if any decision is unclear, ask before proposing
- **Estimated number of write operations** — so the user knows what to expect

End every proposal with this exact line:

> `Awaiting "approved" to implement.`

---

## WHEN YOU IMPLEMENT (after "approved")

1. First action: write the approval token.
   ```bash
   echo "PROPOSAL_APPROVED_AT: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> .claude/state/approvals.log
   ```
2. Execute the plan exactly. No additions, no deletions, no improvisations.
3. After each write tool call, briefly state what you just did and pause for the user. The hooks will block a second write within 5 seconds anyway.
4. When all steps are complete, run the exit-criteria verification commands.
5. Report results. Do NOT update `CURRENT_PHASE.md`. Only the user does that.
6. Surface anything you noticed but did not action into `BACKLOG.md` via a single append.
7. Propose a conventional-commit message. Wait for the user to commit.

---

## TONE

Concise. No filler. No "great question!" preambles. No re-asserting what the user just said. When proposing, lead with the plan. When implementing, lead with the action. Match the user's communication style — direct, no padding.

---

## IF A HOOK BLOCKS YOU

Hooks return exit code 2 with a stderr message explaining the rejection. When you see one:

1. Read the message carefully. It tells you which rule was violated.
2. Do NOT retry the same operation. The hook will keep blocking.
3. State the block to the user, explain which rule applies, and propose the correct path forward.
4. Wait for the user.

Hooks are not bugs to work around. They are the operating constraints of this project.
