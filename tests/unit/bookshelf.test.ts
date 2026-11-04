import { describe, expect, it } from "vitest";
import { resumePage } from "../../src/bookshelf";

describe("resumePage", () => {
  it("Starts an unread book on its first page", () => {
    expect(resumePage(undefined, 3)).toBe(0);
  });
  it("Continues on the last remaining page if later pages were deleted", () => {
    expect(resumePage(8, 3)).toBe(2);
  });
  it("Never opens before the first page", () => {
    expect(resumePage(-1, 3)).toBe(0);
  });
  it("Keeps an empty book on page zero", () => {
    expect(resumePage(2, 0)).toBe(0);
  });
});
