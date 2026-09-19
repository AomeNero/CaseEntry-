"use client";

import { useActionState } from "react";
import { resetUserPasswordAction } from "@/app/actions/admin";
import { Button } from "@/components/ui";

/** 表格行内的重置密码按钮，成功后在原位显示临时密码 */
export function ResetPasswordButton({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(resetUserPasswordAction, {});

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="userId" value={userId} />
        <Button type="submit" variant="secondary" className="px-2.5 py-1 text-xs" disabled={pending}>
          重置密码
        </Button>
      </form>
      {state.success && <p className="mt-1 max-w-48 text-xs text-success">{state.success}</p>}
      {state.error && <p className="mt-1 text-xs text-error">{state.error}</p>}
    </div>
  );
}
