import type { GrammarTopic } from "@/shared/types/grammar";

// ──────────────────────────────────────────────
// Lesson-context exercise prompts
// ──────────────────────────────────────────────

/**
 * Build prompt for generating a lesson gap-fill exercise.
 * Unlike assessment prompts, these can reference lesson themes and provide richer context.
 */
export function buildExerciseGapFillPrompt(
  topic: GrammarTopic,
  context?: { lessonTheme?: string; avoidSentences?: string[] },
): string {
  const avoidClause =
    context?.avoidSentences && context.avoidSentences.length > 0
      ? `\n\nDo NOT generate these sentences (already used):\n${context.avoidSentences.map((s) => `- "${s}"`).join("\n")}`
      : "";

  const themeClause = context?.lessonTheme
    ? `\n**Lesson theme**: ${context.lessonTheme} — try to connect the sentence to this theme when natural.`
    : "";

  return `Generate a gap-fill exercise for a Spanish grammar LESSON (not assessment).

**Topic**: ${topic.title} (Level ${topic.level})
**Description**: ${topic.description}${themeClause}

Requirements:
- Write ONE natural Spanish sentence with exactly ONE blank
- The blank should test the specific grammar point
- Use vocabulary appropriate for level ${topic.level}
- Peninsular Spanish (Castellano) ONLY — use vosotros, distinción, Peninsular vocabulary
- Provide a detailed explanation (2-3 sentences in English) — this is a LESSON, students learn from feedback

CRITICAL — output format:
- "before": words BEFORE the blank (no underscores/placeholders)
- "after": words AFTER the blank (no underscores/placeholders)
- "correctAnswer": the exact word(s) for the blank
- "hint": Spanish BASE FORM (infinitive for verbs, singular for nouns, masc. singular for adjectives, components for contractions like "a + el")
- "translation": full English translation of the complete sentence
- "explanation": detailed grammar explanation in English (2-3 sentences — explain the rule, not just the answer)
- "confidence": your confidence that this exercise is correct Castellano (0.0-1.0)

The student sees TWO helpers:
1. The base form next to the blank → knows WHICH word
2. The English translation below → knows the MEANING
They produce the correct FORM — testing grammar, not vocabulary.

Example (testing "ir conjugation"):
  before: "Los niños ", after: " al parque todos los días.", correctAnswer: "van", hint: "ir", translation: "The children go to the park every day.", explanation: "The verb 'ir' (to go) is irregular in present tense. For the third person plural (ellos/ellas/ustedes formal), the conjugation is 'van'. This is one of the most commonly used irregular verbs in Spanish.", confidence: 0.95${avoidClause}`;
}

/**
 * Build prompt for generating a lesson multiple-choice exercise.
 */
export function buildExerciseMultipleChoicePrompt(
  topic: GrammarTopic,
  context?: { lessonTheme?: string; avoidSentences?: string[] },
): string {
  const avoidClause =
    context?.avoidSentences && context.avoidSentences.length > 0
      ? `\n\nDo NOT generate these sentences (already used):\n${context.avoidSentences.map((s) => `- "${s}"`).join("\n")}`
      : "";

  const themeClause = context?.lessonTheme
    ? `\n**Lesson theme**: ${context.lessonTheme} — try to connect the sentence to this theme when natural.`
    : "";

  return `Generate a multiple-choice exercise for a Spanish grammar LESSON (not assessment).

**Topic**: ${topic.title} (Level ${topic.level})
**Description**: ${topic.description}${themeClause}

Requirements:
- Write an incomplete sentence in Spanish with "___" for the blank
- Provide exactly 4 DISTINCT options, only ONE correct
- CRITICAL: distractors must be GRAMMATICALLY INCORRECT — not just different in meaning
- CRITICAL: the prompt must NOT contain the correct answer text after the blank
- CRITICAL: verify the complete sentence (with correct answer) is grammatically perfect Castellano
- Peninsular Spanish ONLY — use vosotros, distinción, Peninsular vocabulary
- Use vocabulary appropriate for level ${topic.level}
- This is a LESSON — provide a detailed explanation (2-3 sentences)

Return:
- "prompt": sentence stem with ___ for blank
- "options": array of 4 distinct options
- "correctIndex": index (0-3) of the correct option
- "correctAnswer": the correct option text
- "explanation": detailed grammar explanation in English (2-3 sentences — explain the rule)
- "confidence": your confidence that this exercise is correct Castellano (0.0-1.0)

Example (testing "subjunctive after 'esperar que'"):
  prompt: "Espero que vosotros ___ a la fiesta este viernes."
  options: ["vengáis", "venís", "venir", "venías"]
  correctIndex: 0
  correctAnswer: "vengáis"
  explanation: "After 'esperar que' (to hope that), Spanish requires the subjunctive mood. The vosotros form of 'venir' in present subjunctive is 'vengáis'. The indicative 'venís' would be incorrect here because the main clause expresses a wish/hope."
  confidence: 0.95${avoidClause}`;
}

// ──────────────────────────────────────────────
// JSON schemas for tool_use output
// ──────────────────────────────────────────────

/** Schema for exercise gap-fill generation (includes confidence) */
export const EXERCISE_GAP_FILL_SCHEMA = {
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
    hint: {
      type: "string",
      description:
        "Spanish base form of the target word (infinitive, singular, components for contractions)",
    },
    translation: {
      type: "string",
      description: "Full English translation of the complete sentence",
    },
    explanation: {
      type: "string",
      description:
        "Detailed grammar explanation in English (2-3 sentences for lesson feedback)",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description:
        "Confidence score (0.0-1.0) that this exercise is correct Castellano",
    },
  },
  required: [
    "before",
    "after",
    "correctAnswer",
    "hint",
    "translation",
    "explanation",
    "confidence",
  ],
};

/** Schema for exercise multiple-choice generation (includes confidence) */
export const EXERCISE_MULTIPLE_CHOICE_SCHEMA = {
  type: "object" as const,
  properties: {
    prompt: {
      type: "string",
      description: "The sentence stem with ___ for blank",
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
      description:
        "Detailed grammar explanation in English (2-3 sentences for lesson feedback)",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description:
        "Confidence score (0.0-1.0) that this exercise is correct Castellano",
    },
  },
  required: [
    "prompt",
    "options",
    "correctIndex",
    "correctAnswer",
    "explanation",
    "confidence",
  ],
};

// ──────────────────────────────────────────────
// Generated data types
// ──────────────────────────────────────────────

/** AI-generated gap-fill exercise data (with confidence) */
export interface GeneratedExerciseGapFill {
  before: string;
  after: string;
  correctAnswer: string;
  hint: string;
  translation: string;
  explanation: string;
  confidence: number;
}

/** AI-generated multiple-choice exercise data (with confidence) */
export interface GeneratedExerciseMultipleChoice {
  prompt: string;
  options: string[];
  correctIndex: number;
  correctAnswer: string;
  explanation: string;
  confidence: number;
}

/** Union of all generated exercise types */
export type GeneratedExerciseData =
  | GeneratedExerciseGapFill
  | GeneratedExerciseMultipleChoice;
