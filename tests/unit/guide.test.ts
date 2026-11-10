import { expect, it } from "vitest";
import { readingLines } from "../../src/guide";

it("Groups words on a visual row without merging separate paragraphs or columns", () => {
  const lines = readingLines([
    { index: 0, block: 0, left: 10, right: 50, top: 10, bottom: 30 },
    { index: 1, block: 0, left: 60, right: 100, top: 8, bottom: 32 },
    { index: 2, block: 0, left: 10, right: 65, top: 44, bottom: 64 },
    { index: 3, block: 1, left: 200, right: 250, top: 10, bottom: 30 },
  ]);
  expect(lines).toEqual([
    { words: [0, 1], left: 10, right: 100, top: 8, bottom: 32 },
    { words: [2], left: 10, right: 65, top: 44, bottom: 64 },
    { words: [3], left: 200, right: 250, top: 10, bottom: 30 },
  ]);
});
