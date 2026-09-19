import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany({ where: { username: { startsWith: "smoke_" } } });
  const ids = users.map((u) => u.id);
  await db.pointsLedger.deleteMany({ where: { userId: { in: ids } } });
  await db.case.deleteMany({ where: { authorId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`已清理冒烟数据：${ids.length} 个用户及其案例/积分`);
}

main().finally(() => db.$disconnect());
