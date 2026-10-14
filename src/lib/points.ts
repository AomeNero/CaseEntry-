import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "./db";
import type { Grade } from "./case-state";
import {
  configKeyFor,
  POINT_CONFIG_KEYS,
  type PointConfigKey,
  type PointEvent,
} from "./points-vocab";

type Tx = PrismaClient | Prisma.TransactionClient;

export interface AwardPointsParams {
  caseId: string;
  userId: string;
  eventType: PointEvent;
  grade?: Grade;
}

export interface AwardResult {
  awarded: boolean;
  points: number;
}

/**
 * 发放积分（写流水）。在调用方的事务内执行，保证状态变更与积分原子性。
 * (caseId, eventType) 唯一约束保证每案例每事件只发一次——
 * 重复发放（如重复点击、并发）捕获 P2002 静默去重，视为已发放。
 */
export async function awardPoints(
  tx: Tx,
  { caseId, userId, eventType, grade }: AwardPointsParams
): Promise<AwardResult> {
  const key = configKeyFor(eventType, grade);
  const config = await tx.pointsConfig.findUnique({ where: { key } });
  if (!config) throw new Error(`积分配置缺失: ${key}（请检查 PointsConfig 种子数据）`);

  try {
    const record = await tx.pointsLedger.create({
      data: { userId, caseId, eventType, points: config.value },
    });
    return { awarded: true, points: record.points };
  } catch (e) {
    if (isUniqueViolation(e)) return { awarded: false, points: 0 };
    throw e;
  }
}

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "P2002"
  );
}

/**
 * 读取全部积分配置为 键→值 映射，供页面文案展示。
 * 缺键（如未跑 seed）补 0——展示宽容，发放仍由 awardPoints 严格校验。
 */
export async function getPointConfigValues(): Promise<Record<PointConfigKey, number>> {
  const map = Object.fromEntries(POINT_CONFIG_KEYS.map((k) => [k, 0])) as Record<
    PointConfigKey,
    number
  >;
  const rows = await db.pointsConfig.findMany();
  for (const r of rows) {
    if (r.key in map) map[r.key as PointConfigKey] = r.value;
  }
  return map;
}
