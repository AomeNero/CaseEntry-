import { describe, expect, it } from "vitest";
import {
  canTransition,
  configKeyFor,
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

describe("积分事件映射", () => {
  it("提交与初审事件直接作为配置键", () => {
    expect(configKeyFor("SUBMIT")).toBe("SUBMIT");
    expect(configKeyFor("FIRST_PASS")).toBe("FIRST_PASS");
  });

  it("终审定级按等级取配置键", () => {
    expect(configKeyFor("FINAL_GRADE", "A")).toBe("GRADE_A");
    expect(configKeyFor("FINAL_GRADE", "C")).toBe("GRADE_C");
  });

  it("终审事件缺等级时抛错", () => {
    expect(() => configKeyFor("FINAL_GRADE")).toThrow();
  });
});
