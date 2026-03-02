# Lifecycle Enforcement — Architecture Design

> Temporary design doc. Will be converted into a skill + hooks implementation.

## Problem

Feature lifecycle (PLAN → IMPLEMENT → VERIFY → TEST → REVIEW → DOCUMENT → CLOSE) is defined in `docs/dev/feature-lifecycle.md`, but enforcement is soft — instructions live in CLAUDE.md and get lost when context compresses. Result: steps get skipped (e.g., VERIFY requires manual browser testing, but Claude races ahead to REVIEW).

### Root causes

1. **No external state** — current lifecycle step lives only in conversation context → lost on compaction
2. **No hard gates** — steps requiring user input (VERIFY) have no blocking mechanism
3. **Inertia** — in a long session, "momentum" overrides instructions

## Solution: Hooks + State File + Orchestrator Skill

Three layers working together:

```
┌─────────────────────────────────────────────────┐
│  /lifecycle skill (orchestrator)                │
│  Reads state → dispatches sub-agents per step   │
│  Hard-stops at gates requiring user input        │
├─────────────────────────────────────────────────┤
│  .claude/lifecycle-state.json (persistent state) │
│  Source of truth for current step + progress     │
├─────────────────────────────────────────────────┤
│  Hooks (enforcement layer)                       │
│  SessionStart(compact) → re-inject state         │
│  Stop → block if mandatory step skipped          │
└─────────────────────────────────────────────────┘
```

## 1. State File — `.claude/lifecycle-state.json`

Lives in project `.claude/` directory. Persists across sessions.

```json
{
  "task": "Phase 5: Chat with Celestia",
  "branch": "phase-5",
  "currentStep": "IMPLEMENT",
  "steps": {
    "PLAN": {
      "status": "completed",
      "completedAt": "2026-03-01T10:00:00Z"
    },
    "IMPLEMENT": {
      "status": "in_progress",
      "subtasks": [
        { "id": "5a", "name": "Chat infrastructure", "status": "completed" },
        { "id": "5b", "name": "Chat UI", "status": "in_progress" },
        { "id": "5c", "name": "Situation mode", "status": "pending" },
        { "id": "5d", "name": "Post-session extraction", "status": "pending" }
      ]
    },
    "VERIFY": {
      "status": "pending",
      "gate": "user",
      "gateDescription": "Manual browser testing by user"
    },
    "TEST": {
      "status": "pending",
      "gate": "auto",
      "gateDescription": "npm run test && npm run build && npm run lint"
    },
    "REVIEW": {
      "status": "pending",
      "gate": "auto"
    },
    "DOCUMENT": {
      "status": "pending",
      "gate": "auto"
    },
    "CLOSE": {
      "status": "pending",
      "gate": "user",
      "gateDescription": "User confirms commit and PR"
    }
  }
}
```

### Gate types

| Gate | Behavior |
|------|----------|
| `auto` | Claude can complete and advance automatically |
| `user` | **Hard stop** — Claude must pause and wait for user confirmation before advancing |

### State transitions

```
pending → in_progress → completed
                ↑           │
                └───────────┘  (REVIEW finds issues → back to IMPLEMENT)
```

Rules:
- Only one step can be `in_progress` at a time
- Cannot advance past a `user` gate without explicit user confirmation
- `currentStep` always reflects the active or next-pending step

## 2. Hooks — Enforcement Layer

### 2a. SessionStart(compact) — Re-inject state

When context compresses, this hook re-injects the lifecycle state so Claude doesn't "forget" where it is.

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "compact",
        "type": "command",
        "command": "echo '--- LIFECYCLE STATE ---' && cat .claude/lifecycle-state.json && echo '--- END LIFECYCLE STATE ---'"
      }
    ]
  }
}
```

**Effect**: After every compaction, Claude sees the current lifecycle step in its fresh context.

### 2b. Stop hook — Prevent skipping user gates

When Claude tries to "finish" (Stop event), this hook checks whether a `user` gate was skipped.

```bash
#!/bin/bash
# .claude/hooks/check-lifecycle-gate.sh

STATE_FILE=".claude/lifecycle-state.json"

if [ ! -f "$STATE_FILE" ]; then
  exit 0  # No lifecycle active, allow
fi

CURRENT_STEP=$(jq -r '.currentStep' "$STATE_FILE")

# Check if any step before currentStep has gate:"user" and status != "completed"
# This is a simplified check — full implementation would iterate steps in order
VERIFY_STATUS=$(jq -r '.steps.VERIFY.status' "$STATE_FILE")
VERIFY_GATE=$(jq -r '.steps.VERIFY.gate' "$STATE_FILE")

if [ "$VERIFY_GATE" = "user" ] && [ "$VERIFY_STATUS" != "completed" ]; then
  # Check if we've moved past VERIFY
  case "$CURRENT_STEP" in
    TEST|REVIEW|DOCUMENT|CLOSE)
      echo "BLOCKED: VERIFY step requires user confirmation but is still '$VERIFY_STATUS'. Cannot skip." >&2
      exit 2
      ;;
  esac
fi

exit 0
```

```json
{
  "hooks": {
    "Stop": [
      {
        "type": "command",
        "command": "bash .claude/hooks/check-lifecycle-gate.sh"
      }
    ]
  }
}
```

**Effect**: If Claude tries to advance past VERIFY without user confirmation → exit code 2 → Claude receives the error message and must stop.

## 3. Orchestrator Skill — `/lifecycle`

A custom skill (`.claude/commands/lifecycle.md`) that serves as the entry point for lifecycle management.

### Responsibilities

1. **Read state** from `.claude/lifecycle-state.json`
2. **Show status** — current step, progress, what's next
3. **Dispatch sub-agents** for heavy steps (IMPLEMENT, REVIEW)
4. **Hard-stop at user gates** — explicitly ask user and wait
5. **Update state** after each step completes

### Skill flow

```
User invokes /lifecycle
  │
  ├─ No state file? → Ask: "Start new task? Provide task name and subtasks"
  │                    → Create state file, set PLAN as in_progress
  │
  ├─ Current step = PLAN?
  │   → Read task spec from docs/plan/
  │   → Show plan summary, ask user to approve
  │   → On approval: mark PLAN completed, advance to IMPLEMENT
  │
  ├─ Current step = IMPLEMENT?
  │   → Show subtask list with progress
  │   → Launch sub-agent for next pending subtask
  │   → Sub-agent works with focused context (types, store, components, etc.)
  │   → On subtask complete: update state, check if all subtasks done
  │   → All done: advance to VERIFY
  │
  ├─ Current step = VERIFY? (gate: user)
  │   → Run automatic checks: npm run build, npm run lint, npm run test
  │   → Report results
  │   → **STOP HERE** — "Automatic checks passed. Please test manually in browser.
  │     When done, run /lifecycle again to continue."
  │   → On next invocation with VERIFY still active: ask "Did manual testing pass?"
  │   → On user confirmation: mark VERIFY completed, advance to TEST
  │
  ├─ Current step = TEST?
  │   → Launch sub-agent: write/run unit tests + E2E
  │   → On all tests pass: advance to REVIEW
  │
  ├─ Current step = REVIEW?
  │   → Launch sub-agent: self-review of all changes
  │   → Optionally suggest /toxic-review for Codex second opinion
  │   → If findings: create fix subtasks, set currentStep back to IMPLEMENT
  │   → If clean: advance to DOCUMENT
  │
  ├─ Current step = DOCUMENT?
  │   → Update docs/plan/, MEMORY.md, backlogs
  │   → Advance to CLOSE
  │
  └─ Current step = CLOSE? (gate: user)
      → Show summary of all work done
      → **STOP HERE** — "Ready to commit. Run /lifecycle to finalize."
      → On next invocation: commit, push, create PR
      → Mark all steps completed, archive state file
```

## 4. Sub-Agents — Fresh Context per Step

Each heavy lifecycle step dispatches to a sub-agent via the `Agent` tool. Benefits:

| Benefit | Why it matters |
|---------|---------------|
| Fresh context | No accumulated noise from previous steps |
| Focused instructions | Each agent gets only what it needs |
| Context budget preserved | Main conversation stays light |
| Parallelizable | Independent subtasks can run concurrently |

### Sub-agent design

Each sub-agent receives:
1. **Task description** from the state file (subtask name + description)
2. **Relevant file paths** (the orchestrator reads the plan and provides them)
3. **Constraints** — specific tools allowed, coding standards to follow
4. **Exit criteria** — what "done" looks like for this step

Example for IMPLEMENT sub-agent:
```
"Implement subtask 5b: Chat UI components.
 Create: message-list.tsx, message-bubble.tsx, chat-input.tsx, typing-indicator.tsx, chat-container.tsx.
 Follow patterns from src/modules/lesson/components/.
 Use Zustand store from src/modules/chat/store.ts.
 When done, run npm run build to verify compilation."
```

Example for REVIEW sub-agent:
```
"Review all uncommitted changes on branch phase-5.
 Check: input validation, error handling, accessibility, type safety, performance.
 Categorize findings as CRITICAL or NON-CRITICAL.
 Write findings to .claude/review-findings.md."
```

## 5. Context Window Management

### Problem
Long implementation sessions consume context. At ~80% capacity, compaction fires and instructions are lost.

### Solution: multi-layered

1. **Sub-agents** — heavy work happens in isolated contexts, not the main conversation
2. **SessionStart(compact) hook** — re-injects lifecycle state after every compaction
3. **State file** — persistent truth that survives any context event
4. **Orchestrator skill** — re-reads state on every invocation, never relies on conversation history

### Budget monitoring
The orchestrator skill should check context usage before starting heavy steps. If >60%, it should:
- Suggest compacting before proceeding
- Or dispatch to a sub-agent instead of doing work inline

## 6. File Structure

```
.claude/
├── commands/
│   ├── lifecycle.md              # Orchestrator skill
│   └── current-stage.md          # Existing status skill
├── hooks/
│   └── check-lifecycle-gate.sh   # Stop hook script
├── lifecycle-state.json          # Current task state (gitignored)
├── review-findings.md            # Review output (temporary)
└── settings.local.json           # Hook configuration (updated)
```

`.gitignore` addition:
```
.claude/lifecycle-state.json
.claude/review-findings.md
```

## 7. Open Questions

1. **Should lifecycle-state.json be gitignored?** — It's session-specific, but could be useful for resuming across sessions. Leaning toward gitignored (it's a working file, not source of truth).

2. **How granular should subtasks be?** — Currently defined in the plan docs. The orchestrator could auto-generate subtasks from the plan, or require manual definition.

3. **Should the skill auto-invoke?** — `disable-model-invocation: false` would let Claude invoke `/lifecycle` proactively. Could be useful but also noisy. Start with manual-only (`user-invocable: true`).

4. **Review loop limit** — How many IMPLEMENT→REVIEW cycles before escalating? Suggest max 3, then ask user.

## 8. Implementation Order

1. **State file format** — define JSON schema, create initial template
2. **SessionStart(compact) hook** — simplest, immediate value
3. **Stop hook** — gate enforcement
4. **Orchestrator skill** — `/lifecycle` command with full flow
5. **Sub-agent prompts** — templates for IMPLEMENT, TEST, REVIEW steps
