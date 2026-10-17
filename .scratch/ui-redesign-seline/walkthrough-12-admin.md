# 票 12 走查工件：admin 五页

- 环境：生产构建（`npm run build` + `npm run start`），http://localhost:3000
- 视口：1132 × 660 CSS px（DPR 1.5），full-page 截图
- 账号：`admin` / 系统管理员
- 截图目录：`.scratch/ui-redesign-seline/screenshots/12-admin-*.png`

## 逐页结论

| 页面 | 截图 | 结论 | 备注 |
|---|---|---|---|
| 审核队列 | `12-admin-queue.png` | 通过 | 双队列分区；通过=青色实心、驳回=墨黑描边；定级单选青色 accent；理由输入在主次动作之间 |
| 账号管理 | `12-admin-users.png` | 通过 | 细线表格；角色徽章用户灰 / 管理员墨黑；禁用=墨黑实心（破坏性）；当前账号行有说明 |
| 分类管理 | `12-admin-categories.png` | 不通过（F-04） | 列表与删除按钮语义正确（有案例的删除为禁用灰）；添加按钮文字换行 |
| 积分配置 | `12-admin-points.png` | 通过 | 五个数值字段 + 青色保存；说明文案清晰 |
| 积分报表 | `12-admin-report.png` | 通过 | 日期区间 + 查询；细线表格 + 合计行 |

## 发现项

### F-04（中）「添加」按钮文字竖排换行

- 证据：`12-admin-categories.png` 顶部添加分类表单。
- 实测：按钮 `56 × 56` CSS px，`white-space: normal`，两个汉字被迫上下换行。
- 成因：按钮缺少 `whitespace-nowrap` / `shrink-0`；相邻输入框的宽度类（`w-48` 与基础 `w-full`）冲突，挤压了按钮。
- 建议：`Button` 基类加 `whitespace-nowrap`；分类输入框显式收窄（如 `w-64 shrink-0`），按钮加 `shrink-0`。

## 环境噪声（非设计问题，勿计入 13 票）

- 队列与报表中的「冒烟-…」行：smoke 脚本遗留数据。
- 截图宽度 1132 CSS px，未达到 1200px 容器上限；超宽屏下需在 13 票复看。
