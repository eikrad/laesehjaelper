import { expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { javascriptSources } from "../../lint";

it("findet JavaScript-Quellen, aber keine erzeugten oder privaten Dateien", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "laese-lint-"));
  try {
    for (const file of ["src/old.js", "tests/helper.cjs", "config.mjs", "view.jsx", "src/valid.ts", "dist/app.js", "coverage/report.js", "node_modules/library/index.js", "private-testbilder/local.js"]) {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      fs.writeFileSync(path.join(root, file), "");
    }
    expect(javascriptSources(root)).toEqual(["config.mjs", "src/old.js", "tests/helper.cjs", "view.jsx"]);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
