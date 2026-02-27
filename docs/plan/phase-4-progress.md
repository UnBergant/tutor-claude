# Phase 4: Progress, SRS & Gamification

## Goal
Progress dashboard, mistake journal, visual polish, spaced review, personal vocabulary, gamification.

## Scope Change
Swapped with former Phase 4 (Chat). Progress features don't depend on chat — all data already exists from Phase 3 (exercises, lessons, mistakes). Vocabulary auto-collection from chat deferred to Phase 5.

## Steps (ordered by priority)

### 4a: Progress Dashboard & Mistake Journal — ✅ Done
1. **Progress Dashboard** (`/progress`) — lessons completed, accuracy %, per-module progress, level breakdown. Parallel data fetching, `computeLevelProgress` extracted to shared util.
2. **Mistake Journal** (`/progress` Mistakes tab) — collapsible category groups (GRAMMAR/VOCABULARY/WORD_ORDER), patterns with counts, topic titles, relative dates, "Practice" links to related lessons.

### 4b: Favicon, Design Tokens & Animations ← CURRENT
1. **Favicon** — SVG favicon with Celestia branding (star motif, primary gradient)
2. **Design Tokens** — finalize Tailwind theme: refine colors, typography scale, spacing, radius, shadows based on real usage from Phases 1–4a
3. **Animations & Transitions** — consistent motion design, loading states, micro-interactions across all features

### 4c: Vocabulary & Gamification
1. **Personal Vocabulary** — new `VocabularyEntry` model, auto-collect from lessons, flashcard review (mobile-friendly flip cards), topic grouping
2. **Spaced Repetition** — interval algorithm already implemented (1d → 3d → 7d → 30d on `LessonProgress`), UI for review queue
3. **Gamification** — streak counter (needs `lastActiveAt` on profile), phrase of the day

## Verification
- `/progress` shows real data from completed lessons and exercises
- Mistake journal shows categorized patterns with counts and Practice links
- Favicon visible in browser tab
- Consistent visual language: tokens, motion, spacing across all pages
- Spaced repetition intervals display correctly
- Words auto-added to dictionary, flashcards work on mobile
- Streak counted, progress displayed
