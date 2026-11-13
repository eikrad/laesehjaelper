import { expect, test } from "./fixtures";
import { addPhotos, bookTool, fixture, fresh, goShelf, openBookOptions, openRecognisedBook, openWorkshop, toggleReadingSetup, waitForText } from "./helpers";

test.beforeEach(async ({ page }) => { await fresh(page); });

test("Photo of a page on a table: detect and straighten the page", async ({ page }) => {
  await page.setInputFiles("#file", fixture("foto-bord.jpg"));
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropMsg")).toHaveText(/Siden er fundet/, { timeout: 120_000 });
  await page.click("#cropOk");
  await waitForText(page);
  const text = await page.locator("#text").inputValue();
  expect(text).toContain("Pindsvinet");
  expect(text).toContain("bedste ven");
  // No table-edge noise in the text: the page was cropped.
  expect(text.split(/\n\n/).length).toBeLessThanOrEqual(3);
});

test("Crops the page again and reruns text recognition", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg"]);
  await waitForText(page);
  await bookTool(page, "checkTextBtn");
  await page.click("#recropBtn");
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
  await page.click("#cropWhole");
  await waitForText(page);
  expect(await page.locator("#text").inputValue()).toContain("Pindsvinet");
  await page.locator("#text").fill("Falsk tekst");
  await page.click("#reocrBtn");
  await expect.poll(() => page.locator("#text").inputValue(), { timeout: 200_000 }).toContain("Pindsvinet");
});

test("Book with multiple pages: navigate, add, reorder and delete pages", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg", "side-overskrift.jpg"]);
  await waitForText(page);
  await expect(page.locator("#count")).toHaveText("1 / 2");
  await page.click("#next");
  await expect(page.locator("#count")).toHaveText("2 / 2");
  await expect(page.locator("#next")).toBeDisabled();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#count")).toHaveText("1 / 2");
  await page.locator(".thumb > button").nth(1).click();        // Thumbnail
  await expect(page.locator("#count")).toHaveText("2 / 2");
  // Add a third page using the plus button next to the thumbnails.
  await page.setInputFiles("#thumbs .add input", fixture("side-curved.jpg"));
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
  await page.click("#cropOk");
  await expect(page.locator(".thumb")).toHaveCount(3);
  // Edit pages: move the first page to the right, then delete it.
  await openWorkshop(page);
  const first = await page.locator(".thumb img").first().getAttribute("src");
  await page.locator(".thumb").first().locator(".ctl button").last().click();
  expect(await page.locator(".thumb img").nth(1).getAttribute("src")).toBe(first);
  await page.locator(".thumb").nth(1).locator(".ctl .x").click();
  await expect(page.locator(".thumb")).toHaveCount(2);
  await page.click("#readBookBtn");
});

test("Font, syllable hyphens in the book and reading mode", async ({ page }) => {
  await page.click("#demoBtn");
  await toggleReadingSetup(page);
  await page.selectOption("#font", { label: "OpenDyslexic" });
  expect(await page.locator("#reader").evaluate(el => getComputedStyle(el).fontFamily)).toContain("OpenDyslexic");
  await toggleReadingSetup(page);
  await bookTool(page, "checkTextBtn");
  await page.locator("#text").fill("Vi går i sko-le.");
  await expect(page.locator('#reader .w[data-word="sko-le"]')).toHaveCount(1);
  await openBookOptions(page);
  await page.click("#hyphSet button[data-v=bog]");
  await expect(page.locator('#reader .w[data-word="skole"] .s')).toHaveText(["sko", "le"]);
  await page.locator("#bookOptions > summary").click();
  await page.click("#focusBtn");
  await expect(page.locator("body")).toHaveClass(/focus/);
  await expect(page.locator(".thumbs")).toBeHidden();
  await page.click("#focusBtn");
  await expect(page.locator("body")).not.toHaveClass(/focus/);
});

test("Workshop tools remain available behind the quiet reading entry", async ({ page }) => {
  await openRecognisedBook(page, ["side-da.jpg"]);
  await expect(page.locator("#bookMenuBtn")).toBeHidden();
  await expect(page.locator("#thumbs")).toBeHidden();
  await openWorkshop(page);
  for (const id of ["#reader", "#dock", "#thumbs", "#checkTextBtn", "#exportBtn", "#delBookBtn", "#text"]) await expect(page.locator(id), id).toBeVisible();
  await page.click("#readBookBtn");
  for (const id of ["#bookTitle", "#thumbs", "#checkTextBtn", "#exportBtn", "#delBookBtn", "#edit"]) await expect(page.locator(id), id).toBeHidden();
});

test("Opening another book resets its editing tools", async ({ page }) => {
  await page.click("#demoBtn");
  await bookTool(page, "checkTextBtn");
  await expect(page.locator("#edit")).toBeVisible();
  await goShelf(page);
  await expect(page.locator("#start")).toBeVisible();
  // Keyboard activation also starts a calm book, without relying on an outside pointer tap.
  await page.locator("#demoBtn").press("Enter");
  await expect(page.locator("#bookMenu")).toBeHidden();
  await expect(page.locator("#edit")).toBeHidden();
});

test("Closing the text editor also ends moving text boxes", async ({ page }) => {
  await openRecognisedBook(page, ["side-da.jpg"]);
  await bookTool(page, "checkTextBtn");
  await page.click("#moveBtn");
  await expect(page.locator("#reader .grip").first()).toBeVisible();
  await page.locator("#edit summary").click();
  await expect(page.locator("#edit")).toBeHidden();
  await expect(page.locator("#reader .grip")).toHaveCount(0);
  await expect(page.locator("#reader")).not.toHaveClass(/moving/);
});

test("Reading mode keeps page navigation and hides book preparation", async ({ page }) => {
  await openRecognisedBook(page, ["side-da.jpg"]);
  await openWorkshop(page);
  await page.click("#focusBtn");
  await expect(page.locator("#reader")).toBeVisible();
  await expect(page.locator("#readBtn")).toBeVisible();
  await expect(page.locator("#focusBtn")).toBeVisible();
  for (const id of ["#bookTitle", "#exportBtn", "#editPagesBtn", "#home", "#edit", "#thumbs", "#setBtn"])
    await expect(page.locator(id), id).toBeHidden();
  for (const id of ["#prev", "#next"]) await expect(page.locator(id)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#bookTitle")).toBeVisible();
  // Page-management controls must also disappear if editing was already active.
  await openWorkshop(page);
  await expect(page.locator("#delBookBtn")).toBeVisible();
  await page.click("#focusBtn");
  await expect(page.locator("#delBookBtn")).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(page.locator("#delBookBtn")).toBeVisible();
});

test("Reading aloud highlights the current word", async ({ page }) => {
  await page.addInitScript(() => {
    const fake = {
      speaking: false, getVoices: () => [], cancel: () => {},
      speak: (u: SpeechSynthesisUtterance) => {
        const ev = (charIndex: number) => Object.assign(new Event("boundary"), { name: "word", charIndex }) as SpeechSynthesisEvent;
        setTimeout(() => u.onboundary?.(ev(0)), 20);
        setTimeout(() => u.onboundary?.(ev(4)), 60);
        (window as unknown as { __end: () => void }).__end = () => u.onend?.(new Event("end") as SpeechSynthesisEvent);
      },
    };
    Object.defineProperty(window, "speechSynthesis", { value: fake, configurable: true });
  });
  // Word highlighting is a setting per reader, off for new readers.
  await page.evaluate(() => localStorage.setItem("lesehelfer", JSON.stringify({ highlight: "an" })));
  await page.reload();
  await page.click("#demoBtn");
  await page.click("#readBtn");
  await expect(page.locator("#reader .w.speaking")).toHaveAttribute("data-word", "lille");
  await expect(page.locator("#reader .w.speaking")).toHaveCount(1);
  await page.evaluate(() => (window as unknown as { __end: () => void }).__end());
  await expect(page.locator("#reader .speaking")).toHaveCount(0);
});

test("Returns to the start page using the button and logo", async ({ page }) => {
  await page.click("#demoBtn");
  await page.click("#homeBtn");
  await expect(page.locator("#start")).toBeVisible();
  await page.click("#demoBtn");
  await goShelf(page);
  await expect(page.locator("#start")).toBeVisible();
});

test("A broken image file displays a clear message", async ({ page }) => {
  await page.setInputFiles("#file", { name: "side.jpg", mimeType: "image/jpeg", buffer: Buffer.from("kein Bild") });
  await expect(page.locator("#toast")).toHaveText("Billedet kunne ikke åbnes.");
});

test("Preserves corrections when switching the syllable-hyphen setting", async ({ page }) => {
  await openRecognisedBook(page, ["side-da.jpg"]);
  await bookTool(page, "checkTextBtn");
  const t = await page.locator("#text").inputValue();
  await page.locator("#text").fill(t.replace("Pindsvinet", "Pindsvinet Bob-by"));
  await expect(page.locator('#reader .w[data-word="Bob-by"]')).toHaveCount(1);
  await openBookOptions(page);
  await page.click("#hyphSet button[data-v=bog]");
  await expect(page.locator('#reader .w[data-word="Bobby"] .s')).toHaveText(["Bob", "by"]);
  await page.click("#hyphSet button[data-v=normal]");
  await expect(page.locator("#text")).toHaveValue(/Pindsvinet Bob/);
});
