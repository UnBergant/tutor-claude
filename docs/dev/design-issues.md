# Design Issues & Polish Backlog

Collected during development. Grouped by phase, open items first.

## Phase 3b — Lesson Flow (code review findings)

- [x] **`blockTitles[i]` as React key in `LessonComplete`** — merged `blockScores` + `blockTitles` into single `BlockScoreEntry[]` with `title` as key. No more index-based access.
- [x] **Two DB queries in `getActiveModuleWithProgress`** — refactored to single query: `userProfile.findUnique({ select: { activeModule: { include: ... } } })`.
- [x] **`nextInterval(0)` returns 30** — split `idx === -1` case: now returns `INTERVAL_SEQUENCE[0]` (1 day) for unknown intervals, instead of max (30).

## Phase 6 — Polish & Deploy

- [x] **Poor text contrast on hover (experience-step)** — fixed: outline Button variant hover changed from accent to primary tint globally.
- [ ] **Componentize option-list pattern** — experience-step, goal-step, and MC exercise all use the same "list of outline buttons as selectable options" pattern. Extract a shared `OptionList` / `SelectableCard` component to DRY up styling and selection logic.
- [x] **Assessment: "answer accepted" micro-feedback** — shimmer overlay on the exercise card during API call + disabled inputs. Replaced initial accepted-pulse approach after user testing. ExerciseShell gained `submitting` prop with shimmer animation, `aria-busy` for a11y, `prefers-reduced-motion` respected.
- [x] **Onboarding: screen transition animations** — added `animate-fade-in-up` with `key={step}` between onboarding screens + `key={questionNumber}` between assessment questions. MC selection highlight (`border-primary bg-primary/10`) during submission. (KAN-39, phase-6a)
- [ ] **Migrate from `prisma db push` to `prisma migrate`** — currently no migration history (`prisma/migrations/` absent). For production, switch to `prisma migrate dev`/`prisma migrate deploy` to get reproducible, versioned schema changes.
