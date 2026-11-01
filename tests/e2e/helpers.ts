import { expect, type Page } from "@playwright/test";
import path from "node:path";

export const fixture = (name: string) => path.resolve("tests/fixtures", name);

/** Frischer Zustand: keine Einstellungen, keine Bücher. */
export async function fresh(page: Page) {
  await page.goto("/");
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise<void>((r) => { const q = indexedDB.deleteDatabase("laesehjaelper"); q.onsuccess = q.onerror = q.onblocked = () => r(); });
  });
  await page.reload();
}

/** Foto(s) über den Hauptknopf laden und im Zuschnitt-Dialog jeweils übernehmen. */
export async function addPhotos(page: Page, files: string[], input = "#file") {
  await page.setInputFiles(input, files.map(fixture));
  for (let i = 0; i < files.length; i++) {
    await expect(page.locator("#crop")).toBeVisible();
    await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
    await page.click("#cropOk");
  }
}

/** Warten, bis die aktuelle Seite erkannt und angezeigt ist. */
export async function waitForText(page: Page) {
  await expect(page.locator("#reader .w").first()).toBeVisible({ timeout: 200_000 });
}
