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
    <div className="w-full max-w-sm rounded-feature-card border border-stone-border bg-pure-white p-8">
      <div className="mb-6 text-center">
        <svg
          viewBox="0 0 24 24"
          className="mx-auto mb-3 h-5 w-5 text-ink-black"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" />
        </svg>
        <h1 className="font-display text-heading-sm font-normal text-ink-black">登录 CaseEntry</h1>
        <p className="mt-1.5 text-sm text-warm-gray">产品案例录入与积分系统</p>
      </div>

      <form action={formAction} className="space-y-4">
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
        <p className="text-center text-sm text-warm-gray">
          还没有账号？{" "}
          <Link href="/register" className="font-medium text-cyan-edge transition-colors hover:text-cyan-signal">
            立即注册
          </Link>
        </p>
      </form>
    </div>
  );
}
