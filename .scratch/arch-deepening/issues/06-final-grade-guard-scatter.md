# 06: 「终审不能直接通过」约束多处分布

Status: done (2026-10-17)
Disposition: 倾向仅补互相指认注释（符合 ADR-0001 双层防御，不强行收编）
Source: 2026-10-14 架构审查 #6

## 问题

「终审阶段不能直接通过、必须定级」的约束在 5 处分布（schema 层判别、decideReview 纯函数、review-form 文案等），审查认为收编成本高于收益。

## 处理倾向

维持 ADR-0001 双层防御格局，各处补互相指认注释（「本约束同时存在于 X/Y/Z」），防止单点修改造成层间漂移。动手前先重新盘点当前分布点。

## 验证标准

- 5 处分布点有互相指认注释
- 行为不变，现有测试全绿

## 重新盘点（2026-10-17）

5 个表达点：

1. `validation.ts` `reviewActionSchema`——`FINAL` 只配 `grade/reject`
2. `case-state.decideReview` 函数头——权威拦截
3. `decideReview` 的 `approve` 分支——兜底拦截
4. `components/review-form` 组件头——职责声明（只渲染）
5. `review-form` 的 FINAL 分支——不渲染「通过」

排除项：首页 hero、录入页说明、admin 队列标题「（定级）」等文案只描述流程、不承担校验，未加同步注释，避免污染展示层。

## 落地

提交 `a02cdc8`。

- 5 处均补互指注释；行为零变化
- 验证：typecheck ✓、lint ✓、vitest 73/73 ✓
- 无新 ADR：维持 ADR-0001 双层防御，按票面倾向不强行收编
