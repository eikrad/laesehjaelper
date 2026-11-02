import { CoverageReport } from "monocart-coverage-reports";
import { e2eCoverage } from "./coverage-options";

/** Generate the report from the collected data after all end-to-end tests. */
export default async function teardown() {
  if (process.env.COVERAGE) await new CoverageReport(e2eCoverage).generate();
}
