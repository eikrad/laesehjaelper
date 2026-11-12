import { describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { buildEpub, readEpub } from "../../src/epub";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9]);
function sample() {
  return buildEpub({
    id: "abc123", title: "Søren & Mette", lang: "da", css: ".s0{color:blue}", fonts: [],
    pageLabel: "Side",
    pages: [
      { width: 1000, height: 1400, image: jpeg, bodyHtml: '<div class="tbox">Det er <span class="w">sjovt</span></div>' },
      { width: 1000, height: 1414, image: null, bodyHtml: '<div class="flow"><p>Kun tekst</p></div>' },
    ],
    data: {
      title: "Søren & Mette",
      pages: [
        { lang: "da", text: "Det er sjovt", paras: [], workW: 800, workH: 1120, corners: null, question: "Hvad er sjovt?", input: jpeg, clean: jpeg },
        { lang: "da", text: "Kun tekst", input: null, clean: null },
      ],
    },
  });
}

describe("EPUB", () => {
  it("round-trips normalized OCR exclusions without changing source text", () => {
    const text = "An original test page.", ocrRegions = [{ x0: 0, y0: 0.85, x1: 1, y1: 1 }];
    const bytes = buildEpub({ id: "regions", title: "Areas", lang: "en", css: "", fonts: [], pages: [], pageLabel: "Page", data: { title: "Areas", pages: [{ lang: "en", text, ocrRegions }] } });
    expect(readEpub(bytes)!.pages[0].ocrRegions).toEqual(ocrRegions);
    expect(readEpub(bytes)!.pages[0].text).toBe(text);
  });
  it("round-trips adult phrase annotations without inserting marks into stored text", () => {
    const text = "En lille mus bor her.";
    const phraseCues = { source: text, after: [2] };
    const bytes = buildEpub({ id: "phrases", title: "Prøvebog", lang: "da", css: "", fonts: [], pages: [], pageLabel: "Side", data: { title: "Prøvebog", pages: [{ lang: "da", text, phraseCues }] } });
    expect(readEpub(bytes)!.pages[0].phraseCues).toEqual(phraseCues);
    expect(readEpub(bytes)!.pages[0].text).toBe(text);
  });
  it("Has a valid basic structure", () => {
    const bytes = sample();
    // The first file must be an uncompressed mimetype entry.
    expect(strFromU8(bytes.slice(30, 38))).toBe("mimetype");
    expect(bytes[8]).toBe(0); // The compression method is stored.
    const files = unzipSync(bytes);
    expect(strFromU8(files["mimetype"])).toBe("application/epub+zip");
    expect(files["META-INF/container.xml"]).toBeDefined();
    const opf = strFromU8(files["OEBPS/content.opf"]);
    expect(opf).toContain("<dc:title>Søren &amp; Mette</dc:title>");
    expect(opf).toContain('rendition:layout">pre-paginated');
    expect(opf).toContain('<itemref idref="p1"/>');
    expect(opf).toContain('<itemref idref="p2"/>');
    expect(strFromU8(files["OEBPS/page1.xhtml"])).toContain('<meta name="viewport" content="width=1000, height=1400"/>');
    expect(files["OEBPS/images/page1.jpg"]).toBeDefined();
    expect(files["OEBPS/images/page2.jpg"]).toBeUndefined();
  });

  it("Stores the page image only once", () => {
    const files = unzipSync(sample());
    expect(files["OEBPS/laesehjaelper/clean1.jpg"]).toBeUndefined();
    expect(files["OEBPS/laesehjaelper/input1.jpg"]).toBeDefined();
  });

  it("Reads back its own data without loss", () => {
    const d = readEpub(sample());
    expect(d?.title).toBe("Søren & Mette");
    expect(d?.pages.map((p) => p.text)).toEqual(["Det er sjovt", "Kun tekst"]);
    expect(d?.pages[0].workW).toBe(800);
    expect(Array.from(d!.pages[0].clean!)).toEqual(Array.from(jpeg));
    expect(Array.from(d!.pages[0].input!)).toEqual(Array.from(jpeg));
    expect(d?.pages[1].input).toBeNull();
  });

  it("Recognizes unrelated EPUB files", async () => {
    const { zipSync, strToU8 } = await import("fflate");
    const foreign = zipSync({ mimetype: strToU8("application/epub+zip"), "OEBPS/content.opf": strToU8("<package/>") });
    expect(readEpub(foreign)).toBeNull();
  });
  it("Preserves the custom reading-together question", () => {
    const d = readEpub(sample())!;
    expect(d.pages[0].question).toBe("Hvad er sjovt?");
    expect(d.pages[1].question).toBe("");
  });
});
