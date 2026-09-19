"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui";

const LINKS = [
  { href: "/", label: "首页", adminOnly: false },
  { href: "/cases", label: "案例库", adminOnly: false },
  { href: "/cases/new", label: "录入案例", adminOnly: false },
  { href: "/my", label: "我的案例", adminOnly: false },
  { href: "/profile", label: "个人中心", adminOnly: false },
  { href: "/admin", label: "审核待办", adminOnly: true },
  { href: "/admin/users", label: "账号管理", adminOnly: true },
  { href: "/admin/categories", label: "分类管理", adminOnly: true },
  { href: "/admin/points", label: "积分配置", adminOnly: true },
  { href: "/admin/report", label: "积分报表", adminOnly: true },
];

export function NavBar({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const links = LINKS.filter((l) => !l.adminOnly || isAdmin);

  return (
    <header className="sticky top-0 z-10 border-b border-hairline bg-canvas">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
            CE
          </span>
          <span className="text-sm font-semibold text-ink">CaseEntry</span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-medium transition-colors ${
                  active ? "text-ink" : "text-slate hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate">{name}</span>
          {isAdmin && (
            <span className="rounded-sm bg-tint-lavender px-2 py-0.5 text-xs font-semibold text-primary-deep">
              管理员
            </span>
          )}
          <form action={logoutAction}>
            <Button variant="ghost" type="submit" className="px-2 py-1 text-sm text-steel">
              退出
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
