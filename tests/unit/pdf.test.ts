import { expect, it } from "vitest";
import { decodePDFRawStream, PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import fs from "node:fs";
import { buildPdf, type PdfPage } from "../../src/pdf";

const fonts = [400, 700].map(weight => ({ weight, data: new Uint8Array(fs.readFileSync(`node_modules/@fontsource/opendyslexic/files/opendyslexic-latin-${weight}-normal.woff2`)) }));

it("Embeds transformed TrueType webfonts, including composite Danish letters", async () => {
  const fonts = [400, 700].map(weight => ({ weight, data: new Uint8Array(fs.readFileSync(`tests/fixtures/fonts/andika-${weight}.woff2`)) }));
  const bytes = await buildPdf("Andika", [{ width: 1000, height: 1400, image: null, background: [1, 1, 1, 1], boxes: [{
    x: 0, y: 0, width: 1000, height: 1400, background: [1, 1, 1, 0], arcs: [],
    text: [{ text: "Søren går ud. Élise ser æbler.", x: 70, y: 100, size: 40, bold: false, color: [0, 0, 0, 1] }],
  }] }], fonts);
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBe(1);
  expect(pdf.context.enumerateIndirectObjects().some(([, object]) => object.toString().includes("/CIDFontType2"))).toBe(true);
});

it("Creates printable pages in book order with the book title and embedded reading fonts", async () => {
  const pages: PdfPage[] = [1400, 1000].map(height => ({ width: 1000, height, image: null, background: [1, 1, 1, 1], boxes: [{
    x: 20, y: 20, width: 900, height: 900, background: [1, 1, 1, 0], text: [
      { text: "Søren", x: 30, y: 80, size: 40, bold: false, color: [0.1, 0.2, 0.8, 1] },
      { text: "üben", x: 180, y: 80, size: 40, bold: true, color: [0.9, 0.2, 0.1, 1] },
    ], arcs: [],
  }] }));
  const bytes = await buildPdf("Søren & Mette", pages, fonts);
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getTitle()).toBe("Søren & Mette");
  expect(pdf.getPageCount()).toBe(2);
  expect(pdf.getPages()[0].getWidth()).toBeCloseTo(595.28, 1);
  expect(pdf.getPages()[0].getHeight()).toBeCloseTo(833.392, 1);
  expect(pdf.getPages()[1].getHeight()).toBeCloseTo(595.28, 1);
  // Embedded custom fonts have a Unicode character map; standard PDF fonts do not embed it.
  const unicodeFonts = pdf.context.enumerateIndirectObjects().filter(([, object]) =>
    object.toString().includes("/ToUnicode") && object.toString().includes("/Type0"));
  expect(unicodeFonts).toHaveLength(2);
  const resources = pdf.getPages()[0].node.Resources();
  expect(resources?.get(PDFName.of("Font"))).toBeDefined();
  for (const [, object] of pdf.context.enumerateIndirectObjects()) {
    if (object instanceof PDFRawStream && object.dict.get(PDFName.of("Subtype"))?.toString() === "/CIDFontType0C") {
      const bytes = decodePDFRawStream(object).decode();
      expect(bytes[0]).toBe(1);
      expect(bytes[3], "CFF offset size must be 1–4 for PDF readers to load the font").toBeGreaterThanOrEqual(1);
      expect(bytes[3], "CFF offset size must be 1–4 for PDF readers to load the font").toBeLessThanOrEqual(4);
    }
  }
});
