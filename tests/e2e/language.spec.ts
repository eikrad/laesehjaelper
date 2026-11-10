import { expect, test } from "./fixtures";
import { fresh, seedBooks } from "./helpers";

for (const [language, original, text, word, syllables, speechLanguage] of [
  ["da", "en", "Hunden sover.", "Hunden", ["Hun", "den"], "da-DK"],
  ["de", "da", "Oma mag Ananas.", "Oma", ["O", "ma"], "de-DE"],
  ["en", "da", "A little elephant.", "little", ["lit", "tle"], "en-GB"],
] as const) {
  test(`A changed ${language} language on a text-only page survives reopening`, async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __speechLanguage?: string };
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
        speaking: false, getVoices: () => [], cancel: () => {},
        speak: (u: SpeechSynthesisUtterance) => { w.__speechLanguage = u.lang; },
      } });
    });
    await fresh(page);
    await seedBooks(page, [{ id: "language", title: "Languages", texts: [text], lang: original }]);
    await page.locator(".book").click();
    await page.click("#setBtn"); await page.click(`#langSet button[data-v="${language}"]`); await page.click("#setBtn");
    await expect(page.locator(`#reader .w[data-word="${word}"] .s`)).toHaveText([...syllables]);

    await page.reload();
    await expect(page.locator(`#reader .w[data-word="${word}"] .s`)).toHaveText([...syllables], { timeout: 1500 });
    await expect(page.locator("#reader")).toHaveText(text);
    await page.click("#setBtn");
    await expect(page.locator(`#langSet button[data-v="${language}"]`)).toHaveClass(/\bon\b/, { timeout: 1500 });
    await page.click("#setBtn"); await page.click("#readBtn");
    await expect.poll(() => page.evaluate(() => (window as unknown as { __speechLanguage?: string }).__speechLanguage), { timeout: 1500 }).toBe(speechLanguage);
  });
}
