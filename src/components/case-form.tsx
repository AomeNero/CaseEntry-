"use client";

import { useActionState } from "react";
import type { Category } from "@prisma/client";
import { Button, FormError, Input, Label, Select } from "@/components/ui";
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from "@/lib/validation";

interface CaseFormProps {
  action: (prev: { error?: string }, formData: FormData) => Promise<{ error?: string }>;
  categories: Pick<Category, "id" | "name">[];
  defaultTitle?: string;
  defaultCategoryId?: string;
  caseId?: string; // 重交时传入
  submitLabel: string;
}

/** 录入/重交共用表单：标题 + 分类 + 附件（必传） */
export function CaseForm({
  action,
  categories,
  defaultTitle,
  defaultCategoryId,
  caseId,
  submitLabel,
}: CaseFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <FormError message={state.error} />
      {caseId && <input type="hidden" name="caseId" value={caseId} />}

      <div>
        <Label htmlFor="title">标题</Label>
        <Input
          id="title"
          name="title"
          maxLength={100}
          defaultValue={defaultTitle}
          placeholder="一句话概括这个案例"
          required
        />
      </div>

      <div>
        <Label htmlFor="categoryId">产品分类</Label>
        <Select id="categoryId" name="categoryId" defaultValue={defaultCategoryId ?? ""} required>
          <option value="" disabled>
            请选择分类
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="file">案例附件</Label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept={ALLOWED_EXTENSIONS.join(",")}
          className="w-full rounded-inputs border border-stone-muted bg-pure-white px-3 py-2.5 text-sm text-ink-black file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-stone-canvas file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink-black file:transition-colors file:hover:bg-stone-muted"
        />
        <p className="mt-1 text-xs text-warm-gray">
          支持 {ALLOWED_EXTENSIONS.join(" ")}，单文件 ≤ {Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB
        </p>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "提交中…" : submitLabel}
      </Button>
    </form>
  );
}
