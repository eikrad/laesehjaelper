// EPUB 3 schreiben und Læsehjælper-Bücher daraus wieder einlesen.
//
// Das EPUB hat feste Seiten (fixed layout): jede Buchseite ist ein Bild mit übermalter Originalschrift,
// darüber liegt der neue Text als echter, farbig gesetzter Text. So lässt es sich in jeder Lese-App
// öffnen (Apple Books, Google Play Books, Thorium …).
// Zusätzlich enthält es unter OEBPS/laesehjaelper/ unsere eigenen Daten (Text, Positionen, Bilder),
// damit Læsehjælper das Buch verlustfrei wieder importieren kann.

import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import type { Zippable } from "fflate";
import type { Corners, Frame, Para } from "./types";

/** Eine fertig gesetzte Seite für das EPUB. */
export interface EpubPage {
  /** Seitengröße in CSS-Pixeln (Viewport der festen Seite) */
  width: number;
  height: number;
  /** Hintergrundbild (JPEG), oder null für reine Textseiten */
  image: Uint8Array | null;
  /** XHTML-Inhalt über dem Bild (Textfelder oder Fließtext) */
  bodyHtml: string;
}

/** Unsere eigenen Daten je Seite, für den verlustfreien Re-Import. */
export interface DataPage {
  lang: string;
  text: string;
  rawText?: string;
  paras?: Para[] | null;
  workW?: number;
  workH?: number;
  corners?: Frame | Corners | null;
  input?: Uint8Array | null;
  clean?: Uint8Array | null;
}
export interface DataBook { title: string; pages: DataPage[] }

export interface EpubFont { family: string; weight: number; file: string; data: Uint8Array; type: string }

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildEpub(opts: {
  id: string; title: string; lang: string; css: string; fonts: EpubFont[];
  pages: EpubPage[]; data: DataBook; pageLabel: string;
}): Uint8Array {
  const { id, title, lang, css, fonts, pages, data } = opts;
  const files: Zippable = {};
  // „mimetype“ muss die erste Datei sein und darf nicht komprimiert werden
  files["mimetype"] = [strToU8("application/epub+zip"), { level: 0 }];
  files["META-INF/container.xml"] = strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`);

  const manifest: string[] = [];
  const spine: string[] = [];
  const add = (path: string, content: Uint8Array, mediaType: string, idAttr: string, props = "") => {
    files[`OEBPS/${path}`] = content;
    manifest.push(`<item id="${idAttr}" href="${path}" media-type="${mediaType}"${props ? ` properties="${props}"` : ""}/>`);
  };

  const fontCss = fonts.map((f) => `@font-face { font-family: "${f.family}"; font-weight: ${f.weight}; src: url("fonts/${f.file}"); }`).join("\n");
  add("style.css", strToU8(fontCss + "\n" + css), "text/css", "css");
  fonts.forEach((f, i) => add(`fonts/${f.file}`, f.data, f.type, `font${i}`));

  pages.forEach((p, i) => {
    const n = i + 1;
    if (p.image) add(`images/page${n}.jpg`, p.image, "image/jpeg", `img${n}`);
    const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${lang}" xml:lang="${lang}">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=${p.width}, height=${p.height}"/>
<title>${esc(opts.pageLabel)} ${n}</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
<div class="page" style="width:${p.width}px;height:${p.height}px">
${p.image ? `<img class="bg" src="images/page${n}.jpg" alt=""/>` : ""}
${p.bodyHtml}
</div>
</body>
</html>`;
    add(`page${n}.xhtml`, strToU8(xhtml), "application/xhtml+xml", `p${n}`);
    spine.push(`<itemref idref="p${n}"/>`);
  });

  const nav = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${lang}" xml:lang="${lang}">
<head><meta charset="UTF-8"/><title>${esc(title)}</title></head>
<body><nav epub:type="toc" id="toc"><ol>
${pages.map((_, i) => `<li><a href="page${i + 1}.xhtml">${esc(opts.pageLabel)} ${i + 1}</a></li>`).join("\n")}
</ol></nav></body></html>`;
  add("nav.xhtml", strToU8(nav), "application/xhtml+xml", "nav", "nav");

  // Eigene Daten für den Re-Import
  const dataJson = {
    format: "laesehjaelper", version: 1, title: data.title,
    pages: data.pages.map((p, i) => {
      const n = i + 1;
      if (p.input) add(`laesehjaelper/input${n}.jpg`, p.input, "image/jpeg", `din${n}`);
      // Das übermalte Seitenbild steckt schon in images/; nur wenn es fehlt, legen wir es extra ab
      const pageImg = pages[i]?.image ? `../images/page${n}.jpg` : null;
      if (p.clean && !pageImg) add(`laesehjaelper/clean${n}.jpg`, p.clean, "image/jpeg", `dcl${n}`);
      return {
        lang: p.lang, text: p.text, rawText: p.rawText, paras: p.paras, workW: p.workW, workH: p.workH, corners: p.corners,
        input: p.input ? `input${n}.jpg` : null, clean: pageImg || (p.clean ? `clean${n}.jpg` : null),
      };
    }),
  };
  add("laesehjaelper/book.json", strToU8(JSON.stringify(dataJson)), "application/json", "data");

  const modified = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  files["OEBPS/content.opf"] = strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid" xml:lang="${lang}"
  prefix="rendition: http://www.idpf.org/vocab/rendition/#">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:identifier id="uid">urn:laesehjaelper:${esc(id)}</dc:identifier>
  <dc:title>${esc(title)}</dc:title>
  <dc:language>${lang}</dc:language>
  <dc:creator>Læsehjælper</dc:creator>
  <meta property="dcterms:modified">${modified}</meta>
  <meta property="rendition:layout">pre-paginated</meta>
  <meta property="rendition:spread">none</meta>
  <meta property="rendition:orientation">auto</meta>
</metadata>
<manifest>
  ${manifest.join("\n  ")}
</manifest>
<spine>
  ${spine.join("\n  ")}
</spine>
</package>`);

  return zipSync(files, { level: 6 });
}

/** Ein mit Læsehjælper erstelltes EPUB wieder einlesen. Gibt null zurück, wenn unsere Daten fehlen. */
export function readEpub(bytes: Uint8Array): DataBook | null {
  const files = unzipSync(bytes);
  const json = files["OEBPS/laesehjaelper/book.json"];
  if (!json) return null;
  const d = JSON.parse(strFromU8(json));
  if (d.format !== "laesehjaelper") return null;
  const file = (name: string | null) => {
    if (!name) return null;
    const path = name.startsWith("../") ? `OEBPS/${name.slice(3)}` : `OEBPS/laesehjaelper/${name}`;
    return files[path] || null;
  };
  return {
    title: d.title || "",
    pages: (d.pages || []).map((p: Record<string, unknown>): DataPage => ({
      lang: String(p.lang || "da"),
      text: String(p.text || ""),
      rawText: p.rawText as string | undefined,
      paras: (p.paras as Para[] | null) ?? null,
      workW: p.workW as number | undefined,
      workH: p.workH as number | undefined,
      corners: (p.corners as Frame | Corners | null) ?? null,
      input: file(p.input as string | null),
      clean: file(p.clean as string | null),
    })),
  };
}
