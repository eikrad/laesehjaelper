// Merge raw unit and E2E coverage after `coverage:unit` and `coverage:e2e`,
// then check that the combined coverage meets the minimum thresholds.
import { CoverageReport } from "monocart-coverage-reports";

/** Minimum coverage percentages, just below the November 2, 2026 results: 89.5 / 78.4 / 92.5. */
const MIN = { lines: 88, branches: 76, functions: 90 };

const results = await new CoverageReport({
  name: "Læsehjælper – Combined test coverage",
  inputDir: ["coverage/unit/raw", "coverage/e2e/raw"],
  outputDir: "coverage/merged",
  sourceFilter: { "**/src/**": true, "**/*": false },
  reports: ["v8", "console-details", "lcovonly"],
}).generate();

const low = (Object.keys(MIN) as (keyof typeof MIN)[]).filter((k) => Number(results?.summary[k].pct ?? 0) < MIN[k]);
for (const k of low) console.error(`Coverage ${k}: ${results?.summary[k].pct} % < minimum ${MIN[k]} %`);
if (low.length) process.exit(1);
console.log("Coverage meets the minimum thresholds:", Object.entries(MIN).map(([k, v]) => `${k} ≥ ${v} %`).join(", "));
