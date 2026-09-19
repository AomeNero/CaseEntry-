import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 初始管理员（首次登录后请在个人中心改密）
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", passwordHash, name: "系统管理员", role: "ADMIN" },
  });

  const categories = ["网络", "硬件", "软件", "账号权限", "其他"];
  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  const points = [
    { key: "SUBMIT", value: 5 },
    { key: "FIRST_PASS", value: 10 },
    { key: "GRADE_A", value: 100 },
    { key: "GRADE_B", value: 50 },
    { key: "GRADE_C", value: 20 },
  ];
  for (const p of points) {
    await prisma.pointsConfig.upsert({
      where: { key: p.key },
      update: { value: p.value },
      create: p,
    });
  }

  console.log("Seed 完成：admin/admin123，5 个分类，5 项积分配置");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
