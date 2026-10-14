import { beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { awardPoints } from "../points";
import { POINT_DEFAULTS } from "../points-vocab";

/**
 * 集成测试：跑在 vitest.global-setup 准备好的 prisma/test.db 上。
 * 验证关键行为：发放金额来自配置表、(caseId, eventType) 防重。
 */
const db = new PrismaClient();

async function seedConfigs(values = POINT_DEFAULTS) {
  for (const p of values) {
    await db.pointsConfig.upsert({ where: { key: p.key }, update: { value: p.value }, create: p });
  }
}

let seq = 0;
async function makeFixture() {
  seq += 1;
  const user = await db.user.create({
    data: { username: `tester_${Date.now()}_${seq}`, passwordHash: "x", name: "测试用户" },
  });
  const category = await db.category.upsert({
    where: { name: "测试分类" },
    update: {},
    create: { name: "测试分类" },
  });
  const kase = await db.case.create({
    data: {
      title: "测试案例",
      categoryId: category.id,
      authorId: user.id,
      fileName: "附件.doc",
      filePath: "fake.doc",
      fileType: ".doc",
      fileSize: 1,
    },
  });
  return { user, kase };
}

beforeEach(async () => {
  await db.pointsLedger.deleteMany();
  await db.case.deleteMany();
  await db.user.deleteMany({ where: { username: { startsWith: "tester_" } } });
  await seedConfigs();
});

describe("awardPoints 积分发放", () => {
  it("提交案例按配置发 5 分", async () => {
    const { user, kase } = await makeFixture();
    const result = await awardPoints(db, {
      caseId: kase.id,
      userId: user.id,
      eventType: "SUBMIT",
    });
    expect(result).toEqual({ awarded: true, points: 5 });
  });

  it("同一案例同一事件重复发放被唯一约束拦截（防刷分核心）", async () => {
    const { user, kase } = await makeFixture();
    const first = await awardPoints(db, { caseId: kase.id, userId: user.id, eventType: "SUBMIT" });
    const second = await awardPoints(db, { caseId: kase.id, userId: user.id, eventType: "SUBMIT" });
    expect(first.awarded).toBe(true);
    expect(second.awarded).toBe(false);
    expect(await db.pointsLedger.count({ where: { caseId: kase.id } })).toBe(1);
  });

  it("初审通过与终审定级分别发放，互不冲突", async () => {
    const { user, kase } = await makeFixture();
    await awardPoints(db, { caseId: kase.id, userId: user.id, eventType: "FIRST_PASS" });
    const graded = await awardPoints(db, {
      caseId: kase.id,
      userId: user.id,
      eventType: "FINAL_GRADE",
      grade: "B",
    });
    expect(graded).toEqual({ awarded: true, points: 50 });
    expect(await db.pointsLedger.count({ where: { caseId: kase.id } })).toBe(2);
  });

  it("发放金额读取配置表当前值（改配置即改积分）", async () => {
    await seedConfigs([{ key: "SUBMIT", value: 8 }, ...POINT_DEFAULTS.slice(1)]);
    const { user, kase } = await makeFixture();
    const result = await awardPoints(db, { caseId: kase.id, userId: user.id, eventType: "SUBMIT" });
    expect(result.points).toBe(8);
  });

  it("配置缺失时抛错而非静默发 0 分", async () => {
    await db.pointsConfig.delete({ where: { key: "SUBMIT" } });
    const { user, kase } = await makeFixture();
    await expect(
      awardPoints(db, { caseId: kase.id, userId: user.id, eventType: "SUBMIT" })
    ).rejects.toThrow(/积分配置缺失/);
  });
});
