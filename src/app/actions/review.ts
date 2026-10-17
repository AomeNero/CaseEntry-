"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { applyCaseTransition } from "@/lib/case-transitions";
import { reviewActionSchema } from "@/lib/validation";
import { parseForm, safeRedirectTo } from "@/lib/form";
import { decideReview, type CaseStatus, type ReviewActionInput } from "@/lib/case-state";
import { getCurrentAdmin } from "@/lib/auth";
import type { FormState } from "@/lib/form";

/**
 * 审核动作（初审/终审共用）。
 * 全部状态决策由 case-state 的 decideReview 做出；本函数只负责
 * 身份 → 解析表单 → 加载案例 → 经 case-transitions 应用补丁（写时守卫）并原子发分。
 */
export async function reviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentAdmin();
  if (!user) return { error: "仅管理员可执行审核操作" };

  const caseId = String(formData.get("caseId") ?? "");
  if (!caseId) return { error: "参数错误" };

  // 完成后的跳转目标属于调用方（审核待办→/admin；案例详情→回详情页）；站内守卫见 safeRedirectTo
  const redirectToRaw = String(formData.get("redirectTo") ?? "");
  const redirectTo = safeRedirectTo(redirectToRaw, "/admin");

  const parsed = parseForm(reviewActionSchema, {
    stage: formData.get("stage"),
    action: formData.get("action"),
    reason: formData.get("reason") || undefined,
    grade: formData.get("grade") || undefined,
  });
  if (!parsed.ok) return { error: parsed.error };
  const d = parsed.data;

  const actionInput: ReviewActionInput =
    d.action === "approve"
      ? { type: "approve" }
      : d.action === "reject"
        ? { type: "reject", reason: d.reason }
        : { type: "grade", grade: d.grade };

  const kase = await db.case.findUnique({ where: { id: caseId } });
  if (!kase) return { error: "案例不存在" };

  // 决策与写时守卫共用同一个当前状态，二者不会漂移
  const currentStatus = kase.status as CaseStatus;
  const decision = decideReview(currentStatus, {
    stage: d.stage,
    actorId: user.id,
    action: actionInput,
  });
  if (!decision.ok) return { error: decision.error };

  // 写时守卫：并发下状态已变则落空，不发分
  const { applied } = await applyCaseTransition({
    caseId,
    expectedStatus: currentStatus,
    patch: decision.patch,
    pointEvent: decision.pointEvent && {
      userId: kase.authorId,
      ...decision.pointEvent,
    },
  });
  if (!applied) return { error: "案例状态已变化，请刷新后重试" };

  redirect(redirectTo);
}
