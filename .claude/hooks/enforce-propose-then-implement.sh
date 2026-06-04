#!/usr/bin/env bash
# enforce-propose-then-implement.sh
# Blocks file writes unless the user has approved a proposal in the last 30
# minutes. The approval token is written by Claude (per CLAUDE.md Rule 2) only
# AFTER the user types "approved" in response to a written proposal.
#
# Token format in .claude/state/approvals.log:
#   PROPOSAL_APPROVED_AT: 2026-06-12T14:23:01+01:00

set -euo pipefail
HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$HOOK_DIR/lib-common.sh"

require_jq_or_allow

INPUT=$(read_input)
TOOL=$(get_field "$INPUT" '.tool_name')

# Only gate write tools
case "$TOOL" in
  Write|Edit|MultiEdit) ;;
  *) allow ;;
esac

APPROVAL_FILE=".claude/state/approvals.log"

if [[ ! -f "$APPROVAL_FILE" ]]; then
  block "No approval log found at $APPROVAL_FILE. Per CLAUDE.md Rule 2, you must propose a plan and receive explicit user approval before any write. Stop now, produce a written proposal, and wait for the user to say 'approved'."
fi

# Extract the most recent PROPOSAL_APPROVED_AT timestamp
LATEST=$(grep -oE 'PROPOSAL_APPROVED_AT: [0-9T:+-]+' "$APPROVAL_FILE" | tail -n 1 | awk '{print $2}')

if [[ -z "$LATEST" ]]; then
  block "Approval log exists but contains no valid approval token. Per CLAUDE.md Rule 2, propose a plan and wait for the user to say 'approved'. Then log the approval with the exact command from CLAUDE.md."
fi

# Compute age in seconds
LATEST_EPOCH=$(iso_to_epoch "$LATEST")
NOW_EPOCH=$(date +%s)
AGE=$((NOW_EPOCH - LATEST_EPOCH))

# 1800 seconds = 30 minutes. Beyond that, require fresh approval.
MAX_AGE=28800

if (( AGE > MAX_AGE )); then
  block "Last approval is ${AGE}s old (max ${MAX_AGE}s). Per CLAUDE.md Rule 2, re-propose the plan and obtain fresh user approval before continuing. Long-running work needs explicit re-confirmation to avoid drift."
fi

allow
