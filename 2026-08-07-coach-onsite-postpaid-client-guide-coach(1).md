# 助教现场开单与后付费客户端接入文档（助教端）

## 1. 文档说明

- 适用客户端：
  - 助教 App；
  - 助教 App 内展示的微信、支付宝原生支付二维码。
- 适用服务类型：
  - `1`：台球陪练；
  - `2`：达人带路；
  - `3`：酒文化讲解；
  - `4`：影视讲解分享。
- 新功能版本条件：请求头 `client-version` **严格大于** `1.0.0`。
- 测试环境统一使用：`tenant-id: 122`。
- 金额单位：除非字段另有说明，所有金额均为整数分。
- 时间来源：服务开始时间、结束时间和计费时长均以服务端为准。

本次新增的是独立的"助教现场开单、服务结束后付款"流程，不替换现有"用户预约、服务前付款"流程。

现场订单的核心特点：

1. 订单由助教创建，只能由创建助教本人履约；
2. 创建时不填写预约时间和预约时长；
3. 服务开始前不创建支付单；
4. 服务结束后，服务端按实际服务时长锁定金额；
5. 支持助教本机支付、绑定会员 App 支付、微信 Native 二维码和支付宝扫码支付；
6. 第一笔有效支付成功后才进入结算；
7. 现场订单不支持加钟、开始后取消或常规退款；
8. 本期现场订单不发送开始、结束或支付成功通知，客户端必须主动刷新状态。

---

## 2. 客户端版本兼容规则

后端通过请求头 `client-version` 判断是否开放现场订单接口。

| `client-version` | 行为 |
|---|---|
| 缺失 | 不开放现场订单 |
| 格式非法，例如 `v1.0.1`、`1.0` | 不开放现场订单 |
| 小于 `1.0.0` | 不开放现场订单 |
| 等于 `1.0.0` | 不开放现场订单 |
| 大于 `1.0.0`，例如 `1.0.1` | 开放现场订单 |

新版本客户端每次请求应统一携带：

```http
tenant-id: 122
Authorization: Bearer {accessToken}
client-platform: android
client-version: 1.0.1
```

`client-version` 必须使用三段式数字版本：

```text
主版本号.次版本号.修订版本号
```

版本不满足时，服务端返回：

```json
{
  "code": 1010000337,
  "data": null,
  "msg": "请升级客户端后使用现场开单"
}
```

客户端处理要求：

1. 旧版本客户端不展示现场开单入口；
2. 收到 `1010000337` 后停止重试；
3. 提示用户升级客户端；
4. 订单创建成功后，后续流程以订单来源和订单状态为准，不再根据客户端版本推断业务规则。

匿名收银台状态接口不要求登录，也不检查 `client-version`。

---

## 3. 通用响应结构

所有接口统一返回：

```json
{
  "code": 0,
  "data": {},
  "msg": ""
}
```

客户端必须判断响应体中的 `code`，不能只判断 HTTP 状态码。

分页接口的 `data` 结构：

```json
{
  "list": [],
  "total": 0
}
```

分页参数：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---:|---:|---|
| `pageNo` | int | 否 | `1` | 最小值为 1 |
| `pageSize` | int | 否 | `10` | 范围为 1～200 |

---

## 4. 状态枚举

### 4.1 现场订单状态 `status`

| 值 | 名称 | 现场订单含义 |
|---:|---|---|
| `15` | 待开始 | 助教已创建，可修改返程车费、取消或开始服务 |
| `40` | 进行中 | 服务正在计时，不可取消或修改返程车费 |
| `45` | 现场待付款 | 服务已结束，时长和金额已锁定，可以发起支付 |
| `50` | 待评价 | 有会员订单已支付并结算成功，等待绑定会员评价 |
| `60` | 已完成 | 散客订单支付结算成功，或会员订单完成评价 |
| `70` | 已取消 | 助教在开始服务前取消 |

完整流转：

有会员订单：

```text
15 待开始
→ 40 进行中
→ 45 现场待付款
→ 50 待评价
→ 60 已完成
```

无会员订单：

```text
15 待开始
→ 40 进行中
→ 45 现场待付款
→ 60 已完成
```

开始前取消：

```text
15 待开始
→ 70 已取消
```

### 4.2 支付主状态 `paymentStatus`

| 值 | 名称 | 客户端处理 |
|---:|---|---|
| `0` | 未支付 | 可以创建支付尝试 |
| `10` | 已支付 | 禁止再次支付，继续等待或查询结算结果 |
| `20` | 支付异常 | 停止支付并提示联系客服 |

### 4.3 支付尝试状态 `attemptStatus`

| 值 | 名称 | 说明 |
|---:|---|---|
| `0` | 等待支付 | 支付单或二维码已创建，尚未收到成功回调 |
| `10` | 支付成功 | 当前尝试是订单第一笔有效支付 |
| `20` | 失败 | 创建支付单或生成渠道二维码失败 |
| `30` | 已过期 | 支付尝试已过期 |
| `40` | 重复支付成功 | 订单已有其他有效支付，本次属于重复扣款异常 |
| `50` | 金额不一致 | 渠道实付金额与订单锁定金额不一致 |

### 4.4 结算状态 `settlementStatus`

| 值 | 名称 | 客户端处理 |
|---:|---|---|
| `0` | 未开始 | 尚未认定有效支付 |
| `10` | 处理中 | 已支付，正在结算；禁止再次支付 |
| `20` | 成功 | 支付和结算均成功 |
| `30` | 失败待重试 | 已支付，后台会自动补偿；禁止再次支付 |

关键判断：

```text
paymentStatus = 0
→ 尚未支付，可以展示支付入口

paymentStatus = 10 且 settlementStatus = 10
→ 支付成功，结算处理中

paymentStatus = 10 且 settlementStatus = 20
→ 支付和结算成功

paymentStatus = 10 且 settlementStatus = 30
→ 支付成功，后台补偿处理中
```

只要 `paymentStatus = 10`，客户端就必须关闭所有支付按钮，即使订单暂时仍是 `status = 45`。

---

## 5. 客户类型与服务类型

### 5.1 客户类型 `customerType`

| 值 | 类型 | `memberUserId` |
|---:|---|---|
| `1` | 平台会员 | 必填，来自会员尾号查询结果 |
| `2` | 无会员/散客 | 必须不传 |

### 5.2 服务类型 `serviceType`

| 值 | 名称 |
|---:|---|
| `1` | 台球陪练 |
| `2` | 达人带路 |
| `3` | 酒文化讲解 |
| `4` | 影视讲解分享 |

现场订单只能选择当前助教已经开通的服务类型。

现场订单不需要：

- 服务地点；
- 预约时间；
- 预约时长；
- 确认出发；
- 确认到达；
- 加钟。

---

## 6. 助教端完整流程

```text
助教进入现场开单页
→ 选择服务类型
→ 选择"平台会员"或"无会员"
→ 平台会员：输入手机号后四位并选择会员
→ 输入返程车费
→ 创建现场订单
→ 订单进入待开始
→ 助教开始服务
→ 客户端按服务端 startTime 展示实时计时
→ 助教结束服务
→ 服务端锁定实际时长和应付金额
→ 订单进入现场待付款
→ 选择支付方式
   ├── 助教本机微信/支付宝 App 支付
   ├── 展示微信 Native 固定金额二维码
   └── 展示支付宝固定金额二维码
→ 主动轮询支付状态
→ 支付和结算成功
→ 有会员订单进入待评价
→ 无会员订单直接完成
```

---

## 7. 按手机号后四位查询会员

### 7.1 接口定义

```http
GET /coach-api/billiard/onsite-order/member-search
```

鉴权：需要助教登录 Token。

版本：要求 `client-version > 1.0.0`。

### 7.2 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `mobileSuffix` | string | 是 | 严格四位数字 |

请求示例：

```http
GET /coach-api/billiard/onsite-order/member-search?mobileSuffix=1234 HTTP/1.1
tenant-id: 122
Authorization: Bearer {coachAccessToken}
client-platform: android
client-version: 1.0.1
```

### 7.3 成功响应

```json
{
  "code": 0,
  "data": [
    {
      "userId": 10001,
      "nickname": "张三",
      "avatar": "https://example.com/avatar.png",
      "maskedMobile": "138****1234"
    }
  ],
  "msg": ""
}
```

响应字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `userId` | long | 会员 ID，创建订单时提交 |
| `nickname` | string | 会员昵称 |
| `avatar` | string | 会员头像，可为空 |
| `maskedMobile` | string | 脱敏手机号 |

规则：

1. 最多返回 20 条；
2. 只返回当前租户的正常会员；
3. 助教必须处于启用、在线状态；
4. 每位助教每分钟最多查询 5 次；
5. 每位助教每天最多查询 100 次；
6. 没有结果时返回空数组。

空结果：

```json
{
  "code": 0,
  "data": [],
  "msg": ""
}
```

客户端建议：

- 输入框只允许数字；
- 输入满四位后再请求；
- 不要逐位自动遍历；
- 多人匹配时必须让助教手工确认；
- 查询失败或无结果时允许切换为"无会员"。

---

## 8. 创建现场订单

### 8.1 接口定义

```http
POST /coach-api/billiard/onsite-order/create
Content-Type: application/json
```

### 8.2 请求体

有会员订单：

```json
{
  "requestId": "f6bf50d33d5c4a6d9366fc0bf2308764",
  "serviceType": 1,
  "customerType": 1,
  "memberUserId": 10001,
  "returnTravelAmount": 1000
}
```

无会员订单：

```json
{
  "requestId": "3d7f29f0bd1f48dd93b5e8b7ee32f037",
  "serviceType": 3,
  "customerType": 2,
  "returnTravelAmount": 0
}
```

字段：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `requestId` | string | 是 | 客户端请求幂等号，最大 64 字符 |
| `serviceType` | int | 是 | 服务类型 1～4 |
| `customerType` | int | 是 | `1` 会员，`2` 无会员 |
| `memberUserId` | long | 条件必填 | `customerType=1` 时必填；`customerType=2` 时不传 |
| `returnTravelAmount` | int | 是 | 返程车费，单位分，范围 0～5000 |

### 8.3 `requestId` 使用规则

每次新的开单动作生成一个新的唯一值，建议使用 UUID：

```text
f6bf50d33d5c4a6d9366fc0bf2308764
```

网络超时、请求结果不确定时，必须使用原 `requestId` 重试。

禁止在重试时生成新 `requestId`，否则可能创建重复订单。

同一助教重复提交相同 `requestId` 时，服务端返回第一次创建的订单，不会覆盖原订单。

### 8.4 成功响应

```json
{
  "code": 0,
  "data": {
    "id": 30001,
    "orderNo": "20260807113000123456",
    "userId": 10001,
    "coachId": 20001,
    "customerType": 1,
    "serviceType": 1,
    "status": 15,
    "unitPrice": 12000,
    "billingMinutes": null,
    "actualDurationSeconds": null,
    "returnTravelAmount": 1000,
    "payAmount": null,
    "paymentStatus": 0,
    "settlementStatus": 0,
    "startTime": null,
    "endTime": null
  },
  "msg": ""
}
```

创建成功后：

- `status = 15`；
- 不创建支付单；
- `payAmount = null`；
- 小时单价已锁定；
- 可以修改返程车费、取消或开始服务。

---

## 9. 现场订单响应字段

`OnsiteOrderRespVO`：

| 字段 | 类型 | 可空 | 说明 |
|---|---|---:|---|
| `id` | long | 否 | 订单 ID |
| `orderNo` | string | 否 | 展示订单号 |
| `userId` | long | 是 | 会员 ID；散客为空 |
| `coachId` | long | 否 | 助教 ID |
| `customerType` | int | 否 | `1` 会员，`2` 无会员 |
| `serviceType` | int | 否 | 服务类型 1～4 |
| `status` | int | 否 | 订单状态 |
| `unitPrice` | int | 否 | 小时单价，单位分/小时 |
| `billingMinutes` | int | 是 | 计费分钟数，结束锁价后返回 |
| `actualDurationSeconds` | long | 是 | 实际服务秒数，结束锁价后返回 |
| `returnTravelAmount` | int | 否 | 返程车费，单位分 |
| `payAmount` | int | 是 | 最终应付金额，结束锁价后返回 |
| `paymentStatus` | int | 否 | 支付主状态 |
| `settlementStatus` | int | 否 | 结算状态 |
| `startTime` | datetime | 是 | 服务端开始时间 |
| `endTime` | datetime | 是 | 服务端结束时间 |

只有以下状态返回最终计费字段：

- `45` 现场待付款；
- `50` 待评价；
- `60` 已完成。

在 `15`、`40`、`70` 状态中：

```text
billingMinutes = null
actualDurationSeconds = null
payAmount = null
```

`returnTravelAmount` 始终返回。

---

## 10. 订单列表和详情

### 10.1 订单分页

```http
GET /coach-api/billiard/onsite-order/page?pageNo=1&pageSize=10
```

只返回当前助教的现场订单，按创建时间倒序。

### 10.2 订单详情

```http
GET /coach-api/billiard/onsite-order/get?id={orderId}
```

当前助教必须同时是订单创建助教和履约助教。

客户端建议：

- 页面恢复时先请求详情；
- 所有操作成功后重新请求详情；
- 不要只依赖本地缓存状态决定按钮。

---

## 11. 修改返程车费

### 11.1 接口定义

```http
POST /coach-api/billiard/onsite-order/update-return-travel
```

请求体：

```json
{
  "orderId": 30001,
  "returnTravelAmount": 1500
}
```

规则：

- 只能在 `status = 15` 时修改；
- 金额范围 0～5000 分；
- 服务开始后永久锁定；
- 修改和"开始服务"并发时，以服务端最终状态为准。

---

## 12. 取消现场订单

### 12.1 接口定义

```http
POST /coach-api/billiard/onsite-order/cancel
```

请求体：

```json
{
  "orderId": 30001
}
```

成功响应：

```json
{
  "code": 0,
  "data": true,
  "msg": ""
}
```

规则：

- 仅 `status = 15` 可以取消；
- 服务开始后不能取消；
- 取消不涉及退款；
- 取消后状态为 `70`；
- 重复取消可能返回状态不允许，客户端应刷新详情。

---

## 13. 开始服务

### 13.1 接口定义

```http
POST /coach-api/billiard/onsite-order/start
```

请求体：

```json
{
  "orderId": 30001
}
```

成功响应的关键字段：

```json
{
  "status": 40,
  "startTime": "2026-08-07 11:40:00",
  "billingMinutes": null,
  "payAmount": null
}
```

规则：

1. 首次开始要求订单为 `status = 15`；
2. 开始时间由服务端生成；
3. 开始后状态变为 `40`；
4. 重复调用开始接口时，若订单已经是 `40`，服务端返回当前订单；
5. 不重复创建计时记录；
6. 同一助教不能同时服务其他预约订单或现场订单。

客户端计时建议：

```text
已服务秒数 = 当前客户端时间 - startTime
```

`startTime` 是服务端权威时间。客户端计时仅用于展示，最终金额不使用客户端计时结果。

页面重新进入前台时，应重新请求订单详情并使用最新 `startTime` 校准。

---

## 14. 结束服务并锁定金额

### 14.1 接口定义

```http
POST /coach-api/billiard/onsite-order/finish
```

请求体：

```json
{
  "orderId": 30001
}
```

成功响应示例：

```json
{
  "code": 0,
  "data": {
    "id": 30001,
    "status": 45,
    "unitPrice": 12000,
    "billingMinutes": 63,
    "actualDurationSeconds": 3721,
    "returnTravelAmount": 1000,
    "payAmount": 13600,
    "paymentStatus": 0,
    "settlementStatus": 0,
    "startTime": "2026-08-07 11:40:00",
    "endTime": "2026-08-07 12:42:01"
  },
  "msg": ""
}
```

计费规则：

```text
actualDurationSeconds = endTime - startTime
billingMinutes = max(向上取整(actualDurationSeconds / 60), 1)
serviceAmount = round(unitPrice × billingMinutes / 60)
payAmount = serviceAmount + returnTravelAmount
```

示例：

```text
实际时长：3721 秒
计费分钟：63 分钟
小时单价：120 元
服务金额：126 元
返程车费：10 元
最终应付：136 元
```

规则：

- 结束时间由服务端生成；
- 客户端不能传时长或金额；
- 结束后金额不可修改；
- 订单变为 `status = 45`；
- `status = 45` 时重复结束会返回已锁价结果；
- 服务达到 24 小时后不能正常结束，需要管理员处理。

---

## 15. 支付方式总览

| 场景 | 接口 | 推荐渠道 | 客户端后续动作 |
|---|---|---|---|
| 助教本机支付 | `/coach-api/billiard/onsite-payment/create` | `wx_app`、`alipay_app` | 使用返回的 `payOrderId` 调用现有支付提交接口 |
| 会员 App 支付 | `/app-api/billiard/onsite-payment/create` | `wx_app`、`alipay_app` | 会员在用户 App 内完成支付（助教端不调用此接口） |
| 助教展示微信二维码 | `/coach-api/billiard/onsite-payment/create-qr` | `wx_native` | 直接渲染返回的 `displayContent` |
| 助教展示支付宝二维码 | `/coach-api/billiard/onsite-payment/create-qr` | `alipay_qr` | 直接渲染返回的 `displayContent` |

现场订单不支持：

- 钱包支付；
- 现金确认；
- 手工确认已付款；
- 客户修改支付金额；
- 聚合支付二维码。

---

## 16. 助教端本机 App 支付

### 16.1 创建支付尝试

```http
POST /coach-api/billiard/onsite-payment/create
```

请求：

```json
{
  "orderId": 30001,
  "channelCode": "wx_app"
}
```

支持：

- `wx_app`；
- `alipay_app`。

响应示例：

```json
{
  "code": 0,
  "data": {
    "paymentId": 50001,
    "attemptId": 51001,
    "payOrderId": 60001,
    "orderId": 30001,
    "merchantOrderNo": "ONSITE_30001_51001",
    "amount": 13600,
    "paymentStatus": 0,
    "attemptStatus": 0,
    "settlementStatus": 0,
    "channelCode": "wx_app",
    "displayMode": null,
    "displayContent": null,
    "cashierToken": null,
    "cashierExpireTime": null
  },
  "msg": ""
}
```

该接口只创建支付单，不拉起 App 支付。

客户端继续调用现有支付提交接口：

```http
POST /app-api/pay/order/submit
```

请求示例：

```json
{
  "id": 60001,
  "channelCode": "wx_app"
}
```

调用时必须使用现场支付创建响应中的：

- `payOrderId` 作为 `id`；
- 原 `channelCode`；
- 不传金额。

支付模块返回微信或支付宝 App 拉起参数后，客户端按现有支付接入方式处理。

注意：

- 每次调用 `/create` 都会创建新的支付尝试；
- 客户端必须防重复点击；
- 支付结果不确定时先查询状态，不要立即创建新尝试；
- 第一笔有效支付成功后，其他支付入口全部关闭。

---

## 17. 创建固定金额原生二维码

### 17.1 接口定义

```http
POST /coach-api/billiard/onsite-payment/create-qr
```

### 17.2 微信 Native 二维码

请求：

```json
{
  "orderId": 30001,
  "channelCode": "wx_native"
}
```

### 17.3 支付宝扫码二维码

请求：

```json
{
  "orderId": 30001,
  "channelCode": "alipay_qr"
}
```

二维码接口只允许：

| `channelCode` | 说明 |
|---|---|
| `wx_native` | 微信 Native 扫码支付 |
| `alipay_qr` | 支付宝当面付扫码支付 |

禁止在该接口使用：

- `wx_app`；
- `alipay_app`；
- `wallet`；
- 其他任意渠道。

### 17.4 成功响应

微信示例：

```json
{
  "code": 0,
  "data": {
    "paymentId": 50001,
    "attemptId": 51002,
    "payOrderId": 60002,
    "orderId": 30001,
    "merchantOrderNo": "ONSITE_30001_51002",
    "amount": 13600,
    "paymentStatus": 0,
    "attemptStatus": 0,
    "settlementStatus": 0,
    "channelCode": "wx_native",
    "displayMode": "qr_code",
    "displayContent": "weixin://wxpay/bizpayurl?pr=xxxxxxxx",
    "cashierToken": "c4178bfb...省略...",
    "cashierExpireTime": "2026-08-07 13:00:00"
  },
  "msg": ""
}
```

支付宝示例：

```json
{
  "code": 0,
  "data": {
    "paymentId": 50001,
    "attemptId": 51003,
    "payOrderId": 60003,
    "orderId": 30001,
    "merchantOrderNo": "ONSITE_30001_51003",
    "amount": 13600,
    "paymentStatus": 0,
    "attemptStatus": 0,
    "settlementStatus": 0,
    "channelCode": "alipay_qr",
    "displayMode": "qr_code",
    "displayContent": "https://qr.alipay.com/xxxxxxxx",
    "cashierToken": "ec3ce02a...省略...",
    "cashierExpireTime": "2026-08-07 13:00:00"
  },
  "msg": ""
}
```

### 17.5 二维码渲染规则

客户端仅在以下条件同时满足时展示二维码：

```text
displayMode == "qr_code"
displayContent 非空
```

二维码组件输入：

```text
displayContent
```

重要：

1. `displayContent` 是渠道原生二维码正文，不是图片 URL；
2. 客户端必须原样传给二维码组件；
3. 不要对内容二次 URL 编码；
4. 不要拼接订单号、金额或 Token；
5. 不要使用 `cashierToken` 生成支付二维码；
6. 金额已经由服务端锁定，客户端不能修改；
7. 微信码只能使用微信扫码；
8. 支付宝码只能使用支付宝扫码；
9. 当前不是聚合码，页面应分别提供"微信收款码"和"支付宝收款码"。

伪代码：

```javascript
if (response.displayMode === 'qr_code' && response.displayContent) {
  renderQrCode(response.displayContent)
} else {
  showError('支付二维码生成失败，请重新尝试')
}
```

### 17.6 页面展示建议

二维码页面至少展示：

- 微信支付或支付宝支付标识；
- 订单应付金额；
- 二维码；
- "请使用微信扫码"或"请使用支付宝扫码"；
- 二维码过期倒计时；
- 支付状态；
- "重新生成二维码"按钮。

不要展示：

- 客户完整手机号；
- 内部支付聚合 ID；
- 商户支付单号；
- 付款人身份；
- 可编辑金额输入框。

### 17.7 二维码过期和重新生成

以 `cashierExpireTime` 为过期时间。

过期后：

```text
停止展示原二维码
→ 停止继续轮询旧 token
→ 显示"二维码已过期"
→ 助教点击重新生成
→ 再次调用 create-qr
```

每次调用 `create-qr` 都会创建新的支付尝试，不是幂等接口。

客户端必须：

- 防止按钮连点；
- 同一时间只展示一个最新二维码；
- 支付状态不确定时先查询，不要立即重新生成；
- 一旦 `paymentStatus = 10`，禁止重新生成。

---

## 18. 支付响应字段

`OnsitePaymentRespVO`：

| 字段 | 类型 | 可空 | 说明 |
|---|---|---:|---|
| `paymentId` | long | 否 | 现场支付聚合 ID |
| `attemptId` | long | 是 | 本次支付尝试 ID |
| `payOrderId` | long | 是 | pay 模块支付单 ID |
| `orderId` | long | 否 | 现场订单 ID |
| `merchantOrderNo` | string | 是 | 商户支付单号 |
| `amount` | int | 否 | 固定支付金额，单位分 |
| `paymentStatus` | int | 否 | 支付主状态 |
| `attemptStatus` | int | 是 | 本次尝试状态 |
| `settlementStatus` | int | 否 | 结算状态 |
| `channelCode` | string | 是 | 本次固定支付渠道 |
| `displayMode` | string | 是 | 二维码成功时为 `qr_code` |
| `displayContent` | string | 是 | 渠道原生二维码正文 |
| `cashierToken` | string | 是 | 匿名只读状态查询凭证 |
| `cashierExpireTime` | datetime | 是 | 匿名查询凭证和二维码页面有效期 |

不同接口的字段差异：

| 接口 | 支付尝试字段 | 二维码字段 | Token |
|---|---:|---:|---:|
| 助教 `/create` | 有 | 无 | 无 |
| 助教 `/create-qr` | 有 | 有 | 有 |
| 登录态 `/status` | 无 | 无 | 无 |
| 匿名 `/get`、`/status` | 有 | 不返回 | 不回传明文 |

---

## 19. 支付状态查询和轮询

### 19.1 助教端查询

```http
GET /coach-api/billiard/onsite-payment/status?orderId={orderId}
```

响应示例：

```json
{
  "code": 0,
  "data": {
    "paymentId": 50001,
    "attemptId": null,
    "payOrderId": null,
    "orderId": 30001,
    "merchantOrderNo": null,
    "amount": 13600,
    "paymentStatus": 10,
    "attemptStatus": null,
    "settlementStatus": 20,
    "channelCode": null,
    "displayMode": null,
    "displayContent": null,
    "cashierToken": null,
    "cashierExpireTime": null
  },
  "msg": ""
}
```

建议轮询策略：

1. 支付拉起或二维码展示后，每 2～3 秒查询一次；
2. 页面进入后台时暂停轮询；
3. 页面回到前台时立即查询一次；
4. 连续轮询建议设置上限，避免永久请求；
5. `paymentStatus = 10` 后停止支付轮询；
6. 若 `settlementStatus = 10/30`，可以降低频率继续查询订单详情；
7. 不要因为结算尚未成功而重新发起支付。

### 19.2 客户扫码支付后的页面处理

```text
展示二维码
→ 客户扫码并完成支付
→ 助教 App 轮询支付状态
→ paymentStatus 变为 10
→ 立即隐藏二维码和所有支付按钮
→ settlementStatus 为 10 时显示"支付成功，订单处理中"
→ settlementStatus 为 20 时显示"支付成功"
→ 刷新订单详情
```

---

## 20. 匿名收银台状态查询

匿名状态查询不是支付提交接口，只用于受控查询某个二维码支付尝试。

### 20.1 获取状态

```http
POST /app-api/billiard/onsite-cashier/get
Content-Type: application/json
```

请求：

```json
{
  "token": "{create-qr 返回的 cashierToken}"
}
```

### 20.2 轮询状态

```http
POST /app-api/billiard/onsite-cashier/status
Content-Type: application/json
```

请求体相同。

两个接口当前均为只读查询。

注意：

- 没有 `/app-api/billiard/onsite-cashier/submit` 接口；
- 匿名客户不需要调用平台接口发起支付；
- 客户直接扫描微信/支付宝原生二维码；
- 匿名接口不会重新返回 `displayContent`；
- 每个 IP 每分钟最多调用 30 次；
- Token 过期后返回 `1010000343`。

---

## 21. 客户端按钮状态建议

| 订单状态 | 显示按钮 |
|---:|---|
| `15` 待开始 | 修改返程车费、取消订单、开始服务 |
| `40` 进行中 | 结束服务 |
| `45` 现场待付款，未支付 | 助教本机支付、微信二维码、支付宝二维码 |
| `45` 已支付、结算处理中 | 无支付按钮，显示处理中 |
| `50` 待评价 | 查看详情 |
| `60` 已完成 | 查看详情 |
| `70` 已取消 | 查看详情 |

客户端不能只看 `status` 判断是否允许再次支付，还必须同时检查 `paymentStatus`。

---

## 22. 幂等和重复点击处理

| 操作 | 幂等性 | 客户端要求 |
|---|---|---|
| 创建订单 | 强幂等 | 重试复用原 `requestId` |
| 修改返程车费 | 同值可重复 | 提交后刷新详情 |
| 取消订单 | 非结果幂等 | 成功后立即禁用按钮 |
| 开始服务 | 幂等 | 超时可重试同一订单 |
| 结束服务 | 待支付状态下幂等 | 超时可先查详情，再决定是否重试 |
| 创建 App 支付 | 每次新建尝试 | 防重复点击 |
| 创建二维码 | 每次新建尝试 | 防重复点击，只保留最新二维码 |
| 支付回调 | 服务端幂等 | 客户端无需处理回调重试 |
| 状态查询 | 幂等 | 可以安全轮询 |

二维码并发注意：

服务端只认定第一笔有效支付。其他二维码如果之后真实扣款，会被记录为重复支付异常，需要人工处理。因此客户端必须尽量避免同时展示多个有效二维码。

---

## 23. 主要错误码

| 错误码 | 消息 | 客户端处理 |
|---:|---|---|
| `1010000337` | 请升级客户端后使用现场开单 | 停止重试，引导升级 |
| `1010000338` | 当前现场订单状态不允许该操作 | 刷新订单详情和按钮 |
| `1010000339` | 返程车费必须在0到5000分之间 | 校验输入范围 |
| `1010000340` | 订单已超时，请联系管理员 | 禁止正常结束，联系客服 |
| `1010000341` | 现场订单尚未结束或金额未锁定 | 刷新订单，等待结束锁价 |
| `1010000342` | 现场订单已支付 | 关闭支付入口，查询状态 |
| `1010000343` | 收银台凭证无效或已过期 | 停止使用旧 Token，重新生成二维码 |
| `1010000344` | 会员查询过于频繁，请稍后重试 | 延迟查询 |
| `1010000345` | 手机号后四位必须是四位数字 | 本地限制四位数字 |

还可能返回：

| 错误码常量 | 消息 | 场景 |
|---|---|---|
| `COACH_NOT_EXISTS` | 助教不存在 | 当前账号未绑定助教 |
| `ORDER_COACH_NOT_ONLINE` | 助教当前不在线，无法下单 | 助教未上线 |
| `ORDER_COACH_IN_SERVICE` | 助教当前正在服务中，无法接单 | 存在冲突订单 |
| `ORDER_SERVICE_TYPE_NOT_SUPPORTED` | 助教暂不支持该服务类型 | 服务类型未开通 |
| `ORDER_NOT_BELONG_TO_COACH` | 订单不属于当前助教 | 助教越权访问 |
| `MEMBER_USER_NOT_EXISTS` | 会员用户不存在 | 选中的会员无效或已停用 |

Bean Validation 参数错误会返回通用参数错误。客户端应直接展示服务端 `msg`，并针对上述业务码做页面状态修正。

---

## 24. 页面恢复与状态同步

本期现场订单不发送通知，因此客户端必须做好主动恢复：

### 24.1 助教 App

进入现场订单页面时：

```text
请求现场订单列表
→ 找到未完成订单
→ 请求订单详情
→ 根据 status、paymentStatus、settlementStatus 恢复页面
```

二维码页面回到前台时：

```text
立即查询支付状态
→ 已支付则关闭二维码
→ 未支付且未过期则继续展示
→ 已过期则提示重新生成
```

---

## 25. 客户端本地数据建议

客户端可以临时保存：

- 当前创建订单的 `requestId`；
- 当前现场订单 ID；
- 当前二维码响应中的：
  - `attemptId`；
  - `payOrderId`；
  - `channelCode`；
  - `displayContent`；
  - `cashierToken`；
  - `cashierExpireTime`。

不要长期缓存：

- 过期二维码内容；
- 支付状态；
- 结算状态；
- 最终订单状态。

支付和订单状态必须以服务端查询结果为准。

---

## 26. 联调检查清单

### 26.1 通用

- [ ] 所有登录态请求携带 `tenant-id: 122`
- [ ] 所有现场登录态接口携带 `client-version > 1.0.0`
- [ ] 客户端正确处理 `CommonResult.code`
- [ ] 金额全部按"分"处理
- [ ] 不使用浮点数累加金额

### 26.2 助教端开单

- [ ] 手机号尾号只允许四位数字
- [ ] 多会员匹配时允许手工选择
- [ ] 创建订单使用唯一 `requestId`
- [ ] 网络重试复用原 `requestId`
- [ ] 有会员时提交 `memberUserId`
- [ ] 无会员时不提交 `memberUserId`
- [ ] 返程车费限制为 0～5000 分
- [ ] 开始前允许修改返程车费和取消
- [ ] 开始后关闭修改、取消入口

### 26.3 计时和锁价

- [ ] 使用服务端 `startTime` 展示实时计时
- [ ] App 回前台后重新同步订单详情
- [ ] 不向结束接口提交客户端时长
- [ ] 不在服务进行中展示最终金额
- [ ] 结束后展示实际秒数、计费分钟和最终金额

### 26.4 微信二维码

- [ ] `channelCode = wx_native`
- [ ] 校验 `displayMode = qr_code`
- [ ] 使用 `displayContent` 原文生成二维码
- [ ] 页面明确提示"请使用微信扫码"
- [ ] 不使用 `cashierToken` 生成支付二维码
- [ ] 过期后停止展示并重新生成

### 26.5 支付宝二维码

- [ ] `channelCode = alipay_qr`
- [ ] 校验 `displayMode = qr_code`
- [ ] 使用 `displayContent` 原文生成二维码
- [ ] 页面明确提示"请使用支付宝扫码"
- [ ] 过期后停止展示并重新生成

### 26.6 支付状态

- [ ] 支付中每 2～3 秒查询一次
- [ ] App 进入后台时暂停轮询
- [ ] App 回前台时立即查询
- [ ] `paymentStatus = 10` 后关闭所有支付入口
- [ ] `settlementStatus = 10/30` 时不允许再次支付
- [ ] 支付成功后刷新订单详情
- [ ] 防止并发创建多个二维码

---

## 27. 接口汇总

### 27.1 助教端

| 方法 | 接口 | 说明 |
|---|---|---|
| GET | `/coach-api/billiard/onsite-order/member-search` | 手机号后四位查询会员 |
| POST | `/coach-api/billiard/onsite-order/create` | 创建现场订单 |
| GET | `/coach-api/billiard/onsite-order/page` | 现场订单分页 |
| GET | `/coach-api/billiard/onsite-order/get` | 现场订单详情 |
| POST | `/coach-api/billiard/onsite-order/update-return-travel` | 修改返程车费 |
| POST | `/coach-api/billiard/onsite-order/cancel` | 开始前取消 |
| POST | `/coach-api/billiard/onsite-order/start` | 开始服务 |
| POST | `/coach-api/billiard/onsite-order/finish` | 结束服务并锁价 |
| POST | `/coach-api/billiard/onsite-payment/create` | 创建助教本机支付尝试 |
| POST | `/coach-api/billiard/onsite-payment/create-qr` | 创建固定金额原生二维码 |
| GET | `/coach-api/billiard/onsite-payment/status` | 查询支付和结算状态 |

### 27.2 匿名状态查询

| 方法 | 接口 | 说明 |
|---|---|---|
| POST | `/app-api/billiard/onsite-cashier/get` | Token 查询支付摘要 |
| POST | `/app-api/billiard/onsite-cashier/status` | Token 轮询支付状态 |

不存在以下接口：

```http
POST /app-api/billiard/onsite-cashier/submit
```

客户通过微信或支付宝扫描原生渠道二维码完成支付，不调用平台匿名提交接口。

---

## 28. 测试请求头

助教端：

```http
tenant-id: 122
Authorization: Bearer {coachTestAccessToken}
client-platform: android
client-version: 1.0.1
```

匿名状态查询：

```http
tenant-id: 122
Content-Type: application/json
```

---

## 29. 最终客户端实现要点

1. 现场订单是独立流程，不复用预约订单的接单、出发、到达、加钟页面；
2. 创建订单必须使用稳定 `requestId`；
3. 服务计时以服务端 `startTime` 为准；
4. 最终金额只能使用结束接口返回值；
5. 二维码支付只能使用 `wx_native` 或 `alipay_qr`；
6. 支付二维码正文是 `displayContent`，不是 `cashierToken`；
7. 二维码金额已经锁定，客户端不提供修改金额能力；
8. 微信码和支付宝码分开生成、分开展示；
9. 支付状态必须主动轮询；
10. `paymentStatus = 10` 后绝不能再次支付；
11. 现场订单本期没有消息通知，页面恢复必须主动查询；
12. 所有联调先在测试环境和租户 `122` 完成。
