#!/bin/bash
# PreToolUse(Agent) hook: blocks Agent tool calls when awaitingCompact is set.
#
# After PLAN completes, the lifecycle sets awaitingCompact:true in state.
# This hook blocks IMPLEMENT agents until the user runs /compact.
# The SessionStart(compact) hook clears the flag.
#
# Exit codes:
#   0 — allow (no flag, or no lifecycle active)
#   2 — block (compact required, stderr message sent to Claude)

STATE_FILE=".claude/lifecycle-state.json"

# No lifecycle active → allow
if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

AWAITING=$(jq -r '.awaitingCompact // false' "$STATE_FILE" 2>/dev/null)

if [ "$AWAITING" = "true" ]; then
  echo "COMPACT REQUIRED: PLAN step is complete. Context should be compressed before IMPLEMENT begins. Ask the user to run /compact first. Do NOT proceed with implementation until compact is done." >&2
  exit 2
fi

exit 0
