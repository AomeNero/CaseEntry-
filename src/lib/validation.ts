import { z } from "zod";
import { POINT_CONFIG_KEYS } from "./points-vocab";

/** 上传白名单与限制（与 lib/upload.ts 共用） */
export const ALLOWED_EXTENSIONS = [
  ".doc",
  ".docx",
  ".pdf",
  ".txt",
  ".md",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
] as const;
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const registerSchema = z.object({
  username: z
    .string()
    .min(2, "用户名至少 2 个字符")
    .max(30, "用户名最多 30 个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "用户名仅支持字母、数字、下划线"),
  password: z.string().min(6, "密码至少 6 位").max(72, "密码最多 72 位"),
  name: z.string().trim().min(1, "请填写姓名").max(20, "姓名最多 20 个字符"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码"),
});

export const caseFormSchema = z.object({
  title: z.string().trim().min(1, "请填写标题").max(100, "标题最多 100 字"),
  categoryId: z.string().min(1, "请选择产品分类"),
});

/** 审核动作按环节耦合：初审=通过/驳回；终审=定级/驳回。终审不存在"直接通过"。 */
export const reviewActionSchema = z.discriminatedUnion("action", [
  z.object({ stage: z.literal("FIRST"), action: z.literal("approve") }),
  z.object({
    stage: z.literal("FINAL"),
    action: z.literal("grade"),
    grade: z.enum(["A", "B", "C"]),
  }),
  z.object({
    stage: z.enum(["FIRST", "FINAL"]),
    action: z.literal("reject"),
    reason: z.string().trim().min(1, "驳回必须填写理由").max(500),
  }),
]);

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "请输入当前密码"),
  newPassword: z.string().min(6, "新密码至少 6 位").max(72),
});

export const pointsConfigEntrySchema = z.object({
  key: z.enum(POINT_CONFIG_KEYS),
  value: z.number().int("必须为整数").min(0, "不能为负数").max(100000),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ReviewActionInput = z.infer<typeof reviewActionSchema>;
