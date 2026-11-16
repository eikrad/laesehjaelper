import { describe, expect, it } from "vitest";
import { menuButtonKey, menuKey } from "../../src/menu";

// A menu button and its menu, as in the WAI-ARIA menu button pattern:
// https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
describe("menuButtonKey", () => {
  it("Arrow down on the closed menu button opens the menu at its first item", () => {
    expect(menuButtonKey("ArrowDown")).toBe("first");
  });
  it("Arrow up opens the menu at its last item", () => {
    expect(menuButtonKey("ArrowUp")).toBe("last");
  });
  it("Other keys keep their usual meaning (Enter and Space click the button)", () => {
    for (const key of ["Enter", " ", "Tab", "a"]) expect(menuButtonKey(key)).toBeNull();
  });
});

describe("menuKey", () => {
  it("Arrow down moves to the next item and wraps from the last to the first", () => {
    expect(menuKey("ArrowDown", 0, 4)).toEqual({ focus: 1 });
    expect(menuKey("ArrowDown", 3, 4)).toEqual({ focus: 0 });
  });
  it("Arrow up moves to the previous item and wraps from the first to the last", () => {
    expect(menuKey("ArrowUp", 2, 4)).toEqual({ focus: 1 });
    expect(menuKey("ArrowUp", 0, 4)).toEqual({ focus: 3 });
  });
  it("Without a focused item, arrow down starts at the first item and arrow up at the last", () => {
    expect(menuKey("ArrowDown", -1, 4)).toEqual({ focus: 0 });
    expect(menuKey("ArrowUp", -1, 4)).toEqual({ focus: 3 });
  });
  it("Home and End jump to the first and the last item", () => {
    expect(menuKey("Home", 2, 4)).toEqual({ focus: 0 });
    expect(menuKey("End", 1, 4)).toEqual({ focus: 3 });
  });
  it("Escape closes the menu and returns focus to the menu button", () => {
    expect(menuKey("Escape", 1, 4)).toEqual({ close: "button" });
  });
  it("Tab closes the menu and lets focus move on as usual", () => {
    expect(menuKey("Tab", 1, 4)).toEqual({ close: "stay" });
  });
  it("Other keys, such as Enter on an item, keep their usual meaning", () => {
    for (const key of ["Enter", " ", "a"]) expect(menuKey(key, 1, 4)).toBeNull();
  });
  it("A menu without items has nothing to move to", () => {
    expect(menuKey("ArrowDown", -1, 0)).toBeNull();
    expect(menuKey("End", -1, 0)).toBeNull();
    expect(menuKey("Escape", -1, 0)).toEqual({ close: "button" });
  });
});
