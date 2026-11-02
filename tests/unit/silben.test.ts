import { describe, expect, it } from "vitest";
import { silben } from "../../src/silben";

describe("silben", () => {
  it("Splits Danish words", () => {
    expect(silben("sommerfugl", "da")).toEqual(["som", "mer", "fugl"]);
    expect(silben("morgenen", "da")).toEqual(["mor", "ge", "nen"]);
    expect(silben("bedstemor", "da")).toEqual(["bed", "ste", "mor"]);
  });
  it("Splits German words", () => {
    expect(silben("Schokolade", "de")).toEqual(["Scho", "ko", "la", "de"]);
    expect(silben("Apfelbaum", "de").join("")).toBe("Apfelbaum");
    expect(silben("Apfelbaum", "de").length).toBeGreaterThan(1);
  });
  it("Splits English words", () => {
    expect(silben("hedgehog", "en")).toEqual(["hedge", "hog"]);
  });
  it("Keeps short words intact", () => {
    expect(silben("i", "da")).toEqual(["i"]);
    expect(silben("og", "da")).toEqual(["og"]);
  });
  it("Falls back to Danish for an unknown language", () => {
    expect(silben("sommerfugl", "xx")).toEqual(["som", "mer", "fugl"]);
  });
});
