import { expect, test } from "./fixtures";
import { fresh, seedBooks } from "./helpers";

for (const [lang, correct, back] of [
  ["da", "Ret denne side", "Tilbage til læsning"],
  ["de", "Diese Seite korrigieren", "Zurück zum Lesen"],
  ["en", "Correct this page", "Back to reading"],
]) {
  test(`Correct the current page in two taps and return to reading (${lang})`, async ({ page }) => {
    await fresh(page);
    await seedBooks(page, [{ id: "correct", title: "En original prøvebog", texts: ["Første side.", "En forkert original sætning.", "Sidste side."], lastPage: 1 }]);
    await page.click(`#uiLang button[data-v=${lang}]`);
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
