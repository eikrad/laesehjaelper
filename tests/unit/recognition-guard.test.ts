import { describe, expect, it } from "vitest";
import { recognitionGuard } from "../../src/recognition-guard";

function pageState() {
  return {
    lang: "da", status: "ocr", text: "Original text.", rawText: "Original text.", changeVersion: 0,
    paras: [{ raw: "Original text.", place: { x: 10 } }], corners: [[0, 0]],
    ocrRegions: [{ x: 20 }], phraseCues: { boundaries: [4] },
  };
}
type State = ReturnType<typeof pageState>;

describe("Recognition validity", () => {
  it("Accepts a result while its page content and source are unchanged", () => {
    const page = { lang: "da", status: "ocr", text: "Original text.", canvas: {} };
    const current = recognitionGuard(page, () => true);
    expect(current()).toBe(true);
  });

  it("Rejects a result after newer text replaces the text the job started with", () => {
    const page = { lang: "da", status: "ocr", text: "Original text." };
    const current = recognitionGuard(page, () => true);
    page.text = "A newer correction.";
    expect(current()).toBe(false);
  });

  it.each<[string, (page: State) => void]>([
    ["language", page => { page.lang = "en"; }],
    ["status", page => { page.status = "wait"; }],
    ["edit version", page => { page.changeVersion++; }],
    ["raw text", page => { page.rawText = "New raw text."; }],
    ["paragraph placement", page => { page.paras[0].place.x = 30; }],
    ["crop", page => { page.corners[0][0] = 30; }],
    ["excluded regions", page => { page.ocrRegions.push({ x: 40 }); }],
    ["phrase cues", page => { page.phraseCues.boundaries.push(8); }],
  ])("Rejects a result after changing the page's %s", (_name, change) => {
    const page = pageState();
    const current = recognitionGuard(page, () => true);
    change(page);
    expect(current()).toBe(false);
  });

  it.each(["canvas", "inputBlob", "photo", "photoBlob"])("Rejects a result after its %s source is replaced", source => {
    const page = { lang: "da", status: "ocr", text: "Original text.", [source]: {} };
    const current = recognitionGuard(page, () => true);
    page[source] = {};
    expect(current()).toBe(false);
  });

  it("Preserves each job's ownership rule when leaving a book or deleting a page", () => {
    const page = pageState();
    let open = true, removed = false;
    const acceptedPage = recognitionGuard(page, () => !removed);
    const wholeBook = recognitionGuard(page, () => open && !removed);
    open = false;
    expect(acceptedPage()).toBe(true);
    expect(wholeBook()).toBe(false);
    removed = true;
    expect(acceptedPage()).toBe(false);
  });

  it("Allows progress and storage caches to update without invalidating unchanged page content", () => {
    const page = { ...pageState(), canvas: {}, photo: {}, inputBlob: {}, photoBlob: {},
      progress: 0, stage: "loadingCore", revision: "before-save", question: "An original question?" };
    const current = recognitionGuard(page, () => true);
    page.progress = 0.8; page.stage = "recognizing2";
    page.inputBlob = {}; page.photoBlob = {}; page.revision = "after-save";
    page.question = "A different original question?";
    expect(current()).toBe(true);
  });
});
