# 07: parseForm 吸收字段抽取

Status: open
Priority: 低（shallow，引用/评论表单上线时顺带）
Source: 2026-10-14 架构审查 #7

## 问题

server action 里从 FormData 逐字段手工抽取（`formData.get(...) ?? ""` / `|| undefined`）的形状在多个 action 重复。parseForm 已是表单解析统一入口，可再吸收一层字段抽取。

## 方向

 shallow 改进：等二期引用/评论表单上线、出现第三份手抄时一并做，现在不值得单独立项动工。

## 验证标准

- 字段抽取形状单点化
- 现有 action 行为不变
