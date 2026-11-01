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
        { lang: "da", text: "Det er sjovt", paras: [], workW: 800, workH: 1120, corners: null, input: jpeg, clean: jpeg },
        { lang: "da", text: "Kun tekst", input: null, clean: null },
      ],
    },
  });
}

describe("EPUB", () => {
  it("hat eine gültige Grundstruktur", () => {
    const bytes = sample();
    // „mimetype“ muss die erste Datei sein, unkomprimiert
    expect(strFromU8(bytes.slice(30, 38))).toBe("mimetype");
    expect(bytes[8]).toBe(0); // Kompressionsmethode „stored“
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

  it("legt das Seitenbild nicht doppelt ab", () => {
    const files = unzipSync(sample());
    expect(files["OEBPS/laesehjaelper/clean1.jpg"]).toBeUndefined();
    expect(files["OEBPS/laesehjaelper/input1.jpg"]).toBeDefined();
  });

  it("liest die eigenen Daten verlustfrei zurück", () => {
    const d = readEpub(sample());
    expect(d?.title).toBe("Søren & Mette");
    expect(d?.pages.map((p) => p.text)).toEqual(["Det er sjovt", "Kun tekst"]);
    expect(d?.pages[0].workW).toBe(800);
    expect(Array.from(d!.pages[0].clean!)).toEqual(Array.from(jpeg));
    expect(Array.from(d!.pages[0].input!)).toEqual(Array.from(jpeg));
    expect(d?.pages[1].input).toBeNull();
  });

  it("erkennt fremde EPUBs", async () => {
    const { zipSync, strToU8 } = await import("fflate");
    const foreign = zipSync({ mimetype: strToU8("application/epub+zip"), "OEBPS/content.opf": strToU8("<package/>") });
    expect(readEpub(foreign)).toBeNull();
  });
});
