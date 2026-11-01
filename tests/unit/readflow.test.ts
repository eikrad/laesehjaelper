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

import { wordSteps } from "../../src/readflow";

describe("wordSteps", () => {
  it("liest ganz, dann langsam in Silben, dann wieder ganz", () => {
    expect(wordSteps("sommerfugl", ["som", "mer", "fugl"])).toEqual([
      { text: "sommerfugl", part: null, slow: false },
      { text: "som", part: 0, slow: true },
      { text: "mer", part: 1, slow: true },
      { text: "fugl", part: 2, slow: true },
      { text: "sommerfugl", part: null, slow: false },
    ]);
  });
  it("liest einsilbige Wörter nur einmal", () => {
    expect(wordSteps("sol", ["sol"])).toEqual([{ text: "sol", part: null, slow: false }]);
  });
  it("entfernt Bindestriche und Satzzeichen aus den Silben", () => {
    const steps = wordSteps("Bjørne-far", ["Bjør", "ne-", "far"]);
    expect(steps.map(s => s.text)).toEqual(["Bjørne-far", "Bjør", "ne", "far", "Bjørne-far"]);
    expect(steps.map(s => s.part)).toEqual([null, 0, 1, 2, null]);
  });
});
