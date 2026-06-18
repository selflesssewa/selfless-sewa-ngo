import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: [],
    setupFiles: ["src/__tests__/setup.ts"],
    globals: false,
    // Run integration tests sequentially so they don't race on shared rows.
    sequence: { concurrent: false },
    coverage: {
      provider: "v8",
      include: ["src/db.ts", "src/phonepe.ts", "src/app/api/subscription/**"],
      reporter: ["text", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
