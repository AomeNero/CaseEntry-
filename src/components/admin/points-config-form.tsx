"use client";

import { useActionState } from "react";
import { updatePointsConfigAction } from "@/app/actions/admin";
import { Button, FormError, Input, Label } from "@/components/ui";

const FIELDS = [
  { key: "SUBMIT", label: "提交案例（+分）" },
  { key: "FIRST_PASS", label: "初审通过（+分）" },
  { key: "GRADE_A", label: "终审 A 级（+分）" },
  { key: "GRADE_B", label: "终审 B 级（+分）" },
  { key: "GRADE_C", label: "终审 C 级（+分）" },
] as const;

export function PointsConfigForm({ values }: { values: Record<string, number> }) {
  const [state, formAction, pending] = useActionState(updatePointsConfigAction, {});

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <FormError message={state.error} />
      {state.success && (
        <p className="rounded-md border border-success/30 bg-tint-mint px-3 py-2 text-sm text-charcoal">
          {state.success}
        </p>
      )}
      {FIELDS.map((f) => (
        <div key={f.key}>
          <Label htmlFor={f.key}>{f.label}</Label>
          <Input
            id={f.key}
            name={f.key}
            type="number"
            min={0}
            step={1}
            defaultValue={values[f.key] ?? 0}
            required
          />
        </div>
      ))}
      <Button type="submit" disabled={pending}>
        {pending ? "保存中…" : "保存配置"}
      </Button>
    </form>
  );
}
