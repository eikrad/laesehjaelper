import { describe, expect, it } from "vitest";
import { swipeDirection } from "../../src/swipe";

// dx, dy = finger movement in px; ms = duration of the touch
describe("swipeDirection", () => {
  it("A quick move to the left turns to the next page, like in a book", () => {
    expect(swipeDirection(-120, 10, 250)).toBe("next");
  });
  it("A quick move to the right turns back to the previous page", () => {
    expect(swipeDirection(120, -10, 250)).toBe("prev");
  });
  it("A short move is a tap, for example on a word to hear it", () => {
    expect(swipeDirection(-20, 0, 120)).toBeNull();
  });
  it("A mostly vertical move scrolls the page instead", () => {
    expect(swipeDirection(-80, 150, 250)).toBeNull();
  });
  it("A slow drag is not a swipe", () => {
    expect(swipeDirection(-200, 0, 1500)).toBeNull();
  });
});
