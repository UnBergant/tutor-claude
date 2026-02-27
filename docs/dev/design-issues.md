# Design Issues & Polish Backlog

Collected during development. Grouped by phase, open items first.

## Phase 3b — Lesson Flow (code review findings)

- [ ] **`blockTitles[i]` as React key in `LessonComplete`** — if two blocks have the same title, React key collision. Use index `key={i}` instead.
- [ ] **Two DB queries in `getActiveModuleWithProgress`** — first fetches `profile.activeModuleId`, then `module.findUnique`. Could be a single query with join. Micro-optimization, but called on every dashboard visit.
- [ ] **`nextInterval(0)` returns 30** — if `currentInterval` is not in `INTERVAL_SEQUENCE`, falls through to max (30 days). Schema default is 1, so shouldn't happen, but edge case is unexpected.

## Phase 6 — Polish & Deploy

- [ ] **Poor text contrast on hover (experience-step)** — selected/hovered card has white text on pink/purple background; description text barely readable. Need higher contrast or dark text on accent background.
- [ ] **Assessment: "answer accepted" micro-feedback** — without correct/incorrect feedback, add a subtle UI animation (e.g., brief checkmark or pulse) to confirm the answer was registered before showing the next question.
- [ ] **Onboarding: visual stepper indicator** — the onboarding flow switches between screens but has no step indicator (dots, progress bar, or numbered steps). Add a visual stepper showing current position in the Welcome → Experience → Goal → Assessment flow.
