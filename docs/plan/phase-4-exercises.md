# Phase 4: Exercise Engine

## Goal
Library of interactive exercises — core of the learning process.

## Steps

1. **Exercise Components** — GapFill, MultipleChoice, MatchPairs, ReorderWords, FreeWriting, ReadingComprehension
2. **Exercise Engine** — store, useExercise hook, ExerciseContainer, factory by type
3. **Feedback System** — correct/incorrect animations, contextual hints, "retry topic", "report error"
4. **Backend** — ExerciseGenerationService (Claude API), validation pipeline, ExerciseEvaluationService
5. **Shared Types** — ExerciseType enum, Exercise, ExerciseContent, ExerciseAttempt, Zod schemas

## Verification
- All 6 exercise types work
- Answers validated correctly
- Feedback displays
- AI generates valid exercises
