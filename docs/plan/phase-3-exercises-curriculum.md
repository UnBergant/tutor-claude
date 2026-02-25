# Phase 3: Exercise Engine & Curriculum

## Goal
Full exercise library (all 6 types) + lesson flow + AI-adaptive curriculum. Complete learning loop: user picks module → completes lesson → progress saved → next lesson adapts.

## Steps

### Exercise Engine
1. **Remaining Exercise Components** — MatchPairs, ReorderWords, FreeWriting, ReadingComprehension (GapFill and MultipleChoice already built in Phase 2)
2. **Exercise Engine** — Zustand store, useExercise hook, ExerciseContainer, factory by type
3. **Feedback System** — correct/incorrect animations, contextual hints, "retry topic", "report error"
4. **Exercise Server Actions** — exercise generation via Claude API, validation pipeline, answer evaluation
   - Validation pipeline order: JSON schema validation → Latin American blocklist check → LanguageTool Cloud API grammar check (free tier, 20 req/min) → AI confidence threshold (>0.8) → retry on failure (max 2 retries)
5. **Shared Types** — ExerciseType, Exercise, ExerciseContent, ExerciseAttempt types

### Curriculum & Lessons
6. **Home Screen** — quick start, new topics, deep review, progress dashboard, phrase of the day
7. **Lesson Flow** — Zustand store, lesson = sequence of 5-min blocks (content units, no timer — see PRODUCT.md), review → new material → exercises
8. **Curriculum Generation** — Server Actions + Claude API, adaptation based on progress and mistakes
9. **Module Selection UI** — cards with difficulty, user choice, override option

## Key Files
- src/modules/exercise/components/ (6 exercise type components)
- src/modules/exercise/store.ts, hooks.ts, actions.ts
- src/modules/lesson/ (lesson flow, curriculum)
- src/app/(app)/dashboard/ (home screen)

## Verification
- All 6 exercise types work on mobile and desktop
- Answers validated correctly
- Feedback displays with animations
- AI generates valid exercises
- Touch interactions work (drag & drop on mobile)
- Home screen shows all sections on mobile and desktop
- User picks module → completes lesson → progress saved
- AI adapts program based on results
