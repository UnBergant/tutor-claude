import { create } from "zustand";
import type {
  ExerciseClientItem,
  ExerciseFeedback,
} from "@/shared/types/exercise";
import type { LessonDetail } from "./actions";

type LessonPhase = "explanation" | "exercises" | "transition" | "complete";

interface BlockScore {
  correct: number;
  total: number;
}

interface LessonState {
  // Lesson data
  lesson: LessonDetail | null;
  currentBlockIndex: number;
  phase: LessonPhase;

  // Exercise state within current block
  blockExercises: ExerciseClientItem[];
  currentExerciseIndex: number;
  exerciseFeedback: ExerciseFeedback | null;

  // Score tracking per block
  blockScores: BlockScore[];

  // Loading states
  isGenerating: boolean;
  isSubmitting: boolean;
  isCompleting: boolean;
  error: string | null;

  // Actions
  initLesson: (lesson: LessonDetail) => void;
  startExercises: () => void;
  setExerciseFeedback: (feedback: ExerciseFeedback | null) => void;
  advanceExercise: () => void;
  recordAnswer: (isCorrect: boolean) => void;
  advanceToNextBlock: () => void;
  completeLesson: () => void;
  setIsGenerating: (v: boolean) => void;
  setIsSubmitting: (v: boolean) => void;
  setIsCompleting: (v: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  lesson: null as LessonDetail | null,
  currentBlockIndex: 0,
  phase: "explanation" as LessonPhase,
  blockExercises: [] as ExerciseClientItem[],
  currentExerciseIndex: 0,
  exerciseFeedback: null as ExerciseFeedback | null,
  blockScores: [] as BlockScore[],
  isGenerating: false,
  isSubmitting: false,
  isCompleting: false,
  error: null as string | null,
};

export const useLessonStore = create<LessonState>((set, get) => ({
  ...initialState,

  initLesson: (lesson) => {
    set({
      ...initialState,
      lesson,
      blockScores: lesson.blocks.map(() => ({ correct: 0, total: 0 })),
      phase: "explanation",
    });
  },

  startExercises: () => {
    const { lesson, currentBlockIndex } = get();
    if (!lesson) return;

    const block = lesson.blocks[currentBlockIndex];
    if (!block) return;

    set({
      phase: "exercises",
      blockExercises: block.exercises,
      currentExerciseIndex: 0,
      exerciseFeedback: null,
    });
  },

  setExerciseFeedback: (exerciseFeedback) => set({ exerciseFeedback }),

  recordAnswer: (isCorrect) => {
    const { blockScores, currentBlockIndex } = get();
    const updated = [...blockScores];
    const score = updated[currentBlockIndex];
    if (score) {
      updated[currentBlockIndex] = {
        correct: score.correct + (isCorrect ? 1 : 0),
        total: score.total + 1,
      };
    }
    set({ blockScores: updated });
  },

  advanceExercise: () => {
    const { blockExercises, currentExerciseIndex, lesson, currentBlockIndex } =
      get();
    const nextIndex = currentExerciseIndex + 1;

    if (nextIndex < blockExercises.length) {
      // More exercises in this block
      set({
        currentExerciseIndex: nextIndex,
        exerciseFeedback: null,
      });
    } else {
      // Block exercises done — transition or complete
      const isLastBlock = lesson
        ? currentBlockIndex >= lesson.blocks.length - 1
        : true;
      set({
        phase: isLastBlock ? "complete" : "transition",
        exerciseFeedback: null,
      });
    }
  },

  advanceToNextBlock: () => {
    const { currentBlockIndex } = get();
    set({
      currentBlockIndex: currentBlockIndex + 1,
      phase: "explanation",
      blockExercises: [],
      currentExerciseIndex: 0,
      exerciseFeedback: null,
    });
  },

  completeLesson: () => {
    set({ phase: "complete" });
  },

  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setIsCompleting: (isCompleting) => set({ isCompleting }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
