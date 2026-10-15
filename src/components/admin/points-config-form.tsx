"use client";

import { useActionState } from "react";
import { updatePointsConfigAction } from "@/app/actions/admin";
import { Button, FormError, Input, Label } from "@/components/ui";
import { POINT_CONFIG_KEYS, POINT_CONFIG_LABELS } from "@/lib/points-vocab";

export function PointsConfigForm({ values }: { values: Record<string, number> }) {
  const [state, formAction, pending] = useActionState(updatePointsConfigAction, {});

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <FormError message={state.error} />
      {state.success && (
        <p className="rounded-inputs border border-stone-muted bg-stone-canvas px-3 py-2 text-sm font-medium text-ink-black">
          {state.success}
        </p>
      )}
      {POINT_CONFIG_KEYS.map((key) => (
        <div key={key}>
          <Label htmlFor={key}>{POINT_CONFIG_LABELS[key]}（+分）</Label>
          <Input
            id={key}
            name={key}
            type="number"
            min={0}
            step={1}
            defaultValue={values[key] ?? 0}
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
