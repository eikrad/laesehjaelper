import { test, expect } from "./fixtures";
import { fresh, seedBooks } from "./helpers";
import { bookTool, openWorkshop } from "./helpers";
import { unzipSync, strFromU8 } from "fflate";
import fs from "node:fs";

test.beforeEach(async ({ page }) => {
  await fresh(page);
  await page.addInitScript(() => {
    const w = window as unknown as { said: { text: string; lang: string }[] };
    w.said = [];
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      getVoices: () => [], cancel: () => {}, speak: (u: SpeechSynthesisUtterance) => {
        w.said.push({ text: u.text, lang: u.lang });
        setTimeout(() => u.onend?.(new Event("end") as SpeechSynthesisEvent), 10);
      },
    } });
  });
  await seedBooks(page, [{ id: "practice", title: "Prøvebog", texts: ["En lille mus bor her. Solen skinner.", "En fugl synger."] }]);
  await page.locator(".book").click();
});

async function saveMouse(page: import("@playwright/test").Page) {
  await page.click("#setBtn"); await page.click('#practiceSet button[data-v="an"]'); await page.click("#setBtn");
  await page.click('#reader .w[data-word="mus"]'); await page.click("#savePracticeWord");
}

test("word practice works from the one-line guide with a keyboard", async ({ page }) => {
  await saveMouse(page);
  await page.click("#setBtn"); await page.click('#guideSet button[data-v="line"]'); await page.click("#setBtn");
  await page.locator('#guideLine .w[data-word="mus"]').focus(); await page.keyboard.press("Enter");
  await expect(page.locator("#wordHelp")).toBeVisible({ timeout: 3000 });
  await expect(page.locator("#chosenWord")).toHaveText("mus");
});

test("practice stays with its book and reader, is excluded from exports, and is removed with its book", async ({ page }, info) => {
  await saveMouse(page);
  await openWorkshop(page);
  const [download] = await Promise.all([page.waitForEvent("download"), bookTool(page, "exportBtn")]);
  const path = info.outputPath("private-practice.epub"); await download.saveAs(path);
  const archive = unzipSync(new Uint8Array(fs.readFileSync(path)));
  for (const [name, bytes] of Object.entries(archive)) if (/\.(json|xhtml|css)$/.test(name)) {
    expect(strFromU8(bytes)).not.toMatch(/readerId|familiar|practiceReview|tabindex|role="button"/);
  }
  await page.click("#delBookBtn"); await page.click("#delBookBtn");
  await expect(page.locator("#start")).toBeVisible();
  await seedBooks(page, [{ id: "other", title: "Anden bog", lang: "de", texts: ["Eine Maus schläft."] }]);
  await page.locator(".book").click();
  await page.click("#practiceOpen"); await expect(page.locator("#practiceEmpty")).toBeVisible(); await page.click("#practiceClose");
  await page.click('#reader .w[data-word="Maus"]'); await page.click("#savePracticeWord");
  await page.click("#practiceOpen"); await page.click("#practiceHear");
  await expect.poll(() => page.evaluate(() => (window as unknown as { said: { text: string; lang: string }[] }).said.at(-1))).toEqual({ text: "Maus", lang: "de-DE" });
});

test("adult choices persist, text edits invalidate context, and retiring a word is explicit", async ({ page }) => {
  await saveMouse(page);
  await page.click("#practiceOpen");
  await page.locator("#practiceReview summary").click();
  await page.check("#practiceFamiliar");
  await page.click("#practiceClose");
  await page.reload(); await page.click("#practiceOpen");
  await page.locator("#practiceReview summary").click();
  await expect(page.locator("#practiceFamiliar")).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#count")).toHaveText("1 / 2");
  await page.keyboard.press("Escape");
  await page.click("#editBookBtn"); await page.click("#correctPageBtn");
  await page.fill("#text", "En lille mus sover her.");
  await page.waitForTimeout(300);
  await page.click("#readBookBtn");
  await page.click("#practiceOpen");
  await expect(page.locator("#practiceUnavailable")).toBeVisible();
  await expect(page.locator("#practicePage")).toBeDisabled();
  await page.locator("#practiceReview summary").click();
  await page.click("#practiceRemove");
  await expect(page.locator("#practiceEmpty")).toBeVisible();
});

test("new readers start without practice and never see another reader's saved words", async ({ page }) => {
  await saveMouse(page);
  await page.click("#setBtn");
  const first = await page.locator("#profileSel").inputValue();
  await page.fill("#profileName", "Bo"); await page.click("#profileAdd");
  await expect(page.locator('#practiceSet button[data-v="aus"]')).toHaveClass(/on/);
  await page.click('#practiceSet button[data-v="an"]'); await page.click("#setBtn");
  await page.click("#practiceOpen"); await expect(page.locator("#practiceEmpty")).toBeVisible(); await page.click("#practiceClose");
  await page.click("#setBtn"); await page.selectOption("#profileSel", first); await page.click("#setBtn");
  await page.click("#practiceOpen"); await expect(page.locator("#practiceWord")).toHaveText("mus");
});

test("a child explicitly saves a book word, tries it again and returns to its sentence", async ({ page }) => {
  await expect(page.locator("#practiceOpen")).toBeHidden();
  await page.click('#reader .w[data-word="mus"]');
  await expect(page.locator("#wordHelp")).toBeHidden();
  await page.click("#setBtn");
  await page.click('#practiceSet button[data-v="an"]');
  await page.click("#setBtn");
  await page.click("#practiceOpen");
  await expect(page.locator("#practiceEmpty")).toBeVisible();
  await page.click("#practiceClose");
  await page.click('#reader .w[data-word="mus"]');
  await page.click("#savePracticeWord");
  await page.click("#next");
  await page.click("#practiceOpen");
  await expect(page.locator("#practiceWord")).toHaveText("mus");
  await expect(page.locator("#practiceSentence")).toBeHidden();
  await page.click("#practiceHear");
  await expect.poll(() => page.evaluate(() => (window as unknown as { said: { text: string; lang: string }[] }).said.at(-1))).toEqual({ text: "mus", lang: "da-DK" });
  await page.click("#practiceContext");
  await expect(page.locator("#practiceSentence")).toHaveText("En lille mus bor her.");
  await page.click("#practicePage");
  await expect(page.locator("#count")).toHaveText("1 / 2");
  await expect(page.locator("#reader")).toContainText("En lille mus bor her.");
  await page.reload();
  await page.click("#practiceOpen");
  await expect(page.locator("#practiceWord")).toHaveText("mus");
});
