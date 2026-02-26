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

## Phase 6 — Polish & Deploy

- [ ] **Assessment: "Back" button to change answer** — allow the user to go back to the previous question and re-answer it. Requires storing answer history and reverting Bayesian state.
- [ ] **Assessment: slow question loading between items** — each question requires an AI call, causing noticeable wait time. Options: (a) prefetch next question while user answers current one, (b) pre-generate a question pool per topic in DB.
- [ ] **Assessment: pre-generated question pool** — pre-generate and store assessment questions in DB for all grammar topics (gap-fill + MC, multiple variants per topic). Assessment flow pulls from the pool instead of calling AI in real-time. Adaptive algorithm still selects topics/difficulty dynamically, but questions are instant. Benefits: zero loading, consistent quality, no AI cost per assessment.
