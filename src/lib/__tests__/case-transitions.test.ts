import { beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { applyCaseTransition } from "../case-transitions";
import { POINT_DEFAULTS } from "../points-vocab";
import { clearCaseData, makeCase, makeCategory, makeUser } from "./helpers";

/**
 * 集成测试：状态迁移 + 发分的原子组合。
 * 数据库为 vitest.global-setup 准备的 prisma/test.db。
 */
const db = new PrismaClient();

beforeEach(async () => {
  await clearCaseData(db);
  for (const p of POINT_DEFAULTS) {
    await db.pointsConfig.upsert({ where: { key: p.key }, update: { value: p.value }, create: p });
  }
});

async function seed() {
  const author = await makeUser(db);
  const reviewer = await makeUser(db);
  const category = await makeCategory(db);
  const kase = await makeCase(db, {
    authorId: author.id,
    categoryId: category.id,
    status: "PENDING_FIRST",
  });
  return { author, reviewer, kase };
}

describe("applyCaseTransition", () => {
  it("守卫命中时写入状态补丁并在同一事务发放积分", async () => {
    const s = await seed();

    const result = await applyCaseTransition({
      caseId: s.kase.id,
      expectedStatus: "PENDING_FIRST",
      patch: { status: "PENDING_FINAL", firstReviewerId: s.reviewer.id },
      pointEvent: { userId: s.author.id, eventType: "FIRST_PASS" },
    });

    expect(result).toEqual({ applied: true });
    const updated = await db.case.findUniqueOrThrow({ where: { id: s.kase.id } });
    expect(updated.status).toBe("PENDING_FINAL");
    expect(updated.firstReviewerId).toBe(s.reviewer.id);
    const ledger = await db.pointsLedger.findMany({ where: { caseId: s.kase.id } });
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({ userId: s.author.id, eventType: "FIRST_PASS", points: 10 });
  });

  it("守卫落空（并发下状态已变）时不写状态、不发分", async () => {
    const s = await seed();

    const result = await applyCaseTransition({
      caseId: s.kase.id,
      expectedStatus: "PENDING_FINAL", // 库中实际仍是 PENDING_FIRST
      patch: { status: "PUBLISHED" },
      pointEvent: { userId: s.author.id, eventType: "FINAL_GRADE", grade: "B" },
    });

    expect(result).toEqual({ applied: false });
    const unchanged = await db.case.findUniqueOrThrow({ where: { id: s.kase.id } });
    expect(unchanged.status).toBe("PENDING_FIRST");
    expect(await db.pointsLedger.count({ where: { caseId: s.kase.id } })).toBe(0);
  });

  it("无积分事件的迁移（重交）只写状态", async () => {
    const s = await seed();
    await db.case.update({ where: { id: s.kase.id }, data: { status: "REJECTED" } });

    const result = await applyCaseTransition({
      caseId: s.kase.id,
      expectedStatus: "REJECTED",
      patch: { status: "PENDING_FIRST", rejectReason: null },
    });

    expect(result).toEqual({ applied: true });
    const updated = await db.case.findUniqueOrThrow({ where: { id: s.kase.id } });
    expect(updated.status).toBe("PENDING_FIRST");
    expect(await db.pointsLedger.count({ where: { caseId: s.kase.id } })).toBe(0);
  });
});
