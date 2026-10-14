import type { PrismaClient } from "@prisma/client";

/** 集成测试共享 fixture（跑在 vitest.global-setup 准备的 prisma/test.db 上） */

let seq = 0;

export async function makeUser(db: PrismaClient, name?: string, role = "USER") {
  seq += 1;
  return db.user.create({
    data: {
      username: `t_${Date.now()}_${seq}`,
      passwordHash: "x",
      name: name ?? `测试用户${seq}`,
      role,
    },
  });
}

export async function makeCategory(db: PrismaClient) {
  seq += 1;
  return db.category.create({ data: { name: `测试分类_${Date.now()}_${seq}` } });
}

export async function makeCase(
  db: PrismaClient,
  opts: {
    authorId: string;
    categoryId: string;
    title?: string;
    status?: string;
    grade?: string;
    publishedAt?: Date;
    submittedAt?: Date;
  }
) {
  return db.case.create({
    data: {
      title: opts.title ?? "测试案例",
      categoryId: opts.categoryId,
      authorId: opts.authorId,
      status: opts.status,
      grade: opts.grade,
      publishedAt: opts.publishedAt,
      submittedAt: opts.submittedAt,
      fileName: "附件.doc",
      filePath: "fake.doc",
      fileType: ".doc",
      fileSize: 1,
    },
  });
}

export async function makeLedger(
  db: PrismaClient,
  opts: { userId: string; caseId: string; eventType: string; points: number; createdAt?: Date }
) {
  return db.pointsLedger.create({
    data: {
      userId: opts.userId,
      caseId: opts.caseId,
      eventType: opts.eventType,
      points: opts.points,
      createdAt: opts.createdAt,
    },
  });
}

/** 按外键依赖序清理本组 fixture 的数据（ledger → case → category → user） */
export async function clearCaseData(db: PrismaClient) {
  await db.pointsLedger.deleteMany();
  await db.case.deleteMany();
  await db.category.deleteMany({ where: { name: { startsWith: "测试分类_" } } });
  await db.user.deleteMany({ where: { username: { startsWith: "t_" } } });
}
