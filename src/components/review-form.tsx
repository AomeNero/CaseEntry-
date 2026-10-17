"use client";

import { useActionState } from "react";
import { reviewAction } from "@/app/actions/review";
import { GRADES, type ReviewStage } from "@/lib/case-state";
import { Button, FormError, Label, Textarea } from "@/components/ui";

/** 管理员审核操作卡：初审=通过/驳回；终审=定级 A/B/C/驳回。
 *  本组件只决定渲染，不承担校验；「终审不能直接通过」的权威拦截在
 *  case-state.decideReview，结构判别在 validation.reviewActionSchema。
 *  初审积分提示由调用方从配置读取传入；redirectTo 决定审核完成后的落点。 */
export function ReviewForm({
  caseId,
  stage,
  firstPassPoints,
  redirectTo,
}: {
  caseId: string;
  stage: ReviewStage;
  firstPassPoints: number;
  redirectTo?: string;
}) {
  const [state, formAction, pending] = useActionState(reviewAction, {});

  return (
    <form action={formAction} className="mt-4 space-y-3 rounded-cards border border-stone-border bg-stone-canvas p-4">
      <FormError message={state.error} />
      <input type="hidden" name="caseId" value={caseId} />
      <input type="hidden" name="stage" value={stage} />
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      {stage === "FIRST" ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" name="action" value="approve" disabled={pending} className="px-4 py-2">
            通过初审
          </Button>
          <span className="text-xs text-warm-gray">通过后进入终审队列，录入人 +{firstPassPoints} 分</span>
        </div>
      ) : (
        <div>
          {/* 终审不渲染「通过」按钮：约束见 decideReview 与 reviewActionSchema */}
          <Label>终审定级</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" name="action" value="grade" disabled={pending} className="px-4 py-2">
              定级入库
            </Button>
            <span className="flex items-center gap-1.5 text-sm">
              {GRADES.map((g, i) => (
                <label key={g} className="flex cursor-pointer items-center gap-1 rounded-full border border-stone-border bg-pure-white px-2.5 py-1.5 transition-colors has-[:checked]:border-ink-black">
                  <input type="radio" name="grade" value={g} defaultChecked={i === 0} required className="accent-cyan-signal" />
                  <span className="font-medium">{g} 级</span>
                </label>
              ))}
            </span>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor={`reason-${caseId}-${stage}`}>驳回理由（选择驳回时必填）</Label>
        <Textarea
          id={`reason-${caseId}-${stage}`}
          name="reason"
          rows={2}
          maxLength={500}
          placeholder="说明问题，方便录入人修改后重新提交"
        />
      </div>
      <Button type="submit" name="action" value="reject" variant="outline" disabled={pending}>
        驳回
      </Button>
    </form>
  );
}
