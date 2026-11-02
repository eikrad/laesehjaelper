import type { CoverageReportOptions } from "monocart-coverage-reports";

/** Only application code: the start page inline script, mapped to src/ through its source map. */
export const e2eCoverage: CoverageReportOptions = {
  name: "Læsehjælper – End-to-end tests",
  outputDir: "coverage/e2e",
  reports: ["raw", "console-summary"],
  entryFilter: (entry) => entry.url.startsWith("http://localhost:4173/") && !/\/(core|lang)\/|worker|opencv|tesseract|sw\.js/.test(entry.url),
  sourceFilter: { "**/src/**": true, "**/*": false },
};
