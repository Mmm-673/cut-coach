# 助教端押金模块设计

日期：2026-10-15
状态：已评审通过（头脑风暴逐节确认）
接口基线：《2026-10-09-客户端对接说明-押金月结退款-助教端(1)》，后端 `284756ca9e`

---

## 1. 背景与范围

助教上线接单引入押金要求：后台为每位助教配置上线门槛并录入押金，押金余额低于门槛时不能上线接单，需联系客服补齐；助教可查看押金流水明细（扣费原因、关联订单、金额、时间）。

### 本期做

| 功能 | 接口 | 状态 |
|---|---|---|
| 押金概览页（门槛/余额/双缺口/客服引导） | `GET /coach-api/billiard/deposit/get` | 后端已完成 |
| 押金流水页（分页列表） | `GET /coach-api/billiard/deposit/flow/page` | 后端已完成 |
| 上线拦截（预检 + 报错兜底） | `deposit/get` + 既有 work-status 接口 | 后端已完成 |
| 强制下线后的状态对齐 | 既有 `onShow` → `getWorkStatus` 刷新 | 后端已完成 |

### 本期明确不做

- **在线缴纳**：押金全部由后台录入，客户端不接 `deposit/payment/*` 支付链路，只引导「联系客服补齐」
- **提现周期设置**：后台控制，客户端沿用既有提现接口，拒绝时展示后端 msg
- **保底人员分类**：忽略
- **用户端退款明细**：不属于本仓库
- **caseId 案件详情跳转**：助教案件详情接口未补齐（文档第 7 节），本期纯文本展示

---

## 2. 文件结构

```
config.js                                  修改  新增 SERVICE_PHONE 常量（现 about 页硬编码 15900560488 提取共用）
api/billiard/deposit.js                    新增  getDepositOverview() / getDepositFlowPage(params)
utils/deposit.js                           新增  纯函数：金额分转元、bizType 标签映射、上线预检判断
utils/errorCode.js                         修改  增加 '101000310' 文案
subpkg/mine/wallet/deposit/index.vue       新增  押金概览页
subpkg/mine/wallet/deposit-flow/index.vue  新增  押金流水页
subpkg/mine/wallet/index.vue               修改  顶部加押金入口卡片
pages/work/index.vue                       修改  上线预检 + 101000310 兜底 + 强制下线刷新押金
pages.json                                 修改  注册两个新页面
TEST_CHECKLIST.md                          修改  补充押金模块手动验收项
tests/feature-deposit-utils.test.js        新增  utils/deposit.js 单元测试
```

页面只负责渲染与调 API；金额换算、标签映射、预检判断等逻辑全部放 `utils/deposit.js` 纯函数，保证可测。

---

## 3. 接口契约要点（摘自 2026-10-09 文档）

### 3.1 押金概览 `GET /coach-api/billiard/deposit/get`

无需传 coachId，后端绑定本人。关键字段：

| 字段 | 用法 |
|---|---|
| `enabled` | 是否已配置押金要求；`false` 时页面显示「暂未设置押金要求」，不渲染缺口 |
| `requiredAmount` | 上线门槛（分）；未配置为 null，显示「—」 |
| `balance` | 当前押金余额（分） |
| `onlineShortfall` | 恢复上线所需补缴金额（分） |
| `reviewShortfall` | 待审核案件拟扣款最大缺口（分）；单独展示，不与上线缺口相加 |
| `workStatus` | 当前工作状态，沿用既有枚举 |

### 3.2 押金流水 `GET /coach-api/billiard/deposit/flow/page?pageNo=&pageSize=`

返回 `data: {list, total}`，最新在前。

| 字段 | 用法 |
|---|---|
| `bizType` | `PAYMENT` 押金缴纳 / `PENALTY` 押金处罚 / 未知 → 通用标签「资金变动」 |
| `deltaAmount` | 带符号变动金额（分），负数为扣款 |
| `balanceBefore / balanceAfter` | 变动前后余额 |
| `reason` | 缴纳或扣费原因 |
| `orderId` | 关联订单 ID，可跳既有订单详情；可能为空 |
| `caseId` | 关联案件 ID，本期纯文本展示不跳转 |
| `reversalOf` | 被冲正流水 ID，仅展示「冲正」关系文本 |

### 3.3 关键业务规则

- 未配置押金的老助教不能被「余额为 0」误拦
- 上线拦截最终以 `POST work-status` 结果为准；`101000310` = 押金不足
- 被扣到门槛以下服务端强制下线；在服订单继续展示操作，只阻止新接单
- 补缴成功不会自动上线，需助教再次点击上线
- 金额均为整数分，展示除以 100；ID 为 64 位安全类型，禁止过 `Number()`
- 空金额/空时间显示「—」，不默认为 0

---

## 4. 页面设计

### 4.1 押金概览页 `subpkg/mine/wallet/deposit/index.vue`

- **余额卡**：当前押金余额（大字）+ 上线门槛
- **状态区三态**：
  1. `enabled === false` → 「暂未设置押金要求」
  2. `balance ≥ requiredAmount` → 绿色「已满足上线门槛」
  3. `balance < requiredAmount` → 红色「上线补缴缺口 ¥xx」+「联系客服补齐」按钮
- **联系客服**：`uni.showModal` 展示缺口金额与客服电话，确认后 `makePhoneCall(SERVICE_PHONE)`；客服电话统一取 `config.js` 的 `SERVICE_PHONE`（about 页同步改为引用常量）
- **审核扣款缺口**：独立一行展示 `reviewShortfall`，标注「待审核案件最大拟扣缺口」，不与上线缺口合并
- **底部**：说明文案「押金非收益余额，不能用于消费抵扣或提现」+「押金流水」入口
- 加载失败：重试按钮，不白屏

### 4.2 押金流水页 `subpkg/mine/wallet/deposit-flow/index.vue`

- 分页列表：pageNo 递增、pageSize 20、触底加载更多、最新在前
- 每条：bizType 标签、带符号金额（正绿负红）、reason、时间、`balanceBefore → balanceAfter`
- `orderId` 有值 → 跳既有 `pages/order/detail?id=<orderId>`
- 空状态、加载失败重试

### 4.3 钱包页入口 `subpkg/mine/wallet/index.vue`

顶部新增押金卡片：余额摘要 + 缺口警示（有缺口时红色角标），点击进押金概览页。加载失败静默降级（卡片不显示缺口，仅显示入口）。

---

## 5. 上线拦截流程（pages/work/index.vue）

`onSwitchChange(true)` 改为：**预检押金 → 获取位置 → 上线**（业务弹窗先于系统权限弹窗）：

```
1. checkDepositBeforeOnline()
   ├─ enabled === false            → 放行
   ├─ balance < requiredAmount     → showModal（缺口 + 客服按钮）→ return false 终止
   └─ 预检接口失败                  → 放行并照旧走 POST（最终以后端为准，不因查询失败阻塞上线）
2. 预检通过 → getCurrentLocation → doOnlineWithLocation（原流程不变）
3. 兜底：updateWorkStatus 被拒（如并发扣款后 101000310）
   → catch 展示 errorCode 配置文案 + 静默刷新押金概览
4. onShow → getWorkStatus 发现被强制下线时，静默刷新押金概览缓存（不新增轮询）
```

`errorCode.js` 增加：`'101000310': '押金余额不足，请联系客服补齐后再上线'`

设计依据（文档 3.4）：上线前可查押金概览提示，最终以 POST 结果为准；不依赖推送，App 回前台及恢复网络时刷新工作状态。

---

## 6. 错误处理规约

| 场景 | 客户端动作 |
|---|---|
| `101000310` | errorCode 文案提示 + 刷新押金概览 |
| `101000314`（功能未启用） | 概览页显示「押金功能暂未开放」；钱包页入口静默降级；不阻塞其余功能 |
| 概览/流水加载失败 | 各自独立重试入口 |
| 网络超时（写请求无，本期全为 GET） | 查询类直接提示重试 |

分支判断一律用 code，不对 msg 做字符串匹配（文档第 6 节约定）。

---

## 7. 测试计划

### 单元测试（vitest，`tests/feature-deposit-utils.test.js`）

对 `utils/deposit.js` 纯函数全覆盖：

- 金额分转元（含 0、null、负数、大数）
- bizType 标签映射（PAYMENT / PENALTY / 未知类型兜底）
- 预检判断三态：未配置放行 / 满足门槛放行 / 余额不足拦截
- 流水金额展示符号与颜色标识的判定

### 手动验收（联调，按文档第 8 节）

- [ ] 旧助教未配置押金，上线不被误拦
- [ ] 已配置且余额不足：上线弹缺口 + 客服按钮；POST 兜底文案正确
- [ ] 押金处罚导致在线转离线：在服订单不中断，仅阻止新接单
- [ ] 审核缺口与上线缺口分别展示、不相加
- [ ] 流水列表分页、正负金额、orderId 跳转正确
- [ ] 补缴后（后台录入）刷新概览，需手动再次上线
- [ ] 金额分转元展示、ID 无精度丢失、空值显示「—」

---

## 8. 风险与开放项

| 项 | 说明 |
|---|---|
| 客服电话 | 沿用 about 页现有号码 `15900560488`，提取为 `config.js` 常量共用 |
| work/index.vue 2504 行 | 本次只加预检函数（约 30 行）与 onShow 一处刷新，不做整体重构；预检逻辑放 utils 纯函数控制增量 |
| 后台录入的 bizType | 假设后台录入流水同样走 `PAYMENT` 类型；若出现新枚举值，未知类型兜底标签已覆盖 |
