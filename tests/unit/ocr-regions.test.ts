import { expect, it } from "vitest";
import { normaliseRegions, regionPixels } from "../../src/ocr-regions";

it("normalizes reversed, out-of-page rectangles and rejects malformed or empty areas", () => {
  expect(normaliseRegions([{ x0: 1.2, y0: 1, x1: -0.1, y1: 0.85 }, { x0: 0, y0: 0, x1: 0, y1: 1 }, { x0: "0", y0: 0, x1: 1, y1: 1 }, null])).toEqual([{ x0: 0, y0: 0.85, x1: 1, y1: 1 }]);
  expect(normaliseRegions(undefined)).toEqual([]);
  expect(normaliseRegions([{ x0: 0, y0: 0, x1: Infinity, y1: 1 }])).toEqual([]);
  const r = { x0: 0, y0: 0.8, x1: 1, y1: 1 };
  expect(normaliseRegions([r, r])).toEqual([r]);
  expect(regionPixels([{ x0: 0.1, y0: 0.851, x1: 0.9, y1: 1 }], 100, 200)).toEqual([{ x0: 10, y0: 170, x1: 90, y1: 200 }]);
});
