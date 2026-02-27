import type { MistakeCategory } from "@/generated/prisma";

// ──────────────────────────────────────────────
// Exercise type identifiers
// ──────────────────────────────────────────────

/** All supported exercise types (matches Prisma ExerciseType enum, lowercase) */
export type ExerciseType =
  | "gap_fill"
  | "multiple_choice"
  | "match_pairs"
  | "reorder_words"
  | "free_writing"
  | "reading_comprehension";

// ──────────────────────────────────────────────
// Exercise content — discriminated union
// ──────────────────────────────────────────────

/** Data for a gap-fill exercise (sentence with blank) */
export interface GapFillContent {
  type: "gap_fill";
  /** Text before the blank */
  before: string;
  /** Text after the blank */
  after: string;
  /** Correct answer for the blank */
  correctAnswer: string;
  /** Spanish base form shown inline (infinitive, singular, etc.) */
  hint?: string;
  /** English translation of the full sentence */
  translation?: string;
  /** Grammar explanation in English */
  explanation: string;
}

/** Data for a multiple-choice exercise */
export interface MultipleChoiceContent {
  type: "multiple_choice";
  /** The question or sentence stem */
  prompt: string;
  /** Four options */
  options: [string, string, string, string];
  /** Index of the correct option (0-3) */
  correctIndex: number;
  /** The correct option text */
  correctAnswer: string;
  /** Grammar explanation in English */
  explanation: string;
}

/** Data for a match-pairs exercise (Phase 3c stub) */
export interface MatchPairsContent {
  type: "match_pairs";
  pairs: { left: string; right: string }[];
  explanation: string;
}

/** Data for a reorder-words exercise (Phase 3c stub) */
export interface ReorderWordsContent {
  type: "reorder_words";
  correctSentence: string;
  words: string[];
  translation?: string;
  explanation: string;
}

/** Data for a free-writing exercise (Phase 3c stub) */
export interface FreeWritingContent {
  type: "free_writing";
  prompt: string;
  sampleAnswer?: string;
  explanation: string;
}

/** Data for a reading-comprehension exercise (Phase 3c stub) */
export interface ReadingComprehensionContent {
  type: "reading_comprehension";
  passage: string;
  questions: ReadingQuestion[];
  explanation: string;
}

export interface ReadingQuestion {
  type: "multiple_choice" | "gap_fill" | "true_false";
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

/** Discriminated union of all exercise content shapes */
export type ExerciseContent =
  | GapFillContent
  | MultipleChoiceContent
  | MatchPairsContent
  | ReorderWordsContent
  | FreeWritingContent
  | ReadingComprehensionContent;

// ──────────────────────────────────────────────
// Legacy interfaces (used by assessment)
// ──────────────────────────────────────────────

/** @deprecated Use GapFillContent instead — kept for assessment compatibility */
export interface GapFillData {
  before: string;
  after: string;
  correctAnswer: string;
}

/** @deprecated Use MultipleChoiceContent instead — kept for assessment compatibility */
export interface MultipleChoiceData {
  prompt: string;
  options: string[];
  correctIndex: number;
}

// ──────────────────────────────────────────────
// Feedback
// ──────────────────────────────────────────────

/** Feedback shown after answering an exercise */
export interface ExerciseFeedback {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  /** Topic to retry if the student struggles (optional, set by mistake categorization) */
  retryTopicId?: string;
  /** Categorized mistake type */
  mistakeCategory?: MistakeCategory;
}

// ──────────────────────────────────────────────
// Server action result
// ──────────────────────────────────────────────

/** Result returned by submitExerciseAnswer server action */
export interface ExerciseAttemptResult {
  /** Was the answer correct? */
  isCorrect: boolean;
  /** The correct answer text */
  correctAnswer: string;
  /** Grammar explanation */
  explanation: string;
  /** Categorized mistake (null if correct) */
  mistakeCategory: MistakeCategory | null;
  /** Topic to suggest for review */
  retryTopicId?: string;
}

// ──────────────────────────────────────────────
// Client-safe exercise (no correct answer)
// ──────────────────────────────────────────────

/** Exercise data sent to the client (correctAnswer stripped) */
export interface ExerciseClientItem {
  exerciseId: string;
  type: ExerciseType;
  /** GapFill fields */
  before?: string;
  after?: string;
  hint?: string;
  translation?: string;
  /** MultipleChoice fields */
  prompt?: string;
  options?: string[];
  /** MatchPairs fields */
  pairs?: { left: string; right: string }[];
  /** ReorderWords fields */
  words?: string[];
  /** FreeWriting fields */
  writingPrompt?: string;
  /** ReadingComprehension fields */
  passage?: string;
  questions?: ReadingQuestion[];
}
