import { requireAdmin } from "@/lib/auth";
import { getPointConfigValues } from "@/lib/points";
import { PointsConfigForm } from "@/components/admin/points-config-form";
import { PageTitle } from "@/components/ui";

export default async function AdminPointsPage() {
  await requireAdmin();
  const values = await getPointConfigValues();

  return (
    <div className="max-w-xl">
      <PageTitle
        title="积分配置"
        desc="调整后立即生效，只影响之后发放的积分，不追溯历史流水"
      />
      <PointsConfigForm values={values} />
    </div>
  );
}
