import { describe, expect, it } from "vitest";
import { deletionMark, pendingDeletions, restoreIndex, UNDO_MS, undoLeft } from "../../src/page-undo";

describe("Marking a deleted page", () => {
  it("Remembers its neighbours, its position and when the undo ends", () => {
    expect(deletionMark(["a", "b", "c"], 1, 1000)).toEqual({ index: 1, after: "a", before: "c", until: 1000 + UNDO_MS });
  });

  it("Has no left neighbour for the first page and no right one for the last", () => {
    expect(deletionMark(["a", "b"], 0, 0)).toEqual({ index: 0, before: "b", until: UNDO_MS });
    expect(deletionMark(["a", "b"], 1, 0)).toEqual({ index: 1, after: "a", until: UNDO_MS });
  });

  it("Leaves out neighbours without an ID (pages of the sample book)", () => {
    expect(deletionMark([undefined, "b", undefined], 1, 0)).toEqual({ index: 1, until: UNDO_MS });
  });
});

describe("Where an undone page goes back", () => {
  it("Goes back where it was when nothing changed", () => {
    const mark = deletionMark(["a", "b", "c"], 1, 0);
    expect(restoreIndex(["a", "c"], mark)).toBe(1);
    expect(restoreIndex(["b", "c"], deletionMark(["a", "b", "c"], 0, 0))).toBe(0);
    expect(restoreIndex(["a", "b"], deletionMark(["a", "b", "c"], 2, 0))).toBe(2);
  });

  it("Follows its left neighbour when pages were added or moved meanwhile", () => {
    const mark = deletionMark(["a", "b", "c"], 1, 0);
    expect(restoreIndex(["x", "y", "a", "c"], mark)).toBe(3);
    expect(restoreIndex(["c", "a"], mark)).toBe(2);
  });

  it("Goes before its right neighbour when the left one is gone", () => {
    expect(restoreIndex(["x", "c", "y"], deletionMark(["a", "b", "c"], 1, 0))).toBe(1);
  });

  it("Falls back to its old position within the list when both neighbours are gone", () => {
    const mark = deletionMark(["a", "b", "c", "d"], 2, 0);
    expect(restoreIndex(["x", "y", "z"], { ...mark, after: "gone", before: "gone too" })).toBe(2);
    expect(restoreIndex(["x"], { ...mark, after: undefined, before: undefined })).toBe(1);
  });
});

describe("How long a deletion can be undone", () => {
  it("Counts down to the end and is final from then on", () => {
    const mark = deletionMark(["a", "b"], 0, 5000);
    expect(undoLeft(mark, 5000)).toBe(UNDO_MS);
    expect(undoLeft(mark, 5000 + UNDO_MS - 1)).toBe(1);
    expect(undoLeft(mark, 5000 + UNDO_MS)).toBe(0);
    expect(undoLeft(undefined, 0)).toBe(0);
  });

  it("Lets only the latest open deletion be undone; every other one is final", () => {
    const older = { id: "p1", deleted: { index: 0, until: 9000 } };
    const latest = { id: "p2", deleted: { index: 1, until: 9500 } };
    const expired = { id: "p3", deleted: { index: 2, until: 4000 } };
    const kept = { id: "p4" };
    expect(pendingDeletions([older, kept, latest, expired], 5000)).toEqual({ undo: latest, final: [older, expired] });
    expect(pendingDeletions([expired, kept], 5000)).toEqual({ undo: null, final: [expired] });
    expect(pendingDeletions([kept], 5000)).toEqual({ undo: null, final: [] });
  });
});
