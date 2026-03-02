# Design Issues & Polish Backlog

Collected during development. Grouped by phase, open items first.

## Phase 3b — Lesson Flow (code review findings)

- [x] **`blockTitles[i]` as React key in `LessonComplete`** — merged `blockScores` + `blockTitles` into single `BlockScoreEntry[]` with `title` as key. No more index-based access.
- [x] **Two DB queries in `getActiveModuleWithProgress`** — refactored to single query: `userProfile.findUnique({ select: { activeModule: { include: ... } } })`.
- [x] **`nextInterval(0)` returns 30** — split `idx === -1` case: now returns `INTERVAL_SEQUENCE[0]` (1 day) for unknown intervals, instead of max (30).

## Phase 6 — Polish & Deploy

- [x] **Poor text contrast on hover (experience-step)** — fixed: outline Button variant hover changed from accent to primary tint globally.
- [ ] **Componentize option-list pattern** — experience-step, goal-step, and MC exercise all use the same "list of outline buttons as selectable options" pattern. Extract a shared `OptionList` / `SelectableCard` component to DRY up styling and selection logic.
- [ ] **Assessment: "answer accepted" micro-feedback** — without correct/incorrect feedback, add a subtle UI animation (e.g., brief checkmark or pulse) to confirm the answer was registered before showing the next question.
- [ ] **Onboarding: visual stepper indicator** — the onboarding flow switches between screens but has no step indicator (dots, progress bar, or numbered steps). Add a visual stepper showing current position in the Welcome → Experience → Goal → Assessment flow.
