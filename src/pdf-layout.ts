// Read the browser's laid-out text before writing the PDF. Character positions preserve letter
// spacing, word spacing and line breaks; PDF fonts keep the result sharp and selectable.
import type { EpubPage } from "./epub";
import type { PdfBox, PdfColor, PdfPage } from "./pdf";

function color(css: string): PdfColor {
  const c = css.match(/[\d.]+/g)?.map(Number) || [0, 0, 0];
  return [c[0] / 255, c[1] / 255, c[2] / 255, c[3] ?? 1];
}
const length = (css: string, reference: number) => (parseFloat(css) || 0) * (css.endsWith("%") ? reference / 100 : 1);

/** The root contains the export's text boxes at the page's fixed CSS size. */
export function measurePdfPage(root: HTMLElement, source: EpubPage): PdfPage {
  const origin = root.getBoundingClientRect(), ctx = document.createElement("canvas").getContext("2d")!;
  const boxes: PdfBox[] = [];
  for (const el of root.querySelectorAll<HTMLElement>(".tbox, .flow")) {
    const r = el.getBoundingClientRect(), style = getComputedStyle(el);
    const shadow = style.textShadow.match(/rgba?\([^)]+\)/)?.[0];
    const box: PdfBox = { x: r.left - origin.left, y: r.top - origin.top, width: r.width, height: r.height,
      background: color(style.backgroundColor), ...(shadow ? { halo: color(shadow) } : {}), text: [], arcs: [] };
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node as Text, cs = getComputedStyle(text.parentElement!);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const metrics = ctx.measureText("Ágj"), ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent;
      for (const part of segmenter.segment(text.data)) {
        const range = document.createRange(); range.setStart(text, part.index); range.setEnd(text, part.index + part.segment.length);
        const rect = range.getBoundingClientRect();
        if (!rect.width || !part.segment.trim()) continue;
        box.text.push({ text: part.segment, x: rect.left - origin.left, y: rect.top - origin.top + ascent,
          size: parseFloat(cs.fontSize), bold: Number(cs.fontWeight) >= 600, color: color(cs.color) });
      }
    }
    for (const syllable of el.querySelectorAll<HTMLElement>(".s")) {
      const after = getComputedStyle(syllable, "::after");
      if (after.content === "none" || after.content === "normal") continue;
      const sr = syllable.getBoundingClientRect(), left = length(after.left, sr.width), right = length(after.right, sr.width), height = length(after.height, 0);
      box.arcs.push({ x: sr.left - origin.left + left, y: sr.bottom - origin.top - length(after.bottom, 0) - height,
        width: sr.width - left - right, height, thickness: parseFloat(after.borderBottomWidth), color: color(after.borderBottomColor) });
    }
    boxes.push(box);
  }
  return { ...source, background: color(getComputedStyle(root).backgroundColor), boxes };
}
