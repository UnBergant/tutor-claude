# Phase 3: Exercise Engine & Curriculum

## Goal
Full exercise library (all 6 types) + lesson flow + AI-adaptive curriculum. Complete learning loop: assessment results → AI proposes modules → user picks → enters lesson → works through blocks → progress saved → next lesson adapts.

## Strategy
**Engine-first** — build the exercise engine with existing GapFill/MC types first (3a), then lesson flow (3b), then add 4 new exercise types last (3c). This gives a working learning loop after 3b, before investing in new component development.

## Subphases

| Subphase | Name | Status |
|----------|------|--------|
| 3a | Exercise Engine & Feedback System | ✅ Done |
| 3b | Lesson Flow & Curriculum | ⏳ Pending |
| 3c | New Exercise Types | ⏳ Pending |

Dependencies: `3a → 3b → 3c` (3c can be developed in parallel with late 3b, but integration testing requires 3b)

## Key Decisions
- **Tap-to-select** (not drag-and-drop) for MatchPairs and ReorderWords — Duolingo-style, simpler, mobile-reliable, no DnD library
- **LanguageTool API deferred to Phase 6** — validation pipeline uses JSON schema + Latin American blocklist + AI confidence only
- **No phrase of the day** in Phase 3 — depends on streak/gamification (Phase 5), placeholder on home screen

---

## Phase 3a: Exercise Engine & Feedback System ✅

Standalone exercise engine that runs GapFill/MC sequences with full feedback, answer validation, attempt tracking, and AI generation. "Lesson exercise mode" (with feedback) vs assessment's "test mode" (no feedback).

### Completed

1. **Expanded shared types** (`src/shared/types/exercise.ts`)
   - `ExerciseContent` discriminated union for all 6 types (GapFill/MC implemented, rest are type stubs)
   - `ExerciseAttemptResult` for server action responses
   - `ExerciseFeedback` with `retryTopicId`, `mistakeCategory`
   - `ExerciseClientItem` client-safe type (correctAnswer stripped)

2. **Latin American blocklist** (`src/shared/data/latam-blocklist.ts`)
   - ~150 terms (computadora→ordenador, carro→coche, etc.)
   - `checkLatamTerms()` with word-boundary matching, returns violations

3. **Exercise Server Actions** (`src/modules/exercise/actions.ts`)
   - `generateExercise(topicId, type, lessonId)` — generate single exercise via Claude, validate, persist
   - `generateExerciseBatch(topicId, types[], lessonBlockId, lessonId, count)` — batch generation
   - `submitExerciseAnswer(exerciseId, answer)` — validate, create ExerciseAttempt, categorize mistake, track in MistakeEntry, return feedback
   - `reportExerciseError(exerciseId, description)` — user error reporting
   - `getBlockExercises(lessonBlockId)` — load pre-generated exercises
   - Sanitization helpers: `sanitizeGapFill()`, `sanitizeMultipleChoice()`, `hintMatchesAnswer()`

4. **Validation pipeline** (`src/modules/exercise/lib/validation.ts`)
   - Zod schemas per exercise type
   - Latin American blocklist check
   - AI confidence threshold (>0.8)
   - `generateWithRetry()` — retry on failure (max 2 retries)
   - LanguageTool slot prepared (Phase 6)

5. **AI prompts for exercises** (`src/shared/lib/ai/prompts/exercise.ts`)
   - Lesson-context prompts for GapFill and MC (themed, richer explanations than assessment, confidence scoring)
   - JSON schemas with confidence field
   - Typed interfaces: `GeneratedExerciseGapFill`, `GeneratedExerciseMultipleChoice`

6. **Answer checking** (`src/modules/exercise/lib/answer-check.ts`)
   - Extracted `checkAnswer()` from assessment to shared module (assessment imports from here now)
   - Mistake categorization: `categorizeMistake()` → GRAMMAR / VOCABULARY / WORD_ORDER
   - `describeMistakePattern()` for MistakeEntry tracking

7. **Exercise Zustand store** (`src/modules/exercise/store.ts`)
   - Exercise queue, current index, feedback state
   - Loading/submitting/error states
   - Score tracking (correct/total)
   - `advanceToNext()`, `reset()`

8. **useExercise hook** (`src/modules/exercise/hooks.ts`)
   - Connects store to server actions
   - `handleSubmit(answer)`, `handleNext()`, `handleRetryTopic()`, `handleReport()`
   - `initExercises()` for block initialization

9. **ExerciseContainer & Factory** (`src/modules/exercise/components/`)
   - `ExerciseFactory` — renders correct component by `ExerciseType` (GapFill/MC + stubs for 4 future types)
   - `ExerciseContainer` — connects store to presentational components, handles feedback display, Next button, error reporting, completion screen

10. **Feedback animations** (CSS + component updates)
    - Correct: green pulse animation (`animate-pulse-once`)
    - Incorrect: red shake animation (`animate-shake`)
    - Feedback panel: slide-in-from-bottom with fade
    - GapFill: resets input on exercise change (new `before`/`after`)
    - MultipleChoice: resolves correctIndex from `feedback.correctAnswer` when hidden from client

---

## Phase 3b: Lesson Flow & Curriculum ⏳

Complete learning loop: assessment results → AI proposes modules → user picks → enters lesson → works through blocks → progress saved.

### Steps

1. **Curriculum AI prompts** (`src/shared/lib/ai/prompts/curriculum.ts`)
   - Module proposal prompt: gap map + user level + learning goal + recent mistakes → 3-4 modules
   - Lesson generation prompt: module topic + lesson order + prior content → blocks with explanations + exercise specs
   - Block content prompt: grammar explanation text (Castellano, 2-3 paragraphs)

2. **Lesson Server Actions** (`src/modules/lesson/actions.ts`)
   - `generateModuleProposals(userId)` — assessment gap map + mistakes + profile → propose modules → persist
   - `selectModule(moduleId)` — mark active
   - `generateLesson(moduleId, lessonOrder)` — generate blocks + exercises, persist chain in `$transaction`
   - `submitLessonExercise(exerciseId, answer)` — delegate to exercise engine + update lesson progress
   - `completeLesson(lessonId)` — update LessonProgress, compute score, schedule review (1→3→7→30 days)

3. **Lesson Zustand store** (`src/modules/lesson/store.ts`)
   - Current lesson, current block, block index
   - Block-level + overall progress
   - Lesson result/score

4. **Lesson Flow components** (`src/modules/lesson/components/`)
   - `LessonFlow` — block progression orchestrator
   - `LessonBlock` — explanation + exercise sequence via ExerciseContainer
   - `BlockExplanation` — AI grammar explanation (markdown)
   - `BlockTransition` — inter-block screen
   - `LessonComplete` — completion with score + recommendations

5. **Module Selection UI** (`src/modules/lesson/components/`)
   - `ModuleSelection` + `ModuleCard` — proposed modules with title, description, level
   - "I want something else" regeneration, topic override option

6. **Routes**
   - `src/app/(app)/lesson/[lessonId]/page.tsx` — lesson detail
   - `src/app/(app)/modules/page.tsx` — module selection
   - Update `src/app/(app)/lessons/page.tsx` — lesson list for active module

7. **Home Screen** (`src/app/(app)/page.tsx` — rewrite)
   - Quick Start (continue/start next lesson)
   - New Topics (module selection link)
   - Deep Review (weak topics from ExerciseAttempt)
   - Progress Dashboard (per-topic success %)
   - Phrase of the Day (placeholder — Phase 5)

---

## Phase 3c: New Exercise Types ⏳

All 6 exercise types working in the engine and lesson flow.

### Build order (simplest → most complex)

1. **ReorderWords** — shuffled word chips, tap to place in order
2. **MatchPairs** — two columns, tap-to-select pairing
3. **FreeWriting** — AI evaluation via Claude Haiku
4. **ReadingComprehension** — passage + nested questions (MC/GapFill/TrueFalse)

For each: update ExerciseFactory, types, answer-check, validation, prompts.

---

## Key Files

### Phase 3a (done)
- `src/shared/types/exercise.ts` — expanded type system
- `src/shared/data/latam-blocklist.ts` — LatAm vocabulary filter
- `src/shared/lib/ai/prompts/exercise.ts` — lesson-context AI prompts
- `src/modules/exercise/actions.ts` — exercise server actions
- `src/modules/exercise/store.ts` — Zustand store
- `src/modules/exercise/hooks.ts` — useExercise hook
- `src/modules/exercise/lib/validation.ts` — validation pipeline
- `src/modules/exercise/lib/answer-check.ts` — shared answer checking + mistake categorization
- `src/modules/exercise/components/exercise-container.tsx` — container component
- `src/modules/exercise/components/exercise-factory.tsx` — type-based routing
- `src/modules/exercise/components/gap-fill.tsx` — updated with animations
- `src/modules/exercise/components/multiple-choice.tsx` — updated with animations
- `src/app/globals.css` — shake + pulse-once keyframe animations

### Phase 3b (pending)
- `src/modules/lesson/` — lesson flow, curriculum, actions, store
- `src/shared/lib/ai/prompts/curriculum.ts` — curriculum AI prompts
- `src/app/(app)/page.tsx` — home screen rewrite
- `src/app/(app)/lesson/[lessonId]/page.tsx` — lesson route
- `src/app/(app)/modules/page.tsx` — module selection route

### Phase 3c (pending)
- `src/modules/exercise/components/reorder-words.tsx`
- `src/modules/exercise/components/match-pairs.tsx`
- `src/modules/exercise/components/free-writing.tsx`
- `src/modules/exercise/components/reading-comprehension.tsx`

## Out of Scope (deferred)

| Item | Deferred to |
|------|-------------|
| LanguageTool API validation | Phase 6 |
| Phrase of the day | Phase 5 |
| SRS-based deep review algorithm | Phase 5 |
| Drag-and-drop (upgrade from tap-to-select) | Phase 6 if needed |
| Pre-generated exercise pools | Phase 6 |
| Listening/speaking exercises | Post-MVP |

## Verification
- All 6 exercise types work on mobile (375px) and desktop
- Answers validated correctly with accent tolerance
- Feedback displays with animations (shake/pulse)
- AI generates valid exercises passing validation pipeline
- Tap interactions work for MatchPairs and ReorderWords
- Home screen shows all sections
- User picks module → completes lesson → progress saved
- AI adapts curriculum based on mistakes and progress
