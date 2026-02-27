import { create } from "zustand";
import type {
  ExerciseClientItem,
  ExerciseFeedback,
} from "@/shared/types/exercise";

interface ExerciseState {
  // Exercise queue
  exercises: ExerciseClientItem[];
  currentIndex: number;

  // Current exercise
  currentExercise: ExerciseClientItem | null;

  // Feedback (null while answering, populated after submit, cleared on next)
  feedback: ExerciseFeedback | null;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Score tracking
  correctCount: number;
  totalAnswered: number;

  // Actions
  setExercises: (exercises: ExerciseClientItem[]) => void;
  setCurrentExercise: (exercise: ExerciseClientItem | null) => void;
  setFeedback: (feedback: ExerciseFeedback | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
  incrementCorrect: () => void;
  incrementTotal: () => void;
  advanceToNext: () => void;
  reset: () => void;
}

const initialState = {
  exercises: [] as ExerciseClientItem[],
  currentIndex: 0,
  currentExercise: null as ExerciseClientItem | null,
  feedback: null as ExerciseFeedback | null,
  isLoading: false,
  isSubmitting: false,
  error: null as string | null,
  correctCount: 0,
  totalAnswered: 0,
};

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  ...initialState,

  setExercises: (exercises) => {
    set({
      exercises,
      currentIndex: 0,
      currentExercise: exercises[0] ?? null,
    });
  },

  setCurrentExercise: (currentExercise) => set({ currentExercise }),

  setFeedback: (feedback) => set({ feedback }),

  setIsLoading: (isLoading) => set({ isLoading }),

  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

  setError: (error) => set({ error }),

  incrementCorrect: () => set((s) => ({ correctCount: s.correctCount + 1 })),

  incrementTotal: () => set((s) => ({ totalAnswered: s.totalAnswered + 1 })),

  advanceToNext: () => {
    const { exercises, currentIndex } = get();
    const nextIndex = currentIndex + 1;

    if (nextIndex < exercises.length) {
      set({
        currentIndex: nextIndex,
        currentExercise: exercises[nextIndex],
        feedback: null,
      });
    } else {
      // All exercises done — currentExercise becomes null
      set({
        currentIndex: nextIndex,
        currentExercise: null,
        feedback: null,
      });
    }
  },

  reset: () => set(initialState),
}));
