import { SignJWT } from "jose";
import type { Role } from "./roles";

/**
 * 会话 token 格式的唯一实现（纯 jose，无 server-only/next 依赖）。
 * 两个 adapter 共用：lib/auth（Next httpOnly cookie）与 scripts/smoke（HTTP 冒烟脚本）。
 * 改动签名算法、有效期或载荷结构时，两处调用方无需同步修改。
 */

export const COOKIE_NAME = "session";
export const SESSION_DAYS = 7;

export interface SessionPayload {
  sub: string;
  username: string;
  name: string;
  role: Role;
}

export function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("缺少 AUTH_SECRET 环境变量");
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}
