import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { fixture, fresh, openWorkshop, seedBooks, waitForText } from "./helpers";

test.use({ serviceWorkers: "block" });
test.beforeEach(async ({ page }) => { await fresh(page); });

async function openOriginalBook(page: Page) {
  await seedBooks(page, [{ id: "photos", title: "Original book", texts: ["Første originale side.", "Anden originale side.", "Sidste originale side."] }]);
  await page.locator(".book").click();
  await openWorkshop(page);
}

async function choosePhoto(page: Page, button: string, files: string[]) {
  await expect(page.locator(button)).toBeVisible();
  const chooser = page.waitForEvent("filechooser");
  await page.click(button);
  await (await chooser).setFiles(files.map(fixture));
  for (const _ of files) {
    await expect(page.locator("#crop")).toBeVisible();
    await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
    await page.click("#cropWhole");
  }
}

async function savedPages(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("laesehjaelper", 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
    const tx = db.transaction(["books", "pages"]);
    const books = tx.objectStore("books").getAll(), pages = tx.objectStore("pages").getAll();
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
    const ids: string[] = books.result[0]?.pageIds || [];
    return ids.map(id => {
      const p = pages.result.find(p => p.id === id);
      return { id, text: p?.text as string, status: p?.status as string, photo: !!p?.photoBlob };
    });
  });
}

test("Reordering keeps the selected page and persists, with disabled end arrows", async ({ page }) => {
  await openOriginalBook(page);
  await expect(page.locator(".thumb .ctl").first().locator("button").first()).toBeDisabled();
  await expect(page.locator(".thumb .ctl").last().locator("button").last()).toBeDisabled();
  await page.locator(".thumb > button").nth(1).click();
  await page.locator(".thumb .ctl").nth(1).locator("button").first().click();
  await expect(page.locator("#count")).toHaveText("1 / 3");
  await expect(page.locator("#reader")).toContainText("Anden originale side.");
  await expect.poll(async () => (await savedPages(page)).map(p => p.id)).toEqual(["photos-1", "photos-0", "photos-2"]);
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
    await expect.poll(async () => (await savedPages(page))[position]?.status).toBe("done");
    const records = await savedPages(page);
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
  await expect.poll(async () => (await savedPages(page))[1]?.status).toBe("done");
  const records = await savedPages(page);
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
  expect((await savedPages(page)).map(p => p.id)).toEqual(["photos-0", "photos-1", "photos-2"]);
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
  const original = await savedPages(page);
  await choosePhoto(page, "#replacePhotoBtn", ["side-overskrift.jpg"]);
  for (const call of [1, 2]) {
    await page.evaluate(call => (window as unknown as { ocrReleases: Record<number, () => void> }).ocrReleases[call](), call);
    await page.waitForFunction(call => (window as unknown as { ocrCalls: number }).ocrCalls === call + 1, call, { timeout: 20_000 });
  }
  const pending = await savedPages(page);
  expect(pending.map(p => p.id)).toEqual(original.map(p => p.id));
  expect(pending[0].status).toBe("wait");
  expect(pending[0].text).toBe("");
  await page.evaluate(() => (window as unknown as { ocrReleases: Record<number, () => void> }).ocrReleases[3]());
  await waitForText(page);
  await expect(page.locator("#reader")).toContainText("Replacement page text.");
  await expect.poll(async () => (await savedPages(page))[0]?.text).toBe("Replacement page text.");
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
  expect((await savedPages(page)).map(p => p.id)).toEqual(["photos-0", "photos-1", "photos-2"]);
  await choosePhoto(page, "#replacePhotoBtn", ["side-da.jpg"]);
  await waitForText(page);
  await expect(page.locator("#reader")).toContainText("Pindsvinet");
});

test("Multiple inserted photos stay together in selection order", async ({ page }) => {
  await openOriginalBook(page);
  await choosePhoto(page, "#insertAfterBtn", ["side-da.jpg", "side-overskrift.jpg"]);
  await expect(page.locator("#count")).toHaveText("2 / 5");
  await expect.poll(async () => (await savedPages(page)).filter(p => p.status === "done").length, { timeout: 120_000 }).toBe(5);
  const records = await savedPages(page);
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
