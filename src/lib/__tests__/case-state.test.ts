import { describe, expect, it } from "vitest";
import {
  canTransition,
  decideResubmit,
  decideReview,
  stageForStatus,
  statusOnApprove,
  statusOnResubmit,
} from "../case-state";

describe("案例状态机", () => {
  it("初审通过进入待终审", () => {
    expect(statusOnApprove("FIRST")).toBe("PENDING_FINAL");
  });

  it("终审通过进入已入库", () => {
    expect(statusOnApprove("FINAL")).toBe("PUBLISHED");
  });

  it("重新提交回到被驳环节", () => {
    expect(statusOnResubmit("FIRST")).toBe("PENDING_FIRST");
    expect(statusOnResubmit("FINAL")).toBe("PENDING_FINAL");
  });

  it("合法迁移：待初审→待终审/驳回，待终审→入库/驳回，驳回→重新提交", () => {
    expect(canTransition("PENDING_FIRST", "PENDING_FINAL")).toBe(true);
    expect(canTransition("PENDING_FIRST", "REJECTED")).toBe(true);
    expect(canTransition("PENDING_FINAL", "PUBLISHED")).toBe(true);
    expect(canTransition("PENDING_FINAL", "REJECTED")).toBe(true);
    expect(canTransition("REJECTED", "PENDING_FIRST")).toBe(true);
    expect(canTransition("REJECTED", "PENDING_FINAL")).toBe(true);
  });

  it("非法迁移被拒绝", () => {
    expect(canTransition("PENDING_FIRST", "PUBLISHED")).toBe(false); // 跳过终审
    expect(canTransition("PUBLISHED", "REJECTED")).toBe(false); // 入库后终态
    expect(canTransition("PUBLISHED", "PENDING_FIRST")).toBe(false);
    expect(canTransition("REJECTED", "PUBLISHED")).toBe(false); // 驳回不能直接入库
  });
});

describe("status → 环节逆向映射", () => {
  it("待审状态映射到所属环节，其他状态无环节", () => {
    expect(stageForStatus("PENDING_FIRST")).toBe("FIRST");
    expect(stageForStatus("PENDING_FINAL")).toBe("FINAL");
    expect(stageForStatus("PUBLISHED")).toBeNull();
    expect(stageForStatus("REJECTED")).toBeNull();
  });
});

describe("审核决策 decideReview", () => {
  const NOW = new Date("2026-10-14T00:00:00Z");

  it("初审通过：待初审→待终审，记录初审人与时间，发初审积分", () => {
    const d = decideReview("PENDING_FIRST", {
      stage: "FIRST",
      actorId: "admin1",
      action: { type: "approve" },
      now: NOW,
    });
    expect(d.ok).toBe(true);
    if (!d.ok) return;
    expect(d.patch).toMatchObject({
      status: "PENDING_FINAL",
      firstReviewerId: "admin1",
      firstReviewAt: NOW,
    });
    expect(d.pointEvent).toEqual({ eventType: "FIRST_PASS" });
  });

  it("终审定级：待终审→已入库，记录等级、终审人与入库时间，发定级积分", () => {
    const d = decideReview("PENDING_FINAL", {
      stage: "FINAL",
      actorId: "admin1",
      action: { type: "grade", grade: "B" },
      now: NOW,
    });
    expect(d.ok).toBe(true);
    if (!d.ok) return;
    expect(d.patch).toMatchObject({
      status: "PUBLISHED",
      grade: "B",
      finalReviewerId: "admin1",
      finalReviewAt: NOW,
      publishedAt: NOW,
    });
    expect(d.pointEvent).toEqual({ eventType: "FINAL_GRADE", grade: "B" });
  });

  it("两阶段驳回均记录被驳环节与理由", () => {
    const first = decideReview("PENDING_FIRST", {
      stage: "FIRST",
      actorId: "admin1",
      action: { type: "reject", reason: "图片不清晰" },
      now: NOW,
    });
    expect(first.ok && first.patch).toMatchObject({
      status: "REJECTED",
      rejectedStage: "FIRST",
      rejectReason: "图片不清晰",
    });
    const final = decideReview("PENDING_FINAL", {
      stage: "FINAL",
      actorId: "admin1",
      action: { type: "reject", reason: "需补充实测数据" },
      now: NOW,
    });
    expect(final.ok && final.patch).toMatchObject({
      status: "REJECTED",
      rejectedStage: "FINAL",
      rejectReason: "需补充实测数据",
    });
  });

  it("洞用例：终审阶段不能直接通过，必须定级", () => {
    const d = decideReview("PENDING_FINAL", {
      stage: "FINAL",
      actorId: "admin1",
      action: { type: "approve" },
      now: NOW,
    });
    expect(d.ok).toBe(false);
  });

  it("初审阶段不能定级", () => {
    const d = decideReview("PENDING_FIRST", {
      stage: "FIRST",
      actorId: "admin1",
      action: { type: "grade", grade: "A" },
      now: NOW,
    });
    expect(d.ok).toBe(false);
  });

  it("案例状态与审核环节不匹配被拒", () => {
    expect(
      decideReview("PENDING_FINAL", { stage: "FIRST", actorId: "a", action: { type: "approve" }, now: NOW }).ok
    ).toBe(false);
    expect(
      decideReview("PENDING_FIRST", { stage: "FINAL", actorId: "a", action: { type: "grade", grade: "A" }, now: NOW }).ok
    ).toBe(false);
    expect(
      decideReview("PUBLISHED", { stage: "FINAL", actorId: "a", action: { type: "grade", grade: "A" }, now: NOW }).ok
    ).toBe(false);
    expect(
      decideReview("REJECTED", { stage: "FIRST", actorId: "a", action: { type: "approve" }, now: NOW }).ok
    ).toBe(false);
  });

  it("驳回理由必填（含纯空白）", () => {
    expect(
      decideReview("PENDING_FIRST", { stage: "FIRST", actorId: "a", action: { type: "reject", reason: "" }, now: NOW }).ok
    ).toBe(false);
    expect(
      decideReview("PENDING_FIRST", { stage: "FIRST", actorId: "a", action: { type: "reject", reason: "   " }, now: NOW }).ok
    ).toBe(false);
  });
});

describe("重交决策 decideResubmit", () => {
  it("驳回案例重交回到被驳环节，清除驳回痕迹", () => {
    const d = decideResubmit("REJECTED", "FINAL");
    expect(d.ok).toBe(true);
    if (!d.ok) return;
    expect(d.patch).toEqual({ status: "PENDING_FINAL", rejectedStage: null, rejectReason: null });
    expect(decideResubmit("REJECTED", "FIRST").ok).toBe(true);
  });

  it("非驳回状态不可重交", () => {
    expect(decideResubmit("PENDING_FIRST", "FIRST").ok).toBe(false);
    expect(decideResubmit("PENDING_FINAL", "FINAL").ok).toBe(false);
    expect(decideResubmit("PUBLISHED", null).ok).toBe(false);
  });

  it("驳回态但缺被驳环节标记被拒（数据完整性）", () => {
    expect(decideResubmit("REJECTED", null).ok).toBe(false);
  });
});
