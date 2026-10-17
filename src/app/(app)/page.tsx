import Link from "next/link";
import { pointsLeaderboard, type LeaderboardRow } from "@/lib/points-queries";
import { recentPublished } from "@/lib/case-queries";
import { GradeBadge } from "@/components/badges";
import { Card, Empty, ListCard } from "@/components/ui";

/** 首页克制 hero：标题一处高亮 + 一句副题（高亮短语全站配额：首页/404 各一） */
function Hero() {
  return (
    <section className="mb-10">
      <h1 className="font-display text-heading-sm font-normal text-ink-black">
        把好案例，
        <span className="rounded bg-sky-wash px-2 text-cyan-edge">攒成积分</span>
      </h1>
      <p className="mt-2 text-sm text-warm-gray">
        提交产品案例，经初审、终审定级入库，按等级发放积分。
      </p>
    </section>
  );
}

function Board({ title, rows }: { title: string; rows: LeaderboardRow[] }) {
  return (
    <Card>
      <h2 className="mb-2 font-display text-subheading font-normal text-ink-black">{title}</h2>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-warm-gray">暂无数据</p>
      ) : (
        <ol className="divide-y divide-stone-border">
          {rows.map((r) => (
            <li key={r.rank} className="flex items-center gap-3 py-2 text-sm">
              <span
                className={`w-6 text-center font-display ${
                  r.rank <= 3 ? "text-ink-black" : "text-ash-gray"
                }`}
              >
                {r.rank}
              </span>
              <span className="flex-1 truncate text-ink-black">{r.name}</span>
              <span className="font-medium text-ink-black">{r.points} 分</span>
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
      <Hero />

      <div className="grid gap-6 md:grid-cols-2">
        <Board title="积分总榜" rows={totalBoard} />
        <Board title="本月积分榜" rows={monthlyBoard} />
      </div>

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="font-display text-subheading font-normal text-ink-black">最近入库</h2>
          <p className="mt-0.5 text-sm text-warm-gray">最新通过终审定级的案例</p>
        </div>
        {feed.length === 0 ? (
          <Empty text="还没有入库案例——去「录入案例」提交第一个吧" />
        ) : (
          <ListCard>
            {feed.map((c) => (
              <article key={c.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <Link
                    href={`/cases/${c.id}`}
                    className="block truncate text-sm font-medium text-ink-black transition-colors hover:text-cyan-edge"
                  >
                    {c.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-warm-gray">
                    {c.category.name} · {c.author.name} ·{" "}
                    {c.publishedAt?.toLocaleDateString("zh-CN")}
                  </p>
                </div>
                {c.grade && <GradeBadge grade={c.grade as "A" | "B" | "C"} />}
              </article>
            ))}
          </ListCard>
        )}
      </section>
    </div>
  );
}
