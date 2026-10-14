import type { z } from "zod";

/** server action 表单状态（useActionState 约定的返回形状） */
export type FormState = { error?: string; success?: string };

/** 表单解析结果：ok 时携带 schema 推断的数据，否则携带首条错误文案 */
export type FormParse<T> = { ok: true; data: T } | { ok: false; error: string };

/** schema 安全解析 + 错误转首条文案（server action 表单统一入口） */
export function parseForm<S extends z.ZodTypeAny>(schema: S, raw: Record<string, unknown>): FormParse<z.infer<S>> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  return { ok: true, data: parsed.data };
}

/** 站内跳转目标守卫：仅接受单个 / 开头的站内路径，其余回落 fallback。
 *  拒绝 //host 与 /\host——两者都是协议相对地址，redirect 会跳站外。 */
export function safeRedirectTo(raw: string, fallback: string): string {
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
