# Phase 4: Progress, SRS & Gamification

## Goal
Progress dashboard, mistake journal, spaced review, personal vocabulary, gamification.

## Scope Change
Swapped with former Phase 4 (Chat). Progress features don't depend on chat — all data already exists from Phase 3 (exercises, lessons, mistakes). Vocabulary auto-collection from chat deferred to Phase 5.

## Steps (ordered by priority)

### 4a: Progress Dashboard & Mistake Journal ← CURRENT
1. **Progress Dashboard** (`/progress`) — lessons completed, accuracy %, per-module progress, level indicator. Data sources: `UserProfile`, `LessonProgress`, `ExerciseAttempt`.
2. **Mistake Journal** (`/progress` section or tab) — grouped by category (GRAMMAR/VOCABULARY/WORD_ORDER), patterns, topic links, count. Data source: `MistakeEntry`.

### 4b: Vocabulary & Gamification
3. **Personal Vocabulary** — new `VocabularyEntry` model, auto-collect from lessons, flashcard review (mobile-friendly flip cards), topic grouping
4. **Spaced Repetition** — interval algorithm already implemented (1d → 3d → 7d → 30d on `LessonProgress`), UI for review queue
5. **Gamification** — streak counter (needs `lastActiveAt` on profile), phrase of the day

## Verification
- `/progress` shows real data from completed lessons and exercises
- Mistake journal shows categorized patterns with counts
- Spaced repetition intervals display correctly
- Words auto-added to dictionary, flashcards work on mobile
- Streak counted, progress displayed
