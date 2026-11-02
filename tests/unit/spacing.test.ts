import { describe, expect, it } from "vitest";
import { wordSpacing, WORD_BASE_FLOW, WORD_BASE_BOX } from "../../src/spacing";

describe("wordSpacing", () => {
  it("Keeps the base value when no letter spacing is set", () => {
    expect(wordSpacing(0, WORD_BASE_FLOW)).toBe(WORD_BASE_FLOW);
    expect(wordSpacing(0, WORD_BASE_BOX)).toBe(WORD_BASE_BOX);
  });
  it("Increases with letter spacing", () => {
    expect(wordSpacing(0.1, WORD_BASE_FLOW)).toBeGreaterThan(wordSpacing(0.05, WORD_BASE_FLOW));
    expect(wordSpacing(0.1, WORD_BASE_FLOW)).toBeCloseTo(WORD_BASE_FLOW + 0.2, 5);
  });
  it("Increases equally in book-page and text views", () => {
    const d = (base: number) => wordSpacing(0.25, base) - base;
    expect(d(WORD_BASE_BOX)).toBeCloseTo(d(WORD_BASE_FLOW), 5);
  });
  it("Ignores negative values", () => {
    expect(wordSpacing(-0.1, WORD_BASE_FLOW)).toBe(WORD_BASE_FLOW);
  });
});
