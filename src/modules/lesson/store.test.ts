import { beforeEach, describe, expect, it } from "vitest";
import type { LessonDetail } from "./actions";
import { useLessonStore } from "./store";

const mockLesson: LessonDetail = {
  id: "lesson-1",
  title: "Test Lesson",
  description: "A test lesson",
  topicId: "topic-1",
  estimatedMinutes: 15,
  order: 1,
  blocks: [
    {
      id: "block-1",
      type: "NEW_MATERIAL",
      title: "Block 1",
      explanation: "Some explanation",
      order: 1,
      exercises: [
        {
          exerciseId: "ex-1",
          type: "gap_fill",
          before: "Yo ",
          after: " español.",
          hint: "hablar",
          translation: "I speak Spanish.",
        },
        {
          exerciseId: "ex-2",
          type: "multiple_choice",
          prompt: "¿Cómo estás?",
          options: ["Bien", "Mal", "Así así", "Regular"],
        },
      ],
    },
    {
      id: "block-2",
      type: "REVIEW",
      title: "Block 2",
      explanation: "Review explanation",
      order: 2,
      exercises: [
        {
          exerciseId: "ex-3",
          type: "gap_fill",
          before: "Ella ",
          after: " una casa.",
          hint: "tener",
          translation: "She has a house.",
        },
      ],
    },
  ],
  progress: { status: "NOT_STARTED", score: null },
};

describe("useLessonStore", () => {
  beforeEach(() => {
    useLessonStore.getState().reset();
  });

  it("initializes with default state", () => {
    const state = useLessonStore.getState();
    expect(state.lesson).toBe(null);
    expect(state.currentBlockIndex).toBe(0);
    expect(state.phase).toBe("explanation");
  });

  it("initLesson sets lesson and block scores", () => {
    useLessonStore.getState().initLesson(mockLesson);
    const state = useLessonStore.getState();
    expect(state.lesson).toEqual(mockLesson);
    expect(state.blockScores).toHaveLength(2);
    expect(state.blockScores[0]).toEqual({ correct: 0, total: 0 });
    expect(state.phase).toBe("explanation");
  });

  it("startExercises transitions to exercises phase", () => {
    const store = useLessonStore.getState();
    store.initLesson(mockLesson);
    store.startExercises();
    const state = useLessonStore.getState();
    expect(state.phase).toBe("exercises");
    expect(state.blockExercises).toHaveLength(2);
    expect(state.currentExerciseIndex).toBe(0);
  });

  it("recordAnswer updates block score", () => {
    const store = useLessonStore.getState();
    store.initLesson(mockLesson);
    store.startExercises();
    store.recordAnswer(true);
    expect(useLessonStore.getState().blockScores[0]).toEqual({
      correct: 1,
      total: 1,
    });
    store.recordAnswer(false);
    expect(useLessonStore.getState().blockScores[0]).toEqual({
      correct: 1,
      total: 2,
    });
  });

  it("advanceExercise moves to next exercise", () => {
    const store = useLessonStore.getState();
    store.initLesson(mockLesson);
    store.startExercises();
    store.advanceExercise();
    expect(useLessonStore.getState().currentExerciseIndex).toBe(1);
  });

  it("advanceExercise transitions to next block when exercises done", () => {
    const store = useLessonStore.getState();
    store.initLesson(mockLesson);
    store.startExercises();
    store.advanceExercise(); // ex-1 → ex-2
    store.advanceExercise(); // ex-2 → block done → transition
    expect(useLessonStore.getState().phase).toBe("transition");
  });

  it("advanceExercise transitions to complete on last block", () => {
    const store = useLessonStore.getState();
    store.initLesson(mockLesson);

    // Move to block 2
    store.startExercises();
    store.advanceExercise(); // ex-1
    store.advanceExercise(); // ex-2 → transition
    store.advanceToNextBlock(); // block-2

    store.startExercises();
    store.advanceExercise(); // ex-3 → complete (last block)
    expect(useLessonStore.getState().phase).toBe("complete");
  });

  it("advanceToNextBlock increments block index", () => {
    const store = useLessonStore.getState();
    store.initLesson(mockLesson);
    store.advanceToNextBlock();
    expect(useLessonStore.getState().currentBlockIndex).toBe(1);
    expect(useLessonStore.getState().phase).toBe("explanation");
  });

  it("reset returns to initial state", () => {
    const store = useLessonStore.getState();
    store.initLesson(mockLesson);
    store.startExercises();
    store.reset();
    const state = useLessonStore.getState();
    expect(state.lesson).toBe(null);
    expect(state.phase).toBe("explanation");
    expect(state.blockExercises).toHaveLength(0);
  });

  it("setError and setIsSubmitting update flags", () => {
    const store = useLessonStore.getState();
    store.setError("Something went wrong");
    expect(useLessonStore.getState().error).toBe("Something went wrong");
    store.setIsSubmitting(true);
    expect(useLessonStore.getState().isSubmitting).toBe(true);
  });
});
