import { expect, test } from "./fixtures";
import { strFromU8, unzipSync } from "fflate";
import fs from "node:fs";
import { bookTool, fresh, openRecognisedBook, seedBooks, setUiLanguage, toggleReadingSetup } from "./helpers";

test("The reading ruler starts off and follows visual lines when enabled", async ({ page }) => {
  await fresh(page);
  await seedBooks(page, [{ id: "guide", title: "Linjer", texts: ["Solen skinner.\n\nEn lille fugl synger.\n\nVi går ud."] }]);
  await page.locator(".book").click();
  await expect(page.locator("#guideTools")).toBeHidden();
  await toggleReadingSetup(page);
  await expect(page.locator('#guideSet button[data-v="aus"]')).toHaveClass(/\bon\b/, { timeout: 1500 });
  await page.click('#guideSet button[data-v="ruler"]');
  await toggleReadingSetup(page);
  await expect(page.locator("#guideTools")).toBeVisible();
  await expect(page.locator("#guideWindow")).toBeVisible();
  await expect(page.locator("#guideCount")).toHaveText("Linje 1 af 3");
  await expect.poll(() => page.locator('#reader .w[data-word="skinner"]').evaluate(word => {
    const range = document.createRange(); range.setStart(word.nextSibling!, 0); range.setEnd(word.nextSibling!, 1);
    return range.getBoundingClientRect().right <= document.querySelector("#guideWindow")!.getBoundingClientRect().right;
  }), { timeout: 1500 }).toBe(true);
  const first = (await page.locator("#guideWindow").boundingBox())!;
  await page.click("#guideNext");
  await expect(page.locator("#guideCount")).toHaveText("Linje 2 af 3");
  expect((await page.locator("#guideWindow").boundingBox())!.y).toBeGreaterThan(first.y);
  await page.click("#guidePrev");
  await expect(page.locator("#guideCount")).toHaveText("Linje 1 af 3");
  await expect(page.locator("#guidePrev")).toBeDisabled();
});

test("The ruler follows read-aloud words even when word highlighting is off", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __utterance?: SpeechSynthesisUtterance };
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      speaking: false, getVoices: () => [], cancel: () => {}, speak: (u: SpeechSynthesisUtterance) => { w.__utterance = u; },
    } });
  });
  await fresh(page);
  await seedBooks(page, [{ id: "speech-guide", title: "Linjer", texts: ["Solen skinner.\n\nEn lille fugl synger."] }]);
  await page.locator(".book").click();
  await toggleReadingSetup(page); await page.click('#guideSet button[data-v="ruler"]'); await toggleReadingSetup(page);
  await page.click("#readBtn");
  await page.evaluate(() => {
    const u = (window as unknown as { __utterance: SpeechSynthesisUtterance }).__utterance;
    u.onboundary?.({ name: "word", charIndex: u.text.indexOf("fugl") } as SpeechSynthesisEvent);
  });
  await expect(page.locator("#guideCount")).toHaveText("Linje 2 af 2", { timeout: 1500 });
  await expect(page.locator("#reader .w.speaking")).toHaveCount(0);
});

test("One-line mode shows a large line and keeps punctuation and syllable colours", async ({ page }) => {
  await fresh(page);
  await seedBooks(page, [{ id: "one-line", title: "Én linje", texts: ["Solen skinner.\n\nEn lille fugl synger."] }]);
  await page.locator(".book").click();
  await toggleReadingSetup(page);
  await page.click('#mode button[data-v="beides"]');
  await page.click('#guideSet button[data-v="line"]');
  await toggleReadingSetup(page);
  await expect(page.locator("#guideLine")).toBeVisible({ timeout: 1500 });
  await expect(page.locator("#reader")).toBeHidden();
  await expect(page.locator("#guideLine")).toHaveText("Solen skinner.");
  expect(await page.locator("#guideLine").evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(40);
  const colour = await page.locator('#guideLine .w[data-word="Solen"] .s').first().evaluate(el => getComputedStyle(el).color);
  expect(colour).toBe("rgb(47, 63, 224)");
  await page.click("#guideNext");
  await expect(page.locator("#guideLine")).toHaveText("En lille fugl synger.");
});

test("The ruler covers syllable arcs on a photographed page and stays aligned after rotation", async ({ page }) => {
  await fresh(page);
  await openRecognisedBook(page, ["side-da.jpg"]);
  await toggleReadingSetup(page); await page.click('#mode button[data-v="beides"]');
  await page.click('#guideSet button[data-v="ruler"]'); await toggleReadingSetup(page);
  await page.evaluate(() => document.fonts.ready.then(() => {}));
  const inside = async () => page.evaluate(() => {
    const word = document.querySelector("#reader .w")!, window = document.querySelector("#guideWindow")!;
    const box = window.getBoundingClientRect(), r = word.getBoundingClientRect();
    const last = word.querySelector(".s:last-child")!.getBoundingClientRect();
    return box.top <= r.top && box.bottom >= last.bottom && box.left <= r.left && box.right >= r.right;
  });
  await expect.poll(inside).toBe(true);
  await page.setViewportSize({ width: 1180, height: 820 });
  await expect.poll(inside).toBe(true);
  await toggleReadingSetup(page); await page.click('#guideSet button[data-v="line"]'); await toggleReadingSetup(page);
  await expect(page.locator("#guideLine")).toBeVisible();
  await expect(page.locator("#reader")).toBeHidden();
});

test("Touch swipes and arrow keys change lines without turning the book page", async ({ page }) => {
  await fresh(page);
  await seedBooks(page, [{ id: "navigate-guide", title: "Linjer", texts: ["En første linje.\n\nEn anden linje.\n\nEn tredje linje.", "En anden side."] }]);
  await page.locator(".book").click();
  await toggleReadingSetup(page); await page.click('#guideSet button[data-v="ruler"]'); await toggleReadingSetup(page);
  await page.locator("#guideTools").dispatchEvent("pointerdown", { pointerId: 12, pointerType: "touch", clientX: 50, clientY: 140, isPrimary: true });
  await page.locator("#guideTools").dispatchEvent("pointerup", { pointerId: 12, pointerType: "touch", clientX: 50, clientY: 50, isPrimary: true });
  await expect(page.locator("#guideCount")).toHaveText("Linje 2 af 3", { timeout: 1500 });
  await expect(page.locator("#count")).toHaveText("1 / 2");
  await page.locator("#guideNext").focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#guideCount")).toHaveText("Linje 3 af 3");
  await page.keyboard.press("ArrowUp");
  await expect(page.locator("#guideCount")).toHaveText("Linje 2 af 3");
});

test("Line-guide choices belong to each reader and a new reader starts without the guide", async ({ page }) => {
  await fresh(page); await page.click("#demoBtn"); await toggleReadingSetup(page);
  const first = await page.locator("#profileSel").inputValue();
  await page.click('#guideSet button[data-v="ruler"]');
  await page.fill("#profileName", "Bo"); await page.click("#profileAdd");
  const second = await page.locator("#profileSel").inputValue();
  await expect(page.locator('#guideSet button[data-v="aus"]')).toHaveClass(/\bon\b/);
  await page.selectOption("#profileSel", first); await toggleReadingSetup(page);
  await expect(page.locator("#guideTools")).toBeVisible();
  await page.reload(); await expect(page.locator("#guideTools")).toBeVisible();
  await toggleReadingSetup(page); await page.selectOption("#profileSel", second); await toggleReadingSetup(page);
  await expect(page.locator("#guideTools")).toBeHidden();
});

test("One-line speech follows words and ignores a cancelled reading session", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __spoken: SpeechSynthesisUtterance[] };
    w.__spoken = [];
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      speaking: false, getVoices: () => [], cancel: () => {}, speak: (u: SpeechSynthesisUtterance) => { w.__spoken.push(u); },
    } });
  });
  await fresh(page);
  await seedBooks(page, [{ id: "speech-line", title: "Linjer", texts: ["Solen skinner.\n\nEn fugl synger."] }]);
  await page.locator(".book").click();
  await toggleReadingSetup(page); await page.click('#guideSet button[data-v="line"]');
  await page.click('#highlightSet button[data-v="an"]'); await toggleReadingSetup(page);
  await page.click("#readBtn");
  const boundary = () => page.evaluate(() => {
    const u = (window as unknown as { __spoken: SpeechSynthesisUtterance[] }).__spoken[0];
    u.onboundary?.({ name: "word", charIndex: u.text.indexOf("fugl") } as SpeechSynthesisEvent);
  });
  await boundary();
  await expect(page.locator("#guideLine")).toHaveText("En fugl synger.");
  await expect(page.locator('#guideLine .w[data-word="fugl"]')).toHaveClass(/speaking/);
  await page.click("#guidePrev");
  await boundary();
  await expect(page.locator("#guideLine")).toHaveText("Solen skinner.");
  await expect(page.locator("#guideLine .speaking")).toHaveCount(0);
  await page.locator('#guideLine .w[data-word="Solen"]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __spoken: SpeechSynthesisUtterance[] }).__spoken.at(-1)?.text)).toBe("Solen");
});

test("Line guides use the UI language and keep every line when exporting a book", async ({ page }, info) => {
  await fresh(page);
  await seedBooks(page, [{ id: "guide-export", title: "Linjer", texts: ["Solen skinner.\n\nEn fugl synger."] }]);
  await page.locator(".book").click();
  await toggleReadingSetup(page); await page.click('#guideSet button[data-v="line"]'); await toggleReadingSetup(page);
  for (const [lang, count, next] of [["da", "Linje 1 af 2", "Næste linje"], ["de", "Zeile 1 von 2", "Nächste Zeile"], ["en", "Line 1 of 2", "Next line"]]) {
    await setUiLanguage(page, lang);
    await expect(page.locator("#guideCount")).toHaveText(count);
    await expect(page.locator("#guideNext")).toHaveAccessibleName(next);
  }
  const [download] = await Promise.all([page.waitForEvent("download"), bookTool(page, "exportBtn")]);
  const file = info.outputPath("guide.epub"); await download.saveAs(file);
  const files = unzipSync(new Uint8Array(fs.readFileSync(file)));
  const text = strFromU8(files["OEBPS/page1.xhtml"]);
  expect(text).toContain('data-word="Solen"'); expect(text).toContain('data-word="synger"');
  expect(text).not.toContain("guideWindow"); expect(text).not.toContain("guideLine");
});
