# 02: 迁移+发分组合提升为 module

Status: open
Priority: 高（审查标记 Strong，二期积分功能直接命中）
Source: 2026-10-14 架构审查 #2

## 问题

review.ts 与 case.ts 手抄同一事务形状（updateMany 写时守卫 + awardPoints 同事务），全库唯一无覆盖的关键不变量。二期引用/评论积分会是第三、四份手抄。

审查时行号（2026-10-14，已漂移）：review.ts:55-67 与 case.ts:35-50。

## 方向

提升为组合 module（收编 tx + decision），action 层剩守卫 + redirect。与 ADR-0005「重复形状收敛为查询模块」同一模式，方向是写侧的组合。

## 验证标准

- 事务形状（守卫 + 发分原子性）只有一份实现
- 组合逻辑有直接单测（并发落空不发分的不变量可测）
- 现有 64+ 测试全绿
