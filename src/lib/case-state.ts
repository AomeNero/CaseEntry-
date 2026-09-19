/**
 * 案例状态机与积分事件映射（纯函数，无外部依赖，可直接单测）。
 *
 * 状态流转：
 *   PENDING_FIRST --初审通过--> PENDING_FINAL --终审定级--> PUBLISHED
 *   PENDING_FIRST / PENDING_FINAL --驳回--> REJECTED（记录 rejectedStage）
 *   REJECTED --重新提交--> 回到被驳环节
 */

export const CASE_STATUSES = [
  "PENDING_FIRST",
  "PENDING_FINAL",
  "PUBLISHED",
  "REJECTED",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const REVIEW_STAGES = ["FIRST", "FINAL"] as const;
export type ReviewStage = (typeof REVIEW_STAGES)[number];

export const GRADES = ["A", "B", "C"] as const;
export type Grade = (typeof GRADES)[number];

export const POINT_EVENTS = ["SUBMIT", "FIRST_PASS", "FINAL_GRADE"] as const;
export type PointEvent = (typeof POINT_EVENTS)[number];

/** 状态中文标签 */
export const STATUS_LABELS: Record<CaseStatus, string> = {
  PENDING_FIRST: "待初审",
  PENDING_FINAL: "待终审",
  PUBLISHED: "已入库",
  REJECTED: "已驳回",
};

export const GRADE_LABELS: Record<Grade, string> = { A: "A级", B: "B级", C: "C级" };

/** 审核通过后的目标状态 */
export function statusOnApprove(stage: ReviewStage): CaseStatus {
  return stage === "FIRST" ? "PENDING_FINAL" : "PUBLISHED";
}

/** 重新提交后回到被驳环节 */
export function statusOnResubmit(rejectedStage: ReviewStage): CaseStatus {
  return rejectedStage === "FIRST" ? "PENDING_FIRST" : "PENDING_FINAL";
}

/** 合法状态迁移表 */
const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  PENDING_FIRST: ["PENDING_FINAL", "REJECTED"],
  PENDING_FINAL: ["PUBLISHED", "REJECTED"],
  REJECTED: ["PENDING_FIRST", "PENDING_FINAL"],
  PUBLISHED: [],
};

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** 积分事件 → PointsConfig 键（终审定级按等级取键） */
export function configKeyFor(event: PointEvent, grade?: Grade): string {
  if (event === "FINAL_GRADE") {
    if (!grade) throw new Error("终审定级积分必须提供等级");
    return `GRADE_${grade}`;
  }
  return event;
}
