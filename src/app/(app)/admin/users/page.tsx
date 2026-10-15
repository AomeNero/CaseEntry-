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

      <div className="overflow-x-auto rounded-lg border border-hairline bg-canvas">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface-soft text-left text-xs font-semibold text-steel">
              <th className="px-4 py-3">姓名</th>
              <th className="px-4 py-3">用户名</th>
              <th className="px-4 py-3">角色</th>
              <th className="px-4 py-3">案例数</th>
              <th className="px-4 py-3">注册时间</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-soft">
            {users.map((u) => {
              const isSelf = u.id === admin.id;
              return (
                <tr key={u.id} className="text-charcoal">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-slate">{u.username}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${
                        u.role === ROLE.ADMIN
                          ? "bg-tint-lavender text-primary-deep"
                          : "bg-surface text-slate"
                      }`}
                    >
                      {u.role === ROLE.ADMIN ? "管理员" : "用户"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{u._count.cases}</td>
                  <td className="px-4 py-3 text-slate">{u.createdAt.toLocaleDateString("zh-CN")}</td>
                  <td className="px-4 py-3">
                    {u.disabled ? (
                      <span className="rounded-sm bg-tint-rose px-2 py-0.5 text-xs font-semibold text-error">
                        已禁用
                      </span>
                    ) : (
                      <span className="rounded-sm bg-tint-mint px-2 py-0.5 text-xs font-semibold text-brand-green">
                        正常
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <span className="text-xs text-stone">（当前登录账号）</span>
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
