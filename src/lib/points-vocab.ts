import type { Grade } from "./case-state";

/**
 * 积分词汇：事件、配置键、标签、默认值、事件→键映射。
 * 纯常量与纯函数、零运行时依赖——可被 seed 脚本与 client 组件安全 import，
 * 因此本文件不得引入 server-only 或任何 IO（发放逻辑见 lib/points）。
 */

/** 积分流水事件（PointsLedger.eventType） */
export const POINT_EVENTS = ["SUBMIT", "FIRST_PASS", "FINAL_GRADE"] as const;
export type PointEvent = (typeof POINT_EVENTS)[number];

/** PointsConfig 表的全部合法键 */
export const POINT_CONFIG_KEYS = [
  "SUBMIT",
  "FIRST_PASS",
  "GRADE_A",
  "GRADE_B",
  "GRADE_C",
] as const;
export type PointConfigKey = (typeof POINT_CONFIG_KEYS)[number];

/** 事件标签（积分流水展示用） */
export const POINT_EVENT_LABELS: Record<PointEvent, string> = {
  SUBMIT: "提交案例",
  FIRST_PASS: "初审通过",
  FINAL_GRADE: "终审定级",
};

/** 配置键标签（积分配置页用） */
export const POINT_CONFIG_LABELS: Record<PointConfigKey, string> = {
  SUBMIT: "提交案例",
  FIRST_PASS: "初审通过",
  GRADE_A: "终审 A 级",
  GRADE_B: "终审 B 级",
  GRADE_C: "终审 C 级",
};

/** REQUIREMENTS 默认积分值（seed 与测试共用，admin 可在后台改） */
export const POINT_DEFAULTS: ReadonlyArray<{ key: PointConfigKey; value: number }> = [
  { key: "SUBMIT", value: 5 },
  { key: "FIRST_PASS", value: 10 },
  { key: "GRADE_A", value: 100 },
  { key: "GRADE_B", value: 50 },
  { key: "GRADE_C", value: 20 },
];

/** 等级 → 配置键映射（Record 保证 Grade 扩展时此处缺键即编译报错，恢复 ADR-0003 的编译期保障） */
const GRADE_CONFIG_KEYS: Record<Grade, PointConfigKey> = {
  A: "GRADE_A",
  B: "GRADE_B",
  C: "GRADE_C",
};

/** 积分事件 → PointsConfig 键（终审定级按等级取键） */
export function configKeyFor(event: PointEvent, grade?: Grade): PointConfigKey {
  if (event === "FINAL_GRADE") {
    if (!grade) throw new Error("终审定级积分必须提供等级");
    return GRADE_CONFIG_KEYS[grade];
  }
  return event;
}
