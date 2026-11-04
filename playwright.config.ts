import { defineConfig, devices } from "@playwright/test";

const LAYOUT = /layout\.spec\.ts$/;

export default defineConfig({
  testDir: "tests/e2e",
  globalTeardown: "./tests/e2e/coverage-teardown.ts",
  timeout: 240_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
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
    { name: "phone", testMatch: LAYOUT, use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
    { name: "tablet-portrait", testMatch: LAYOUT, use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true } },
    { name: "tablet-landscape", testMatch: LAYOUT, use: { ...devices["Desktop Chrome"], viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true } },
    { name: "laptop", testMatch: LAYOUT, use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: { command: "node tests/e2e/server.ts", url: "http://localhost:4173", reuseExistingServer: !process.env.CI },
});
