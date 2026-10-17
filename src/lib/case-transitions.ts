import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { awardPoints, type AwardPointsParams } from "./points";
import type { CaseStatus } from "./case-state";

/**
 * 案例状态迁移的唯一写入口：写时守卫 + 可选同事务发分。
 * 迁移补丁由 case-state 的 decideReview / decideResubmit 产出；
 * 本模块只负责「守卫命中才写、写成功就发分」这一原子形状。
 */

export interface CaseTransitionInput {
  caseId: string;
  /** 写时守卫：仅当库中状态仍为此值才应用补丁 */
  expectedStatus: CaseStatus;
  patch: Prisma.CaseUncheckedUpdateManyInput;
  /** 积分事件与状态写入同事务；守卫落空则不发 */
  pointEvent?: Omit<AwardPointsParams, "caseId">;
}

export interface CaseTransitionResult {
  applied: boolean;
}

export function applyCaseTransition(input: CaseTransitionInput): Promise<CaseTransitionResult> {
  return db.$transaction(async (tx) => {
    const { count } = await tx.case.updateMany({
      where: { id: input.caseId, status: input.expectedStatus },
      data: input.patch,
    });
    if (count === 0) return { applied: false };

    if (input.pointEvent) {
      await awardPoints(tx, { caseId: input.caseId, ...input.pointEvent });
    }
    return { applied: true };
  });
}
