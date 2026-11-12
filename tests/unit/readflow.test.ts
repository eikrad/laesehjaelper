import { describe, expect, it } from "vitest";
import { showYourTurn, speechRate, wordSteps } from "../../src/readflow";

describe("speechRate", () => {
  it("Slows a continuous Danish word gently while keeping other languages' syllable speed", () => {
    expect(speechRate("normal", true, "da")).toBeCloseTo(0.765);
    expect(speechRate("normal", true, "de")).toBeCloseTo(0.6375);
    expect(speechRate("normal", true, "en")).toBeCloseTo(0.6375);
  });
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
  it("offers actual Danish syllables when explicitly enabled", () => {
    expect(wordSteps("pige", ["pi", "ge"], "syllables")).toEqual([
      { text: "pige", part: null, slow: false },
      { text: "pi", part: 0, slow: true },
      { text: "ge", part: 1, slow: true },
      { text: "pige", part: null, slow: false },
    ]);
  });
  it("speaks a tapped Danish word once unless syllables are explicitly chosen", () => {
    expect(wordSteps("pige", ["pi", "ge"])).toEqual([
      { text: "pige", part: null, slow: false },
    ]);
  });
  for (const language of ["de", "en"]) it(`Keeps whole–syllables–whole playback for ${language}`, () => {
    expect(wordSteps("Radio", ["Ra", "di", "o"], "syllables")).toEqual([
      { text: "Radio", part: null, slow: false },
      { text: "Ra", part: 0, slow: true },
      { text: "di", part: 1, slow: true },
      { text: "o", part: 2, slow: true },
      { text: "Radio", part: null, slow: false },
    ]);
  });
  it("Reads monosyllabic words only once", () => {
    expect(wordSteps("sol", ["sol"])).toEqual([{ text: "sol", part: null, slow: false }]);
    expect(wordSteps("sol", ["sol"], "syllables")).toEqual([{ text: "sol", part: null, slow: false }]);
    expect(wordSteps("sol", ["-", "…"], "syllables")).toEqual([{ text: "sol", part: null, slow: false }]);
  });
  it("Removes hyphens and punctuation from the syllables", () => {
    const steps = wordSteps("Bücher-wurm", ["Bü", "cher-", "wurm"], "syllables");
    expect(steps.map(s => s.text)).toEqual(["Bücher-wurm", "Bü", "cher", "wurm", "Bücher-wurm"]);
    expect(steps.map(s => s.part)).toEqual([null, 0, 1, 2, null]);
  });
});
