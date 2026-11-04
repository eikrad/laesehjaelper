import { defineConfig, devices } from "@playwright/test";

const LAYOUT = /layout\.spec\.ts$/;

export default defineConfig({
  testDir: "tests/e2e",
  globalTeardown: "./tests/e2e/coverage-teardown.ts",
  timeout: 240_000,
  expect: { timeout: 20_000 },
  // Every test starts from a fresh browser context, so tests can run side by side.
  // GitHub's runners for public repositories have 4 CPUs; locally Playwright uses half the CPUs.
  fullyParallel: true,
  workers: process.env.CI ? 4 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:4173",
    viewport: { width: 820, height: 1180 },   // Portrait tablet.
    acceptDownloads: true,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", testIgnore: LAYOUT, use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 } } },
    // Layout checks run at every screen size the app is designed for; tablets are the main device.
    // Phone uses 360 px, the narrowest common width (many Android phones). Touch devices report
    // their screen in portrait, as iPads do; "Desktop Chrome" would report 1920×1080.
    { name: "phone", testMatch: LAYOUT, use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 780 }, screen: { width: 360, height: 780 }, hasTouch: true, isMobile: true } },
    { name: "tablet-portrait", testMatch: LAYOUT, use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 }, screen: { width: 820, height: 1180 }, hasTouch: true, isMobile: true } },
    { name: "tablet-landscape", testMatch: LAYOUT, use: { ...devices["Desktop Chrome"], viewport: { width: 1180, height: 820 }, screen: { width: 820, height: 1180 }, hasTouch: true, isMobile: true } },
    { name: "laptop", testMatch: LAYOUT, use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: { command: "node tests/e2e/server.ts", url: "http://localhost:4173", reuseExistingServer: !process.env.CI },
});
