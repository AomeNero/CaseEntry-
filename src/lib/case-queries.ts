import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { GRADES } from "./case-state";
import { visibilityWhere } from "./case-visibility";

/**
 * 案例读取（重复形状的唯一实现）：案例库、详情、首页动态、管理员队列、分类字典。
 * include / orderBy / take / 可见性 where 的知识都住在这里，页面只消费结果。
 * 写入不在此文件（写路径见 src/app/actions + case-state 的 decide*）。
 */

const CASE_INCLUDE = { author: true, category: true } satisfies Prisma.CaseInclude;

export type CaseWithRelations = Prisma.CaseGetPayload<{ include: typeof CASE_INCLUDE }>;

export interface CaseListFilters {
  /** 标题关键词 */
  q?: string;
  categoryId?: string;
  grade?: string;
  /** 提交日期起（YYYY-MM-DD） */
  from?: string;
  /** 提交日期止（YYYY-MM-DD，含当天） */
  to?: string;
  /** 状态筛选（仅管理员生效，普通用户的可见性条件不因本参数放宽） */
  status?: string;
  /** 录入人姓名/用户名（仅管理员生效） */
  author?: string;
}

/** 案例库列表：可见性策略 + 筛选，提交时间倒序，上限 100。
 *  筛选条件一律 AND 在可见性条件之内——只收窄、永不放宽，任何调用方都无法借此越权。 */
export async function listCases(
  viewer: { id: string; role: string },
  f: CaseListFilters = {}
): Promise<CaseWithRelations[]> {
  const conditions: Prisma.CaseWhereInput[] = [visibilityWhere(viewer)];

  if (f.status) conditions.push({ status: f.status });
  if (f.q) conditions.push({ title: { contains: f.q } });
  if (f.categoryId) conditions.push({ categoryId: f.categoryId });
  if ((GRADES as readonly string[]).includes(f.grade ?? "")) conditions.push({ grade: f.grade });
  if (f.from) conditions.push({ submittedAt: { gte: new Date(f.from) } });
  if (f.to) conditions.push({ submittedAt: { lte: new Date(`${f.to}T23:59:59`) } });
  if (f.author) {
    const authors = await db.user.findMany({
      where: { OR: [{ name: { contains: f.author } }, { username: { contains: f.author } }] },
      select: { id: true },
    });
    conditions.push({ authorId: { in: authors.map((a) => a.id) } });
  }

  return db.case.findMany({
    where: { AND: conditions },
    orderBy: { submittedAt: "desc" },
    take: 100,
    include: CASE_INCLUDE,
  });
}

/** 案例详情（含作者与分类）；不存在返回 null */
export function getCaseDetail(id: string) {
  return db.case.findUnique({ where: { id }, include: CASE_INCLUDE });
}

/** 首页「最近入库」动态：最新定级入库的案例 */
export function recentPublished(limit = 10): Promise<CaseWithRelations[]> {
  return db.case.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: CASE_INCLUDE,
  });
}

/** 管理员审核双队列：待初审按提交时间、待终审按初审时间，各取前 N */
export async function adminQueues(take = 20) {
  const [firstQueue, finalQueue] = await Promise.all([
    db.case.findMany({
      where: { status: "PENDING_FIRST" },
      orderBy: { submittedAt: "asc" },
      take,
      include: { author: true },
    }),
    db.case.findMany({
      where: { status: "PENDING_FINAL" },
      orderBy: { firstReviewAt: "asc" },
      take,
      include: { author: true },
    }),
  ]);
  return { firstQueue, finalQueue };
}

/** 分类字典（表单下拉与筛选器用） */
export function listCategories() {
  return db.category.findMany({ orderBy: { name: "asc" } });
}
