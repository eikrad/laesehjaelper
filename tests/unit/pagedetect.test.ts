import { describe, expect, it } from "vitest";
import { anglesOk, frameFromCorners, inside, orderCorners, toFrame } from "../../src/pagedetect";
import type { Corners } from "../../src/types";

describe("Rahmen-Geometrie", () => {
  it("ordnet Ecken: oben links, oben rechts, unten rechts, unten links", () => {
    expect(orderCorners([[100, 900], [80, 50], [700, 880], [720, 60]])).toEqual([[80, 50], [720, 60], [700, 880], [100, 900]]);
  });
  it("setzt Kantenmitten zwischen die Ecken", () => {
    const f = frameFromCorners([[0, 0], [100, 0], [100, 200], [0, 200]]);
    expect(f.mids).toEqual([[50, 0], [100, 100], [50, 200], [0, 100]]);
  });
  it("wandelt alte Daten (nur Ecken) in Rahmen um", () => {
    const c: Corners = [[0, 0], [10, 0], [10, 10], [0, 10]];
    expect(toFrame(c)?.corners).toEqual(c);
    expect(toFrame(null)).toBeNull();
    const f = frameFromCorners(c);
    expect(toFrame(f)).toBe(f);
  });
});

describe("Viereck-Prüfung der Seitenerkennung", () => {
  const rect: [number, number][] = [[0, 0], [100, 0], [100, 140], [0, 140]];
  it("akzeptiert Rechtecke und leicht verzerrte Seiten", () => {
    expect(anglesOk(rect)).toBe(true);
    expect(anglesOk([[5, 10], [100, 0], [108, 140], [0, 135]])).toBe(true);
  });
  it("verwirft stark schiefe Vierecke (z. B. Schatten, Tischkanten)", () => {
    expect(anglesOk([[0, 0], [100, 0], [160, 100], [60, 100]])).toBe(false);
  });
  it("erkennt, ob die Bildmitte in der Seite liegt", () => {
    expect(inside(rect, 50, 70)).toBe(true);
    expect(inside(rect, 150, 70)).toBe(false);
    expect(inside([[0, 0], [0, 140], [100, 140], [100, 0]], 50, 70)).toBe(true);   // andere Umlaufrichtung
  });
});

it("ordnet diagonal fotografierte Seiten ohne doppelte Ecken", () => {
  const c: Corners = [[500, 100], [900, 510], [490, 900], [100, 505]];
  expect(anglesOk(c)).toBe(true);
  expect(orderCorners(c)).toEqual(c);
  expect(orderCorners([c[2], c[0], c[3], c[1]])).toEqual(c);
});
