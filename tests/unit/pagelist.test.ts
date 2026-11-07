import { describe, expect, it } from "vitest";
import { insertIndex, selectedIndex } from "../../src/pagelist";

describe("Where a new page goes", () => {
  const pages = ["a", "b", "c"];

  it("Puts the first photo before or after the selected page, or at the end", () => {
    expect(insertIndex(pages, [], "b", "before")).toBe(1);
    expect(insertIndex(pages, [], "b", "after")).toBe(2);
    expect(insertIndex(pages, [], "b", "end")).toBe(3);
    expect(insertIndex(pages, [], null, "end")).toBe(3);
  });

  it("Keeps a batch together in the chosen order", () => {
    // "before b" with two photos: x then y, both still before b.
    const list = ["a", "x", "b", "c"];
    expect(insertIndex(list, ["x"], "b", "before")).toBe(2);
    expect(insertIndex(["a", "b", "x", "c"], ["x"], "b", "after")).toBe(3);
  });

  it("Continues after the last added page that still exists", () => {
    // The user deleted y while the batch was running: z goes after x.
    expect(insertIndex(["a", "x", "b"], ["x", "y"], "a", "after")).toBe(2);
  });

  it("Falls back to the selected page, then to the end, when added pages are gone", () => {
    expect(insertIndex(pages, ["x"], "b", "after")).toBe(2);
    expect(insertIndex(pages, ["x"], "gone", "before")).toBe(3);
    expect(insertIndex([], [], "gone", "after")).toBe(0);
  });
});

describe("Which page stays selected", () => {
  it("Follows the selected page when the list changes around it", () => {
    expect(selectedIndex(["x", "a", "b"], "a", 0)).toBe(1);
  });

  it("Keeps the position, within the list, when the selected page is gone", () => {
    expect(selectedIndex(["a", "b"], "gone", 1)).toBe(1);
    expect(selectedIndex(["a", "b"], "gone", 5)).toBe(1);
    expect(selectedIndex(["a", "b"], undefined, -1)).toBe(0);
    expect(selectedIndex([], "gone", 3)).toBe(0);
  });
});
