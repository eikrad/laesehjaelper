import { expect, test } from "./fixtures";
import { fresh, seedBooks } from "./helpers";

test.beforeEach(async ({ page }) => { await fresh(page); });

test("Reading has one quiet workshop entry and Back stays inside the book and shelf", async ({ page }) => {
  await seedBooks(page, [{ id: "route", title: "En rolig bog", texts: ["Første side.", "Anden side."], lastPage: 1 }]);
  await page.locator(".book").click();
  await expect(page).toHaveURL(/#read\/route\/route-1$/);
  await expect(page.locator("#readingTitle")).toHaveText("En rolig bog");
  for (const id of ["bookTitle", "bookMenuBtn", "checkTextBtn", "editPagesBtn", "exportBtn", "edit", "thumbs", "delBookBtn", "compareBtn"]) {
    await expect(page.locator(`#${id}`)).toBeHidden();
  }
  await expect(page.locator("#editBookBtn")).toHaveText("Rediger bog");
  await page.click("#editBookBtn");
  await expect(page).toHaveURL(/#edit\/route\/route-1$/);
  await expect(page.locator("#bookTitle")).toBeVisible();
  await page.reload();
  await expect(page.locator("#bookTitle")).toHaveValue("En rolig bog");
  await expect(page.locator("#reader")).toContainText("Anden side.");
  await page.goBack();
  await expect(page).toHaveURL(/#read\/route\/route-1$/);
  await expect(page.locator("#editBookBtn")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#start")).toBeVisible();
});

test("A workshop page link restores the selected page and its internal Back path", async ({ page }) => {
  await seedBooks(page, [{ id: "linked", title: "En bog med links", texts: ["Første side.", "En bestemt side."] }]);
  await page.goto("/#edit/linked/linked-1");
  await expect(page.locator("#reader")).toContainText("En bestemt side.");
  await page.click("#prev");
  await expect(page).toHaveURL(/#edit\/linked\/linked-0$/);
  await page.click("#readBookBtn");
  await expect(page.locator("#reader")).toContainText("Første side.");
  await expect(page).toHaveURL(/#read\/linked\/linked-0$/);
  await page.goBack();
  await expect(page.locator("#start")).toBeVisible();
});

test("Missing books return to the shelf and the sample survives reload", async ({ page }) => {
  await page.goto("/#read/missing/page");
  await expect(page.locator("#start")).toBeVisible();
  await page.click("#demoBtn");
  await page.reload();
  await expect(page.locator("#reader")).toContainText("pindsvin");
  await page.goBack();
  await expect(page.locator("#start")).toBeVisible();
});
