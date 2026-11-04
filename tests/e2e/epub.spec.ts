import { expect, test } from "./fixtures";
import { strFromU8, unzipSync } from "fflate";
import fs from "node:fs";
import { addPhotos, bookTool, fresh, waitForText } from "./helpers";

test("Exported page layout is independent of the screen orientation", async ({ page }, info) => {
  await fresh(page);
  await addPhotos(page, ["side-da.jpg"]);
  await waitForText(page);
  await page.evaluate(() => document.fonts.ready.then(() => {}));
  const pages: string[] = [];
  for (const viewport of [{ width: 820, height: 1180 }, { width: 1180, height: 820 }]) {
    await page.setViewportSize(viewport);
    await page.click("#bookMenuBtn");
    const [download] = await Promise.all([page.waitForEvent("download"), page.click("#exportBtn")]);
    const file = info.outputPath(`export-${viewport.width}.epub`);
    await download.saveAs(file);
    const files = unzipSync(new Uint8Array(fs.readFileSync(file)));
    pages.push(strFromU8(files["OEBPS/page1.xhtml"]));
  }
  expect(pages[0]).toContain("font-size:");
  expect(pages[1]).toBe(pages[0]);
});

test("Exports and reimports an e-book", async ({ page }, info) => {
  await fresh(page);
  await addPhotos(page, ["side-da.jpg"]);
  await page.fill("#bookTitle", "Eksport");
  await waitForText(page);
  await page.click("#bookMenuBtn");
  const [download] = await Promise.all([page.waitForEvent("download"), page.click("#exportBtn")]);
  expect(download.suggestedFilename()).toBe("Eksport.epub");
  const file = info.outputPath("Eksport.epub");
  await download.saveAs(file);

  const files = unzipSync(new Uint8Array(fs.readFileSync(file)));
  expect(strFromU8(files["mimetype"])).toBe("application/epub+zip");
  expect(strFromU8(files["OEBPS/content.opf"])).toContain("<dc:title>Eksport</dc:title>");
  expect(strFromU8(files["OEBPS/page1.xhtml"])).toContain("Pindsvinet".slice(0, 5));
  expect(files["OEBPS/laesehjaelper/book.json"]).toBeDefined();

  // Reimport into empty storage.
  await fresh(page);
  await page.setInputFiles("#importFile", file);
  await waitForText(page);
  await expect(page.locator("#bookTitle")).toHaveValue("Eksport");
  await expect(page.locator("#reader")).toHaveClass(/pagemode/);
  expect(await page.locator("#text").inputValue()).toContain("Pindsvinet");
  await bookTool(page, "checkTextBtn");
  await expect(page.locator("#recropBtn")).toBeVisible({ timeout: 1500 });
  await page.click("#recropBtn");
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropMsg")).not.toContainText("…");
  await page.click("#cropWhole");
  await waitForText(page);
  expect(await page.locator("#text").inputValue()).toContain("Pindsvinet");
});
