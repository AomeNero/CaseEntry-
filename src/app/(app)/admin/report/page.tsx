import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Button, Card, Input, Label, PageTitle } from "@/components/ui";

type SP = Record<string, string | string[] | undefined>;
function one(sp: SP, key: string): string {
  const v = sp[key];
  return typeof v === "string" ? v : "";
}

export default async function AdminReportPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;

  // 默认统计本月
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const fromStr = one(sp, "from") || monthStart.toISOString().slice(0, 10);
  const toStr = one(sp, "to") || now.toISOString().slice(0, 10);
  const from = new Date(fromStr);
  const to = new Date(`${toStr}T23:59:59`);

  // 期间积分流水、期间提交案例数、累计积分 三个维度聚合
  const [ledgerRows, caseRows, totals] = await Promise.all([
    db.pointsLedger.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: from, lte: to } },
      _sum: { points: true },
    }),
    db.case.groupBy({
      by: ["authorId"],
      where: { submittedAt: { gte: from, lte: to } },
      _count: true,
    }),
    db.pointsLedger.groupBy({
      by: ["userId"],
      _sum: { points: true },
    }),
  ]);

  const users = await db.user.findMany({ select: { id: true, name: true, username: true } });
  const nameOf = new Map(users.map((u) => [u.id, u]));

  const ledgerByUser = new Map(ledgerRows.map((r) => [r.userId, r._sum.points ?? 0]));
  const caseByUser = new Map(caseRows.map((r) => [r.authorId, r._count]));
  const totalByUser = new Map(totals.map((r) => [r.userId, r._sum.points ?? 0]));

  // 名单 = 期间有积分或有提交的人
  const involved = new Set([...ledgerByUser.keys(), ...caseByUser.keys()]);
  const rows = [...involved]
    .map((id) => ({
      user: nameOf.get(id),
      cases: caseByUser.get(id) ?? 0,
      points: ledgerByUser.get(id) ?? 0,
      total: totalByUser.get(id) ?? 0,
    }))
    .filter((r) => r.user)
    .sort((a, b) => b.points - a.points);

  const sumCases = rows.reduce((s, r) => s + r.cases, 0);
  const sumPoints = rows.reduce((s, r) => s + r.points, 0);

  return (
    <div>
      <PageTitle title="积分报表" desc="按时间段查询录入人员名单与积分汇总" />

      <Card className="mb-6">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="from">开始日期</Label>
            <Input id="from" name="from" type="date" defaultValue={fromStr} />
          </div>
          <div>
            <Label htmlFor="to">结束日期</Label>
            <Input id="to" name="to" type="date" defaultValue={toStr} />
          </div>
          <Button type="submit">查询</Button>
        </form>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-hairline bg-canvas">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface-soft text-left text-xs font-semibold text-steel">
              <th className="px-4 py-3">录入人</th>
              <th className="px-4 py-3">用户名</th>
              <th className="px-4 py-3 text-right">期间提交案例</th>
              <th className="px-4 py-3 text-right">期间积分</th>
              <th className="px-4 py-3 text-right">累计积分</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-soft">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-stone">
                  该时间段内没有录入记录
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.user!.id} className="text-charcoal">
                  <td className="px-4 py-3 font-medium">{r.user!.name}</td>
                  <td className="px-4 py-3 text-slate">{r.user!.username}</td>
                  <td className="px-4 py-3 text-right">{r.cases}</td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">{r.points}</td>
                  <td className="px-4 py-3 text-right">{r.total}</td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-hairline bg-surface-soft font-semibold text-ink">
                <td className="px-4 py-3" colSpan={2}>
                  合计（{rows.length} 人）
                </td>
                <td className="px-4 py-3 text-right">{sumCases}</td>
                <td className="px-4 py-3 text-right text-primary">{sumPoints}</td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
