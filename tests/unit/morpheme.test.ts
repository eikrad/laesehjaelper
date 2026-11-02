import { describe, expect, it } from "vitest";
import { morphParts } from "../../src/morpheme";

const DICT = new Set(["sommer", "fugl", "sommerfugl", "bedste", "mor", "bedstemor", "hule", "hul", "pind", "svin", "pindsvin",
  "æble", "træ", "æbletræ", "skov", "morgen", "sam", "men", "sammen", "lig", "ger", "kar", "tof", "ler", "bjørn", "far", "morgen", "and", "anden", "under", "hus", "huse", "gul", "rod"]);
const has = (w: string) => DICT.has(w);
const show = (w: string) => morphParts(w, has).map((p) => (p.suffix ? "+" : "") + p.text).join("|");

describe("morphParts (Dänisch)", () => {
  it("teilt zusammengesetzte Wörter in bekannte Teile", () => {
    expect(show("sommerfugl")).toBe("sommer|fugl");
    expect(show("bedstemor")).toBe("bedste|mor");
    expect(show("æbletræ")).toBe("æble|træ");
    expect(show("pindsvin")).toBe("pind|svin");
  });
  it("trennt Endungen ab und nimmt den längsten bekannten Stamm", () => {
    expect(show("sommerfuglene")).toBe("sommer|fugl|+ene");
    expect(show("hulen")).toBe("hule|+n");
    expect(show("skoven")).toBe("skov|+en");
    expect(show("morgenen")).toBe("morgen|+en");
  });
  it("lässt bekannte Wörter ganz, wenn sie sich nicht sinnvoll teilen lassen", () => {
    expect(show("anden")).toBe("anden");
    expect(show("under")).toBe("under");
    expect(show("huse")).toBe("huse");
  });
  it("teilt nicht an kurzen Wortanfängen (vordere Teile mindestens vier Buchstaben)", () => {
    expect(show("morgen")).toBe("morgen");
    expect(show("sammen")).toBe("sammen");
    expect(show("ligger")).toBe("ligger");
    expect(show("kartofler")).toBe("kartofler");
  });
  it("hängt Fugenlaute an den vorderen Teil", () => {
    expect(show("guleroden")).toBe("gule|rod|+en");
  });
  it("behält Groß-/Kleinschreibung und Bindestriche", () => {
    expect(show("Sommerfugl")).toBe("Sommer|fugl");
    expect(show("Bjørne-far")).toBe("Bjørn|+e-|far");
  });
  it("gibt unbekannte Wörter unverändert zurück", () => {
    expect(show("xyzabc")).toBe("xyzabc");
    expect(morphParts("", has)).toEqual([]);
  });
  it("ergibt zusammengesetzt immer genau das Wort", () => {
    for (const w of ["sommerfuglene", "Bjørne-far", "guleroden", "pindsvin", "xyz"])
      expect(morphParts(w, has).map((p) => p.text).join("")).toBe(w);
  });
});
