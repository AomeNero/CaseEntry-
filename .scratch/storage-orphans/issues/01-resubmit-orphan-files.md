# 重交旧附件成为磁盘孤儿

Status: open
Type: task

## 问题

`resubmitCaseAction` 用新 `saved` 字段直接覆盖案例的 `filePath` 等附件字段，旧附件文件留在磁盘上，没有任何删除路径。每次重交泄漏一个文件（≤20MB）。

## 背景

2026-10-14 架构审查（候选 #1，附件存储读半边深化）走查发现。当时决策：不在本期实现 remove()——未被要求的功
能，且孤儿清理没有触发时间表（YAGNI）。

## 方向（留待契机）

- 存储模块（`src/lib/upload.ts`）是 remove/markOrphan 的天然归宿
- 契机：二期「多格式转 markdown」或「FTP/共享目录」触碰存储入口时顺带做
- 方案备选：updateMany 成功后删除旧文件（注意与写时守卫的时序）；或先记孤立清单后台清理
