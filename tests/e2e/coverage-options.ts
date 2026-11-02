import type { CoverageReportOptions } from "monocart-coverage-reports";

/** Nur der App-Code (eingebettetes Skript der Startseite), zugeordnet über die Source-Map zu src/. */
export const e2eCoverage: CoverageReportOptions = {
  name: "Læsehjælper – End-to-End-Tests",
  outputDir: "coverage/e2e",
  reports: ["raw", "console-summary"],
  entryFilter: (entry) => entry.url.startsWith("http://localhost:4173/") && !/\/(core|lang)\/|worker|opencv|tesseract|sw\.js/.test(entry.url),
  sourceFilter: { "**/src/**": true, "**/*": false },
};
