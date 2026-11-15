import { describe, expect, it } from "vitest";
import { turn } from "../../src/pageturn";

// A book of three pages; `reading` is the child's reading view, otherwise the adults' workshop.
describe("turn", () => {
  it("Next and previous move one page within the book", () => {
    expect(turn({ page: 0, end: false }, "next", 3, true)).toEqual({ page: 1, end: false });
    expect(turn({ page: 2, end: false }, "prev", 3, true)).toEqual({ page: 1, end: false });
  });
  it("There is no page before the first one", () => {
    expect(turn({ page: 0, end: false }, "prev", 3, true)).toBeNull();
  });
  it("While reading, next on the last page leads to the end of the book", () => {
    expect(turn({ page: 2, end: false }, "next", 3, true)).toEqual({ page: 2, end: true });
  });
  it("From the end of the book, previous returns to the last page and next goes nowhere", () => {
    expect(turn({ page: 2, end: true }, "prev", 3, true)).toEqual({ page: 2, end: false });
    expect(turn({ page: 2, end: true }, "next", 3, true)).toBeNull();
  });
  it("In the workshop the last page is as far as next goes", () => {
    expect(turn({ page: 2, end: false }, "next", 3, false)).toBeNull();
    expect(turn({ page: 1, end: false }, "next", 3, false)).toEqual({ page: 2, end: false });
  });
  it("A book without pages has no end to reach", () => {
    expect(turn({ page: 0, end: false }, "next", 0, true)).toBeNull();
    expect(turn({ page: 0, end: false }, "prev", 0, true)).toBeNull();
  });
});
