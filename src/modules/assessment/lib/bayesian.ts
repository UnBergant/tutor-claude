/**
 * Bayesian adaptive assessment — pure math functions.
 *
 * Uses a 1PL IRT (Rasch-like) model with fixed discrimination and guessing:
 * - discrimination a = 1.0
 * - guessing c = 0.25 (MC) or 0.0 (gap-fill)
 *
 * Posterior is approximated as a Gaussian, updated after each item.
 * EAP (Expected A Posteriori) estimation is used instead of MLE
 * because it's stable even with all-correct or all-wrong responses.
 */

import type {
  AssessmentExerciseType,
  BayesianState,
} from "@/shared/types/assessment";
import type { CEFRLevel, LevelBoundary } from "@/shared/types/grammar";

/** θ range for each CEFR level */
const LEVEL_THETA_RANGES: Record<CEFRLevel, { base: number; span: number }> = {
  A1: { base: -2.0, span: 1.0 },
  A2: { base: -1.0, span: 1.0 },
  B1: { base: 0.0, span: 1.0 },
  B2: { base: 1.0, span: 1.0 },
  C1: { base: 2.0, span: 1.0 },
  C2: { base: 3.0, span: 1.0 },
};

const DISCRIMINATION = 1.0;
const GUESSING_MC = 0.25;
const GUESSING_GAP = 0.0;

/** Number of quadrature points for EAP numerical integration */
const QUAD_POINTS = 61;
const QUAD_MIN = -4.0;
const QUAD_MAX = 6.0;

// ──────────────────────────────────────────────
// Core IRT functions
// ──────────────────────────────────────────────

/**
 * 3PL IRT probability of correct response.
 * P(correct | θ, b, a, c) = c + (1 - c) / (1 + exp(-a(θ - b)))
 */
export function irtProbability(
  theta: number,
  difficulty: number,
  exerciseType: AssessmentExerciseType,
): number {
  const c = exerciseType === "multiple_choice" ? GUESSING_MC : GUESSING_GAP;
  const logistic = 1 / (1 + Math.exp(-DISCRIMINATION * (theta - difficulty)));
  return c + (1 - c) * logistic;
}

/**
 * Compute predicted item difficulty from topic position in the grammar tree.
 * difficulty = level_base + (order - 1) / total_topics_in_level * level_span
 */
export function topicDifficulty(
  level: CEFRLevel,
  order: number,
  totalInLevel: number,
): number {
  const { base, span } = LEVEL_THETA_RANGES[level];
  return base + ((order - 1) / Math.max(totalInLevel - 1, 1)) * span;
}

// ──────────────────────────────────────────────
// Gaussian prior/posterior
// ──────────────────────────────────────────────

/** Normal PDF (unnormalized is fine for relative weighting) */
function gaussianPdf(x: number, mean: number, sd: number): number {
  const z = (x - mean) / sd;
  return Math.exp(-0.5 * z * z);
}

/**
 * Compute the posterior distribution and return EAP (mean) and SE (std dev).
 *
 * Uses numerical integration (Gaussian quadrature) over θ grid.
 * posterior(θ) ∝ prior(θ) × ∏ P(response_i | θ)
 */
export function computePosterior(
  priorMean: number,
  priorSd: number,
  responses: [string, boolean, number][], // [topicId, isCorrect, difficulty]
  exerciseTypes: AssessmentExerciseType[],
): { theta: number; se: number } {
  const step = (QUAD_MAX - QUAD_MIN) / (QUAD_POINTS - 1);
  let sumWeight = 0;
  let sumTheta = 0;
  let sumThetaSq = 0;

  for (let i = 0; i < QUAD_POINTS; i++) {
    const theta = QUAD_MIN + i * step;

    // Prior
    let logWeight = Math.log(gaussianPdf(theta, priorMean, priorSd));

    // Likelihood from all responses
    for (let j = 0; j < responses.length; j++) {
      const [, isCorrect, difficulty] = responses[j];
      const exType = exerciseTypes[j] ?? "gap_fill";
      const p = irtProbability(theta, difficulty, exType);
      logWeight += isCorrect ? Math.log(p) : Math.log(1 - p);
    }

    const weight = Math.exp(logWeight);
    sumWeight += weight;
    sumTheta += weight * theta;
    sumThetaSq += weight * theta * theta;
  }

  const eap = sumTheta / sumWeight;
  const variance = sumThetaSq / sumWeight - eap * eap;
  const se = Math.sqrt(Math.max(variance, 0.01)); // Floor to avoid zero SE

  return { theta: eap, se };
}

/**
 * Full Bayesian update: given current state and a new response, return updated state.
 */
export function bayesianUpdate(
  state: BayesianState,
  topicId: string,
  isCorrect: boolean,
  difficulty: number,
  exerciseType: AssessmentExerciseType,
): BayesianState {
  const responses: [string, boolean, number][] = [
    ...state.responses,
    [topicId, isCorrect, difficulty],
  ];

  // Reconstruct exercise types from response count
  // We don't store exercise types in responses to keep the array lean;
  // for EAP we use uniform assumption which is acceptable for classification
  const exerciseTypes = responses.map((_, i) =>
    i % 2 === 0 ? ("gap_fill" as const) : ("multiple_choice" as const),
  );
  // Override the latest with the actual type
  exerciseTypes[exerciseTypes.length - 1] = exerciseType;

  const { theta, se } = computePosterior(
    state.theta,
    state.se,
    responses,
    exerciseTypes,
  );

  const itemCount = responses.length;
  const testedTopicIds = [...state.testedTopicIds, topicId];

  // Determine phase transition
  let phase = state.phase;
  let classifiedLevel = state.classifiedLevel;

  if (phase === 1 && (itemCount >= 6 || se < 0.5)) {
    // Transition to phase 2: classify level
    classifiedLevel = classifyLevel(theta);
    phase = 2;
  }

  return {
    theta,
    se,
    responses,
    phase,
    classifiedLevel,
    testedTopicIds,
  };
}

// ──────────────────────────────────────────────
// Level classification
// ──────────────────────────────────────────────

/**
 * Classify θ estimate into a CEFR level.
 * Each level spans 1.0 θ units: A1 = [-2, -1), A2 = [-1, 0), etc.
 */
export function classifyLevel(theta: number): CEFRLevel {
  if (theta < -1.0) return "A1";
  if (theta < 0.0) return "A2";
  if (theta < 1.0) return "B1";
  if (theta < 2.0) return "B2";
  if (theta < 3.0) return "C1";
  return "C2";
}

/**
 * Compute confidence as the posterior probability of the classified level.
 * Uses the same quadrature grid as EAP.
 */
export function levelConfidence(
  theta: number,
  se: number,
  level: CEFRLevel,
): number {
  const { base, span } = LEVEL_THETA_RANGES[level];
  const lower = base;
  const upper = base + span;

  // Integrate Gaussian from lower to upper
  const steps = 100;
  const dx = (upper - lower) / steps;
  let integral = 0;
  let totalIntegral = 0;

  // Compute total area over full range for normalization
  const fullDx = (QUAD_MAX - QUAD_MIN) / 1000;
  for (let i = 0; i <= 1000; i++) {
    const x = QUAD_MIN + i * fullDx;
    totalIntegral += gaussianPdf(x, theta, se) * fullDx;
  }

  for (let i = 0; i <= steps; i++) {
    const x = lower + i * dx;
    integral += gaussianPdf(x, theta, se) * dx;
  }

  return Math.min(integral / totalIntegral, 1.0);
}

/**
 * Find the most uncertain boundary — the one closest to the current θ estimate.
 *
 * Boundary θ values: A1/A2 = -1.0, A2/B1 = 0.0, B1/B2 = 1.0, B2/C1 = 2.0, C1/C2 = 3.0
 * The nearest boundary is where a test item gives the most discrimination information.
 */
export function findMostUncertainBoundary(
  theta: number,
  _se: number,
): LevelBoundary {
  const boundaryThetas: [LevelBoundary, number][] = [
    ["A1/A2", -1.0],
    ["A2/B1", 0.0],
    ["B1/B2", 1.0],
    ["B2/C1", 2.0],
    ["C1/C2", 3.0],
  ];

  let minDist = Infinity;
  let closest: LevelBoundary = "A1/A2";

  for (const [boundary, boundaryTheta] of boundaryThetas) {
    const dist = Math.abs(theta - boundaryTheta);
    if (dist < minDist) {
      minDist = dist;
      closest = boundary;
    }
  }

  return closest;
}

/**
 * Create initial Bayesian state from the experience-level self-assessment prior.
 */
export function createInitialState(thetaPrior: number): BayesianState {
  return {
    theta: thetaPrior,
    se: 1.5, // Wide initial variance
    responses: [],
    phase: 1,
    classifiedLevel: null,
    testedTopicIds: [],
  };
}

/** Maximum number of assessment items */
export const MAX_ITEMS = 10;

/** Items in phase 1 (level-finding) */
export const PHASE_1_ITEMS = 6;

export { LEVEL_THETA_RANGES };
