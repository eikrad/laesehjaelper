import { describe, expect, it } from "vitest";
import { frameFromCorners, orderCorners, toFrame } from "../../src/pagedetect";
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
