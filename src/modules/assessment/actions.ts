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
import {
  hintMatchesAnswer,
  sanitizeGapFill,
  sanitizeMultipleChoice,
} from "@/shared/lib/ai/sanitize";
import { auth } from "@/shared/lib/auth";
import { checkAnswer } from "@/shared/lib/exercise/answer-check";
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
  rebuildState,
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
  assessmentId: z.string().cuid(),
  answer: z.string().min(1).max(500),
});

const goBackSchema = z.object({
  assessmentId: z.string().cuid(),
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
  /** Whether the user can go back to this question */
  canGoBack: boolean;
}

export interface GoBackResult {
  /** The previous item to re-display */
  item: AssessmentClientItem;
  /** The user's previous answer (for prefill) */
  previousAnswer: string;
  /** The question number we're going back to (1-based) */
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
          previousItem: currentItem,
          previousAnswer: answer,
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
    canGoBack: true,
  };
}

/**
 * Go back one step in the assessment: undo the last answer and re-display
 * the previous question with the user's previous answer prefilled.
 */
export async function goBackAssessment(
  assessmentId: string,
): Promise<GoBackResult> {
  goBackSchema.parse({ assessmentId });

  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

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
    previousItem?: AssessmentItem;
    previousAnswer?: string;
    learningGoal: string;
    experienceLevel: string;
  };

  if (!meta.previousItem || !meta.previousAnswer) {
    throw new Error("Cannot go back: no previous item");
  }

  const { bayesianState, previousItem, previousAnswer } = meta;

  // Remove last response and rebuild state
  const truncatedResponses = bayesianState.responses.slice(0, -1);
  const rebuiltState = rebuildState(
    bayesianState.thetaPrior,
    bayesianState.sePrior,
    truncatedResponses,
  );

  const questionNumber = truncatedResponses.length + 1;

  // Atomically: delete last answer row + update metadata
  // Use interactive transaction to find the exact row (same topic can appear twice)
  await prisma.$transaction(async (tx) => {
    // Find the most recent answer for this assessment + topic
    const lastAnswer = await tx.assessmentAnswer.findFirst({
      where: { assessmentId, topicId: previousItem.topicId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (lastAnswer) {
      await tx.assessmentAnswer.delete({ where: { id: lastAnswer.id } });
    }
    await tx.assessment.update({
      where: { id: assessmentId },
      data: {
        questionsAsked: truncatedResponses.length,
        metadata: toJsonValue({
          ...meta,
          bayesianState: rebuiltState,
          currentItem: previousItem,
          previousItem: undefined,
          previousAnswer: undefined,
        }),
      },
    });
  });

  // Convert previousItem to client item
  const clientItem = toClientItemFromFull(previousItem);

  return {
    item: clientItem,
    previousAnswer,
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

  const base = {
    topicId: selected.topicId,
    level: selected.level,
    exerciseType: selected.exerciseType,
    difficulty: selected.difficulty,
  };

  let fullItem: AssessmentItem;
  if (selected.exerciseType === "gap_fill") {
    const gf = aiItem as GeneratedGapFill;
    fullItem = {
      ...base,
      prompt: `${gf.before}___${gf.after}`,
      options: null,
      correctAnswer: gf.correctAnswer,
      explanation: gf.explanation,
      hint: hintMatchesAnswer(gf.hint, gf.correctAnswer)
        ? TOPIC_BY_ID.get(selected.topicId)?.title
        : gf.hint,
      translation: gf.translation,
    };
  } else {
    const mc = aiItem as GeneratedMultipleChoice;
    fullItem = {
      ...base,
      prompt: mc.prompt,
      options: mc.options,
      correctAnswer: mc.correctAnswer,
      explanation: mc.explanation,
    };
  }

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
    canGoBack: false,
  };
}

// checkAnswer() moved to @/modules/exercise/lib/answer-check.ts (shared)

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

// sanitizeGapFill, sanitizeMultipleChoice, hintMatchesAnswer
// → imported from @/shared/lib/ai/sanitize

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
      hint: fullItem.hint,
      translation: fullItem.translation,
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

/**
 * Convert a stored AssessmentItem to a client item.
 * Used by goBackAssessment where we don't have the original AI response.
 * The prompt field already contains the full text, so we parse before/after from it.
 */
function toClientItemFromFull(item: AssessmentItem): AssessmentClientItem {
  if (item.exerciseType === "gap_fill") {
    // prompt format: "before___after"
    const parts = item.prompt.split("___");
    return {
      topicId: item.topicId,
      level: item.level,
      exerciseType: "gap_fill",
      prompt: item.prompt,
      options: null,
      before: parts[0] ?? "",
      after: parts[1] ?? "",
      hint: item.hint,
      translation: item.translation,
    };
  }

  return {
    topicId: item.topicId,
    level: item.level,
    exerciseType: "multiple_choice",
    prompt: item.prompt,
    options: item.options,
  };
}
