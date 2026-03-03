/**
 * Pure streak calculation.
 * Compares lastActivityDate to "today" to decide whether to increment,
 * maintain, or reset the streak.
 */

export interface StreakInput {
  lastActivityDate: Date | null;
  currentStreak: number;
  longestStreak: number;
  timezone?: string;
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
  const tz = input.timezone;
  const today = startOfDay(now, tz);
  const lastActivity = input.lastActivityDate
    ? startOfDay(input.lastActivityDate, tz)
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

function startOfDay(date: Date, timezone = "UTC"): Date {
  // Format date in target timezone, then parse back to get midnight in that timezone
  const str = date.toLocaleString("en-US", { timeZone: timezone });
  const local = new Date(str);
  local.setHours(0, 0, 0, 0);
  return local;
}

function isYesterday(lastActivity: Date, today: Date): boolean {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return lastActivity.getTime() === yesterday.getTime();
}
