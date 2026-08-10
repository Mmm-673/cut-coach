# 现场开单（助教端）设计文档

- 日期：2026-08-07
- 状态：待评审
- 范围：助教 App 端现场开单全流程

---

## 1. 背景与目标

新增独立的"助教现场开单、服务结束后付款"流程，与现有"用户预约、服务前付款"流程完全独立，互不影响。

核心特点：
- 订单由助教创建，只能由创建助教本人履约
- 服务结束后按实际时长计费，再发起支付
- 支持助教本机 App 支付、微信 Native 二维码、支付宝扫码二维码
- 不支持加钟、开始后取消、常规退款

---

## 2. 基础架构改造

### 2.1 版本号升级
- `config.js`：`appInfo.version` 从 `1.0.0` → `1.0.1`

### 2.2 请求头统一追加
在 `utils/request.js` 拦截器中，为所有登录态请求追加：
- `client-version`: `config.appInfo.version`
- `client-platform`: `getPlatform()`（调用 `utils/platform.js`）

> 老接口会忽略这两个 header，不影响现有功能。

### 2.3 错误码处理
新增业务错误码识别：
- `1010000337`：请升级客户端后使用现场开单 → 停止重试，提示升级
- `1010000338`：当前现场订单状态不允许该操作 → 刷新订单详情
- `1010000339`：返程车费必须在 0 到 5000 分之间 → 本地校验提示
- `1010000340`：订单已超时 → 联系客服
- `1010000341`：订单尚未结束或金额未锁定 → 刷新等待
- `1010000342`：现场订单已支付 → 关闭支付入口
- `1010000343`：收银台凭证无效或已过期 → 重新生成二维码
- `1010000344`：会员查询过于频繁 → 延迟查询
- `1010000345`：手机号后四位必须是四位数字 → 本地限制输入

---

## 3. API 模块设计

新增两个 API 文件，与现有 `order.js`、`wallet.js` 完全独立。

### 3.1 api/billiard/onsiteOrder.js

| 方法 | 接口 | 说明 |
|------|------|------|
| `searchMember(mobileSuffix)` | `GET /coach-api/billiard/onsite-order/member-search` | 手机号后四位查会员 |
| `createOnsiteOrder(data)` | `POST /coach-api/billiard/onsite-order/create` | 创建现场订单 |
| `getOnsiteOrderPage(params)` | `GET /coach-api/billiard/onsite-order/page` | 订单分页列表 |
| `getOnsiteOrderDetail(id)` | `GET /coach-api/billiard/onsite-order/get` | 订单详情 |
| `updateReturnTravel(data)` | `POST /coach-api/billiard/onsite-order/update-return-travel` | 修改返程车费 |
| `cancelOnsiteOrder(orderId)` | `POST /coach-api/billiard/onsite-order/cancel` | 取消订单 |
| `startOnsiteService(orderId)` | `POST /coach-api/billiard/onsite-order/start` | 开始服务 |
| `finishOnsiteService(orderId)` | `POST /coach-api/billiard/onsite-order/finish` | 结束服务并锁价 |

### 3.2 api/billiard/onsitePayment.js

| 方法 | 接口 | 说明 |
|------|------|------|
| `createOnsitePayment(data)` | `POST /coach-api/billiard/onsite-payment/create` | 创建助教本机 App 支付尝试 |
| `createOnsiteQrCode(data)` | `POST /coach-api/billiard/onsite-payment/create-qr` | 创建固定金额原生二维码 |
| `getOnsitePaymentStatus(orderId)` | `GET /coach-api/billiard/onsite-payment/status` | 查询支付和结算状态 |

---

## 4. 页面设计

所有现场订单页面放在独立子包 `subpkg/onsite/` 下，在 `pages.json` 中注册。

### 4.1 入口：个人中心

在 `pages/mine/index.vue` 功能菜单区顶部新增一项：
- 图标：`icon-blue`，使用 `compose` 图标
- 文字：「现场开单」
- 点击跳转：`/subpkg/onsite/order-list`

> 纯新增，不修改任何现有菜单项。

### 4.2 现场订单列表页（order-list）

**路径：** `subpkg/onsite/order-list`

**功能：**
- 导航栏右侧「+ 新建」按钮 → 跳转创建页
- 状态筛选 tab：全部 / 待开始 / 进行中 / 待付款 / 已完成 / 已取消
- 订单卡片列表，下拉刷新 + 上拉加载
- 卡片信息：订单号、状态标签、服务类型、客户类型、金额（已结束显示）、创建时间
- 点击卡片 → 订单详情页

**数据来源：** `onsite-order/page`

### 4.3 创建订单页（create）

**路径：** `subpkg/onsite/create`

**步骤：**

1. **服务类型选择**
   - 从教练档案 `coachProfile` 读取已开通的服务类型
   - 横向标签/卡片形式，单选
   - 名称映射：`1=台球陪练 2=达人带路 3=酒文化讲解 4=影视讲解分享`
   - 兜底：档案无此字段时默认展示"台球陪练"

2. **客户类型选择**
   - Tab 切换：「平台会员」 / 「无会员/散客」

3. **会员查询（仅平台会员）**
   - 输入框：限 4 位数字
   - 满 4 位自动查询 `/member-search`
   - 结果列表：头像 + 昵称 + 脱敏手机号，点击选中
   - 空结果：提示"未找到，可切换为无会员"
   - 频率限制错误码 `1010000344`：提示"查询过于频繁，请稍后再试"

4. **返程车费**
   - 数字输入，单位元，范围 0 ~ 50
   - 默认 0，提交时转换为分

5. **创建按钮**
   - 底部固定大按钮
   - 生成 UUID（32 位无横线）作为 `requestId`
   - 调用创建接口，成功后跳转详情页
   - 网络超时/不确定时复用原 `requestId` 重试

### 4.4 订单详情页（detail）

**路径：** `subpkg/onsite/detail`

**入参：** `id`（订单 ID）

**顶部信息区（所有状态通用）：**
- 订单号、创建时间
- 服务类型名称
- 客户类型 + 会员信息（如有）
- 订单状态标签（带颜色）

**状态驱动的内容区：**

| 状态 | 展示内容 | 操作按钮 |
|------|----------|----------|
| 15 待开始 | 小时单价、返程车费（可修改） | 修改返程车费、取消订单、开始服务 |
| 40 进行中 | 实时计时器（HH:MM:SS）、小时单价、返程车费 | 结束服务 |
| 45 待付款 | 实际时长、计费分钟、服务金额、返程车费、应付总额、支付状态 | 微信支付（App）、支付宝支付（App）、微信收款码、支付宝收款码（paymentStatus=0 时） |
| 50 待评价 | 完整订单信息 + 支付状态 | 查看详情（无业务操作） |
| 60 已完成 | 完整订单信息 + 支付状态 | 查看详情（无业务操作） |
| 70 已取消 | 完整订单信息 | 查看详情（无业务操作） |

**计时器实现：**
- 基于服务端 `startTime`，本地每秒 tick 计算已服务秒数
- `onShow` 时重新拉取详情校准 `startTime`
- 最终金额以服务端结束接口返回为准

**支付状态轮询（状态 45）：**
- `paymentStatus = 0` 时每 3 秒查询一次支付状态
- `onHide` 暂停，`onShow` 立即查询一次
- 最大轮询 200 次（防永久请求）
- `paymentStatus = 10` 后关闭所有支付入口
- `settlementStatus = 20` 后停止轮询，刷新订单详情

**App 支付流程：**
1. 点击微信/支付宝支付
2. 调用 `createOnsitePayment({ orderId, channelCode })` 获取 `payOrderId`
3. 调用现有支付提交接口 `/app-api/pay/order/submit`（传 `id = payOrderId`）
4. 拉起对应 App 支付
5. 支付结果回调后刷新支付状态

### 4.5 二维码支付页（qr-pay）

**路径：** `subpkg/onsite/qr-pay`

**入参：** `orderId` + `channelCode`（`wx_native` / `alipay_qr`）

**页面内容：**
- 支付渠道标识（微信支付 / 支付宝支付）
- 应付金额（大字醒目）
- 二维码区域（uQRCode 组件渲染 `displayContent`）
- 提示文字：「请使用微信扫码」或「请使用支付宝扫码」
- 过期倒计时（基于 `cashierExpireTime`）
- 支付状态
- 「重新生成二维码」按钮（过期后显示）

**二维码生成规则：**
- 仅当 `displayMode === 'qr_code'` 且 `displayContent` 非空时展示
- 直接使用 `displayContent` 原文，不做二次编码
- **不**使用 `cashierToken` 生成二维码

**轮询：**
- 每 2~3 秒查询支付状态
- `paymentStatus = 10` → 停止轮询，隐藏二维码，显示支付成功
- 页面回前台立即查询一次
- 防重复点击生成按钮，同一时间只展示最新二维码

---

## 5. 状态枚举

### 5.1 订单状态 status
| 值 | 名称 | 颜色 |
|----|------|------|
| 15 | 待开始 | 橙色 #f59e0b |
| 40 | 进行中 | 蓝色 #2f6bff |
| 45 | 现场待付款 | 红色 #ef4444 |
| 50 | 待评价 | 紫色 #8b5cf6 |
| 60 | 已完成 | 绿色 #10b981 |
| 70 | 已取消 | 灰色 #9ca3af |

### 5.2 支付主状态 paymentStatus
| 值 | 名称 | 客户端行为 |
|----|------|-----------|
| 0 | 未支付 | 展示支付入口 |
| 10 | 已支付 | 关闭所有支付入口 |
| 20 | 支付异常 | 停止支付，提示联系客服 |

### 5.3 结算状态 settlementStatus
| 值 | 名称 | 展示 |
|----|------|------|
| 0 | 未开始 | - |
| 10 | 处理中 | 支付成功，订单处理中... |
| 20 | 成功 | 支付成功 |
| 30 | 失败待重试 | 支付成功，结算处理中... |

---

## 6. 工具函数

### 6.1 金额格式化
统一处理"分 → 元"转换，保留两位小数，不使用浮点数累加。

### 6.2 UUID 生成
生成 32 位无横线 UUID 作为 `requestId`。

### 6.3 状态映射工具
订单状态、支付状态、服务类型等枚举的名称/颜色映射。

---

## 7. 数据持久化

**临时存储（页面级）：**
- 当前创建订单的 `requestId`（用于重试）
- 当前二维码的 `displayContent`、`cashierExpireTime`、`attemptId`

**不长期缓存：**
- 支付状态、结算状态、最终订单状态（以服务端查询为准）

---

## 8. 页面流转图

```
个人中心
  ↓ 点击"现场开单"
现场订单列表 ←──────────┐
  ↓ 点击"+ 新建"        │
创建订单页              │
  ↓ 创建成功            │
订单详情页（待开始）    │
  ↓ 开始服务            │
订单详情页（进行中）    │
  ↓ 结束服务            │
订单详情页（待付款）    │
  ├─→ App 支付 → 支付成功 → 订单详情页（已完成）
  └─→ 二维码页 → 扫码支付 → 订单详情页（已完成）
                          ↓
                      返回列表
```

---

## 9. 注意事项

1. 所有金额按"分"处理，不用浮点数累加
2. `requestId` 重试时必须复用，禁止重新生成
3. 服务计时以服务端 `startTime` 为准，客户端仅展示
4. 二维码正文是 `displayContent`，不是 `cashierToken`
5. `paymentStatus = 10` 后绝不能再次支付
6. 本期无消息通知，页面恢复必须主动查询
7. 现场订单与预约订单完全独立，代码上不共用业务逻辑
8. 不影响任何现有功能
