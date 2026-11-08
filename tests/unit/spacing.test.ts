import { describe, expect, it } from "vitest";
import { boxLineHeight, boxSpacing, wordSpacing, WORD_BASE_FLOW, WORD_BASE_BOX } from "../../src/spacing";

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

describe("Line spacing on the book page", () => {
  it("Keeps the default page spacing and follows the setting above and below it", () => {
    expect(boxLineHeight(1.9)).toBeCloseTo(1.6);
    expect(boxLineHeight(3)).toBeGreaterThan(2.4);
    expect(boxLineHeight(1.3)).toBeLessThan(1.6);
  });
});

describe("Spacing in a book-page box between the default and the reader's", () => {
  it("Starts from the default spacing and ends at the reader's", () => {
    expect(boxSpacing(0.2, 2.8, 0)).toEqual({ ls: 0.04, lh: boxLineHeight(1.9), ws: wordSpacing(0.04, WORD_BASE_BOX) });
    expect(boxSpacing(0.2, 2.8, 1)).toEqual({ ls: 0.2, lh: boxLineHeight(2.8), ws: wordSpacing(0.2, WORD_BASE_BOX) });
    expect(boxSpacing(0.2, 2.8, 0.5).ls).toBeCloseTo(0.12);
  });
  it("Starts from the reader's spacing when it is tighter than the default", () => {
    expect(boxSpacing(0, 1.3, 0)).toEqual(boxSpacing(0, 1.3, 1));
  });
});
