/**
 * Gap map — Guttman-model inference for untested topics.
 *
 * After the assessment, we have θ (ability estimate) and SE.
 * For untested topics, we infer status based on their difficulty:
 * - Topics well below θ → inferred "mastered"
 * - Topics well above θ → inferred "not_mastered"
 * - Topics near θ (within 1 SE) → "untested" (priority for first lessons)
 *
 * Tested topics use actual responses.
 */

import { ALL_TOPICS, TOPIC_COUNT_BY_LEVEL } from "@/shared/data/grammar-topics";
import type { TopicAssessment, TopicStatus } from "@/shared/types/assessment";
import type { CEFRLevel } from "@/shared/types/grammar";
import { topicDifficulty } from "./bayesian";

interface TestedTopic {
  topicId: string;
  isCorrect: boolean;
}

/**
 * Build the complete gap map for all 111 topics.
 *
 * @param theta - Final ability estimate
 * @param se - Standard error of the estimate
 * @param testedTopics - Topics that were actually tested with results
 */
export function buildGapMap(
  theta: number,
  se: number,
  testedTopics: TestedTopic[],
): TopicAssessment[] {
  const testedMap = new Map(testedTopics.map((t) => [t.topicId, t.isCorrect]));

  return ALL_TOPICS.map((topic) => {
    // If actually tested, use the real result
    if (testedMap.has(topic.id)) {
      return {
        topicId: topic.id,
        level: topic.level,
        status: testedMap.get(topic.id) ? "mastered" : "not_mastered",
      };
    }

    // Infer status from θ vs topic difficulty (Guttman model)
    const difficulty = topicDifficulty(
      topic.level,
      topic.order,
      TOPIC_COUNT_BY_LEVEL[topic.level],
    );

    return {
      topicId: topic.id,
      level: topic.level,
      status: inferStatus(theta, se, difficulty),
    };
  });
}

/**
 * Infer topic status based on ability estimate and topic difficulty.
 */
function inferStatus(
  theta: number,
  se: number,
  difficulty: number,
): TopicStatus {
  const distance = theta - difficulty;

  // Well above difficulty → likely mastered
  if (distance > se) return "mastered";

  // Well below difficulty → likely not mastered
  if (distance < -se) return "not_mastered";

  // Near the boundary → uncertain, mark as untested for future lessons
  return "untested";
}

/**
 * Summarize gap map by level — useful for results display.
 */
export function summarizeGapMap(
  gapMap: TopicAssessment[],
): Record<
  CEFRLevel,
  { mastered: number; notMastered: number; untested: number; total: number }
> {
  const summary = {} as Record<
    CEFRLevel,
    { mastered: number; notMastered: number; untested: number; total: number }
  >;

  for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"] as CEFRLevel[]) {
    summary[level] = { mastered: 0, notMastered: 0, untested: 0, total: 0 };
  }

  for (const item of gapMap) {
    const s = summary[item.level];
    s.total++;
    if (item.status === "mastered") s.mastered++;
    else if (item.status === "not_mastered") s.notMastered++;
    else s.untested++;
  }

  return summary;
}
