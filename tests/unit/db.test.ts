import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { DB } from "../../src/db";

describe("DB", () => {
  it("Stores, reads and deletes books and pages", async () => {
    await DB.put("books", { id: "b1", title: "Bog" });
    await DB.put("pages", { id: "p1", bookId: "b1", text: "a" });
    await DB.put("pages", { id: "p2", bookId: "b1", text: "b" });
    await DB.put("pages", { id: "p3", bookId: "b2", text: "c" });
    expect((await DB.all<{ id: string }>("books")).map((b) => b.id)).toEqual(["b1"]);
    expect((await DB.pagesOf<{ id: string }>("b1")).map((p) => p.id).sort()).toEqual(["p1", "p2"]);
    await DB.del("pages", "p1");
    expect((await DB.pagesOf<{ id: string }>("b1")).map((p) => p.id)).toEqual(["p2"]);
  });
});

it("Saves an imported book completely or not at all", async () => {
  const book = { id: "atomic-import", title: "Testimport" };
  await expect(DB.putBook(book, [
    { id: "import-first", bookId: book.id, text: "Første side" },
    { id: {}, bookId: book.id, text: "Ungültiger IndexedDB-Schlüssel" },
  ])).rejects.toMatchObject({ name: "DataError" });
  expect(await DB.pagesOf(book.id)).toEqual([]);
  expect((await DB.all<{ id: string }>("books")).some(b => b.id === book.id)).toBe(false);

  await DB.putBook(book, [{ id: "import-first", bookId: book.id, text: "Første side" }]);
  expect(await DB.pagesOf(book.id)).toEqual([{ id: "import-first", bookId: book.id, text: "Første side" }]);
  expect((await DB.all<{ id: string }>("books")).some(b => b.id === book.id)).toBe(true);
});

it("Replaces recognition results only if the stored page still has the expected revision", async () => {
  await DB.put("pages", { id: "revision-page", bookId: "revision-book", text: "Earlier result" });
  expect(await DB.replacePage({ id: "revision-page", text: "New result", revision: "new" }, undefined)).toBe(true);
  await DB.put("pages", { id: "revision-page", text: "Newer manual edit", revision: "edited" });
  expect(await DB.replacePage({ id: "revision-page", text: "Stale result", revision: "stale" }, "new")).toBe(false);
  expect((await DB.all<{ id: string; text: string }>("pages")).find(p => p.id === "revision-page")?.text).toBe("Newer manual edit");
  await DB.del("pages", "revision-page");
  expect(await DB.replacePage({ id: "revision-page", text: "Do not restore", revision: "restored" }, "edited")).toBe(false);
  expect((await DB.all<{ id: string }>("pages")).some(p => p.id === "revision-page")).toBe(false);
});
