// Abdeckung der Unit-Tests (Vitest, V8) – Rohdaten werden mit der E2E-Abdeckung zusammengeführt (npm run coverage).
export default {
  name: "Læsehjælper – Unit-Tests",
  outputDir: "coverage/unit",
  reports: ["raw", "console-summary"],
  sourceFilter: { "**/src/**": true, "**/*": false },
};
