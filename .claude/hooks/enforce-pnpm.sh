#!/usr/bin/env bash
# enforce-pnpm.sh
# Blocks npm/yarn commands (this repo uses pnpm) and dangerous git operations
# (push, hard reset, commit without explicit user permission).

set -euo pipefail
HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$HOOK_DIR/lib-common.sh"

require_jq_or_allow

INPUT=$(read_input)
CMD=$(get_field "$INPUT" '.tool_input.command')

if [[ -z "$CMD" ]]; then
  allow
fi

# Block npm (but allow npx — sometimes needed for one-off binaries)
if echo "$CMD" | grep -Eq '(^|[^a-z])npm([[:space:]]|$)'; then
  block "This repo uses pnpm. Per CLAUDE.md Rule 8, replace 'npm' with the pnpm equivalent (e.g. 'pnpm install', 'pnpm add', 'pnpm run')."
fi

# Block yarn
if echo "$CMD" | grep -Eq '(^|[^a-z])yarn([[:space:]]|$)'; then
  block "This repo uses pnpm. Per CLAUDE.md Rule 8, replace 'yarn' with the pnpm equivalent."
fi

# Block git push / hard reset / arbitrary commit / rebase / merge
if echo "$CMD" | grep -Eq '^[[:space:]]*git[[:space:]]+push'; then
  block "Per CLAUDE.md Rule 9, do not run 'git push'. Let the user push manually after reviewing the commit."
fi

if echo "$CMD" | grep -Eq 'git[[:space:]]+reset[[:space:]]+--hard'; then
  block "Per CLAUDE.md Rule 9, 'git reset --hard' is dangerous and not permitted. Propose the change you want and let the user handle it."
fi

if echo "$CMD" | grep -Eq '^[[:space:]]*git[[:space:]]+commit'; then
  block "Per CLAUDE.md Rule 9, do not run 'git commit' yourself. Propose a conventional-commit message and let the user run it."
fi

if echo "$CMD" | grep -Eq '^[[:space:]]*git[[:space:]]+(rebase|merge)'; then
  block "Per CLAUDE.md Rule 9, do not run 'git rebase' or 'git merge'. Surface the intent and let the user decide."
fi

# Block sudo
if echo "$CMD" | grep -Eq '^[[:space:]]*sudo[[:space:]]'; then
  block "'sudo' is not permitted in Claude Code sessions for this repo."
fi

# Block destructive rm patterns
if echo "$CMD" | grep -Eq 'rm[[:space:]]+-[a-z]*r[a-z]*f?[[:space:]]+(/|~|\.\.|\$HOME)'; then
  block "Destructive 'rm -rf' targeting filesystem root, home, or parent paths is blocked."
fi

allow
