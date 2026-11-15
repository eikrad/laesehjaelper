import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { addPhotos, fresh, openRecognisedBook, openWorkshop, seedBooks, setUiLanguage, storedPages } from "./helpers";

test.beforeEach(async ({ page }) => { await fresh(page); });

test("The workshop exposes book and selected-page tools, with recognition status in the list", async ({ page }) => {
  await seedBooks(page, [{ id: "tools", title: "En værkstedsbog", texts: ["Første originale side.", "Anden originale side."] }]);
  await page.locator(".book").click();
  await openWorkshop(page);
  await expect(page.locator("#text")).toBeVisible({ timeout: 1500 });
  await expect(page.locator("#exportBtn")).toBeVisible();
  await expect(page.locator("#delBookBtn")).toBeVisible();
  await expect(page.locator(".thumb .recognition")).toHaveText(["Klar", "Klar"]);
  await page.locator(".thumb > button").nth(1).click();
  await expect(page.locator("#text")).toHaveValue("Anden originale side.");
  await page.locator(".thumb").nth(1).locator(".ctl button").first().click();
  await expect(page.locator("#count")).toHaveText("1 / 2");
  await page.fill("#text", "En rettet original side.");
  await page.click("#readBookBtn");
  await expect(page.locator("#reader")).toContainText("En rettet original side.");
  await expect(page.locator("#delBookBtn")).toBeHidden();
});

test.describe("Workshop recognition status", () => {
  test.use({ serviceWorkers: "block" });
  test("The list distinguishes ready, recognising and queued pages", async ({ page }) => {
    await page.route("**/tesseract.min.js", route => route.fulfill({ contentType: "text/javascript", body:
      "window.Tesseract = { createWorker: async () => { window.ocrWaiting = true; return new Promise(() => {}); } };",
    }));
    await seedBooks(page, [{ id: "status", title: "En bog undervejs", texts: ["En klar side.", "", ""], readyPages: 1 }]);
    await page.locator(".book").click();
    await page.waitForFunction(() => "ocrWaiting" in window);
    await openWorkshop(page);
    await expect(page.locator(".thumb .recognition")).toHaveText(["Klar", "Teksten genkendes …", "Venter på genkendelse …"]);
    await page.locator(".thumb > button").nth(1).click();
    await expect(page.locator("#edit")).toBeHidden();
    await expect(page.locator("#checkTextBtn")).toBeDisabled({ timeout: 1500 });
    await page.locator(".thumb > button").first().click();
    await expect(page.locator("#text")).toHaveValue("En klar side.");
  });

  test("Recognition updates the list's status without redrawing the thumbnails, and reading draws no list", async ({ page }) => {
    // Every recognition attempt waits until the test lets it fail.
    await page.route("**/tesseract.min.js", route => route.fulfill({ contentType: "text/javascript", body:
      "window.recognitionGate = new Promise(r => { window.failRecognition = r; });" +
      "window.Tesseract = { createWorker: () => window.recognitionGate.then(() => { throw new Error('Recognition unavailable'); }) };",
    }));
    await seedBooks(page, [{ id: "redraw", title: "En bog undervejs", texts: ["En klar side.", "", ""], readyPages: 1 }]);
    await page.locator(".book").click();
    await page.waitForFunction(() => "failRecognition" in window);
    // Thumbnails can be large photos; reading never shows them, so it does not build them.
    await expect(page.locator("#thumbs .thumb")).toHaveCount(0);
    await openWorkshop(page);
    await expect(page.locator(".thumb .recognition")).toHaveText(["Klar", "Teksten genkendes …", "Venter på genkendelse …"]);
    await page.locator(".thumb > button").evaluateAll(buttons => { for (const b of buttons) (b as HTMLElement).dataset.drawn = "once"; });
    await page.evaluate(() => (window as unknown as { failRecognition: () => void }).failRecognition());
    await expect(page.locator(".thumb .recognition")).toHaveText(["Klar", "Genkendelsen mislykkedes.", "Genkendelsen mislykkedes."]);
    await expect(page.locator(".thumb > button").nth(2)).toHaveAccessibleName("Side 3, Genkendelsen mislykkedes.");
    await expect(page.locator('.thumb > button[data-drawn="once"]'), "same thumbnails, not redrawn").toHaveCount(3);
  });
});

test.describe("Workshop recognition recovery", () => {
  test.use({ serviceWorkers: "block" });
  test("A failed page still offers recognition retry and crop tools", async ({ page }) => {
    const { addPhotos } = await import("./helpers");
    await page.route("**/tesseract.min.js", route => route.fulfill({ contentType: "text/javascript", body:
      "window.Tesseract = { createWorker: async () => { throw new Error('Recognition unavailable'); } };",
    }));
    await page.reload();
    await addPhotos(page, ["side-da.jpg"]);
    await expect(page.locator("#reader")).toContainText("Genkendelsen mislykkedes.");
    await expect(page.locator("#reocrBtn")).toBeVisible({ timeout: 1500 });
    await expect(page.locator("#recropBtn")).toBeVisible();
    await page.click("#reocrBtn");
    await expect(page.locator("#reader")).toContainText("Genkendelsen mislykkedes.");
    await page.click("#recropBtn");
    await expect(page.locator("#crop")).toBeVisible();
  });
});

/** All page records on the device, with what undo must keep. `deleted` is the undo mark of a deleted page. */
const pageRecords = (page: Page) => page.evaluate(async () => {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("laesehjaelper", 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
  });
  const tx = db.transaction("pages"), all = tx.objectStore("pages").getAll();
  await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
  db.close();
  return (all.result as Record<string, unknown>[]).map(r => ({
    id: r.id as string, text: r.text, manualEdits: r.manualEdits, status: r.status, corners: !!r.corners, paras: !!r.paras,
    photo: !!r.photoBlob, input: !!r.inputBlob, clean: !!r.cleanBlob, deleted: !!r.deleted,
  })).sort((a, b) => a.id.localeCompare(b.id));
});

/** Move the undo deadline of stored deleted pages into the past, as if the app had been closed for a while. */
const letUndoTimeRunOut = (page: Page) => page.evaluate(async () => {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("laesehjaelper", 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
  });
  const tx = db.transaction("pages", "readwrite"), store = tx.objectStore("pages"), all = store.getAll();
  all.onsuccess = () => { for (const r of all.result) if (r.deleted) store.put({ ...r, deleted: { ...r.deleted, until: 1 } }); };
  await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
  db.close();
});

const undo = (page: Page, name = "Fortryd") => page.locator("#toast").getByRole("button", { name, exact: true });

// A slip costs one tap (#205): a deleted page can be brought back for a few seconds.
test("Undo brings a deleted page back at its place with its photo, text, manual edits and recognition state", async ({ page }) => {
  await openRecognisedBook(page, ["side-da.jpg", "side-overskrift.jpg"], [{ manualEdits: true, text: "Min egen rettelse." }]);
  await openWorkshop(page);
  const before = await pageRecords(page);
  await page.locator(".thumb").first().locator(".x").click();
  await expect(page.locator("#thumbs .thumb")).toHaveCount(1);
  await expect(page.locator("#toast")).toContainText("Siden er slettet");
  await expect.poll(async () => (await storedPages(page)).map(p => p.id)).toEqual(["recognised-1"]);
  await undo(page).click();
  await expect(page.locator("#thumbs .thumb")).toHaveCount(2);
  await expect(undo(page)).toBeHidden();
  await expect(page.locator("#count")).toHaveText("1 / 2");   // The page that came back is selected.
  await expect.poll(async () => (await storedPages(page)).map(p => p.id)).toEqual(["recognised-0", "recognised-1"]);
  expect(await pageRecords(page)).toEqual(before);
  await page.reload();
  await expect(page.locator("#thumbs .thumb")).toHaveCount(2);
  await expect(page.locator("#thumbs .thumb img").first()).toBeVisible();
});

test.describe("Recognition and Undo", () => {
  test.use({ serviceWorkers: "block" });   // The fake text recognition must not come from the service worker's cache.

  test("A page deleted while it waits for recognition is recognised after Undo", async ({ page }) => {
    // Recognition of the first photo waits until the test lets it finish; the second photo waits its turn.
    await page.route("**/tesseract.min.js", route => route.fulfill({ contentType: "text/javascript", body: `
      let first = true;
      window.Tesseract = { createWorker: async () => ({
        setParameters: async () => {},
        recognize: async () => {
          if (first) { first = false; await new Promise(r => { window.finishRecognition = r; }); }
          return { data: { text: 'En prøveside', blocks: [{ paragraphs: [{ lines: [{ text: 'En prøveside',
            bbox: {x0:100,y0:100,x1:350,y1:130}, words: [
              {text:'En',confidence:97,bbox:{x0:100,y0:100,x1:130,y1:130}},
              {text:'prøveside',confidence:97,bbox:{x0:150,y0:100,x1:350,y1:130}}
            ] }] }] }] } };
        },
        terminate: async () => {},
      }) };
    ` }));
    await page.reload();
    await addPhotos(page, ["side-da.jpg", "side-overskrift.jpg"]);
    await page.waitForFunction(() => "finishRecognition" in window);
    await openWorkshop(page);
    await page.locator(".thumb").nth(1).locator(".x").click();   // The second page, still waiting.
    await expect(page.locator("#thumbs .thumb")).toHaveCount(1);
    await page.evaluate(() => (window as unknown as { finishRecognition: () => void }).finishRecognition());
    await expect.poll(async () => (await storedPages(page)).map(p => p.status)).toEqual(["done"]);
    await undo(page).click();
    await expect(page.locator("#thumbs .thumb")).toHaveCount(2);
    await expect.poll(async () => (await storedPages(page)).map(p => p.status), { timeout: 20_000 }).toEqual(["done", "done"]);
  });
});

test("Undo still works after a reload within the undo time", async ({ page }) => {
  await openRecognisedBook(page, ["side-da.jpg", "side-overskrift.jpg"]);
  await openWorkshop(page);
  await page.locator(".thumb").nth(1).locator(".x").click();
  await expect(page.locator("#toast")).toContainText("Siden er slettet");
  await expect.poll(async () => (await storedPages(page)).map(p => p.id)).toEqual(["recognised-0"]);
  await page.reload();
  await expect(page.locator("#thumbs .thumb")).toHaveCount(1);
  await undo(page).click();
  await expect(page.locator("#thumbs .thumb")).toHaveCount(2);
  await expect.poll(async () => (await storedPages(page)).map(p => p.id)).toEqual(["recognised-0", "recognised-1"]);
  expect((await pageRecords(page)).map(r => r.deleted)).toEqual([false, false]);
});

test("After the undo time a deleted page is gone for good, also from the device", async ({ page }) => {
  await page.clock.install();
  await openRecognisedBook(page, ["side-da.jpg", "side-overskrift.jpg"]);
  await openWorkshop(page);
  await page.locator(".thumb").first().locator(".x").click();
  await expect(undo(page)).toBeVisible();
  await page.clock.fastForward(11_000);
  await expect(undo(page)).toBeHidden();
  await expect.poll(async () => (await pageRecords(page)).map(r => r.id)).toEqual(["recognised-1"]);
  await page.reload();
  await expect(page.locator("#thumbs .thumb")).toHaveCount(1);
  await expect(undo(page)).toBeHidden();
});

test("A deletion whose undo time ran out while the app was closed is final when the book opens", async ({ page }) => {
  await openRecognisedBook(page, ["side-da.jpg", "side-overskrift.jpg"]);
  await openWorkshop(page);
  await page.locator(".thumb").first().locator(".x").click();
  await expect.poll(async () => (await pageRecords(page)).map(r => r.deleted)).toEqual([true, false]);
  await letUndoTimeRunOut(page);
  await page.reload();
  await expect(page.locator("#thumbs .thumb")).toHaveCount(1);
  await expect(undo(page)).toBeHidden();
  await expect.poll(async () => (await pageRecords(page)).map(r => r.id)).toEqual(["recognised-1"]);
});

test("Only the latest deletion can be undone; deleting another page makes the earlier one final", async ({ page }) => {
  await seedBooks(page, [{ id: "three", title: "Tre sider", texts: ["Første side.", "Anden side.", "Tredje side."] }]);
  await page.locator(".book").click();
  await openWorkshop(page);
  await page.locator(".thumb").first().locator(".x").click();
  await expect(page.locator("#thumbs .thumb")).toHaveCount(2);
  await page.locator(".thumb").first().locator(".x").click();
  await expect(page.locator("#thumbs .thumb")).toHaveCount(1);
  await undo(page).click();
  await expect(page.locator("#thumbs .thumb")).toHaveCount(2);
  await expect.poll(async () => (await storedPages(page, "three")).map(p => p.id)).toEqual(["three-1", "three-2"]);
  await expect.poll(async () => (await pageRecords(page)).map(r => r.id)).toEqual(["three-1", "three-2"]);
});

test("The only page cannot be deleted; deleting the book still asks to tap again", async ({ page }) => {
  await seedBooks(page, [{ id: "one", title: "Én side", texts: ["Den eneste side."] }]);
  await page.locator(".book").click();
  await openWorkshop(page);
  const x = page.locator(".thumb .x");
  await expect(x).toBeDisabled();
  await expect(x).toHaveAttribute("title", /Slet bogen i stedet/);
  await page.click("#delBookBtn");
  await expect(page.locator("#delBookBtn")).toHaveText("Tryk igen for at slette bogen");
  await expect(page.locator("#thumbs .thumb")).toHaveCount(1);
  await page.click("#delBookBtn");
  await expect(page.locator("#start")).toBeVisible();
});

test("The undo message is in the interface language", async ({ page }) => {
  await seedBooks(page, [{ id: "words", title: "Sider", texts: ["En.", "To.", "Tre.", "Fire."] }]);
  await page.locator(".book").click();
  await openWorkshop(page);
  for (const [lang, message, action] of [["de", "Seite gelöscht", "Rückgängig"], ["en", "Page deleted", "Undo"], ["da", "Siden er slettet", "Fortryd"]]) {
    await setUiLanguage(page, lang);
    await page.locator(".thumb").first().locator(".x").click();
    await expect(page.locator("#toast")).toContainText(message);
    await expect(undo(page, action)).toBeVisible();
  }
});
