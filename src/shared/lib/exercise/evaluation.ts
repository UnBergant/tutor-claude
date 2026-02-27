import { generateStructured } from "@/shared/lib/ai/client";
import {
  buildFreeWritingEvaluationPrompt,
  FREE_WRITING_EVALUATION_SCHEMA,
  type FreeWritingEvaluation,
} from "@/shared/lib/ai/prompts/exercise";
import { CELESTIA_SYSTEM_PROMPT } from "@/shared/lib/ai/prompts/system";

/** Re-export for consumer convenience */
export type { FreeWritingEvaluation as FreeWritingEvaluationResult } from "@/shared/lib/ai/prompts/exercise";

type MistakeCategory = "GRAMMAR" | "VOCABULARY" | "WORD_ORDER";

/**
 * Format a FreeWritingEvaluation into feedback text and mistake category.
 * Shared by both exercise and lesson submission flows.
 *
 * Note: sample answer is NOT included in feedbackText — consumers should use
 * `correctAnswer` from ExerciseAttemptResult for display.
 */
export function formatFreeWritingFeedback(evaluation: FreeWritingEvaluation): {
  feedbackText: string;
  mistakeCategory: MistakeCategory | null;
} {
  const feedbackParts: string[] = [];
  if (evaluation.overallFeedback) {
    feedbackParts.push(evaluation.overallFeedback);
  }
  if (evaluation.corrections.length > 0) {
    feedbackParts.push(
      ...evaluation.corrections.map(
        (c) => `"${c.original}" → "${c.corrected}": ${c.explanation}`,
      ),
    );
  }

  const mistakeCategory = evaluation.isCorrect
    ? null
    : (evaluation.mistakeCategory as MistakeCategory);

  return { feedbackText: feedbackParts.join("\n"), mistakeCategory };
}

const EVALUATION_FALLBACK: FreeWritingEvaluation = {
  isCorrect: false,
  score: 0,
  corrections: [],
  overallFeedback:
    "Could not evaluate your answer at this time. Please try again.",
  mistakeCategory: "GRAMMAR",
};

/**
 * Evaluate a free-writing exercise answer using AI (Haiku via "evaluation" endpoint).
 * Returns structured feedback including corrections, score, and mistake category.
 */
export async function evaluateFreeWriting(
  writingPrompt: string,
  sampleAnswer: string,
  userAnswer: string,
  topicTitle: string,
  topicLevel: string,
  userId: string,
): Promise<FreeWritingEvaluation> {
  try {
    const { data } = await generateStructured<FreeWritingEvaluation>({
      endpoint: "evaluation",
      system: CELESTIA_SYSTEM_PROMPT,
      userMessage: buildFreeWritingEvaluationPrompt(
        writingPrompt,
        sampleAnswer,
        userAnswer,
        topicTitle,
        topicLevel,
      ),
      toolName: "evaluate_free_writing",
      toolDescription: "Evaluate a student's free-writing exercise answer",
      schema: FREE_WRITING_EVALUATION_SCHEMA,
      userId,
    });
    return data;
  } catch (error) {
    console.error("[evaluateFreeWriting] AI evaluation failed:", error);
    return EVALUATION_FALLBACK;
  }
}
