import type { AssessmentExerciseType } from "@/shared/types/assessment";
import type { GrammarTopic } from "@/shared/types/grammar";

/**
 * Prompt for generating an assessment question.
 * Returns the user message to send to Claude along with the expected tool schema.
 */
export function buildAssessmentPrompt(
  topic: GrammarTopic,
  exerciseType: AssessmentExerciseType,
): string {
  if (exerciseType === "gap_fill") {
    return `Generate a gap-fill exercise to test the following Spanish grammar topic.

**Topic**: ${topic.title} (Level ${topic.level})
**Description**: ${topic.description}

Requirements:
- Write ONE Spanish sentence with exactly ONE blank (the word/phrase being tested)
- The blank should test the specific grammar point described
- Use vocabulary appropriate for level ${topic.level}
- The sentence should be natural and contextually meaningful
- Provide a brief explanation (1-2 sentences in English) of why the correct answer is correct

Split the sentence into:
- "before": text before the blank
- "after": text after the blank (include the period/punctuation)
- "correctAnswer": the exact word(s) that fill the blank
- "explanation": brief grammar explanation in English`;
  }

  return `Generate a multiple-choice exercise to test the following Spanish grammar topic.

**Topic**: ${topic.title} (Level ${topic.level})
**Description**: ${topic.description}

Requirements:
- Write a question or incomplete sentence in Spanish
- Provide exactly 4 options, only ONE of which is correct
- Distractors should be plausible but clearly wrong for someone who knows this grammar point
- Use vocabulary appropriate for level ${topic.level}
- Provide a brief explanation (1-2 sentences in English) of why the correct answer is correct

Return:
- "prompt": the question or sentence stem
- "options": array of 4 options (strings)
- "correctIndex": index (0-3) of the correct option
- "correctAnswer": the correct option text
- "explanation": brief grammar explanation in English`;
}

/** JSON schema for gap-fill tool_use output */
export const GAP_FILL_SCHEMA = {
  type: "object" as const,
  properties: {
    before: {
      type: "string",
      description: "Text before the blank",
    },
    after: {
      type: "string",
      description: "Text after the blank",
    },
    correctAnswer: {
      type: "string",
      description: "The correct word(s) for the blank",
    },
    explanation: {
      type: "string",
      description: "Brief grammar explanation in English",
    },
  },
  required: ["before", "after", "correctAnswer", "explanation"],
};

/** JSON schema for multiple-choice tool_use output */
export const MULTIPLE_CHOICE_SCHEMA = {
  type: "object" as const,
  properties: {
    prompt: {
      type: "string",
      description: "The question or sentence stem",
    },
    options: {
      type: "array",
      items: { type: "string" },
      minItems: 4,
      maxItems: 4,
      description: "Four answer options",
    },
    correctIndex: {
      type: "integer",
      minimum: 0,
      maximum: 3,
      description: "Index of the correct option",
    },
    correctAnswer: {
      type: "string",
      description: "The correct option text",
    },
    explanation: {
      type: "string",
      description: "Brief grammar explanation in English",
    },
  },
  required: [
    "prompt",
    "options",
    "correctIndex",
    "correctAnswer",
    "explanation",
  ],
};

/** Generated gap-fill data from AI */
export interface GeneratedGapFill {
  before: string;
  after: string;
  correctAnswer: string;
  explanation: string;
}

/** Generated multiple-choice data from AI */
export interface GeneratedMultipleChoice {
  prompt: string;
  options: string[];
  correctIndex: number;
  correctAnswer: string;
  explanation: string;
}
