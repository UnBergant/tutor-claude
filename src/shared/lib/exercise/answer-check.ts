import type { MistakeCategory } from "@/generated/prisma";
import type { ExerciseType } from "@/shared/types/exercise";

// ──────────────────────────────────────────────
// Text normalization helpers
// ──────────────────────────────────────────────

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const stripTrailingPunctuation = (s: string) => s.replace(/[.!?¿¡,;:]+$/g, "");
const stripAccents = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/**
 * Levenshtein edit distance between two strings.
 * Used for typo tolerance — accepts answers within 1-2 edits.
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

/** Max allowed Levenshtein distance based on answer length */
function maxTypoDistance(correctLength: number): number {
  if (correctLength <= 4) return 0; // Too short for typo tolerance
  if (correctLength <= 10) return 1;
  return 2;
}

// ──────────────────────────────────────────────
// Answer checking
// ──────────────────────────────────────────────

/**
 * Check student answer against correct answer.
 * Lenient matching for text-input types: ignores trailing punctuation,
 * tolerates accent differences and small typos (1-2 edits).
 * Returns true if the answer is correct (or close enough).
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
 * Text-based answer matching with 3 tiers:
 * 1. Exact match (after normalization + punctuation strip)
 * 2. Accent-tolerant match
 * 3. Typo-tolerant match (Levenshtein distance ≤ threshold)
 */
function matchTextAnswer(userAnswer: string, correctAnswer: string): boolean {
  const userNorm = stripTrailingPunctuation(normalize(userAnswer));
  const correctNorm = stripTrailingPunctuation(normalize(correctAnswer));

  // Tier 1: exact match
  if (userNorm === correctNorm) return true;

  // Tier 2: accent-tolerant
  const userNoAccents = stripAccents(userNorm);
  const correctNoAccents = stripAccents(correctNorm);
  if (userNoAccents === correctNoAccents) return true;

  // Tier 3: typo-tolerant (on accent-stripped strings)
  const maxDist = maxTypoDistance(correctNoAccents.length);
  if (
    maxDist > 0 &&
    levenshteinDistance(userNoAccents, correctNoAccents) <= maxDist
  ) {
    return true;
  }

  return false;
}

// ──────────────────────────────────────────────
// Answer warnings (for accepted-but-imperfect answers)
// ──────────────────────────────────────────────

export type AnswerWarning = "accent" | "typo" | null;

/**
 * Determine what kind of warning to show for an accepted answer.
 * Returns null if the answer is exact. Only call when checkAnswer() returned true.
 */
export function getAnswerWarning(
  userAnswer: string,
  correctAnswer: string,
  exerciseType: ExerciseType,
): AnswerWarning {
  // Only relevant for text-input types
  if (
    exerciseType === "multiple_choice" ||
    exerciseType === "match_pairs" ||
    exerciseType === "free_writing" ||
    exerciseType === "reading_comprehension"
  ) {
    return null;
  }

  const userNorm = stripTrailingPunctuation(normalize(userAnswer));
  const correctNorm = stripTrailingPunctuation(normalize(correctAnswer));

  // Exact match (possibly differing only in punctuation) — no warning
  if (userNorm === correctNorm) return null;

  // Accent mismatch
  const userNoAccents = stripAccents(userNorm);
  const correctNoAccents = stripAccents(correctNorm);
  if (userNoAccents === correctNoAccents) return "accent";

  // Typo (Levenshtein accepted)
  return "typo";
}

/**
 * Build a human-readable warning message for imperfect answers.
 */
export function formatAnswerWarning(
  warning: AnswerWarning,
  correctAnswer: string,
): string | null {
  if (!warning) return null;

  const clean = stripTrailingPunctuation(correctAnswer);
  switch (warning) {
    case "accent":
      return `Watch your accents! Correct spelling: ${clean}`;
    case "typo":
      return `Close! Watch your spelling: ${clean}`;
  }
}

/**
 * @deprecated Use getAnswerWarning() instead. Kept for backwards compatibility.
 */
export function hasAccentMismatch(
  userAnswer: string,
  correctAnswer: string,
): boolean {
  const userNorm = normalize(userAnswer);
  const correctNorm = normalize(correctAnswer);

  return (
    userNorm !== correctNorm &&
    stripAccents(userNorm) === stripAccents(correctNorm)
  );
}

// ──────────────────────────────────────────────
// Structured answer matching
// ──────────────────────────────────────────────

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
