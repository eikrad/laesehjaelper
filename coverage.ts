// Gesamte Testabdeckung: Unit- und E2E-Rohdaten zusammenführen (nach `coverage:unit` und `coverage:e2e`)
// und prüfen, dass sie nicht unter die Mindestwerte fällt.
import { CoverageReport } from "monocart-coverage-reports";

/** Mindestabdeckung in Prozent (etwas unter dem Stand vom 2. 11. 2026: 89,5 / 78,4 / 92,5). */
const MIN = { lines: 88, branches: 76, functions: 90 };

const results = await new CoverageReport({
  name: "Læsehjælper – Testabdeckung gesamt",
  inputDir: ["coverage/unit/raw", "coverage/e2e/raw"],
  outputDir: "coverage/merged",
  sourceFilter: { "**/src/**": true, "**/*": false },
  reports: ["v8", "console-details", "lcovonly"],
}).generate();

const low = (Object.keys(MIN) as (keyof typeof MIN)[]).filter((k) => Number(results?.summary[k].pct ?? 0) < MIN[k]);
for (const k of low) console.error(`Abdeckung ${k}: ${results?.summary[k].pct} % < Mindestwert ${MIN[k]} %`);
if (low.length) process.exit(1);
console.log("Abdeckung über den Mindestwerten:", Object.entries(MIN).map(([k, v]) => `${k} ≥ ${v} %`).join(", "));
