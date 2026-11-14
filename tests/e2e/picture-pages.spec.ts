import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { fresh, openRecognisedBook, openWorkshop, readBook } from "./helpers";

// Pages without readable text: picture-only pages, failed recognition and pages still waiting.
// While reading, a child sees the page photo, never instructions for adults or error messages (#216).
// Recognition is held up with network routes; the app's service worker would answer from its cache.
test.use({ serviceWorkers: "block" });
test.beforeEach(async ({ page }) => { await fresh(page); });

/** The reading view shows the page photo as the page, with nothing to read aloud and no text for adults. */
async function expectPhotoAsPage(page: Page) {
  const reader = page.locator("#reader");
  const photo = reader.locator(".pageview > img");
  await expect(photo).toBeVisible();
  await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  expect((await photo.boundingBox())!.height, "the photo fills the page area").toBeGreaterThan(page.viewportSize()!.height / 2);
  await expect(reader.locator(".status")).toHaveCount(0);
  await expect(reader.locator(".w")).toHaveCount(0);
  await expect(page.locator("#orig"), "the photo is not shown twice").toBeHidden();
  await expect(page.locator("#readBtn")).toBeDisabled();
  await expect(page.locator("#guideBtn")).toBeDisabled();
}

test("A page without text shows its photo while reading; the hint for adults stays in the workshop", async ({ page }) => {
  await openRecognisedBook(page, ["side-da.jpg", "side-da.jpg"], [{}, { text: "", rawText: "", paras: [], clean: null }]);
  await page.click("#next");
  await expectPhotoAsPage(page);
  await expect(page.locator("#reader")).toHaveText("");
  // Also in text-only view.
  await page.click("#setBtn"); await page.click('#viewSet button[data-v="tekst"]'); await page.click("#setClose");
  await expectPhotoAsPage(page);
  await openWorkshop(page);
  await expect(page.locator("#reader .status")).toContainText("Der blev ikke fundet nogen tekst");
});

test("A page whose recognition failed shows its photo while reading; the error stays in the workshop", async ({ page }) => {
  await page.route("**/lang/**", route => route.abort());
  await openRecognisedBook(page, ["side-da.jpg", "side-da.jpg"], [{}, { status: "wait" }]);
  await page.click("#next");
  await openWorkshop(page);
  await expect(page.locator("#reader .status")).toContainText("Genkendelsen mislykkedes", { timeout: 60_000 });
  await readBook(page);
  await expectPhotoAsPage(page);
  await expect(page.locator("#reader")).toHaveText("");
});

test("A page still waiting for recognition shows its photo with a calm loading sign while reading", async ({ page }) => {
  await page.route("**/worker.min.js", () => {});   // Never answers: the page keeps waiting.
  await openRecognisedBook(page, ["side-da.jpg", "side-da.jpg"], [{}, { status: "wait" }]);
  await page.click("#next");
  await expectPhotoAsPage(page);
  const sign = page.locator("#reader .page-wait");
  await expect(sign).toBeVisible();
  await expect(sign).toHaveAttribute("role", "status");
  await expect(sign).toHaveAccessibleName("Gøres klar …");
  await expect(sign).not.toContainText(/genkend/i);
  const arcs = sign.locator("path");
  await expect(arcs).toHaveCount(2);
  expect(await arcs.first().evaluate(p => getComputedStyle(p).animationName)).not.toBe("none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await arcs.first().evaluate(p => getComputedStyle(p).animationName), "still with reduced motion").toBe("none");
  // The workshop keeps showing recognition progress for the adult.
  await openWorkshop(page);
  await expect(page.locator("#reader .status .bar")).toBeVisible();
  await expect(page.locator("#reader .page-wait")).toHaveCount(0);
});
