import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ROLE } from "@/lib/roles";
import { setUserDisabledAction, setUserRoleAction } from "@/app/actions/admin";
import { ResetPasswordButton } from "@/components/admin/reset-password-button";
import { ConfirmButton } from "@/components/confirm-button";
import { Button, PageTitle } from "@/components/ui";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { cases: true } } },
  });

  return (
    <div>
      <PageTitle title="账号管理" desc="禁用账号立即失效（会话校验以数据库为准）；重置密码生成临时密码" />

      <div className="overflow-x-auto rounded-cards border border-stone-border bg-pure-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-stone-border bg-stone-canvas text-left text-xs font-medium text-warm-gray">
              <th className="px-4 py-3">姓名</th>
              <th className="px-4 py-3">用户名</th>
              <th className="px-4 py-3">角色</th>
              <th className="px-4 py-3">案例数</th>
              <th className="px-4 py-3">注册时间</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-border">
            {users.map((u) => {
              const isSelf = u.id === admin.id;
              return (
                <tr key={u.id} className="text-ink-black">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-warm-gray">{u.username}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === ROLE.ADMIN
                          ? "bg-ink-black text-white"
                          : "bg-stone-canvas text-warm-gray"
                      }`}
                    >
                      {u.role === ROLE.ADMIN ? "管理员" : "用户"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{u._count.cases}</td>
                  <td className="px-4 py-3 text-slate">{u.createdAt.toLocaleDateString("zh-CN")}</td>
                  <td className="px-4 py-3">
                    {u.disabled ? (
                      <span className="rounded-full border border-dashed border-stone-muted px-2 py-0.5 text-xs font-medium text-ash-gray">
                        已禁用
                      </span>
                    ) : (
                      <span className="rounded-full border border-stone-muted px-2 py-0.5 text-xs font-medium text-ink-black">
                        正常
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <span className="text-xs text-ash-gray">（当前登录账号）</span>
                    ) : (
                      <div className="flex flex-wrap items-start gap-2">
                        <form action={setUserRoleAction}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="role" value={u.role === ROLE.ADMIN ? ROLE.USER : ROLE.ADMIN} />
                          <Button type="submit" variant="secondary" className="px-2.5 py-1 text-xs">
                            {u.role === ROLE.ADMIN ? "降为用户" : "提为管理员"}
                          </Button>
                        </form>
                        <form action={setUserDisabledAction}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="disabled" value={u.disabled ? "false" : "true"} />
                          {u.disabled ? (
                            <Button type="submit" variant="secondary" className="px-2.5 py-1 text-xs">
                              启用
                            </Button>
                          ) : (
                            <ConfirmButton
                              message="确认禁用该账号？禁用后立即无法登录。"
                              className="px-2.5 py-1 text-xs"
                            >
                              禁用
                            </ConfirmButton>
                          )}
                        </form>
                        <ResetPasswordButton userId={u.id} />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
