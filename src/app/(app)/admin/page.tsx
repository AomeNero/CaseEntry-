import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminQueues } from "@/lib/case-queries";
import { getPointConfigValues } from "@/lib/points";
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
  firstPassPoints,
}: {
  title: string;
  items: QueueItem[];
  stage: ReviewStage;
  emptyText: string;
  firstPassPoints: number;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 font-display text-subheading font-normal text-ink-black">
        {title}
        <span className="ml-2 rounded-full bg-stone-canvas px-2 py-0.5 text-xs font-medium text-warm-gray">
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
                <Link href={`/cases/${c.id}`} className="text-sm font-medium text-ink-black transition-colors hover:text-cyan-edge">
                  {c.title}
                </Link>
                <span className="text-xs text-warm-gray">
                  {c.authorName} · {c.date.toLocaleString("zh-CN")}
                </span>
              </div>
              <ReviewForm caseId={c.id} stage={stage} firstPassPoints={firstPassPoints} />
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function AdminQueuePage() {
  await requireAdmin();

  const [{ firstQueue, finalQueue }, points] = await Promise.all([
    adminQueues(),
    getPointConfigValues(),
  ]);

  return (
    <div className="max-w-3xl">
      <PageTitle title="审核待办" desc="同一管理员可连续完成初审与终审；驳回必填理由" />
      <QueueSection
        title="待初审"
        stage="FIRST"
        emptyText="没有待初审的案例"
        firstPassPoints={points.FIRST_PASS}
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
        firstPassPoints={points.FIRST_PASS}
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
