import { expect, test } from "./fixtures";
import { strFromU8, unzipSync } from "fflate";
import fs from "node:fs";
import { addPhotos, bookTool, fresh, openRecognisedBook, openWorkshop, seedBooks, waitForText } from "./helpers";

test("Exported page layout is independent of the screen orientation", async ({ page }, info) => {
  await fresh(page);
  await openRecognisedBook(page, ["side-da.jpg"]);
  await openWorkshop(page);   // Export is a book tool.
  await page.evaluate(() => document.fonts.ready.then(() => {}));
  const pages: string[] = [];
  for (const viewport of [{ width: 820, height: 1180 }, { width: 1180, height: 820 }]) {
    await page.setViewportSize(viewport);
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
  await expect(page.locator("#readingTitle")).toHaveText("Eksport");
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

test("An exported book keeps syllable colours only on long words when chosen", async ({ page }, info) => {
  await fresh(page);
  await seedBooks(page, [{ id: "long", title: "Lange ord", texts: ["Det lille pindsvin snuser til blomsterne."] }]);
  await page.locator(".book").click();
  await expect(page.locator("#reader")).toContainText("blomsterne");
  await page.click("#setBtn");
  await page.click('#mode button[data-v="farbe"]');
  await page.click('#sylWordsSet button[data-v="lange"]');
  await page.click("#setBtn");
  const [download] = await Promise.all([page.waitForEvent("download"), bookTool(page, "exportBtn")]);
  const file = info.outputPath("long.epub");
  await download.saveAs(file);
  const files = unzipSync(new Uint8Array(fs.readFileSync(file)));
  const xhtml = strFromU8(files["OEBPS/page1.xhtml"]);
  expect(xhtml).toMatch(/class="w plain"[^>]*data-word="pindsvin"/);   // pinds·vin
  expect(xhtml).toMatch(/class="w"[^>]*data-word="blomsterne"/);       // blom·ster·ne
  expect(strFromU8(files["OEBPS/style.css"])).toContain(".w.plain .s { color: inherit; }");
});
