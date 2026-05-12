#!/usr/bin/env bash
# enforce-single-write.sh
# Rejects a Write/Edit/MultiEdit if another write happened within the last 5
# seconds. This forcibly serializes file operations and prevents the model
# from firing multiple parallel writes in one assistant response.

set -euo pipefail
HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$HOOK_DIR/lib-common.sh"

require_jq_or_allow

INPUT=$(read_input)
TOOL=$(get_field "$INPUT" '.tool_name')

case "$TOOL" in
  Write|Edit|MultiEdit) ;;
  *) allow ;;
esac

LOG=".claude/state/last-write.log"
mkdir -p "$(dirname "$LOG")"

if [[ ! -f "$LOG" ]]; then
  touch "$LOG"
  allow
fi

LAST=$(tail -n 1 "$LOG" 2>/dev/null || echo "")
if [[ -z "$LAST" ]]; then
  allow
fi

LAST_EPOCH=$(iso_to_epoch "$LAST")
NOW_EPOCH=$(date +%s)
GAP=$((NOW_EPOCH - LAST_EPOCH))

# Minimum 5-second gap between writes
MIN_GAP=5

if (( GAP < MIN_GAP )); then
  block "Per CLAUDE.md Rule 4, write operations must be sequential. Another write occurred ${GAP}s ago (minimum gap: ${MIN_GAP}s). After each write, briefly state what you did and wait for the user to acknowledge before the next write."
fi

allow
