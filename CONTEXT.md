# CaseEntry 领域词汇与模块地图

> 需求共识见 [REQUIREMENTS.md](REQUIREMENTS.md)；架构决策见 [docs/adr/](docs/adr/)。
> 本文件供后续开发与架构审查对齐词汇，避免同名异义与重复发明。

## 领域词汇

| 术语 | 含义 |
|---|---|
| **案例（Case）** | 录入人提交的产品案例：标题 + 产品分类 + 附件（单附件，白名单 9 种，≤20MB） |
| **录入人** | role=USER 的账号，案例的提交者与被审核方 |
| **管理员** | role=ADMIN 的账号，初审/终审/账号/分类/积分配置的管理者；任一管理员可连续完成两步审核 |
| **初审 / 终审** | 两阶段审核。初审=通过/驳回；终审=定级（A/B/C）/驳回。环节记为 `FIRST` / `FINAL` |
| **定级** | 终审给出 A/B/C 等级；定级即入库并按等级发放积分 |
| **入库（PUBLISHED）** | 案例终态，全员可见可下载；`publishedAt` 记录入库时间 |
| **驳回（REJECTED）** | 审核不通过；`rejectedStage`（FIRST/FINAL）记录被驳环节，重交回到被驳环节；驳回不扣回已得积分 |
| **重交** | 录入人修改被驳案例后重新提交（标题/分类/附件须重传），不发新积分 |
| **过程态** | 待初审（PENDING_FIRST）/ 待终审（PENDING_FINAL）/ 已驳回（REJECTED）的统称 |
| **积分 / 积分流水（PointsLedger）** | 事件流水账：谁/哪案例/何事件/多少分/何时；`(caseId, eventType)` 唯一约束防刷分；流水是积分唯一真相，无冗余余额列 |
| **积分配置（PointsConfig）** | 五个键（SUBMIT / FIRST_PASS / GRADE_A/B/C）的金额，管理员后台可调，只影响之后的发放 |
| **榜单** | 首页双榜：积分总榜 + 本月积分榜（每月 1 日重置），各 TOP10 |

## 模块地图

| 模块 | 位置 | 职责 |
|---|---|---|
| **案例状态机** | `src/lib/case-state.ts` | 状态/环节/等级词汇 + 迁移表 + `decideReview`/`decideResubmit`（状态写入唯一执法点，见 [ADR-0001](docs/adr/0001-案例状态机唯一执法点.md)） |
| **可见性策略** | `src/lib/case-visibility.ts` | 「已入库全员可见；过程态仅录入人本人+管理员」的唯一来源（[ADR-0002](docs/adr/0002-可见性策略单点定义.md)） |
| **积分词汇** | `src/lib/points-vocab.ts` | 事件/配置键/标签/默认值/键映射，纯常量零依赖（[ADR-0003](docs/adr/0003-积分词汇单一来源.md)） |
| **积分发放** | `src/lib/points.ts` | `awardPoints`：事务内发放 + 唯一约束幂等 |
| **积分汇总** | `src/lib/points-queries.ts` | 榜单/单人合计/报表的唯一口径 |
| **案例读取** | `src/lib/case-queries.ts` | 案例库/详情/动态/队列/分类字典，include 与可见性知识内化 |
| **角色** | `src/lib/roles.ts` | `USER`/`ADMIN` 唯一合法值清单 |
| **会话令牌** | `src/lib/session-token.ts` | token 格式唯一实现；auth（cookie）与 smoke（HTTP）双 adapter（[ADR-0004](docs/adr/0004-会话令牌格式单一实现.md)） |
| **认证守卫** | `src/lib/auth.ts` | `getCurrentUser`（可空）/ `getCurrentAdmin`（可空）/ `requireUser`/`requireAdmin`（redirect）——失败模式属于 interface |
| **表单解析** | `src/lib/form.ts` | `FormState` + `parseForm`（schema 解析统一入口） |
| **密码哈希** | `src/lib/password.ts` | 有意保留的薄 adapter（钉住 bcrypt cost=10） |

## 关键约定

- **状态写入**必须经 `decide*` 取补丁，并以 `updateMany({ where: { id, status } })` 应用（写时守卫，并发安全）。
- **查询筛选**一律 AND 在可见性条件之内——只收窄、永不放宽。
- **纯词汇文件**（case-state / points-vocab / roles / session-token / case-visibility）不引入 server-only 或 IO，client 组件与脚本可安全引用。
- **测试**：纯函数表驱动 + test.db 集成（vitest 串行）；HTTP 冒烟 `scripts/smoke.ts` 兜底页面与鉴权路径。
