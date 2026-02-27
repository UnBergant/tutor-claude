import type { TopicAssessment } from "@/shared/types/assessment";
import type { CEFRLevel } from "@/shared/types/grammar";

export interface LevelProgress {
  level: CEFRLevel;
  mastered: number;
  total: number;
}

/**
 * Compute per-CEFR-level progress from an assessment gap map.
 * Returns mastered/total counts for each level (A1–C2).
 */
export function computeLevelProgress(
  gapMap: TopicAssessment[],
): LevelProgress[] {
  const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const map: Record<string, { mastered: number; total: number }> = {};

  for (const level of levels) {
    map[level] = { mastered: 0, total: 0 };
  }

  for (const item of gapMap) {
    const m = map[item.level];
    if (m) {
      m.total++;
      if (item.status === "mastered") m.mastered++;
    }
  }

  return levels.map((level) => ({
    level,
    mastered: map[level].mastered,
    total: map[level].total,
  }));
}
