"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { saveUpload } from "@/lib/upload";
import { awardPoints } from "@/lib/points";
import { caseFormSchema } from "@/lib/validation";
import { decideResubmit, type CaseStatus, type ReviewStage } from "@/lib/case-state";
import type { FormState } from "./auth";

/** 提交新案例：表单校验 → 附件保存 → 建案例 + 发提交积分（同事务） */
export async function createCaseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const parsed = caseFormSchema.safeParse({
    title: formData.get("title"),
    categoryId: formData.get("categoryId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "请上传附件" };

  let saved;
  try {
    saved = await saveUpload(file);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "附件保存失败" };
  }

  const category = await db.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) return { error: "所选分类不存在" };

  const kase = await db.$transaction(async (tx) => {
    const created = await tx.case.create({
      data: {
        title: parsed.data.title,
        categoryId: parsed.data.categoryId,
        authorId: user.id,
        ...saved,
      },
    });
    await awardPoints(tx, {
      caseId: created.id,
      userId: user.id,
      eventType: "SUBMIT",
    });
    return created;
  });

  redirect(`/cases/${kase.id}`);
}

/** 驳回后修改重交：回到被驳环节，不发新积分（唯一约束兜底）。迁移决策与写时守卫见 case-state。 */
export async function resubmitCaseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const caseId = String(formData.get("caseId") ?? "");

  const parsed = caseFormSchema.safeParse({
    title: formData.get("title"),
    categoryId: formData.get("categoryId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "请重新上传附件" };

  const kase = await db.case.findUnique({ where: { id: caseId } });
  if (!kase || kase.authorId !== user.id) return { error: "案例不存在或无权操作" };

  const decision = decideResubmit(kase.status as CaseStatus, kase.rejectedStage as ReviewStage | null);
  if (!decision.ok) return { error: decision.error };

  let saved;
  try {
    saved = await saveUpload(file);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "附件保存失败" };
  }

  // 写时守卫：并发下状态已变则落空
  const { count } = await db.case.updateMany({
    where: { id: caseId, status: kase.status },
    data: {
      title: parsed.data.title,
      categoryId: parsed.data.categoryId,
      ...decision.patch,
      ...saved,
    },
  });
  if (count === 0) return { error: "案例状态已变化，请刷新后重试" };

  redirect(`/cases/${caseId}`);
}
