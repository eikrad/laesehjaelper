import { expect, test } from "./fixtures";
import { strFromU8, unzipSync } from "fflate";
import fs from "node:fs";
import { addPhotos, expectTextInImage, fresh, waitForText } from "./helpers";

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
  await expect(page.locator("#bookTitle")).toHaveValue("Eksport");
  await expectTextInImage(page);
  expect(await page.locator("#text").inputValue()).toContain("Pindsvinet");
  await page.locator("#edit summary").click();
  await expect(page.locator("#recropBtn")).toBeVisible({ timeout: 1500 });
  await page.click("#recropBtn");
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropMsg")).not.toContainText("…");
  await page.click("#cropWhole");
  await waitForText(page);
  expect(await page.locator("#text").inputValue()).toContain("Pindsvinet");
});
