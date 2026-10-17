# 逐页截图走查清单（票 09 验收工件）

> 检查表 = DESIGN.md Do/Don't。自动化侧：lint / typecheck / vitest(69) / smoke(21) 全绿。
> 高亮短语配额全站核查：仅 2 处（首页 hero「攒成积分」、404「走丢了」）✓（代码级核查）

## 已自检（截图核过）

| 页面 | 方式 | 结果 |
|---|---|---|
| 登录 | 截图 | ✓ 暖石画布 + 居中白卡 + 火花字标 + 32px Inter Tight + 唯一青色 CTA；聚焦环为青色 2px |
| 404 | 截图 | ✓ display 标题 + 单处高亮 + 单 CTA；caption 眉题 |
| 注册 | 截图 | ✓ 与登录同卡型（同模板复用 SparkMark） |

## 代码级核查（对应 Do/Don't 条目）

- 画布 #fafaf9 / 卡片纯白：body 落 stone-canvas，全站卡片 bg-pure-white ✓
- 唯一色相：`--color-cyan-*` 三调之外无任何色相 token；FormError/驳回/破坏性均无红 ✓（grep 核查）
- 药丸按钮：Button 基类 rounded-full ✓；卡片 10px 圆角 + 1px stone 边框、无阴影 ✓
- 标题体系：页题 32px / 区块题 20px 均为 font-display 400 ✓（双榜卡题已按 spec 对齐 subheading）
- 破坏性操作二次确认：删除分类 / 禁用账号（ConfirmButton）✓；守卫不可被调用方 onClick 覆盖（类型级 Omit）✓
- smoke 文案锚点逐字未动：`git diff 719240a...HEAD -- scripts/smoke.ts` 为空 ✓

## 待用户人工过目（需登录态， dev server 自查）

- [ ] 首页（hero 文案定稿：暂用「把好案例，攒成积分」，可否决）
- [ ] 案例库 / 案例详情（含审核卡主次与驳回理由卡）
- [ ] 录入案例 / 我的案例 / 个人中心
- [ ] admin 五页（队列、账号、分类、积分配置、报表）
