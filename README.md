# CaseEntry · 产品案例录入系统

产品案例的录入、两阶段审核、定级入库与积分激励系统。前端后端一体（Next.js 全栈），设计遵循 [DESIGN.md](DESIGN.md)（Notion 风格设计系统）。

需求共识见 [REQUIREMENTS.md](REQUIREMENTS.md)。

## 快速开始

```bash
npm install
npx prisma migrate dev   # 首次：建库（prisma/dev.db）
npx prisma db seed       # 首次：种子数据
npm run dev              # 开发：http://localhost:3000
```

生产运行：

```bash
npm run build
npm run start
```

**初始管理员**：`admin / admin123`（首次登录后请到「个人中心」改密）

## 测试

```bash
npm run test             # vitest：状态机决策矩阵、积分词汇/发放、可见性策略、查询口径等 64 例
                         #（纯函数表驱动 + prisma/test.db 集成，测试文件串行运行）
npx tsx scripts/smoke.ts # 冒烟：需先 npm run build && npm run start
npx tsx scripts/clean-smoke-data.ts  # 清理冒烟测试数据
```

## 功能一览

| 角色 | 功能 |
|---|---|
| 所有人 | 注册（即生效）/ 登录；首页（最近入库动态 + 积分总榜/本月榜 TOP10）；案例库筛选（标题/分类/等级/时间段，普通用户 = 已入库 ∪ 本人案例）；已入库案例详情与附件下载 |
| 录入人 | 录入案例（标题/分类/附件）；我的案例；驳回案例修改重交；个人中心（积分流水/改密） |
| 管理员 | 审核待办（初审→终审定级 A/B/C，可驳回）；账号管理（禁用/启用/提权/重置密码）；分类管理；积分配置；积分报表（按时间段查人员与积分） |

### 审核流与积分

```
提交(+5) → [待初审] --通过(+10)--> [待终审] --定级 A=100/B=50/C=20--> [已入库]
               └─驳回──┐              └─驳回──┐
                    [已驳回] ◄───────────────┘
                    （修改后重交，回到被驳环节；积分不扣回）
```

- 每案例每事件积分只发一次（数据库唯一约束防刷分）
- 积分值在「积分配置」页可调，只影响之后的发放；页面积分文案实时读取配置
- 过程态案例仅录入人本人与管理员可见；案例库列表对普通用户展示 已入库 ∪ 本人案例（他人过程态不可见，见 [ADR-0002](docs/adr/0002-可见性策略单点定义.md)）
- 附件白名单：`.doc .docx .pdf .txt .md .ppt .pptx .xls .xlsx`，单文件 ≤20MB，扩展名+魔数双重校验
- 状态写入统一经状态机裁决（`decideReview`/`decideResubmit` + 写时守卫，见 [ADR-0001](docs/adr/0001-案例状态机唯一执法点.md)）

## 技术栈

- Next.js 15（App Router，React 19）+ TypeScript
- Prisma + SQLite（单文件库 `prisma/dev.db`，备份即复制；将来切 PostgreSQL 只改 provider）
- 认证：jose JWT 存 httpOnly Cookie，bcryptjs 哈希；会话每请求校验数据库（禁用立即生效）
- Tailwind CSS v4：DESIGN.md token 落成 `@theme` 变量（`globals.css`）
- 测试：vitest（核心域逻辑）+ HTTP 冒烟脚本（`scripts/smoke.ts`）

## 目录结构

```
CONTEXT.md                  领域词汇与模块地图（开发/审查先读）
docs/adr/                   架构决策记录（5 条）
prisma/schema.prisma        数据模型（User/Category/Case/PointsLedger/PointsConfig）
src/lib/                    纯词汇层：case-state（状态机/decide*）、case-visibility（可见性）、
                            points-vocab（积分词汇）、roles、session-token（令牌格式）
                            IO 层：db、auth（守卫）、password、points（发放）、points-queries、
                            case-queries（读取）、upload、validation、form（表单解析）
src/app/(auth)/             登录、注册
src/app/(app)/              首页、案例库、详情、录入、我的案例、个人中心、admin 后台
src/app/actions/            server actions（auth/case/review/profile/admin）
src/components/             UI 组件、徽章、导航、表单
scripts/                    冒烟测试与数据清理
uploads/                    附件存储（gitignore）
```

## 架构

- 领域术语（案例/初审/终审/定级/入库/驳回/积分流水…）以 [CONTEXT.md](CONTEXT.md) 为准
- 关键决策与其理由见 [docs/adr/](docs/adr/)：状态机唯一执法点、可见性单点定义、积分词汇单一来源、
  会话令牌单一实现、查询形状收敛（筛选一律 AND 在可见性之内）
- 纯词汇文件（case-state / points-vocab / roles / session-token / case-visibility）零运行时依赖，
  client 组件与脚本可安全引用

## 部署提示

- 本机/内网：`npm run build && npm run start`，或用 pm2/nssm 守护 `node_modules/.bin/next start`
- 上 https 后，把 `src/lib/auth.ts` 中 cookie 的 `secure: false` 改为 `true`
- 二期预留：文档转 markdown（docx→mammoth 等）、FTP/共享目录上传、引用/评论积分事件、全文检索
