import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { GradeBadge, StatusBadge } from "@/components/badges";
import { Empty, ListCard, PageTitle } from "@/components/ui";
import type { CaseStatus, Grade } from "@/lib/case-state";

export default async function MyCasesPage() {
  const user = await requireUser();
  const cases = await db.case.findMany({
    where: { authorId: user.id },
    orderBy: { submittedAt: "desc" },
    include: { category: true },
  });

  return (
    <div>
      <PageTitle title="我的案例" desc="包含全部状态：待审、已入库、被驳回（驳回后可在详情页修改重交）" />
      {cases.length === 0 ? (
        <Empty text="还没有提交过案例，去「录入案例」提交第一个吧" />
      ) : (
        <ListCard>
          {cases.map((c) => (
            <article key={c.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <Link
                  href={`/cases/${c.id}`}
                  className="block truncate text-sm font-medium text-ink-black transition-colors hover:text-cyan-edge"
                >
                  {c.title}
                </Link>
                <p className="mt-0.5 text-xs text-warm-gray">
                  {c.category.name} · 提交于 {c.submittedAt.toLocaleDateString("zh-CN")}
                  {c.status === "REJECTED" && c.rejectReason ? ` · 驳回：${c.rejectReason.slice(0, 30)}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={c.status as CaseStatus} />
                {c.grade && <GradeBadge grade={c.grade as Grade} />}
              </div>
            </article>
          ))}
        </ListCard>
      )}
    </div>
  );
}
