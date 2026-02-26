/** Data for a gap-fill exercise (sentence with blank) */
export interface GapFillData {
  /** Text before the blank */
  before: string;
  /** Text after the blank */
  after: string;
  /** Correct answer for the blank */
  correctAnswer: string;
}

/** Data for a multiple-choice exercise */
export interface MultipleChoiceData {
  /** The question or sentence stem */
  prompt: string;
  /** Four options */
  options: string[];
  /** Index of the correct option (0-3) */
  correctIndex: number;
}

/** Feedback shown after answering an exercise */
export interface ExerciseFeedback {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}
