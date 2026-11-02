import { test as base, expect, type Page } from "@playwright/test";
import { CoverageReport } from "monocart-coverage-reports";
import { e2eCoverage } from "./coverage-options";

/**
 * Playwright `test` with automatic coverage collection (only with COVERAGE=1):
 * Chromium reports which application code ran in the browser.
 *
 * Reloading discards coverage counts from the previous page. Before each
 * `goto`/`reload`, save the current counts and restart coverage collection.
 */
export const test = base.extend<{ autoCoverage: void }>({
  autoCoverage: [async ({ page }, use) => {
    if (!process.env.COVERAGE) { await use(); return; }
    const report = new CoverageReport(e2eCoverage);
    const start = () => page.coverage.startJSCoverage({ resetOnNavigation: false });
    const save = async () => {
      const data = await page.coverage.stopJSCoverage();
      for (const entry of data) await report.add([entry]);   // Add entries individually so matching scripts are merged.
    };
    for (const m of ["goto", "reload"] as const) {
      const orig = page[m].bind(page) as (...a: unknown[]) => ReturnType<Page[typeof m]>;
      (page as unknown as Record<string, unknown>)[m] = async (...args: unknown[]) => { await save(); await start(); return orig(...args); };
    }
    await start();
    await use();
    await save();
  }, { auto: true }],
});
export { expect };
