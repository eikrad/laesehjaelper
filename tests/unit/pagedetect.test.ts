import { describe, expect, it } from "vitest";
import { anglesOk, frameFromCorners, inside, orderCorners, toFrame } from "../../src/pagedetect";
import type { Corners } from "../../src/types";

describe("Frame geometry", () => {
  it("Orders corners: top left, top right, bottom right, bottom left", () => {
    expect(orderCorners([[100, 900], [80, 50], [700, 880], [720, 60]])).toEqual([[80, 50], [720, 60], [700, 880], [100, 900]]);
  });
  it("Places edge midpoints between the corners", () => {
    const f = frameFromCorners([[0, 0], [100, 0], [100, 200], [0, 200]]);
    expect(f.mids).toEqual([[50, 0], [100, 100], [50, 200], [0, 100]]);
  });
  it("Converts legacy corner-only data into frames", () => {
    const c: Corners = [[0, 0], [10, 0], [10, 10], [0, 10]];
    expect(toFrame(c)?.corners).toEqual(c);
    expect(toFrame(null)).toBeNull();
    const f = frameFromCorners(c);
    expect(toFrame(f)).toBe(f);
  });
});

describe("Page detection quadrilateral validation", () => {
  const rect: [number, number][] = [[0, 0], [100, 0], [100, 140], [0, 140]];
  it("Accepts rectangles and slightly distorted pages", () => {
    expect(anglesOk(rect)).toBe(true);
    expect(anglesOk([[5, 10], [100, 0], [108, 140], [0, 135]])).toBe(true);
  });
  it("Rejects severely skewed quadrilaterals such as shadows and table edges", () => {
    expect(anglesOk([[0, 0], [100, 0], [160, 100], [60, 100]])).toBe(false);
  });
  it("Detects whether the image center lies inside the page", () => {
    expect(inside(rect, 50, 70)).toBe(true);
    expect(inside(rect, 150, 70)).toBe(false);
    expect(inside([[0, 0], [0, 140], [100, 140], [100, 0]], 50, 70)).toBe(true);   // Opposite winding order
  });
});

it("Orders diagonally photographed pages without duplicate corners", () => {
  const c: Corners = [[500, 100], [900, 510], [490, 900], [100, 505]];
  expect(anglesOk(c)).toBe(true);
  expect(orderCorners(c)).toEqual(c);
  expect(orderCorners([c[2], c[0], c[3], c[1]])).toEqual(c);
});
