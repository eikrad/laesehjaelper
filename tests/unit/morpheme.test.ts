import { describe, expect, it } from "vitest";
import { morphParts } from "../../src/morpheme";

const DICT = new Set(["sommer", "fugl", "sommerfugl", "bedste", "mor", "bedstemor", "hule", "hul", "pind", "svin", "pindsvin",
  "æble", "træ", "æbletræ", "skov", "morgen", "sam", "men", "sammen", "lig", "ger", "kar", "tof", "ler", "bjørn", "far", "morgen", "and", "anden", "under", "hus", "huse", "gul", "rod"]);
const has = (w: string) => DICT.has(w);
const show = (w: string) => morphParts(w, has).map((p) => (p.suffix ? "+" : "") + p.text).join("|");

describe("morphParts (Danish)", () => {
  it("Splits compounds into known parts", () => {
    expect(show("sommerfugl")).toBe("sommer|fugl");
    expect(show("bedstemor")).toBe("bedste|mor");
    expect(show("æbletræ")).toBe("æble|træ");
    expect(show("pindsvin")).toBe("pind|svin");
  });
  it("Separates suffixes using the longest known stem", () => {
    expect(show("sommerfuglene")).toBe("sommer|fugl|+ene");
    expect(show("hulen")).toBe("hule|+n");
    expect(show("skoven")).toBe("skov|+en");
    expect(show("morgenen")).toBe("morgen|+en");
  });
  it("Keeps known words intact when no meaningful split exists", () => {
    expect(show("anden")).toBe("anden");
    expect(show("under")).toBe("under");
    expect(show("huse")).toBe("huse");
  });
  it("Avoids short prefixes by requiring at least four letters in the first part", () => {
    expect(show("morgen")).toBe("morgen");
    expect(show("sammen")).toBe("sammen");
    expect(show("ligger")).toBe("ligger");
    expect(show("kartofler")).toBe("kartofler");
  });
  it("Attaches linking sounds to the first part", () => {
    expect(show("guleroden")).toBe("gule|rod|+en");
  });
  it("Preserves capitalization and hyphens", () => {
    expect(show("Sommerfugl")).toBe("Sommer|fugl");
    expect(show("Bjørne-far")).toBe("Bjørn|+e-|far");
  });
  it("Returns unknown words unchanged", () => {
    expect(show("xyzabc")).toBe("xyzabc");
    expect(morphParts("", has)).toEqual([]);
  });
  it("Recombining the parts always reproduces the original word", () => {
    for (const w of ["sommerfuglene", "Bjørne-far", "guleroden", "pindsvin", "xyz"])
      expect(morphParts(w, has).map((p) => p.text).join("")).toBe(w);
  });
});
