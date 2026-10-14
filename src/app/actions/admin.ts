"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { pointsConfigEntrySchema } from "@/lib/validation";
import { POINT_CONFIG_KEYS, POINT_CONFIG_LABELS, type PointConfigKey } from "@/lib/points-vocab";
import { isRole } from "@/lib/roles";
import { parseForm, type FormState } from "@/lib/form";

/** 自操作守卫：目标用户非空且非当前管理员自己，返回目标 id；否则 null */
function targetUserId(adminId: string, formData: FormData): string | null {
  const userId = String(formData.get("userId") ?? "");
  return userId && userId !== adminId ? userId : null;
}

/** 禁用/启用账号（不能操作自己） */
export async function setUserDisabledAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = targetUserId(admin.id, formData);
  if (!userId) return;
  const disabled = formData.get("disabled") === "true";

  await db.user.update({ where: { id: userId }, data: { disabled } });
  revalidatePath("/admin/users");
}

/** 提权/降权（不能操作自己） */
export async function setUserRoleAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = targetUserId(admin.id, formData);
  const role = String(formData.get("role") ?? "");
  if (!userId) return;
  if (!isRole(role)) return;

  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}

/** 重置密码为随机临时密码，返回给管理员一次性转告 */
export async function resetUserPasswordAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "用户不存在" };

  const temp = `ce${Math.floor(100000 + Math.random() * 900000)}`;
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(temp) },
  });
  return { success: `临时密码：${temp}（请转告本人尽快修改）` };
}

export async function addCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 20) return { error: "分类名需 1-20 个字符" };

  const exists = await db.category.findUnique({ where: { name } });
  if (exists) return { error: "该分类已存在" };

  await db.category.create({ data: { name } });
  revalidatePath("/admin/categories");
  return { success: `已添加「${name}」` };
}

/** 删除分类（有案例的分类拒绝删除） */
export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("categoryId") ?? "");
  if (!id) return;

  const count = await db.case.count({ where: { categoryId: id } });
  if (count > 0) return; // UI 已禁用，此处双保险
  await db.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}

export async function updatePointsConfigAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const updates: Array<{ key: PointConfigKey; value: number }> = [];
  for (const key of POINT_CONFIG_KEYS) {
    const parsed = parseForm(pointsConfigEntrySchema, {
      key,
      value: Number(formData.get(key)),
    });
    if (!parsed.ok) {
      return { error: `${POINT_CONFIG_LABELS[key]}：${parsed.error}` };
    }
    updates.push(parsed.data);
  }

  // 单事务 upsert：要么全部生效，要么全部不动；缺行（未跑 seed）也能补齐
  await db.$transaction((tx) =>
    Promise.all(
      updates.map((u) =>
        tx.pointsConfig.upsert({
          where: { key: u.key },
          update: { value: u.value },
          create: u,
        })
      )
    )
  );
  revalidatePath("/admin/points");
  return { success: "积分配置已更新" };
}
