import { describe, expect, it } from "vitest";
import { pageActions } from "../../src/page-actions";

const context = { index: 1, count: 3, editable: true, pageView: true };
const photoPage = { id: "second", status: "done", photo: {}, canvas: {}, paras: [{ place: {} }] };

describe("Selected-page actions", () => {
  it("Offers every page tool for a recognised photo with a placed text box in the middle of a saved book", () => {
    expect(pageActions(photoPage, context)).toEqual({
      crop: true, recognise: true, regions: true, move: true, reset: true, phrases: true,
      photos: true, earlier: true, later: true, delete: true, check: true,
    });
  });
  it("Keeps checking, phrase marking and insertion on a text-only page, without photo tools or deleting the only page", () => {
    expect(pageActions({ id: "only", status: "done" }, { index: 0, count: 1, editable: true, pageView: false })).toEqual({
      crop: false, recognise: false, regions: false, move: false, reset: false, phrases: true,
      photos: true, earlier: false, later: false, delete: false, check: true,
    });
  });
  it.each(["wait", "ocr"])("Keeps photo replacement and crop available during %s, but does not start conflicting text work", status => {
    expect(pageActions({ ...photoPage, status }, context)).toMatchObject({
      crop: true, photos: true, recognise: false, regions: false, move: false, reset: false, phrases: false, check: false,
    });
  });
  it("Does not offer photo insertion or replacement for the sample or a page without a saved identity", () => {
    expect(pageActions(photoPage, { ...context, editable: false }).photos).toBe(false);
    expect(pageActions({ status: "done" }, context).photos).toBe(false);
    expect(Object.values(pageActions(undefined, context))).not.toContain(true);
  });
  it("Offers retry on an errored page, keeps list ends bounded, and requires a placed box for Reset", () => {
    const saved = { id: "last", status: "error", photoBlob: {}, inputBlob: {} };
    expect(pageActions(saved, { ...context, index: 2 })).toMatchObject({
      crop: true, recognise: true, regions: true, reset: false, move: false, check: false, phrases: false, earlier: true, later: false,
    });
    expect(pageActions({ ...photoPage, paras: [{}] }, context).reset).toBe(false);
    expect(pageActions(photoPage, { ...context, index: 0 }).earlier).toBe(false);
  });
});
