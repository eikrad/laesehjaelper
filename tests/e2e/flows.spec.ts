import { expect, test } from "./fixtures";
import { addPhotos, fixture, fresh, waitForText } from "./helpers";

test.beforeEach(async ({ page }) => { await fresh(page); });

test("Foto einer Seite auf dem Tisch: Seite wird gefunden und gerade gerückt", async ({ page }) => {
  await page.setInputFiles("#file", fixture("foto-bord.jpg"));
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropMsg")).toHaveText(/Siden er fundet/, { timeout: 120_000 });
  await page.click("#cropOk");
  await waitForText(page);
  const text = await page.locator("#text").inputValue();
  expect(text).toContain("Pindsvinet");
  expect(text).toContain("bedste ven");
  // Ohne Tischkante im Text: die Seite wurde ausgeschnitten
  expect(text.split(/\n\n/).length).toBeLessThanOrEqual(3);
});

test("Seite neu zuschneiden und Text neu erkennen", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg"]);
  await waitForText(page);
  await page.locator("#edit summary").click();
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

test("Buch mit mehreren Seiten: blättern, Seite hinzufügen, verschieben, löschen", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg", "side-overskrift.jpg"]);
  await waitForText(page);
  await expect(page.locator("#count")).toHaveText("1 / 2");
  await page.click("#next");
  await expect(page.locator("#count")).toHaveText("2 / 2");
  await expect(page.locator("#next")).toBeDisabled();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#count")).toHaveText("1 / 2");
  await page.locator(".thumb > button").nth(1).click();        // Vorschaubild
  await expect(page.locator("#count")).toHaveText("2 / 2");
  // dritte Seite über das Plus bei den Vorschaubildern
  await page.setInputFiles("#thumbs .add input", fixture("side-curved.jpg"));
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
  await page.click("#cropOk");
  await expect(page.locator(".thumb")).toHaveCount(3);
  // Seiten bearbeiten: erste Seite nach rechts, dann löschen
  await page.click("#editPagesBtn");
  const first = await page.locator(".thumb img").first().getAttribute("src");
  await page.locator(".thumb").first().locator(".ctl button").last().click();
  expect(await page.locator(".thumb img").nth(1).getAttribute("src")).toBe(first);
  await page.locator(".thumb").nth(1).locator(".ctl .x").click();
  await expect(page.locator(".thumb")).toHaveCount(2);
  await page.click("#editPagesBtn");
});

test("Schrift, Silbenstriche aus dem Buch, Lesemodus", async ({ page }) => {
  await page.click("#demoBtn");
  await page.click("#setBtn");
  await page.selectOption("#font", { label: "OpenDyslexic" });
  expect(await page.locator("#reader").evaluate(el => getComputedStyle(el).fontFamily)).toContain("OpenDyslexic");
  await page.click("#setBtn");
  await page.locator("#edit summary").click();
  await page.locator("#text").fill("Vi går i sko-le.");
  await expect(page.locator('#reader .w[data-word="sko-le"]')).toHaveCount(1);
  await page.click("#setBtn");
  await page.click("#hyphSet button[data-v=bog]");
  await expect(page.locator('#reader .w[data-word="skole"] .s')).toHaveText(["sko", "le"]);
  await page.click("#setBtn");
  await page.click("#focusBtn");
  await expect(page.locator("body")).toHaveClass(/focus/);
  await expect(page.locator(".thumbs")).toBeHidden();
  await page.click("#focusBtn");
  await expect(page.locator("body")).not.toHaveClass(/focus/);
});

test("Vorlesen markiert das gerade gelesene Wort", async ({ page }) => {
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
  await page.reload();
  await page.click("#demoBtn");
  await page.click("#readBtn");
  await expect(page.locator("#reader .w.speaking")).toHaveAttribute("data-word", "lille");
  await expect(page.locator("#reader .w.speaking")).toHaveCount(1);
  await page.evaluate(() => (window as unknown as { __end: () => void }).__end());
  await expect(page.locator("#reader .speaking")).toHaveCount(0);
});

test("Zurück zur Startseite über Knopf und Logo", async ({ page }) => {
  await page.click("#demoBtn");
  await page.click("#homeBtn");
  await expect(page.locator("#start")).toBeVisible();
  await page.click("#demoBtn");
  await page.click("#home");
  await expect(page.locator("#start")).toBeVisible();
});

test("Kaputte Bilddatei gibt einen verständlichen Hinweis", async ({ page }) => {
  await page.setInputFiles("#file", { name: "side.jpg", mimeType: "image/jpeg", buffer: Buffer.from("kein Bild") });
  await expect(page.locator("#toast")).toHaveText("Billedet kunne ikke åbnes.");
});

test("Korrekturen bleiben erhalten, wenn man die Silbenstrich-Einstellung umschaltet", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg"]);
  await waitForText(page);
  await page.locator("#edit summary").click();
  const t = await page.locator("#text").inputValue();
  await page.locator("#text").fill(t.replace("Pindsvinet", "Pindsvinet Bob-by"));
  await expect(page.locator('#reader .w[data-word="Bob-by"]')).toHaveCount(1);
  await page.click("#setBtn");
  await page.click("#hyphSet button[data-v=bog]");
  await expect(page.locator('#reader .w[data-word="Bobby"] .s')).toHaveText(["Bob", "by"]);
  await page.click("#hyphSet button[data-v=normal]");
  await expect(page.locator("#text")).toHaveValue(/Pindsvinet Bob/);
});
