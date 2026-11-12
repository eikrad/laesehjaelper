import { expect, it } from "vitest";
import { parasFromOcr } from "../../src/layout";
import type { OcrData } from "../../src/types";

it("keeps a confident short exclamation in its own large text line", () => {
  const d: OcrData = { blocks: [{ paragraphs: [{ lines: [{ text: "Los!", bbox: { x0: 100, y0: 100, x1: 180, y1: 148 }, words: [{ text: "Los!", confidence: 96, bbox: { x0: 100, y0: 100, x1: 180, y1: 148 } }] }] }] }] };
  expect(parasFromOcr(d).map(p => p.raw)).toEqual(["Los!"]);
});

it("still rejects uncertain short illustration fragments", () => {
  const d: OcrData = { blocks: [{ paragraphs: [{ lines: [{ text: "XYZ", bbox: { x0: 100, y0: 100, x1: 180, y1: 148 }, words: [{ text: "XYZ", confidence: 92, bbox: { x0: 100, y0: 100, x1: 180, y1: 148 } }] }] }] }] };
  expect(parasFromOcr(d)).toEqual([]);
});
