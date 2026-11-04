import { expect, type Page } from "@playwright/test";
import path from "node:path";

export const fixture = (name: string) => path.resolve("tests/fixtures", name);

/** Fresh state: no settings or books. */
export async function fresh(page: Page) {
  await page.goto("/");
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise<void>((r) => { const q = indexedDB.deleteDatabase("laesehjaelper"); q.onsuccess = q.onerror = q.onblocked = () => r(); });
  });
  await page.reload();
}

/** Load photos through the main button and confirm each one in the crop dialog. */
export async function addPhotos(page: Page, files: string[], input = "#file") {
  await page.setInputFiles(input, files.map(fixture));
  for (let i = 0; i < files.length; i++) {
    await expect(page.locator("#crop")).toBeVisible();
    await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
    await page.click("#cropOk");
  }
}

/** Wait until the current page has been recognized and displayed. */
export async function waitForText(page: Page) {
  await expect(page.locator("#reader .w").first()).toBeVisible({ timeout: 200_000 });
}

/** Choose a tool from the book menu in the book bar. */
export async function bookTool(page: Page, id: "checkTextBtn" | "editPagesBtn" | "exportBtn") {
  await page.click("#bookMenuBtn");
  await page.click(`#${id}`);
}
