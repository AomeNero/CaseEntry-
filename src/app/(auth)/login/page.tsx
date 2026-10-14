"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import type { FormState } from "@/lib/form";
import { Button, FormError, Input, Label } from "@/components/ui";

const initial: FormState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">
          CE
        </div>
        <h1 className="text-2xl font-semibold text-white">登录 CaseEntry</h1>
        <p className="mt-1.5 text-sm text-on-dark-muted">产品案例录入与积分系统</p>
      </div>

      <form action={formAction} className="space-y-4 rounded-lg bg-canvas p-6 shadow-2xl">
        <FormError message={state.error} />
        <div>
          <Label htmlFor="username">用户名</Label>
          <Input id="username" name="username" autoComplete="username" autoFocus required />
        </div>
        <div>
          <Label htmlFor="password">密码</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "登录中…" : "登录"}
        </Button>
        <p className="text-center text-sm text-steel">
          还没有账号？{" "}
          <Link href="/register" className="font-medium text-link">
            立即注册
          </Link>
        </p>
      </form>
    </div>
  );
}
