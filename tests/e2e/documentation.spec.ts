import { expect, test } from "./fixtures";
import { fresh } from "./helpers";

test("Research links use the README for the selected interface language", async ({ page }) => {
  for (const [ui, file, anchor] of [
    ["da", "README.da.md", "hvad-siger-forskningen"],
    ["de", "README.de.md", "was-sagt-die-forschung"],
    ["en", "README.md", "what-does-the-research-say"],
  ]) {
    await fresh(page);
    await page.click(`#uiLang button[data-v=${ui}]`);
    await page.click("#demoBtn");
    await page.click("#setBtn");
    await page.locator("#evidence summary").click();
    await expect(page.locator("#evidence a")).toHaveAttribute("href", `https://github.com/eikrad/laesehjaelper/blob/main/${file}#${anchor}`, { timeout: 1500 });
  }
});
