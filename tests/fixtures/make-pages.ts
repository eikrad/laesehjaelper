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

const pages: Record<string, string> = {
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
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
for (const [name, html] of Object.entries(pages)) {
  await page.setContent(`<!doctype html><html>${html}</html>`);
  await page.screenshot({ path: dir + name, type: "jpeg", quality: 88 });
  console.log("Wrote tests/fixtures/" + name);
}
await browser.close();
