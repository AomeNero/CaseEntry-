# 架构深化：审查产出与候选清单

2026-10-14 `/improve-codebase-architecture` 审查产出 7 个深化候选。原始 HTML 报告存临时目录已散失，本目录是 2026-10-15 依记忆与代码核实补录的持久记录。**审查行号基于 2026-10-14 代码，动手前需重新核对。**

## 候选全景与状态

| # | 候选 | 状态 | 落点 |
|---|------|------|------|
| 1 | 附件存储读半边（readUpload 收编、upload-path 纯常量） | ✅ 已落地 | 48ec156 |
| 3 | saveUpload 收编必传规则，失败契约改判别联合 | ✅ 已落地 | 00d075e |
| 5a | cases/new 逐字重复 listCategories | ✅ 已落地 | cb74824（2026-10-15 code-review 收尾） |
| 2 | 迁移+发分组合提升为 module | ✅ 已落地 | 384077f（2026-10-17，ADR-0007） |
| 4 | 状态/环节词汇泄漏 | ✅ 已落地（2026-10-17，ADR-0008） | issues/04-stage-vocab-leak.md |
| 5b | admin/points 手写积分口径 | open | issues/05-query-bypass.md |
| 6 | 「终审不能直接通过」5 处分布 | open（倾向仅注释） | issues/06-final-grade-guard-scatter.md |
| 7 | parseForm 吸收字段抽取 | open（shallow，随二期顺带） | issues/07-parseform-field-absorb.md |

## 决策模式（grilling 已定，动手前重读）

- 不预立单实现 adapter interface
- 纯常量单点 + 双 adapter 才立 seam
- 错误形态区分：缺失 ≠ 故障（404/500 分工、ENOENT 返 null vs 其他抛出）

## 相关 ADR

docs/adr/0001–0005 是本系列已落地部分的决策记录；新候选落地时应续写 ADR。
