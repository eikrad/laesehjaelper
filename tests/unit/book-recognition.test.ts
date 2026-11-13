import { expect, it } from "vitest";
import { planRecognition, runRecognitionBatch } from "../../src/book-recognition";

it("Protects manual and legacy results and reports pages without source photos", () => {
  const pages = [
    { id: "untouched", source: true, manualEdits: false },
    { id: "corrected", source: true, manualEdits: true },
    { id: "legacy", source: true },
    { id: "text-only", source: false, manualEdits: false },
    { id: "busy", source: true, manualEdits: false, busy: true },
  ];
  const plan = planRecognition(pages, false);
  expect(plan).toEqual({ pages: [pages[0]], manual: 2, missing: 1, busy: 1 });
  expect(planRecognition(pages, true)).toEqual({ pages: pages.slice(0, 3), manual: 0, missing: 1, busy: 1 });
});

it("Continues after a failed page and cancels before starting another page", async () => {
  let cancelled = false;
  const visited: number[] = [];
  const progress: number[] = [];
  const result = await runRecognitionBatch([1, 2, 3, 4], {
    cancelled: () => cancelled,
    process: async n => {
      visited.push(n);
      if (n === 1) throw new Error("Unreadable photo");
      if (n === 3) cancelled = true;
      return n === 2 ? "changed" : "done";
    },
    progress: state => { progress.push(state.completed); },
  });
  expect(visited).toEqual([1, 2, 3]);
  expect(progress).toEqual([0, 1, 2, 3]);
  expect(result).toEqual({ completed: 3, done: 1, failed: 1, changed: 1, remaining: 1 });
});
