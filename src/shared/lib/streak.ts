/**
 * Pure streak calculation.
 * Compares lastActivityDate to "today" to decide whether to increment,
 * maintain, or reset the streak.
 */

export interface StreakInput {
  lastActivityDate: Date | null;
  currentStreak: number;
  longestStreak: number;
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
}

/**
 * Calculate updated streak values based on the last activity date.
 * - Same calendar day → no change (already counted today)
 * - Yesterday → increment streak
 * - Older / null → reset to 1 (today counts as day 1)
 */
export function calculateStreak(
  input: StreakInput,
  now: Date = new Date(),
): StreakResult {
  const today = startOfDay(now);
  const lastActivity = input.lastActivityDate
    ? startOfDay(input.lastActivityDate)
    : null;

  let newStreak: number;

  if (lastActivity && lastActivity.getTime() === today.getTime()) {
    // Already recorded activity today — keep current streak
    newStreak = input.currentStreak;
  } else if (lastActivity && isYesterday(lastActivity, today)) {
    // Consecutive day — increment
    newStreak = input.currentStreak + 1;
  } else {
    // Gap or first activity ever — start fresh
    newStreak = 1;
  }

  return {
    currentStreak: newStreak,
    longestStreak: Math.max(input.longestStreak, newStreak),
    lastActivityDate: now,
  };
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isYesterday(lastActivity: Date, today: Date): boolean {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return lastActivity.getTime() === yesterday.getTime();
}
