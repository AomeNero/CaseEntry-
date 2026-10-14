import { describe, expect, it } from "vitest";
import { safeRedirectTo } from "../form";

/** 站内跳转守卫：拒绝协议相对地址（//host、/\host 可被浏览器解析为外部 URL） */
describe("safeRedirectTo", () => {
  it("站内路径原样放行", () => {
    expect(safeRedirectTo("/admin", "/fallback")).toBe("/admin");
    expect(safeRedirectTo("/cases/abc?id=1", "/fallback")).toBe("/cases/abc?id=1");
  });

  it("协议相对地址 //host 跳站外，回落 fallback", () => {
    expect(safeRedirectTo("//evil.com", "/fallback")).toBe("/fallback");
  });

  it("反斜杠变体 /\\host 同样回落 fallback", () => {
    expect(safeRedirectTo("/\\evil.com", "/fallback")).toBe("/fallback");
  });

  it("空串、绝对 URL 与相对路径回落 fallback", () => {
    expect(safeRedirectTo("", "/fallback")).toBe("/fallback");
    expect(safeRedirectTo("https://evil.com", "/fallback")).toBe("/fallback");
    expect(safeRedirectTo("cases/1", "/fallback")).toBe("/fallback");
  });
});
