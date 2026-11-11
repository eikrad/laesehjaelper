import { expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export const fixture = (name: string) => path.resolve("tests/fixtures", name);

/** Original stored text pages, without depending on OCR for shelf and navigation checks. */
export async function seedBooks(page: Page, books: { id: string; title: string; texts: string[]; lang?: string; lastPage?: number; readyPages?: number }[]) {
  await page.evaluate(async books => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("laesehjaelper", 1);
      r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
    const tx = db.transaction(["books", "pages"], "readwrite");
    for (const book of books) {
      const pageIds = book.texts.map((_, i) => `${book.id}-${i}`);
      tx.objectStore("books").put({ id: book.id, title: book.title, pageIds, lastPage: book.lastPage ?? 0, created: 1, cover: null });
      book.texts.forEach((text, i) => tx.objectStore("pages").put({ id: pageIds[i], bookId: book.id, lang: book.lang || "da", status: i < (book.readyPages ?? book.texts.length) ? "done" : "wait", text, rawText: text }));
    }
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
  }, books);
  await page.reload();
}

/**
 * A book of self-made pages recognised beforehand (tests/fixtures/make-recognised.ts), opened for
 * reading. For tests that need recognised pages but do not test recognition: much faster than
 * recognising the photos again. `names` are fixture photos, e.g. "side-da.jpg".
 */
export async function openRecognisedBook(page: Page, names: string[]) {
  const records = names.map(n => JSON.parse(fs.readFileSync(fixture(n.replace(/\.jpg$/, ".recognised.json")), "utf8")));
  await page.evaluate(async records => {
    const blob = (b64: string | null) => (b64 ? new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type: "image/jpeg" }) : null);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("laesehjaelper", 1);
      r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
    const tx = db.transaction(["books", "pages"], "readwrite");
    const ids = records.map((_, i) => `recognised-${i}`);
    tx.objectStore("books").put({ id: "recognised", title: "Prøvebog", pageIds: ids, lastPage: 0, created: 1, cover: null });
    records.forEach(({ input, photo, clean, ...r }, i) => tx.objectStore("pages").put({
      ...r, id: ids[i], bookId: "recognised", status: "done", question: "", inputBlob: blob(input), photoBlob: blob(photo), cleanBlob: blob(clean),
    }));
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
  }, records);
  await page.reload();
  await page.locator(".book").click();
  await waitForText(page);
}

/** Stored pages of a book (the first one by default) in book order, as saved on the device. */
export async function storedPages(page: Page, bookId?: string) {
  return page.evaluate(async bookId => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("laesehjaelper", 1);
      r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
    const tx = db.transaction(["books", "pages"]);
    const books = tx.objectStore("books").getAll(), pages = tx.objectStore("pages").getAll();
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
    const book = bookId ? books.result.find(b => b.id === bookId) : books.result[0];
    return ((book?.pageIds || []) as string[]).map(id => {
      const p = pages.result.find(p => p.id === id);
      return { id, text: p?.text as string, status: p?.status as string, corners: !!p?.corners, photo: !!p?.photoBlob };
    });
  }, bookId);
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

/** Complete syllable bows, including on the final line, stay inside both clipping elements. */
export async function expectSyllableBowsInsideBoxes(page: Page) {
  const syllables = page.locator("#reader.mode-boegen .tbox .w:not(.plain) .s");
  await expect(syllables.first()).toBeVisible();
  await expect.poll(() => syllables.evaluateAll(ss => ss.flatMap(s => {
    const bow = getComputedStyle(s, "::after");
    const bottom = s.getBoundingClientRect().bottom - parseFloat(bow.bottom);
    const clip = Math.min(s.closest(".tbox-text")!.getBoundingClientRect().bottom, s.closest(".tbox")!.getBoundingClientRect().bottom);
    return bottom > clip ? [{ syllable: s.textContent, clippedBy: bottom - clip, size: getComputedStyle(s).fontSize }] : [];
  }))).toEqual([]);
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
