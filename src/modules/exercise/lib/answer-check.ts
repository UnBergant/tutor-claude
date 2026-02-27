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
      // Match pairs uses JSON-encoded answer for comparison
      return userAnswer.trim() === correctAnswer.trim();

    case "free_writing":
      // Free writing uses AI evaluation, not string matching
      return false;

    case "reading_comprehension":
      return userAnswer.trim() === correctAnswer.trim();

    default:
      return false;
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
  const stripAccents = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return stripAccents(userNorm) === stripAccents(correctNorm);
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
    // Reorder exercises are always word order mistakes
    return "WORD_ORDER";
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
