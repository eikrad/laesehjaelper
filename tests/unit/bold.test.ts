import { describe, expect, it } from "vitest";
import { strokeWidth, boldFlags } from "../../src/bold";

/** Graues Testbild: weißer Grund, senkrechte schwarze Striche der Breite s */
function strokes(w: number, h: number, s: number, gap = 6): Uint8ClampedArray {
  const g = new Uint8ClampedArray(w * h).fill(250);
  for (let x0 = 2; x0 + s < w; x0 += s + gap) for (let y = 3; y < h - 3; y++) for (let x = x0; x < x0 + s; x++) g[y * w + x] = 20;
  return g;
}

describe("strokeWidth", () => {
  it("misst dickere Striche als dicker", () => {
    expect(strokeWidth(strokes(60, 30, 5), 60, 30)).toBeGreaterThan(strokeWidth(strokes(60, 30, 2), 60, 30) * 1.8);
  });
  it("liegt bei breiten Strichen nahe an der echten Breite", () => {
    expect(strokeWidth(strokes(80, 40, 6), 80, 40)).toBeCloseTo(6, 0);
  });
  it("gibt NaN ohne Kontrast", () => {
    expect(strokeWidth(new Uint8ClampedArray(100).fill(200), 10, 10)).toBeNaN();
  });
});

describe("boldFlags", () => {
  it("markiert Wörter mit deutlich dickeren Strichen als üblich", () => {
    const r = [0.1, 0.11, 0.1, 0.09, 0.1, 0.105, 0.1, 0.2, 0.1, 0.14];
    expect(boldFlags(r)).toEqual(r.map((x) => x === 0.2));
  });
  it("markiert nichts, wenn es zu wenige Wörter für einen Vergleich gibt", () => {
    expect(boldFlags([0.1, 0.2, 0.1])).toEqual([false, false, false]);
  });
  it("markiert nichts, wenn die ganze Seite fett ist", () => {
    expect(boldFlags(new Array(10).fill(0.16))).toEqual(new Array(10).fill(false));
  });
  it("ignoriert fehlende Messungen", () => {
    const r = [0.1, NaN, 0.1, 0.1, 0.1, 0.1, 0.1, 0.2, 0.1, 0.1];
    expect(boldFlags(r)[1]).toBe(false);
    expect(boldFlags(r)[7]).toBe(true);
  });
});
