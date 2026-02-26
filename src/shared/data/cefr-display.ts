import type { CEFRLevel } from "@/shared/types/grammar";

export const LEVEL_LABELS: Record<CEFRLevel, string> = {
  A1: "Breakthrough",
  A2: "Waystage",
  B1: "Threshold",
  B2: "Vantage",
  C1: "Effective Proficiency",
  C2: "Mastery",
};

export const LEVEL_COLORS: Record<CEFRLevel, string> = {
  A1: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  A2: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  B1: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  B2: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  C1: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  C2: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};
