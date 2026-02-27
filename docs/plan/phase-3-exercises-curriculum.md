# Phase 3: Exercise Engine & Curriculum

## Goal
Full exercise library (all 6 types) + lesson flow + AI-adaptive curriculum. Complete learning loop: assessment results → AI proposes modules → user picks → enters lesson → works through blocks → progress saved → next lesson adapts.

## Strategy
**Engine-first** — build the exercise engine with existing GapFill/MC types first (3a), then lesson flow (3b), then add 4 new exercise types last (3c). This gives a working learning loop after 3b, before investing in new component development.

## Subphases

| Subphase | Name | Status |
|----------|------|--------|
| 3a | Exercise Engine & Feedback System | ✅ Done |
| 3b | Lesson Flow & Curriculum | ✅ Done |
| 3c | New Exercise Types | ✅ Done |

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

## Phase 3b: Lesson Flow & Curriculum ✅

Complete learning loop: assessment results → AI proposes modules → user picks → enters lesson → works through blocks → progress saved.

### Completed

1. **Schema migration**
   - `UserProfile.activeModuleId` — FK to Module (one active module at a time, `onDelete: SetNull`)
   - `LessonBlock.title` — AI-generated block title (e.g., "Review: Present Tense")
   - `Module.activeProfiles` — back-relation for the named relation

2. **Shared extraction (FSD-lite compliance)**
   - Server-side utils moved to `src/shared/lib/exercise/`: `answer-check.ts`, `validation.ts`, `generation.ts`
   - `generation.ts` extracts `generateAndValidateExercise()`, `toPrismaExerciseType()`, `fromPrismaExerciseType()`, `toClientItem()`, `exerciseRecordToClientItem()` from exercise actions
   - UI components moved to `src/shared/ui/exercises/`: `gap-fill.tsx`, `multiple-choice.tsx`, `exercise-shell.tsx`, `exercise-factory.tsx`
   - Original exercise module files re-export from shared (backwards-compatible)
   - Assessment `actions.ts` updated to import `checkAnswer` from shared

3. **Curriculum AI prompts** (`src/shared/lib/ai/prompts/curriculum.ts`)
   - `buildModuleProposalPrompt()` — gap map summarized by level + top 10 mistakes + user level/goal → 3-4 modules
   - `buildLessonGenerationPrompt()` — topic + lesson order + previous topics → 2-3 blocks with explanations + exercise specs
   - `MODULE_PROPOSAL_SCHEMA`, `LESSON_GENERATION_SCHEMA` — JSON schemas for tool_use
   - Types: `GeneratedModuleProposal`, `GeneratedLesson`, `GeneratedLessonBlock`

4. **Lesson Server Actions** (`src/modules/lesson/actions.ts`)
   - `generateModuleProposals()` — load assessment gap map + mistakes → AI proposals → validate topicIds → persist modules
   - `regenerateModuleProposals()` — clear existing + regenerate
   - `selectModule(moduleId)` — set `UserProfile.activeModuleId`, auto-generate first lesson if needed
   - `generateLesson(moduleId, lessonOrder)` — AI lesson structure → persist blocks → parallel exercise generation via `generateAndValidateExercise` → persist exercises
   - `getLessonDetail(lessonId)` — load lesson with blocks, exercises (as `ExerciseClientItem`), progress
   - `submitLessonExercise(exerciseId, answer)` — check + categorize + track mistake + mark lesson IN_PROGRESS
   - `completeLesson(lessonId)` — compute score from attempts, schedule review (interval doubling: 1→3→7→14→30 days), increment `lessonsCompleted`
   - `generateNextLesson(moduleId)` — generate next lesson in module (max 4)

5. **Lesson queries** (`src/modules/lesson/queries.ts`)
   - `getActiveModuleWithProgress()`, `getNextLessonForUser()`, `getDueReviews()`, `getMistakeStats()`, `getUserModules()`, `getLatestAssessment()`

6. **Lesson Zustand store** (`src/modules/lesson/store.ts`)
   - Phase machine: `"explanation" | "exercises" | "transition" | "complete"`
   - Block-level exercise state: `blockExercises`, `currentExerciseIndex`, `exerciseFeedback`
   - Per-block score tracking: `blockScores: { correct, total }[]`
   - Actions: `initLesson()`, `startExercises()`, `recordAnswer()`, `advanceExercise()`, `advanceToNextBlock()`, `completeLesson()`

7. **useLesson hook** (`src/modules/lesson/hooks.ts`)
   - Connects store to server actions with error handling
   - `handleSubmitAnswer()`, `handleNextExercise()`, `handleStartExercises()`, `handleContinueToNextBlock()`, `handleCompleteLesson()`
   - Computed: `currentBlock`, `totalBlocks`, `overallScore`, `isLastBlock`

8. **Lesson Flow components** (`src/modules/lesson/components/`)
   - `LessonFlow` — phase routing: explanation → exercises → transition → complete
   - `BlockExplanation` — `react-markdown` grammar explanation + REVIEW/NEW_MATERIAL badge + "Start Exercises" button
   - `BlockTransition` — block score + "Up next" preview + "Continue"
   - `LessonComplete` — overall score + per-block breakdown + next review date + navigation
   - `LessonSkeleton` — spinner with "Generating your lesson..." message

9. **Module Selection UI** (`src/modules/lesson/components/`)
   - `ModuleSelection` — grid of ModuleCards + "I want something else" regeneration
   - `ModuleCard` — title, description, level Badge, "Start" button
   - `ModuleLessonList` — lessons within active module with status indicators (✓/→/○), "Generate Next Lesson" button

10. **Routes**
    - `src/app/(app)/modules/page.tsx` — auth + generate proposals if none + ModuleSelection
    - `src/app/(app)/lesson/[lessonId]/page.tsx` — auth + load lesson detail + LessonFlow
    - `src/app/(app)/lessons/page.tsx` — rewritten: active module's lesson list, redirect to /modules if none

11. **Home Screen rewrite** (`src/app/(app)/page.tsx`)
    - Server component with `Promise.all` for parallel fetching
    - Quick Start Card — continue lesson or start next (link to `/lesson/[id]`)
    - New Topics Card — "Explore modules" (link to `/modules`)
    - Review Due Card — count + links to lessons due for review
    - Progress Card — per-level mastery % bars from gap map

12. **Sidebar navigation** — added "Modules" link with `GraduationCapIcon`

---

## Phase 3c: New Exercise Types ✅

All 6 exercise types working in the engine and lesson flow.

### Completed

1. **Client type safety** — `ExerciseClientMatchPairs` now exposes `leftItems[]`/`rightItems[]` (shuffled server-side) instead of leaking `pairs`. `ExerciseClientReadingComprehension` uses `ReadingClientQuestion` (correctAnswer/explanation stripped).

2. **Shared infrastructure expansion**
   - `generation.ts`: `shuffleUntilDifferent()` (Fisher-Yates + ensures different from original), `toClientItem()` handles all 6 types, `exerciseRecordToClientItem()` casts to full `ExerciseContent`, switch-based `generateAndValidateExercise()` with per-type generator functions
   - `validation.ts`: 4 new Zod schemas + validators (`reorderWordsSchema`, `matchPairsSchema`, `freeWritingSchema`, `readingComprehensionSchema`). MatchPairs validates no duplicate left/right items. RC validates per-question option counts.
   - `answer-check.ts`: Map-based `matchPairsAnswer()` (tolerates JSON key ordering), `matchReadingComprehensionAnswer()` (all-or-nothing, accent-tolerant per sub-answer). Updated `categorizeMistake()`: match_pairs → VOCABULARY, reading_comprehension → GRAMMAR.
   - `curriculum.ts`: exerciseTypes enum expanded to all 6 types in schema + `GeneratedLessonBlock` type. `buildLessonGenerationPrompt()` updated with type-selection guidance.
   - `exercise/actions.ts`: schemas accept all 6 types, answer max increased to 5000 (FreeWriting/RC JSON), content cast to `ExerciseContent`.

3. **ReorderWords** — `buildExerciseReorderWordsPrompt()` generates 4-8 word sentence. Words stored pre-shuffled via `shuffleUntilDifferent()`. UI: sentence area (placed chips) + word pool (available chips). Tap pool → append to sentence, tap sentence → return to pool. Answer checking via accent-tolerant `matchTextAnswer()`.

4. **MatchPairs** — `buildExerciseMatchPairsPrompt()` generates 4-5 pairs. Correct answer stored as sorted JSON. Client receives separate `leftItems`/`rightItems` (right shuffled). UI: two columns, tap left then right to create color-coded pairs (5-color palette). Tap matched pair to undo. Submit when all matched. Map-based answer comparison.

5. **FreeWriting** — `buildExerciseFreeWritingPrompt()` generates prompt + sampleAnswer. New `evaluation.ts` with `evaluateFreeWriting()` — uses `generateStructured()` with "evaluation" endpoint (Haiku). `buildFreeWritingEvaluationPrompt()` returns corrections[], overallFeedback, score, mistakeCategory. Submission flow branches in both `submitLessonExercise` and `submitExerciseAnswer` — AI evaluation instead of deterministic `checkAnswer()`. UI: textarea (min 10 chars) + structured feedback display.

6. **ReadingComprehension** — `buildExerciseReadingComprehensionPrompt()` generates 100-200 word passage + 2-3 questions (MC/gap_fill/true_false). Correct answer stored as JSON array. UI: scrollable passage card + numbered sub-questions with inline renderers (MCSubQuestion, TrueFalseSubQuestion, GapFillSubQuestion). "Submit All" when all answered. Per-question green/red indicators after feedback.

7. **ExerciseFactory updated** — all 4 stubs replaced with real components.

---

## Key Files

### Phase 3a (done)
- `src/shared/types/exercise.ts` — expanded type system
- `src/shared/data/latam-blocklist.ts` — LatAm vocabulary filter
- `src/shared/lib/ai/prompts/exercise.ts` — lesson-context AI prompts
- `src/modules/exercise/actions.ts` — exercise server actions (imports from shared)
- `src/modules/exercise/store.ts` — Zustand store
- `src/modules/exercise/hooks.ts` — useExercise hook
- `src/modules/exercise/components/exercise-container.tsx` — container (imports shared UI)
- `src/app/globals.css` — shake + pulse-once keyframe animations

### Phase 3b (done)

**Shared extraction:**
- `src/shared/lib/exercise/answer-check.ts` — answer checking + mistake categorization (moved from exercise module)
- `src/shared/lib/exercise/validation.ts` — Zod schemas + validation pipeline (moved)
- `src/shared/lib/exercise/generation.ts` — exercise generation + type converters + toClientItem (extracted)
- `src/shared/ui/exercises/gap-fill.tsx` — GapFill component (moved)
- `src/shared/ui/exercises/multiple-choice.tsx` — MC component (moved)
- `src/shared/ui/exercises/exercise-shell.tsx` — shell with progress bar (moved)
- `src/shared/ui/exercises/exercise-factory.tsx` — type-based routing (moved)

**Lesson module:**
- `src/shared/lib/ai/prompts/curriculum.ts` — module proposal + lesson generation prompts
- `src/modules/lesson/actions.ts` — 8 server actions
- `src/modules/lesson/queries.ts` — 6 server-only query helpers
- `src/modules/lesson/store.ts` — Zustand store with phase machine
- `src/modules/lesson/hooks.ts` — useLesson hook
- `src/modules/lesson/components/lesson-flow.tsx` — phase routing orchestrator
- `src/modules/lesson/components/block-explanation.tsx` — markdown explanation
- `src/modules/lesson/components/block-transition.tsx` — inter-block score screen
- `src/modules/lesson/components/lesson-complete.tsx` — completion with scores
- `src/modules/lesson/components/lesson-skeleton.tsx` — loading spinner
- `src/modules/lesson/components/module-selection.tsx` — module grid
- `src/modules/lesson/components/module-card.tsx` — module card
- `src/modules/lesson/components/module-lesson-list.tsx` — lesson list with status

**Routes & pages:**
- `src/app/(app)/modules/page.tsx` — module selection route
- `src/app/(app)/lesson/[lessonId]/page.tsx` — lesson flow route
- `src/app/(app)/lessons/page.tsx` — rewritten: active module lesson list
- `src/app/(app)/page.tsx` — rewritten: dashboard with 4 cards

**Modified:**
- `prisma/schema.prisma` — `UserProfile.activeModuleId`, `LessonBlock.title`
- `src/modules/assessment/actions.ts` — answer-check import path updated
- `src/shared/ui/app-sidebar.tsx` — added "Modules" nav item

### Phase 3c (done)

**New files:**
- `src/shared/ui/exercises/reorder-words.tsx` — tap-to-select word chips
- `src/shared/ui/exercises/match-pairs.tsx` — two-column tap pairing with color palette
- `src/shared/ui/exercises/free-writing.tsx` — textarea with structured AI feedback
- `src/shared/ui/exercises/reading-comprehension.tsx` — passage + nested sub-questions
- `src/shared/lib/exercise/evaluation.ts` — AI-based free-writing evaluation

**Modified:**
- `src/shared/types/exercise.ts` — client type safety fixes
- `src/shared/lib/exercise/generation.ts` — all 6 types, shuffle helper, expanded toClientItem
- `src/shared/lib/exercise/validation.ts` — 4 new schemas + validators
- `src/shared/lib/exercise/answer-check.ts` — Map-based match_pairs + all-or-nothing RC
- `src/shared/lib/ai/prompts/exercise.ts` — 4 generation prompts + evaluation prompt + schemas
- `src/shared/lib/ai/prompts/curriculum.ts` — exerciseTypes expansion
- `src/shared/ui/exercises/exercise-factory.tsx` — all stubs replaced
- `src/modules/exercise/actions.ts` — schemas, content cast, free_writing evaluation branch
- `src/modules/lesson/actions.ts` — free_writing AI evaluation in submitLessonExercise

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
