import { execSync } from "child_process";

/**
 * 测试库准备：使用独立的 prisma/test.db，不碰开发库 dev.db。
 * 必须在导入任何 PrismaClient 之前设置 DATABASE_URL。
 */
process.env.DATABASE_URL = "file:./test.db";

export default function setup() {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: process.env,
  });
}
