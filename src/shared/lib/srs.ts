/**
 * SM-2 spaced repetition algorithm.
 * Based on SuperMemo 2 by Piotr Wozniak.
 *
 * Quality scale: 0-5
 *   0 — complete blackout
 *   1 — incorrect; correct answer remembered on reveal
 *   2 — incorrect; correct answer seemed easy to recall
 *   3 — correct with serious difficulty
 *   4 — correct after hesitation
 *   5 — perfect recall
 *
 * For vocabulary review (know / don't know):
 *   "Know"      → quality 4
 *   "Don't Know" → quality 1
 */

export interface SM2Input {
  quality: number; // 0-5
  repetitions: number;
  easeFactor: number;
  interval: number; // days
}

export interface SM2Result {
  repetitions: number;
  easeFactor: number;
  interval: number; // days
  nextReviewAt: Date;
}

const MIN_EASE_FACTOR = 1.3;

export function sm2(input: SM2Input): SM2Result {
  const { quality, repetitions, easeFactor, interval } = input;

  // Clamp quality to 0-5
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let newRepetitions: number;
  let newInterval: number;
  let newEaseFactor: number;

  if (q < 3) {
    // Failed recall — reset to beginning
    newRepetitions = 0;
    newInterval = 1;
    newEaseFactor = easeFactor; // Keep ease factor on failure
  } else {
    // Successful recall
    newRepetitions = repetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }

    // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    newEaseFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  }

  // Floor the ease factor
  newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return {
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
    interval: newInterval,
    nextReviewAt,
  };
}
