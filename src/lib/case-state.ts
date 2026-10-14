/**
 * 案例状态机与积分事件映射（纯函数，无外部依赖，可直接单测）。
 *
 * 状态流转：
 *   PENDING_FIRST --初审通过--> PENDING_FINAL --终审定级--> PUBLISHED
 *   PENDING_FIRST / PENDING_FINAL --驳回--> REJECTED（记录 rejectedStage）
 *   REJECTED --重新提交--> 回到被驳环节
 *
 * 所有状态写入必须经由 decideReview / decideResubmit 取得补丁，
 * 并以 updateMany({ where: { id, status: 当前状态 } }) 应用——写时守卫，并发安全。
 */
import type { Prisma } from "@prisma/client";

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

// ---------------------------------------------------------------------------
// 状态迁移决策（唯一执法点）
// ---------------------------------------------------------------------------

/** 审核动作（环节耦合：初审=通过/驳回；终审=定级/驳回） */
export type ReviewActionInput =
  | { type: "approve" }
  | { type: "reject"; reason: string }
  | { type: "grade"; grade: Grade };

export interface ReviewDecisionInput {
  stage: ReviewStage;
  /** 审核人（写入审核人字段） */
  actorId: string;
  action: ReviewActionInput;
  /** 可注入时钟，缺省当前时间 */
  now?: Date;
}

/** 迁移决策：ok 时给出完整写入补丁与应发积分事件；否则给出领域错误文案 */
export type Decision =
  | {
      ok: true;
      patch: Prisma.CaseUpdateManyMutationInput;
      pointEvent?: { eventType: PointEvent; grade?: Grade };
    }
  | { ok: false; error: string };

/** 各审核环节要求的当前状态 */
const EXPECTED_STATUS: Record<ReviewStage, CaseStatus> = {
  FIRST: "PENDING_FIRST",
  FINAL: "PENDING_FINAL",
};

/**
 * 审核动作的唯一执法点：给定当前状态与（环节, 动作），要么返回完整迁移补丁，
 * 要么返回领域错误。环节与动作在此强耦合——终审不存在"直接通过"，必须定级。
 */
export function decideReview(current: CaseStatus, input: ReviewDecisionInput): Decision {
  const { stage, actorId, action } = input;
  const now = input.now ?? new Date();

  if (current !== EXPECTED_STATUS[stage]) {
    return { ok: false, error: "案例状态已变化，请刷新后重试" };
  }

  if (action.type === "approve") {
    if (stage !== "FIRST") {
      return { ok: false, error: "终审阶段请定级（A/B/C），不能直接通过" };
    }
    const target = statusOnApprove(stage);
    if (!canTransition(current, target)) return { ok: false, error: "非法状态迁移" };
    return {
      ok: true,
      patch: { status: target, firstReviewerId: actorId, firstReviewAt: now },
      pointEvent: { eventType: "FIRST_PASS" },
    };
  }

  if (action.type === "grade") {
    if (stage !== "FINAL") {
      return { ok: false, error: "初审阶段不能定级" };
    }
    const target: CaseStatus = "PUBLISHED";
    if (!canTransition(current, target)) return { ok: false, error: "非法状态迁移" };
    return {
      ok: true,
      patch: {
        status: target,
        grade: action.grade,
        finalReviewerId: actorId,
        finalReviewAt: now,
        publishedAt: now,
      },
      pointEvent: { eventType: "FINAL_GRADE", grade: action.grade },
    };
  }

  const reason = action.reason.trim();
  if (!reason) return { ok: false, error: "驳回必须填写理由" };
  const target: CaseStatus = "REJECTED";
  if (!canTransition(current, target)) return { ok: false, error: "非法状态迁移" };
  return {
    ok: true,
    patch: { status: target, rejectedStage: stage, rejectReason: reason },
  };
}

/** 重交决策：仅驳回态可重交，回到被驳环节并清除驳回痕迹 */
export function decideResubmit(current: CaseStatus, rejectedStage: ReviewStage | null): Decision {
  if (current !== "REJECTED") return { ok: false, error: "当前状态不可重新提交" };
  if (!rejectedStage) return { ok: false, error: "案例数据异常：缺少被驳环节标记" };
  const target = statusOnResubmit(rejectedStage);
  return {
    ok: true,
    patch: { status: target, rejectedStage: null, rejectReason: null },
  };
}
