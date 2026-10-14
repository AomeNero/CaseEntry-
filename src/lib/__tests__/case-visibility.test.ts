import { describe, expect, it } from "vitest";
import { canView, visibilityWhere } from "../case-visibility";

/** 可见性策略（REQUIREMENTS：已入库全员可见；过程态仅录入人本人 + admin） */
describe("canView 单案例判定", () => {
  const kase = { status: "PENDING_FIRST", authorId: "u1" };

  it("已入库全员可见", () => {
    expect(canView({ id: "u2", role: "USER" }, { status: "PUBLISHED", authorId: "u1" })).toBe(true);
  });

  it("过程态：录入人本人可见", () => {
    expect(canView({ id: "u1", role: "USER" }, kase)).toBe(true);
  });

  it("过程态：管理员可见他人案例", () => {
    expect(canView({ id: "admin", role: "ADMIN" }, kase)).toBe(true);
  });

  it("过程态：他人不可见（待初审/待终审/已驳回）", () => {
    expect(canView({ id: "u2", role: "USER" }, kase)).toBe(false);
    expect(canView({ id: "u2", role: "USER" }, { status: "PENDING_FINAL", authorId: "u1" })).toBe(false);
    expect(canView({ id: "u2", role: "USER" }, { status: "REJECTED", authorId: "u1" })).toBe(false);
  });
});

describe("visibilityWhere 列表查询条件", () => {
  it("管理员不加限制（返回空条件）", () => {
    expect(visibilityWhere({ id: "admin", role: "ADMIN" })).toEqual({});
  });

  it("普通用户 = 已入库 ∪ 本人案例", () => {
    expect(visibilityWhere({ id: "u1", role: "USER" })).toEqual({
      OR: [{ status: "PUBLISHED" }, { authorId: "u1" }],
    });
  });
});
