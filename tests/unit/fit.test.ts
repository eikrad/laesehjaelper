import { describe, expect, it } from "vitest";
import { harmonizeSizes, scaleToTarget, hasCustomSize } from "../../src/fit";

it("distinguishes resizing a text box from moving its unchanged automatic area", () => {
  const p = { bbox: { x0: 100, y0: 100, x1: 300, y1: 150 }, lh: 20 };
  expect(hasCustomSize(p, 1000, 1400)).toBe(false);
  expect(hasCustomSize({ ...p, place: { x0: 200, y0: 300, x1: 412, y1: 362 } }, 1000, 1400)).toBe(false);
  expect(hasCustomSize({ ...p, place: { x0: 200, y0: 300, x1: 600, y1: 500 } }, 1000, 1400)).toBe(true);
});

// lh = original line height; fit = largest font size that fits the box
describe("harmonizeSizes", () => {
  it("fits an explicitly resized box independently of a cramped small-print paragraph", () => {
    const sizes = harmonizeSizes([{ lh: 14, fit: 40, lines: 1, manual: true }, { lh: 20, fit: 36, lines: 1 }, { lh: 19, fit: 36, lines: 1 }, { lh: 9, fit: 8, lines: 2 }]);
    expect(sizes[0]).toBe(40);
    expect(sizes[3]).toBe(8);
  });
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

describe("One size for the body text of a page", () => {
  // lines = number of lines in the box's paragraph.
  it("Gives a long paragraph measured larger (a tilted photo) the body size", () => {
    expect(harmonizeSizes([{ lh: 34, fit: 40, lines: 2 }, { lh: 44, fit: 60, lines: 4 }, { lh: 33, fit: 42, lines: 2 }])).toEqual([40, 40, 40]);
  });
  it("Keeps a short heading measured clearly larger larger", () => {
    expect(harmonizeSizes([{ lh: 48, fit: 60, lines: 1 }, { lh: 35, fit: 40, lines: 8 }])).toEqual([60, 40]);
  });
  it("Gives a short line measured smaller (a heading missing its capital) the body size", () => {
    expect(harmonizeSizes([{ lh: 24, fit: 50, lines: 1 }, { lh: 34, fit: 36, lines: 8 }, { lh: 34, fit: 38, lines: 5 }])).toEqual([36, 36, 36]);
  });
  it("Does not shrink the body text for a one-line fragment that fits only a small size", () => {
    expect(harmonizeSizes([{ lh: 34, fit: 12, lines: 1 }, { lh: 34, fit: 36, lines: 6 }])).toEqual([12, 36]);
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
  it("caps an independent manual box at the requested size without letting footer text scale it down", () => {
    expect(scaleToTarget([40, 8], [20, 120], 32, [true, false]).sizes).toEqual([32, 8]);
    expect(scaleToTarget([40, 60], [20, 120], 32, [true, false]).sizes).toEqual([32, 32]);
    expect(scaleToTarget([20], [20], 32, [true])).toEqual({ sizes: [20], limited: true });
  });
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
