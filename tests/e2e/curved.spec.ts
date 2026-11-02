import { expect, test } from "./fixtures";
import { fixture, fresh } from "./helpers";

test("Curved page: drag an edge point and flatten the page", async ({ page }) => {
  await fresh(page);
  await page.setInputFiles("#file", fixture("side-curved.jpg"));
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
