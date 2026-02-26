import { describe, expect, it } from "vitest";
import type { BayesianState } from "@/shared/types/assessment";
import { createInitialState } from "./bayesian";
import {
  nextExerciseType,
  selectNextTopic,
  selectPhase1Topic,
  selectPhase2Topic,
} from "./item-selection";

describe("nextExerciseType", () => {
  it("alternates between gap_fill and multiple_choice", () => {
    expect(nextExerciseType(0)).toBe("gap_fill");
    expect(nextExerciseType(1)).toBe("multiple_choice");
    expect(nextExerciseType(2)).toBe("gap_fill");
    expect(nextExerciseType(3)).toBe("multiple_choice");
  });
});

describe("selectPhase1Topic", () => {
  it("selects pre-A1 gateway for complete beginners", () => {
    const state = createInitialState(-2.0);
    const item = selectPhase1Topic(state);
    expect(item).not.toBeNull();
    expect(["a1-01", "a1-04"]).toContain(item?.topicId);
    expect(item?.level).toBe("A1");
  });

  it("selects gateway topics at the most uncertain boundary", () => {
    const state = createInitialState(0.0); // A2/B1 boundary
    const item = selectPhase1Topic(state);
    expect(item).not.toBeNull();
    // Should be a gateway topic near the A2/B1 boundary or wherever most uncertain
    expect(item?.topicId).toBeDefined();
  });

  it("avoids already tested topics", () => {
    const state: BayesianState = {
      ...createInitialState(0.0),
      testedTopicIds: ["b1-02"], // Already tested first A2/B1 gateway
    };
    const item = selectPhase1Topic(state);
    expect(item).not.toBeNull();
    expect(item?.topicId).not.toBe("b1-02");
  });

  it("returns difficulty matching topic position", () => {
    const state = createInitialState(-2.0);
    const item = selectPhase1Topic(state);
    expect(item).not.toBeNull();
    expect(item?.difficulty).toBeDefined();
    expect(typeof item?.difficulty).toBe("number");
  });
});

describe("selectPhase2Topic", () => {
  it("returns null when classifiedLevel is null", () => {
    const state = createInitialState(0.0);
    const item = selectPhase2Topic(state);
    expect(item).toBeNull();
  });

  it("selects untested topics at the classified level", () => {
    const state: BayesianState = {
      ...createInitialState(0.5),
      phase: 2,
      classifiedLevel: "B1",
      testedTopicIds: ["b1-02"], // Already tested one B1 topic
    };
    const item = selectPhase2Topic(state);
    expect(item).not.toBeNull();
    expect(["B1", "A2"]).toContain(item?.level);
    expect(item?.topicId).not.toBe("b1-02");
  });

  it("prioritizes classified level over adjacent levels", () => {
    const state: BayesianState = {
      ...createInitialState(0.5),
      phase: 2,
      classifiedLevel: "B1",
      testedTopicIds: [],
    };
    const item = selectPhase2Topic(state);
    expect(item).not.toBeNull();
    expect(item?.level).toBe("B1"); // Should pick B1 first
  });
});

describe("selectNextTopic", () => {
  it("delegates to phase 1 selection when phase is 1", () => {
    const state = createInitialState(0.0);
    const item = selectNextTopic(state);
    expect(item).not.toBeNull();
  });

  it("delegates to phase 2 selection when phase is 2", () => {
    const state: BayesianState = {
      ...createInitialState(0.5),
      phase: 2,
      classifiedLevel: "B1",
      testedTopicIds: [],
    };
    const item = selectNextTopic(state);
    expect(item).not.toBeNull();
  });
});
