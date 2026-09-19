import { db } from "@/lib/db";
import { createCaseAction } from "@/app/actions/case";
import { CaseForm } from "@/components/case-form";
import { PageTitle } from "@/components/ui";

export default async function NewCasePage() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageTitle
        title="录入案例"
        desc="提交后进入初审队列，通过初审得 10 分，终审定级入库后按等级发放积分"
      />
      <CaseForm action={createCaseAction} categories={categories} submitLabel="提交案例" />
    </div>
  );
}
