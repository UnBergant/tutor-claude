import { describe, expect, it } from "vitest";
import { shuffleUntilDifferent } from "./generation";

describe("shuffleUntilDifferent", () => {
  it("returns array of same length", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleUntilDifferent(input);
    expect(result).toHaveLength(input.length);
  });

  it("contains the same elements", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleUntilDifferent(input);
    expect([...result].sort()).toEqual([...input].sort());
  });

  it("does not mutate the original array", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffleUntilDifferent(input);
    expect(input).toEqual(copy);
  });

  it("returns different order for arrays with 2+ elements", () => {
    // With 5 elements, the probability of same order is 1/120 per attempt,
    // and we retry up to 10 times. Chance of all 10 same = negligible.
    const input = [1, 2, 3, 4, 5];
    const result = shuffleUntilDifferent(input);
    const isSameOrder = input.every((val, idx) => val === result[idx]);
    expect(isSameOrder).toBe(false);
  });

  it("handles single-element array", () => {
    const input = [42];
    const result = shuffleUntilDifferent(input);
    expect(result).toEqual([42]);
  });

  it("handles empty array", () => {
    const result = shuffleUntilDifferent([]);
    expect(result).toEqual([]);
  });

  it("handles array with all identical elements", () => {
    const input = [1, 1, 1, 1];
    const result = shuffleUntilDifferent(input);
    expect(result).toHaveLength(4);
    expect(result.every((v) => v === 1)).toBe(true);
  });
});
