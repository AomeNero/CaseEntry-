"use client";

import { useActionState } from "react";
import { addCategoryAction } from "@/app/actions/admin";
import { Button, FormError, Input } from "@/components/ui";

export function CategoryAddForm() {
  const [state, formAction, pending] = useActionState(addCategoryAction, {});

  return (
    <form action={formAction} className="flex items-start gap-2">
      <div className="flex-1">
        <FormError message={state.error} />
        {state.success && (
          <p className="rounded-md border border-success/30 bg-tint-mint px-3 py-2 text-sm text-charcoal">
            {state.success}
          </p>
        )}
      </div>
      <Input name="name" placeholder="新分类名称" maxLength={20} required className="w-48" />
      <Button type="submit" disabled={pending}>
        添加
      </Button>
    </form>
  );
}
