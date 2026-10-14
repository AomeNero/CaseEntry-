import { describe, expect, it } from "vitest";
import {
  configKeyFor,
  POINT_CONFIG_KEYS,
  POINT_CONFIG_LABELS,
  POINT_DEFAULTS,
  POINT_EVENT_LABELS,
  POINT_EVENTS,
} from "../points-vocab";

/** 积分词汇单一来源：事件、配置键、标签、默认值、键映射 */
describe("积分词汇", () => {
  it("事件三值，配置键五值（与 PointsConfig 表一致）", () => {
    expect(POINT_EVENTS).toEqual(["SUBMIT", "FIRST_PASS", "FINAL_GRADE"]);
    expect(POINT_CONFIG_KEYS).toEqual(["SUBMIT", "FIRST_PASS", "GRADE_A", "GRADE_B", "GRADE_C"]);
  });

  it("事件标签覆盖全部事件且非空", () => {
    for (const e of POINT_EVENTS) {
      expect(POINT_EVENT_LABELS[e], `缺少事件标签: ${e}`).toBeTruthy();
    }
  });

  it("配置键标签覆盖全部配置键且非空", () => {
    for (const k of POINT_CONFIG_KEYS) {
      expect(POINT_CONFIG_LABELS[k], `缺少配置键标签: ${k}`).toBeTruthy();
    }
  });

  it("默认积分值与 REQUIREMENTS 一致（提交5/初审10/A100/B50/C20）", () => {
    expect(Object.fromEntries(POINT_DEFAULTS.map((p) => [p.key, p.value]))).toEqual({
      SUBMIT: 5,
      FIRST_PASS: 10,
      GRADE_A: 100,
      GRADE_B: 50,
      GRADE_C: 20,
    });
  });
});

describe("积分事件 → 配置键映射", () => {
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
