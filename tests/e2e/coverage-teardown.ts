import { CoverageReport } from "monocart-coverage-reports";
import { e2eCoverage } from "./coverage-options";

/** Nach allen E2E-Tests: Bericht aus den gesammelten Daten erzeugen. */
export default async function teardown() {
  if (process.env.COVERAGE) await new CoverageReport(e2eCoverage).generate();
}
