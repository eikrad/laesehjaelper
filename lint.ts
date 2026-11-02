import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const ignored = new Set([".git", "node_modules", "dist", "coverage", "playwright-report", "test-results", "private-testbilder"]);

/** Quelldateien prüfen; erzeugte Dateien und private Testbilder bleiben außerhalb des Lint-Laufs. */
export function javascriptSources(root: string): string[] {
  const found: string[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile() && /\.(?:[cm]?js|jsx)$/i.test(entry.name)) found.push(path.relative(root, file));
    }
  }
  walk(root);
  return found.sort();
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const files = javascriptSources(process.cwd());
  if (files.length) {
    console.error("Use TypeScript for source, tests and configuration:\n" + files.join("\n"));
    process.exitCode = 1;
  } else {
    const cli = fileURLToPath(new URL("./node_modules/@biomejs/biome/bin/biome", import.meta.url));
    const result = spawnSync(process.execPath, [cli, "lint", ".", "--error-on-warnings"], { stdio: "inherit" });
    if (result.error) console.error(result.error);
    process.exitCode = result.status ?? 1;
  }
}
