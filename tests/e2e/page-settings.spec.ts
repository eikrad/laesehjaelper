import type { Page } from "@playwright/test";
import type { Para } from "../../src/types";
import { expect, test } from "./fixtures";
import { fresh } from "./helpers";

// Text size and spacing settings in the book-page view (text set on the photo).

const W = 1000, H = 1400;
const box = (x0: number, y0: number, x1: number, y1: number) => ({ x0, y0, x1, y1 });
const para = (text: string, b: ReturnType<typeof box>, lh: number): Para => ({ raw: text, text, bbox: b, lines: [b], words: [b], lh });

/** Open a self-made recognised page (white picture, a heading and two paragraphs) in the book-page view. */
async function openBookPage(page: Page, paras: Para[]) {
  await page.evaluate(async ({ paras, W, H }) => {
    const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#fbf6ec"; ctx.fillRect(0, 0, W, H);
    const image = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg"));
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("laesehjaelper", 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
    const tx = db.transaction(["books", "pages"], "readwrite");
    tx.objectStore("books").put({ id: "page", title: "Bogside", pageIds: ["page-0"], lastPage: 0, created: 1, cover: null });
    const text = paras.map(p => p.text).join("\n\n");
    tx.objectStore("pages").put({ id: "page-0", bookId: "page", lang: "da", status: "done", text, rawText: text, paras, workW: W, workH: H, inputBlob: image, cleanBlob: image });
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
  }, { paras, W, H });
  await page.reload();
  await page.locator(".book").click();
  await expect(page.locator("#reader .pageview .tbox")).toHaveCount(paras.length);
}

const roomy = [
  para("Bamse", box(80, 60, 500, 150), 70),
  para("Der var engang en lille bjørn, som hed Bamse.", box(80, 220, 920, 700), 40),
  para("Bjørnefar var en stor, stor bjørn, og han var meget stærk.", box(80, 800, 920, 1250), 40),
];

/** Computed style of a text box, in px. */
const style = (page: Page, i: number) => page.locator("#reader .tbox").nth(i).evaluate(el => {
  const s = getComputedStyle(el);
  return { size: parseFloat(s.fontSize), letters: parseFloat(s.letterSpacing) || 0, line: parseFloat(s.lineHeight) };
});
const slide = (page: Page, id: string, value: number) =>
  page.locator(`#${id}`).evaluate((el: HTMLInputElement, v) => { el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true })); }, value);

test.beforeEach(async ({ page }) => { await fresh(page); });

test("The text size setting sets the size of the text on the book page, and headings stay larger", async ({ page }) => {
  await openBookPage(page, roomy);
  await expect.poll(async () => Math.round((await style(page, 1)).size)).toBe(32);   // the default size
  const ratio = (await style(page, 0)).size / (await style(page, 1)).size;
  expect(ratio).toBeGreaterThan(1.2);
  await page.click("#setBtn");
  for (const size of [20, 44]) {
    await slide(page, "size", size);
    await expect.poll(async () => Math.round((await style(page, 1)).size)).toBe(size);
    expect(Math.round((await style(page, 2)).size)).toBe(size);
    expect((await style(page, 0)).size / (await style(page, 1)).size).toBeCloseTo(ratio, 1);
  }
});

test("Letter spacing on the book page adds space and keeps the size while the text fits", async ({ page }) => {
  await openBookPage(page, roomy);
  await expect.poll(async () => Math.round((await style(page, 1)).size)).toBe(32);
  const before = await style(page, 1);
  await page.click("#setBtn");
  await slide(page, "ls", 0.2);
  await expect.poll(async () => (await style(page, 1)).letters).toBeGreaterThan(before.letters + 4);
  expect(Math.round((await style(page, 1)).size)).toBe(32);
});

test("Line spacing above 1.6 works on the book page", async ({ page }) => {
  await openBookPage(page, roomy);
  await page.click("#setBtn");
  await slide(page, "lh", 2.8);
  await expect.poll(async () => { const s = await style(page, 1); return s.line / s.size; }).toBeGreaterThan(2.2);
});

test("When the book page has no room for the wished size, the settings point to the text view", async ({ page }) => {
  await openBookPage(page, [para("Der var engang en lille bjørn.", box(80, 200, 920, 330), 40)]);
  await page.click("#setBtn");
  const hint = page.locator("#sizeHint");
  await expect(hint).toBeHidden();
  await slide(page, "size", 64);
  await expect(hint).toBeVisible();
  await expect(hint).toContainText("Kun teksten");
  await slide(page, "size", 20);
  await expect(hint).toBeHidden();
  // The text view has room for every size.
  await slide(page, "size", 64);
  await page.click("#viewSet button[data-v=tekst]");
  await expect(hint).toBeHidden();
});

test("On a book page with little room, larger spacing keeps the text size and adds as much space as fits", async ({ page }) => {
  await openBookPage(page, [para("Der var engang en lille bjørn, som hed Bamse.", box(80, 200, 920, 400), 40)]);
  await expect.poll(async () => Math.round((await style(page, 0)).size)).toBe(32);
  const before = await style(page, 0);
  await page.click("#setBtn");
  await slide(page, "ls", 0.25);
  await slide(page, "lh", 3);
  await expect.poll(async () => (await style(page, 0)).letters).toBeGreaterThan(before.letters);
  expect(Math.round((await style(page, 0)).size)).toBe(32);
  await expect(page.locator("#sizeHint")).toBeVisible();
});
