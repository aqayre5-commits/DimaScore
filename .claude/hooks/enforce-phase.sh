#!/usr/bin/env bash
# enforce-phase.sh
# Ensures CURRENT_PHASE.md exists and is well-formed before any write.
# Records the active phase number to .claude/state/active-phase for downstream use.

set -euo pipefail
HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$HOOK_DIR/lib-common.sh"

require_jq_or_allow

INPUT=$(read_input)
TOOL=$(get_field "$INPUT" '.tool_name')

# Only enforce on write tools
case "$TOOL" in
  Write|Edit|MultiEdit) ;;
  *) allow ;;
esac

if [[ ! -f "CURRENT_PHASE.md" ]]; then
  block "CURRENT_PHASE.md is missing from the repo root. Cannot determine the active phase. Stop and ask the user to create it before any work proceeds."
fi

PHASE_LINE=$(head -n 1 CURRENT_PHASE.md)
PHASE_NUM=$(echo "$PHASE_LINE" | grep -oE 'Phase [0-9]+' | grep -oE '[0-9]+' || echo "")

if [[ -z "$PHASE_NUM" ]]; then
  block "CURRENT_PHASE.md is malformed. First line must match 'Phase {N} — ...'. Found: '$PHASE_LINE'"
fi

# Persist for downstream hooks and observability
mkdir -p .claude/state
echo "$PHASE_NUM" > .claude/state/active-phase

allow
