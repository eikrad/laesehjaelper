import { expect, test } from "@playwright/test";
import { fresh } from "./helpers";

test.beforeEach(async ({ page }) => { await fresh(page); });

test("Startseite in allen drei Sprachen", async ({ page }) => {
  await expect(page.locator(".cta strong")).toHaveText("Tag et billede af en side");
  await page.click("#uiLang button[data-v=de]");
  await expect(page.locator(".cta strong")).toHaveText("Eine Seite fotografieren");
  await page.click("#uiLang button[data-v=en]");
  await expect(page.locator(".cta strong")).toHaveText("Take a photo of a page");
  await page.reload();
  await expect(page.locator(".cta strong")).toHaveText("Take a photo of a page"); // Einstellung bleibt
});

test("Beispielseite zeigt Silben, Zurück führt zur Startseite", async ({ page }) => {
  await page.click("#demoBtn");
  await expect(page.locator("#app")).toBeVisible();
  const word = page.locator('.w[data-word="pindsvin"]');
  await expect(word.locator(".s")).toHaveCount(2);
  await expect(word.locator(".s0")).toHaveText("pinds");
  await expect(page.locator("#compareBtn")).toBeHidden();  // kein Foto, nichts zu vergleichen
  await page.goBack();
  await expect(page.locator("#start")).toBeVisible();
});

test("Einstellungen: Silben als Bögen, eigene Farbe", async ({ page }) => {
  await page.click("#demoBtn");
  await page.click("#setBtn");
  await page.click("#mode button[data-v=boegen]");
  await expect(page.locator("#reader")).toHaveClass(/mode-boegen/);
  await expect(page.locator("#reader")).not.toHaveClass(/mode-farbe/);
  await page.locator("#c1").evaluate((el: HTMLInputElement) => { el.value = "#16a34a"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  const c1 = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--s1").trim());
  expect(c1).toBe("#16a34a");
});

test("Buchsprache Deutsch trennt deutsche Beispielwörter", async ({ page }) => {
  await page.click("#langStart button[data-v=de]");
  await page.click("#demoBtn");
  await expect(page.locator('.w[data-word="Apfelbaum"] .s')).not.toHaveCount(1);
});

test("Mehr Buchstabenabstand vergrößert auch den Wortabstand", async ({ page }) => {
  await page.click("#demoBtn");
  const ws = () => page.locator("#reader").evaluate(el => parseFloat(getComputedStyle(el).wordSpacing));
  const before = await ws();
  await page.click("#setBtn");
  await page.locator("#ls").evaluate((el: HTMLInputElement) => { el.value = "0.2"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  expect(await ws()).toBeGreaterThan(before);
});

test("Einstellungen erklären ehrlich, was belegt hilft", async ({ page }) => {
  await page.click("#demoBtn");
  await page.click("#setBtn");
  const box = page.locator("#evidence");
  await box.locator("summary").click();
  await expect(box).toContainText("OpenDyslexic");
  await expect(box.locator("a[href*='README.md#']")).toHaveCount(1);
});

test("Erst hören, dann selbst lesen: Hinweis nach dem Vorlesen, Tempo wählbar", async ({ page }) => {
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
  await page.click("#setBtn");
  await page.click("#rateSet button[data-v=langsom]");
  await page.click("#setBtn");
  await page.click("#yourTurn button");
  const rates = await page.evaluate(() => (window as unknown as { __rates: number[] }).__rates);
  expect(rates.length).toBe(2);
  expect(rates[1]).toBeLessThan(rates[0]);
  await page.click("#setBtn");
  await page.click("#turnSet button[data-v=aus]");
  await page.click("#setBtn");
  await page.click("#readBtn");
  await page.waitForTimeout(200);
  await expect(page.locator("#yourTurn")).toBeHidden();
});

test("Wort antippen: erst ganz, dann in Silben, Silbe wird markiert", async ({ page }) => {
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
  await page.click("#demoBtn");
  await page.click('.w[data-word="pindsvin"]');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __said: string[] }).__said.length)).toBe(4);
  const { said, marked } = await page.evaluate(() => { const w = window as unknown as { __said: string[]; __marked: string[] }; return { said: w.__said, marked: w.__marked }; });
  expect(said).toEqual(["pindsvin", "pinds", "vin", "pindsvin"]);
  expect(marked).toEqual(["pinds", "vin"]);
  await expect(page.locator(".speaking")).toHaveCount(0);
});

test("Kurze Zeilen: höchstens drei Wörter pro Zeile, abschaltbar", async ({ page }) => {
  await page.click("#demoBtn");
  const words = await page.locator("#reader .w").count();
  await page.click("#setBtn");
  await page.click("#linesSet button[data-v=kort]");
  await expect(page.locator("#reader br")).not.toHaveCount(0);
  expect(await page.locator("#reader .w").count()).toBe(words);
  const most = await page.locator("#reader p").evaluateAll(ps => Math.max(...ps.flatMap(p =>
    p.innerHTML.split(/<br>/).map(chunk => (chunk.match(/class="w"/g) || []).length))));
  expect(most).toBeLessThanOrEqual(3);
  await page.click("#linesSet button[data-v=normal]");
  await expect(page.locator("#reader br")).toHaveCount(0);
});

test("Einstellungen pro Kind: Profile anlegen, wechseln, behalten", async ({ page }) => {
  await page.click("#demoBtn");
  await page.click("#setBtn");
  const size = (v: string) => page.locator("#size").evaluate((el: HTMLInputElement, v) => { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); }, v);
  await expect(page.locator("#profileSel option")).toHaveCount(1);
  await expect(page.locator("#profileDel")).toBeHidden();
  await size("26");
  await page.fill("#profileName", "Bo");
  await page.click("#profileAdd");
  await expect(page.locator("#profileSel option")).toHaveCount(2);
  await size("50");
  await page.click("#mode button[data-v=aus]");
  await page.selectOption("#profileSel", { index: 0 });
  await expect(page.locator("#size")).toHaveValue("26");
  await expect(page.locator("#reader")).toHaveClass(/mode-farbe/);
  await page.selectOption("#profileSel", { label: "Bo" });
  await expect(page.locator("#size")).toHaveValue("50");
  await expect(page.locator("#reader")).not.toHaveClass(/mode-farbe/);
  await page.reload();
  await page.click("#demoBtn");
  await expect(page.locator("#profileSel option:checked")).toHaveText("Bo");
  await expect(page.locator("#size")).toHaveValue("50");
  await page.click("#setBtn");
  await page.click("#profileDel");
  await page.click("#profileDel");
  await expect(page.locator("#profileSel option")).toHaveCount(1);
  await expect(page.locator("#size")).toHaveValue("26");
});

test("Gemeinsam lesen: zwei offene Fragen, eigene Frage pro Seite", async ({ page }) => {
  await page.click("#demoBtn");
  await expect(page.locator("#together")).toBeHidden();
  await page.click("#setBtn");
  await page.click("#togetherSet button[data-v=an]");
  await page.click("#setBtn");
  await expect(page.locator("#together")).toBeVisible();
  await expect(page.locator("#togetherQs li")).toHaveCount(2);
  await expect(page.locator("#togetherQs li").first()).toHaveText(/\?$/);
  await page.click("#ownQBtn");
  await page.fill("#ownQ", "Hvorfor sover pindsvinet?");
  await page.press("#ownQ", "Enter");
  await expect(page.locator("#togetherQs li").first()).toHaveText("Hvorfor sover pindsvinet?");
  await expect(page.locator("#togetherQs li")).toHaveCount(2);
});

test("Fett im Text: *Wort* wird fett gesetzt, ohne Sternchen", async ({ page }) => {
  await page.click("#demoBtn");
  await page.locator("#edit summary").click();
  const t = await page.locator("#text").inputValue();
  await page.fill("#text", t.replace("pindsvin", "*pindsvin*"));
  await expect(page.locator('#reader .w.b[data-word="pindsvin"]')).toHaveCount(1);
  await expect(page.locator("#reader")).not.toContainText("*");
});
