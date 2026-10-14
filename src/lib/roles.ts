/**
 * 角色词汇（纯常量，零依赖——client 组件与脚本可安全 import）。
 * schema 以 String 存储角色（SQLite 无 enum），此处是唯一合法值清单。
 */

export const ROLES = ["USER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE: Record<Role, Role> = { USER: "USER", ADMIN: "ADMIN" };

export function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}
