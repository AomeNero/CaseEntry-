# 02: 基础组件 Seline 化

**What to build:** 基础组件层换血：Button 药丸变体体系（青色实心主行动 / 墨黑描边次级（驳回）/ 墨黑实心+原生 confirm 二次确认的破坏性组件）、Card/Input/Select/Textarea 细边框化、FormError 去红、StatusBadge 四态与 GradeBadge A/B/C 按单色纪律重映射。全部使用 01 的新 token，不引入新依赖。

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Button 变体重定义完成，现有全部调用点适配且编译通过
- [ ] 破坏性操作（删除分类/禁用账号）经二次确认；审核「驳回」为墨黑描边样式
- [ ] 徽章四态/三级等级单色化，与 CONTEXT.md 状态词汇一一对应
- [ ] 表单错误文案去红
- [ ] lint / typecheck / vitest 全绿
