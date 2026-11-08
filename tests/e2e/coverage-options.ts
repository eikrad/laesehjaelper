import type { CoverageReportOptions } from "monocart-coverage-reports";

/** Only application code: the inline app and lazy PDF bundle, mapped to src/ through source maps. */
export const e2eCoverage: CoverageReportOptions = {
  name: "Læsehjælper – End-to-end tests",
  outputDir: "coverage/e2e",
  reports: ["raw", "console-summary"],
  entryFilter: (entry) => entry.url.startsWith("http://localhost:4173/") && !/\/(core|lang)\/|worker|opencv|tesseract|sw\.js/.test(entry.url),
  sourceFilter: { "**/node_modules/**": false, "**/src/**": true, "**/*": false },
};
