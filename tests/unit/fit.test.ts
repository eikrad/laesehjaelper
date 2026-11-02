import { describe, expect, it } from "vitest";
import { harmonizeSizes } from "../../src/fit";

// lh = Zeilenhöhe im Original, fit = größte Schrift, die in das Feld passt
describe("harmonizeSizes", () => {
  it("gleich große Originalschrift bekommt dieselbe (kleinste passende) Größe", () => {
    expect(harmonizeSizes([{ lh: 20, fit: 30 }, { lh: 21, fit: 26 }])).toEqual([26, 26]);
  });
  it("eine Überschrift bleibt größer als der Fließtext, auch wenn ihr Feld knapp ist", () => {
    const [head, body] = harmonizeSizes([{ lh: 40, fit: 30 }, { lh: 20, fit: 32 }]);
    expect(head).toBeLessThanOrEqual(30);              // passt weiter in ihr Feld
    expect(head / body).toBeGreaterThanOrEqual(Math.sqrt(2) - 1e-9);
  });
  it("lässt passende Verhältnisse unverändert", () => {
    expect(harmonizeSizes([{ lh: 40, fit: 60 }, { lh: 20, fit: 30 }])).toEqual([60, 30]);
  });
  it("verkleinert nur, nie über die passende Größe hinaus", () => {
    const items = [{ lh: 50, fit: 24 }, { lh: 25, fit: 40 }, { lh: 12, fit: 40 }];
    harmonizeSizes(items).forEach((s, i) => expect(s).toBeLessThanOrEqual(items[i].fit));
  });
  it("ignoriert Felder ohne Messung", () => {
    expect(harmonizeSizes([{ lh: 20, fit: 0 }, { lh: 20, fit: 30 }])).toEqual([0, 30]);
  });
});

it("gleicht schwankende OCR-Zeilenhöhen ohne Schrumpfschleife ab", () => {
  const items = [{ lh: 20, fit: 32 }, { lh: 23, fit: 32 }, { lh: 27, fit: 32 }];
  const sizes = harmonizeSizes(items);
  expect(Math.min(...sizes)).toBeGreaterThan(24);
  expect(sizes[2]).toBe(32);
  expect(sizes[0]).toBe(sizes[1]);
  expect(harmonizeSizes([...items].reverse())).toEqual([...sizes].reverse());
});
