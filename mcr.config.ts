// Unit-test coverage (Vitest, V8); raw data is merged with E2E coverage by npm run coverage.
export default {
  name: "Læsehjælper – Unit tests",
  outputDir: "coverage/unit",
  reports: ["raw", "console-summary"],
  sourceFilter: { "**/src/**": true, "**/*": false },
};
