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

/**
 * Build prompt for generating a reorder-words exercise.
 * Student sees shuffled words and must reconstruct the correct sentence.
 */
export function buildExerciseReorderWordsPrompt(
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

  return `Generate a reorder-words exercise for a Spanish grammar LESSON.

**Topic**: ${topic.title} (Level ${topic.level})
**Description**: ${topic.description}${themeClause}

The student will see the words of a sentence in random order and must tap them in the correct order to reconstruct the sentence. This tests word order and sentence structure.

Requirements:
- Write ONE natural Spanish sentence with 4-8 words
- The sentence must test the specific grammar point (word order matters!)
- Use vocabulary appropriate for level ${topic.level}
- Peninsular Spanish (Castellano) ONLY — use vosotros, distinción, Peninsular vocabulary
- Provide a detailed explanation (2-3 sentences in English)

Return:
- "correctSentence": the complete correct sentence
- "words": array of individual words from the sentence (in correct order — they will be shuffled by the system)
- "translation": English translation of the sentence
- "explanation": detailed grammar explanation in English (2-3 sentences — explain word order rules)
- "confidence": your confidence that this exercise is correct Castellano (0.0-1.0)

Example (testing "subject-verb-object order"):
  correctSentence: "Los niños van al parque"
  words: ["Los", "niños", "van", "al", "parque"]
  translation: "The children go to the park"
  explanation: "In Spanish, the basic word order is Subject-Verb-Object (SVO), similar to English. 'Los niños' (the children) is the subject, 'van' (go) is the verb, and 'al parque' (to the park) is the prepositional complement. Note that 'al' is the contraction of 'a + el'."
  confidence: 0.95${avoidClause}`;
}

/**
 * Build prompt for generating a match-pairs exercise.
 * Student matches items in two columns (e.g., Spanish↔English, infinitive↔conjugation).
 */
export function buildExerciseMatchPairsPrompt(
  topic: GrammarTopic,
  context?: { lessonTheme?: string },
): string {
  const themeClause = context?.lessonTheme
    ? `\n**Lesson theme**: ${context.lessonTheme} — try to connect pairs to this theme when natural.`
    : "";

  return `Generate a match-pairs exercise for a Spanish grammar LESSON.

**Topic**: ${topic.title} (Level ${topic.level})
**Description**: ${topic.description}${themeClause}

The student will see two columns and must match each item on the left with its correct pair on the right. This tests vocabulary, conjugation patterns, or grammar relationships.

Requirements:
- Generate 4-5 pairs related to the grammar topic
- Pairs can be: Spanish word ↔ English translation, infinitive ↔ conjugated form, singular ↔ plural, etc.
- All pairs must relate to the specific grammar point
- No duplicate items on either side
- Peninsular Spanish (Castellano) ONLY
- Use vocabulary appropriate for level ${topic.level}
- Provide a detailed explanation (2-3 sentences in English)

Return:
- "pairs": array of objects with "left" and "right" strings
- "explanation": detailed grammar explanation in English (2-3 sentences)
- "confidence": your confidence that this exercise is correct Castellano (0.0-1.0)

Example (testing "ser vs estar"):
  pairs: [
    { "left": "Soy profesor", "right": "permanent trait" },
    { "left": "Estoy cansado", "right": "temporary state" },
    { "left": "Es de Madrid", "right": "origin" },
    { "left": "Está en casa", "right": "location" }
  ]
  explanation: "Spanish has two 'to be' verbs. 'Ser' is used for permanent characteristics, identity, and origin. 'Estar' is used for temporary states, emotions, and locations. Mixing them up changes the meaning entirely."
  confidence: 0.95`;
}

/**
 * Build prompt for generating a free-writing exercise.
 * Student writes a response in Spanish; AI evaluates it.
 */
export function buildExerciseFreeWritingPrompt(
  topic: GrammarTopic,
  context?: { lessonTheme?: string },
): string {
  const themeClause = context?.lessonTheme
    ? `\n**Lesson theme**: ${context.lessonTheme} — connect the writing task to this theme.`
    : "";

  return `Generate a free-writing exercise for a Spanish grammar LESSON.

**Topic**: ${topic.title} (Level ${topic.level})
**Description**: ${topic.description}${themeClause}

The student will write 1-3 sentences in Spanish in response to a prompt. Their answer will be evaluated by AI for grammar correctness, focusing on the target grammar point.

Requirements:
- Write a clear writing prompt IN ENGLISH that asks the student to produce Spanish text using the target grammar
- The prompt should guide the student to use the specific grammar point naturally
- Keep it achievable: 1-3 sentences expected
- Provide a model sample answer in correct Castellano
- Peninsular Spanish (Castellano) ONLY for the sample answer
- Use vocabulary appropriate for level ${topic.level}
- Provide a detailed explanation (2-3 sentences in English)

Return:
- "prompt": the writing task in English (what the student should write about)
- "sampleAnswer": a model answer in correct Castellano (1-3 sentences)
- "explanation": detailed grammar explanation in English (2-3 sentences — what grammar the student should demonstrate)
- "confidence": your confidence that this exercise is correct Castellano (0.0-1.0)

Example (testing "present tense regular -ar verbs"):
  prompt: "Write 2 sentences describing your daily morning routine using -ar verbs (e.g., desayunar, estudiar, hablar, caminar)."
  sampleAnswer: "Por las mañanas desayuno tostadas con café. Después camino al trabajo y hablo con mis compañeros."
  explanation: "Regular -ar verbs in present tense follow a predictable pattern: drop the -ar ending and add the appropriate person ending (-o, -as, -a, -amos, -áis, -an). For first person singular (yo), the ending is always -o: desayuno, camino, hablo."
  confidence: 0.95`;
}

/**
 * Build prompt for AI evaluation of a free-writing answer.
 */
export function buildFreeWritingEvaluationPrompt(
  writingPrompt: string,
  sampleAnswer: string,
  userAnswer: string,
  topicTitle: string,
  topicLevel: string,
): string {
  return `Evaluate a student's Spanish writing exercise.

**Grammar topic**: ${topicTitle} (Level ${topicLevel})
**Writing prompt**: ${writingPrompt}
**Model answer**: ${sampleAnswer}
**Student's answer**: ${userAnswer}

Evaluate the student's answer considering:
1. Does it use the target grammar point correctly?
2. Is the Spanish grammatically correct (Castellano)?
3. Does it address the prompt?

Be encouraging but accurate. A student who makes a genuine attempt with minor errors should still get useful feedback.

Return:
- "isCorrect": true if the answer is substantially correct (minor accent issues are OK), false if there are significant grammar errors
- "score": 0-100 overall quality score
- "corrections": array of specific corrections (may be empty if perfect). Each correction has:
  - "original": the incorrect text from the student's answer
  - "corrected": the corrected version
  - "explanation": brief explanation of the error
- "overallFeedback": 1-2 sentence overall assessment in English
- "mistakeCategory": one of "GRAMMAR", "VOCABULARY", "WORD_ORDER" — the primary type of error (use "GRAMMAR" if correct)`;
}

/**
 * Build prompt for generating a reading comprehension exercise.
 * Student reads a passage and answers 2-3 questions about it.
 */
export function buildExerciseReadingComprehensionPrompt(
  topic: GrammarTopic,
  context?: { lessonTheme?: string },
): string {
  const themeClause = context?.lessonTheme
    ? `\n**Lesson theme**: ${context.lessonTheme} — set the passage in this thematic context.`
    : "";

  return `Generate a reading comprehension exercise for a Spanish grammar LESSON.

**Topic**: ${topic.title} (Level ${topic.level})
**Description**: ${topic.description}${themeClause}

The student will read a short passage in Spanish and answer 2-3 questions about it. The passage should naturally showcase the target grammar point.

Requirements:
- Write a passage of 100-200 words in Castellano (Peninsular Spanish)
- The passage should use the target grammar point multiple times
- Use vocabulary appropriate for level ${topic.level}
- Generate 2-3 comprehension questions that test understanding of the grammar
- Question types: "multiple_choice" (4 options), "gap_fill" (fill in a word), or "true_false" (2 options: "True"/"False")
- Each question must have a clear correct answer
- Provide explanations for each question's answer
- Provide an overall explanation of the grammar demonstrated

Return:
- "passage": the Spanish text (100-200 words)
- "questions": array of 2-3 question objects, each with:
  - "type": "multiple_choice", "gap_fill", or "true_false"
  - "prompt": the question text in English
  - "options": array of options (4 for MC, 2 for true_false ["True", "False"], omit for gap_fill)
  - "correctAnswer": the correct answer text
  - "explanation": brief explanation of why this is correct
- "explanation": overall grammar explanation in English (2-3 sentences)
- "confidence": your confidence that this exercise is correct Castellano (0.0-1.0)

Example (testing "preterite vs imperfect"):
  passage: "Cuando era niño, vivía en un pueblo pequeño cerca de Barcelona. Todos los días iba al colegio andando..."
  questions: [
    { "type": "multiple_choice", "prompt": "Why is 'vivía' used instead of 'vivió'?", "options": ["It describes a habitual past action", "It describes a completed action", "It's a future tense", "It's subjunctive"], "correctAnswer": "It describes a habitual past action", "explanation": "The imperfect 'vivía' is used because living in the village was an ongoing, habitual situation in the past." },
    { "type": "true_false", "prompt": "The passage uses the imperfect tense to describe routines.", "options": ["True", "False"], "correctAnswer": "True", "explanation": "The imperfect tense (era, vivía, iba) is consistently used throughout to describe past habits and routines." }
  ]
  explanation: "The passage demonstrates the contrast between preterite and imperfect. The imperfect (vivía, iba) is used for habitual actions and descriptions in the past, while the preterite would be used for completed, one-time events."
  confidence: 0.95`;
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

/** Schema for reorder-words generation */
export const EXERCISE_REORDER_WORDS_SCHEMA = {
  type: "object" as const,
  properties: {
    correctSentence: {
      type: "string",
      description: "The complete correct sentence",
    },
    words: {
      type: "array",
      items: { type: "string" },
      minItems: 4,
      maxItems: 8,
      description: "Individual words from the sentence (in correct order)",
    },
    translation: {
      type: "string",
      description: "English translation of the sentence",
    },
    explanation: {
      type: "string",
      description:
        "Detailed grammar explanation in English (2-3 sentences — explain word order rules)",
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
    "correctSentence",
    "words",
    "translation",
    "explanation",
    "confidence",
  ],
};

/** Schema for match-pairs generation */
export const EXERCISE_MATCH_PAIRS_SCHEMA = {
  type: "object" as const,
  properties: {
    pairs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          left: { type: "string", description: "Left column item" },
          right: { type: "string", description: "Right column item" },
        },
        required: ["left", "right"],
      },
      minItems: 4,
      maxItems: 5,
      description: "Pairs to match (4-5 items)",
    },
    explanation: {
      type: "string",
      description: "Detailed grammar explanation in English (2-3 sentences)",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description:
        "Confidence score (0.0-1.0) that this exercise is correct Castellano",
    },
  },
  required: ["pairs", "explanation", "confidence"],
};

/** Schema for free-writing generation */
export const EXERCISE_FREE_WRITING_SCHEMA = {
  type: "object" as const,
  properties: {
    prompt: {
      type: "string",
      description: "Writing task in English",
    },
    sampleAnswer: {
      type: "string",
      description: "Model answer in correct Castellano (1-3 sentences)",
    },
    explanation: {
      type: "string",
      description:
        "Detailed grammar explanation in English (2-3 sentences — what grammar to demonstrate)",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description:
        "Confidence score (0.0-1.0) that this exercise is correct Castellano",
    },
  },
  required: ["prompt", "sampleAnswer", "explanation", "confidence"],
};

/** Schema for free-writing AI evaluation */
export const FREE_WRITING_EVALUATION_SCHEMA = {
  type: "object" as const,
  properties: {
    isCorrect: {
      type: "boolean",
      description: "Whether the answer is substantially correct",
    },
    score: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description: "Overall quality score (0-100)",
    },
    corrections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: {
            type: "string",
            description: "Incorrect text from student's answer",
          },
          corrected: {
            type: "string",
            description: "Corrected version",
          },
          explanation: {
            type: "string",
            description: "Brief explanation of the error",
          },
        },
        required: ["original", "corrected", "explanation"],
      },
      description: "Specific corrections (empty if perfect)",
    },
    overallFeedback: {
      type: "string",
      description: "1-2 sentence overall assessment in English",
    },
    mistakeCategory: {
      type: "string",
      enum: ["GRAMMAR", "VOCABULARY", "WORD_ORDER"],
      description: "Primary type of error",
    },
  },
  required: [
    "isCorrect",
    "score",
    "corrections",
    "overallFeedback",
    "mistakeCategory",
  ],
};

/** Schema for reading comprehension generation */
export const EXERCISE_READING_COMPREHENSION_SCHEMA = {
  type: "object" as const,
  properties: {
    passage: {
      type: "string",
      description: "Spanish text (100-200 words)",
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["multiple_choice", "gap_fill", "true_false"],
            description: "Question type",
          },
          prompt: {
            type: "string",
            description: "Question text in English",
          },
          options: {
            type: "array",
            items: { type: "string" },
            description:
              "Answer options (4 for MC, 2 for true_false, omit for gap_fill)",
          },
          correctAnswer: {
            type: "string",
            description: "The correct answer text",
          },
          explanation: {
            type: "string",
            description: "Brief explanation of why this is correct",
          },
        },
        required: ["type", "prompt", "correctAnswer", "explanation"],
      },
      minItems: 2,
      maxItems: 3,
      description: "Comprehension questions (2-3)",
    },
    explanation: {
      type: "string",
      description: "Overall grammar explanation in English (2-3 sentences)",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description:
        "Confidence score (0.0-1.0) that this exercise is correct Castellano",
    },
  },
  required: ["passage", "questions", "explanation", "confidence"],
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

/** AI-generated reorder-words exercise data */
export interface GeneratedExerciseReorderWords {
  correctSentence: string;
  words: string[];
  translation: string;
  explanation: string;
  confidence: number;
}

/** AI-generated match-pairs exercise data */
export interface GeneratedExerciseMatchPairs {
  pairs: { left: string; right: string }[];
  explanation: string;
  confidence: number;
}

/** AI-generated free-writing exercise data */
export interface GeneratedExerciseFreeWriting {
  prompt: string;
  sampleAnswer: string;
  explanation: string;
  confidence: number;
}

/** AI evaluation result for free-writing exercises */
export interface FreeWritingEvaluation {
  isCorrect: boolean;
  score: number;
  corrections: {
    original: string;
    corrected: string;
    explanation: string;
  }[];
  overallFeedback: string;
  mistakeCategory: "GRAMMAR" | "VOCABULARY" | "WORD_ORDER";
}

/** AI-generated reading comprehension exercise data */
export interface GeneratedExerciseReadingComprehension {
  passage: string;
  questions: {
    type: "multiple_choice" | "gap_fill" | "true_false";
    prompt: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
  }[];
  explanation: string;
  confidence: number;
}

/** Union of all generated exercise types */
export type GeneratedExerciseData =
  | GeneratedExerciseGapFill
  | GeneratedExerciseMultipleChoice
  | GeneratedExerciseReorderWords
  | GeneratedExerciseMatchPairs
  | GeneratedExerciseFreeWriting
  | GeneratedExerciseReadingComprehension;
