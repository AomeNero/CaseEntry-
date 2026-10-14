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
    // 多个集成测试文件共享同一个 sqlite 测试库（prisma/test.db），必须串行运行
    fileParallelism: false,
  },
});
