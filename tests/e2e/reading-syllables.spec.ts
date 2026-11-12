import { expect, test } from "./fixtures";
import { fresh, seedBooks } from "./helpers";

test("Danish word speech defaults to once and offers optional manual syllables", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __said: unknown[] };
    w.__said = [];
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      speaking: false, getVoices: () => [], cancel: () => {},
      speak: (u: SpeechSynthesisUtterance) => {
        w.__said.push({ text: u.text, lang: u.lang, rate: Number(u.rate.toFixed(3)),
          word: document.querySelector(".speaking")?.closest(".w")?.getAttribute("data-word"),
          parts: document.querySelectorAll(".s.speaking").length });
        setTimeout(() => u.onend?.(new Event("end") as SpeechSynthesisEvent), 10);
      },
    } });
  });
  await fresh(page);
  await seedBooks(page, [{ id: "syllables", title: "Stavelser", texts: ["Hunden hund·en."] }]);
  await page.locator(".book").click();
  await expect(page.locator('#reader .w[data-word="Hunden"] .s')).toHaveText(["Hun", "den"], { timeout: 1500 });
  await expect(page.locator('#reader .w[data-word="hunden"] .s')).toHaveText(["hund", "en"]);
  await page.locator('#reader .w[data-word="Hunden"]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __said: unknown[] }).__said))
    .toEqual([
      { text: "Hunden", lang: "da-DK", rate: 0.85, word: "Hunden", parts: 0 },
    ]);
  await expect(page.locator(".speaking")).toHaveCount(0);
  await page.click("#setBtn"); await page.click('#wordPlaybackSet button[data-v="syllables"]'); await page.click("#setBtn");
  await page.locator('#reader .w[data-word="hunden"]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __said: unknown[] }).__said)).toEqual([
    { text: "Hunden", lang: "da-DK", rate: 0.85, word: "Hunden", parts: 0 },
    { text: "hunden", lang: "da-DK", rate: 0.85, word: "hunden", parts: 0 },
    { text: "hund", lang: "da-DK", rate: 0.765, word: "hunden", parts: 1 },
    { text: "en", lang: "da-DK", rate: 0.765, word: "hunden", parts: 1 },
    { text: "hunden", lang: "da-DK", rate: 0.85, word: "hunden", parts: 0 },
  ]);
  await expect(page.locator(".speaking")).toHaveCount(0);
  await page.reload(); await page.click("#setBtn");
  await expect(page.locator('#wordPlaybackSet button[data-v="syllables"]')).toHaveClass(/on/);
});

for (const [language, text, words] of [
  ["de", "Oma mag Ananas und Radio.", [["Oma", ["O", "ma"]], ["Ananas", ["A", "na", "nas"]], ["Radio", ["Ra", "di", "o"]]]],
  ["en", "A little elephant eats an apple and a banana.", [["little", ["lit", "tle"]], ["elephant", ["el", "e", "phant"]], ["apple", ["ap", "ple"]], ["banana", ["ba", "na", "na"]]]],
] as const) {
  test(`Common ${language} reading words keep their syllables after reopening the book`, async ({ page }) => {
    await fresh(page);
    await seedBooks(page, [{ id: "reading-words", title: "Reading words", texts: [text], lang: language }]);
    await page.locator(".book").click();
    await page.click("#setBtn");
    await page.click(`#langSet button[data-v="${language}"]`);
    await page.click('#mode button[data-v="beides"]');
    await page.click("#setBtn");
    for (const [word, syllables] of words) await expect(page.locator(`#reader .w[data-word="${word}"] .s`)).toHaveText([...syllables]);
    await page.reload();
    for (const [word, syllables] of words) await expect(page.locator(`#reader .w[data-word="${word}"] .s`)).toHaveText([...syllables]);
  });
}
