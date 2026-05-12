#!/usr/bin/env bash
# enforce-no-protected-paths.sh
# Belt-and-braces on top of settings.json deny rules. Blocks writes to
# protected paths regardless of how the tool input is structured.

set -euo pipefail
HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$HOOK_DIR/lib-common.sh"

require_jq_or_allow

INPUT=$(read_input)
TOOL=$(get_field "$INPUT" '.tool_name')

# Try multiple field names that Claude Code uses across tool variants
PATH_TARGET=$(get_field "$INPUT" '.tool_input.file_path')
if [[ -z "$PATH_TARGET" ]]; then
  PATH_TARGET=$(get_field "$INPUT" '.tool_input.path')
fi
if [[ -z "$PATH_TARGET" ]]; then
  PATH_TARGET=$(get_field "$INPUT" '.tool_input.target_file')
fi

# If we can't determine a path, allow — the deny rules in settings.json
# will catch the well-known patterns anyway.
if [[ -z "$PATH_TARGET" ]]; then
  allow
fi

# Normalize path (strip leading ./)
PATH_TARGET="${PATH_TARGET#./}"

PROTECTED_EXACT=(
  ".env"
  ".env.local"
  ".env.production"
  ".env.development"
  ".env.test"
  "pnpm-lock.yaml"
  "package-lock.json"
  "yarn.lock"
  "CURRENT_PHASE.md"
  "CLAUDE.md"
  "docs/atlaskings-v2-rebuild-plan-final.md"
)

PROTECTED_PREFIX=(
  ".git/"
  "node_modules/"
  ".claude/"
  ".next/"
  ".vercel/"
)

# Exact match check
for p in "${PROTECTED_EXACT[@]}"; do
  if [[ "$PATH_TARGET" == "$p" ]]; then
    block "Write to '$PATH_TARGET' is blocked. Per CLAUDE.md Rule 7, only the user may modify this file. If you need a change here, surface it in chat and let the user edit it."
  fi
done

# Prefix match check (catches any subdirectory)
for p in "${PROTECTED_PREFIX[@]}"; do
  if [[ "$PATH_TARGET" == "$p"* ]] || [[ "$PATH_TARGET" == *"/$p"* ]]; then
    block "Write to '$PATH_TARGET' is blocked. Path matches protected prefix '$p'. Per CLAUDE.md Rule 7."
  fi
done

# Also block .env.* patterns (anything starting with .env. that isn't .env.example)
if [[ "$PATH_TARGET" =~ ^\.env\. ]] && [[ "$PATH_TARGET" != ".env.example" ]]; then
  block "Write to '$PATH_TARGET' is blocked. Environment files are user-managed. Only .env.example may be edited by Claude Code."
fi

allow
