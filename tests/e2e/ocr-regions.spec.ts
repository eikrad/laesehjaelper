import { test, expect } from "./fixtures";
import { bookTool, fixture, fresh, openRecognisedBook } from "./helpers";
import type { Page } from "@playwright/test";
import { strFromU8, unzipSync } from "fflate";
import fs from "node:fs";

async function sourceDigest(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open("laesehjaelper", 1); r.onsuccess = () => resolve(r.result); });
    const records = await new Promise<{ inputBlob: Blob }[]>(resolve => { const r = db.transaction("pages").objectStore("pages").getAll(); r.onsuccess = () => resolve(r.result); }); db.close();
    const hash = await crypto.subtle.digest("SHA-256", await records[0].inputBlob.arrayBuffer());
    return Array.from(new Uint8Array(hash)).join(",");
  });
}

test("changing the page crop clears exclusions from the previous input coordinates", async ({ page }) => {
  await fresh(page); await openRecognisedBook(page, ["side-da.jpg"]);
  await bookTool(page, "checkTextBtn"); await page.click("#ocrRegionsBtn");
  await page.click("#regionAdd"); await page.click("#regionsSave");
  await expect(page.locator("#reocrBtn")).toBeVisible({ timeout: 90000 });
  await page.click("#recropBtn");
  await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 90000 }); await page.click("#cropWhole");
  await expect(page.locator("#reocrBtn")).toBeVisible({ timeout: 90000 });
  await page.click("#ocrRegionsBtn"); await expect(page.locator("#regionList button")).toHaveCount(0);
});

test("an adult excludes a footer, keeps the photo and can restore recognition", async ({ page }, info) => {
  await fresh(page); await page.click('#langStart button[data-v="en"]');
  await page.setInputFiles("#file", fixture("side-comic.jpg"));
  await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 90000 }); await page.click("#cropWhole");
  await expect(page.locator("#reader")).toContainText("Original test footer", { timeout: 90000 });
  const original = await sourceDigest(page);
  await bookTool(page, "checkTextBtn"); await page.click("#ocrRegionsBtn");
  await page.click("#regionAdd"); await page.click("#regionsCancel");
  await page.click("#ocrRegionsBtn"); await expect(page.locator("#regionList button")).toHaveCount(0);
  await page.fill("#regionTop", "100"); await page.click("#regionAdd");
  await expect(page.locator("#regionsError")).toBeVisible();
  await expect(page.locator("#regionList button")).toHaveCount(0);
  await page.fill("#regionTop", "85"); await page.click("#regionAdd");
  await expect(page.locator("#regionList button")).toHaveCount(1);
  await page.click("#regionsSave");
  await expect(page.locator("#reader")).toContainText("Tara builds a kite.", { timeout: 90000 });
  await expect(page.locator("#reader")).not.toContainText("Original test footer");
  expect(await sourceDigest(page)).toBe(original);
  const darkPixels = await page.locator("#reader .pageview img").evaluate(async (el: HTMLImageElement) => {
    await el.decode(); const c = document.createElement("canvas"); c.width = el.naturalWidth; c.height = el.naturalHeight;
    const ctx = c.getContext("2d")!; ctx.drawImage(el, 0, 0);
    const data = ctx.getImageData(0, Math.floor(c.height * 0.88), c.width, Math.floor(c.height * 0.1)).data;
    let dark = 0; for (let i = 0; i < data.length; i += 4) if (data[i] < 100 && data[i + 1] < 100 && data[i + 2] < 100) dark++;
    return dark;
  });
  expect(darkPixels).toBeGreaterThan(100); // The original footer is still visible, not painted white.
  await page.reload();
  const [download] = await Promise.all([page.waitForEvent("download"), bookTool(page, "exportBtn")]);
  const file = info.outputPath("exclusions.epub"); await download.saveAs(file);
  const data = JSON.parse(strFromU8(unzipSync(new Uint8Array(fs.readFileSync(file)))["OEBPS/laesehjaelper/book.json"]));
  expect(data.pages[0].ocrRegions).toEqual([{ x0: 0, y0: 0.85, x1: 1, y1: 1 }]);
  await fresh(page); await page.setInputFiles("#importFile", file);
  await expect(page.locator("#reader")).toContainText("Tara builds a kite.");
  await bookTool(page, "checkTextBtn"); await page.click("#ocrRegionsBtn");
  await expect(page.locator("#regionList button")).toHaveCount(1);
  await page.click("#regionsClear"); await page.click("#regionsSave");
  await expect(page.locator("#reader")).toContainText("Original test footer", { timeout: 90000 });
});
