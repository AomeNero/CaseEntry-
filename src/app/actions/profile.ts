"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { changePasswordSchema } from "@/lib/validation";
import { parseForm, type FormState } from "@/lib/form";

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();

  const parsed = parseForm(changePasswordSchema, {
    oldPassword: formData.get("oldPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.ok) return { error: parsed.error };
  const { oldPassword, newPassword } = parsed.data;

  if (!(await verifyPassword(oldPassword, user.passwordHash))) {
    return { error: "当前密码不正确" };
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  return { success: "密码已修改" };
}
