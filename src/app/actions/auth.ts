"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { loginSchema, registerSchema } from "@/lib/validation";
import { ROLE, isRole } from "@/lib/roles";
import { parseForm, type FormState } from "@/lib/form";

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(loginSchema, {
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.ok) return { error: parsed.error };
  const { username, password } = parsed.data;

  const user = await db.user.findUnique({ where: { username } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "用户名或密码错误" };
  }
  if (user.disabled) return { error: "账号已被禁用，请联系管理员" };

  await createSession({
    sub: user.id,
    username: user.username,
    name: user.name,
    // 会话角色仅作冗余载荷；实际权限每请求回库读取。DB 出现垃圾值时回落 USER
    role: isRole(user.role) ? user.role : ROLE.USER,
  });
  redirect("/");
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(registerSchema, {
    username: formData.get("username"),
    password: formData.get("password"),
    name: formData.get("name"),
  });
  if (!parsed.ok) return { error: parsed.error };
  const { username, password, name } = parsed.data;

  const exists = await db.user.findUnique({ where: { username } });
  if (exists) return { error: "该用户名已被注册" };

  const user = await db.user.create({
    data: {
      username,
      passwordHash: await hashPassword(password),
      name,
    },
  });
  await createSession({ sub: user.id, username: user.username, name: user.name, role: ROLE.USER });
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
