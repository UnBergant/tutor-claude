import type {
  ExerciseContent,
  ExerciseType,
  GapFillContent,
  MatchPairsContent,
  MultipleChoiceContent,
  ReorderWordsContent,
} from "@/shared/types/exercise";

/**
 * A word extracted from an exercise for vocabulary tracking.
 */
export interface ExtractedWord {
  word: string;
  translation: string;
  context?: string;
}

/**
 * Extract vocabulary words from exercise content.
 * Deterministic — no AI calls. Each exercise type has a specific extraction strategy.
 *
 * Returns empty array for types that don't yield clear vocabulary items
 * (free_writing, reading_comprehension).
 */
export function extractVocabularyFromExercise(
  type: ExerciseType,
  content: ExerciseContent,
  correctAnswer: string,
): ExtractedWord[] {
  switch (type) {
    case "gap_fill":
      return extractFromGapFill(content as GapFillContent, correctAnswer);

    case "multiple_choice":
      return extractFromMultipleChoice(
        content as MultipleChoiceContent,
        correctAnswer,
      );

    case "match_pairs":
      return extractFromMatchPairs(content as MatchPairsContent);

    case "reorder_words":
      return extractFromReorderWords(
        content as ReorderWordsContent,
        correctAnswer,
      );

    case "free_writing":
    case "reading_comprehension":
      return [];

    default:
      return [];
  }
}

function extractFromGapFill(
  content: GapFillContent,
  correctAnswer: string,
): ExtractedWord[] {
  const word = correctAnswer.trim();
  if (!word) return [];

  return [
    {
      word,
      translation: content.translation ?? "",
      context: `${content.before}${word}${content.after}`.trim(),
    },
  ];
}

function extractFromMultipleChoice(
  content: MultipleChoiceContent,
  correctAnswer: string,
): ExtractedWord[] {
  const word = correctAnswer.trim();
  if (!word) return [];

  return [
    {
      word,
      translation: "",
      context: content.prompt,
    },
  ];
}

function extractFromMatchPairs(content: MatchPairsContent): ExtractedWord[] {
  return content.pairs.map((pair) => ({
    word: pair.left,
    translation: pair.right,
  }));
}

function extractFromReorderWords(
  content: ReorderWordsContent,
  correctAnswer: string,
): ExtractedWord[] {
  const sentence = correctAnswer.trim();
  if (!sentence) return [];

  return [
    {
      word: sentence,
      translation: content.translation ?? "",
    },
  ];
}
