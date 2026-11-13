import { expect, test } from "./fixtures";
import { fresh, seedBooks, setUiLanguage } from "./helpers";

for (const [lang, correct, back] of [
  ["da", "Ret denne side", "Tilbage til læsning"],
  ["de", "Diese Seite korrigieren", "Zurück zum Lesen"],
  ["en", "Correct this page", "Back to reading"],
]) {
  test(`Correct the current page in two taps and return to reading (${lang})`, async ({ page }) => {
    await fresh(page);
    await seedBooks(page, [{ id: "correct", title: "En original prøvebog", texts: ["Første side.", "En forkert original sætning.", "Sidste side."], lastPage: 1 }]);
    await setUiLanguage(page, lang);
    await page.locator(".book").click();
    await page.click("#editBookBtn");
    await page.getByRole("menuitem", { name: correct, exact: true }).click({ timeout: 1500 });
    await expect(page.locator("#text")).toBeFocused();
    await expect(page.locator("#text")).toHaveValue("En forkert original sætning.");
    await page.fill("#text", "En rettet original sætning.");
    await expect(page.locator("#readBookBtn")).toHaveText(back);
    await page.click("#readBookBtn");
    await expect(page).toHaveURL(/#read\/correct\/correct-1$/);
    await expect(page.locator("#reader")).toContainText("En rettet original sætning.");
  });
}

test.describe("Correction availability", () => {
  test.use({ serviceWorkers: "block" });
  test("An open correction menu follows the current page's readiness", async ({ page }) => {
    await fresh(page);
    await page.route("**/tesseract.min.js", route => route.fulfill({ contentType: "text/javascript", body:
      "window.Tesseract = { createWorker: async () => { window.ocrWaiting = true; return new Promise(() => {}); } };",
    }));
    await seedBooks(page, [{ id: "ready", title: "En original bog", texts: ["En klar original side.", ""], readyPages: 1 }]);
    await page.locator(".book").click();
    await page.waitForFunction(() => "ocrWaiting" in window);
    await page.click("#editBookBtn");
    await expect(page.locator("#correctPageBtn")).toBeEnabled();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#correctPageBtn")).toBeDisabled({ timeout: 1500 });
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#correctPageBtn")).toBeEnabled();
    await page.click("#correctPageBtn");
    await expect(page.locator("#text")).toBeFocused();
    await expect(page.locator("#text")).toHaveValue("En klar original side.");
  });
});
