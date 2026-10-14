import { beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { listCases } from "../case-queries";
import { clearCaseData, makeCase, makeCategory, makeUser } from "./helpers";

/**
 * 集成测试：案例库查询——可见性策略与筛选条件的落库行为。
 * 数据库为 vitest.global-setup 准备的 prisma/test.db。
 */
const db = new PrismaClient();

beforeEach(async () => {
  await clearCaseData(db);
});

async function seed() {
  const alice = await makeUser(db, "爱丽丝");
  const bob = await makeUser(db, "鲍勃");
  const cat = await makeCategory(db);
  const published = await makeCase(db, {
    authorId: alice.id,
    categoryId: cat.id,
    title: "已入库案例",
    status: "PUBLISHED",
    grade: "A",
    publishedAt: new Date(),
  });
  const ownPending = await makeCase(db, {
    authorId: alice.id,
    categoryId: cat.id,
    title: "爱丽丝的待初审",
    status: "PENDING_FIRST",
  });
  const otherRejected = await makeCase(db, {
    authorId: bob.id,
    categoryId: cat.id,
    title: "鲍勃的已驳回",
    status: "REJECTED",
  });
  const otherPending = await makeCase(db, {
    authorId: bob.id,
    categoryId: cat.id,
    title: "鲍勃的待初审",
    status: "PENDING_FIRST",
  });
  return { alice, bob, cat, published, ownPending, otherRejected, otherPending };
}

describe("listCases 可见性", () => {
  it("普通用户 = 已入库 ∪ 本人案例，他人过程态不可见", async () => {
    const s = await seed();
    const rows = await listCases({ id: s.alice.id, role: "USER" }, {});
    const titles = rows.map((r) => r.title).sort();
    expect(titles).toEqual(["已入库案例", "爱丽丝的待初审"]);
  });

  it("管理员全量可见，status 筛选生效", async () => {
    const s = await seed();
    const all = await listCases({ id: s.alice.id, role: "ADMIN" }, {});
    expect(all).toHaveLength(4);

    const pending = await listCases({ id: s.alice.id, role: "ADMIN" }, { status: "PENDING_FIRST" });
    expect(pending).toHaveLength(2);
  });

  it("普通用户传 status 不提权（可见性条件仍在）", async () => {
    const s = await seed();
    const rows = await listCases({ id: s.alice.id, role: "USER" }, { status: "REJECTED" });
    // status 筛选是 admin 专属；普通用户即使伪造参数也只见可见集内的匹配
    expect(rows.map((r) => r.title)).toEqual([]);
  });
});

describe("listCases 筛选", () => {
  it("标题关键词、等级筛选生效", async () => {
    const s = await seed();
    const byQ = await listCases({ id: s.alice.id, role: "ADMIN" }, { q: "已入库" });
    expect(byQ.map((r) => r.title)).toEqual(["已入库案例"]);

    const byGrade = await listCases({ id: s.alice.id, role: "ADMIN" }, { grade: "A" });
    expect(byGrade.map((r) => r.title)).toEqual(["已入库案例"]);
  });

  it("关联 author 与 category 一并取回", async () => {
    const s = await seed();
    const rows = await listCases({ id: s.alice.id, role: "ADMIN" }, { q: "已入库" });
    expect(rows[0].author.name).toBe("爱丽丝");
    expect(rows[0].category.id).toBe(s.cat.id);
  });
});
