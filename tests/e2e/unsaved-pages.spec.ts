import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { fixture, fresh, storedPages } from "./helpers";

test.use({ serviceWorkers: "block" });

/** Recognition never finishes: these tests are about saving, not about text. */
async function withoutRecognition(page: Page) {
  await page.route("**/tesseract.min.js", route => route.fulfill({ contentType: "text/javascript", body:
    "window.Tesseract = { createWorker: async () => new Promise(() => {}) };",
  }));
}

/** Device storage refuses page writes until `storageWorks()` is called, as when the device is full. */
async function failPageWrites(page: Page) {
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    const state = { failing: true };
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore["put"]>) {
      if (state.failing && this.name === "pages") throw new DOMException("The device is full.", "QuotaExceededError");
      return put.apply(this, args);
    };
    Object.assign(window, { storageWorks: () => { state.failing = false; } });
  });
}
const storageWorks = (page: Page) => page.evaluate(() => (window as unknown as { storageWorks: () => void }).storageWorks());

async function choosePhotos(page: Page, count: number) {
  await page.setInputFiles("#file", Array.from({ length: count }, () => fixture("side-da.jpg")));
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
}

test("A page whose save failed is stored by the next successful save of its book", async ({ page }) => {
  await fresh(page);
  await withoutRecognition(page);
  await page.reload();
  await choosePhotos(page, 2);
  await failPageWrites(page);
  await page.click("#cropWhole");
  await expect(page.locator("#thumbs .thumb")).toHaveCount(1);
  await storageWorks(page);
  await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
  await page.click("#cropWhole");
  await expect.poll(async () => (await storedPages(page)).filter(p => p.photo).length).toBe(2);
  await page.reload();
  await expect(page.locator("#count")).toHaveText("1 / 2");
});
