import { db } from "@/lib/db";
import { createCaseAction } from "@/app/actions/case";
import { getPointConfigValues } from "@/lib/points";
import { CaseForm } from "@/components/case-form";
import { PageTitle } from "@/components/ui";

export default async function NewCasePage() {
  const [categories, points] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    getPointConfigValues(),
  ]);

  return (
    <div>
      <PageTitle
        title="录入案例"
        desc={`提交得 ${points.SUBMIT} 分，通过初审得 ${points.FIRST_PASS} 分，终审定级入库后按 A/B/C 等级发放积分`}
      />
      <CaseForm action={createCaseAction} categories={categories} submitLabel="提交案例" />
    </div>
  );
}
