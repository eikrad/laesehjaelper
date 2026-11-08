import { expect, test } from "./fixtures";
import { bookTool, fixture, fresh, storedPages, waitForText } from "./helpers";

test("Curved page: drag an edge point and flatten the page", async ({ page }) => {
  await fresh(page);
  await page.setInputFiles("#file", fixture("side-curved.jpg"));
  // The message is empty until the dialog opens; its buttons respond once the search has finished.
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
  const handles = page.locator("#cropStage .h");
  await expect(handles).toHaveCount(8);   // 4 corners + 4 edge midpoints
  const box = (await page.locator("#cropCanvas").boundingBox())!;
  const s = box.width / 1200;
  const drag = async (i: number, x: number, y: number) => {
    const hb = (await handles.nth(i).boundingBox())!;
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + x * s, box.y + y * s, { steps: 4 });
    await page.mouse.up();
  };
  await drag(0, 150, 150); await drag(1, 1050, 150); await drag(2, 1050, 1400); await drag(3, 150, 1400);
  await drag(6, 600, 1490);   // Move the lower edge midpoint onto the curve.
  await expect(page.locator("#cropPoly")).toHaveAttribute("d", /Q/);
  await page.click("#cropOk");
  await expect(page.locator("#reader .w").first()).toBeVisible({ timeout: 200_000 });
  const text = await page.locator("#text").inputValue();
  expect(text).toContain("stor bjørn");
});

test("A curved page is suggested and straightened without dragging, and its frame survives reload", async ({ page }) => {
  await fresh(page);
  await page.setInputFiles("#file", fixture("foto-curved-auto.jpg"));
  await expect(page.locator("#cropMsg")).toContainText("Siden er fundet", { timeout: 120_000 });
  const geometry = await page.locator("#cropStage").evaluate(stage => {
    const handles = [...stage.querySelectorAll<HTMLElement>(".h")];
    const y = (i: number) => parseFloat(handles[i].style.top);
    const scale = (stage.querySelector("canvas") as HTMLCanvasElement).getBoundingClientRect().width / 1200;
    return { sag: (y(6) - (y(2) + y(3)) / 2) / scale };
  });
  expect(geometry.sag).toBeGreaterThan(40);
  const suggested = await page.locator("#cropPoly").getAttribute("d");
  await page.click("#cropOk");
  await waitForText(page);
  await expect(page.locator("#reader")).toContainText("Søren");
  await expect(page.locator("#reader")).toContainText("lille fugl");
  await expect.poll(async () => (await storedPages(page))[0]?.status).toBe("done");
  await page.reload();
  await bookTool(page, "checkTextBtn");
  await page.click("#recropBtn");
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropPoly")).toHaveAttribute("d", suggested!);
  // The automatic proposal is still editable, including its curved edges.
  const handle = (await page.locator("#cropStage .h").nth(6).boundingBox())!;
  const x = handle.x + handle.width / 2, y = handle.y + handle.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x, y - 12, { steps: 4 }); await page.mouse.up();
  const adjusted = await page.locator("#cropPoly").getAttribute("d");
  expect(adjusted).not.toBe(suggested);
  await page.click("#cropOk");
  await waitForText(page);
  await expect.poll(async () => (await storedPages(page))[0]?.status).toBe("done");
  await page.reload();
  await bookTool(page, "checkTextBtn");
  await page.click("#recropBtn");
  await expect(page.locator("#cropPoly")).toHaveAttribute("d", adjusted!);
  await page.click("#cropWhole");
});
