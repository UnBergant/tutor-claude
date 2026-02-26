import { describe, expect, it } from "vitest";
import {
  bayesianUpdate,
  classifyLevel,
  computePosterior,
  createInitialState,
  findMostUncertainBoundary,
  irtProbability,
  levelConfidence,
  topicDifficulty,
} from "./bayesian";

describe("irtProbability", () => {
  it("returns ~0.5 when θ equals difficulty (gap_fill)", () => {
    const p = irtProbability(1.0, 1.0, "gap_fill");
    expect(p).toBeCloseTo(0.5, 1);
  });

  it("returns higher probability when θ > difficulty", () => {
    const p = irtProbability(2.0, 0.0, "gap_fill");
    expect(p).toBeGreaterThan(0.85);
  });

  it("returns lower probability when θ < difficulty", () => {
    const p = irtProbability(-1.0, 1.0, "gap_fill");
    expect(p).toBeLessThan(0.2);
  });

  it("accounts for guessing in multiple_choice (floor at 0.25)", () => {
    const p = irtProbability(-5.0, 5.0, "multiple_choice");
    expect(p).toBeGreaterThanOrEqual(0.25);
  });

  it("gap_fill has no guessing floor", () => {
    const p = irtProbability(-5.0, 5.0, "gap_fill");
    expect(p).toBeLessThan(0.01);
  });
});

describe("topicDifficulty", () => {
  it("returns level_base for the first topic in a level", () => {
    expect(topicDifficulty("A1", 1, 24)).toBeCloseTo(-2.0, 5);
  });

  it("returns level_base + span for the last topic in a level", () => {
    expect(topicDifficulty("A1", 24, 24)).toBeCloseTo(-1.0, 5);
  });

  it("returns midpoint for a middle topic", () => {
    // B1 has base=0, span=1, 19 topics. Topic 10 → 0 + 9/18 * 1 = 0.5
    expect(topicDifficulty("B1", 10, 19)).toBeCloseTo(0.5, 5);
  });

  it("C2 last topic is at the top of the scale", () => {
    expect(topicDifficulty("C2", 15, 15)).toBeCloseTo(4.0, 5);
  });
});

describe("computePosterior", () => {
  it("returns prior when there are no responses", () => {
    const { theta, se } = computePosterior(0.0, 1.5, [], []);
    expect(theta).toBeCloseTo(0.0, 0);
    expect(se).toBeCloseTo(1.5, 0);
  });

  it("shifts θ upward after correct response", () => {
    const { theta } = computePosterior(
      0.0,
      1.5,
      [["a2-01", true, 0.0]],
      ["gap_fill"],
    );
    expect(theta).toBeGreaterThan(0.0);
  });

  it("shifts θ downward after incorrect response", () => {
    const { theta } = computePosterior(
      0.0,
      1.5,
      [["a2-01", false, 0.0]],
      ["gap_fill"],
    );
    expect(theta).toBeLessThan(0.0);
  });

  it("reduces SE after multiple responses", () => {
    const { se: se0 } = computePosterior(0.0, 1.5, [], []);
    const { se: se3 } = computePosterior(
      0.0,
      1.5,
      [
        ["a2-01", true, 0.0],
        ["b1-02", true, 0.5],
        ["b2-09", false, 1.5],
      ],
      ["gap_fill", "multiple_choice", "gap_fill"],
    );
    expect(se3).toBeLessThan(se0);
  });
});

describe("bayesianUpdate", () => {
  it("transitions to phase 2 after 6 items", () => {
    let state = createInitialState(0.0);

    for (let i = 0; i < 6; i++) {
      state = bayesianUpdate(state, `topic-${i}`, i < 3, 0.0, "gap_fill");
    }

    expect(state.phase).toBe(2);
    expect(state.classifiedLevel).not.toBeNull();
    expect(state.responses).toHaveLength(6);
    expect(state.testedTopicIds).toHaveLength(6);
  });

  it("stays in phase 1 before 6 items", () => {
    let state = createInitialState(0.0);
    state = bayesianUpdate(state, "a2-01", true, -1.0, "gap_fill");

    expect(state.phase).toBe(1);
    expect(state.classifiedLevel).toBeNull();
  });
});

describe("classifyLevel", () => {
  it("classifies low θ as A1", () => {
    expect(classifyLevel(-2.5)).toBe("A1");
    expect(classifyLevel(-1.5)).toBe("A1");
  });

  it("classifies θ around 0 as B1", () => {
    expect(classifyLevel(0.5)).toBe("B1");
  });

  it("classifies high θ as C2", () => {
    expect(classifyLevel(3.5)).toBe("C2");
  });

  it("maps boundary values correctly", () => {
    expect(classifyLevel(-1.0)).toBe("A2"); // -1.0 is the A2 lower bound
    expect(classifyLevel(0.0)).toBe("B1");
    expect(classifyLevel(1.0)).toBe("B2");
    expect(classifyLevel(2.0)).toBe("C1");
    expect(classifyLevel(3.0)).toBe("C2");
  });
});

describe("levelConfidence", () => {
  it("returns high confidence when θ is centered in a level", () => {
    // θ = 0.5 with small SE should give high confidence for B1
    const conf = levelConfidence(0.5, 0.3, "B1");
    expect(conf).toBeGreaterThan(0.7);
  });

  it("returns low confidence when θ is at a boundary", () => {
    // θ = 0.0 is exactly at A2/B1 boundary, wide SE
    const conf = levelConfidence(0.0, 1.0, "B1");
    expect(conf).toBeLessThan(0.5);
  });
});

describe("findMostUncertainBoundary", () => {
  it("returns A1/A2 for low θ", () => {
    expect(findMostUncertainBoundary(-1.5, 0.5)).toBe("A1/A2");
  });

  it("returns B1/B2 for middle θ", () => {
    expect(findMostUncertainBoundary(1.0, 0.5)).toBe("B1/B2");
  });

  it("returns C1/C2 for high θ", () => {
    expect(findMostUncertainBoundary(3.0, 0.5)).toBe("C1/C2");
  });
});

describe("createInitialState", () => {
  it("creates state with correct prior", () => {
    const state = createInitialState(-2.0);
    expect(state.theta).toBe(-2.0);
    expect(state.se).toBe(1.5);
    expect(state.responses).toHaveLength(0);
    expect(state.phase).toBe(1);
    expect(state.classifiedLevel).toBeNull();
  });
});
