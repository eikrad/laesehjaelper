import { describe, expect, it } from "vitest";
import { wordSpacing, WORD_BASE_FLOW, WORD_BASE_BOX } from "../../src/spacing";

describe("wordSpacing", () => {
  it("bleibt beim Grundwert, wenn kein Buchstabenabstand eingestellt ist", () => {
    expect(wordSpacing(0, WORD_BASE_FLOW)).toBe(WORD_BASE_FLOW);
    expect(wordSpacing(0, WORD_BASE_BOX)).toBe(WORD_BASE_BOX);
  });
  it("wächst mit dem Buchstabenabstand", () => {
    expect(wordSpacing(0.1, WORD_BASE_FLOW)).toBeGreaterThan(wordSpacing(0.05, WORD_BASE_FLOW));
    expect(wordSpacing(0.1, WORD_BASE_FLOW)).toBeCloseTo(WORD_BASE_FLOW + 0.2, 5);
  });
  it("wächst in Buchseite und Textansicht gleich stark", () => {
    const d = (base: number) => wordSpacing(0.25, base) - base;
    expect(d(WORD_BASE_BOX)).toBeCloseTo(d(WORD_BASE_FLOW), 5);
  });
  it("ignoriert negative Werte", () => {
    expect(wordSpacing(-0.1, WORD_BASE_FLOW)).toBe(WORD_BASE_FLOW);
  });
});
