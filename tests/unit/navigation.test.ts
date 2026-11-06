import { describe, expect, it } from "vitest";
import { locationHash, parseLocation } from "../../src/navigation";

describe("Reading and workshop navigation", () => {
  it("Opens the bookshelf for an empty or unknown link", () => {
    expect(parseLocation("")).toEqual({ view: "shelf" });
    expect(parseLocation("#unknown")).toEqual({ view: "shelf" });
  });
  it("Links directly to a reading or workshop page, including encoded identifiers", () => {
    expect(parseLocation("#read/book/page")).toEqual({ view: "read", bookId: "book", pageId: "page" });
    const target = { view: "workshop", bookId: "a/b", pageId: "side æ" } as const;
    expect(locationHash(target)).toBe("#edit/a%2Fb/side%20%C3%A6");
    expect(parseLocation(locationHash(target))).toEqual(target);
    expect(parseLocation("#edit/book")).toEqual({ view: "workshop", bookId: "book" });
    expect(locationHash({ view: "shelf" })).toBe("#shelf");
  });
  it("Falls back to the shelf for malformed or incomplete links", () => {
    for (const hash of ["#read", "#edit/", "#read/%broken/page", "#read/book/page/extra", "#read/book/"]) {
      expect(parseLocation(hash)).toEqual({ view: "shelf" });
    }
  });
});
