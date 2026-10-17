# 05: 查询旁路收尾（admin/points 手写积分口径）

Status: done (2026-10-17)
Source: 2026-10-14 架构审查 #5（两半中 cases/new 半已落地）

## 状态

- ✅ cases/new 逐字重复 listCategories —— 已收编（cb74824）
- ✅ admin/categories 直写 findMany —— 核实为不同形状（含 `_count` 案例计数），非旁路，不改
- ❌ **admin/points/page.tsx:8-9** —— `db.pointsConfig.findMany()` + 手写 `Object.fromEntries(map(key,value))`，与 points-queries 的消费口径（getPointConfigValues）逐字同形，仍并存

## 方向

admin/points 页改用 points-queries 的口径函数。管理表单需要的键值形状与消费侧一致（2026-10-15 核实：页面只把 configs 转成 values 传给表单，没有用到 id 等额外字段）。

## 验证标准

- `db.pointsConfig` 直写只剩 points-queries 单点
- admin/points 页行为不变

## 落地

`admin/points` 页改用 `getPointConfigValues()`，页面内 `db.pointsConfig.findMany()` 与手写 `Object.fromEntries` 删除。`db.pointsConfig.findMany` 现在只剩 `src/lib/points.ts` 一处；表单对缺键的 `?? 0` 兜底使渲染结果不变。

- 验证：typecheck ✓、lint ✓、vitest 73/73 ✓、smoke 21/21 ✓
- 决策：复用 ADR-0005 的查询模块模式，无新决策，不新增 ADR
