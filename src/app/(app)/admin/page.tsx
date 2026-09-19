import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ReviewForm } from "@/components/review-form";
import { Card, Empty, PageTitle } from "@/components/ui";
import type { ReviewStage } from "@/lib/case-state";

interface QueueItem {
  id: string;
  title: string;
  authorName: string;
  date: Date;
}

function QueueSection({
  title,
  items,
  stage,
  emptyText,
}: {
  title: string;
  items: QueueItem[];
  stage: ReviewStage;
  emptyText: string;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-base font-semibold text-ink">
        {title}
        <span className="ml-2 rounded-sm bg-surface px-2 py-0.5 text-xs font-medium text-steel">
          {items.length}
        </span>
      </h2>
      {items.length === 0 ? (
        <Empty text={emptyText} />
      ) : (
        <div className="space-y-4">
          {items.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/cases/${c.id}`} className="text-sm font-medium text-ink hover:text-link">
                  {c.title}
                </Link>
                <span className="text-xs text-steel">
                  {c.authorName} · {c.date.toLocaleString("zh-CN")}
                </span>
              </div>
              <ReviewForm caseId={c.id} stage={stage} />
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function AdminQueuePage() {
  await requireAdmin();

  const [firstQueue, finalQueue] = await Promise.all([
    db.case.findMany({
      where: { status: "PENDING_FIRST" },
      orderBy: { submittedAt: "asc" },
      take: 20,
      include: { author: true },
    }),
    db.case.findMany({
      where: { status: "PENDING_FINAL" },
      orderBy: { firstReviewAt: "asc" },
      take: 20,
      include: { author: true },
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageTitle title="审核待办" desc="同一管理员可连续完成初审与终审；驳回必填理由" />
      <QueueSection
        title="待初审"
        stage="FIRST"
        emptyText="没有待初审的案例"
        items={firstQueue.map((c) => ({
          id: c.id,
          title: c.title,
          authorName: c.author.name,
          date: c.submittedAt,
        }))}
      />
      <QueueSection
        title="待终审（定级）"
        stage="FINAL"
        emptyText="没有待终审的案例"
        items={finalQueue.map((c) => ({
          id: c.id,
          title: c.title,
          authorName: c.author.name,
          date: c.firstReviewAt ?? c.submittedAt,
        }))}
      />
    </div>
  );
}
