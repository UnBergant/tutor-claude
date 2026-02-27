# Product Issues & Improvements Backlog

Collected during development and testing. Grouped by phase, open items first.

## Phase 2 — Assessment Engine

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

## Phase 3b — Lesson Flow (code review findings)

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

## Phase 3c — New Exercise Types (code review findings)

- [x] **MatchPairs shuffle instability** — `toClientItem()` called `shuffleUntilDifferent()` on every read, producing different rightItems order on each page load. Fixed: store shuffled order at generation time in `shuffledRightItems`, use it in `toClientItem()` with `?? fallback` for old DB records.
- [x] **FreeWriting evaluation no error handling** — `evaluateFreeWriting()` AI call could crash → 500 in submit actions. Fixed: try/catch with `EVALUATION_FALLBACK` constant.
- [x] **RC per-question accent mismatch** — client `normalize()` lacked NFD+diacritics strip while server `matchTextAnswer()` used accent-tolerant matching → UI checkmarks could disagree with server result. Fixed: added `.normalize("NFD").replace(/[\u0300-\u036f]/g, "")` to client.
- [x] **FreeWriting submission duplication** — ~50 lines copied between `exercise/actions.ts` and `lesson/actions.ts`. Fixed: extracted `formatFreeWritingFeedback()` to shared `evaluation.ts`.
- [x] **MatchPairs raw JSON feedback** — `feedback.correctAnswer` showed raw JSON `[{"left":"...","right":"..."}]` to user. Fixed: parse and format as readable `left → right` pairs.
- [x] **Dead exercise factory file** — `src/modules/exercise/components/exercise-factory.tsx` had stubs, never imported. Deleted.
- [x] **FreeWriting fragile feedback parsing** — `free-writing.tsx` split explanation on `\n` with heuristics (starts with `"` → correction, `"Sample answer:"` → special). Fixed: detect corrections by `→` character, display sample answer from `feedback.correctAnswer` instead of parsing from explanation string.
- [x] **RC categorizeMistake always GRAMMAR** — `answer-check.ts` always returned `GRAMMAR` for reading_comprehension. Fixed: parse sub-answer arrays, analyze first wrong sub-answer with word-level heuristics (WORD_ORDER / GRAMMAR / VOCABULARY).

## Phase 6 — Polish & Deploy

- [ ] **Assessment: "Back" button to change answer** — allow the user to go back to the previous question and re-answer it. Requires storing answer history and reverting Bayesian state.
- [ ] **Assessment: slow question loading between items** — each question requires an AI call, causing noticeable wait time. Options: (a) prefetch next question while user answers current one, (b) pre-generate a question pool per topic in DB.
- [ ] **Assessment: pre-generated question pool** — pre-generate and store assessment questions in DB for all grammar topics (gap-fill + MC, multiple variants per topic). Assessment flow pulls from the pool instead of calling AI in real-time. Adaptive algorithm still selects topics/difficulty dynamically, but questions are instant. Benefits: zero loading, consistent quality, no AI cost per assessment.
- [ ] **Assessment: submit error toast** — when `submitAssessmentAnswer` fails, show a user-facing toast/error instead of only `console.error`. Currently the user sees no feedback if an answer fails to submit.
- [ ] **Per-session token tracking** — add `assessmentId` (or generic `sessionId`) to `AiUsage` model so token costs can be queried per assessment session, not just globally per user/endpoint.
- [ ] **E2E tests for assessment flow** — `tests/e2e/` is empty. Add Playwright tests covering: onboarding → assessment → results flow, error recovery, and auth guard.
