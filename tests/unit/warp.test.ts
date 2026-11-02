import { expect, it, vi } from "vitest";
import { createRequire } from "node:module";
import { frameFromCorners, warpPage } from "../../src/pagedetect";
import type { Corners } from "../../src/types";

it("Straightens a flat perspective page without introducing curvature", async () => {
  const cv: typeof import("@techstark/opencv-js") = await createRequire(import.meta.url)("@techstark/opencv-js");
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
