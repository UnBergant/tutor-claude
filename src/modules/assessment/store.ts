import { create } from "zustand";
import type {
  AssessmentResult,
  ExperienceLevel,
  LearningGoal,
} from "@/shared/types/assessment";
import type { AssessmentClientItem } from "./actions";

type OnboardingStep =
  | "welcome"
  | "experience"
  | "goal"
  | "assessment"
  | "results";

interface AssessmentState {
  // Onboarding step management
  step: OnboardingStep;
  setStep: (step: OnboardingStep) => void;

  // User selections
  experienceLevel: ExperienceLevel | null;
  setExperienceLevel: (level: ExperienceLevel) => void;
  learningGoal: LearningGoal | null;
  setLearningGoal: (goal: LearningGoal) => void;

  // Assessment state
  assessmentId: string | null;
  setAssessmentId: (id: string) => void;
  currentItem: AssessmentClientItem | null;
  setCurrentItem: (item: AssessmentClientItem | null) => void;
  questionNumber: number;
  setQuestionNumber: (n: number) => void;

  // Loading & error states
  isGenerating: boolean;
  setIsGenerating: (loading: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Result
  result: AssessmentResult | null;
  setResult: (result: AssessmentResult) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  step: "welcome" as OnboardingStep,
  experienceLevel: null as ExperienceLevel | null,
  learningGoal: null as LearningGoal | null,
  assessmentId: null as string | null,
  currentItem: null as AssessmentClientItem | null,
  questionNumber: 0,
  isGenerating: false,
  isSubmitting: false,
  error: null as string | null,
  result: null as AssessmentResult | null,
};

export const useAssessmentStore = create<AssessmentState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setExperienceLevel: (experienceLevel) => set({ experienceLevel }),
  setLearningGoal: (learningGoal) => set({ learningGoal }),
  setAssessmentId: (assessmentId) => set({ assessmentId }),
  setCurrentItem: (currentItem) => set({ currentItem }),
  setQuestionNumber: (questionNumber) => set({ questionNumber }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setError: (error) => set({ error }),
  setResult: (result) => set({ result }),
  reset: () => set(initialState),
}));
