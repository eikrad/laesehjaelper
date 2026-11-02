import { describe, expect, it } from "vitest";
import { cleanOcr, parasFromOcr } from "../../src/layout";
import type { OcrData, OcrLine, OcrWord } from "../../src/types";

// Hilfen, um künstliche Tesseract-Ergebnisse zu bauen: Wörter mit Position und Sicherheit.
const H = 30;   // Zeilenhöhe
function line(y: number, words: [string, number][], x0 = 100, gap = 20): OcrLine {
  let x = x0;
  const ws: OcrWord[] = words.map(([text, confidence]) => {
    const w = text.length * 15;
    const word = { text, confidence, bbox: { x0: x, y0: y, x1: x + w, y1: y + H } };
    x += w + gap;
    return word;
  });
  return { text: words.map((w) => w[0]).join(" "), bbox: { x0, y0: y, x1: x - gap, y1: y + H }, words: ws };
}
const page = (...lines: OcrLine[]): OcrData => ({ blocks: [{ paragraphs: [{ lines }] }] });
const texts = (d: OcrData) => parasFromOcr(d).map((p) => cleanOcr(p.raw));

describe("cleanOcr", () => {
  it("fügt Zeilen eines Absatzes zusammen und trennt Absätze", () => {
    expect(cleanOcr("Det er\nen bog\n\nNy linje")).toBe("Det er en bog\n\nNy linje");
  });
  it("entfernt Trennstriche am Zeilenende", () => {
    expect(cleanOcr("Schoko-\nlade")).toBe("Schokolade");
  });
  it("lässt echte Bindestriche stehen", () => {
    expect(cleanOcr("En tur til Lille-by")).toBe("En tur til Lille-by");
  });
  it("macht aus Silbenstrichen des Buchs Silbenzeichen (Option)", () => {
    expect(cleanOcr("sko-le og mor·gen-en", { bookSyllables: true })).toBe("sko·le og mor·gen·en");
    expect(cleanOcr("hed.der", { bookSyllables: true })).toBe("hed·der");
    expect(cleanOcr("sko-\nle", { bookSyllables: true })).toBe("sko·le");
  });
  it("verwirft Absätze ohne Buchstaben", () => {
    expect(cleanOcr("42\n\nTekst")).toBe("Tekst");
  });
});

describe("parasFromOcr", () => {
  it("behält sichere Zeilen und fasst sie zu einem Absatz zusammen", () => {
    const d = page(
      line(100, [["Det", 96], ["bliver", 97], ["en", 97], ["lang", 96], ["tur", 97]]),
      line(140, [["De", 96], ["ser", 95], ["et", 97], ["egern", 96]]),
    );
    expect(texts(d)).toEqual(["Det bliver en lang tur De ser et egern"]);
  });

  it("filtert Bildrauschen mit niedriger Sicherheit heraus", () => {
    const d = page(
      line(100, [["FJ", 20], ["|", 42], ["THR", 24]]),            // nur Rauschen
      line(300, [["Det", 96], ["bliver", 97], ["en", 97], ["lang", 96], ["tur", 97]]),
    );
    expect(texts(d)).toEqual(["Det bliver en lang tur"]);
  });

  it("schneidet Rauschen hinter einer großen Lücke ab", () => {
    const l = line(100, [["Det", 96], ["bliver", 97], ["en", 97], ["lang", 96], ["tur", 97]]);
    l.words.push({ text: "SK", confidence: 26, bbox: { x0: 900, y0: 100, x1: 950, y1: 130 } });
    expect(texts(page(l))).toEqual(["Det bliver en lang tur"]);
  });

  it("behält unsichere Wörter mitten in einer sicheren Zeile", () => {
    const d = page(line(100, [["Når", 97], ["vi", 97], ["spiser", 32], ["vores", 45], ["mad,", 97]]));
    expect(texts(d)).toEqual(["Når vi spiser vores mad,"]);
  });

  it("holt ein unsicheres Wort am linken Absatzrand zurück", () => {
    const d = page(
      line(100, [["Klassen", 96], ["skal", 97], ["på", 97], ["tur", 97]]),
      line(140, [["klassen", 43], ["er", 96], ["på", 97], ["tur", 96], ["i", 97], ["dag", 96]]),
    );
    expect(texts(d)[0]).toContain("klassen er på tur");
  });

  it("trennt Überschrift und Text bei anderer Schriftgröße", () => {
    const big: OcrLine = line(50, [["Bamse", 97]]);
    big.words[0].bbox.y1 = 110; big.bbox.y1 = 110;   // doppelt so hoch
    const d = page(big, line(130, [["Der", 96], ["var", 97], ["engang", 96], ["en", 97], ["bjørn", 96]]));
    expect(texts(d)).toEqual(["Bamse", "Der var engang en bjørn"]);
  });

  it("entfernt doppelt erkannte Zeilen", () => {
    const a = line(100, [["Det", 96], ["bliver", 97], ["en", 97], ["lang", 96], ["tur", 97]]);
    const b = line(102, [["Det", 90], ["bliver", 91], ["en", 92], ["lang", 90], ["tur", 91]]);
    expect(texts(page(a, b))).toEqual(["Det bliver en lang tur"]);
  });

  it("kombiniert mehrere Erkennungsläufe", () => {
    const run1 = page(line(100, [["Det", 96], ["bliver", 97], ["en", 97], ["lang", 96], ["tur", 97]]));
    const run2 = page(line(300, [["Bjørne-far", 92], ["var", 95], ["en", 96], ["stor", 95], ["bjørn", 94]]));
    expect(parasFromOcr(run1, run2).map((p) => cleanOcr(p.raw))).toEqual(["Det bliver en lang tur", "Bjørne-far var en stor bjørn"]);
  });

  it("liefert Positionen für das Übermalen", () => {
    const [p] = parasFromOcr(page(line(100, [["Det", 96], ["bliver", 97], ["en", 97], ["lang", 96]])));
    expect(p.bbox.y0).toBe(100);
    expect(p.words.length).toBe(4);
    expect(p.lh).toBe(H);
  });
});

describe("Fettdruck", () => {
  it("markiert fette Wörter mit *…* und fasst aufeinanderfolgende zusammen", () => {
    const l = line(100, [["Der", 95], ["store", 95], ["bjørn", 95], ["sover", 95], ["nu", 95]]);
    l.words[1].bold = true; l.words[2].bold = true; l.words[4].bold = true;
    expect(texts(page(l))).toEqual(["Der *store bjørn* sover *nu*"]);
  });
});
