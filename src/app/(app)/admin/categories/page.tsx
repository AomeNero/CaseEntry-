import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteCategoryAction } from "@/app/actions/admin";
import { CategoryAddForm } from "@/components/admin/category-add-form";
import { ConfirmButton } from "@/components/confirm-button";
import { Card, Empty, PageTitle } from "@/components/ui";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { cases: true } } },
  });

  return (
    <div className="max-w-xl">
      <PageTitle title="分类管理" desc="录入表单的下拉选项来源；有案例的分类不可删除" />

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-ink">添加分类</h2>
        <CategoryAddForm />
      </Card>

      {categories.length === 0 ? (
        <Empty text="还没有分类，请先添加" />
      ) : (
        <div className="divide-y divide-hairline-soft rounded-lg border border-hairline bg-canvas">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-charcoal">{c.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-steel">{c._count.cases} 个案例</span>
                <form action={deleteCategoryAction}>
                  <input type="hidden" name="categoryId" value={c.id} />
                  <ConfirmButton
                    message="确认删除该分类？"
                    className="px-2.5 py-1 text-xs"
                    disabled={c._count.cases > 0}
                    title={c._count.cases > 0 ? "有案例的分类不可删除" : undefined}
                  >
                    删除
                  </ConfirmButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
