import { test as base, expect, type Page } from "@playwright/test";
import { CoverageReport } from "monocart-coverage-reports";
import { e2eCoverage } from "./coverage-options";

/**
 * Playwright-`test` mit automatischer Abdeckungsmessung (nur mit COVERAGE=1):
 * Chromium meldet, welcher Code der App im Browser lief.
 *
 * Beim Neuladen verwirft Chromium die Zählungen der alten Seite. Darum wird vor jedem
 * `goto`/`reload` der bisherige Stand gesichert und die Messung neu gestartet.
 */
export const test = base.extend<{ autoCoverage: void }>({
  autoCoverage: [async ({ page }, use) => {
    if (!process.env.COVERAGE) { await use(); return; }
    const report = new CoverageReport(e2eCoverage);
    const start = () => page.coverage.startJSCoverage({ resetOnNavigation: false });
    const save = async () => {
      const data = await page.coverage.stopJSCoverage();
      for (const entry of data) await report.add([entry]);   // einzeln, damit gleiche Skripte zusammengeführt werden
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
