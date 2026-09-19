import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "vitest.server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    globalSetup: ["./vitest.global-setup.ts"],
  },
});
