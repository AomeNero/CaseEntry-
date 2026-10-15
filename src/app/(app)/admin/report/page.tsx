import { requireAdmin } from "@/lib/auth";
import { pointsReport } from "@/lib/points-queries";
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

  // 口径统一见 lib/points-queries（期间案例数/期间积分/累计积分一处聚合）
  const rows = await pointsReport(from, to);

  const sumCases = rows.reduce((s, r) => s + r.casesInPeriod, 0);
  const sumPoints = rows.reduce((s, r) => s + r.pointsInPeriod, 0);

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

      <div className="overflow-x-auto rounded-cards border border-stone-border bg-pure-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-stone-border bg-stone-canvas text-left text-xs font-medium text-warm-gray">
              <th className="px-4 py-3">录入人</th>
              <th className="px-4 py-3">用户名</th>
              <th className="px-4 py-3 text-right">期间提交案例</th>
              <th className="px-4 py-3 text-right">期间积分</th>
              <th className="px-4 py-3 text-right">累计积分</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-warm-gray">
                  该时间段内没有录入记录
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.userId} className="text-ink-black">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-warm-gray">{r.username}</td>
                  <td className="px-4 py-3 text-right">{r.casesInPeriod}</td>
                  <td className="px-4 py-3 text-right font-medium">{r.pointsInPeriod}</td>
                  <td className="px-4 py-3 text-right">{r.pointsTotal}</td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-stone-border bg-stone-canvas font-medium text-ink-black">
                <td className="px-4 py-3" colSpan={2}>
                  合计（{rows.length} 人）
                </td>
                <td className="px-4 py-3 text-right">{sumCases}</td>
                <td className="px-4 py-3 text-right">{sumPoints}</td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
