# Product Issues & Improvements Backlog

Collected during development and testing. Open items grouped by phase and feature scope.

---

## Completed (Phases 2–3)

<details>
<summary>Phase 2 — Assessment Engine (10 items, all resolved)</summary>

- [x] **Assessment: button label "Check" → "Continue"/"Next"** — in assessment mode (no feedback), the submit button should say "Continue" or "Next", not "Check". "Check" implies answer validation which doesn't happen in test mode. Fixed: added `submitLabel` prop to GapFill, assessment passes "Continue".
- [x] **Missing "Living in Spain" goal option** — added `relocation` goal: "Living in Spain — I'm moving to or already live in Spain".
- [x] **Gap-fill: double blank (underscores + input)** — AI sometimes includes underscores in `before`/`after` fields, causing two visible blanks. Fixed: improved prompt with examples + added `sanitizeGapFill()` that re-splits around underscores.
- [x] **Remove feedback from assessment** — assessment is a test, not a lesson. Showing correct/incorrect after each question slows users down, causes test anxiety, and conflates testing with learning. Fixed: answer → immediately advance to next question. Feedback will be used in lesson exercises (Phase 3).
- [x] **Assessment: question flickers on first load** — React Strict Mode double-mounts the component, firing `startAssessment()` twice (both see `assessmentId=null`). Fixed: `useRef` guard prevents double invocation.
- [x] **Gap-fill: ambiguous blank without hint** — sentence could accept many words. Solution: AI generates `hint` (Spanish base form) + `translation` (English sentence). Two-level hint system: hint → which word, translation → meaning, student → correct form.
- [x] **Gap-fill: hint equals answer for non-morphology topics** — when base form IS the answer (pronouns, nouns), hint gives it away. Quick fix: `hintMatchesAnswer()` suppresses hint when hint=correctAnswer. Full solution in Phase 6.
- [x] **Multiple-choice: distractors can be grammatically valid** — AI generated options that are all correct with different meanings (e.g., "al/del"). Fixed: distractors must be GRAMMATICALLY incorrect, not just semantically different.
- [x] **Multiple-choice: answer leaks into prompt** — part of the correct answer stays visible in sentence stem. Fixed: stronger prompt with SELF-CHECK + server-side `sanitizeMultipleChoice()` detects and removes leaked words.
- [x] **Multiple-choice: missing prepositions/articles around blank** — AI drops required words (e.g., "Cuando ___ la oficina" missing "a"). Fixed: verification rule + explicit example.
- [x] **Multiple-choice: duplicate options** — AI generated identical options, causing React `key` error. Fixed: prompt + server-side de-duplication + `key={index}`.

</details>

<details>
<summary>Phase 3b — Lesson Flow (10 items, all resolved)</summary>

- [x] **`LessonComplete` gets `lesson.id` as `moduleId` prop** — renamed prop to `showBackButton: boolean`. Merged `blockScores` + `blockTitles` into single `BlockScoreEntry[]` prop.
- [x] **`generateLesson` silently drops failed exercises** — added `console.error` logging for rejected promises + `throw` if all exercises fail (zero-exercise guard).
- [x] **Unsafe `metadata` cast in `generateModuleProposals`** — replaced `as unknown as { result }` with `Record<string, unknown>` + null guards for `result.gapMap` and `result.estimatedLevel`.
- [x] **`queries.ts` missing `import "server-only"`** — added `import "server-only"` at top.
- [x] **No user-visible error on module/lesson generation failure** — added `toast.error()` (sonner) in `module-selection.tsx` (handleSelect, handleRegenerate) and `module-lesson-list.tsx` (handleGenerateNext).
- [x] **`lessonCount: 0` for existing modules** — replaced hardcoded `0` with `include: { _count: { select: { lessons: true } } }` to return actual lesson count.
- [x] **`useLesson` hook — `useCallback` with `[store]` doesn't memoize** — refactored all callbacks to use `useLessonStore.getState()` inside, empty `[]` deps for stable references.
- [x] **Exercise ordering is global, not per-block** — added `orderByBlock` Map to assign per-block sequential order.
- [x] **Race condition in `completeLesson`** — replaced `$transaction([update, updateMany])` with conditional `updateMany` (`status: { not: "COMPLETED" }`), only increments `lessonsCompleted` if status actually changed.
- [x] **Race condition in `generateModuleProposals`** — re-check inside transaction: if modules appeared between initial check and persist, return existing ones instead of creating duplicates.

</details>

<details>
<summary>Phase 3c — New Exercise Types (8 items, all resolved)</summary>

- [x] **MatchPairs shuffle instability** — `toClientItem()` called `shuffleUntilDifferent()` on every read, producing different rightItems order on each page load. Fixed: store shuffled order at generation time in `shuffledRightItems`, use it in `toClientItem()` with `?? fallback` for old DB records.
- [x] **FreeWriting evaluation no error handling** — `evaluateFreeWriting()` AI call could crash → 500 in submit actions. Fixed: try/catch with `EVALUATION_FALLBACK` constant.
- [x] **RC per-question accent mismatch** — client `normalize()` lacked NFD+diacritics strip while server `matchTextAnswer()` used accent-tolerant matching → UI checkmarks could disagree with server result. Fixed: added `.normalize("NFD").replace(/[\u0300-\u036f]/g, "")` to client.
- [x] **FreeWriting submission duplication** — ~50 lines copied between `exercise/actions.ts` and `lesson/actions.ts`. Fixed: extracted `formatFreeWritingFeedback()` to shared `evaluation.ts`.
- [x] **MatchPairs raw JSON feedback** — `feedback.correctAnswer` showed raw JSON `[{"left":"...","right":"..."}]` to user. Fixed: parse and format as readable `left → right` pairs.
- [x] **Dead exercise factory file** — `src/modules/exercise/components/exercise-factory.tsx` had stubs, never imported. Deleted.
- [x] **FreeWriting fragile feedback parsing** — `free-writing.tsx` split explanation on `\n` with heuristics (starts with `"` → correction, `"Sample answer:"` → special). Fixed: detect corrections by `→` character, display sample answer from `feedback.correctAnswer` instead of parsing from explanation string.
- [x] **RC categorizeMistake always GRAMMAR** — `answer-check.ts` always returned `GRAMMAR` for reading_comprehension. Fixed: parse sub-answer arrays, analyze first wrong sub-answer with word-level heuristics (WORD_ORDER / GRAMMAR / VOCABULARY).

</details>

---

## Phase 6 — Polish & Deploy

### Chat Enhancements

- [ ] **Inline quick-quiz** — Celestia inserts MC/gap-fill exercises directly into chat messages. User answers via buttons/input, Celestia reacts with feedback and continues the conversation. Requires: structured message types (text vs exercise), exercise rendering inside message bubbles, answer submission without leaving chat.
- [ ] **Tap-to-translate** — words in Celestia's messages are tappable/clickable, showing translation and grammar info (part of speech, conjugation form) in a tooltip/popover. Helps vocabulary acquisition passively during conversation.
- [ ] **Vocabulary flashcards in chat** — Celestia shows a flashcard with an English word/phrase, user types the Spanish translation. Celestia checks the answer, provides feedback, and moves to the next card. Integrates with existing SRS vocabulary — prioritizes words due for review.
- [ ] **Auto-focus input after assistant reply** — when Celestia finishes responding, focus should automatically move to the chat input field so the user can immediately start typing without clicking.

### Assessment Improvements

- [ ] **"Back" button to change answer** — allow the user to go back to the previous question and re-answer it. Requires storing answer history and reverting Bayesian state.
- [x] **Submit error toast** — added `toast.error()` via Sonner when `submitAssessmentAnswer` fails. (KAN-12, phase-6a)
- [x] **Gap-fill hint = answer fix** — two-layer fix: AI prompts request semantic hints for invariable words + code fallback uses `topic.title` when `hintMatchesAnswer()`. (KAN-13, phase-6a)

### Progress & Gamification

- [ ] **Streak timezone awareness** — `calculateStreak()` uses `setHours(0,0,0,0)` (server-local time). If the server runs in UTC and the user is in UTC+3, "today" differs. Store user timezone in `UserProfile` or normalize to UTC consistently.

### Infrastructure & Testing

- [ ] **Per-session token tracking** — add `assessmentId` (or generic `sessionId`) to `AiUsage` model so token costs can be queried per assessment session, not just globally per user/endpoint.
- [ ] **E2E tests for assessment flow** — `tests/e2e/` has vocabulary tests, but no assessment flow coverage. Add Playwright tests covering: onboarding → assessment → results flow, error recovery, and auth guard.
- [ ] **E2E test coverage map** — create `docs/dev/test-coverage.md` with a table of all pages/flows and their E2E coverage status (covered / not covered / partial). Update when adding tests.

---

## Post-MVP — Claude API Optimization

Current bottleneck: every exercise is generated via a separate Claude API call in real time. Assessment questions (1 call per question × ~10 questions) and lesson exercises (1 structure + 2-4 exercises = 3-5 calls per lesson) all block the user.

### Pre-generated Question Pool (Assessment)

- [ ] **New `QuestionPool` model** — store pre-generated assessment questions in DB:
  ```
  QuestionPool { id, topicId, level, type (GAP_FILL/MC), question, content (JSON), correctAnswer, explanation, usageCount, createdAt }
  ```
- [ ] **Seed script** — `prisma/seed-questions.ts` that iterates over all grammar topics × levels × types (gap_fill, multiple_choice) and generates 3-5 variants per combination via batch Claude API calls. Run once offline (not on user request). Target: ~500-1000 questions covering A1-B2.
- [ ] **Pool-based assessment flow** — `generateNextQuestion()` pulls from `QuestionPool` instead of calling Claude. Bayesian topic selection stays dynamic; only question content comes from pre-generated pool. Fallback: if pool is empty for a topic, generate in real-time (current behavior).
- [ ] **Benefits:** zero loading time between questions, no AI cost per assessment, consistent quality (questions are validated at seed time), works offline.

### Batch Exercise Generation (Lessons)

- [ ] **Batch prompt for lesson exercises** — instead of N separate `generateStructured()` calls (one per exercise), request all exercises for a block in a single Claude call. Prompt returns an array of exercises. Reduces lesson generation from 3-5 API calls to 1-2 (structure + all exercises in one batch).
  - New schema: `LESSON_EXERCISES_BATCH_SCHEMA` — array of exercises with `type` discriminator.
  - New prompt: `buildBatchExercisePrompt(types[], topic, count)` — instructs Claude to generate multiple exercises at once.
  - Validation: run per-exercise validators on each item in the batch; retry only failed items individually.
- [ ] **Pre-generated exercise pool (lessons)** — similar to assessment: store exercises per topic/level/type. Lesson generation pulls from pool, only generating custom content for the lesson structure (explanation blocks). Exercises are instant.
  - Less urgent than assessment pool: lesson exercises need variety (users repeat lessons), so pool must be larger or combined with on-demand generation.

### Prefetch Strategy

- [ ] **Assessment prefetch** — while the user answers question N, pre-generate/pre-fetch question N+1 in the background. Even without a pool, this hides latency for the user.
  - Implementation: after `submitAssessmentAnswer`, Bayesian update determines next topic → immediately start generating next question → store in session state.
- [ ] **Lesson exercise prefetch** — during the explanation phase, pre-generate exercises for the current block in the background (currently they're already generated at lesson creation time, so this is less critical).

### Priority Order

1. **Assessment prefetch** — lowest effort, biggest UX win (hides loading between questions)
2. **Batch exercise generation** — moderate effort, reduces API calls by 2-3× per lesson
3. **Assessment question pool** — higher effort (seed script, new model), but eliminates AI cost entirely for assessments
4. **Lesson exercise pool** — highest effort (large pool needed), defer until user base grows
