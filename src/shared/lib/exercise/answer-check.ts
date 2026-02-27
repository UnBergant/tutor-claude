import type { MistakeCategory } from "@/generated/prisma";
import type { ExerciseType } from "@/shared/types/exercise";

// ──────────────────────────────────────────────
// Answer checking
// ──────────────────────────────────────────────

/**
 * Check student answer against correct answer.
 * Case-insensitive, accent-tolerant for text-input types.
 * Returns true if the answer is correct.
 */
export function checkAnswer(
  userAnswer: string,
  correctAnswer: string,
  exerciseType: ExerciseType,
): boolean {
  switch (exerciseType) {
    case "multiple_choice":
      return userAnswer.trim() === correctAnswer.trim();

    case "gap_fill":
      return matchTextAnswer(userAnswer, correctAnswer);

    case "reorder_words":
      return matchTextAnswer(userAnswer, correctAnswer);

    case "match_pairs":
      return matchPairsAnswer(userAnswer, correctAnswer);

    case "free_writing":
      // Free writing uses AI evaluation, not string matching
      return false;

    case "reading_comprehension":
      return matchReadingComprehensionAnswer(userAnswer, correctAnswer);

    default:
      return false;
  }
}

/**
 * Match-pairs answer comparison: parse JSON arrays, build Map(left→right), compare.
 * More robust than exact JSON string match — tolerates key ordering differences.
 */
function matchPairsAnswer(userAnswer: string, correctAnswer: string): boolean {
  try {
    const userPairs = JSON.parse(userAnswer) as {
      left: string;
      right: string;
    }[];
    const correctPairs = JSON.parse(correctAnswer) as {
      left: string;
      right: string;
    }[];

    if (userPairs.length !== correctPairs.length) return false;

    const correctMap = new Map(correctPairs.map((p) => [p.left, p.right]));
    return userPairs.every((p) => correctMap.get(p.left) === p.right);
  } catch {
    return userAnswer.trim() === correctAnswer.trim();
  }
}

/**
 * Reading comprehension answer: all sub-answers must be correct (all-or-nothing).
 * Each sub-answer is compared with accent-tolerant text matching.
 */
function matchReadingComprehensionAnswer(
  userAnswer: string,
  correctAnswer: string,
): boolean {
  try {
    const userAnswers = JSON.parse(userAnswer) as string[];
    const correctAnswers = JSON.parse(correctAnswer) as string[];

    if (userAnswers.length !== correctAnswers.length) return false;

    return userAnswers.every((ua, i) => matchTextAnswer(ua, correctAnswers[i]));
  } catch {
    return userAnswer.trim() === correctAnswer.trim();
  }
}

/**
 * Text-based answer matching: case-insensitive, whitespace-normalized,
 * with accent-tolerant fallback.
 */
function matchTextAnswer(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

  const userNorm = normalize(userAnswer);
  const correctNorm = normalize(correctAnswer);

  if (userNorm === correctNorm) return true;

  // Accent-tolerant fallback: strip diacritics and compare
  // Note: counted as correct, but hasAccentMismatch() flags it for feedback
  const stripAccents = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return stripAccents(userNorm) === stripAccents(correctNorm);
}

/**
 * Check if the answer matches but has incorrect accents.
 * Used to show a "watch your accents" warning even when the answer is accepted.
 */
export function hasAccentMismatch(
  userAnswer: string,
  correctAnswer: string,
): boolean {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const stripAccents = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const userNorm = normalize(userAnswer);
  const correctNorm = normalize(correctAnswer);

  // Only a mismatch if they differ with accents but match without
  return (
    userNorm !== correctNorm &&
    stripAccents(userNorm) === stripAccents(correctNorm)
  );
}

// ──────────────────────────────────────────────
// Mistake categorization
// ──────────────────────────────────────────────

/** Analyze an incorrect answer and categorize the mistake type */
export function categorizeMistake(
  userAnswer: string,
  correctAnswer: string,
  exerciseType: ExerciseType,
): MistakeCategory {
  if (exerciseType === "free_writing") {
    // Free writing categorization is done by AI evaluation
    return "GRAMMAR";
  }

  if (exerciseType === "reorder_words") {
    return "WORD_ORDER";
  }

  if (exerciseType === "match_pairs") {
    return "VOCABULARY";
  }

  if (exerciseType === "reading_comprehension") {
    return categorizeReadingComprehensionMistake(userAnswer, correctAnswer);
  }

  const userWords = userAnswer.trim().toLowerCase().split(/\s+/);
  const correctWords = correctAnswer.trim().toLowerCase().split(/\s+/);

  // Same words but different order → word order mistake
  if (hasSameWords(userWords, correctWords)) {
    return "WORD_ORDER";
  }

  // If words share a common root, likely a grammar mistake (wrong conjugation/form)
  if (shareCommonRoot(userWords, correctWords)) {
    return "GRAMMAR";
  }

  // Default: vocabulary mistake (wrong word entirely)
  return "VOCABULARY";
}

/**
 * Analyze the first wrong sub-answer in a reading comprehension exercise.
 * Falls back to GRAMMAR if parsing fails.
 */
function categorizeReadingComprehensionMistake(
  userAnswer: string,
  correctAnswer: string,
): MistakeCategory {
  try {
    const userAnswers = JSON.parse(userAnswer) as string[];
    const correctAnswers = JSON.parse(correctAnswer) as string[];

    for (let i = 0; i < correctAnswers.length; i++) {
      const ua = (userAnswers[i] ?? "").trim().toLowerCase();
      const ca = correctAnswers[i].trim().toLowerCase();
      if (ua === ca) continue;

      // Analyze the first wrong sub-answer with word-level heuristics
      const userWords = ua.split(/\s+/);
      const correctWords = ca.split(/\s+/);

      if (hasSameWords(userWords, correctWords)) return "WORD_ORDER";
      if (shareCommonRoot(userWords, correctWords)) return "GRAMMAR";
      return "VOCABULARY";
    }
  } catch {
    // Parsing failed — fall through
  }
  return "GRAMMAR";
}

/** Check if two word arrays contain the same words (ignoring order) */
function hasSameWords(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sorted = (arr: string[]) => [...arr].sort().join(" ");
  return sorted(a) === sorted(b);
}

/** Check if any words share a common root (first 3+ characters match) */
function shareCommonRoot(userWords: string[], correctWords: string[]): boolean {
  const MIN_ROOT_LENGTH = 3;

  for (const uw of userWords) {
    if (uw.length < MIN_ROOT_LENGTH) continue;
    for (const cw of correctWords) {
      if (cw.length < MIN_ROOT_LENGTH) continue;
      // Check if words share a prefix of at least MIN_ROOT_LENGTH chars
      const minLen = Math.min(uw.length, cw.length, MIN_ROOT_LENGTH + 2);
      const prefix = uw.slice(0, minLen);
      if (cw.startsWith(prefix) && uw !== cw) {
        return true;
      }
    }
  }
  return false;
}

// ──────────────────────────────────────────────
// Mistake pattern description
// ──────────────────────────────────────────────

/** Generate a short pattern description for MistakeEntry tracking */
export function describeMistakePattern(
  userAnswer: string,
  correctAnswer: string,
  topicId: string,
  exerciseType: ExerciseType,
): string {
  const category = categorizeMistake(userAnswer, correctAnswer, exerciseType);

  switch (category) {
    case "GRAMMAR":
      return `${topicId}: "${userAnswer}" → "${correctAnswer}"`;
    case "VOCABULARY":
      return `vocab: "${userAnswer}" instead of "${correctAnswer}"`;
    case "WORD_ORDER":
      return `order: "${userAnswer}" → "${correctAnswer}"`;
    default:
      return `${exerciseType}: "${userAnswer}" → "${correctAnswer}"`;
  }
}
