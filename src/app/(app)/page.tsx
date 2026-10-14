import Link from "next/link";
import { pointsLeaderboard, type LeaderboardRow } from "@/lib/points-queries";
import { recentPublished } from "@/lib/case-queries";
import { GradeBadge } from "@/components/badges";
import { Card, Empty, PageTitle } from "@/components/ui";

function Board({ title, rows }: { title: string; rows: LeaderboardRow[] }) {
  return (
    <Card>
      <h2 className="mb-3 text-base font-semibold text-ink">{title}</h2>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-stone">暂无数据</p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.rank} className="flex items-center gap-3 text-sm">
              <span
                className={`w-6 text-center font-semibold ${
                  r.rank <= 3 ? "text-primary" : "text-stone"
                }`}
              >
                {r.rank}
              </span>
              <span className="flex-1 truncate text-charcoal">{r.name}</span>
              <span className="font-semibold text-ink">{r.points} 分</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export default async function HomePage() {
  const [feed, totalBoard, monthlyBoard] = await Promise.all([
    recentPublished(),
    pointsLeaderboard(),
    pointsLeaderboard(10, new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
  ]);

  return (
    <div>
      <PageTitle title="最近入库" desc="最新通过终审定级的案例" />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section>
          {feed.length === 0 ? (
            <Empty text="还没有入库案例——去「录入案例」提交第一个吧" />
          ) : (
            <div className="divide-y divide-hairline-soft rounded-lg border border-hairline bg-canvas">
              {feed.map((c) => (
                <article key={c.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <Link
                      href={`/cases/${c.id}`}
                      className="block truncate text-sm font-medium text-ink hover:text-link"
                    >
                      {c.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-steel">
                      {c.category.name} · {c.author.name} ·{" "}
                      {c.publishedAt?.toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  {c.grade && <GradeBadge grade={c.grade as "A" | "B" | "C"} />}
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <Board title="积分总榜" rows={totalBoard} />
          <Board title="本月积分榜" rows={monthlyBoard} />
        </aside>
      </div>
    </div>
  );
}
