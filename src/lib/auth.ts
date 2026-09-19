import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";

const COOKIE_NAME = "session";
const SESSION_DAYS = 7;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("缺少 AUTH_SECRET 环境变量");
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  sub: string;
  username: string;
  name: string;
  role: "USER" | "ADMIN";
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

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

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
