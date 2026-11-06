export type BookLocation = { view: "shelf" } | { view: "read" | "workshop"; bookId: string; pageId?: string };

export function parseLocation(hash: string): BookLocation {
  const parts = hash.slice(1).split("/");
  const [view, bookId, pageId] = parts;
  if ((view === "read" || view === "edit") && bookId && (parts.length === 2 || (parts.length === 3 && pageId))) {
    try {
      return { view: view === "read" ? "read" : "workshop", bookId: decodeURIComponent(bookId), ...(pageId ? { pageId: decodeURIComponent(pageId) } : {}) };
    } catch { /* Invalid URL encoding: return to the bookshelf. */ }
  }
  return { view: "shelf" };
}

export function locationHash(target: BookLocation): string {
  if (target.view === "shelf") return "#shelf";
  return `#${target.view === "read" ? "read" : "edit"}/${encodeURIComponent(target.bookId)}${target.pageId ? `/${encodeURIComponent(target.pageId)}` : ""}`;
}
