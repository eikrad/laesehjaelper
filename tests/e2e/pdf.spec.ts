import { expect, test } from "./fixtures";
import { fresh, openRecognisedBook, openWorkshop, seedBooks, toggleReadingSetup } from "./helpers";
import { decodePDFRawStream, PDFArray, PDFDocument, PDFRawStream } from "pdf-lib";
import fs from "node:fs";

function content(pdf: PDFDocument): string {
  return pdf.getPages().flatMap(page => {
    const streams = page.node.Contents();
    if (!(streams instanceof PDFArray)) return [];
    return Array.from({ length: streams.size() }, (_, i) =>
      new TextDecoder().decode(decodePDFRawStream(streams.lookup(i, PDFRawStream)).decode()));
  }).join("\n");
}

test("A book downloads as a printable PDF with embedded fonts and one page per book page", async ({ page }, info) => {
  await fresh(page);
  await openRecognisedBook(page, ["side-da.jpg", "side-overskrift.jpg"]);
  await toggleReadingSetup(page);
  await page.selectOption("#font", '"OpenDyslexic", sans-serif');
  await page.click('#mode button[data-v="beides"]');
  await toggleReadingSetup(page);
  await openWorkshop(page);
  await expect(page.locator("#pdfBtn")).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), page.click("#pdfBtn")]);
  expect(download.suggestedFilename()).toBe("Prøvebog.pdf");
  const path = info.outputPath("book.pdf"); await download.saveAs(path);
  const pdf = await PDFDocument.load(fs.readFileSync(path));
  expect(pdf.getTitle()).toBe("Prøvebog");
  expect(pdf.getPageCount()).toBe(2);
  expect(pdf.getPages()[0].getHeight()).toBeGreaterThan(pdf.getPages()[0].getWidth());
  const embedded = pdf.context.enumerateIndirectObjects().filter(([, object]) => object.toString().includes("/ToUnicode"));
  expect(embedded.length).toBeGreaterThan(0);
  const drawing = content(pdf);
  expect(drawing).toMatch(/0\.1843\d* 0\.2470\d* 0\.8784\d* rg/); // blue syllables
  expect(drawing).toMatch(/0\.8980\d* 0\.2549\d* 0\.1764\d* rg/); // red syllables
  expect(drawing).toMatch(/0\.1843\d* 0\.2470\d* 0\.8784\d* RG/); // syllable arcs
});

test("Text-only books export offline with an embedded fallback font", async ({ page, context }, info) => {
  await fresh(page);
  await seedBooks(page, [{ id: "offline-pdf", title: "Søren / æbler", texts: ["*Søren* går ud. Élise ser æbler."] }]);
  await page.locator(".book").click();
  await openWorkshop(page);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => {}));
  await context.setOffline(true);
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), page.click("#pdfBtn")]);
  expect(download.suggestedFilename()).toBe("Søren  æbler.pdf");
  const path = info.outputPath("offline.pdf"); await download.saveAs(path);
  const pdf = await PDFDocument.load(fs.readFileSync(path));
  expect(pdf.getPageCount()).toBe(1);
  expect(pdf.getTitle()).toBe("Søren / æbler");
  const positions = [...content(pdf).matchAll(/1 0 0 1 ([-\d.]+) ([-\d.]+) Tm/g)].map(m => Number(m[1]));
  expect(positions.length).toBeGreaterThan(0);
  expect(Math.min(...positions), "text stays inside the print margin").toBeGreaterThanOrEqual(40);
  await expect(page.locator("#toast")).toContainText("OpenDyslexic");
  await expect(page.locator("#pdfBtn")).toBeEnabled();
});

test("PDF export waits for every page to be recognised", async ({ page }) => {
  await fresh(page);
  await seedBooks(page, [{ id: "waiting-pdf", title: "Venter", texts: ["Færdig side.", "Ikke færdig endnu."], readyPages: 1 }]);
  await page.locator(".book").click();
  await openWorkshop(page);
  await page.click("#pdfBtn");
  await expect(page.locator("#toast")).toContainText("Vent, til alle sider er genkendt.");
  await expect(page.locator("#pdfBtn")).toBeEnabled();
});

test.describe("Available reading fonts", () => {
  test.use({ serviceWorkers: "block" });
  test("PDF export embeds the selected font when its font files are available", async ({ page }, info) => {
    await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body:
      [400, 700].map(weight => `@font-face { font-family: 'Andika'; font-weight: ${weight}; src: url(https://fonts.gstatic.com/test-font-${weight}.woff2); unicode-range: U+0000-00FF; }`).join("\n") }));
    await page.route("https://fonts.gstatic.com/test-font-*.woff2", route => {
      const weight = route.request().url().includes("700") ? 700 : 400;
      return route.fulfill({ contentType: "font/woff2", headers: { "Access-Control-Allow-Origin": "*" }, body: fs.readFileSync(`tests/fixtures/fonts/andika-${weight}.woff2`) });
    });
    await fresh(page);
    await seedBooks(page, [{ id: "font-pdf", title: "Læs med", texts: ["Søren går ud i haven."] }]);
    await page.locator(".book").click(); await openWorkshop(page);
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), page.click("#pdfBtn")]);
    const path = info.outputPath("selected-font.pdf"); await download.saveAs(path);
    expect((await PDFDocument.load(fs.readFileSync(path))).getPageCount()).toBe(1);
    await expect(page.locator("#toast")).toHaveText("PDF-filen er gemt: Læs med.pdf");
  });
});
