import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { userTotalPoints } from "@/lib/points-queries";
import { ChangePasswordForm } from "@/components/change-password-form";
import { Card, Empty, PageTitle } from "@/components/ui";
import { POINT_EVENT_LABELS, type PointEvent } from "@/lib/points-vocab";

export default async function ProfilePage() {
  const user = await requireUser();
  const [total, records] = await Promise.all([
    userTotalPoints(user.id),
    db.pointsLedger.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { case: { select: { title: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageTitle title="个人中心" />

      <Card className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <div>
          <p className="text-sm text-warm-gray">累计积分</p>
          <p className="font-display text-3xl font-normal text-ink-black">{total}</p>
        </div>
        <div>
          <p className="text-sm text-warm-gray">用户名</p>
          <p className="text-base text-ink-black">{user.username}</p>
        </div>
        <div>
          <p className="text-sm text-warm-gray">姓名</p>
          <p className="text-base text-ink-black">{user.name}</p>
        </div>
      </Card>

      <section>
        <h2 className="mb-3 font-display text-subheading font-normal text-ink-black">积分流水（最近 50 条）</h2>
        {records.length === 0 ? (
          <Empty text="还没有积分记录" />
        ) : (
          <div className="divide-y divide-stone-border rounded-cards border border-stone-border bg-pure-white">
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink-black">
                    {POINT_EVENT_LABELS[r.eventType as PointEvent] ?? r.eventType} · {r.case.title}
                  </p>
                  <p className="mt-0.5 text-xs text-warm-gray">{r.createdAt.toLocaleString("zh-CN")}</p>
                </div>
                <span className="shrink-0 text-sm font-medium text-ink-black">+{r.points}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-subheading font-normal text-ink-black">修改密码</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
