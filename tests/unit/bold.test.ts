import { describe, expect, it } from "vitest";
import { strokeWidth, boldFlags } from "../../src/bold";

/** Grayscale test image: a white background with vertical black strokes of width s. */
function strokes(w: number, h: number, s: number, gap = 6): Uint8ClampedArray {
  const g = new Uint8ClampedArray(w * h).fill(250);
  for (let x0 = 2; x0 + s < w; x0 += s + gap) for (let y = 3; y < h - 3; y++) for (let x = x0; x < x0 + s; x++) g[y * w + x] = 20;
  return g;
}

describe("strokeWidth", () => {
  it("Measures thicker strokes as thicker", () => {
    expect(strokeWidth(strokes(60, 30, 5), 60, 30)).toBeGreaterThan(strokeWidth(strokes(60, 30, 2), 60, 30) * 1.8);
  });
  it("Approximates the actual width of thick strokes", () => {
    expect(strokeWidth(strokes(80, 40, 6), 80, 40)).toBeCloseTo(6, 0);
  });
  it("Returns NaN without contrast", () => {
    expect(strokeWidth(new Uint8ClampedArray(100).fill(200), 10, 10)).toBeNaN();
  });
});

describe("boldFlags", () => {
  it("Marks words with substantially thicker strokes than usual", () => {
    const r = [0.1, 0.11, 0.1, 0.09, 0.1, 0.105, 0.1, 0.2, 0.1, 0.14];
    expect(boldFlags(r)).toEqual(r.map((x) => x === 0.2));
  });
  it("Marks nothing when there are too few words for comparison", () => {
    expect(boldFlags([0.1, 0.2, 0.1])).toEqual([false, false, false]);
  });
  it("Marks nothing when the entire page is bold", () => {
    expect(boldFlags(new Array(10).fill(0.16))).toEqual(new Array(10).fill(false));
  });
  it("Ignores missing measurements", () => {
    const r = [0.1, NaN, 0.1, 0.1, 0.1, 0.1, 0.1, 0.2, 0.1, 0.1];
    expect(boldFlags(r)[1]).toBe(false);
    expect(boldFlags(r)[7]).toBe(true);
  });
});
