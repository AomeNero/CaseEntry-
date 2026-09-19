import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { GradeBadge, StatusBadge } from "@/components/badges";
import { Button, Card, Empty, Input, Label, Select, PageTitle } from "@/components/ui";
import { GRADES } from "@/lib/case-state";

type SP = Record<string, string | string[] | undefined>;
function one(sp: SP, key: string): string {
  const v = sp[key];
  return typeof v === "string" ? v : "";
}

export default async function CasesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const q = one(sp, "q").trim();
  const categoryId = one(sp, "categoryId");
  const grade = one(sp, "grade");
  const from = one(sp, "from");
  const to = one(sp, "to");
  const status = one(sp, "status"); // 仅管理员
  const author = one(sp, "author").trim(); // 仅管理员

  const conditions: Prisma.CaseWhereInput[] = [];

  // 可见性：普通用户仅已入库；管理员可按状态筛（默认全部）
  if (isAdmin) {
    if (status) conditions.push({ status });
  } else {
    conditions.push({ status: "PUBLISHED" });
  }
  if (q) conditions.push({ title: { contains: q } });
  if (categoryId) conditions.push({ categoryId });
  if ((GRADES as readonly string[]).includes(grade)) conditions.push({ grade });
  if (from) conditions.push({ submittedAt: { gte: new Date(from) } });
  if (to) conditions.push({ submittedAt: { lte: new Date(`${to}T23:59:59`) } });
  if (isAdmin && author) {
    const authors = await db.user.findMany({
      where: { OR: [{ name: { contains: author } }, { username: { contains: author } }] },
      select: { id: true },
    });
    conditions.push({ authorId: { in: authors.map((a) => a.id) } });
  }

  const [cases, categories] = await Promise.all([
    db.case.findMany({
      where: { AND: conditions },
      orderBy: { submittedAt: "desc" },
      take: 100,
      include: { author: true, category: true },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageTitle title="案例库" desc={`共 ${cases.length} 条结果${cases.length >= 100 ? "（仅显示前 100 条，请缩小筛选范围）" : ""}`} />

      <Card className="mb-6">
        <form method="get" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2">
            <Label htmlFor="q">标题关键词</Label>
            <Input id="q" name="q" defaultValue={q} placeholder="搜索标题" />
          </div>
          <div>
            <Label htmlFor="categoryId">分类</Label>
            <Select id="categoryId" name="categoryId" defaultValue={categoryId}>
              <option value="">全部</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="grade">等级</Label>
            <Select id="grade" name="grade" defaultValue={grade}>
              <option value="">全部</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>{g} 级</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="from">提交自</Label>
            <Input id="from" name="from" type="date" defaultValue={from} />
          </div>
          <div>
            <Label htmlFor="to">提交至</Label>
            <Input id="to" name="to" type="date" defaultValue={to} />
          </div>
          {isAdmin && (
            <>
              <div>
                <Label htmlFor="status">状态</Label>
                <Select id="status" name="status" defaultValue={status}>
                  <option value="">全部</option>
                  <option value="PENDING_FIRST">待初审</option>
                  <option value="PENDING_FINAL">待终审</option>
                  <option value="PUBLISHED">已入库</option>
                  <option value="REJECTED">已驳回</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="author">录入人</Label>
                <Input id="author" name="author" defaultValue={author} placeholder="姓名或用户名" />
              </div>
            </>
          )}
          <div className="col-span-2 flex items-end gap-2 md:col-span-1">
            <Button type="submit">查询</Button>
            <Link href="/cases">
              <Button type="button" variant="secondary">重置</Button>
            </Link>
          </div>
        </form>
      </Card>

      {cases.length === 0 ? (
        <Empty text="没有符合条件的案例" />
      ) : (
        <div className="divide-y divide-hairline-soft rounded-lg border border-hairline bg-canvas">
          {cases.map((c) => (
            <article key={c.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <Link href={`/cases/${c.id}`} className="block truncate text-sm font-medium text-ink hover:text-link">
                  {c.title}
                </Link>
                <p className="mt-0.5 text-xs text-steel">
                  {c.category.name} · {c.author.name} · {c.submittedAt.toLocaleDateString("zh-CN")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isAdmin && <StatusBadge status={c.status as "PENDING_FIRST" | "PENDING_FINAL" | "PUBLISHED" | "REJECTED"} />}
                {c.grade && <GradeBadge grade={c.grade as "A" | "B" | "C"} />}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
