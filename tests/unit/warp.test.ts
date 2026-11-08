import { expect, it, vi } from "vitest";
import { detectFrame, frameFromCorners, warpPage } from "../../src/pagedetect";
import type { Corners } from "../../src/types";
import { loadCv } from "./opencv";

it("Straightens a flat perspective page without introducing curvature", async () => {
  const cv = await loadCv();
  const W = 200, H = 294;
  const page = new cv.Mat(H, W, cv.CV_8UC4);
  page.data.fill(255);
  for (let y = 145; y <= 149; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    page.data[i] = page.data[i + 1] = page.data[i + 2] = 0;
  }
  const corners: Corners = [[20, 20], [220, 30], [170, 320], [40, 270]];
  const from = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, W, 0, W, H, 0, H]);
  const to = cv.matFromArray(4, 1, cv.CV_32FC2, corners.flat());
  const transform = cv.getPerspectiveTransform(from, to), photo = new cv.Mat();
  cv.warpPerspective(page, photo, transform, new cv.Size(260, 360));
  let output: InstanceType<typeof cv.Mat> | undefined;
  const canvas = {} as HTMLCanvasElement;
  vi.stubGlobal("document", { createElement: () => canvas });
  try {
    warpPage({ ...cv, imread: () => photo.clone(), imshow: (_: unknown, mat: InstanceType<typeof cv.Mat>) => { output = mat.clone(); } }, canvas, frameFromCorners(corners));
    const inkAt = (x: number) => {
      const ys = Array.from({ length: output!.rows - 40 }, (_, y) => y + 20).filter(y => output!.data[(y * output!.cols + x) * 4] < 100);
      return ys.reduce((a, b) => a + b, 0) / ys.length;
    };
    expect(inkAt(20)).toBeCloseTo(147, 0);
    expect(Math.abs(inkAt(20) - inkAt(180))).toBeLessThan(1);
  } finally {
    [page, from, to, transform, photo, output].forEach(m => m?.delete());
    vi.unstubAllGlobals();
  }
});

it("Automatically straightens the bowed text line of a photographed page", async () => {
  const cv = await loadCv(), W = 360, H = 640;
  const photo = new cv.Mat(H, W, cv.CV_8UC4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = (x - 40) / 280, bow = 4 * u * (1 - u);
    const paper = u >= 0 && u <= 1 && y >= 60 + 24 * bow && y <= 560 + 52 * bow;
    const ink = paper && x > 60 && x < 300 && Math.abs(y - (220 + 33 * bow)) <= 2;
    const colour = ink ? [25, 25, 25] : paper ? [235, 220, 195] : [135, 90, 55];
    const i = (y * W + x) * 4;
    for (let c = 0; c < 3; c++) photo.data[i + c] = colour[c];
    photo.data[i + 3] = 255;
  }
  let output: InstanceType<typeof cv.Mat> | undefined;
  const canvas = { width: W, height: H } as HTMLCanvasElement;
  const host = { ...cv, imread: () => photo.clone(), imshow: (_: unknown, mat: InstanceType<typeof cv.Mat>) => { output = mat.clone(); } };
  vi.stubGlobal("document", { createElement: () => canvas });
  const lineAt = (img: InstanceType<typeof cv.Mat>, x: number) => {
    const ys = Array.from({ length: img.rows - 120 }, (_, y) => y + 60).filter(y => img.data[(y * img.cols + x) * 4] < 70);
    expect(ys.length).toBeGreaterThan(0);
    return ys.reduce((a, b) => a + b, 0) / ys.length;
  };
  try {
    const frame = detectFrame(host, canvas);
    expect(frame).not.toBeNull();
    const before = Math.abs(lineAt(photo, 180) - lineAt(photo, 70));
    expect(before).toBeGreaterThan(20);
    warpPage(host, canvas, frame!);
    const ys = [30, Math.round(output!.cols / 2), output!.cols - 30].map(x => lineAt(output!, x));
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(4);
  } finally {
    photo.delete(); output?.delete(); vi.unstubAllGlobals();
  }
});
