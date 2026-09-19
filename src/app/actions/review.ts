"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { awardPoints } from "@/lib/points";
import { reviewActionSchema } from "@/lib/validation";
import { canTransition, statusOnApprove, type ReviewStage } from "@/lib/case-state";
import type { FormState } from "./auth";

/**
 * 审核动作（初审/终审共用）：
 * - FIRST + approve：进待终审，发初审通过积分
 * - FINAL + grade A/B/C：入库，发定级积分
 * - reject(+reason)：退回录入人，记录驳回环节，不扣分
 * 状态变更与积分发放同一事务。
 */
export async function reviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { error: "仅管理员可执行审核操作" };

  const caseId = String(formData.get("caseId") ?? "");
  const stageRaw = String(formData.get("stage") ?? "");
  if ((stageRaw !== "FIRST" && stageRaw !== "FINAL") || !caseId) {
    return { error: "参数错误" };
  }
  const stage = stageRaw as ReviewStage;

  const parsed = reviewActionSchema.safeParse({
    action: formData.get("action"),
    reason: formData.get("reason") || undefined,
    grade: formData.get("grade") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const kase = await db.case.findUnique({ where: { id: caseId } });
  if (!kase) return { error: "案例不存在" };
  if (kase.status !== (stage === "FIRST" ? "PENDING_FIRST" : "PENDING_FINAL")) {
    return { error: "案例状态已变化，请刷新后重试" };
  }

  const action = parsed.data;
  const target =
    action.action === "reject"
      ? "REJECTED"
      : action.action === "approve"
        ? statusOnApprove(stage)
        : "PUBLISHED";

  if (!canTransition(kase.status as typeof target, target)) {
    return { error: "非法状态迁移" };
  }

  await db.$transaction(async (tx) => {
    if (action.action === "reject") {
      await tx.case.update({
        where: { id: caseId },
        data: { status: "REJECTED", rejectedStage: stage, rejectReason: action.reason },
      });
    } else if (action.action === "approve") {
      await tx.case.update({
        where: { id: caseId },
        data: {
          status: target,
          firstReviewerId: user.id,
          firstReviewAt: new Date(),
        },
      });
      await awardPoints(tx, { caseId, userId: kase.authorId, eventType: "FIRST_PASS" });
    } else {
      await tx.case.update({
        where: { id: caseId },
        data: {
          status: "PUBLISHED",
          grade: action.grade,
          finalReviewerId: user.id,
          finalReviewAt: new Date(),
          publishedAt: new Date(),
        },
      });
      await awardPoints(tx, {
        caseId,
        userId: kase.authorId,
        eventType: "FINAL_GRADE",
        grade: action.grade,
      });
    }
  });

  redirect("/admin");
}
