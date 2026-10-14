import type { Prisma } from "@prisma/client";

/**
 * 可见性策略（唯一来源，REQUIREMENTS：已入库全员可见；过程态仅录入人本人 + admin）。
 * 单案例判定与列表查询条件都从这里取，表面自选错误形态（404 / 403 / 查询过滤）。
 */

interface Viewer {
  id: string;
  role: string; // "USER" | "ADMIN"（Role 常量见 lib/auth）
}

interface CaseRef {
  status: string;
  authorId: string;
}

/** 单案例判定：详情页 / 附件 route 用。 */
export function canView(viewer: Viewer, kase: CaseRef): boolean {
  return (
    kase.status === "PUBLISHED" ||
    kase.authorId === viewer.id ||
    viewer.role === "ADMIN"
  );
}

/** 列表查询条件："此人可见的全部案例"。管理员不加限制；普通用户 = 已入库 ∪ 本人案例。 */
export function visibilityWhere(viewer: Viewer): Prisma.CaseWhereInput {
  if (viewer.role === "ADMIN") return {};
  return { OR: [{ status: "PUBLISHED" }, { authorId: viewer.id }] };
}
