# 04: 状态/环节词汇泄漏

Status: done (2026-10-17)
Source: 2026-10-14 架构审查 #4

## 问题

case-state 缺 `STAGE_LABELS`（环节中文标签）与 status→stage 逆向映射，导致词汇在 UI 层复制：

- cases/page 下拉 ×4 处复制
- cases/[id]/page 逆向映射（status→stage）
- review-form `['A','B','C']` 字面量复制

## 方向

词汇补进 case-state 单点（STAGE_LABELS、逆向函数），UI 消费。与 fd1fc07（points-vocab）同一治理模式。

## 验证标准

- 环节标签、status→stage 逆向、等级枚举各只有一份来源
- UI 层无字面量复制

## 落地

- `case-state` 新增 `STAGE_LABELS` 与 `stageForStatus`（由 `EXPECTED_STATUS` 反查）
- 案例库筛选下拉改由 `CASE_STATUSES + STATUS_LABELS` 生成；详情页改用 `stageForStatus + STAGE_LABELS`；审核表单改用 `GRADES`
- `validation.ts` 的等级/环节枚举改用 `z.enum(GRADES / REVIEW_STAGES)`
- 测试：`stageForStatus` 表驱动 1 例；全量 73/73
- 决策记录：`docs/adr/0008-状态环节词汇单点化.md`
