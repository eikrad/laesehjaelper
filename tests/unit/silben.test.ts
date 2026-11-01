import { describe, expect, it } from "vitest";
import { silben } from "../../src/silben";

describe("silben", () => {
  it("trennt dänische Wörter", () => {
    expect(silben("sommerfugl", "da")).toEqual(["som", "mer", "fugl"]);
    expect(silben("morgenen", "da")).toEqual(["mor", "ge", "nen"]);
    expect(silben("bedstemor", "da")).toEqual(["bed", "ste", "mor"]);
  });
  it("trennt deutsche Wörter", () => {
    expect(silben("Schokolade", "de")).toEqual(["Scho", "ko", "la", "de"]);
    expect(silben("Apfelbaum", "de").join("")).toBe("Apfelbaum");
    expect(silben("Apfelbaum", "de").length).toBeGreaterThan(1);
  });
  it("trennt englische Wörter", () => {
    expect(silben("hedgehog", "en")).toEqual(["hedge", "hog"]);
  });
  it("lässt kurze Wörter ganz", () => {
    expect(silben("i", "da")).toEqual(["i"]);
    expect(silben("og", "da")).toEqual(["og"]);
  });
  it("fällt bei unbekannter Sprache auf Dänisch zurück", () => {
    expect(silben("sommerfugl", "xx")).toEqual(["som", "mer", "fugl"]);
  });
});
