import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCaseDetail, listCategories } from "@/lib/case-queries";
import { getPointConfigValues } from "@/lib/points";
import { resubmitCaseAction } from "@/app/actions/case";
import { ReviewForm } from "@/components/review-form";
import { CaseForm } from "@/components/case-form";
import { GradeBadge, StatusBadge } from "@/components/badges";
import { Button, Card, PageTitle } from "@/components/ui";
import {
  STAGE_LABELS,
  stageForStatus,
  type CaseStatus,
  type Grade,
  type ReviewStage,
} from "@/lib/case-state";
import { canView } from "@/lib/case-visibility";
import { ROLE } from "@/lib/roles";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const isAdmin = user.role === ROLE.ADMIN;

  const kase = await getCaseDetail(id);
  if (!kase) notFound();

  // 可见性策略见 lib/case-visibility（唯一来源）；本表面的错误形态是 404
  const isAuthor = kase.authorId === user.id;
  if (!canView(user, kase)) notFound();

  const categories = isAuthor && kase.status === "REJECTED" ? await listCategories() : [];
  const points = await getPointConfigValues();
  const reviewStage = stageForStatus(kase.status as CaseStatus);

  const meta: Array<[string, string]> = [
    ["产品分类", kase.category.name],
    ["录入人", `${kase.author.name}（${kase.author.username}）`],
    ["提交时间", kase.submittedAt.toLocaleString("zh-CN")],
    ["附件", `${kase.fileName}（${(kase.fileSize / 1024).toFixed(0)} KB）`],
  ];

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <Link href="/cases" className="text-sm text-cyan-edge transition-colors hover:text-cyan-signal">
          ← 返回案例库
        </Link>
      </div>

      <PageTitle title={kase.title} />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={kase.status as CaseStatus} />
        {kase.grade && <GradeBadge grade={kase.grade as Grade} />}
      </div>

      <Card className="mb-6">
        <dl className="grid grid-cols-[88px_1fr] gap-y-3 text-sm md:grid-cols-[120px_1fr]">
          {meta.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-warm-gray">{k}</dt>
              <dd className="text-ink-black">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5">
          <a href={`/cases/${kase.id}/attachment`} download>
            <Button variant="outline">下载附件</Button>
          </a>
        </div>
      </Card>

      {kase.status === "REJECTED" && kase.rejectReason && (
        <Card className="mb-6 border-stone-muted bg-stone-canvas">
          <h2 className="mb-1 text-sm font-medium text-ink-black">
            驳回理由（{kase.rejectedStage ? STAGE_LABELS[kase.rejectedStage as ReviewStage] : ""}）
          </h2>
          <p className="whitespace-pre-wrap text-sm text-warm-gray">{kase.rejectReason}</p>
        </Card>
      )}

      {isAdmin && reviewStage && (
        <Card className="mb-6">
          <h2 className="mb-1 font-display text-subheading font-normal text-ink-black">
            {STAGE_LABELS[reviewStage]}
          </h2>
          <ReviewForm caseId={kase.id} stage={reviewStage} firstPassPoints={points.FIRST_PASS} redirectTo={`/cases/${kase.id}`} />
        </Card>
      )}

      {isAuthor && kase.status === "REJECTED" && (
        <Card>
          <h2 className="mb-4 font-display text-subheading font-normal text-ink-black">修改后重新提交</h2>
          <CaseForm
            action={resubmitCaseAction}
            categories={categories}
            defaultTitle={kase.title}
            defaultCategoryId={kase.categoryId}
            caseId={kase.id}
            submitLabel="重新提交"
          />
        </Card>
      )}
    </div>
  );
}
