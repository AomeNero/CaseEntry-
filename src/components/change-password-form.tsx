"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/actions/profile";
import { Button, FormError, Input, Label } from "@/components/ui";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, {});

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      <FormError message={state.error} />
      {state.success && (
        <div className="rounded-inputs border border-stone-muted bg-stone-canvas px-3 py-2.5 text-sm font-medium text-ink-black">
          {state.success}
        </div>
      )}
      <div>
        <Label htmlFor="oldPassword">当前密码</Label>
        <Input id="oldPassword" name="oldPassword" type="password" autoComplete="current-password" required />
      </div>
      <div>
        <Label htmlFor="newPassword">新密码</Label>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={6} required />
        <p className="mt-1 text-xs text-warm-gray">至少 6 位</p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "保存中…" : "修改密码"}
      </Button>
    </form>
  );
}
