"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { loginSchema, registerSchema } from "@/lib/validation";

export type FormState = { error?: string; success?: string };

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await db.user.findUnique({ where: { username: parsed.data.username } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "用户名或密码错误" };
  }
  if (user.disabled) return { error: "账号已被禁用，请联系管理员" };

  await createSession({ sub: user.id, username: user.username, name: user.name, role: user.role as "USER" | "ADMIN" });
  redirect("/");
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    name: formData.get("name"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const exists = await db.user.findUnique({ where: { username: parsed.data.username } });
  if (exists) return { error: "该用户名已被注册" };

  const user = await db.user.create({
    data: {
      username: parsed.data.username,
      passwordHash: await hashPassword(parsed.data.password),
      name: parsed.data.name,
    },
  });
  await createSession({ sub: user.id, username: user.username, name: user.name, role: "USER" });
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
