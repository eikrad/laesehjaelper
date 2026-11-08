import { describe, expect, it } from "vitest";
import { harmonizeSizes, scaleToTarget } from "../../src/fit";

// lh = original line height; fit = largest font size that fits the box
describe("harmonizeSizes", () => {
  it("Uses the same smallest fitting size for equal original font sizes", () => {
    expect(harmonizeSizes([{ lh: 20, fit: 30 }, { lh: 21, fit: 26 }])).toEqual([26, 26]);
  });
  it("Keeps a heading larger than body text even when its box is tight", () => {
    const [head, body] = harmonizeSizes([{ lh: 40, fit: 30 }, { lh: 20, fit: 32 }]);
    expect(head).toBeLessThanOrEqual(30);              // Still fits its box.
    expect(head / body).toBeGreaterThanOrEqual(Math.sqrt(2) - 1e-9);
  });
  it("Preserves suitable size ratios", () => {
    expect(harmonizeSizes([{ lh: 40, fit: 60 }, { lh: 20, fit: 30 }])).toEqual([60, 30]);
  });
  it("Only shrinks fonts and never exceeds the fitting size", () => {
    const items = [{ lh: 50, fit: 24 }, { lh: 25, fit: 40 }, { lh: 12, fit: 40 }];
    harmonizeSizes(items).forEach((s, i) => expect(s).toBeLessThanOrEqual(items[i].fit));
  });
  it("Ignores boxes without measurements", () => {
    expect(harmonizeSizes([{ lh: 20, fit: 0 }, { lh: 20, fit: 30 }])).toEqual([0, 30]);
  });
});

it("Harmonizes varying OCR line heights without repeated shrinking", () => {
  const items = [{ lh: 20, fit: 32 }, { lh: 23, fit: 32 }, { lh: 27, fit: 32 }];
  const sizes = harmonizeSizes(items);
  expect(Math.min(...sizes)).toBeGreaterThan(24);
  expect(sizes[2]).toBe(32);
  expect(sizes[0]).toBe(sizes[1]);
  expect(harmonizeSizes([...items].reverse())).toEqual([...sizes].reverse());
});

describe("The reader's text size on a book page", () => {
  it("Scales all boxes down together until the body text has the wished size", () => {
    // A heading (60) and two body boxes (40, 40) with room; the reader wants 32 px.
    const r = scaleToTarget([60, 40, 40], [5, 120, 90], 32);
    expect(r.sizes).toEqual([48, 32, 32]);  // the heading stays 1.5 times the body size
    expect(r.limited).toBe(false);
  });
  it("Never makes a box larger than what fits, and reports when the page has no room", () => {
    const r = scaleToTarget([30, 20, 20], [5, 120, 90], 32);
    expect(r.sizes).toEqual([30, 20, 20]);
    expect(r.limited).toBe(true);
  });
  it("Takes the body size from the boxes with the most text", () => {
    // A short caption that fits only 10 px does not decide the body size.
    expect(scaleToTarget([10, 50, 50], [3, 100, 100], 25).sizes).toEqual([5, 25, 25]);
  });
  it("Leaves pages without text alone", () => {
    expect(scaleToTarget([], [], 32)).toEqual({ sizes: [], limited: false });
    expect(scaleToTarget([0, 0], [0, 0], 32)).toEqual({ sizes: [0, 0], limited: false });
  });
});
