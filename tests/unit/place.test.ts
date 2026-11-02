import { describe, expect, it } from "vitest";
import { dragBox, transferPlaces } from "../../src/place";

const b = { x0: 100, y0: 200, x1: 500, y1: 300 };
const bounds = { W: 1000, H: 1400 };

describe("dragBox", () => {
  it("Moves the box", () => {
    expect(dragBox(b, 10, 150, "move", bounds)).toEqual({ x0: 110, y0: 350, x1: 510, y1: 450 });
  });
  it("Keeps the box on the page while moving", () => {
    expect(dragBox(b, -500, 2000, "move", bounds)).toEqual({ x0: 0, y0: 1300, x1: 400, y1: 1400 });
  });
  it("Resizes the box when dragging its handle", () => {
    expect(dragBox(b, 50, 100, "resize", bounds)).toEqual({ x0: 100, y0: 200, x1: 550, y1: 400 });
  });
  it("Prevents resizing below the minimum size or beyond the page", () => {
    const small = dragBox(b, -1000, -1000, "resize", bounds);
    expect(small.x1 - small.x0).toBeGreaterThanOrEqual(40);
    expect(small.y1 - small.y0).toBeGreaterThanOrEqual(20);
    expect(dragBox(b, 5000, 5000, "resize", bounds)).toEqual({ x0: 100, y0: 200, x1: 1000, y1: 1400 });
  });
});

describe("transferPlaces", () => {
  const para = (bbox: typeof b, place?: typeof b) => ({ bbox, place });
  it("Retains a moved position when the box survives another recognition pass", () => {
    const old = [para(b, { x0: 100, y0: 500, x1: 500, y1: 600 })];
    const neu = [para({ x0: 104, y0: 202, x1: 498, y1: 305 }), para({ x0: 100, y0: 900, x1: 500, y1: 1000 })];
    const out = transferPlaces(old, neu);
    expect(out[0].place).toEqual({ x0: 100, y0: 500, x1: 500, y1: 600 });
    expect(out[1].place).toBeUndefined();
  });
  it("Transfers nothing when the box no longer exists", () => {
    const old = [para(b, { x0: 100, y0: 500, x1: 500, y1: 600 })];
    expect(transferPlaces(old, [para({ x0: 600, y0: 800, x1: 900, y1: 900 })])[0].place).toBeUndefined();
  });
  it("Handles missing previous boxes", () => {
    expect(transferPlaces(null, [para(b)])).toEqual([para(b)]);
  });
});
