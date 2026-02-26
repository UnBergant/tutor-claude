import type { CEFRLevel } from "./grammar";

/** Self-assessment answer from the experience step */
export type ExperienceLevel =
  | "complete_beginner"
  | "know_basics"
  | "simple_conversations"
  | "comfortable_most_topics"
  | "advanced_near_fluent"
  | "near_native";

/** Maps experience self-assessment to initial θ₀ prior */
export const EXPERIENCE_THETA_MAP: Record<ExperienceLevel, number> = {
  complete_beginner: -2.0,
  know_basics: -1.0,
  simple_conversations: 0.0,
  comfortable_most_topics: 1.0,
  advanced_near_fluent: 2.0,
  near_native: 3.0,
};

export type LearningGoal =
  | "travel"
  | "relocation"
  | "work"
  | "academic"
  | "culture"
  | "personal";

/** Topic status in the gap map */
export type TopicStatus = "mastered" | "not_mastered" | "untested";

export interface TopicAssessment {
  topicId: string;
  level: CEFRLevel;
  status: TopicStatus;
}

export interface AssessmentResult {
  estimatedLevel: CEFRLevel;
  confidence: number;
  theta: number;
  gapMap: TopicAssessment[];
}

/**
 * Bayesian state stored server-side in Assessment.metadata.
 * Never exposed to the client.
 */
export interface BayesianState {
  /** Current ability estimate (mean of posterior) */
  theta: number;
  /** Standard deviation of posterior */
  se: number;
  /** Initial prior mean (preserved for EAP recomputation from scratch) */
  thetaPrior: number;
  /** Initial prior SD */
  sePrior: number;
  /** Responses so far: [topicId, isCorrect, difficulty, exerciseType][] */
  responses: [string, boolean, number, AssessmentExerciseType][];
  /** Current assessment phase: 1 = level-finding, 2 = gap-mapping */
  phase: 1 | 2;
  /** Classified level after phase 1 (set after item 6 or when confidence > 50%) */
  classifiedLevel: CEFRLevel | null;
  /** IDs of topics already tested (to avoid repeats) */
  testedTopicIds: string[];
}

/** Exercise type for assessment items */
export type AssessmentExerciseType = "gap_fill" | "multiple_choice";

/** Current item waiting for student response */
export interface AssessmentItem {
  topicId: string;
  level: CEFRLevel;
  exerciseType: AssessmentExerciseType;
  /** The sentence with a blank (gap_fill) or the question stem (MC) */
  prompt: string;
  /** MC options (null for gap_fill) */
  options: string[] | null;
  /** Server-side only, never sent to client */
  correctAnswer: string;
  /** Brief explanation shown after answering */
  explanation: string;
  /** Predicted difficulty for IRT calculation */
  difficulty: number;
}
