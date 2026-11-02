import { describe, expect, it } from "vitest";
import { showYourTurn, speechRate, wordSteps } from "../../src/readflow";

describe("speechRate", () => {
  it("Reads more slowly with the slow setting than with the normal setting", () => {
    expect(speechRate("langsom")).toBeLessThan(speechRate("normal"));
  });
  it("Falls back to normal speed for an unknown value", () => {
    expect(speechRate("??")).toBe(speechRate("normal"));
  });
});

describe("showYourTurn", () => {
  it("Shows the prompt only after reading finishes and the flow is enabled", () => {
    expect(showYourTurn("end", "an")).toBe(true);
    expect(showYourTurn("stop", "an")).toBe(false);
    expect(showYourTurn("end", "aus")).toBe(false);
  });
});

describe("wordSteps", () => {
  it("Reads the whole word, then each syllable slowly, then the whole word again", () => {
    expect(wordSteps("sommerfugl", ["som", "mer", "fugl"])).toEqual([
      { text: "sommerfugl", part: null, slow: false },
      { text: "som", part: 0, slow: true },
      { text: "mer", part: 1, slow: true },
      { text: "fugl", part: 2, slow: true },
      { text: "sommerfugl", part: null, slow: false },
    ]);
  });
  it("Reads monosyllabic words only once", () => {
    expect(wordSteps("sol", ["sol"])).toEqual([{ text: "sol", part: null, slow: false }]);
  });
  it("Removes hyphens and punctuation from the syllables", () => {
    const steps = wordSteps("Bjørne-far", ["Bjør", "ne-", "far"]);
    expect(steps.map(s => s.text)).toEqual(["Bjørne-far", "Bjør", "ne", "far", "Bjørne-far"]);
    expect(steps.map(s => s.part)).toEqual([null, 0, 1, 2, null]);
  });
});
