import { expect, test } from "./fixtures";
import { fresh, openBookOptions, readBook, seedBooks, setUiLanguage } from "./helpers";

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
    await openBookOptions(page); await page.click(`#langSet button[data-v="${language}"]`); await readBook(page);
    await expect(page.locator(`#reader .w[data-word="${word}"] .s`)).toHaveText([...syllables]);

    await page.reload();
    await expect(page.locator(`#reader .w[data-word="${word}"] .s`)).toHaveText([...syllables], { timeout: 1500 });
    await expect(page.locator("#reader")).toHaveText(text);
    await openBookOptions(page);
    await expect(page.locator(`#langSet button[data-v="${language}"]`)).toHaveClass(/\bon\b/, { timeout: 1500 });
    await readBook(page); await page.click("#readBtn");
    await expect.poll(() => page.evaluate(() => (window as unknown as { __speechLanguage?: string }).__speechLanguage), { timeout: 1500 }).toBe(speechLanguage);
  });
}

// The app language and the language of new books are separate (#212). On a first start both come
// from the device; after that each is picked by hand and saved, and changing one never changes the
// other. Other tests run as a Danish device (playwright.config.ts).
test.describe("On a German device", () => {
  test.use({ locale: "de-DE" });
  const on = /\bon\b/;

  test("the first start is in German, with German books and a German sample page", async ({ page }) => {
    await fresh(page);
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await expect(page.locator('#uiLang button[data-v="de"]')).toHaveClass(on);
    await expect(page.locator('#langStart button[data-v="de"]')).toHaveClass(on);
    await page.click("#demoBtn");
    await expect(page.locator("#reader")).toContainText("Der kleine Igel");
  });

  test("an app language picked by hand stays after reloading", async ({ page }) => {
    await fresh(page);
    await page.click('#uiLang button[data-v="en"]');
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('#uiLang button[data-v="en"]')).toHaveClass(on);
  });

  test("app language and book language are separate: changing one never changes the other", async ({ page }) => {
    await fresh(page);
    await page.click('#uiLang button[data-v="en"]');
    await expect(page.locator('#langStart button[data-v="de"]')).toHaveClass(on);   // Books stay German.
    await page.click('#langStart button[data-v="da"]');
    await expect(page.locator("html")).toHaveAttribute("lang", "en");               // The app stays English.
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('#langStart button[data-v="da"]')).toHaveClass(on);
    await page.click("#demoBtn");
    await expect(page.locator("#reader")).toContainText("Det lille pindsvin");
  });

  test("the open sample page keeps the book language when the app language changes", async ({ page }) => {
    await fresh(page);
    await page.click("#demoBtn");
    await expect(page.locator("#reader")).toContainText("Der kleine Igel");
    await setUiLanguage(page, "en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("#reader")).toContainText("Der kleine Igel");
  });

  test("settings saved by an earlier version keep their languages", async ({ page }) => {
    await fresh(page);
    await page.evaluate(() => localStorage.setItem("lesehelfer", JSON.stringify({ ui: "da", lang: "da", size: 32 })));
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "da");
    await expect(page.locator('#langStart button[data-v="da"]')).toHaveClass(on);
    await page.click('#uiLang button[data-v="de"]');
    await expect(page.locator('#langStart button[data-v="da"]')).toHaveClass(on);
  });
});
