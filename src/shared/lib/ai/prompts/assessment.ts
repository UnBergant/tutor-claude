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

CRITICAL — split the sentence into exactly two parts around the blank:
- "before": only the words BEFORE the blank, no underscores or placeholders
- "after": only the words AFTER the blank, no underscores or placeholders
- "correctAnswer": the exact word(s) that fill the blank
- "hint": the Spanish BASE FORM of the target word shown next to the blank in parentheses — infinitive for verbs, singular for nouns, masc. singular for adjectives, or the components for contractions (e.g. "a + el"). This tells the student EXACTLY which word to transform.
- "translation": the FULL English translation of the complete sentence. Shown below the Spanish sentence for context/meaning.
- "explanation": brief grammar explanation in English

The student sees TWO helpers:
1. The base form next to the blank → knows WHICH word
2. The English translation below → knows the MEANING
They only need to produce the correct FORM. This tests grammar, not vocabulary.

Example: testing "ir conjugation" →
  before: "Los niños ", after: " al parque.", correctAnswer: "van", hint: "ir", translation: "The children go to the park."

Example: testing "pluperfect subjunctive" →
  before: "Si ", after: " estudiado más, habrías aprobado.", correctAnswer: "hubieras", hint: "haber", translation: "If you had studied more, you would have passed."

Example: testing "plural formation" →
  before: "Tengo dos ", after: " azules en mi mochila.", correctAnswer: "cuadernos", hint: "cuaderno", translation: "I have two blue notebooks in my backpack."

Example: testing "contraction a+el" →
  before: "Voy ", after: " parque con mi hermana.", correctAnswer: "al", hint: "a + el", translation: "I'm going to the park with my sister."`;
  }

  return `Generate a multiple-choice exercise to test the following Spanish grammar topic.

**Topic**: ${topic.title} (Level ${topic.level})
**Description**: ${topic.description}

Requirements:
- Write an incomplete sentence in Spanish with a blank (use "___") where the answer goes
- Provide exactly 4 DISTINCT options (no duplicates), only ONE of which is correct
- CRITICAL: distractors must be GRAMMATICALLY INCORRECT — not just different in meaning. The student should be able to identify the correct answer by applying the grammar rule, not by guessing the intended meaning. For example, if testing "a + el → al", do NOT include "del" as a distractor (it's a valid contraction with different meaning) — instead use errors like "a el" (missing contraction), "a la" (wrong gender), etc.
- CRITICAL: the prompt must NOT contain the correct answer or any of its parts. The blank replaces the ENTIRE tested phrase — including any conjugated verbs that are part of the answer. Do NOT leave conjugated forms, articles, or prepositions from the answer visible in the sentence around the blank. SELF-CHECK: scan the sentence text after ___ — if any word from the options appears there, you MUST rewrite the sentence to move that word into the blank or restructure the sentence.
- CRITICAL: verify the COMPLETE sentence (prompt with correctAnswer inserted in place of ___) is grammatically perfect Spanish. Do not drop prepositions, articles, or other words that the sentence requires. The blank should ONLY replace the tested element — all surrounding grammar must remain intact.
- Use vocabulary appropriate for level ${topic.level}
- Provide a brief explanation (1-2 sentences in English) of why the correct answer is correct

Example: testing "para que + subjunctive" →
  prompt: "Te enviamos esta información ___ prepararte mejor para el examen."
  options: ["para que puedas", "para que podías", "para que podrás", "para que pudieras"]
  correctAnswer: "para que puedas"
  — Note: "puedas" is NOT in the sentence; the blank covers the full "para que puedas" phrase.

Example: testing "pretérito indefinido" →
  prompt: "Cuando ___ a la oficina, me enteré de que habían cancelado la reunión."
  options: ["llegué", "llegaba", "he llegado", "llegaré"]
  correctAnswer: "llegué"
  — Note: the preposition "a" stays in the sentence because it is NOT part of the tested verb form.

Return:
- "prompt": the question or sentence stem (with ___ for the blank)
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
    hint: {
      type: "string",
      description:
        "Spanish base form of the target word (infinitive for verbs, singular for nouns, components for contractions like 'a + el')",
    },
    translation: {
      type: "string",
      description:
        "Full English translation of the complete sentence for context",
    },
    explanation: {
      type: "string",
      description: "Brief grammar explanation in English",
    },
  },
  required: [
    "before",
    "after",
    "correctAnswer",
    "hint",
    "translation",
    "explanation",
  ],
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
  hint: string;
  translation: string;
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
