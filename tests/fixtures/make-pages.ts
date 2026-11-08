// Generate self-made test pages for the end-to-end tests: HTML rendered with Playwright.
// Never use photos or text from real books (copyright). Run: node tests/fixtures/make-pages.ts
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL(".", import.meta.url));

// A bear with fur strokes: many dark edges that Tesseract mistakes for letters.
function bear(): string {
  const fur: string[] = [];
  for (let i = 0; i < 160; i++) {
    const a = (i / 160) * Math.PI * 2, r = 120 + (i % 7) * 6;
    const x = 160 + Math.cos(a) * r, y = 250 + Math.sin(a) * r * 1.25;
    fur.push(`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + Math.cos(a) * 14).toFixed(1)}" y2="${(y + Math.sin(a) * 18).toFixed(1)}" stroke="#3b2414" stroke-width="4"/>`);
  }
  return `<svg width="330" height="460" viewBox="0 0 330 460">
    <ellipse cx="160" cy="250" rx="120" ry="150" fill="#7a4a2a"/>${fur.join("")}
    <circle cx="160" cy="90" r="70" fill="#7a4a2a" stroke="#3b2414" stroke-width="5"/>
    <circle cx="105" cy="35" r="24" fill="#7a4a2a" stroke="#3b2414" stroke-width="5"/>
    <circle cx="215" cy="35" r="24" fill="#7a4a2a" stroke="#3b2414" stroke-width="5"/>
    <circle cx="135" cy="80" r="8" fill="#111"/><circle cx="185" cy="80" r="8" fill="#111"/>
    <ellipse cx="160" cy="115" rx="22" ry="15" fill="#d9b48a" stroke="#3b2414" stroke-width="3"/>
    <path d="M150 112 q10 10 20 0" stroke="#111" stroke-width="4" fill="none"/>
    <ellipse cx="160" cy="270" rx="60" ry="80" fill="#a87a52"/>
  </svg>`;
}

const lines = (ls: string[]) => ls.map((l) => `<div>${l}</div>`).join("");

// A meadow with grass blades and flowers filling the page: painting over text on it with
// one colour would leave a patch. The blades differ in hue more than in brightness, so the
// dark text stays easy to recognize.
function meadow(): string {
  const flowers: string[] = [];
  const rnd = (n: number) => ((Math.sin(n) * 43758.5453) % 1 + 1) % 1;   // Same scatter on every run.
  for (let i = 0; i < 70; i++) {
    const x = Math.round(15 + rnd(2 * i + 1) * 1170), y = Math.round(545 + rnd(2 * i + 2) * 1040);
    const petal = ["#ffffff", "#ffd23f", "#e85d75"][i % 3];
    flowers.push(`<circle cx="${x}" cy="${y}" r="13" fill="${petal}"/><circle cx="${x}" cy="${y}" r="5" fill="#f39c12"/>`);
  }
  return `<svg width="1200" height="1600" viewBox="0 0 1200 1600" style="position:absolute;left:0;top:0">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cb4ea"/><stop offset="1" stop-color="#cfe6f7"/></linearGradient>
      <pattern id="grass" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
        <rect width="34" height="34" fill="#78c8d2"/><rect width="17" height="34" fill="#f5cd5a"/>
      </pattern>
    </defs>
    <rect width="1200" height="520" fill="url(#sky)"/>
    <rect y="520" width="1200" height="1080" fill="url(#grass)"/>${flowers.join("")}
  </svg>`;
}
const meadowPage = (text: boolean) => `<body style="margin:0;width:1200px;height:1600px;font-family:'DejaVu Sans',sans-serif;font-weight:700;color:#1b2240">
    ${meadow()}
    <div style="position:absolute;left:110px;top:760px;font-size:56px;line-height:84px;${text ? "" : "visibility:hidden"}">
      ${lines(["Engen er fuld af blomster.", "Søren løber i det høje græs."])}
    </div>
  </body>`;

/** Invented text on a bowed page, with perspective, a fold shadow and an illustration. */
function curvedPhoto(): string {
  const text = ["Søren går en tur i haven.", "Han ser en lille fugl.", "Fuglen sidder i et træ.", "Der er blomster i græsset.", "Solen skinner på huset.", "Nu går Søren hjem igen."];
  const paths = text.map((_, i) => {
    const v = 0.18 + i * 0.085, x0 = 150 + 20 * v, x1 = 1050 - 40 * v;
    const y0 = 150 + 1230 * v, y1 = 170 + 1230 * v, sag = 10 + 65 * v;
    return `<path id="line${i}" d="M${x0},${y0} Q${(x0 + x1) / 2},${(y0 + y1) / 2 + 2 * sag} ${x1},${y1}"/>`;
  }).join("");
  return `<body style="margin:0;width:1200px;height:1600px;background:#895e39">
    <svg width="1200" height="1600" xmlns="http://www.w3.org/2000/svg">
      <defs>${paths}<linearGradient id="paper"><stop stop-color="#c4b5a0"/><stop offset=".18" stop-color="#f4eddc"/><stop offset="1" stop-color="#eee4cc"/></linearGradient></defs>
      <path d="M150,150 Q600,180 1050,170 L1010,1400 Q590,1540 170,1380 Z" fill="url(#paper)"/>
      <g fill="#30271e" font-family="DejaVu Serif" font-size="44">${text.map((t, i) => `<text><textPath href="#line${i}" startOffset="65">${t}</textPath></text>`).join("")}</g>
      <path d="M650,1250 L830,1250 L830,1120 L740,1040 L650,1120 Z" fill="#b75d42"/>
      <rect x="715" y="1170" width="50" height="80" fill="#654b36"/>
      <circle cx="870" cy="1000" r="55" fill="#e6b147"/>
    </svg>
  </body>`;
}

const pages: Record<string, string> = {
  "foto-curved-auto.jpg": curvedPhoto(),
  // Lines that start right beside an illustration (issue #3).
  "side-bjorn.jpg": `<body style="margin:0;width:1200px;height:1600px;background:#fbf2dc;font-family:'DejaVu Serif',serif;color:#2a2420">
    <div style="position:absolute;left:60px;top:120px">${bear()}</div>
    <div style="position:absolute;left:410px;top:160px;font-size:46px;line-height:72px">
      ${lines(["Lille bjørn kan ikke sove.", "Bjørne-far synger en sang", "om stjerner og en stor måne.", "Så falder lille bjørn i søvn."])}
    </div>
    <div style="position:absolute;left:110px;top:680px;font-size:46px;line-height:72px">
      ${lines(["Om morgenen spiser de honning", "og drikker vand fra søen."])}
    </div>
  </body>`,
  // Text on an illustration (issue #4), and the same picture without the text to compare with.
  "side-eng.jpg": meadowPage(true),
  "side-eng-uden-tekst.jpg": meadowPage(false),
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
for (const [name, html] of Object.entries(pages)) {
  await page.setContent(`<!doctype html><html>${html}</html>`);
  await page.screenshot({ path: dir + name, type: "jpeg", quality: 88 });
  console.log("Wrote tests/fixtures/" + name);
}
await browser.close();
