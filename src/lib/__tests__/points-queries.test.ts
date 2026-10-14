import { beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { pointsLeaderboard, pointsReport, userTotalPoints } from "../points-queries";
import { clearCaseData, makeCase, makeCategory, makeLedger, makeUser } from "./helpers";

/**
 * 集成测试：积分汇总口径统一后的行为——榜单、单人合计、报表。
 * 数据库为 vitest.global-setup 准备的 prisma/test.db。
 */
const db = new PrismaClient();

beforeEach(async () => {
  await clearCaseData(db);
});

describe("pointsLeaderboard 榜单口径", () => {
  it("按流水聚合降序，带排名与用户名", async () => {
    const u1 = await makeUser(db, "甲");
    const u2 = await makeUser(db, "乙");
    const cat = await makeCategory(db);
    const c1 = await makeCase(db, { authorId: u1.id, categoryId: cat.id });
    const c2 = await makeCase(db, { authorId: u2.id, categoryId: cat.id });
    await makeLedger(db, { userId: u1.id, caseId: c1.id, eventType: "SUBMIT", points: 5 });
    await makeLedger(db, { userId: u1.id, caseId: c1.id, eventType: "FINAL_GRADE", points: 100 });
    await makeLedger(db, { userId: u2.id, caseId: c2.id, eventType: "SUBMIT", points: 50 });

    const rows = await pointsLeaderboard(10);
    expect(rows[0]).toMatchObject({ rank: 1, name: "甲", points: 105 });
    expect(rows[1]).toMatchObject({ rank: 2, name: "乙", points: 50 });
  });

  it("limit 生效；since 过滤月度口径", async () => {
    const u1 = await makeUser(db, "甲");
    const u2 = await makeUser(db, "乙");
    const cat = await makeCategory(db);
    const c1 = await makeCase(db, { authorId: u1.id, categoryId: cat.id });
    const c2 = await makeCase(db, { authorId: u2.id, categoryId: cat.id });
    const longAgo = new Date("2020-01-01");
    const now = new Date();
    await makeLedger(db, { userId: u1.id, caseId: c1.id, eventType: "SUBMIT", points: 999, createdAt: longAgo });
    await makeLedger(db, { userId: u2.id, caseId: c2.id, eventType: "SUBMIT", points: 10, createdAt: now });

    const top1 = await pointsLeaderboard(1);
    expect(top1).toHaveLength(1);
    expect(top1[0].points).toBe(999);

    const monthly = await pointsLeaderboard(10, new Date(now.getFullYear(), now.getMonth(), 1));
    expect(monthly).toHaveLength(1);
    expect(monthly[0].name).toBe("乙");
  });
});

describe("userTotalPoints 单人口径", () => {
  it("累计该用户全部流水", async () => {
    const u1 = await makeUser(db);
    const cat = await makeCategory(db);
    const c1 = await makeCase(db, { authorId: u1.id, categoryId: cat.id });
    await makeLedger(db, { userId: u1.id, caseId: c1.id, eventType: "SUBMIT", points: 5 });
    await makeLedger(db, { userId: u1.id, caseId: c1.id, eventType: "FIRST_PASS", points: 10 });
    expect(await userTotalPoints(u1.id)).toBe(15);
  });

  it("无流水时为 0", async () => {
    const u1 = await makeUser(db);
    expect(await userTotalPoints(u1.id)).toBe(0);
  });
});

describe("pointsReport 报表口径", () => {
  it("名单=期间有积分或有提交者；三列口径互不干扰", async () => {
    const u1 = await makeUser(db, "甲");
    const u2 = await makeUser(db, "乙");
    const cat = await makeCategory(db);
    const c1 = await makeCase(db, { authorId: u1.id, categoryId: cat.id });
    // c2 是乙在期间外（9 月）提交的 fixture 案例，不计入期间案例数
    const c2 = await makeCase(db, { authorId: u2.id, categoryId: cat.id, submittedAt: new Date("2026-09-01") });

    const from = new Date("2026-10-01");
    const to = new Date("2026-10-31T23:59:59");
    // 甲：期间内积分 15 + 期间内提交 1 案例；更早还有 100 累计
    await makeLedger(db, { userId: u1.id, caseId: c1.id, eventType: "SUBMIT", points: 5, createdAt: new Date("2026-10-05") });
    await makeLedger(db, { userId: u1.id, caseId: c1.id, eventType: "FIRST_PASS", points: 10, createdAt: new Date("2026-10-06") });
    await makeLedger(db, { userId: u1.id, caseId: c1.id, eventType: "FINAL_GRADE", points: 100, createdAt: new Date("2026-09-01") });
    // 乙：期间外积分，但期间内有提交（应入名单，积分为 0）——fixture 案例 c2 落在期间外
    await makeCase(db, { authorId: u2.id, categoryId: cat.id, submittedAt: new Date("2026-10-10") });
    await makeLedger(db, { userId: u2.id, caseId: c2.id, eventType: "SUBMIT", points: 88, createdAt: new Date("2026-09-01") });

    const rows = await pointsReport(from, to);
    expect(rows).toHaveLength(2);
    const jia = rows.find((r) => r.name === "甲")!;
    expect(jia).toMatchObject({ casesInPeriod: 1, pointsInPeriod: 15, pointsTotal: 115 });
    const yi = rows.find((r) => r.name === "乙")!;
    expect(yi).toMatchObject({ casesInPeriod: 1, pointsInPeriod: 0, pointsTotal: 88 });
    // 按期间积分降序：甲在乙前
    expect(rows[0].name).toBe("甲");
  });
});
