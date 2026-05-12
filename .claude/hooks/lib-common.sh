#!/usr/bin/env bash
# Common helpers for Atlas Kings v2 Claude Code hooks.
# Source this from each hook script.

set -euo pipefail

# Read full JSON input from stdin
read_input() {
  cat
}

# Extract a JSON field with jq, empty string if absent.
# Usage: get_field "$INPUT" '.tool_input.command'
get_field() {
  local json="$1" path="$2"
  echo "$json" | jq -r "$path // empty" 2>/dev/null || echo ""
}

# Block the tool call with a message to Claude.
# Stderr is fed back to Claude as the rejection reason.
block() {
  echo "[Atlas Kings hook] $1" 1>&2
  exit 2
}

# Allow the tool call.
allow() {
  exit 0
}

# Cross-platform epoch from ISO timestamp.
# Strategy: try Python 3 first (handles every ISO 8601 variant correctly,
# always present on macOS 12+ and modern Linux), then fall back to GNU date
# for environments without Python.
#
# Why we don't use BSD `date -j -f`: its %z format specifier rejects the bare
# 'Z' suffix and silently treats Z-suffixed timestamps as local time, which
# produces a result wrong by your timezone offset (e.g. 1h off in Casablanca).
iso_to_epoch() {
  local iso="$1"
  local epoch

  # Strategy 1: Python 3 (preferred — handles all ISO 8601 variants reliably)
  if command -v python3 >/dev/null 2>&1; then
    if epoch=$(python3 -c "
import sys
from datetime import datetime, timezone
s = sys.argv[1].strip()
# Normalise 'Z' suffix to '+00:00' for fromisoformat (needed for Python < 3.11)
if s.endswith('Z'):
    s = s[:-1] + '+00:00'
try:
    dt = datetime.fromisoformat(s)
except ValueError:
    # Last-resort parse for unusual variants without colon in TZ
    import re
    s2 = re.sub(r'([+-]\d{2})(\d{2})$', r'\1:\2', s)
    dt = datetime.fromisoformat(s2)
# Treat naive datetimes as UTC to avoid local-timezone surprises
if dt.tzinfo is None:
    dt = dt.replace(tzinfo=timezone.utc)
print(int(dt.timestamp()))
" "$iso" 2>/dev/null); then
      echo "$epoch"; return 0
    fi
  fi

  # Strategy 2: GNU date (Linux, or gdate on macOS via coreutils)
  if epoch=$(date -d "$iso" +%s 2>/dev/null); then
    echo "$epoch"; return 0
  fi
  if command -v gdate >/dev/null 2>&1; then
    if epoch=$(gdate -d "$iso" +%s 2>/dev/null); then
      echo "$epoch"; return 0
    fi
  fi

  # Last resort: 0 (treats as ancient, blocks writes — safe default)
  echo "0"
}

# Ensure jq is available; if not, allow (don't break the user's workflow)
require_jq_or_allow() {
  if ! command -v jq >/dev/null 2>&1; then
    echo "[Atlas Kings hook] jq not installed; skipping hook check. Install with: brew install jq" 1>&2
    allow
  fi
}
