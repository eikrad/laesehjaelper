import { expect, test } from "./fixtures";
import { fresh, openReadingSetup, seedBooks } from "./helpers";

test("A child can switch line help directly without losing the current line", async ({ page }) => {
  await fresh(page);
  await seedBooks(page, [{ id: "reader-controls", title: "En prøvebog", texts: ["Den lille mus.\n\nSolen skinner.\n\nVi går ud.", "En ny side."] }]);
  await page.locator(".book").click();
  const help = page.getByRole("button", { name: "Følg en linje", exact: true });
  await expect(help).toHaveAttribute("aria-pressed", "false");
  await help.click();
  await expect(page.locator("#settings")).not.toHaveClass(/open/);
  await expect(page.locator("#guideWindow")).toBeVisible();
  await page.getByRole("button", { name: "Næste linje", exact: true }).click();
  await expect(page.locator("#guideCount")).toHaveText("Linje 2 af 3");
  await page.getByRole("button", { name: "Hele siden", exact: true }).click();
  await expect(page.locator("#guideTools")).toBeHidden();
  await expect(page.locator("#guideWindow")).toHaveCount(0);
  await help.click();
  await expect(page.locator("#guideCount")).toHaveText("Linje 2 af 3");
  await page.locator("#next").click();
  await expect(page.locator("#count")).toHaveText("2 / 2");
  await expect(page.locator("#guideCount")).toHaveText("Linje 1 af 1");
});

test("The quick switch restores the reader's chosen one-line help after reloading", async ({ page }) => {
  await fresh(page);
  await seedBooks(page, [{ id: "saved-help", title: "En prøvebog", texts: ["Den lille mus.\n\nSolen skinner."] }]);
  await page.locator(".book").click();
  await openReadingSetup(page);
  await page.locator('#guideSet button[data-v="line"]').click();
  await page.locator("#setClose").click();
  await page.getByRole("button", { name: "Hele siden", exact: true }).click();
  await page.reload();
  await expect(page.locator("#guideLine")).toBeHidden();
  await page.getByRole("button", { name: "Følg en linje", exact: true }).click();
  await expect(page.locator("#guideLine")).toBeVisible();
  await expect(page.locator("#guideLine")).toHaveText("Den lille mus.");
  await openReadingSetup(page);
  const firstReader = await page.locator("#profileSel").inputValue();
  await page.locator("#profileName").fill("Bo"); await page.locator("#profileAdd").click();
  await page.locator("#setClose").click();
  await expect(page.locator("#guideTools")).toBeHidden();
  await page.getByRole("button", { name: "Følg en linje", exact: true }).click();
  await expect(page.locator("#guideWindow")).toBeVisible();
  await openReadingSetup(page); await page.locator("#profileSel").selectOption(firstReader); await page.locator("#setClose").click();
  await expect(page.locator("#guideLine")).toBeVisible();
});

test("The Aa shortcut respects the adult gate and returns to the same page", async ({ page }) => {
  await fresh(page);
  await seedBooks(page, [{ id: "gated-setup", title: "En prøvebog", texts: ["Den første side.", "Den anden side."] }]);
  await page.locator(".book").click(); await page.locator("#next").click();
  await openReadingSetup(page); await page.locator('#gateSet button[data-v="an"]').click(); await page.locator("#setClose").click();
  await page.locator("#setBtn").click(); await page.locator("#readingSetupLink").click();
  await expect(page.locator("#settings")).not.toHaveClass(/open/);
  await expect(page.locator("#editEntry")).toBeHidden();
  await expect(page.locator("#editBookBtn")).toBeFocused();
  await expect(page.locator("#toast")).toContainText("Hold");
  await page.keyboard.down("Enter"); await expect(page.locator("#editEntry")).toBeVisible(); await page.keyboard.up("Enter");
  await page.locator("#readingSetupBtn").click();
  await expect(page.locator("#adultSettings")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#count")).toHaveText("2 / 2");
  await expect(page.locator("#reader")).toHaveText("Den anden side.");
});

test("The picture helpers keep Stop available and word taps still read words", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __said: string[] };
    w.__said = [];
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      speaking: false, getVoices: () => [], cancel: () => {},
      speak: (utterance: SpeechSynthesisUtterance) => { w.__said.push(utterance.text); },
    } });
  });
  await fresh(page);
  await seedBooks(page, [{ id: "spoken-helpers", title: "En prøvebog", texts: ["Solen skinner.", "Vi går ud."] }]);
  await page.locator(".book").click();
  await page.locator("#readBtn").click();
  await expect(page.locator("#readBtn")).toHaveAccessibleName("Stop");
  await page.locator("#guideBtn").click(); await page.locator("#guideBtn").click();
  await expect(page.locator("#readBtn")).toHaveAccessibleName("Stop");
  await page.locator('#reader .w[data-word="Solen"]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __said: string[] }).__said.at(-1))).toBe("Solen");
  await page.locator("#readBtn").click(); await page.locator("#next").click();
  await expect(page.locator("#readBtn")).toHaveAccessibleName("Læs op");
});

test("\"Your turn\" goes away when the child taps a word or turns the page", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      speaking: false, getVoices: () => [], cancel: () => {},
      speak: (utterance: SpeechSynthesisUtterance) => { setTimeout(() => utterance.onend?.(new Event("end") as SpeechSynthesisEvent), 30); },
    } });
  });
  await fresh(page);
  await seedBooks(page, [{ id: "your-turn", title: "En prøvebog", texts: ["Solen skinner.", "Vi går ud."] }]);
  await page.locator(".book").click();
  const prompt = page.locator("#yourTurn");
  await page.locator("#readBtn").click();
  await expect(prompt).toBeVisible();
  await expect(prompt).toContainText("Nu er det din tur");
  await page.locator('#reader .w[data-word="Solen"]').click();
  await expect(prompt).toBeHidden();
  await page.locator("#readBtn").click();
  await expect(prompt).toBeVisible();
  await page.locator("#next").click();
  await expect(prompt).toBeHidden();
});

test("Aa stays compact and detailed reading setup belongs to the adult entry", async ({ page }) => {
  await fresh(page);
  await page.locator("#demoBtn").click();
  await page.locator("#setBtn").click();
  await expect(page.locator("#size")).toBeVisible();
  await expect(page.locator("#viewSet")).toBeVisible();
  await expect(page.locator("#font")).toBeHidden();
  await expect(page.locator("#profileSel")).toBeHidden();
  await expect(page.locator("#guideSet")).toBeHidden();
  await page.locator("#readingSetupLink").click();
  await page.locator("#readingSetupBtn").click();
  await expect(page.locator("#settings")).toHaveAccessibleName("Læseindstillinger");
  await expect(page.locator("#font")).toBeVisible();
  await page.locator("#setup-aids > summary").click();
  await expect(page.locator("#guideSet")).toBeVisible();
  await page.locator("#setClose").click();
  await expect(page.locator("#settings")).not.toHaveClass(/open/);
  await expect(page.locator("#editBookBtn")).toBeFocused();
});

test("Line help is unavailable on empty pages and pages still awaiting recognition", async ({ page }) => {
  await fresh(page);
  await seedBooks(page, [{ id: "unavailable-help", title: "En prøvebog", texts: ["", "Afventer genkendelse"], readyPages: 1 }]);
  await page.locator(".book").click();
  await expect(page.locator("#guideBtn")).toBeDisabled({ timeout: 1500 });
  await page.locator("#next").click();
  await expect(page.locator("#guideBtn")).toBeDisabled({ timeout: 1500 });
});
