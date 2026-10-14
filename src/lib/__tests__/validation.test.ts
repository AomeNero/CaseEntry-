import { describe, expect, it } from "vitest";
import { reviewActionSchema } from "../validation";

/** reviewActionSchema 必须按环节耦合动作：初审=通过/驳回，终审=定级/驳回 */
describe("审核动作 schema 的环节耦合", () => {
  it("初审：通过 / 驳回（带理由）合法", () => {
    expect(reviewActionSchema.safeParse({ stage: "FIRST", action: "approve" }).success).toBe(true);
    expect(
      reviewActionSchema.safeParse({ stage: "FIRST", action: "reject", reason: "理由" }).success
    ).toBe(true);
  });

  it("终审：定级（A/B/C）/ 驳回（带理由）合法", () => {
    expect(
      reviewActionSchema.safeParse({ stage: "FINAL", action: "grade", grade: "B" }).success
    ).toBe(true);
    expect(
      reviewActionSchema.safeParse({ stage: "FINAL", action: "reject", reason: "理由" }).success
    ).toBe(true);
  });

  it("洞用例：终审不允许直接通过", () => {
    expect(reviewActionSchema.safeParse({ stage: "FINAL", action: "approve" }).success).toBe(false);
  });

  it("初审不允许定级", () => {
    expect(
      reviewActionSchema.safeParse({ stage: "FIRST", action: "grade", grade: "A" }).success
    ).toBe(false);
  });

  it("驳回必须填写理由（含纯空白）", () => {
    expect(reviewActionSchema.safeParse({ stage: "FIRST", action: "reject", reason: " " }).success).toBe(
      false
    );
    expect(reviewActionSchema.safeParse({ stage: "FINAL", action: "reject" }).success).toBe(false);
  });

  it("环节取值非法被拒", () => {
    expect(
      reviewActionSchema.safeParse({ stage: "SECOND", action: "approve" }).success
    ).toBe(false);
  });
});
