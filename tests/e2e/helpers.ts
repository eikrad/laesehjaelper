import { expect, type Page } from "@playwright/test";
import path from "node:path";

export const fixture = (name: string) => path.resolve("tests/fixtures", name);

/** Original stored text pages, without depending on OCR for shelf and navigation checks. */
export async function seedBooks(page: Page, books: { id: string; title: string; texts: string[]; lastPage?: number; readyPages?: number }[]) {
  await page.evaluate(async books => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("laesehjaelper", 1);
      r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
    const tx = db.transaction(["books", "pages"], "readwrite");
    for (const book of books) {
      const pageIds = book.texts.map((_, i) => `${book.id}-${i}`);
      tx.objectStore("books").put({ id: book.id, title: book.title, pageIds, lastPage: book.lastPage ?? 0, created: 1, cover: null });
      book.texts.forEach((text, i) => tx.objectStore("pages").put({ id: pageIds[i], bookId: book.id, lang: "da", status: i < (book.readyPages ?? book.texts.length) ? "done" : "wait", text, rawText: text }));
    }
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
  }, books);
  await page.reload();
}

/** Fresh state: no settings or books. */
export async function fresh(page: Page) {
  await page.goto("/");
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise<void>((r) => { const q = indexedDB.deleteDatabase("laesehjaelper"); q.onsuccess = q.onerror = q.onblocked = () => r(); });
  });
  await page.reload();
}

/** Load photos through the main button and confirm each one in the crop dialog. */
export async function addPhotos(page: Page, files: string[], input = "#file") {
  await page.setInputFiles(input, files.map(fixture));
  for (let i = 0; i < files.length; i++) {
    await expect(page.locator("#crop")).toBeVisible();
    await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
    await page.click("#cropOk");
  }
}

/** Wait until the current page has been recognized and displayed. */
export async function waitForText(page: Page) {
  await expect(page.locator("#reader .w").first()).toBeVisible({ timeout: 200_000 });
}

/** Enter the current book's workshop if it is being read. */
export async function openWorkshop(page: Page) {
  await bookOpen(page);
  if (await page.locator("#editBookBtn").isVisible()) {
    await page.click("#editBookBtn");
    await page.click("#openWorkshopBtn");
  }
}

/** Return from preparing the selected page to reading it. */
export async function readBook(page: Page) {
  await bookOpen(page);
  if (await page.locator("#readBookBtn").isVisible()) await page.click("#readBookBtn");
}

/** Wait until a book is shown: opening one first reads its pages from storage, and isVisible() does not wait. */
async function bookOpen(page: Page) {
  await expect(page.locator("#app")).toBeVisible();
}

/** Choose a page or book tool in the workshop. */
export async function bookTool(page: Page, id: "checkTextBtn" | "exportBtn") {
  await openWorkshop(page);
  await page.click(`#${id}`);
}
