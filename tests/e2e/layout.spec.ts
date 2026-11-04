import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { addPhotos, fixture, fresh, waitForText } from "./helpers";

// Layout checks. Unlike the other specs, these run at every screen size the app is
// designed for: phone, tablet portrait, tablet landscape and laptop (see playwright.config.ts).

test.beforeEach(async ({ page }) => { await fresh(page); });

/** How far the page can be scrolled sideways, in CSS pixels. */
const sidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test("The start screen fits the screen width", async ({ page }) => {
  expect(await sidewaysScroll(page)).toBe(0);
});

test("A book page fits the screen width", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg"]);
  await waitForText(page);
  expect(await sidewaysScroll(page)).toBe(0);
});

test("The toolbar fits on one line inside the screen in every language", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg"]);   // With a photo, so the compare button is shown too.
  await waitForText(page);
  const viewport = page.viewportSize()!;
  // Check both sides of the compact-toolbar breakpoint without repeating OCR.
  const widths = viewport.width === 360 ? [360, 440, 441, 600, 601] : [viewport.width];
  for (const width of widths) {
    await page.setViewportSize({ width, height: viewport.height });
    for (const lang of ["da", "de", "en"]) {
      await page.click(`#uiLang button[data-v=${lang}]`);
      for (const button of await page.locator("#dock button:visible").all()) {
        const box = (await button.boundingBox())!;
        expect(box.x, `${width}px, ${lang}: ${await button.getAttribute("id")}`).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, `${width}px, ${lang}: ${await button.getAttribute("id")}`).toBeLessThanOrEqual(width);
      }
      // The read-aloud label does not wrap onto a second line.
      const lines = await page.locator("#readBtn span").evaluate(el => {
        const r = document.createRange(); r.selectNodeContents(el);
        return new Set([...r.getClientRects()].map(rect => Math.round(rect.top))).size;
      });
      expect(lines, `${width}px, ${lang}`).toBeLessThanOrEqual(1);
    }
  }
});

test("The crop dialog fills the screen and keeps its buttons after turning the device", async ({ page }, info) => {
  test.skip(!info.project.use.hasTouch, "Laptops are not turned.");
  await page.setInputFiles("#file", fixture("side-da.jpg"));
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
  const { width, height } = page.viewportSize()!;
  await page.setViewportSize({ width: height, height: width });   // Rotate.
  await expect(async () => {
    const dlg = (await page.locator("#crop").boundingBox())!;
    expect(Math.round(dlg.y), "dialog top").toBe(0);
    expect(Math.round(dlg.height), "dialog height").toBe(width);
    for (const id of ["#cropOk", "#cropWhole"]) {
      const b = (await page.locator(id).boundingBox())!;
      expect(b.y + b.height, id).toBeLessThanOrEqual(width);
    }
  }).toPass({ timeout: 5_000 });
});
