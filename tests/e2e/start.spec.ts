import { expect, test } from "./fixtures";
import { bookTool, fresh, openBookOptions, openRecognisedBook, seedBooks, setUiLanguage, toggleReadingSetup } from "./helpers";

test.beforeEach(async ({ page }) => { await fresh(page); });

test("Books show where reading stopped and reopen on that page", async ({ page }) => {
  await seedBooks(page, [{ id: "continue", title: "Min læsebog", texts: ["Historiens begyndelse.", "Her fortsætter historien.", "Historiens slutning."], lastPage: 1 }]);
  for (const [lang, action, progress] of [
    ["da", "Ny bog", "Fortsæt på side 2 af 3"],
    ["de", "Neues Buch", "Auf Seite 2 von 3 weiterlesen"],
    ["en", "New book", "Continue on page 2 of 3"],
  ]) {
    await setUiLanguage(page, lang);
    await expect(page.locator("#drop")).toContainText(action);
    await expect(page.locator(".book")).toContainText(progress);
  }
  await page.locator(".book").click();
  await expect(page.locator("#count")).toHaveText("2 / 3");
  await expect(page.locator("#reader")).toContainText("Her fortsætter historien.");
});

test.describe("Books with recognition in progress", () => {
  test.use({ serviceWorkers: "block" });
  test("A ready first page can be read while later pages are still being recognised", async ({ page }) => {
    await page.route("**/tesseract.min.js", route => route.fulfill({ contentType: "text/javascript", body:
      "window.Tesseract = { createWorker: async () => { window.ocrWaiting = true; return new Promise(() => {}); } };",
    }));
    await seedBooks(page, [{ id: "pending", title: "En bog undervejs", texts: ["Den første side er klar.", ""], readyPages: 1 }]);
    await page.locator(".book").click();
    await page.waitForFunction(() => "ocrWaiting" in window);
    await expect(page.locator("#reader")).toContainText("Den første side er klar.");
    await page.click("#next");
    await expect(page.locator("#reader .bar")).toBeVisible();
    await page.click("#prev");
    await expect(page.locator("#reader")).toContainText("Den første side er klar.");
  });
});

test("The start page supports all three languages", async ({ page }) => {
  await expect(page.locator(".cta strong")).toHaveText("Tag et billede af en side");
  await setUiLanguage(page, "de");
  await expect(page.locator(".cta strong")).toHaveText("Eine Seite fotografieren");
  await setUiLanguage(page, "en");
  await expect(page.locator(".cta strong")).toHaveText("Take a photo of a page");
  await page.reload();
  await expect(page.locator(".cta strong")).toHaveText("Take a photo of a page"); // The setting persists.
});

test("The sample page shows syllables and Back returns to the start page", async ({ page }) => {
  await page.click("#demoBtn");
  await expect(page.locator("#app")).toBeVisible();
  const word = page.locator('.w[data-word="pindsvin"]');
  await expect(word.locator(".s")).toHaveCount(2);
  await expect(word.locator(".s0")).toHaveText("pinds");
  await expect(page.locator("#compareBtn")).toBeHidden();  // No photo is available for comparison.
  await page.goBack();
  await expect(page.locator("#start")).toBeVisible();
});

test("Settings: syllable arcs and a custom color", async ({ page }) => {
  await page.click("#demoBtn");
  await toggleReadingSetup(page);
  await page.click("#mode button[data-v=boegen]");
  await expect(page.locator("#reader")).toHaveClass(/mode-boegen/);
  await expect(page.locator("#reader")).not.toHaveClass(/mode-farbe/);
  await page.locator("#c1").evaluate((el: HTMLInputElement) => { el.value = "#16a34a"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  const c1 = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--s1").trim());
  expect(c1).toBe("#16a34a");
});

test("Settings close with the close button, Escape or a tap outside", async ({ page }) => {
  await page.click("#demoBtn");
  const settings = page.locator("#settings");
  await toggleReadingSetup(page);
  await expect(settings).toHaveClass(/open/);
  await page.click("#setClose");
  await expect(settings).not.toHaveClass(/open/);
  await expect(page.locator("#setBtn")).not.toHaveClass(/on/);
  await toggleReadingSetup(page);
  await page.keyboard.press("Escape");
  await expect(settings).not.toHaveClass(/open/);
  // The first tap outside only closes the panel: the logo does not lead home.
  await toggleReadingSetup(page);
  await page.click("#homeBtn");
  await expect(settings).not.toHaveClass(/open/);
  await expect(page.locator("#app")).toBeVisible();
  // The toolbar stays usable while the panel is open.
  await toggleReadingSetup(page);
  await page.click("#focusBtn");
  await expect(page.locator("body")).toHaveClass(/focus/);
});

test("Each hint in the settings sits under its own choice", async ({ page }) => {
  await page.click("#demoBtn");
  await expect(page.locator("#linesSet + .fhint")).toHaveAttribute("data-t", "linesHint");
  await expect(page.locator("#togetherSet + .fhint")).toHaveAttribute("data-t", "togetherHint");
});

test("Escape closes settings while the text editor has focus", async ({ page }) => {
  await page.click("#demoBtn");
  await bookTool(page, "checkTextBtn");
  await toggleReadingSetup(page);
  await page.locator("#text").focus();
  await page.keyboard.press("Escape");
  await expect(page.locator("#settings")).not.toHaveClass(/open/);
});

test("Dismissing settings does not drag a text box underneath", async ({ page }) => {
  await openRecognisedBook(page, ["side-da.jpg"]);
  await bookTool(page, "checkTextBtn");
  await page.click("#moveBtn");
  const box = page.locator("#reader .tbox").first();
  await box.scrollIntoViewIfNeeded();
  const before = await box.evaluate((el: HTMLElement) => [el.style.left, el.style.top, el.style.width, el.style.height]);
  await toggleReadingSetup(page);
  const bounds = (await box.boundingBox())!;
  await page.mouse.move(bounds.x + 10, bounds.y + 10);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 50, bounds.y + 30, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator("#settings")).not.toHaveClass(/open/);
  expect(await box.evaluate((el: HTMLElement) => [el.style.left, el.style.top, el.style.width, el.style.height])).toEqual(before);
});

test("German book language splits German sample words", async ({ page }) => {
  await page.click("#langStart button[data-v=de]");
  await page.click("#demoBtn");
  await expect(page.locator('.w[data-word="Apfelbaum"] .s')).not.toHaveCount(1);
});

test("Increasing letter spacing also increases word spacing", async ({ page }) => {
  await page.click("#demoBtn");
  const ws = () => page.locator("#reader").evaluate(el => parseFloat(getComputedStyle(el).wordSpacing));
  const before = await ws();
  await toggleReadingSetup(page);
  await page.locator("#ls").evaluate((el: HTMLInputElement) => { el.value = "0.2"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  expect(await ws()).toBeGreaterThan(before);
});

test("Settings explain the research evidence accurately", async ({ page }) => {
  await page.click("#demoBtn");
  await toggleReadingSetup(page);
  const box = page.locator("#evidence");
  await box.locator("summary").click();
  await expect(box).toContainText("OpenDyslexic");
  await expect(box.locator("a[href*='README.da.md#']")).toHaveCount(1);
});

test("Listen, then read: show a prompt after reading aloud and allow speed selection", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __rates: number[] };
    w.__rates = [];
    const fake = {
      speaking: false,
      getVoices: () => [],
      cancel: () => {},
      speak: (u: SpeechSynthesisUtterance) => { w.__rates.push(u.rate); setTimeout(() => u.onend?.(new Event("end") as SpeechSynthesisEvent), 50); },
    };
    Object.defineProperty(window, "speechSynthesis", { value: fake, configurable: true });
  });
  await page.reload();
  await page.click("#demoBtn");
  await page.click("#readBtn");
  await expect(page.locator("#yourTurn")).toBeVisible();
  await toggleReadingSetup(page);
  await page.click("#rateSet button[data-v=langsom]");
  await toggleReadingSetup(page);
  await page.click("#yourTurn button");
  const rates = await page.evaluate(() => (window as unknown as { __rates: number[] }).__rates);
  expect(rates.length).toBe(2);
  expect(rates[1]).toBeLessThan(rates[0]);
  await toggleReadingSetup(page);
  await page.click("#turnSet button[data-v=aus]");
  await toggleReadingSetup(page);
  await page.click("#readBtn");
  await page.waitForTimeout(200);
  await expect(page.locator("#yourTurn")).toBeHidden();
});

for (const [language, word, expected, markedParts] of [
  ["de", "Igel", ["Igel", "I", "gel", "Igel"], ["I", "gel"]],
  ["en", "little", ["little", "lit", "tle", "little"], ["lit", "tle"]],
] as const) test(`Tapping a ${language} word keeps whole–syllables–whole playback`, async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __said: string[]; __marked: string[] };
    w.__said = []; w.__marked = [];
    const fake = {
      speaking: false, getVoices: () => [], cancel: () => {},
      speak: (u: SpeechSynthesisUtterance) => {
        w.__said.push(u.text);
        const m = document.querySelector(".s.speaking"); if (m) w.__marked.push(m.textContent || "");
        setTimeout(() => u.onend?.(new Event("end") as SpeechSynthesisEvent), 30);
      },
    };
    Object.defineProperty(window, "speechSynthesis", { value: fake, configurable: true });
  });
  await page.reload();
  await page.click(`#langStart button[data-v="${language}"]`);
  await page.click("#demoBtn");
  await toggleReadingSetup(page); await page.click('#wordPlaybackSet button[data-v="syllables"]'); await toggleReadingSetup(page);
  await page.click(`.w[data-word="${word}"]`);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __said: string[] }).__said.length)).toBe(4);
  const { said, marked } = await page.evaluate(() => { const w = window as unknown as { __said: string[]; __marked: string[] }; return { said: w.__said, marked: w.__marked }; });
  expect(said).toEqual([...expected]);
  expect(marked).toEqual([...markedParts]);
  await expect(page.locator(".speaking")).toHaveCount(0);
});

test("Short lines: at most three words per line, with an option to disable", async ({ page }) => {
  await page.click("#demoBtn");
  const words = await page.locator("#reader .w").count();
  await toggleReadingSetup(page);
  await page.click("#linesSet button[data-v=kort]");
  await expect(page.locator("#reader br")).not.toHaveCount(0);
  expect(await page.locator("#reader .w").count()).toBe(words);
  const most = await page.locator("#reader p").evaluateAll(ps => Math.max(...ps.flatMap(p =>
    p.innerHTML.split(/<br>/).map(chunk => (chunk.match(/class="w"/g) || []).length))));
  expect(most).toBeLessThanOrEqual(3);
  await page.click("#linesSet button[data-v=normal]");
  await expect(page.locator("#reader br")).toHaveCount(0);
});

test("Reader settings: create, switch and retain profiles", async ({ page }) => {
  await page.click("#demoBtn");
  await toggleReadingSetup(page);
  const size = (v: string) => page.locator("#size").evaluate((el: HTMLInputElement, v) => { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); }, v);
  await expect(page.locator("#profileSel option")).toHaveCount(1);
  await expect(page.locator("#profileDel")).toBeHidden();
  await size("26");
  await page.click("#mode button[data-v=farbe]");   // Syllable colours start off; reader 1 turns them on.
  await page.click('#wordPlaybackSet button[data-v="syllables"]');
  await page.fill("#profileName", "Bo");
  await page.click("#profileAdd");
  await expect(page.locator("#profileSel option")).toHaveCount(2);
  await expect(page.locator('#wordPlaybackSet button[data-v="word"]')).toHaveClass(/on/);
  await size("50");
  await page.click("#mode button[data-v=aus]");
  await page.selectOption("#profileSel", { index: 0 });
  await expect(page.locator("#size")).toHaveValue("26");
  await expect(page.locator("#reader")).toHaveClass(/mode-farbe/);
  await expect(page.locator('#wordPlaybackSet button[data-v="syllables"]')).toHaveClass(/on/);
  await page.selectOption("#profileSel", { label: "Bo" });
  await expect(page.locator("#size")).toHaveValue("50");
  await expect(page.locator('#wordPlaybackSet button[data-v="word"]')).toHaveClass(/on/);
  await expect(page.locator("#reader")).not.toHaveClass(/mode-farbe/);
  await page.reload();
  await expect(page.locator("#profileSel option:checked")).toHaveText("Bo");
  await expect(page.locator("#size")).toHaveValue("50");
  await toggleReadingSetup(page);
  await page.click("#profileDel");
  await page.click("#profileDel");
  await expect(page.locator("#profileSel option")).toHaveCount(1);
  await expect(page.locator("#size")).toHaveValue("26");
});

test("Reading together: two open questions and a custom question per page", async ({ page }) => {
  await page.click("#demoBtn");
  await expect(page.locator("#together")).toBeHidden();
  await toggleReadingSetup(page);
  await page.click("#togetherSet button[data-v=an]");
  await toggleReadingSetup(page);
  await expect(page.locator("#together")).toBeVisible();
  await expect(page.locator("#togetherQs li")).toHaveCount(2);
  await expect(page.locator("#togetherQs li").first()).toHaveText(/\?$/);
  await page.click("#ownQBtn");
  await page.fill("#ownQ", "Hvorfor sover pindsvinet?");
  await page.press("#ownQ", "Enter");
  await expect(page.locator("#togetherQs li").first()).toHaveText("Hvorfor sover pindsvinet?");
  await expect(page.locator("#togetherQs li")).toHaveCount(2);
});

test("Text marked with *word* appears bold without asterisks", async ({ page }) => {
  await page.click("#demoBtn");
  await bookTool(page, "checkTextBtn");
  const t = await page.locator("#text").inputValue();
  await page.fill("#text", t.replace("pindsvin", "*pindsvin*"));
  await expect(page.locator('#reader .w.b[data-word="pindsvin"]')).toHaveCount(1);
  await expect(page.locator("#reader")).not.toContainText("*");
});

test("Danish word parts: compounds and suffixes", async ({ page }) => {
  await page.click("#demoBtn");
  await toggleReadingSetup(page);
  await page.click("#mode button[data-v=morf]");
  const w = page.locator('#reader .w[data-word="pindsvin"]');
  await expect(w.locator(".s")).toHaveCount(2, { timeout: 30_000 });
  await expect(w.locator(".s").first()).toHaveText("pind");
  await expect(page.locator('#reader .w[data-word="æbletræ"] .s')).toHaveText(["æble", "træ"]);
  await expect(page.locator('#reader .w[data-word="Pindsvinet"] .s.suf')).toHaveText("et");
  // Other book languages: show a notice and keep words intact.
  await page.locator("#setClose").click();
  await openBookOptions(page);
  await page.click("#langSet button[data-v=de]");
  await expect(page.locator("#toast")).toContainText(/dansk|Dänisch|Danish/i);
});
