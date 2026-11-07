import { createRequire } from "node:module";
import type { CV } from "../../src/pagedetect";

/**
 * OpenCV.js for unit tests. Depending on the build, the module is a promise, or an object
 * whose WebAssembly runtime is still starting (like getCv() in src/app.ts).
 */
export async function loadCv(): Promise<CV> {
  let cv = createRequire(import.meta.url)("@techstark/opencv-js");
  if (cv instanceof Promise) cv = await cv;
  else if (!cv.Mat) await new Promise<void>(r => { cv.onRuntimeInitialized = r; });
  return cv;
}
