import { describe, expect, it } from "vitest";
import { speechRate, showYourTurn } from "../../src/readflow";

describe("speechRate", () => {
  it("liest langsam langsamer als normal", () => {
    expect(speechRate("langsom")).toBeLessThan(speechRate("normal"));
  });
  it("fällt bei unbekanntem Wert auf normal zurück", () => {
    expect(speechRate("??")).toBe(speechRate("normal"));
  });
});

describe("showYourTurn", () => {
  it("zeigt den Hinweis nur nach vollständigem Vorlesen und eingeschaltetem Ablauf", () => {
    expect(showYourTurn("end", "an")).toBe(true);
    expect(showYourTurn("stop", "an")).toBe(false);
    expect(showYourTurn("end", "aus")).toBe(false);
  });
});
