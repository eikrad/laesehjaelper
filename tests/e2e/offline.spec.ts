import { expect, test } from "./fixtures";

test("App lädt nach dem ersten Besuch auch offline", async ({ page, context }) => {
  await page.goto("/");
  await page.waitForFunction(() => navigator.serviceWorker?.controller, null, { timeout: 30_000 }).catch(() => {});
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".cta")).toBeVisible();
  await context.setOffline(false);
});

test("Manifest ist vorhanden", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.name).toBe("Læsehjælper");
  expect(m.icons.length).toBeGreaterThanOrEqual(2);
});
