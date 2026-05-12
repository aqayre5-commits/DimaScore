#!/usr/bin/env bash
# verify-setup.sh
# Run this once after cloning to confirm the Claude Code harness is functional.
#
# Usage:  bash verify-setup.sh

set -e

PASS=0
FAIL=0

check() {
  local desc="$1" cmd="$2"
  if eval "$cmd" >/dev/null 2>&1; then
    echo "  ✓ $desc"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $desc"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "Atlas Kings v2 — harness verification"
echo "======================================"
echo ""

echo "1. Required files"
check "CLAUDE.md exists"                       "[[ -f CLAUDE.md ]]"
check "CURRENT_PHASE.md exists"                "[[ -f CURRENT_PHASE.md ]]"
check "BACKLOG.md exists"                      "[[ -f BACKLOG.md ]]"
check "Master plan present"                    "[[ -f docs/atlaskings-v2-rebuild-plan-final.md ]]"
check ".claude/settings.json exists"           "[[ -f .claude/settings.json ]]"
check ".claude/state/ directory exists"        "[[ -d .claude/state ]]"

echo ""
echo "2. Hook scripts"
for h in lib-common enforce-no-protected-paths enforce-phase enforce-propose-then-implement enforce-single-write enforce-pnpm; do
  check ".claude/hooks/${h}.sh exists"         "[[ -f .claude/hooks/${h}.sh ]]"
  check ".claude/hooks/${h}.sh is executable"  "[[ -x .claude/hooks/${h}.sh ]]"
done

echo ""
echo "3. CURRENT_PHASE.md is well-formed"
PHASE_LINE=$(head -n 1 CURRENT_PHASE.md 2>/dev/null || echo "")
if echo "$PHASE_LINE" | grep -qE '^Phase [0-9]+ —'; then
  echo "  ✓ First line matches 'Phase {N} — ...'"
  echo "    → $PHASE_LINE"
  PASS=$((PASS + 1))
else
  echo "  ✗ First line of CURRENT_PHASE.md must match 'Phase {N} — ...'"
  echo "    Found: '$PHASE_LINE'"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "4. Dependencies"
check "jq is installed"                        "command -v jq"
check "git is installed"                       "command -v git"
check "node is installed"                      "command -v node"
check "pnpm is installed"                      "command -v pnpm"

echo ""
echo "5. Settings.json is valid JSON"
if command -v jq >/dev/null 2>&1; then
  if jq empty .claude/settings.json 2>/dev/null; then
    echo "  ✓ .claude/settings.json parses"
    PASS=$((PASS + 1))
  else
    echo "  ✗ .claude/settings.json is malformed"
    FAIL=$((FAIL + 1))
  fi
fi

echo ""
echo "6. Hook smoke tests (simulated tool calls via stdin)"

# Test enforce-pnpm blocks npm
RESULT=$(echo '{"tool_name":"Bash","tool_input":{"command":"npm install"}}' | .claude/hooks/enforce-pnpm.sh 2>&1; echo "EXIT=$?")
if echo "$RESULT" | grep -q "EXIT=2" && echo "$RESULT" | grep -q "pnpm"; then
  echo "  ✓ enforce-pnpm.sh blocks 'npm install'"
  PASS=$((PASS + 1))
else
  echo "  ✗ enforce-pnpm.sh failed to block 'npm install'"
  echo "    Output: $RESULT"
  FAIL=$((FAIL + 1))
fi

# Test enforce-pnpm blocks git push
RESULT=$(echo '{"tool_name":"Bash","tool_input":{"command":"git push origin main"}}' | .claude/hooks/enforce-pnpm.sh 2>&1; echo "EXIT=$?")
if echo "$RESULT" | grep -q "EXIT=2"; then
  echo "  ✓ enforce-pnpm.sh blocks 'git push'"
  PASS=$((PASS + 1))
else
  echo "  ✗ enforce-pnpm.sh failed to block 'git push'"
  FAIL=$((FAIL + 1))
fi

# Test enforce-pnpm allows pnpm
RESULT=$(echo '{"tool_name":"Bash","tool_input":{"command":"pnpm install"}}' | .claude/hooks/enforce-pnpm.sh 2>&1; echo "EXIT=$?")
if echo "$RESULT" | grep -q "EXIT=0"; then
  echo "  ✓ enforce-pnpm.sh allows 'pnpm install'"
  PASS=$((PASS + 1))
else
  echo "  ✗ enforce-pnpm.sh rejected 'pnpm install' (should allow)"
  FAIL=$((FAIL + 1))
fi

# Test enforce-no-protected-paths blocks .env
RESULT=$(echo '{"tool_name":"Write","tool_input":{"file_path":".env"}}' | .claude/hooks/enforce-no-protected-paths.sh 2>&1; echo "EXIT=$?")
if echo "$RESULT" | grep -q "EXIT=2"; then
  echo "  ✓ enforce-no-protected-paths.sh blocks writes to .env"
  PASS=$((PASS + 1))
else
  echo "  ✗ enforce-no-protected-paths.sh failed to block .env write"
  FAIL=$((FAIL + 1))
fi

# Test enforce-no-protected-paths allows src/
RESULT=$(echo '{"tool_name":"Write","tool_input":{"file_path":"src/components/Foo.tsx"}}' | .claude/hooks/enforce-no-protected-paths.sh 2>&1; echo "EXIT=$?")
if echo "$RESULT" | grep -q "EXIT=0"; then
  echo "  ✓ enforce-no-protected-paths.sh allows writes to src/"
  PASS=$((PASS + 1))
else
  echo "  ✗ enforce-no-protected-paths.sh rejected src/ write (should allow)"
  FAIL=$((FAIL + 1))
fi

# Test enforce-propose-then-implement blocks when no approval log exists
rm -f .claude/state/approvals.log
RESULT=$(echo '{"tool_name":"Write","tool_input":{"file_path":"src/foo.ts"}}' | .claude/hooks/enforce-propose-then-implement.sh 2>&1; echo "EXIT=$?")
if echo "$RESULT" | grep -q "EXIT=2"; then
  echo "  ✓ enforce-propose-then-implement.sh blocks writes without approval"
  PASS=$((PASS + 1))
else
  echo "  ✗ enforce-propose-then-implement.sh failed to block unapproved write"
  FAIL=$((FAIL + 1))
fi

# Test enforce-propose-then-implement allows fresh approval
mkdir -p .claude/state
# Use UTC ISO 8601 with 'Z' suffix — unambiguous across BSD and GNU date.
echo "PROPOSAL_APPROVED_AT: $(date -u +%Y-%m-%dT%H:%M:%SZ)" > .claude/state/approvals.log
RESULT=$(echo '{"tool_name":"Write","tool_input":{"file_path":"src/foo.ts"}}' | .claude/hooks/enforce-propose-then-implement.sh 2>&1; echo "EXIT=$?")
if echo "$RESULT" | grep -q "EXIT=0"; then
  echo "  ✓ enforce-propose-then-implement.sh allows writes with fresh approval"
  PASS=$((PASS + 1))
else
  echo "  ✗ enforce-propose-then-implement.sh blocked a fresh-approval write"
  echo "    Output: $RESULT"
  FAIL=$((FAIL + 1))
fi

# Clean up test artifact
rm -f .claude/state/approvals.log
rm -f .claude/state/last-write.log

echo ""
echo "======================================"
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo ""

if (( FAIL > 0 )); then
  echo "Setup is NOT ready. Fix the failures above before opening Claude Code."
  exit 1
else
  echo "Setup verified. Open Claude Code and paste the day-one prompt from README.md."
  exit 0
fi
