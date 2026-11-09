// Merge raw unit and E2E coverage after `coverage:unit` and `coverage:e2e`,
// then check that the combined coverage meets the minimum thresholds.
// CI passes the raw folders it downloaded from its parallel jobs as arguments.
import { CoverageReport } from "monocart-coverage-reports";

const inputDir = process.argv.length > 2 ? process.argv.slice(2) : ["coverage/unit/raw", "coverage/e2e/raw"];

/** Keep a margin below the November 9, 2026 baseline: 92.93 / 85.60 / 95.50. */
const MIN = { lines: 92, branches: 84, functions: 93 };

const results = await new CoverageReport({
  name: "Læsehjælper – Combined test coverage",
  inputDir,
  outputDir: "coverage/merged",
  sourceFilter: { "**/node_modules/**": false, "**/src/**": true, "**/*": false },
  reports: ["v8", "console-details", "lcovonly"],
}).generate();

const low = (Object.keys(MIN) as (keyof typeof MIN)[]).filter((k) => Number(results?.summary[k].pct ?? 0) < MIN[k]);
for (const k of low) console.error(`Coverage ${k}: ${results?.summary[k].pct} % < minimum ${MIN[k]} %`);
if (low.length) process.exit(1);
console.log("Coverage meets the minimum thresholds:", Object.entries(MIN).map(([k, v]) => `${k} ≥ ${v} %`).join(", "));
