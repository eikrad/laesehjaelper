import { describe, expect, it } from "vitest";
import { detectFrame, detectPage } from "../../src/pagedetect";
import { loadCv } from "./opencv";

const cv = await loadCv();

/** Run detection on a self-made photo (an OpenCV image instead of a canvas). */
const detect = (photo: InstanceType<typeof cv.Mat>) =>
  detectPage({ ...cv, imread: () => photo.clone() }, { width: photo.cols, height: photo.rows } as HTMLCanvasElement);

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
      const corners = detect(photo);
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

it("Suggests the curve of visible page edges instead of their straight chords", () => {
  const photo = bookPhoto(true);
  try {
    const frame = detectFrame({ ...cv, imread: () => photo.clone() }, { width: photo.cols, height: photo.rows } as HTMLCanvasElement);
    expect(frame).not.toBeNull();
    const [tl, tr, br, bl] = frame!.corners;
    const top = (tl[1] + tr[1]) / 2, bottom = (bl[1] + br[1]) / 2;
    expect(frame!.mids[0][1]).toBeLessThan(top - 10);
    expect(frame!.mids[2][1]).toBeGreaterThan(bottom + 8);
    // The right edge is the photo border, so it provides no curvature information.
    expect(frame!.mids[1][0]).toBeCloseTo((tr[0] + br[0]) / 2, 0);
  } finally { photo.delete(); }
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
      expect(detect(photo)).toBeNull();
    } finally { photo.delete(); }
  }
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
    expect(detect(photo)).toBeNull();
  } finally { photo.delete(); }
});
it("Selects the central page rather than the visible strip of its neighbour", () => {
  const photo = scene("neighbour");
  try {
    const corners = detect(photo);
    expect(corners).not.toBeNull();
    expect(corners![0][0]).toBeGreaterThan(80);
    expect(corners![3][0]).toBeGreaterThan(80);
    expect(corners![1][0]).toBeGreaterThan(330);
  } finally { photo.delete(); }
});

it("Finds the whole page when a strong shadow covers half of it", () => {
  const photo = bookPhoto(true, true);
  try {
    const corners = detect(photo);
    expect(corners).not.toBeNull();
    expect(corners![0][0]).toBeLessThan(25);
    expect(corners![3][0]).toBeLessThan(25);
    expect(corners![1][0]).toBeGreaterThan(345);
    expect(corners![2][0]).toBeGreaterThan(345);
  } finally { photo.delete(); }
});

/** Self-made open spread: the page in the middle, a soft shadow at the fold, the facing page leaving the photo. */
function spread() {
  const width = 360, height = 640;
  const photo = new cv.Mat(height, width, cv.CV_8UC4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let colour = [165, 117, 72];
    if (y > 60 && y < 580 && x > 30) {
      const fold = Math.abs(x - 253) / 9; // 18 px wide, darkest at the fold
      colour = [225, 200, 155].map(c => (fold < 1 ? c * (0.55 + 0.45 * fold) : c));
    }
    const i = (y * width + x) * 4;
    for (let c = 0; c < 3; c++) photo.data[i + c] = colour[c];
    photo.data[i + 3] = 255;
  }
  return photo;
}

it("Stops at the fold rather than taking in the facing page that leaves the photo", () => {
  const photo = spread();
  try {
    const corners = detect(photo);
    expect(corners).not.toBeNull();
    expect(corners![1][0]).toBeLessThan(260);
    expect(corners![2][0]).toBeLessThan(260);
  } finally { photo.delete(); }
});

/** A page inside the photo, with a paper bookmark above it and a finger over its right edge. */
function heldPage() {
  const width = 360, height = 640;
  const photo = new cv.Mat(height, width, cv.CV_8UC4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let colour = [165, 117, 72];
    const page = x >= 40 && x < 320 && y >= 60 && y < 580;
    const bookmark = x >= 170 && x < 190 && y >= 40 && y < 60;
    const finger = x >= 300 && x < 342 && y >= 300 && y < 345;
    if (page || bookmark) colour = [225, 200, 155];
    if (finger) colour = [222, 190, 150];
    const i = (y * width + x) * 4;
    for (let c = 0; c < 3; c++) photo.data[i + c] = colour[c];
    photo.data[i + 3] = 255;
  }
  return photo;
}

it("Keeps the page edges where they are when a bookmark or finger sticks out", () => {
  const photo = heldPage();
  try {
    const corners = detect(photo);
    expect(corners).not.toBeNull();
    const expected = [[40, 60], [320, 60], [320, 580], [40, 580]];
    corners!.forEach(([x, y], i) => {
      expect(Math.abs(x - expected[i][0])).toBeLessThanOrEqual(6);
      expect(Math.abs(y - expected[i][1])).toBeLessThanOrEqual(6);
    });
  } finally { photo.delete(); }
});

it("Keeps flat edges straight, also where a finger or bookmark covers part of the outline", () => {
  for (const photo of [bookPhoto(false), heldPage()]) {
    try {
      const frame = detectFrame({ ...cv, imread: () => photo.clone() }, { width: photo.cols, height: photo.rows } as HTMLCanvasElement);
      expect(frame).not.toBeNull();
      frame!.mids.forEach((m, i) => {
        const a = frame!.corners[i], b = frame!.corners[(i + 1) % 4];
        expect(Math.hypot(m[0] - (a[0] + b[0]) / 2, m[1] - (a[1] + b[1]) / 2)).toBeLessThan(0.01);
      });
    } finally { photo.delete(); }
  }
});

it("Does not turn a round illustration or irregular outline into a curved page", () => {
  for (const round of [true, false]) {
    const W = 360, H = 640, photo = new cv.Mat(H, W, cv.CV_8UC4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const shape = round ? Math.hypot(x - 180, y - 320) < 150 :
        x > 35 && x < 325 && y > 80 + 24 * Math.sin(x / 22) && y < 560 + 24 * Math.sin(x / 22);
      const rgb = shape ? [235, 220, 195] : [135, 90, 55], i = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) photo.data[i + c] = rgb[c];
      photo.data[i + 3] = 255;
    }
    try {
      expect(detectFrame({ ...cv, imread: () => photo.clone() }, { width: W, height: H } as HTMLCanvasElement)).toBeNull();
    } finally { photo.delete(); }
  }
});
