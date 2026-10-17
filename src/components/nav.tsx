"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui";
import { SparkMark } from "@/components/spark-mark";

const LINKS = [
  { href: "/", label: "首页" },
  { href: "/cases", label: "案例库" },
  { href: "/cases/new", label: "录入案例" },
  { href: "/my", label: "我的案例" },
  { href: "/profile", label: "个人中心" },
];

const ADMIN_LINKS = [
  { href: "/admin", label: "审核待办" },
  { href: "/admin/users", label: "账号管理" },
  { href: "/admin/categories", label: "分类管理" },
  { href: "/admin/points", label: "积分配置" },
  { href: "/admin/report", label: "积分报表" },
];

const NAV_LINK_CLASS = "flex h-8 items-center px-3 text-sm transition-colors";

/** 管理员入口下拉：原生 details 折叠，五个后台链接收拢 */
function AdminMenu({ pathname }: { pathname: string }) {
  const active = pathname.startsWith("/admin");
  return (
    <details className="relative">
      <summary
        className={`${NAV_LINK_CLASS} cursor-pointer list-none [&::-webkit-details-marker]:hidden ${
          active ? "text-ink-black" : "text-warm-gray hover:text-ink-black"
        }`}
      >
        管理
        <svg
          viewBox="0 0 24 24"
          className="ml-1 h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="absolute left-0 top-full z-20 mt-1 w-36 rounded-cards border border-stone-border bg-pure-white p-1.5 shadow-md">
        {ADMIN_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`block rounded px-3 py-1.5 text-sm transition-colors ${
              pathname === l.href
                ? "bg-stone-canvas text-ink-black"
                : "text-warm-gray hover:bg-stone-canvas hover:text-ink-black"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </details>
  );
}

export function NavBar({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-stone-border bg-pure-white">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <SparkMark />
          <span className="text-sm font-medium text-ink-black">CaseEntry</span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-x-1">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`${NAV_LINK_CLASS} ${
                  active ? "text-ink-black" : "text-warm-gray hover:text-ink-black"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {isAdmin && <AdminMenu pathname={pathname} />}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-warm-gray">{name}</span>
          {isAdmin && (
            <span className="rounded-full bg-ink-black px-2 py-0.5 text-xs font-medium text-white">
              管理员
            </span>
          )}
          <form action={logoutAction}>
            <Button variant="ghost" type="submit" className="px-2 py-1 text-sm">
              退出
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
