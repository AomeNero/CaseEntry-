import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { db } from "./db";
import { ROLE, isRole } from "./roles";
import {
  COOKIE_NAME,
  SESSION_DAYS,
  getSecret,
  signSessionToken,
  type SessionPayload,
} from "./session-token";

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    // 本机/内网以 http 跑，secure 保持 false；公网 https 部署时改为 true
    secure: false,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    // 边界校验：载荷缺 sub 或 role 非法视为未登录，而非报错
    if (!payload.sub || !isRole(payload.role)) return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** 会话有效且账号未禁用时返回最新用户记录（角色/禁用状态以数据库为准） */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.sub) return null; // 载荷不完整视为未登录，而非报错
  const user = await db.user.findUnique({ where: { id: session.sub } });
  if (!user || user.disabled) return null;
  return user;
}

/** 可空守卫（action / route 用）：需要 FormState 或 401/403 的调用方取 null 自行决定错误形态 */
export async function getCurrentAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== ROLE.ADMIN) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== ROLE.ADMIN) redirect("/");
  return user;
}
