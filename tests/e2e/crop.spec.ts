import { expect, test } from "./fixtures";
import { bookTool, fixture, fresh, storedPages, waitForText } from "./helpers";

test.use({ serviceWorkers: "block" });

for (const [name, index] of [["corner", 0], ["edge midpoint", 6]] as const) {
  test(`Loading page detection preserves a manually adjusted ${name}`, async ({ page }) => {
    await fresh(page);
    let release!: () => void;
    const ready = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/opencv.js", async route => { await ready; await route.continue(); });
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
  let release!: () => void;
  const ready = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/opencv.js", async route => { await ready; await route.continue(); });
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
  await bookTool(page, "checkTextBtn");
  await page.click("#recropBtn");
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
  await expect(page.locator("#cropPoly")).toHaveAttribute("d", corrected!);
  await page.click("#cropOk");
  await waitForText(page);
  await expect(page.locator("#reader")).toContainText("Pindsvinet");
});
