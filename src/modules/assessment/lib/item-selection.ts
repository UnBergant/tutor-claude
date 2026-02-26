/**
 * Item selection for the adaptive assessment.
 *
 * Phase 1 (items 1-6): Select gateway topics at the most uncertain boundary.
 * Phase 2 (items 7-10): Select untested topics at classified level ± 1.
 */

import {
  GATEWAY_TOPICS,
  PRE_A1_GATEWAY,
  TOPIC_BY_ID,
  TOPIC_COUNT_BY_LEVEL,
  TOPICS_BY_LEVEL,
} from "@/shared/data/grammar-topics";
import type {
  AssessmentExerciseType,
  BayesianState,
} from "@/shared/types/assessment";
import type { CEFRLevel } from "@/shared/types/grammar";
import { CEFR_LEVEL_INDEX, CEFR_LEVELS } from "@/shared/types/grammar";
import { findMostUncertainBoundary, topicDifficulty } from "./bayesian";

export interface SelectedItem {
  topicId: string;
  level: CEFRLevel;
  exerciseType: AssessmentExerciseType;
  difficulty: number;
}

/**
 * Select the next topic to test in Phase 1 (level-finding).
 * Finds the most uncertain boundary, picks an untested gateway topic there.
 */
export function selectPhase1Topic(state: BayesianState): SelectedItem | null {
  // For very low θ, use pre-A1 gateway first
  if (state.theta < -1.5 && state.responses.length === 0) {
    const topicId = PRE_A1_GATEWAY.find(
      (id) => !state.testedTopicIds.includes(id),
    );
    if (topicId) {
      return buildItem(topicId, state);
    }
  }

  const boundary = findMostUncertainBoundary(state.theta);
  const gatewayIds = GATEWAY_TOPICS[boundary];

  // Pick first untested gateway topic at this boundary
  const topicId = gatewayIds.find((id) => !state.testedTopicIds.includes(id));

  if (topicId) {
    return buildItem(topicId, state);
  }

  // All gateway topics at this boundary tested — try adjacent boundaries
  const boundaryIdx = ["A1/A2", "A2/B1", "B1/B2", "B2/C1", "C1/C2"].indexOf(
    boundary,
  );

  for (const offset of [1, -1, 2, -2]) {
    const adjIdx = boundaryIdx + offset;
    if (adjIdx < 0 || adjIdx > 4) continue;
    const adjBoundary = ["A1/A2", "A2/B1", "B1/B2", "B2/C1", "C1/C2"][
      adjIdx
    ] as typeof GATEWAY_TOPICS extends Record<infer K, unknown> ? K : never;
    const adjIds = GATEWAY_TOPICS[adjBoundary];
    const adjTopicId = adjIds.find((id) => !state.testedTopicIds.includes(id));
    if (adjTopicId) {
      return buildItem(adjTopicId, state);
    }
  }

  // Extremely rare: all gateway topics exhausted — fall back to any untested topic near θ
  return selectFallbackTopic(state);
}

/**
 * Select the next topic in Phase 2 (gap mapping).
 * Tests untested topics at the classified level and one level below.
 */
export function selectPhase2Topic(state: BayesianState): SelectedItem | null {
  const classifiedLevel = state.classifiedLevel;
  if (!classifiedLevel) return null;

  const levelIdx = CEFR_LEVEL_INDEX[classifiedLevel];
  const levelsToProbe: CEFRLevel[] = [classifiedLevel];

  // Add one level below if it exists
  if (levelIdx > 0) {
    levelsToProbe.push(CEFR_LEVELS[levelIdx - 1]);
  }

  // Find untested topics at these levels, prioritizing foundational (lower order) topics
  for (const level of levelsToProbe) {
    const topics = TOPICS_BY_LEVEL[level];
    for (const topic of topics) {
      if (!state.testedTopicIds.includes(topic.id)) {
        return buildItem(topic.id, state);
      }
    }
  }

  // Also try one level above
  if (levelIdx < CEFR_LEVELS.length - 1) {
    const aboveLevel = CEFR_LEVELS[levelIdx + 1];
    const topics = TOPICS_BY_LEVEL[aboveLevel];
    for (const topic of topics) {
      if (!state.testedTopicIds.includes(topic.id)) {
        return buildItem(topic.id, state);
      }
    }
  }

  return null;
}

/**
 * Select the next item based on current assessment phase.
 */
export function selectNextTopic(state: BayesianState): SelectedItem | null {
  if (state.phase === 1) {
    return selectPhase1Topic(state);
  }
  return selectPhase2Topic(state);
}

/**
 * Determine exercise type — alternates between gap_fill and multiple_choice.
 */
export function nextExerciseType(
  responseCount: number,
): AssessmentExerciseType {
  return responseCount % 2 === 0 ? "gap_fill" : "multiple_choice";
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function buildItem(topicId: string, state: BayesianState): SelectedItem {
  const topic = TOPIC_BY_ID.get(topicId);
  if (!topic) throw new Error(`Unknown topic: ${topicId}`);
  const totalInLevel = TOPIC_COUNT_BY_LEVEL[topic.level];
  const difficulty = topicDifficulty(topic.level, topic.order, totalInLevel);
  const exerciseType = nextExerciseType(state.responses.length);

  return {
    topicId,
    level: topic.level,
    exerciseType,
    difficulty,
  };
}

function selectFallbackTopic(state: BayesianState): SelectedItem | null {
  const classifiedLevel = state.classifiedLevel ?? "A1";
  const levelIdx = CEFR_LEVEL_INDEX[classifiedLevel];

  // Spiral outward from classified level: 0, +1, -1, +2, -2, ...
  for (let offset = 0; offset < CEFR_LEVELS.length; offset++) {
    const candidates = offset === 0 ? [0] : [offset, -offset];
    for (const delta of candidates) {
      const idx = levelIdx + delta;
      if (idx < 0 || idx >= CEFR_LEVELS.length) continue;
      const level = CEFR_LEVELS[idx];
      const topics = TOPICS_BY_LEVEL[level];
      for (const topic of topics) {
        if (!state.testedTopicIds.includes(topic.id)) {
          return buildItem(topic.id, state);
        }
      }
    }
  }

  return null;
}
