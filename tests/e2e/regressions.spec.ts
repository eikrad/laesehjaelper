import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";
import { fresh } from "./helpers";

test.use({ serviceWorkers: "block" });

interface StoredPage { text: string; rawText?: string }

/** Kleine eigene Texte im normalen Bücherregal, ohne von OCR-Genauigkeit abhängig zu sein. */
async function openStoredBook(page: Page, items: StoredPage[]) {
  await page.evaluate(async items => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("laesehjaelper", 1);
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    const tx = db.transaction(["books", "pages"], "readwrite");
    const ids = items.map((_, i) => `regression-${i}`);
    tx.objectStore("books").put({ id: "regression", title: "Testbog", pageIds: ids, lastPage: 0, created: 1, cover: null });
    items.forEach((item, i) => tx.objectStore("pages").put({ ...item, rawText: item.rawText ?? item.text, id: ids[i], bookId: "regression", lang: "da", status: "done" }));
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
  }, items);
  await page.reload(); await page.locator(".book").click();
  await expect(page.locator("#text")).toHaveValue(items[0].text);
  await page.locator("#edit summary").click();
}

test.beforeEach(async ({ page }) => { await fresh(page); });

test("Korrektur bleibt beim sofortigen Weiterblättern erhalten", async ({ page }) => {
  await openStoredBook(page, [{ text: "Første side" }, { text: "Anden side" }]);
  await page.locator("#text").evaluate((el: HTMLTextAreaElement) => {
    el.value = "Rettet første side"; el.dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("next")!.click();
  });
  await page.waitForTimeout(300);
  await page.click("#prev");
  await expect(page.locator("#text")).toHaveValue("Rettet første side", { timeout: 1500 });
  await page.reload(); await page.locator(".book").click();
  await expect(page.locator("#text")).toHaveValue("Rettet første side");
});
