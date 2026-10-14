import { beforeAll, describe, expect, it } from "vitest";
import { jwtVerify } from "jose";
import { isRole, ROLE, ROLES } from "../roles";
import { COOKIE_NAME, SESSION_DAYS, signSessionToken } from "../session-token";

describe("角色词汇", () => {
  it("只有 USER 与 ADMIN 两个合法值", () => {
    expect(ROLES).toEqual(["USER", "ADMIN"]);
    expect(ROLE.USER).toBe("USER");
    expect(ROLE.ADMIN).toBe("ADMIN");
  });

  it("isRole 精确匹配（大小写敏感、拒绝垃圾值）", () => {
    expect(isRole("USER")).toBe(true);
    expect(isRole("ADMIN")).toBe(true);
    expect(isRole("admin")).toBe(false);
    expect(isRole("ROOT")).toBe(false);
    expect(isRole("")).toBe(false);
    expect(isRole(null)).toBe(false);
    expect(isRole(123)).toBe(false);
  });
});

describe("会话 token 格式（唯一实现，auth 与 smoke 双 adapter 共用）", () => {
  beforeAll(() => {
    process.env.AUTH_SECRET ??= "vitest-test-secret";
  });

  it("签名后可被 jwtVerify 解回载荷", async () => {
    const token = await signSessionToken({
      sub: "u1",
      username: "alice",
      name: "爱丽丝",
      role: ROLE.USER,
    });
    const { payload } = await jwtVerify(token, new TextEncoder().encode("vitest-test-secret"));
    expect(payload.sub).toBe("u1");
    expect(payload.username).toBe("alice");
    expect(payload.name).toBe("爱丽丝");
    expect(payload.role).toBe("USER");
  });

  it("密钥不匹配时验证失败（篡改检测）", async () => {
    const token = await signSessionToken({
      sub: "u1",
      username: "alice",
      name: "爱丽丝",
      role: ROLE.USER,
    });
    await expect(jwtVerify(token, new TextEncoder().encode("wrong-secret"))).rejects.toThrow();
  });

  it("Cookie 名与有效期常量稳定（HTTP 冒烟脚本依赖）", () => {
    expect(COOKIE_NAME).toBe("session");
    expect(SESSION_DAYS).toBe(7);
  });
});
