"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type FormState } from "@/app/actions/auth";
import { Button, FormError, Input, Label } from "@/components/ui";

const initial: FormState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initial);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">
          CE
        </div>
        <h1 className="text-2xl font-semibold text-white">注册 CaseEntry</h1>
        <p className="mt-1.5 text-sm text-on-dark-muted">注册即可录入案例、赢取积分</p>
      </div>

      <form action={formAction} className="space-y-4 rounded-lg bg-canvas p-6 shadow-2xl">
        <FormError message={state.error} />
        <div>
          <Label htmlFor="name">姓名</Label>
          <Input id="name" name="name" maxLength={20} autoFocus required />
        </div>
        <div>
          <Label htmlFor="username">用户名</Label>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            pattern="[a-zA-Z0-9_]{2,30}"
            title="2-30 位字母、数字或下划线"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
          <p className="mt-1 text-xs text-stone">至少 6 位</p>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "注册中…" : "注册"}
        </Button>
        <p className="text-center text-sm text-steel">
          已有账号？{" "}
          <Link href="/login" className="font-medium text-link">
            去登录
          </Link>
        </p>
      </form>
    </div>
  );
}
