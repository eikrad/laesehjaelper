import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { fixture, fresh, goShelf, openWorkshop, storedPages } from "./helpers";

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

test("An unsaved page is marked in the workshop page list, and Retry saves it", async ({ page }) => {
  await fresh(page);
  await withoutRecognition(page);
  await page.reload();
  await choosePhotos(page, 1);
  await failPageWrites(page);
  await page.click("#cropWhole");
  const thumb = page.locator("#thumbs .thumb").first();
  await expect(thumb.locator(".unsaved")).toHaveText("Ikke gemt");
  await storageWorks(page);
  await thumb.getByRole("button", { name: "Gem igen" }).click();
  await expect(thumb.locator(".unsaved")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#count")).toHaveText("1 / 1");
});

test("An unsaved page stays with its book after leaving it, and the shelf marks the book", async ({ page }) => {
  await fresh(page);
  await withoutRecognition(page);
  await page.reload();
  await choosePhotos(page, 1);
  await failPageWrites(page);
  await page.click("#cropWhole");
  await expect(page.locator("#thumbs .unsaved")).toHaveCount(1);
  await goShelf(page);
  const book = page.locator(".book");
  await expect(book).toHaveCount(1);
  await expect(book.locator(".unsaved")).toHaveText("Ikke gemt");
  await book.click();
  await expect(page.locator("#count")).toHaveText("1 / 1");
  await openWorkshop(page);
  await storageWorks(page);
  await page.locator("#thumbs .thumb").first().getByRole("button", { name: "Gem igen" }).click();
  await expect(page.locator("#thumbs .unsaved")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#count")).toHaveText("1 / 1");
});

test("Leaving the app asks first while a page is unsaved", async ({ page }) => {
  await fresh(page);
  await withoutRecognition(page);
  await page.reload();
  await choosePhotos(page, 1);
  await failPageWrites(page);
  await page.click("#cropWhole");
  await expect(page.locator("#thumbs .unsaved")).toHaveCount(1);
  // The browser asks before leaving when the page cancels "beforeunload".
  const asksBeforeLeaving = () => page.evaluate(() => !window.dispatchEvent(new Event("beforeunload", { cancelable: true })));
  expect(await asksBeforeLeaving()).toBe(true);
  await storageWorks(page);
  await page.locator("#thumbs .thumb").first().getByRole("button", { name: "Gem igen" }).click();
  await expect(page.locator("#thumbs .unsaved")).toHaveCount(0);
  expect(await asksBeforeLeaving()).toBe(false);
});
