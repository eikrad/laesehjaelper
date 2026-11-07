import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { fixture, fresh, openWorkshop, seedBooks, storedPages, waitForText } from "./helpers";

test.use({ serviceWorkers: "block" });
test.beforeEach(async ({ page }) => { await fresh(page); });

async function openOriginalBook(page: Page) {
  await seedBooks(page, [{ id: "photos", title: "Original book", texts: ["Første originale side.", "Anden originale side.", "Sidste originale side."] }]);
  await page.locator(".book").click();
  await openWorkshop(page);
}

/** Open the photo chooser of a page action and pick files, without cropping them yet. */
async function pickPhotos(page: Page, button: string, files: string[]) {
  await expect(page.locator(button)).toBeVisible();
  const chooser = page.waitForEvent("filechooser");
  await page.click(button);
  await (await chooser).setFiles(files.map(fixture));
}

/** Accept the next photo in the crop dialog as it is. */
async function acceptCrop(page: Page) {
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
  await page.click("#cropWhole");
}

async function choosePhoto(page: Page, button: string, files: string[]) {
  await pickPhotos(page, button, files);
  for (const _ of files) await acceptCrop(page);
}

/** Hold a storage transaction open to reproduce slow device storage; returns a function that releases it. */
async function holdStorage(page: Page) {
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("laesehjaelper", 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
    const state = { release: false, finished: false };
    Object.assign(window, { heldStorage: state });
    const tx = db.transaction("pages", "readwrite");
    const keepOpen = () => { tx.objectStore("pages").get("held").onsuccess = () => { if (!state.release) keepOpen(); }; };
    keepOpen();
    tx.oncomplete = () => { state.finished = true; db.close(); };
  });
  type Held = { heldStorage: { release: boolean; finished: boolean } };
  return async () => {
    await page.evaluate(() => { (window as unknown as Held).heldStorage.release = true; });
    await page.waitForFunction(() => (window as unknown as Held).heldStorage.finished);
  };
}

/** Fake text recognition: every call waits until the test releases it, then returns "Page text <call>.". */
async function holdRecognition(page: Page) {
  await page.route("**/tesseract.min.js", route => route.fulfill({ contentType: "text/javascript", body: `
    window.ocrCalls = 0;
    window.ocrReleases = {};
    window.Tesseract = { createWorker: async () => ({
      setParameters: async () => {},
      recognize: async () => {
        const call = ++window.ocrCalls;
        await new Promise(resolve => { window.ocrReleases[call] = resolve; });
        return { data: { text: 'Page text ' + call + '.', blocks: [] } };
      }
    }) };
  ` }));
}
type Ocr = { ocrCalls: number; ocrReleases: Record<number, () => void> };

test("Reordering keeps the selected page and persists, with disabled end arrows", async ({ page }) => {
  await openOriginalBook(page);
  await expect(page.locator(".thumb .ctl").first().locator("button").first()).toBeDisabled();
  await expect(page.locator(".thumb .ctl").last().locator("button").last()).toBeDisabled();
  await page.locator(".thumb > button").nth(1).click();
  await page.locator(".thumb .ctl").nth(1).locator("button").first().click();
  await expect(page.locator("#count")).toHaveText("1 / 3");
  await expect(page.locator("#reader")).toContainText("Anden originale side.");
  await expect.poll(async () => (await storedPages(page)).map(p => p.id)).toEqual(["photos-1", "photos-0", "photos-2"]);
  await page.reload();
  await expect(page.locator("#reader")).toContainText("Anden originale side.");
});

for (const [button, position] of [["#insertBeforeBtn", 1], ["#insertAfterBtn", 2]] as const) {
  test(`Inserts a missing photo ${position === 1 ? "before" : "after"} the selected page and saves the order`, async ({ page }) => {
    await openOriginalBook(page);
    await page.locator(".thumb > button").nth(1).click();
    await choosePhoto(page, button, ["side-da.jpg"]);
    await waitForText(page);
    await expect(page.locator("#count")).toHaveText(`${position + 1} / 4`);
    await expect(page.locator("#reader")).toContainText("Pindsvinet");
    await expect.poll(async () => (await storedPages(page))[position]?.status).toBe("done");
    const records = await storedPages(page);
    expect(records.filter(p => p.id.startsWith("photos-")).map(p => p.id)).toEqual(["photos-0", "photos-1", "photos-2"]);
    expect(records[position].photo).toBe(true);
    await page.reload();
    await expect(page.locator("#count")).toHaveText(`${position + 1} / 4`);
    await expect(page.locator("#reader")).toContainText("Pindsvinet");
  });
}

test("Replacing a page photo keeps its identity and position and survives reload", async ({ page }) => {
  await openOriginalBook(page);
  await page.locator(".thumb > button").nth(1).click();
  const url = page.url();
  await choosePhoto(page, "#replacePhotoBtn", ["side-da.jpg"]);
  await waitForText(page);
  await expect(page.locator("#count")).toHaveText("2 / 3");
  await expect(page.locator("#reader")).toContainText("Pindsvinet");
  await expect(page).toHaveURL(url);
  await expect.poll(async () => (await storedPages(page))[1]?.status).toBe("done");
  const records = await storedPages(page);
  expect(records.map(p => p.id)).toEqual(["photos-0", "photos-1", "photos-2"]);
  expect(records[0].text).toBe("Første originale side.");
  expect(records[2].text).toBe("Sidste originale side.");
  expect(records[1].photo).toBe(true);
  await page.reload();
  await expect(page.locator("#reader")).toContainText("Pindsvinet");
  await expect(page.locator("#count")).toHaveText("2 / 3");
});

test("A broken replacement image leaves the existing page untouched", async ({ page }) => {
  await openOriginalBook(page);
  const chooser = page.waitForEvent("filechooser");
  await expect(page.locator("#replacePhotoBtn")).toBeVisible();
  await page.click("#replacePhotoBtn");
  await (await chooser).setFiles({ name: "broken.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not an image") });
  await expect(page.locator("#toast")).toHaveText("Billedet kunne ikke åbnes.");
  await expect(page.locator("#reader")).toContainText("Første originale side.");
  expect((await storedPages(page)).map(p => p.id)).toEqual(["photos-0", "photos-1", "photos-2"]);
});

test("A superseded recognition job cannot write old text over the replacement photo", async ({ page }) => {
  await page.route("**/tesseract.min.js", route => route.fulfill({ contentType: "text/javascript", body: `
    window.ocrCalls = 0;
    window.ocrReleases = {};
    window.Tesseract = { createWorker: async () => ({
      setParameters: async () => {},
      recognize: async () => {
        const call = ++window.ocrCalls;
        if (call <= 3) await new Promise(resolve => { window.ocrReleases[call] = resolve; });
        return { data: { text: call === 1 ? 'Old page text.' : 'Replacement page text.', blocks: [] } };
      }
    }) };
  ` }));
  await page.reload();
  await page.setInputFiles("#file", fixture("side-da.jpg"));
  await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
  await page.click("#cropWhole");
  await page.waitForFunction(() => (window as unknown as { ocrCalls: number }).ocrCalls === 1, undefined, { timeout: 20_000 });
  const original = await storedPages(page);
  await choosePhoto(page, "#replacePhotoBtn", ["side-overskrift.jpg"]);
  for (const call of [1, 2]) {
    await page.evaluate(call => (window as unknown as { ocrReleases: Record<number, () => void> }).ocrReleases[call](), call);
    await page.waitForFunction(call => (window as unknown as { ocrCalls: number }).ocrCalls === call + 1, call, { timeout: 20_000 });
  }
  const pending = await storedPages(page);
  expect(pending.map(p => p.id)).toEqual(original.map(p => p.id));
  expect(pending[0].status).toBe("wait");
  expect(pending[0].text).toBe("");
  await page.evaluate(() => (window as unknown as { ocrReleases: Record<number, () => void> }).ocrReleases[3]());
  await waitForText(page);
  await expect(page.locator("#reader")).toContainText("Replacement page text.");
  await expect.poll(async () => (await storedPages(page))[0]?.text).toBe("Replacement page text.");
  await page.reload();
  await expect(page.locator("#reader")).toContainText("Replacement page text.");
});

test("A cancelled photo chooser leaves the book unchanged and can be opened again", async ({ page }) => {
  await openOriginalBook(page);
  const chooser = page.waitForEvent("filechooser");
  await expect(page.locator("#replacePhotoBtn")).toBeVisible();
  await page.click("#replacePhotoBtn");
  await (await chooser).setFiles([]);
  await expect(page.locator("#crop")).toBeHidden();
  await expect(page.locator("#reader")).toContainText("Første originale side.");
  expect((await storedPages(page)).map(p => p.id)).toEqual(["photos-0", "photos-1", "photos-2"]);
  await choosePhoto(page, "#replacePhotoBtn", ["side-da.jpg"]);
  await waitForText(page);
  await expect(page.locator("#reader")).toContainText("Pindsvinet");
});

test("Multiple inserted photos stay together in selection order", async ({ page }) => {
  await openOriginalBook(page);
  await choosePhoto(page, "#insertAfterBtn", ["side-da.jpg", "side-overskrift.jpg"]);
  await expect(page.locator("#count")).toHaveText("2 / 5");
  await expect.poll(async () => (await storedPages(page)).filter(p => p.status === "done").length, { timeout: 120_000 }).toBe(5);
  const records = await storedPages(page);
  expect(records[1].text).toContain("Pindsvinet");
  expect(records[2].text).toContain("Bjørnens");
  expect(records.filter(p => p.id.startsWith("photos-")).map(p => p.id)).toEqual(["photos-0", "photos-1", "photos-2"]);
  await page.reload();
  await expect(page.locator("#count")).toHaveText("2 / 5");
  await expect(page.locator("#reader")).toContainText("Pindsvinet");
});

test("A photo chosen after leaving a book cannot change another book", async ({ page }) => {
  await seedBooks(page, [
    { id: "a", title: "Book A", texts: ["Original page A."] },
    { id: "b", title: "Book B", texts: ["Original page B."] },
  ]);
  await page.locator(".book", { hasText: "Book A" }).click();
  await openWorkshop(page);
  const chooser = page.waitForEvent("filechooser");
  await page.click("#replacePhotoBtn");
  const dialog = await chooser;
  await page.click("#home");
  await page.locator(".book", { hasText: "Book B" }).click();
  await dialog.setFiles(fixture("side-da.jpg"));
  await expect(page.locator("#crop")).toBeHidden();
  await expect(page.locator("#reader")).toContainText("Original page B.");
  await expect(page.locator("#count")).toHaveText("1 / 1");
  await page.reload();
  await expect(page.locator("#reader")).toContainText("Original page B.");
  await page.click("#home");
  await page.locator(".book", { hasText: "Book A" }).click();
  await expect(page.locator("#reader")).toContainText("Original page A.");
});

test("While a batch is saving, the page list already shows every accepted photo", async ({ page }) => {
  await holdRecognition(page); // No recognition result may redraw the page list instead.
  await openOriginalBook(page);
  await page.locator(".thumb > button").nth(1).click();
  await pickPhotos(page, "#insertAfterBtn", ["side-da.jpg", "side-overskrift.jpg"]);
  await acceptCrop(page);
  await expect(page.locator("#cropMsg")).toContainText("Billede 2 af 2");
  const release = await holdStorage(page);
  try {
    await acceptCrop(page);
    await expect(page.locator("#crop")).toBeHidden();
    await expect(page.locator(".thumb")).toHaveCount(5);
    await expect(page.locator("#count")).toHaveText("3 / 5");
  } finally { await release(); }
  await expect.poll(async () => (await storedPages(page)).length).toBe(5);
});

test("Deleting a new page during a batch keeps the rest of the batch and a page selected", async ({ page }) => {
  await openOriginalBook(page);
  await page.locator(".thumb > button").nth(1).click();
  await pickPhotos(page, "#insertAfterBtn", ["side-da.jpg", "side-overskrift.jpg"]);
  const release = await holdStorage(page);
  try {
    await acceptCrop(page);
    await expect(page.locator("#crop")).toBeHidden();
    await page.locator(".thumb").nth(2).locator(".x").click();
  } finally { await release(); }
  await acceptCrop(page);
  await expect(page.locator("#count")).toHaveText("3 / 4");
  await expect(page.locator(".thumb > button.on")).toHaveCount(1);
  await expect.poll(async () => (await storedPages(page)).map(p => (p.id.startsWith("photos-") ? p.id : "new")))
    .toEqual(["photos-0", "photos-1", "new", "photos-2"]);
  await page.reload();
  await expect(page.locator("#count")).toHaveText("3 / 4");
});

test("Replacing the photo of a page that waits for recognition recognises it once", async ({ page }) => {
  await holdRecognition(page);
  await page.reload();
  await page.setInputFiles("#file", ["side-da.jpg", "side-overskrift.jpg"].map(fixture));
  await acceptCrop(page);
  await acceptCrop(page);
  // The first page is being recognised; the second waits in the queue when its photo is replaced.
  await page.waitForFunction(() => (window as unknown as Ocr).ocrCalls === 1);
  await page.locator(".thumb > button").nth(1).click();
  await choosePhoto(page, "#replacePhotoBtn", ["side-da.jpg"]);
  for (let call = 1; call <= 4; call++) {
    await page.waitForFunction(call => !!(window as unknown as Ocr).ocrReleases[call], call);
    await page.evaluate(call => (window as unknown as Ocr).ocrReleases[call](), call);
  }
  await expect.poll(async () => (await storedPages(page)).map(p => p.status)).toEqual(["done", "done"]);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as unknown as Ocr).ocrCalls)).toBe(4);
});

test("A replaced photo stays replaced when the previous photo was still being saved", async ({ page }) => {
  // Hold image encoding (toBlob) so the first photo's save is still pending when it is replaced.
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    const gate = { held: false, waiting: [] as (() => void)[] };
    Object.assign(window, { blobGate: gate });
    HTMLCanvasElement.prototype.toBlob = function (this: HTMLCanvasElement, ...args: Parameters<HTMLCanvasElement["toBlob"]>) {
      if (gate.held) gate.waiting.push(() => original.apply(this, args)); else original.apply(this, args);
    };
  });
  await holdRecognition(page);
  await page.reload();
  type Gate = { blobGate: { held: boolean; waiting: (() => void)[] } };
  await page.setInputFiles("#file", fixture("side-da.jpg"));
  await page.evaluate(() => { (window as unknown as Gate).blobGate.held = true; });
  await acceptCrop(page);
  await choosePhoto(page, "#replacePhotoBtn", ["side-overskrift.jpg"]);
  // Two saves wait: the first photo's, then the replacement's. Let the replacement's finish first.
  expect(await page.evaluate(() => (window as unknown as Gate).blobGate.waiting.length)).toBe(2);
  await page.evaluate(() => {
    const gate = (window as unknown as Gate).blobGate;
    gate.held = false; gate.waiting[1]();
  });
  await expect.poll(async () => (await storedPages(page)).map(p => p.photo)).toEqual([true]);
  await page.evaluate(() => (window as unknown as Gate).blobGate.waiting[0]());
  await page.waitForTimeout(500);
  await page.reload();
  // side-overskrift.jpg is 1000 px wide, side-da.jpg 1200 px.
  await expect.poll(() => page.locator("#origImg").evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1000);
});
