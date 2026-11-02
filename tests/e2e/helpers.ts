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

/**
 * Problems that keep the recognized text from showing inside the page image in book-page
 * view. Runs in the browser, so it must not use anything from this module.
 */
function textInImageProblems(): string[] {
  const rd = document.querySelector("#reader")!;
  const img = rd.querySelector<HTMLImageElement>(".pageview > img");
  if (!img || !img.complete || !img.naturalWidth) return ["the page image has not loaded"];
  const ir = img.getBoundingClientRect();
  if (!ir.width || !ir.height) return ["the page image has no size"];
  const within = (r: DOMRect, o: DOMRect) => r.left >= o.left - 2 && r.right <= o.right + 2 && r.top >= o.top - 2 && r.bottom <= o.bottom + 2;
  const problems: string[] = [];
  const words = [...rd.querySelectorAll<HTMLElement>(".w")];
  if (!words.length) problems.push("no words are shown");
  for (const w of words) {
    const name = `"${w.textContent}"`, box = w.closest<HTMLElement>(".pageview .tbox"), r = w.getBoundingClientRect();
    if (!box) problems.push(`${name} is not in a text box on the page image`);
    else if (!r.width || !r.height) problems.push(`${name} has no size`);
    else if (!within(r, box.getBoundingClientRect())) problems.push(`${name} is cut off by its text box`);
    else if (!within(r, ir)) problems.push(`${name} lies outside the page image`);
    if (parseFloat(getComputedStyle(w).fontSize) < 10) problems.push(`${name} is too small to read`);
  }
  // Every recognized letter appears in the text boxes, in order.
  const letters = (s: string) => s.replace(/[^\p{L}]/gu, "");
  const shown = letters([...rd.querySelectorAll(".pageview .tbox")].map(b => b.textContent).join(" "));
  const text = letters(document.querySelector<HTMLTextAreaElement>("#text")!.value);
  if (shown !== text) problems.push(`the text boxes show "${shown}" instead of "${text}"`);
  return problems;
}

/** Book-page view: the recognized text sits readable inside the page image, where the old text was. */
export async function expectTextInImage(page: Page) {
  await expect(page.locator("#reader")).toHaveClass(/pagemode/);
  // Font sizes are fitted once the image and fonts have loaded, so retry until everything fits.
  await expect.poll(() => page.evaluate(textInImageProblems)).toEqual([]);
}
