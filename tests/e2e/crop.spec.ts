import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { pageAction, checkText, fixture, fresh, openRecognisedBook, openWorkshop, seedBooks, setUiLanguage, storedPages, waitForText } from "./helpers";

test.use({ serviceWorkers: "block" });

/** Hold OpenCV back, as on a slow tablet loading it for the first photo; returns a function that lets it load. */
async function holdOpenCv(page: Page) {
  let release!: () => void;
  const ready = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/opencv.js", async route => { await ready; await route.continue(); });
  return release;
}

for (const [name, index] of [["corner", 0], ["edge midpoint", 6]] as const) {
  test(`Loading page detection preserves a manually adjusted ${name}`, async ({ page }) => {
    await fresh(page);
    const release = await holdOpenCv(page);
    try {
      await page.setInputFiles("#file", fixture("foto-bord.jpg"));
      await expect(page.locator("#crop")).toBeVisible();
      await expect(page.locator("#cropMsg")).toContainText("…");
      const handle = page.locator("#cropStage .h").nth(index);
      const box = (await handle.boundingBox())!;
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + (index === 0 ? 30 : 0), y + (index === 0 ? 35 : -35), { steps: 4 });
      await page.mouse.up();
      const adjusted = await page.locator("#cropPoly").getAttribute("d");
      release();
      await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
      await expect(page.locator("#cropPoly")).toHaveAttribute("d", adjusted!);
      await expect(page.locator("#cropMsg")).not.toContainText("Siden er fundet");
      await page.click("#cropWhole");
    } finally { release(); }
  });
}

test("A tap on a handle while page detection loads still lets detection place the frame", async ({ page }) => {
  await fresh(page);
  const release = await holdOpenCv(page);
  try {
    await page.setInputFiles("#file", fixture("foto-bord.jpg"));
    await expect(page.locator("#cropMsg")).toContainText("…");
    const box = (await page.locator("#cropStage .h").first().boundingBox())!;
    // A finger resting on a handle: down and up with a jitter of a pixel, no drag.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 1, box.y + box.height / 2);
    await page.mouse.up();
    const before = await page.locator("#cropPoly").getAttribute("d");
    release();
    await expect(page.locator("#cropMsg")).toContainText("Siden er fundet", { timeout: 120_000 });
    await expect(page.locator("#cropPoly")).not.toHaveAttribute("d", before!);
    await page.click("#cropWhole");
  } finally { release(); }
});

test("A corrected automatic frame and its curved edge survive cropping and reload", async ({ page }) => {
  await fresh(page);
  await page.setInputFiles("#file", fixture("foto-bord.jpg"));
  await expect(page.locator("#cropMsg")).toContainText("Siden er fundet", { timeout: 120_000 });
  const detected = await page.locator("#cropPoly").getAttribute("d");
  for (const [index, dx, dy] of [[0, -8, -8], [6, 0, 8]]) {
    const box = (await page.locator("#cropStage .h").nth(index).boundingBox())!;
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x + dx, y + dy, { steps: 4 }); await page.mouse.up();
  }
  const corrected = await page.locator("#cropPoly").getAttribute("d");
  expect(corrected).not.toBe(detected);
  await page.click("#cropOk");
  await waitForText(page);
  await expect(page.locator("#reader")).toContainText("Pindsvinet");
  // Wait for the finished page's transaction before testing restoration from disk.
  await expect.poll(async () => (await storedPages(page)).map(p => `${p.status} ${p.corners}`)).toEqual(["done true"]);
  await page.reload();
  await checkText(page);
  await pageAction(page, "recropBtn");
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
  await expect(page.locator("#cropPoly")).toHaveAttribute("d", corrected!);
  await page.click("#cropOk");
  await waitForText(page);
  await expect(page.locator("#reader")).toContainText("Pindsvinet");
});

for (const [button, name] of [["#cropWhole", "Whole photo"]] as const) {
  test(`${name} works at once while the page search is still loading`, async ({ page }) => {
    await fresh(page);
    const release = await holdOpenCv(page);
    try {
      await page.setInputFiles("#file", fixture("side-da.jpg"));
      await expect(page.locator("#crop")).toBeVisible();
      await expect(page.locator("#cropMsg")).toContainText("…");
      await page.click(button);
      // The whole photo needs no page search.
      await expect(page.locator("#crop")).toBeHidden({ timeout: 2000 });
      await expect.poll(async () => (await storedPages(page)).map(p => `photo ${p.photo}, frame ${p.corners}`)).toEqual(["photo true, frame false"]);
    } finally { release(); }
  });
}

test("Use on an adjusted frame while the page search loads straightens the page once OpenCV is ready", async ({ page }) => {
  await fresh(page);
  const release = await holdOpenCv(page);
  try {
    await page.setInputFiles("#file", fixture("foto-bord.jpg"));
    await expect(page.locator("#crop")).toBeVisible();
    await expect(page.locator("#cropMsg")).toContainText("…");
    const box = (await page.locator("#cropStage .h").first().boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 35, { steps: 4 });
    await page.mouse.up();
    await page.click("#cropOk");
    // The tap is taken: the dialog says what it waits for, and cannot be answered twice.
    await expect(page.locator("#cropMsg")).toContainText("Retter siden op");
    await expect(page.locator("#cropOk")).toBeDisabled();
    await expect(page.locator("#cropWhole")).toBeDisabled();
    release();
    await expect(page.locator("#crop")).toBeHidden({ timeout: 120_000 });
    await expect.poll(async () => (await storedPages(page)).map(p => `photo ${p.photo}, frame ${p.corners}`)).toEqual(["photo true, frame true"]);
  } finally { release(); }
});

test("Use on the untouched frame while the page search loads waits for it and straightens the found page", async ({ page }) => {
  await fresh(page);
  const release = await holdOpenCv(page);
  try {
    await page.setInputFiles("#file", fixture("foto-bord.jpg"));
    await expect(page.locator("#crop")).toBeVisible();
    await expect(page.locator("#cropMsg")).toContainText("…");
    await page.click("#cropOk");
    // A tap out of habit means "use the suggestion": wait for it rather than take the whole photo.
    await page.waitForTimeout(300);
    await expect(page.locator("#crop")).toBeVisible();
    await expect(page.locator("#cropOk")).toBeDisabled();
    await expect(page.locator("#cropWhole")).toBeDisabled();
    release();
    await expect(page.locator("#crop")).toBeHidden({ timeout: 120_000 });
    await expect.poll(async () => (await storedPages(page)).map(p => `photo ${p.photo}, frame ${p.corners}`)).toEqual(["photo true, frame true"]);
  } finally { release(); }
});

/** Book IDs stored on the device. */
const storedBooks = (page: Page) => page.evaluate(async () => {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("laesehjaelper", 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
  });
  const tx = db.transaction("books"), all = tx.objectStore("books").getAll();
  await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
  db.close();
  return (all.result as { id: string }[]).map(b => b.id);
});

// A wrong photo costs one tap (#205): cancel it, or skip it in a batch, without creating a page.
for (const how of ["Cancel", "Escape"] as const) {
  test(`${how} on the only photo of a new book returns to the shelf and leaves no empty book`, async ({ page }) => {
    await fresh(page);
    await seedBooks(page, [{ id: "kept", title: "Min bog", texts: ["En side."] }]);
    await page.reload();
    await expect(page.locator(".book")).toHaveCount(1);
    await page.setInputFiles("#file", fixture("foto-bord.jpg"));
    await expect(page.locator("#crop")).toBeVisible();
    await expect(page.locator("#cropCancel")).toHaveText("Annuller");
    if (how === "Cancel") await page.click("#cropCancel"); else await page.keyboard.press("Escape");
    await expect(page.locator("#crop")).toBeHidden();
    await expect(page.locator("#start")).toBeVisible();
    await expect(page.locator(".book")).toHaveCount(1);
    expect(await storedBooks(page)).toEqual(["kept"]);
    await page.reload();
    await expect(page.locator(".book")).toHaveCount(1);
  });
}

test("Skipping a photo of several opens the next one and adds only the photos used", async ({ page }) => {
  await fresh(page);
  await page.setInputFiles("#file", [fixture("foto-bord.jpg"), fixture("side-eng-uden-tekst.jpg"), fixture("side-illustration.jpg")]);
  await expect(page.locator("#cropMsg")).toContainText("Billede 1 af 3");
  await expect(page.locator("#cropCancel")).toHaveText("Spring billedet over");
  await page.click("#cropCancel");
  await expect(page.locator("#cropMsg")).toContainText("Billede 2 af 3");
  await page.click("#cropWhole");
  await expect(page.locator("#cropMsg")).toContainText("Billede 3 af 3");
  await page.keyboard.press("Escape");
  await expect(page.locator("#crop")).toBeHidden();
  await expect(page.locator("#thumbs .thumb")).toHaveCount(1);
  await expect.poll(async () => (await storedPages(page)).length).toBe(1);
});

test("Skipping every photo of a new book returns to the shelf", async ({ page }) => {
  await fresh(page);
  await page.setInputFiles("#file", [fixture("foto-bord.jpg"), fixture("side-illustration.jpg")]);
  await expect(page.locator("#cropMsg")).toContainText("Billede 1 af 2");
  await page.click("#cropCancel");
  await expect(page.locator("#cropMsg")).toContainText("Billede 2 af 2");
  await page.click("#cropCancel");
  await expect(page.locator("#start")).toBeVisible();
  expect(await storedBooks(page)).toEqual([]);
});

test("Cancelling a new crop or new photos keeps the book as it was, in the workshop", async ({ page }) => {
  await fresh(page);
  await openRecognisedBook(page, ["side-da.jpg"]);
  await openWorkshop(page);
  const before = await storedPages(page);
  await pageAction(page, "recropBtn");
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropCancel")).toHaveText("Annuller");
  await page.click("#cropCancel");
  await expect(page.locator("#crop")).toBeHidden();
  await page.setInputFiles("#thumbs .add input", fixture("foto-bord.jpg"));
  await expect(page.locator("#crop")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#crop")).toBeHidden();
  await expect(page.locator("body")).toHaveClass(/\bworkshop\b/);
  await expect(page.locator("#thumbs .thumb")).toHaveCount(1);
  await expect(page.locator("#reader .w").first()).toBeVisible();
  expect(await storedPages(page)).toEqual(before);
});

test("Cancel and skip are labelled in every interface language", async ({ page }) => {
  await fresh(page);
  for (const [lang, cancel, skip] of [["da", "Annuller", "Spring billedet over"], ["de", "Abbrechen", "Bild überspringen"], ["en", "Cancel", "Skip this photo"]]) {
    await setUiLanguage(page, lang);
    await page.setInputFiles("#file", fixture("foto-bord.jpg"));
    await expect(page.locator("#cropCancel")).toHaveText(cancel);
    await page.keyboard.press("Escape");
    await expect(page.locator("#start")).toBeVisible();
    await page.setInputFiles("#file", [fixture("foto-bord.jpg"), fixture("side-illustration.jpg")]);
    await expect(page.locator("#cropCancel")).toHaveText(skip);
    await page.keyboard.press("Escape");
    await expect(page.locator("#cropMsg")).toContainText(/2\D+2/);   // The next photo opens.
    await page.keyboard.press("Escape");
    await expect(page.locator("#start")).toBeVisible();
  }
});
