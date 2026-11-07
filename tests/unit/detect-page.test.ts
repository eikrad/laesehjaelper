import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { detectPage, encloseContour } from "../../src/pagedetect";
import type { Corners, Point } from "../../src/types";

const cv = await createRequire(import.meta.url)("@techstark/opencv-js");

/** Self-made paper on a similarly coloured table; its right edge leaves the photo. */
function bookPhoto(curved: boolean, shadow = false) {
  const width = 360, height = 640;
  const mat = new cv.Mat(height, width, cv.CV_8UC4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const top = 45 - x * 0.06 + (curved ? 18 * ((x - 180) / 180) ** 2 : 0);
    const bottom = 550 + x * 0.025 - (curved ? 16 * ((x - 180) / 180) ** 2 : 0);
    const paper = x >= 14 && y >= top && y <= bottom;
    const shade = paper ? (1 - 0.22 * x / width) * (shadow && x > 170 ? 0.6 : 1) : 1;
    const colour = paper ? [218, 189, 146] : [165, 117, 72];
    const grain = paper ? 0 : Math.sin(x * 0.5) * 10;
    const offset = (y * width + x) * 4;
    for (let c = 0; c < 3; c++) mat.data[offset + c] = colour[c] * shade + grain;
    mat.data[offset + 3] = 255;
  }
  // Short lines of invented print, away from the page boundary.
  for (let y = 95; y < 470; y += 28) for (let x = 45; x < 290; x++) {
    if (x % 17 < 11) for (let dy = 0; dy < 5; dy++) {
      const i = ((y + dy) * width + x) * 4;
      mat.data[i] = mat.data[i + 1] = mat.data[i + 2] = 35;
    }
  }
  return mat;
}

describe("Page detection on open books", () => {
  for (const curved of [false, true]) it(`Finds a ${curved ? "curved" : "flat"} page reaching the image boundary`, () => {
    const photo = bookPhoto(curved);
    try {
      const corners = detectPage({ ...cv, imread: () => photo.clone() }, { width: photo.cols, height: photo.rows } as HTMLCanvasElement);
      expect(corners).not.toBeNull();
      const [tl, tr, br, bl] = corners!;
      expect(tl[0]).toBeLessThan(25); expect(bl[0]).toBeLessThan(25);
      expect(tr[0]).toBeGreaterThan(345); expect(br[0]).toBeGreaterThan(345);
      expect(tl[1]).toBeLessThan(85); expect(tr[1]).toBeLessThan(85);
      expect(bl[1]).toBeGreaterThan(515); expect(br[1]).toBeGreaterThan(515);
      expect(bl[1]).toBeLessThan(585); expect(br[1]).toBeLessThan(585);
    } finally { photo.delete(); }
  });
});

it("Makes no suggestion for a uniform photo or table grain without a page", () => {
  for (const grain of [false, true]) {
    const width = 360, height = 640;
    const photo = new cv.Mat(height, width, cv.CV_8UC4);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const shade = grain ? 130 + 35 * Math.sin(x * 0.15 + Math.sin(y * 0.01)) : 180;
      const i = (y * width + x) * 4;
      photo.data[i] = shade; photo.data[i + 1] = shade * 0.7; photo.data[i + 2] = shade * 0.4; photo.data[i + 3] = 255;
    }
    try {
      expect(detectPage({ ...cv, imread: () => photo.clone() }, { width, height } as HTMLCanvasElement)).toBeNull();
    } finally { photo.delete(); }
  }
});

it("Keeps the bulging top of a page inside the suggested straight frame", () => {
  const q: Corners = [[20, 90], [340, 70], [350, 550], [10, 540]];
  const contour: Point[] = [...q, [180, 35], [170, 565]];
  const result = encloseContour(q, contour, 360, 640);
  for (let i = 0; i < 4; i++) {
    const a = result[i], b = result[(i + 1) % 4];
    for (const [x, y] of contour) {
      // A point on a fitted line can differ by floating-point roundoff.
      expect((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0])).toBeGreaterThanOrEqual(-1e-6);
    }
  }
  expect(result[0][1]).toBeLessThan(50);
  expect(result[1][1]).toBeLessThan(35);
  expect(result[2][1]).toBeGreaterThan(560);
  expect(result[3][1]).toBeGreaterThan(550);
});

function scene(kind: "shadow" | "table edge" | "two pages" | "neighbour") {
  const width = 360, height = 640;
  const photo = new cv.Mat(height, width, cv.CV_8UC4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let colour = [165, 117, 72];
    if (kind === "shadow" && x > 125) colour = [90, 63, 40];
    if (kind === "table edge" && y > 155) colour = [90, 63, 40];
    if (kind === "two pages" && y > 55 && y < 580 && ((x > 10 && x < 165) || (x > 195 && x < 350))) colour = [225, 200, 155];
    if (kind === "neighbour" && y > 55 && y < 580 && (x < 65 || (x > 95 && x < 345))) colour = [225, 200, 155];
    const i = (y * width + x) * 4;
    for (let c = 0; c < 3; c++) photo.data[i + c] = colour[c];
    photo.data[i + 3] = 255;
  }
  return photo;
}

for (const kind of ["shadow", "table edge", "two pages"] as const) it(`Makes no suggestion for ${kind} without an unambiguous central page`, () => {
  const photo = scene(kind);
  try {
    expect(detectPage({ ...cv, imread: () => photo.clone() }, { width: photo.cols, height: photo.rows } as HTMLCanvasElement)).toBeNull();
  } finally { photo.delete(); }
});
it("Selects the central page rather than the visible strip of its neighbour", () => {
  const photo = scene("neighbour");
  try {
    const corners = detectPage({ ...cv, imread: () => photo.clone() }, { width: photo.cols, height: photo.rows } as HTMLCanvasElement);
    expect(corners).not.toBeNull();
    expect(corners![0][0]).toBeGreaterThan(80);
    expect(corners![3][0]).toBeGreaterThan(80);
    expect(corners![1][0]).toBeGreaterThan(330);
  } finally { photo.delete(); }
});


it("Finds the whole page when a strong shadow covers half of it", () => {
  const photo = bookPhoto(true, true);
  try {
    const corners = detectPage({ ...cv, imread: () => photo.clone() }, { width: photo.cols, height: photo.rows } as HTMLCanvasElement);
    expect(corners).not.toBeNull();
    expect(corners![0][0]).toBeLessThan(25);
    expect(corners![3][0]).toBeLessThan(25);
    expect(corners![1][0]).toBeGreaterThan(345);
    expect(corners![2][0]).toBeGreaterThan(345);
  } finally { photo.delete(); }
});
