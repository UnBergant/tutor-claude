#!/bin/bash
# SessionStart(compact) hook: re-injects lifecycle state into Claude's context
# after context compression, so Claude doesn't lose track of the current step.
#
# Output goes to stdout → injected as system context.

STATE_FILE=".claude/lifecycle-state.json"

if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

# Clear awaitingCompact flag — compact just happened, IMPLEMENT can proceed
if jq -e '.awaitingCompact == true' "$STATE_FILE" > /dev/null 2>&1; then
  jq '.awaitingCompact = false' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
fi

echo "=== ACTIVE LIFECYCLE STATE ==="
echo "Read this carefully. You are in the middle of a lifecycle-managed task."
echo ""
cat "$STATE_FILE"
echo ""
echo "RULES:"
echo "- currentStep tells you where you are in the lifecycle"
echo "- Steps with gate:\"user\" require explicit user confirmation before advancing"
echo "- Do NOT skip steps. Do NOT advance past a user gate without user saying so"
echo "- Use /lifecycle to check status or advance steps"
echo ""

# Call-to-action based on current step
CURRENT_STEP=$(jq -r '.currentStep' "$STATE_FILE" 2>/dev/null)
TASK_NAME=$(jq -r '.task' "$STATE_FILE" 2>/dev/null)
echo ">>> NEXT ACTION: Resume $CURRENT_STEP for \"$TASK_NAME\"."
echo ">>> Tell the user what you're about to do and proceed."

echo "=== END LIFECYCLE STATE ==="