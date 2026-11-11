import { test, expect } from "./fixtures";
import { bookTool, fresh, openWorkshop, seedBooks } from "./helpers";

test("an adult marks phrases and the child shows or hides them without changing the words", async ({ page }) => {
  await fresh(page);
  await seedBooks(page, [{ id: "phrases", title: "Prøvebog", texts: ["En lille mus bor her. Solen skinner."] }]);
  await page.locator(".book").click();
  await expect(page.locator("#reader .phrase-cue")).toHaveCount(0);
  await openWorkshop(page);
  await page.click("#phraseEdit");
  await page.locator('#phraseChoices button[data-after="2"]').click();
  await expect(page.locator("#phrasePreview .phrase-cue")).toHaveCount(1);
  await page.click("#phraseSave");
  await page.click("#readBookBtn");
  await expect(page.locator("#reader .phrase-cue")).toHaveCount(0);
  await page.click("#phraseToggle");
  await expect(page.locator("#reader .phrase-cue")).toHaveCount(1);
  await expect(page.locator("#reader")).toHaveText("En lille mus bor her. Solen skinner.");
  await expect(page.locator("#reader .w")).toHaveCount(7);
  await expect(page.locator("#reader .phrase-cue")).toHaveAttribute("aria-hidden", "true");
  await page.reload();
  await expect(page.locator("#reader .phrase-cue")).toHaveCount(1);
  await page.click("#phraseToggle"); await expect(page.locator("#reader .phrase-cue")).toHaveCount(0);
});

test("phrase annotations survive an app EPUB round trip while remaining off for a new reader", async ({ page }, info) => {
  await fresh(page); await seedBooks(page, [{ id: "roundtrip", title: "Læsegrupper", texts: ["En lille mus bor her."] }]);
  await page.locator(".book").click(); await openWorkshop(page); await page.click("#phraseEdit");
  await page.locator('#phraseChoices button[data-after="2"]').click(); await page.click("#phraseSave");
  const [download] = await Promise.all([page.waitForEvent("download"), bookTool(page, "exportBtn")]);
  const file = info.outputPath("phrases.epub"); await download.saveAs(file);
  await fresh(page); await page.setInputFiles("#importFile", file);
  await expect(page.locator("#readingTitle")).toHaveText("Læsegrupper");
  await expect(page.locator("#reader .phrase-cue")).toHaveCount(0);
  await page.click("#phraseToggle");
  await expect(page.locator("#reader .phrase-cue")).toHaveCount(1);
  await expect(page.locator("#reader")).toHaveText("En lille mus bor her.");
});

test("phrase cues yield to short lines, retain word help, and become unavailable after corrections", async ({ page }) => {
  await fresh(page);
  await page.addInitScript(() => {
    const w = window as unknown as { said: string[] }; w.said = [];
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { getVoices: () => [], cancel: () => {}, speak: (u: SpeechSynthesisUtterance) => { w.said.push(u.text); } } });
  });
  await seedBooks(page, [{ id: "phrases", title: "Prøvebog", texts: ["En lille mus bor her."] }]);
  await page.locator(".book").click(); await openWorkshop(page); await page.click("#phraseEdit");
  await page.locator('#phraseChoices button[data-after="2"]').focus(); await page.keyboard.press("Space");
  await page.click("#phraseSave"); await page.click("#readBookBtn"); await page.click("#phraseToggle");
  await page.click("#readBtn");
  await expect.poll(() => page.evaluate(() => (window as unknown as { said: string[] }).said.at(-1))).toBe("En lille mus bor her.");
  await page.click("#setBtn"); await page.click('#linesSet button[data-v="kort"]');
  await page.click('#practiceSet button[data-v="an"]'); await page.click("#setBtn");
  await expect(page.locator("#reader .phrase-cue")).toHaveCount(0);
  await expect(page.locator("#phraseToggle")).toHaveAttribute("aria-pressed", "false");
  await page.click("#phraseToggle");
  await expect(page.locator("#reader .phrase-cue")).toHaveCount(1);
  await page.click('#reader .w[data-word="mus"]'); await expect(page.locator("#chosenWord")).toHaveText("mus"); await page.click("#wordHelpClose");
  await page.click("#editBookBtn"); await page.click("#correctPageBtn");
  await page.fill("#text", "En lille kat bor her."); await page.click("#readBookBtn");
  await expect(page.locator("#reader .phrase-cue")).toHaveCount(0);
  await expect(page.locator("#phraseToggle")).toBeHidden();
});
