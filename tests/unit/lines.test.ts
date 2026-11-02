import { describe, expect, it } from "vitest";
import { shortLineBreaks } from "../../src/lines";

// seps[i] = text after word i, including spaces and punctuation
describe("shortLineBreaks", () => {
  it("Breaks after at most three words", () => {
    expect(shortLineBreaks([" ", " ", " ", " ", " ", ""])).toEqual([false, false, true, false, false, false]);
  });
  it("Breaks after punctuation and restarts the count", () => {
    expect(shortLineBreaks([" ", ". ", " ", " ", " ", "."])).toEqual([false, true, false, true, false, false]);
  });
  it("Never breaks after the last word", () => {
    expect(shortLineBreaks([" ", " ", ""])).toEqual([false, false, false]);
  });
  it("Distributes words evenly to avoid a single-word line", () => {
    expect(shortLineBreaks([" ", " ", " ", ""])).toEqual([false, true, false, false]);
  });
  it("Allows a different maximum word count", () => {
    expect(shortLineBreaks([" ", " ", " ", " ", ""], 2)).toEqual([false, true, false, true, false]);
  });
});
