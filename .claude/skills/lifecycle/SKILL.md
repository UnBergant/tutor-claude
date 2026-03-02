---
name: lifecycle
description: Orchestrate feature lifecycle — track steps, enforce gates, dispatch sub-agents. Use when starting a new task, checking lifecycle status, or advancing to the next step.
user-invocable: true
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion, TaskCreate, TaskUpdate, TaskList
argument-hint: "[start|status|advance|complete <step>]"
---

# Lifecycle Orchestrator

You manage the feature lifecycle defined in `docs/dev/feature-lifecycle.md`.
The lifecycle state is persisted in `.claude/lifecycle-state.json`.

## Commands

Based on `$ARGUMENTS`, do one of:

### `start <task-name>` — Initialize a new lifecycle

1. Check if `.claude/lifecycle-state.json` already exists. If it does and has incomplete steps, warn the user and ask if they want to override.
2. Read the task spec from `docs/plan/` if available.
3. Ask the user to confirm the task name and list subtasks for the IMPLEMENT step.
4. Create `.claude/lifecycle-state.json` with this structure:

```json
{
  "task": "<task-name>",
  "branch": "<current git branch>",
  "startedAt": "<ISO timestamp>",
  "currentStep": "PLAN",
  "steps": {
    "CONTEXT_CHECK": { "status": "completed", "gate": "auto" },
    "PLAN": { "status": "in_progress", "gate": "auto" },
    "IMPLEMENT": {
      "status": "pending",
      "gate": "auto",
      "subtasks": []
    },
    "VERIFY": {
      "status": "pending",
      "gate": "user",
      "gateDescription": "Manual browser testing by user"
    },
    "TEST": { "status": "pending", "gate": "auto" },
    "REVIEW": { "status": "pending", "gate": "auto" },
    "DOCUMENT": { "status": "pending", "gate": "auto" },
    "CLOSE": {
      "status": "pending",
      "gate": "user",
      "gateDescription": "User confirms commit and PR"
    }
  }
}
```

5. Create TaskList items for each lifecycle step.

### `status` (or no arguments) — Show current lifecycle state

1. Read `.claude/lifecycle-state.json`.
2. If no file exists, say "No active lifecycle. Use `/lifecycle start <task-name>` to begin, or `/lifecycle recover` to reconstruct state from existing work."
3. Display a formatted table:
   - Each step with status emoji (⏳ pending, 🔄 in_progress, ✅ completed)
   - Current step highlighted
   - User gates marked with 🚧
   - Subtask progress for IMPLEMENT step
4. Show what the next action should be.

### `advance` — Move to the next step

1. Read the current state.
2. Validate: current step must be `completed` before advancing.
3. If the NEXT step has `gate: "user"`:
   - Check if the current step's work is actually done (run automated checks if applicable).
   - Do NOT advance. Instead, display what needs user confirmation and STOP.
4. If the NEXT step has `gate: "auto"`:
   - Update `currentStep` to the next step.
   - Set the next step's status to `in_progress`.
   - Save state.
   - Begin executing the step (see Step Execution below).

### `complete <step>` — Mark a step as completed (for user gates)

1. This is how the user confirms a gate. Example: `/lifecycle complete VERIFY`
2. Mark the step as `completed` with timestamp.
3. Advance `currentStep` to the next step.
4. Begin executing the next step if it's `auto`.

### `recover` — Reconstruct state from project artifacts

Use when there is no state file but work is already in progress (e.g., mid-phase, state file lost, or lifecycle was never started formally).

1. **Gather evidence** from multiple sources (run these in parallel):
   - `docs/plan/README.md` — which phases are done/in-progress
   - `MEMORY.md` — detailed progress notes, subtask status
   - `git status` — uncommitted changes (implies CLOSE not done)
   - `git branch --show-current` — current branch name (implies which phase)
   - `git log --oneline -10` — recent commits
   - `npm run build 2>&1 | tail -3` — does it compile? (IMPLEMENT status)
   - `npm run test 2>&1 | tail -5` — do tests pass? (TEST status)
   - TodoList tasks — what's been tracked in this session

2. **Infer lifecycle state** by reasoning through each step:
   - PLAN: if implementation exists → completed
   - IMPLEMENT: if build passes and all planned features exist → completed
   - VERIFY: **always assume pending unless user explicitly confirms** (this is a user gate — never auto-complete it)
   - TEST: if tests exist and pass → completed
   - REVIEW: check MEMORY.md for review notes; if review findings documented → completed
   - DOCUMENT: check if docs/plan/ updated, MEMORY.md updated → completed
   - CLOSE: if changes are uncommitted → pending

3. **Present findings** to the user as a table:
   ```
   Recovered lifecycle state for: <task-name>

   Step          | Inferred Status | Evidence
   PLAN          | ✅ completed    | Implementation exists
   IMPLEMENT     | ✅ completed    | Build passes, 36 new tests
   VERIFY        | ⏳ pending 🚧  | User gate — needs confirmation
   ...
   ```

4. **Ask user to confirm** the inferred state before saving.
5. On confirmation: write `.claude/lifecycle-state.json` and create TaskList items.

## Step Execution

When a step becomes `in_progress`, execute it according to its type:

### PLAN
- Read task spec from `docs/plan/`.
- Explore related code via Agent(Explore).
- Present the plan to the user.
- Suggest `/toxic-opinion` for second opinion.
- When user approves: mark PLAN completed, advance.

### IMPLEMENT
- For each subtask in order:
  - Update subtask status to `in_progress` in state file.
  - Launch Agent(general-purpose) with focused instructions for that subtask.
  - When agent returns: update subtask to `completed`.
- When all subtasks done: run `npm run build` and `npm run lint`.
- If build/lint pass: mark IMPLEMENT completed, advance.
- If build/lint fail: fix issues, re-check.

### VERIFY (gate: user)
- Run automated checks: `npm run build`, `npm run lint`.
- Report results.
- **STOP HERE.** Display:
  ```
  ✅ Automated checks passed.

  🚧 VERIFY requires your manual testing:
  - Test the feature in the browser (npm run dev)
  - Check edge cases: empty data, errors, mobile viewport
  - Check animations respect prefers-reduced-motion

  When done, run: /lifecycle complete VERIFY
  ```
- Do NOT proceed further. Do NOT start TEST, REVIEW, or any other step.

### TEST
- Write unit tests (Vitest) for new business logic.
- Write E2E tests (Playwright) if UI changed.
- Run `npm run test` and `npm run test:e2e`.
- If all pass: mark TEST completed, advance.

### REVIEW
- Launch Agent(general-purpose) to review all changes.
- Suggest `/toxic-review` for Codex second opinion.
- If findings exist:
  - Create fix tasks.
  - Set currentStep back to IMPLEMENT (fix loop).
  - Update state file.
- If clean: mark REVIEW completed, advance.

### DOCUMENT
- Update `docs/plan/` — mark task/phase as done.
- Update `MEMORY.md` with decisions and learnings.
- Check `product-issues.md` and `design-issues.md` for items to close.
- Update `CLAUDE.md`/`AGENTS.md` if project structure changed.
- Mark DOCUMENT completed, advance.

### CLOSE (gate: user)
- Run final checks: `npm run build`, `npm run test`.
- Display summary of all work done.
- **STOP HERE.** Display:
  ```
  ✅ All steps completed. Ready to finalize.

  🚧 CLOSE requires your confirmation:
  - Review the changes
  - Confirm commit message and PR creation

  When ready, run: /lifecycle complete CLOSE
  ```
- On complete: commit, push, create PR (if user confirms).
- Archive state: rename to `.claude/lifecycle-state.done.json`.

## Critical Rules

1. **NEVER skip a step.** Always follow the order: PLAN → IMPLEMENT → VERIFY → TEST → REVIEW → DOCUMENT → CLOSE.
2. **NEVER advance past a user gate** without the user explicitly running `/lifecycle complete <step>`.
3. **Always update the state file** after every step transition. The state file is the source of truth.
4. **Always read the state file** before taking any action. Never rely on conversation history for lifecycle state.
5. **Sub-agents for heavy work.** Use Agent tool for IMPLEMENT subtasks and REVIEW to preserve context.
6. **Context awareness.** If context usage feels high (many messages, large outputs), suggest compacting before continuing.

## State File Location

`.claude/lifecycle-state.json` — in the project's `.claude/` directory. This file is gitignored.
