"use server";

import { z } from "zod/v4";
import type { Prisma } from "@/generated/prisma";
import { TOPIC_BY_ID } from "@/shared/data/grammar-topics";
import { generateStructured } from "@/shared/lib/ai/client";
import {
  buildAssessmentPrompt,
  GAP_FILL_SCHEMA,
  type GeneratedGapFill,
  type GeneratedMultipleChoice,
  MULTIPLE_CHOICE_SCHEMA,
} from "@/shared/lib/ai/prompts/assessment";
import { CELESTIA_SYSTEM_PROMPT } from "@/shared/lib/ai/prompts/system";
import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type {
  AssessmentItem,
  AssessmentResult,
  BayesianState,
  ExperienceLevel,
  LearningGoal,
} from "@/shared/types/assessment";
import { EXPERIENCE_THETA_MAP } from "@/shared/types/assessment";
import {
  bayesianUpdate,
  classifyLevel,
  createInitialState,
  levelConfidence,
  MAX_ITEMS,
} from "./lib/bayesian";
import { buildGapMap } from "./lib/gap-map";
import { type SelectedItem, selectNextTopic } from "./lib/item-selection";

// ──────────────────────────────────────────────
// Input validation schemas
// ──────────────────────────────────────────────

const experienceLevelSchema = z.enum([
  "complete_beginner",
  "know_basics",
  "simple_conversations",
  "comfortable_most_topics",
  "advanced_near_fluent",
  "near_native",
]);

const learningGoalSchema = z.enum([
  "travel",
  "relocation",
  "work",
  "academic",
  "culture",
  "personal",
]);

const submitAnswerSchema = z.object({
  assessmentId: z.string().uuid(),
  answer: z.string().min(1).max(500),
});

// ──────────────────────────────────────────────
// Public types returned to the client
// ──────────────────────────────────────────────

export interface AssessmentClientItem {
  topicId: string;
  level: string;
  exerciseType: "gap_fill" | "multiple_choice";
  prompt: string;
  options: string[] | null;
  /** Blank parts for gap_fill */
  before?: string;
  after?: string;
  /** Base form hint for gap_fill (infinitive, singular, etc.) */
  hint?: string;
  /** English translation of the sentence for gap_fill */
  translation?: string;
}

export interface StartAssessmentResult {
  assessmentId: string;
  item: AssessmentClientItem;
}

export interface SubmitAnswerResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  /** Next item (null if assessment complete) */
  nextItem: AssessmentClientItem | null;
  /** Final result (only when assessment complete) */
  result: AssessmentResult | null;
  /** Current question number (1-based) */
  questionNumber: number;
}

// ──────────────────────────────────────────────
// Server Actions
// ──────────────────────────────────────────────

/**
 * Start a new assessment. Creates the DB record, initializes Bayesian state,
 * and generates the first question via AI.
 */
export async function startAssessment(
  experienceLevel: ExperienceLevel,
  learningGoal: LearningGoal,
): Promise<StartAssessmentResult> {
  experienceLevelSchema.parse(experienceLevel);
  learningGoalSchema.parse(learningGoal);

  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  // Initialize Bayesian state from self-assessment prior
  const thetaPrior = EXPERIENCE_THETA_MAP[experienceLevel];
  const bayesianState = createInitialState(thetaPrior);

  // Select first topic
  const selected = selectNextTopic(bayesianState);
  if (!selected) throw new Error("No topics available");

  // Generate first question via AI + build full item
  const { fullItem, aiItem } = await buildFullItem(selected, userId);

  // Store Bayesian state + current item in metadata
  const metadata = {
    bayesianState,
    currentItem: fullItem,
    learningGoal,
    experienceLevel,
  };

  // Create assessment in DB
  const assessment = await prisma.assessment.create({
    data: {
      userId,
      status: "IN_PROGRESS",
      questionsAsked: 0,
      metadata: toJsonValue(metadata),
    },
  });

  // Also save the learning goal in UserProfile (create if not exists)
  await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, learningGoal },
    update: { learningGoal },
  });

  return {
    assessmentId: assessment.id,
    item: toClientItem(fullItem, aiItem, selected.exerciseType),
  };
}

/**
 * Submit an answer for the current assessment item.
 * Checks the answer, updates Bayesian state, and generates the next item.
 */
export async function submitAssessmentAnswer(
  assessmentId: string,
  answer: string,
): Promise<SubmitAnswerResult> {
  submitAnswerSchema.parse({ assessmentId, answer });

  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  // Load assessment with metadata
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
  });

  if (!assessment || assessment.userId !== userId) {
    throw new Error("Assessment not found");
  }
  if (assessment.status !== "IN_PROGRESS") {
    throw new Error("Assessment already completed");
  }

  const meta = assessment.metadata as unknown as {
    bayesianState: BayesianState;
    currentItem: AssessmentItem;
    learningGoal: string;
    experienceLevel: string;
  };

  const { bayesianState, currentItem } = meta;

  // Check answer
  const isCorrect = checkAnswer(
    answer,
    currentItem.correctAnswer,
    currentItem.exerciseType,
  );

  // Bayesian update
  const updatedState = bayesianUpdate(
    bayesianState,
    currentItem.topicId,
    isCorrect,
    currentItem.difficulty,
    currentItem.exerciseType,
  );

  const questionNumber = updatedState.responses.length;

  // Shared answer data for atomic writes
  const answerData = {
    assessmentId,
    topicId: currentItem.topicId,
    level: currentItem.level,
    question: currentItem.prompt,
    userAnswer: answer,
    correctAnswer: currentItem.correctAnswer,
    isCorrect,
  };

  // Check if assessment is complete
  if (questionNumber >= MAX_ITEMS) {
    return await completeAssessment(
      assessmentId,
      userId,
      updatedState,
      meta.learningGoal,
      isCorrect,
      currentItem,
      questionNumber,
      answerData,
    );
  }

  // Select next topic
  const selected = selectNextTopic(updatedState);
  if (!selected) {
    // No more topics to test — complete early
    return await completeAssessment(
      assessmentId,
      userId,
      updatedState,
      meta.learningGoal,
      isCorrect,
      currentItem,
      questionNumber,
      answerData,
    );
  }

  // Generate next question (AI call — can fail)
  const { fullItem: nextFullItem, aiItem } = await buildFullItem(
    selected,
    userId,
  );

  // Atomically write answer + updated metadata together
  await prisma.$transaction([
    prisma.assessmentAnswer.create({ data: answerData }),
    prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        questionsAsked: questionNumber,
        metadata: toJsonValue({
          ...meta,
          bayesianState: updatedState,
          currentItem: nextFullItem,
        }),
      },
    }),
  ]);

  return {
    isCorrect,
    correctAnswer: currentItem.correctAnswer,
    explanation: currentItem.explanation,
    nextItem: toClientItem(nextFullItem, aiItem, selected.exerciseType),
    result: null,
    questionNumber,
  };
}

// ──────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────

/** Type-safe cast to Prisma JSON value. */
function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

/**
 * Look up grammar topic, generate AI question, and build the full AssessmentItem.
 * Shared by startAssessment and submitAssessmentAnswer to avoid duplication.
 */
async function buildFullItem(
  selected: SelectedItem,
  userId: string,
): Promise<{
  fullItem: AssessmentItem;
  aiItem: GeneratedGapFill | GeneratedMultipleChoice;
}> {
  const topic = TOPIC_BY_ID.get(selected.topicId);
  if (!topic) throw new Error(`Unknown topic: ${selected.topicId}`);

  const aiItem = await generateAssessmentItem(
    topic,
    selected.exerciseType,
    userId,
  );

  const fullItem: AssessmentItem = {
    topicId: selected.topicId,
    level: selected.level,
    exerciseType: selected.exerciseType,
    prompt:
      selected.exerciseType === "gap_fill"
        ? `${(aiItem as GeneratedGapFill).before}___${(aiItem as GeneratedGapFill).after}`
        : (aiItem as GeneratedMultipleChoice).prompt,
    options:
      selected.exerciseType === "multiple_choice"
        ? (aiItem as GeneratedMultipleChoice).options
        : null,
    correctAnswer:
      selected.exerciseType === "gap_fill"
        ? (aiItem as GeneratedGapFill).correctAnswer
        : (aiItem as GeneratedMultipleChoice).correctAnswer,
    explanation:
      selected.exerciseType === "gap_fill"
        ? (aiItem as GeneratedGapFill).explanation
        : (aiItem as GeneratedMultipleChoice).explanation,
    difficulty: selected.difficulty,
  };

  return { fullItem, aiItem };
}

async function completeAssessment(
  assessmentId: string,
  userId: string,
  state: BayesianState,
  learningGoal: string,
  lastIsCorrect: boolean,
  lastItem: AssessmentItem,
  questionNumber: number,
  answerData: {
    assessmentId: string;
    topicId: string;
    level: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  },
): Promise<SubmitAnswerResult> {
  const estimatedLevel = state.classifiedLevel ?? classifyLevel(state.theta);
  const confidence = levelConfidence(state.theta, state.se, estimatedLevel);

  // Build gap map from tested topics
  const testedTopics = state.responses.map(([topicId, isCorrect]) => ({
    topicId,
    isCorrect,
  }));
  const gapMap = buildGapMap(state.theta, state.se, testedTopics);

  const result: AssessmentResult = {
    estimatedLevel,
    confidence,
    theta: state.theta,
    gapMap,
  };

  // Atomically write answer + completion + profile update
  await prisma.$transaction([
    prisma.assessmentAnswer.create({ data: answerData }),
    prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: "COMPLETED",
        determinedLevel: estimatedLevel,
        confidence,
        questionsAsked: questionNumber,
        completedAt: new Date(),
        metadata: toJsonValue({
          bayesianState: state,
          result,
          learningGoal,
        }),
      },
    }),
    prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        currentLevel: estimatedLevel,
        learningGoal,
      },
      update: {
        currentLevel: estimatedLevel,
      },
    }),
  ]);

  return {
    isCorrect: lastIsCorrect,
    correctAnswer: lastItem.correctAnswer,
    explanation: lastItem.explanation,
    nextItem: null,
    result,
    questionNumber,
  };
}

/**
 * Check student answer against correct answer.
 * Case-insensitive, accent-tolerant for gap-fill.
 */
function checkAnswer(
  userAnswer: string,
  correctAnswer: string,
  exerciseType: "gap_fill" | "multiple_choice",
): boolean {
  if (exerciseType === "multiple_choice") {
    return userAnswer.trim() === correctAnswer.trim();
  }

  // Gap-fill: case-insensitive, normalize whitespace
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

  const userNorm = normalize(userAnswer);
  const correctNorm = normalize(correctAnswer);

  if (userNorm === correctNorm) return true;

  // Accent-tolerant: strip accents and compare as fallback
  const stripAccents = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return stripAccents(userNorm) === stripAccents(correctNorm);
}

/**
 * Generate an assessment item using the AI client.
 */
async function generateAssessmentItem(
  topic: {
    id: string;
    level: string;
    order: number;
    title: string;
    description: string;
  },
  exerciseType: "gap_fill" | "multiple_choice",
  userId: string,
): Promise<GeneratedGapFill | GeneratedMultipleChoice> {
  const prompt = buildAssessmentPrompt(
    topic as import("@/shared/types/grammar").GrammarTopic,
    exerciseType,
  );

  if (exerciseType === "gap_fill") {
    const { data } = await generateStructured<GeneratedGapFill>({
      endpoint: "assessment",
      system: CELESTIA_SYSTEM_PROMPT,
      userMessage: prompt,
      toolName: "generate_gap_fill",
      toolDescription:
        "Generate a gap-fill exercise for Spanish grammar assessment",
      schema: GAP_FILL_SCHEMA,
      userId,
    });
    return data;
  }

  const { data } = await generateStructured<GeneratedMultipleChoice>({
    endpoint: "assessment",
    system: CELESTIA_SYSTEM_PROMPT,
    userMessage: prompt,
    toolName: "generate_multiple_choice",
    toolDescription:
      "Generate a multiple-choice exercise for Spanish grammar assessment",
    schema: MULTIPLE_CHOICE_SCHEMA,
    userId,
  });
  return sanitizeMultipleChoice(data);
}

/**
 * Check if the hint is essentially the same as the correct answer.
 * If so, the hint gives away the answer and should be suppressed.
 */
function hintMatchesAnswer(hint: string, correctAnswer: string): boolean {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  return normalize(hint) === normalize(correctAnswer);
}

/**
 * Sanitize AI-generated gap-fill parts.
 * If the AI included underscores/blanks in before or after, re-split around them.
 */
function sanitizeGapFill(
  before: string,
  after: string,
): { before: string; after: string } {
  const blankPattern = /_{2,}|\.{3,}|…/;
  const beforeMatch = blankPattern.exec(before);
  const afterMatch = blankPattern.exec(after);

  if (beforeMatch) {
    // Underscores found in "before" — everything before them is real "before",
    // everything after them belongs to "after"
    const realBefore = before.slice(0, beforeMatch.index);
    const rest = before.slice(beforeMatch.index + beforeMatch[0].length);
    return { before: realBefore, after: rest + after };
  }

  if (afterMatch) {
    // Underscores found in "after" — everything after them is real "after",
    // everything before them belongs to "before"
    const rest = after.slice(0, afterMatch.index);
    const realAfter = after.slice(afterMatch.index + afterMatch[0].length);
    return { before: before + rest, after: realAfter };
  }

  return { before, after };
}

/**
 * Sanitize AI-generated multiple-choice data.
 * 1. Ensures all 4 options are distinct (de-duplicates).
 * 2. Detects answer leaking: if the correct answer text appears in the prompt, removes it.
 */
function sanitizeMultipleChoice(
  data: GeneratedMultipleChoice,
): GeneratedMultipleChoice {
  // De-duplicate options
  const seen = new Set<string>();
  const options = data.options.map((opt) => {
    let unique = opt;
    let suffix = 2;
    while (seen.has(unique)) {
      unique = `${opt} (${suffix})`;
      suffix++;
    }
    seen.add(unique);
    return unique;
  });

  // Fix answer leaking: if words from correctAnswer appear in prompt after ___
  let prompt = data.prompt;
  const blankIdx = prompt.indexOf("___");
  if (blankIdx !== -1) {
    const afterBlank = prompt.slice(blankIdx + 3).trim();
    const correctAnswer = data.options[data.correctIndex];
    // Check if the text after blank starts with a word from the correct answer
    const correctWords = correctAnswer.toLowerCase().split(/\s+/);
    const afterWords = afterBlank.toLowerCase().split(/\s+/);
    // Find how many leading words in afterBlank match trailing words in correctAnswer
    let leakedCount = 0;
    for (let i = 0; i < afterWords.length && i < correctWords.length; i++) {
      const afterClean = afterWords[i].replace(/[.,;:!?]/g, "");
      if (correctWords.includes(afterClean)) {
        leakedCount++;
      } else {
        break;
      }
    }
    if (leakedCount > 0) {
      // Remove leaked words from the text after blank
      const afterBlankWords = afterBlank.split(/\s+/);
      const cleaned = afterBlankWords.slice(leakedCount).join(" ");
      prompt = `${prompt.slice(0, blankIdx + 3)} ${cleaned}`;
    }
  }

  return {
    ...data,
    prompt,
    options,
    correctAnswer: options[data.correctIndex],
  };
}

/**
 * Convert server-side item to client-safe item (strips correctAnswer).
 */
function toClientItem(
  fullItem: AssessmentItem,
  aiItem: GeneratedGapFill | GeneratedMultipleChoice,
  exerciseType: "gap_fill" | "multiple_choice",
): AssessmentClientItem {
  if (exerciseType === "gap_fill") {
    const gf = aiItem as GeneratedGapFill;
    const { before, after } = sanitizeGapFill(gf.before, gf.after);
    return {
      topicId: fullItem.topicId,
      level: fullItem.level,
      exerciseType: "gap_fill",
      prompt: fullItem.prompt,
      options: null,
      before,
      after,
      hint: hintMatchesAnswer(gf.hint, fullItem.correctAnswer)
        ? undefined
        : gf.hint,
      translation: gf.translation,
    };
  }

  const mc = aiItem as GeneratedMultipleChoice;
  return {
    topicId: fullItem.topicId,
    level: fullItem.level,
    exerciseType: "multiple_choice",
    prompt: mc.prompt,
    options: mc.options,
  };
}
