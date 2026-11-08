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

test("Font and PDF licences ship with the app and remain readable offline", async ({ page, context }) => {
  for (const [ui, label] of [["da", "Licenser og skrifter"], ["de", "Lizenzen und Schriften"], ["en", "Licences and fonts"]]) {
    await fresh(page);
    await page.click(`#uiLang button[data-v=${ui}]`);
    await page.locator('.foot .disclaimer summary').click();
    await expect(page.locator("#licensesLink")).toHaveText(label, { timeout: 1500 });
    await expect(page.locator("#licensesLink")).toHaveAttribute("href", "licenses.html");
  }
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => {}));
  await context.setOffline(true);
  const text = await page.evaluate(async () => {
    const response = await fetch("licenses.html");
    if (!response.ok) throw new Error(String(response.status));
    return response.text();
  });
  for (const name of ["OpenDyslexic", "Andika", "Atkinson Hyperlegible", "Lexend", "pdf-lib", "fontkit", "woff2-encoder", "Brotli", "WOFF2"])
    expect(text).toContain(name);
  for (const notice of ["Andrew Dillon", "Devon Govett", "Kyedo", "Abbie Gonzalez", "SIL International", "Braille Institute", "Lexend Project Authors", "Permission is hereby granted", "SIL OPEN FONT LICENSE Version 1.1", "Apache License"])
    expect(text).toContain(notice);
});
