// Baut die App nach dist/: eine index.html plus die Dateien für die Texterkennung.
import { build } from "esbuild";
import fs from "node:fs";

const nm = "node_modules";
const out = "dist";
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(`${out}/core`, { recursive: true });
fs.mkdirSync(`${out}/lang`, { recursive: true });

const silben = await build({
  entryPoints: ["src/silben.js"], bundle: true, minify: true, format: "iife", write: false,
});
const b64 = (p) => fs.readFileSync(p).toString("base64");
const od = `${nm}/@fontsource/opendyslexic/files/opendyslexic-latin`;

let html = fs.readFileSync("src/index.html", "utf8");
html = html
  .replace("%%SILBEN_JS%%", () => silben.outputFiles[0].text)
  .replace("%%OD_400%%", () => b64(`${od}-400-normal.woff2`))
  .replace("%%OD_700%%", () => b64(`${od}-700-normal.woff2`));
fs.writeFileSync(`${out}/index.html`, html);

const copy = (from, to) => fs.copyFileSync(from, `${out}/${to}`);
copy(`${nm}/tesseract.js/dist/tesseract.min.js`, "tesseract.min.js");
// Fehler in tesseract.js 5 umgehen: bei mitgelieferten Sprachdaten wird beim Initialisieren
// t.data statt t.code verwendet. Wir laden die Sprachdaten selbst, daher hier korrigieren.
const worker = fs.readFileSync(`${nm}/tesseract.js/dist/worker.min.js`, "utf8");
const bug = 'return"string"==typeof t?t:t.data}';
if (!worker.includes(bug)) throw new Error("worker.min.js: Patch-Stelle nicht gefunden");
fs.writeFileSync(`${out}/worker.min.js`, worker.replace(bug, 'return"string"==typeof t?t:t.code}'));
for (const f of ["tesseract-core-lstm.wasm.js", "tesseract-core-simd-lstm.wasm.js"])
  copy(`${nm}/tesseract.js-core/${f}`, `core/${f}`);
// Sprachdaten als JS-Dateien (Base64), weil der Artifact-Host nur bestimmte Dateitypen ausliefert.
for (const l of ["dan", "deu"])
  fs.writeFileSync(`${out}/lang/${l}.js`, `window.TRAINEDDATA=window.TRAINEDDATA||{};window.TRAINEDDATA.${l}="${b64(`${nm}/@tesseract.js-data/${l}/4.0.0_best_int/${l}.traineddata.gz`)}";`);

console.log("Fertig: dist/");
