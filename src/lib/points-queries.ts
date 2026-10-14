import "server-only";
import { db } from "./db";

/**
 * 积分汇总读取（唯一口径来源）：榜单、单人合计、报表。
 * 流水（PointsLedger）是积分的唯一真相，所有口径都在此聚合——
 * 排行榜与报表对不上数这类问题在结构上不可能发生。
 */

export interface LeaderboardRow {
  rank: number;
  userId: string;
  name: string;
  points: number;
}

/** 积分榜：流水聚合 top N，可选起始时间（月榜传月初 0 点）。用户名 join 在此一处完成。 */
export async function pointsLeaderboard(limit = 10, since?: Date): Promise<LeaderboardRow[]> {
  const rows = await db.pointsLedger.groupBy({
    by: ["userId"],
    _sum: { points: true },
    where: since ? { createdAt: { gte: since } } : undefined,
    orderBy: { _sum: { points: "desc" } },
    take: limit,
  });
  const users = await db.user.findMany({ where: { id: { in: rows.map((r) => r.userId) } } });
  const nameById = new Map(users.map((u) => [u.id, u.name]));
  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    name: nameById.get(r.userId) ?? "已删除用户",
    points: r._sum.points ?? 0,
  }));
}

/** 单人累计积分（流水聚合，无冗余余额列） */
export async function userTotalPoints(userId: string): Promise<number> {
  const agg = await db.pointsLedger.aggregate({ where: { userId }, _sum: { points: true } });
  return agg._sum.points ?? 0;
}

export interface ReportRow {
  userId: string;
  name: string;
  username: string;
  /** 期间内提交案例数 */
  casesInPeriod: number;
  /** 期间内获得积分 */
  pointsInPeriod: number;
  /** 累计积分（不限期间） */
  pointsTotal: number;
}

/** 报表：名单 = 期间内有积分或有提交者；三列口径聚合 + 用户名 join 一处完成，按期间积分降序 */
export async function pointsReport(from: Date, to: Date): Promise<ReportRow[]> {
  const [ledgerRows, caseRows, totals, users] = await Promise.all([
    db.pointsLedger.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: from, lte: to } },
      _sum: { points: true },
    }),
    db.case.groupBy({
      by: ["authorId"],
      where: { submittedAt: { gte: from, lte: to } },
      _count: true,
    }),
    db.pointsLedger.groupBy({ by: ["userId"], _sum: { points: true } }),
    db.user.findMany({ select: { id: true, name: true, username: true } }),
  ]);

  const byId = new Map(users.map((u) => [u.id, u]));
  const ledgerByUser = new Map(ledgerRows.map((r) => [r.userId, r._sum.points ?? 0]));
  const caseByUser = new Map(caseRows.map((r) => [r.authorId, r._count]));
  const totalByUser = new Map(totals.map((r) => [r.userId, r._sum.points ?? 0]));

  const involved = new Set([...ledgerByUser.keys(), ...caseByUser.keys()]);
  return [...involved]
    .map((userId) => {
      const user = byId.get(userId);
      if (!user) return null;
      return {
        userId,
        name: user.name,
        username: user.username,
        casesInPeriod: caseByUser.get(userId) ?? 0,
        pointsInPeriod: ledgerByUser.get(userId) ?? 0,
        pointsTotal: totalByUser.get(userId) ?? 0,
      };
    })
    .filter((r): r is ReportRow => r !== null)
    .sort((a, b) => b.pointsInPeriod - a.pointsInPeriod);
}
