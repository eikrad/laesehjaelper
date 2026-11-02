import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    // npm run coverage: V8-Abdeckung über Monocart (Konfiguration in mcr.config.ts)
    coverage: { include: ["src/**"], provider: "custom", customProviderModule: "vitest-monocart-coverage" },
  },
});
