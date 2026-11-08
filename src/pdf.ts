// Printable books, built on the device from the same layout as the EPUB.
import { clip, decodePDFRawStream, endPath, PDFDocument, PDFName, PDFRawStream, popGraphicsState, pushGraphicsState, rectangle, rgb, setLineWidth, setStrokingRgbColor, setTextRenderingMode, TextRenderingMode } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import decompress from "woff2-encoder/decompress";

export type PdfColor = [number, number, number, number];
export interface PdfText { text: string; x: number; y: number; size: number; bold: boolean; color: PdfColor }
export interface PdfArc { x: number; y: number; width: number; height: number; thickness: number; color: PdfColor }
export interface PdfBox {
  x: number; y: number; width: number; height: number;
  background: PdfColor; halo?: PdfColor; text: PdfText[]; arcs: PdfArc[];
}
export interface PdfPage { width: number; height: number; image: Uint8Array | null; background: PdfColor; boxes: PdfBox[] }
export interface PdfFont { weight: number; data: Uint8Array }

export async function buildPdf(title: string, pages: PdfPage[], fonts: PdfFont[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(title); pdf.setCreator("Læsehjælper");
  pdf.registerFontkit({ create: (bytes: Uint8Array) => {
    const font = fontkit.create(bytes);
    // OpenDyslexic also carries colour tables. Fontkit's COLR wrapper hides the base outlines
    // when subsetting; PDF text uses our syllable colours, so subset the monochrome outlines.
    const directory = (font as typeof font & { directory: { tables: Record<string, unknown> } }).directory;
    delete directory.tables.COLR;
    return font;
  } });
  const embedded = await Promise.all(fonts.map(async f => ({
    weight: f.weight,
    // Fontkit cannot subset transformed WOFF2 glyf tables. Restore SFNT before subsetting.
    font: await pdf.embedFont(await decompress(f.data), { subset: true }),
  })));
  const regular = embedded.find(f => f.weight === 400)?.font ?? embedded[0]?.font;
  const bold = embedded.find(f => f.weight >= 600)?.font ?? regular;
  if (!regular) throw new Error("No reading font available for PDF");
  const color = (c: PdfColor) => rgb(c[0], c[1], c[2]);
  for (const source of pages) {
    // A page keeps the photo's proportions at A4 width. Print dialogs can fit it to their paper.
    const k = 595.28 / source.width, H = source.height;
    const page = pdf.addPage([source.width * k, H * k]);
    page.drawRectangle({ width: source.width * k, height: H * k, color: color(source.background) });
    if (source.image) page.drawImage(await pdf.embedJpg(source.image), { x: 0, y: 0, width: source.width * k, height: H * k });
    for (const box of source.boxes) {
      page.pushOperators(pushGraphicsState(), rectangle(box.x * k, (H - box.y - box.height) * k, box.width * k, box.height * k), clip(), endPath());
      if (box.background[3]) page.drawRectangle({ x: box.x * k, y: (H - box.y - box.height) * k, width: box.width * k, height: box.height * k, color: color(box.background), opacity: box.background[3] });
      for (const text of box.text) {
        if (box.halo) page.pushOperators(setTextRenderingMode(TextRenderingMode.FillAndOutline), setStrokingRgbColor(box.halo[0], box.halo[1], box.halo[2]), setLineWidth(text.size * k * 0.05));
        page.drawText(text.text, { x: text.x * k, y: (H - text.y) * k, size: text.size * k, font: text.bold ? bold : regular, color: color(text.color) });
      }
      page.pushOperators(setTextRenderingMode(TextRenderingMode.Fill));
      for (const arc of box.arcs) page.drawSvgPath(`M0,0 C0,${arc.height * 1.33} ${arc.width},${arc.height * 1.33} ${arc.width},0`, {
        x: arc.x * k, y: (H - arc.y) * k, scale: k, borderColor: color(arc.color), borderWidth: arc.thickness,
      });
      page.pushOperators(popGraphicsState());
    }
  }
  await pdf.flush();
  // Fontkit 1.1.1 writes the source CFF table length into the subset header's offSize (e.g. 20
  // for OpenDyslexic). PDF readers reject it: OffSize must be 1–4 (Adobe CFF spec, tables 2/8).
  // Repair only that invalid header byte; INDEX structures carry their own offset sizes.
  // https://adobe-type-tools.github.io/font-tech-notes/pdfs/5176.CFF.pdf
  for (const [ref, object] of pdf.context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFRawStream) || object.dict.get(PDFName.of("Subtype"))?.toString() !== "/CIDFontType0C") continue;
    const data = decodePDFRawStream(object).decode();
    if (data[0] === 1 && (data[3] < 1 || data[3] > 4)) {
      data[3] = 4;
      pdf.context.assign(ref, pdf.context.flateStream(data, { Subtype: "CIDFontType0C" }));
    }
  }
  return pdf.save();
}
