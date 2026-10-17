import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/** 走查数据（票 11/12 取证用，不改应用代码）：普通用户 + 四种状态案例 + 积分流水。 */
const db = new PrismaClient();

async function main() {
  const username = "walkthrough";
  const old = await db.user.findUnique({ where: { username } });
  if (old) {
    await db.pointsLedger.deleteMany({ where: { userId: old.id } });
    await db.case.deleteMany({ where: { authorId: old.id } });
    await db.user.delete({ where: { id: old.id } });
  }

  const user = await db.user.create({
    data: {
      username,
      passwordHash: await bcrypt.hash("walkthrough123", 10),
      name: "林小满",
      role: "USER",
    },
  });

  const admin = await db.user.findUniqueOrThrow({ where: { username: "admin" } });

  const cat = async (name: string) =>
    db.category.upsert({ where: { name }, update: {}, create: { name } });
  const net = await cat("网络");
  const hw = await cat("硬件");
  const soft = await cat("软件");

  const file = {
    fileName: "排查记录.txt",
    filePath: "walkthrough.txt",
    fileType: ".txt",
    fileSize: 42,
  };
  const now = Date.now();
  const daysAgo = (n: number) => new Date(now - n * 86400_000);

  const pendingFirst = await db.case.create({
    data: {
      ...file,
      title: "会议室投屏偶发断连的排查记录",
      categoryId: net.id,
      authorId: user.id,
      status: "PENDING_FIRST",
      submittedAt: daysAgo(1),
    },
  });

  const pendingFinal = await db.case.create({
    data: {
      ...file,
      title: "财务打印机驱动重复安装失败",
      categoryId: hw.id,
      authorId: user.id,
      status: "PENDING_FINAL",
      firstReviewerId: admin.id,
      firstReviewAt: daysAgo(2),
      submittedAt: daysAgo(3),
    },
  });

  const published = await db.case.create({
    data: {
      ...file,
      title: "离职员工 VPN 权限回收标准流程",
      categoryId: net.id,
      authorId: user.id,
      status: "PUBLISHED",
      grade: "B",
      firstReviewerId: admin.id,
      firstReviewAt: daysAgo(8),
      finalReviewerId: admin.id,
      finalReviewAt: daysAgo(7),
      publishedAt: daysAgo(7),
      submittedAt: daysAgo(9),
    },
  });

  const rejected = await db.case.create({
    data: {
      ...file,
      title: "邮箱容量不足的临时扩容方案",
      categoryId: soft.id,
      authorId: user.id,
      status: "REJECTED",
      rejectedStage: "FINAL",
      rejectReason: "缺少扩容后的回收与配额管理说明，请补充后再提交终审。",
      firstReviewerId: admin.id,
      firstReviewAt: daysAgo(5),
      submittedAt: daysAgo(6),
    },
  });

  // 积分流水，供个人中心与榜单显示
  await db.pointsLedger.createMany({
    data: [
      { userId: user.id, caseId: pendingFirst.id, eventType: "SUBMIT", points: 5, createdAt: daysAgo(1) },
      { userId: user.id, caseId: pendingFinal.id, eventType: "SUBMIT", points: 5, createdAt: daysAgo(3) },
      { userId: user.id, caseId: pendingFinal.id, eventType: "FIRST_PASS", points: 10, createdAt: daysAgo(2) },
      { userId: user.id, caseId: published.id, eventType: "SUBMIT", points: 5, createdAt: daysAgo(9) },
      { userId: user.id, caseId: published.id, eventType: "FIRST_PASS", points: 10, createdAt: daysAgo(8) },
      { userId: user.id, caseId: published.id, eventType: "FINAL_GRADE", points: 50, createdAt: daysAgo(7) },
      { userId: user.id, caseId: rejected.id, eventType: "SUBMIT", points: 5, createdAt: daysAgo(6) },
    ],
  });

  console.log(`走查数据就绪：${username}/walkthrough123，案例 ${[pendingFirst, pendingFinal, published, rejected].map((c) => c.id).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
