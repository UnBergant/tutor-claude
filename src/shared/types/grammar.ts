export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const CEFR_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Numeric index for CEFR levels (0-5) used in θ calculations */
export const CEFR_LEVEL_INDEX: Record<CEFRLevel, number> = {
  A1: 0,
  A2: 1,
  B1: 2,
  B2: 3,
  C1: 4,
  C2: 5,
};

export interface GrammarTopic {
  id: string;
  level: CEFRLevel;
  /** 1-based position within the level */
  order: number;
  title: string;
  description: string;
}

/** Boundary between two adjacent CEFR levels */
export type LevelBoundary = "A1/A2" | "A2/B1" | "B1/B2" | "B2/C1" | "C1/C2";

export const LEVEL_BOUNDARIES: LevelBoundary[] = [
  "A1/A2",
  "A2/B1",
  "B1/B2",
  "B2/C1",
  "C1/C2",
];

/** Maps a boundary to the pair of levels it separates */
export const BOUNDARY_LEVELS: Record<
  LevelBoundary,
  [lower: CEFRLevel, upper: CEFRLevel]
> = {
  "A1/A2": ["A1", "A2"],
  "A2/B1": ["A2", "B1"],
  "B1/B2": ["B1", "B2"],
  "B2/C1": ["B2", "C1"],
  "C1/C2": ["C1", "C2"],
};
