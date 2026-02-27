import { z } from "zod/v4";
import { checkLatamTerms } from "@/shared/data/latam-blocklist";
import type {
  GeneratedExerciseFreeWriting,
  GeneratedExerciseGapFill,
  GeneratedExerciseMatchPairs,
  GeneratedExerciseMultipleChoice,
  GeneratedExerciseReadingComprehension,
  GeneratedExerciseReorderWords,
} from "@/shared/lib/ai/prompts/exercise";

// ──────────────────────────────────────────────
// Zod schemas for exercise content validation
// ──────────────────────────────────────────────

export const gapFillSchema = z.object({
  before: z.string().min(1),
  after: z.string(), // can be empty (end of sentence)
  correctAnswer: z.string().min(1),
  hint: z.string().min(1),
  translation: z.string().min(1),
  explanation: z.string().min(10),
  confidence: z.number().min(0).max(1),
});

export const multipleChoiceSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(10),
  confidence: z.number().min(0).max(1),
});

export const reorderWordsSchema = z.object({
  correctSentence: z.string().min(1),
  words: z.array(z.string().min(1)).min(4).max(8),
  translation: z.string().min(1),
  explanation: z.string().min(10),
  confidence: z.number().min(0).max(1),
});

export const matchPairsSchema = z.object({
  pairs: z
    .array(
      z.object({
        left: z.string().min(1),
        right: z.string().min(1),
      }),
    )
    .min(4)
    .max(5),
  explanation: z.string().min(10),
  confidence: z.number().min(0).max(1),
});

export const freeWritingSchema = z.object({
  prompt: z.string().min(10),
  sampleAnswer: z.string().min(1),
  explanation: z.string().min(10),
  confidence: z.number().min(0).max(1),
});

export const readingComprehensionSchema = z.object({
  passage: z.string().min(50),
  questions: z
    .array(
      z.object({
        type: z.enum(["multiple_choice", "gap_fill", "true_false"]),
        prompt: z.string().min(1),
        options: z.array(z.string().min(1)).optional(),
        correctAnswer: z.string().min(1),
        explanation: z.string().min(1),
      }),
    )
    .min(2)
    .max(4),
  explanation: z.string().min(10),
  confidence: z.number().min(0).max(1),
});

// ──────────────────────────────────────────────
// Validation pipeline
// ──────────────────────────────────────────────

const CONFIDENCE_THRESHOLD = 0.8;

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors: string[];
}

/**
 * Validate an AI-generated gap-fill exercise through the full pipeline.
 */
export function validateGapFill(
  data: unknown,
): ValidationResult<GeneratedExerciseGapFill> {
  return runPipeline(data, gapFillSchema, (d) => {
    const gf = d as GeneratedExerciseGapFill;
    return `${gf.before} ${gf.correctAnswer} ${gf.after}`;
  });
}

/**
 * Validate an AI-generated multiple-choice exercise through the full pipeline.
 */
export function validateMultipleChoice(
  data: unknown,
): ValidationResult<GeneratedExerciseMultipleChoice> {
  return runPipeline(data, multipleChoiceSchema, (d) => {
    const mc = d as GeneratedExerciseMultipleChoice;
    return `${mc.prompt} ${mc.options.join(" ")}`;
  });
}

/**
 * Validate an AI-generated reorder-words exercise.
 */
export function validateReorderWords(
  data: unknown,
): ValidationResult<GeneratedExerciseReorderWords> {
  return runPipeline(data, reorderWordsSchema, (d) => {
    const rw = d as GeneratedExerciseReorderWords;
    return rw.correctSentence;
  });
}

/**
 * Validate an AI-generated match-pairs exercise.
 * Additional check: no duplicate left/right items.
 */
export function validateMatchPairs(
  data: unknown,
): ValidationResult<GeneratedExerciseMatchPairs> {
  const result = runPipeline(data, matchPairsSchema, (d) => {
    const mp = d as GeneratedExerciseMatchPairs;
    return mp.pairs.map((p) => `${p.left} ${p.right}`).join(" ");
  });

  if (result.valid && result.data) {
    const leftItems = result.data.pairs.map((p) => p.left);
    const rightItems = result.data.pairs.map((p) => p.right);
    if (new Set(leftItems).size !== leftItems.length) {
      result.valid = false;
      result.errors.push("Duplicate items in left column");
    }
    if (new Set(rightItems).size !== rightItems.length) {
      result.valid = false;
      result.errors.push("Duplicate items in right column");
    }
  }

  return result;
}

/**
 * Validate an AI-generated free-writing exercise.
 */
export function validateFreeWriting(
  data: unknown,
): ValidationResult<GeneratedExerciseFreeWriting> {
  return runPipeline(data, freeWritingSchema, (d) => {
    const fw = d as GeneratedExerciseFreeWriting;
    return fw.sampleAnswer;
  });
}

/**
 * Validate an AI-generated reading comprehension exercise.
 * Additional check: MC questions must have 4 options, true_false must have 2.
 */
export function validateReadingComprehension(
  data: unknown,
): ValidationResult<GeneratedExerciseReadingComprehension> {
  const result = runPipeline(data, readingComprehensionSchema, (d) => {
    const rc = d as GeneratedExerciseReadingComprehension;
    return `${rc.passage} ${rc.questions.map((q) => q.prompt).join(" ")}`;
  });

  if (result.valid && result.data) {
    for (const q of result.data.questions) {
      if (q.type === "multiple_choice") {
        if (!q.options || q.options.length !== 4) {
          result.valid = false;
          result.errors.push(
            `MC question "${q.prompt.slice(0, 30)}..." must have exactly 4 options`,
          );
        }
      } else if (q.type === "true_false") {
        if (!q.options || q.options.length !== 2) {
          result.valid = false;
          result.errors.push(
            `True/false question "${q.prompt.slice(0, 30)}..." must have exactly 2 options`,
          );
        }
      }
    }
  }

  return result;
}

/**
 * Run the full validation pipeline:
 * 1. JSON schema validation (Zod)
 * 2. Latin American blocklist check
 * 3. AI confidence threshold check
 * 4. (Phase 6 slot: LanguageTool check)
 */
function runPipeline<T>(
  data: unknown,
  schema: z.ZodType<T>,
  extractText: (data: T) => string,
): ValidationResult<T> {
  const errors: string[] = [];

  // Stage 1: Zod schema validation
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map(
        (issue) => `Schema: ${issue.path.join(".")} — ${issue.message}`,
      ),
    };
  }

  const validated = parsed.data;

  // Stage 2: Latin American blocklist check
  const text = extractText(validated);
  const violations = checkLatamTerms(text);
  if (violations.length > 0) {
    for (const v of violations) {
      errors.push(
        `LatAm vocabulary: "${v.term}" → use "${v.replacement}" instead`,
      );
    }
  }

  // Stage 3: AI confidence threshold
  const confidence = (validated as Record<string, unknown>).confidence;
  if (typeof confidence === "number" && confidence < CONFIDENCE_THRESHOLD) {
    errors.push(
      `Low confidence: ${confidence.toFixed(2)} (threshold: ${CONFIDENCE_THRESHOLD})`,
    );
  }

  // Stage 4: LanguageTool check (Phase 6 — slot reserved)
  // TODO: Add LanguageTool API validation here

  return {
    valid: errors.length === 0,
    data: validated as T,
    errors,
  };
}

// ──────────────────────────────────────────────
// Generation with retry
// ──────────────────────────────────────────────

const MAX_RETRIES = 2;

/**
 * Generate and validate an exercise with automatic retry on validation failure.
 * On retry, passes previous validation errors to the generator so the AI can correct them.
 */
export async function generateWithRetry<T>(
  generate: (previousErrors?: string[]) => Promise<T>,
  validate: (data: unknown) => ValidationResult<T>,
): Promise<T> {
  let lastErrors: string[] = [];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const data = await generate(attempt > 0 ? lastErrors : undefined);
    const result = validate(data);

    if (result.valid && result.data) {
      return result.data;
    }

    lastErrors = result.errors;
  }

  throw new Error(
    `Exercise validation failed after ${MAX_RETRIES + 1} attempts: ${lastErrors.join("; ")}`,
  );
}
