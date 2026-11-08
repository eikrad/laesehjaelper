/// <reference types="node" />
// Build the app into dist/: index.html plus text-recognition assets.
import { build } from "esbuild";
import fs from "node:fs";

const nm = "node_modules";
const out = "dist";
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(`${out}/core`, { recursive: true });
fs.mkdirSync(`${out}/lang`, { recursive: true });

// COVERAGE=1: unminified code with an inline source map to map E2E coverage to source files.
const coverage = !!process.env.COVERAGE;
const app = await build({
  entryPoints: ["src/app.ts"], bundle: true, minify: !coverage, format: "iife", write: false,
  ...(coverage ? { sourcemap: "inline" as const, sourceRoot: process.cwd() + "/" } : {}),
});
const b64 = (p: string): string => fs.readFileSync(p).toString("base64");
const od = `${nm}/@fontsource/opendyslexic/files/opendyslexic-latin`;

let html = fs.readFileSync("src/index.html", "utf8");
html = html
  .replace("%%APP_JS%%", () => app.outputFiles[0].text)
  .replace("%%OD_400%%", () => b64(`${od}-400-normal.woff2`))
  .replace("%%OD_700%%", () => b64(`${od}-700-normal.woff2`));
fs.writeFileSync(`${out}/index.html`, html);

// Distribute the actual copyright and licence texts with the site, not just its source repository.
const licenceFiles = fs.readdirSync("licenses").filter(f => f.endsWith(".txt")).sort();
const notices = fs.readFileSync("THIRD_PARTY_NOTICES.md", "utf8") + "\n\n" + licenceFiles
  .map(file => fs.readFileSync(`licenses/${file}`, "utf8")).join("\n\n" + "=".repeat(80) + "\n\n");
const escapedNotices = notices.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
fs.writeFileSync(`${out}/licenses.html`, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Licences and fonts – Læsehjælper</title><style>body{font:16px/1.6 system-ui,sans-serif;margin:2rem auto;padding:0 1rem;max-width:80ch}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}</style><a href="./">Læsehjælper</a><h1>Licences and fonts</h1><pre>${escapedNotices}</pre></html>`);

await build({
  entryPoints: ["src/pdf-export.ts"], bundle: true, minify: !coverage, format: "iife", outfile: `${out}/pdf.js`,
  ...(coverage ? { sourcemap: "inline" as const, sourceRoot: process.cwd() + "/" } : {}),
});

const copy = (from: string, to: string): void => fs.copyFileSync(from, `${out}/${to}`);

// Version the service worker so each new version replaces the previous cache.
const version = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
await build({ entryPoints: ["src/sw.ts"], bundle: true, minify: true, format: "iife", outfile: `${out}/sw.js`, define: { VERSION: JSON.stringify(version) } });

// App manifest and icons.
fs.writeFileSync(`${out}/manifest.webmanifest`, JSON.stringify({
  name: "Læsehjælper",
  short_name: "Læsehjælper",
  description: "Børnebøger sat op, så de er lettere at læse.",
  start_url: "./",
  scope: "./",
  display: "standalone",
  background_color: "#f2f3f5",
  theme_color: "#f2f3f5",
  icons: [
    { src: "icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
}, null, 2));
for (const f of ["icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"]) copy(`assets/${f}`, f);
copy(`${nm}/tesseract.js/dist/tesseract.min.js`, "tesseract.min.js");
copy(`${nm}/@techstark/opencv-js/dist/opencv.js`, "opencv.js");
// Work around a tesseract.js bug still present in v7: initialization joins supplied language
// data using t.data instead of t.code. We supply the data ourselves, so patch this here.
// Loading already uses _lang.code in v7; see worker-script.
const worker = fs.readFileSync(`${nm}/tesseract.js/dist/worker.min.js`, "utf8");
const bug = 'return"string"==typeof t?t:t.data}';
if (!worker.includes(bug)) throw new Error("worker.min.js: patch location not found");
fs.writeFileSync(`${out}/worker.min.js`, worker.replace(bug, 'return"string"==typeof t?t:t.code}'));
// LSTM builds only; tesseract.js selects one for the device (relaxed SIMD is fastest from v7).
for (const f of ["tesseract-core-lstm.wasm.js", "tesseract-core-simd-lstm.wasm.js", "tesseract-core-relaxedsimd-lstm.wasm.js"])
  copy(`${nm}/tesseract.js-core/${f}`, `core/${f}`);
// Package language data as Base64 in JS files because the artifact host only serves certain file types.
for (const l of ["dan", "deu", "eng"])
  fs.writeFileSync(`${out}/lang/${l}.js`, `window.TRAINEDDATA=window.TRAINEDDATA||{};window.TRAINEDDATA.${l}="${b64(`${nm}/@tesseract.js-data/${l}/4.0.0_best_int/${l}.traineddata.gz`)}";`);

// Danish word-parts dictionary (Stavekontrolden, MPL 1.1), lowercase base forms only.
{
  const dic = fs.readFileSync(`${nm}/dictionary-da/index.dic`, "utf8").split("\n").slice(1);
  const words = new Set<string>();
  for (const l of dic) { const w = l.split("/")[0].trim().toLowerCase(); if (/^[a-zæøåé]{2,}$/.test(w)) words.add(w); }
  fs.writeFileSync(`${out}/lang/da-words.js`, `window.WORDS=window.WORDS||{};window.WORDS.da=${JSON.stringify([...words].sort().join("\n"))};`);
}

console.log("Built: dist/");
