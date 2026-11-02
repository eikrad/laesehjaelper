import { describe, expect, it } from "vitest";
import { shortLineBreaks } from "../../src/lines";

// seps[i] = Text nach Wort i (Leerzeichen, Satzzeichen)
describe("shortLineBreaks", () => {
  it("bricht spätestens nach drei Wörtern um", () => {
    expect(shortLineBreaks([" ", " ", " ", " ", " ", ""])).toEqual([false, false, true, false, false, false]);
  });
  it("bricht nach Satzzeichen um und zählt danach neu", () => {
    expect(shortLineBreaks([" ", ". ", " ", " ", " ", "."])).toEqual([false, true, false, true, false, false]);
  });
  it("bricht nie nach dem letzten Wort um", () => {
    expect(shortLineBreaks([" ", " ", ""])).toEqual([false, false, false]);
  });
  it("verteilt gleichmäßig, damit kein Wort allein steht", () => {
    expect(shortLineBreaks([" ", " ", " ", ""])).toEqual([false, true, false, false]);
  });
  it("erlaubt eine andere Höchstzahl", () => {
    expect(shortLineBreaks([" ", " ", " ", " ", ""], 2)).toEqual([false, true, false, true, false]);
  });
});
