# 助教端接口文档

> 本文档涵盖台球陪练平台助教端（`/coach-api/billiard/**`）的核心接口定义，包含助教自身管理、订单处理、计时、钱包、财务、申诉等模块。
> 
> **鉴权说明**：所有助教端接口均需校验 Token，从 `SecurityFrameworkUtils.getLoginUserId()` 取当前助教的 `system_users.id`，再关联 `billiard_coach.user_id` 确认助教档案存在且状态正常。

## 1. 助教自身模块

Controller 类：`CoachSelfController`
建议包路径：`cn.iocoder.yudao.module.billiard.controller.coach.coach.CoachSelfController`
注解路由：`@RequestMapping("/coach-api/billiard/coach")`

### 1.1 POST /coach-api/billiard/coach/work-status — 切换工作状态

**功能**：助教主动上线/下线，控制其是否出现在用户端列表中。

**请求体：**

```json
{
  "workStatus": 1,
  "longitude": 121.5101,
  "latitude": 31.2351
}
```

| 参数           | 类型      | 必填 | 说明        |
| ------------ | ------- | --- | --------- |
| `workStatus` | tinyint | 是 | 0=下线 1=上线 |
| `longitude`  | decimal | 否 | 上线时必填，经度  |
| `latitude`   | decimal | 否 | 上线时必填，纬度  |

**业务规则：**

- 下线时，若助教有进行中的订单，不允许切换（由订单模块服务层判断）
- 上线时，校验 `billiard_coach.status = 1`（账号启用中），禁用账号不允许上线
- 上线时强制携带经纬度，并同步更新 `billiard_coach.longitude/latitude`

**响应**：`CommonResult<Boolean>`

---

### 1.2 GET /coach-api/billiard/coach/work-status — 查询当前本人工作状态

**功能**：返回当前登录助教的最小工作状态信息，用于助教端首页快速刷新上下线状态。

**响应字段：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `workStatus` | tinyint | 是 | 0=下线 1=上线 |
| `updateTime` | long | 是 | 最近一次状态更新时间（毫秒时间戳） |

**响应**：`CommonResult<CoachWorkStatusRespVO>`

---

### 1.3 POST /coach-api/billiard/coach/location — 更新助教坐标

**功能**：助教在登录后主动上报当前位置坐标，供用户端距离排序使用。

**请求体：**

```json
{
  "longitude": 121.5201,
  "latitude": 31.2361
}
```

| 参数          | 类型      | 必填 | 说明                   |
| ----------- | ------- | --- | -------------------- |
| `longitude` | decimal | 是 | 经度，范围 [-180, 180] |
| `latitude`  | decimal | 是 | 纬度，范围 [-90, 90]   |

**业务规则：**

- 仅允许在线助教调用；下线状态调用返回业务异常
- 增加 5 秒限频，防止客户端高频上报坐标
- 登录接口在 `system` 模块，保持模块边界不改动；助教端登录成功后第一步调用该接口

**响应**：`CommonResult<Boolean>`

---

### 1.4 GET /coach-api/billiard/coach/profile — 查看自身信息

**功能**：助教查看自己的业务档案（艺名、级别、简介、照片、证书等）。

**响应字段**：与助教详情（App 端）相同，额外返回 `commissionRate`（扣佣比例，仅助教可见）。

---

### 1.5 POST /coach-api/billiard/coach/free-travel — 切换低碳出行开关

**功能**：助教主动开启或关闭“低碳出行”。开启后，用户端展示“低碳出行”标签，且用户下单时车费记为 0。

**请求体：**

```json
{
  "freeTravel": true
}
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `freeTravel` | boolean | 是 | true=开启低碳出行（免收车费），false=关闭 |

**业务规则：**
- 更新 `billiard_coach.travel_fee_enabled` 字段（true 对应 0，false 对应 1；或根据具体设计，此处仅为开关标识）。
- 若开启低碳出行，自动为该助教的 `tags` 追加“低碳出行”标签；若关闭则移除该标签。

**响应**：`CommonResult<Boolean>`

---

### 1.6 GET /coach-api/billiard/coach/dashboard — 获取助教看板

**功能**：返回助教今日的服务时长、服务次数和预计收入（个人中心简易看板）。

**响应体（CoachDashboardRespVO）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `todayServiceMinutes` | int | 是 | 今日服务总时长（分钟） |
| `todayServiceCount` | int | 是 | 今日服务次数 |
| `todayEstimatedIncome` | decimal | 是 | 今日预计收入（元） |

---

### 1.7 GET /coach-api/billiard/coach/statistics — 查询当前助教综合统计

**功能**：查询当前登录助教在指定时间范围内的上钟总时长、完成订单数、已到账提现总金额。

**请求参数（`CoachStatisticsReqVO`）：**

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `rangeType` | string | 否 | 时间范围枚举，不传默认 `RECENT_3_DAYS` |

**`rangeType` 枚举值：**

| 枚举值 | 说明 |
| --- | --- |
| `RECENT_3_DAYS` | 近三天 |
| `WEEK` | 每周，当前时间往前推 7 天 |
| `MONTH` | 每月，当前时间往前推 1 个月 |
| `QUARTER` | 季度，当前时间往前推 3 个月 |
| `HALF_YEAR` | 半年，当前时间往前推 6 个月 |
| `YEAR` | 一年，当前时间往前推 1 年 |

**响应体（`CoachStatisticsRespVO`）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `rangeType` | string | 是 | 实际使用的时间范围枚举 |
| `startTime` | long | 是 | 统计开始时间（毫秒时间戳） |
| `endTime` | long | 是 | 统计结束时间（毫秒时间戳） |
| `totalServiceMinutes` | int | 是 | 上钟总时长（分钟），按订单 `end_time` 归属范围汇总 `actual_duration` |
| `orderCount` | long | 是 | 完成订单数，仅统计 `status = COMPLETED(60)` 且 `end_time` 落入范围的订单 |
| `totalWithdrawAmount` | int | 是 | 已到账提现总金额（分），仅统计 `status = SUCCESS(2)` 且 `pay_time` 落入范围的提现申请 |

**HTTP 请求示例：**

```http
GET /coach-api/billiard/coach/statistics?rangeType=MONTH
Authorization: Bearer {coach_token}
tenant-id: 122
```

**JSON 响应示例：**

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "rangeType": "MONTH",
    "startTime": 1774972800000,
    "endTime": 1777564799000,
    "totalServiceMinutes": 960,
    "orderCount": 12,
    "totalWithdrawAmount": 50000
  }
}
```

**业务规则：**
- 当前登录账号必须存在助教档案，否则返回助教不存在业务异常。
- `rangeType` 不传时使用 `RECENT_3_DAYS`；传入非枚举值时按参数校验失败处理。
- 时间范围按当前服务器时间向前滚动计算，不按自然周、自然月截断。

---

## 2. 订单模块

Controller 类：`CoachOrderController`
建议包路径：`cn.iocoder.yudao.module.billiard.controller.coach.order.CoachOrderController`
注解路由：`@RequestMapping("/coach-api/billiard/order")`

### 2.1 GET /coach-api/billiard/order/pending — 待接单列表

**功能**：返回当前助教的待接单列表（status=PENDING_ACCEPT）。

**业务过滤：** `coach_id = 当前助教.billiard_coach.id AND status = 20 AND deleted = 0`

**响应字段（单条）：**

| 字段                | 类型 | 必填 | 说明                               |
| ----------------- | --- | --- | -------------------------------- |
| `orderId`         | bigint | 是 | 订单ID                             |
| `orderNo`         | string | 是 | 订单号                              |
| `userPhone`       | string | 是 | 脱敏手机号（138****8888），由 Service 层处理 |
| `userRealMobile`  | string | 否 | 用户真实手机号                         |
| `userAvatar`      | string | 否 | 客户头像 URL                          |
| `userNickname`    | string | 否 | 客户名称，按 `张三 → 张*`、手机号名 `138****5678` 脱敏 |
| `venueName`       | string | 否 | 球厅名称                             |
| `venueAddress`    | string | 否 | 球厅地址                             |
| `venueLongitude`  | decimal | 否 | 球厅经度                             |
| `venueLatitude`   | decimal | 否 | 球厅纬度                             |
| `serviceType`     | tinyint | 是 | 服务类型：1=台球陪练 2=达人带路                 |
| `bookingTime`     | long | 是 | 预约服务开始时间（毫秒时间戳）                         |
| `serviceDuration` | int | 是 | 预定时长（分钟）                         |
| `totalAmount`     | int | 是 | 订单金额（分）                          |
| `expireAt`        | long | 是 | 接单截止时间（毫秒时间戳，pay_time + 5分钟），助教端倒计时    |
| `createTime`      | long | 是 | 下单时间（毫秒时间戳）                             |

> **脱敏规则**：`user_phone` 原始号码在数据库中存储明文，接口返回时 Service 层进行掩码处理：`138****8888`（保留前 3 位和后 4 位，中间 4 位替换为 `**`）。实际拨打时通过虚拟中间号转接原号，转接逻辑由 notification 模块负责。

---

### 2.2 POST /coach-api/billiard/order/accept — 接单

**请求体：**`{ "orderId": 123 }`

**业务校验：**

1. 订单存在且 `coach_id` = 当前助教
2. 订单状态 = PENDING_ACCEPT（幂等：若已接单，直接返回成功）
3. 接单超时检查：当前时间 <= pay_time + 5分钟（超时则拒绝接单）
4. 助教当前无 IN_SERVICE 订单（防止并发接单）

**接单操作：**

1. 更新 `status` = ACCEPTED，`accept_time` = 当前时间
2. 推送通知给用户：`"助教 ${stageName} 已接受您的订单，正在前往球厅"`

---

### 2.3 POST /coach-api/billiard/order/confirm-departure — 确认出发

**请求体（CoachOrderOperateReqVO）：**`{ "orderId": 123 }`

**业务校验：**

1. 订单存在且 `coach_id` = 当前助教
2. 订单状态 = ACCEPTED
3. `departure_confirm_time` 为空（幂等：已确认出发则直接成功）

**操作：**

1. 写入 `departure_confirm_time = 当前服务端时间`
2. 订单主状态保持 ACCEPTED（30）不变
3. 推送通知给用户：`"助教已确认出发，正在前往服务地址"`

---

### 2.4 POST /coach-api/billiard/order/arrive — 到达服务地址

**请求体（CoachOrderOperateReqVO）：**`{ "orderId": 123 }`

**业务校验：**

1. 订单存在且 `coach_id` = 当前助教
2. 订单状态 = ACCEPTED
3. `departure_confirm_time` 非空（未出发不可先到达）
4. `arrive_time` 为空（幂等：已到达则直接成功）

**操作：**

1. 写入 `arrive_time = 当前服务端时间`
2. 订单主状态保持 ACCEPTED（30）不变
3. 推送通知给用户：`"助教已到达服务地址，请确认开始服务"`

---

### 2.5 POST /coach-api/billiard/order/reject — 拒单

**请求体：**`{ "orderId": 123, "rejectReason": "..." }`（原因可选）

**业务校验：**

1. 订单存在且 `coach_id` = 当前助教
2. 订单状态 = PENDING_ACCEPT

**拒单操作：**

1. 更新 `status` = CANCELLED，`cancel_time` = 当前时间，`cancel_type` = 2，`cancel_reason` = "助教拒绝接单"
2. 调用 `PayRefundApi.createRefund(...)`，`merchantRefundId` = `REJECT_{orderId}`，全额退款
3. 推送通知给用户：`"助教暂时无法接单，已为您全额退款"`

---

### 2.6 POST /coach-api/billiard/order/start — 开始服务（开始计时）

**请求体（CoachOrderOperateReqVO）：**`{ "orderId": 123 }`

**业务校验：**

1. 订单存在且 `coach_id` = 当前助教
2. 订单状态 = ACCEPTED

**操作：**

1. 更新 `status` = IN_SERVICE，`start_time` = 当前服务端时间
2. 通知计时模块（billiard_timer）创建计时记录
3. 推送通知给用户：`"助教已开始服务，服务计时中"`

---

### 2.7 POST /coach-api/billiard/order/finish — 结束服务

**请求体（CoachOrderOperateReqVO）：**`{ "orderId": 123 }`

**业务校验：**

1. 订单存在且 `coach_id` = 当前助教
2. 订单状态 = IN_SERVICE

**操作：**

1. 记录 `end_time` = 当前服务端时间，`actual_duration` = end_time - start_time（分钟，向上取整）
2. 更新 `status` = PENDING_REVIEW
3. 通知计时模块结束计时
4. 通知 review 模块创建评价记录
5. 通知 finance 模块触发佣金结算
6. 推送通知给用户：`"服务已结束，请为本次服务评价"`

---

### 2.8 GET /coach-api/billiard/order/in-progress — 进行中订单详情

**功能**：返回助教当前进行中的订单完整信息（含脱敏手机号、球厅导航、剩余时长）。

> **地图导航说明**：前端无需集成端内导航 SDK，直接使用响应中的 `venueLongitude` 和 `venueLatitude`，通过 URI Scheme 唤起外部高德地图 App 进行导航。

**响应字段：**

| 字段                 | 类型 | 必填 | 说明                                                         |
| ------------------ | --- | --- | ---------------------------------------------------------- |
| `orderId`          | bigint | 是 | 订单ID                                                       |
| `userPhone`        | string | 是 | 脱敏手机号（138****8888）                                         |
| `userRealMobile`   | string | 否 | 用户真实手机号                                                   |
| `userAvatar`       | string | 否 | 客户头像 URL                                                    |
| `userNickname`     | string | 否 | 客户名称，按 `张三 → 张*`、手机号名 `138****5678` 脱敏                   |
| `venueName`        | string | 否 | 球厅名称                                                       |
| `venueAddress`     | string | 否 | 球厅地址                                                       |
| `venueLongitude`   | decimal | 否 | 球厅经度（用于地图导航）                                               |
| `venueLatitude`    | decimal | 否 | 球厅纬度（用于地图导航）                                               |
| `totalAmount`      | int | 是 | 订单当前总金额（含加钟，分）                                             |
| `serviceDuration`  | int | 是 | 当前预定总时长（含加钟，分钟）                                            |
| `startTime`        | long | 是 | 服务开始时间（毫秒时间戳，服务端时间，用于前端自行计算已服务时长）                                |
| `remainingMinutes` | int | 是 | 剩余服务时长 = serviceDuration - (当前时间 - startTime)（分钟），由服务端计算返回 |

**过滤：** `coach_id = 当前助教 AND status = 40 AND deleted = 0`，最多返回 1 条（PRD 规定一次只服务一位）

---

### 2.9 GET /coach-api/billiard/order/page — 助教统一订单列表（合并历史与全部）

**功能**：返回助教的所有订单，前端不再区分历史订单和全部订单页面，统一调用此接口。

**请求参数：**`pageNo`、`pageSize`、`status`（可选，不传返回全部）

**固定过滤：** `coach_id = 当前助教 AND deleted = 0`，按 `create_time DESC` 排序

**响应字段（单条）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `orderId` | bigint | 是 | 订单ID |
| `orderNo` | string | 是 | 订单号 |
| `serviceType` | tinyint | 是 | 服务类型：1=台球陪练 2=达人带路 |
| `bookingTime` | long | 是 | 预约服务开始时间（毫秒时间戳） |
| `serviceDuration` | int | 是 | 预定总时长（分钟） |
| `actualDuration` | int | 否 | 实际服务时长（分钟），服务结束后有值 |
| `totalAmount` | int | 是 | 订单总金额（分） |
| `status` | tinyint | 是 | 订单状态 |
| `startTime` | long | 否 | 服务开始时间（毫秒时间戳） |
| `endTime` | long | 否 | 服务结束时间（毫秒时间戳） |
| `createTime` | long | 是 | 下单时间（毫秒时间戳） |
| `hasReview` | boolean | 是 | 当订单已完成且用户已评价时为 true，前端据此展示“查看评价”按钮 |

---

### 2.10 GET /coach-api/billiard/order/get?id={id} — 助教订单详情（含评价）

**功能**：助教查看本人订单详情，返回订单全量信息并聚合对应评价信息。

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | bigint | 是 | 订单ID（`billiard_order.id`） |

**业务校验：**

1. 订单必须存在
2. `order.coach_id` 必须等于当前登录助教对应 `billiard_coach.id`（防越权）

**响应字段（订单主体）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | bigint | 是 | 订单ID |
| `orderNo` | string | 是 | 订单号 |
| `userId` | bigint | 是 | 下单用户ID |
| `userPhone` | string | 是 | 脱敏手机号（138****8888） |
| `userRealMobile` | string | 否 | 用户真实手机号 |
| `userAvatar` | string | 否 | 客户头像 URL |
| `userNickname` | string | 否 | 客户名称，按 `张三 → 张*`、手机号名 `138****5678` 脱敏 |
| `coachId` | bigint | 是 | 助教ID |
| `venueId` | bigint | 否 | 球厅ID |
| `venueName` | string | 否 | 球厅名称 |
| `venueAddress` | string | 否 | 球厅地址 |
| `venueLongitude` | decimal | 否 | 球厅经度 |
| `venueLatitude` | decimal | 否 | 球厅纬度 |
| `serviceType` | tinyint | 是 | 服务类型 |
| `bookingTime` | long | 是 | 预约服务时间（毫秒时间戳） |
| `serviceDuration` | int | 是 | 预定时长（分钟） |
| `actualDuration` | int | 否 | 实际时长（分钟） |
| `serviceAmount` | int | 否 | 服务金额（分） |
| `travelAmount` | int | 否 | 车费金额（分） |
| `travelDiscountAmount` | int | 否 | 车费优惠（分） |
| `forcedTravelDeductAmount` | int | 否 | 取消强扣车费（分） |
| `payAmount` | int | 否 | 实付金额（分） |
| `extraPayAmount` | int | 否 | 加钟累计金额（分） |
| `totalAmount` | int | 是 | 订单总金额（分） |
| `status` | tinyint | 是 | 订单状态 |
| `payOrderId` | string | 否 | 支付单商户号 |
| `remark` | string | 否 | 用户备注 |
| `createTime` | long | 是 | 下单时间（毫秒时间戳） |
| `payTime` | long | 否 | 支付时间（毫秒时间戳） |
| `acceptTime` | long | 否 | 接单时间（毫秒时间戳） |
| `departureConfirmTime` | long | 否 | 确认出发时间（毫秒时间戳） |
| `arriveTime` | long | 否 | 到达时间（毫秒时间戳） |
| `startTime` | long | 否 | 开始服务时间（毫秒时间戳） |
| `endTime` | long | 否 | 结束服务时间（毫秒时间戳） |
| `cancelTime` | long | 否 | 取消时间（毫秒时间戳） |
| `cancelReason` | string | 否 | 取消原因 |

**响应字段（评价信息 `review`）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `reviewId` | bigint | 否 | 评价ID |
| `star` | int | 否 | 评价星级（1~5） |
| `content` | string | 否 | 评价内容 |
| `tags` | array | 是 | 标签列表 |
| `images` | array | 是 | 评价图片 URL 列表 |
| `isAnonymous` | boolean | 否 | 是否匿名评价 |
| `createTime` | long | 否 | 评价时间（毫秒时间戳） |

**无评价返回约定：**
- `review` 对象始终返回
- `review.tags = []`、`review.images = []`
- 其余评价字段为 `null`

---

### 2.11 GET /coach-api/billiard/coach/review/page — 助教查看自己所有历史评价

**功能**：助教分页查看自己收到的全部历史评价，返回结构参考用户端助教主页评价列表。

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pageNo` | int | 否 | 页码，默认 1 |
| `pageSize` | int | 否 | 每页数量，默认 10，最大 20 |

**业务过滤：** 当前登录系统用户映射到 `billiard_coach.id` 后，按 `coach_id = 当前助教ID AND deleted = 0` 查询，按评价时间倒序。

**响应字段（分页 `list` 单条）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `reviewId` | bigint | 是 | 评价ID |
| `star` | int | 是 | 评价星级（1~5） |
| `content` | string | 否 | 评价内容 |
| `tags` | array | 是 | 标签列表 |
| `images` | array | 是 | 评价图片 URL 列表 |
| `userNickname` | string | 否 | 用户昵称；匿名评价为 `匿名用户`，非匿名评价按脱敏规则返回 |
| `userAvatar` | string | 否 | 用户头像 URL；匿名评价为 `null` |
| `isAnonymous` | boolean | 是 | 是否匿名评价 |
| `createTime` | long | 是 | 评价时间（毫秒时间戳） |

---

## 3. 计时模块

Controller 类：`CoachTimerController`
建议包路径：`cn.iocoder.yudao.module.billiard.controller.coach.timer.CoachTimerController`
注解路由：`@RequestMapping("/coach-api/billiard/timer")`

### 3.1 POST /coach-api/billiard/timer/start — 开始计时

**功能**：助教确认上钟，启动服务端计时。

**请求体（CoachTimerStartReqVO）：**

| 字段        | 类型     | 必填  | 说明                |
| --------- | ------ | --- | ----------------- |
| `orderId` | bigint | 是   | billiard_order.id |

**业务校验（Service 层按序执行）：**

1. 订单存在且 `coach_id` 对应当前登录助教
2. 订单状态必须为 ACCEPTED(30)，且 `departure_confirm_time`、`arrive_time` 均不为空（先确认出发、再确认到达）
3. 幂等校验：若 Redis 中已存在该 orderId 的 RUNNING 计时，直接返回成功
4. `billiard_timer_record` 中不存在该 `order_id` 的记录（防止重复开始）

**开始计时流程（事务 + Redis 写入）：**

```
1. 获取服务端当前时间 startTime = System.currentTimeMillis()
2. 从 billiard_order 读取 service_duration 作为 plannedDuration
3. 写入 billiard_timer_record：
   - order_id, start_time, planned_duration, added_duration=0
4. 写入 Redis Hash（billiard:timer:{orderId}）：
   - startTime = startTime（毫秒字符串）
   - plannedDuration = service_duration
   - addedDuration = 0
   - status = RUNNING
   （不设 TTL，结束时才设置）
5. 通知订单模块：BilliardOrderService.onTimerStarted(orderId)
   → 订单模块更新 billiard_order.status=IN_SERVICE(40), start_time=当前服务端时间
6. 推送通知给用户："助教已开始计时，服务进行中"
```

**响应体（CoachTimerStartRespVO）：**

| 字段                | 类型 | 必填 | 说明                                                     |
| ----------------- | --- | --- | ------------------------------------------------------ |
| `startTime`       | string | 是 | 服务端开始时间（ISO-8601 格式，如 `2026-03-22T14:30:00.123+08:00`） |
| `plannedDuration` | int | 是 | 预定时长（分钟）                                               |

---

### 3.2 POST /coach-api/billiard/timer/end — 结束计时

**功能**：助教主动结束服务，停止计时并写入结束时间。

**请求体（CoachTimerEndReqVO）：**

| 字段        | 类型     | 必填  | 说明                |
| --------- | ------ | --- | ----------------- |
| `orderId` | bigint | 是   | billiard_order.id |

**业务校验：**

1. 订单存在且 `coach_id` 对应当前登录助教
2. 订单状态必须为 IN_SERVICE(40)（若已是 PENDING_REVIEW 及以后状态则幂等返回成功）
3. Redis 中该 orderId 的 status = RUNNING（若不存在则以 MySQL 数据为准继续执行）

**结束计时流程：**

```
1. 获取服务端当前时间 endTime = System.currentTimeMillis()
2. 从 Redis 读取 startTime（或从 billiard_timer_record 读取）
3. 计算 actualDuration = CEIL((endTime - startTime) / 60000.0)（分钟，向上取整）
4. 更新 billiard_timer_record：
   - end_time = endTime, actual_duration = actualDuration, is_timeout = 0
5. 更新 Redis Hash：
   - status = ENDED
   - 设置 TTL = 3600 秒（1 小时后自动过期）
6. 通知订单模块：BilliardOrderService.onTimerEnded(orderId, actualDuration, isTimeout=false)
   → 订单模块更新 billiard_order.status=PENDING_REVIEW(50), end_time, actual_duration
   → 通知 review 模块创建评价记录
   → 通知 finance 模块触发佣金结算
7. 推送通知给用户："服务已结束，请为本次服务评价"
```

**响应体：**

| 字段               | 类型 | 必填 | 说明         |
| ---------------- | --- | --- | ---------- |
| `actualDuration` | int | 是 | 实际服务时长（分钟） |
| `endTime`        | string | 是 | 服务端结束时间（ISO-8601 格式）    |

---

### 3.3 GET /coach-api/billiard/timer/get-status?orderId={orderId} — 查询当前计时状态

**功能**：查询指定订单的实时计时状态。

**请求参数：**`orderId` = billiard_order.id

**查询逻辑（BilliardTimerService.getTimerStatus）：**

```
1. 从 Redis 读取 billiard:timer:{orderId}
2. 若 Redis 存在：
   - elapsedSeconds = (System.currentTimeMillis() - startTime) / 1000
   - 若 status = ENDED：elapsedSeconds = actual_duration * 60（从 billiard_timer_record 读取）
3. 若 Redis 不存在（降级）：
   - 从 billiard_timer_record 读取 start_time, end_time, planned_duration, added_duration
   - 若 end_time 为空：elapsedSeconds = (当前时间 - start_time).toSeconds()
   - 若 end_time 不为空：elapsedSeconds = actual_duration * 60
4. 返回响应
```

**响应体（TimerStatusRespVO）：**

| 字段                 | 类型       | 必填 | 说明                                                                         |
| ------------------ | -------- | --- | -------------------------------------------------------------------------- |
| `orderId`          | bigint   | 是 | 订单ID                                                                       |
| `startTime`        | string | 是 | 服务开始时间（ISO-8601 格式）                                                              |
| `elapsedSeconds`   | long     | 是 | 已服务秒数（服务端实时计算：`now - startTime`，ENDED 状态返回 `actual_duration * 60`）         |
| `plannedDuration`  | int      | 是 | 预定总时长（分钟，含加钟）                                                              |
| `addedDuration`    | int      | 是 | 加钟累计时长（分钟）                                                                 |
| `remainingSeconds` | long     | 是 | 剩余秒数 = `(plannedDuration + addedDuration) * 60 - elapsedSeconds`；可为负数（超时时） |
| `status`           | string   | 是 | RUNNING / ENDED                                                            |

---

## 4. 钱包模块

Controller 类：`CoachWalletController`
包路径：`cn.iocoder.yudao.module.billiard.controller.coach.wallet.CoachWalletController`
路由前缀：`/coach-api/billiard/wallet`
鉴权：助教端登录态（system 用户 Token）

### 4.0 通用响应结构

所有接口统一返回 `CommonResult<T>`：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `code` | int | 是 | 响应码，成功为 `0` |
| `msg` | string | 是 | 响应消息，成功通常为空字符串 |
| `data` | object/array/boolean/long/null | 是 | 业务数据 |

分页接口的 `data` 结构为 `PageResult<T>`：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `total` | long | 是 | 总记录数 |
| `list` | array | 是 | 当前页数据列表 |

---

### 4.1 GET /coach-api/billiard/wallet/balance — 查询助教钱包余额

**功能**：查询当前登录助教的钱包 ID、可用余额和冻结金额。

**请求参数：** 无

**响应体（`CoachWalletBalanceRespVO`）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `walletId` | bigint | 是 | 钱包编号（`pay_wallet.id`） |
| `balance` | int | 是 | 可用余额（分） |
| `freezePrice` | int | 是 | 冻结金额（分） |

**HTTP 请求示例：**

```http
GET /coach-api/billiard/wallet/balance
Authorization: Bearer {coach_token}
tenant-id: 122
```

**JSON 响应示例：**

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "walletId": 80001,
    "balance": 125000,
    "freezePrice": 30000
  }
}
```

---

### 4.2 GET /coach-api/billiard/wallet/transaction/page — 查询助教钱包流水分页

**功能**：分页查询当前登录助教的钱包流水，包含订单收益、平台扣款、客服补偿、提现打款等记录。

**请求参数（`CoachWalletTransactionPageReqVO` + `PageParam`）：**

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pageNo` | int | 是 | 页码，从 1 开始，最小 1，默认 1 |
| `pageSize` | int | 是 | 每页条数，最小 1，最大 200，默认 10 |
| `type` | int | 否 | 流水收支类型，枚举见下方 `type` |
| `createTime` | array<long> | 否 | 创建时间区间，数组长度 2，毫秒时间戳格式（开始时间、结束时间） |

**`type` 枚举值（完整）：**

| 枚举值 | 说明 |
| --- | --- |
| `1` | 收入 |
| `2` | 支出 |

**响应体（分页 `list` 单条 `CoachWalletTransactionRespVO`）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | bigint | 是 | 钱包流水编号（`pay_wallet_transaction.id`） |
| `no` | string | 是 | 钱包流水号 |
| `bizType` | int | 是 | pay 模块原始业务分类，枚举见下方 `PayWalletBizTypeEnum` |
| `bizTypeCode` | string | 是 | 助教端业务类型编码，枚举见下方 `bizTypeCode` |
| `bizTypeDesc` | string | 是 | 助教端业务类型名称 |
| `title` | string | 是 | 流水标题 |
| `price` | int | 是 | 交易金额（分） |
| `balance` | int | 是 | 交易后余额（分） |
| `createTime` | string(datetime) | 是 | 流水创建时间 |

**`bizType` 枚举值（`PayWalletBizTypeEnum.type`，完整）：**

| 枚举值 | 说明 |
| --- | --- |
| `1` | 充值 |
| `2` | 充值退款 |
| `3` | 支付 |
| `4` | 支付退款 |
| `5` | 更新余额 |
| `6` | 转账 |

**`bizTypeCode` 枚举值（完整）：**

| 枚举值 | 说明 | 对应 `bizTypeDesc` |
| --- | --- | --- |
| `ORDER_INCOME` | 订单收益入账 | 订单收益 |
| `DEDUCTION` | 平台扣款 | 平台扣款 |
| `COMPENSATION` | 客服补偿 | 客服补偿 |
| `WITHDRAWAL` | 提现打款 | 提现打款 |
| `MANUAL_RECHARGE` | 后台充值 | 后台充值 |
| `PAYMENT` | 普通支付支出 | 支付 |
| `PAYMENT_REFUND` | 支付退款 | 支付退款 |
| `RECHARGE` | 充值 | 充值 |
| `RECHARGE_REFUND` | 充值退款 | 充值退款 |
| `TRANSFER` | 转账 | 转账 |
| `UPDATE_BALANCE` | 更新余额 | 未特殊识别时显示为更新余额 |
| `UNKNOWN` | 未知业务类型 | 未知 |

**HTTP 请求示例：**

```http
GET /coach-api/billiard/wallet/transaction/page?pageNo=1&pageSize=10&type=1&createTime=1774972800000&createTime=1777564799000
Authorization: Bearer {coach_token}
tenant-id: 122
```

**JSON 响应示例：**

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "total": 2,
    "list": [
      {
        "id": 60001,
        "no": "W20260425000001",
        "bizType": 5,
        "bizTypeCode": "ORDER_INCOME",
        "bizTypeDesc": "订单收益",
        "title": "更新余额",
        "price": 19900,
        "balance": 125000,
        "createTime": "2026-04-25 16:30:01"
      },
      {
        "id": 60002,
        "no": "W20260425000002",
        "bizType": 5,
        "bizTypeCode": "COMPENSATION",
        "bizTypeDesc": "客服补偿",
        "title": "更新余额",
        "price": 5000,
        "balance": 130000,
        "createTime": "2026-04-25 17:10:22"
      }
    ]
  }
}
```

---

### 4.3 POST /coach-api/billiard/wallet/withdrawal/create — 发起提现申请

**功能**：当前登录助教提交提现申请，后端会先冻结对应金额，再写入 `billiard_withdrawal`。

**请求体（`CoachWithdrawalCreateReqVO`）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `withdrawAmount` | int | 是 | 提现金额（分），必须大于 0 |
| `accountType` | int | 是 | 收款账号类型，枚举见下方 `accountType` |
| `accountNo` | string | 是 | 收款账号 |
| `realName` | string | 是 | 收款实名 |

**`accountType` 枚举值（完整）：**

| 枚举值 | 说明 |
| --- | --- |
| `1` | 微信 |
| `2` | 支付宝 |

**业务校验：**
- 助教必须存在。
- `withdrawAmount > 0`。
- 同一助教存在 `PENDING(0)` 或 `PROCESSING(1)` 提现申请时，不允许重复提交。
- 使用 Redis 锁 `billiard:wallet:withdraw:submit:lock:{coachUserId}` 防止短时间重复提交。

**响应体：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `data` | bigint | 是 | 新创建的提现申请编号（`billiard_withdrawal.id`） |

**HTTP 请求示例：**

```http
POST /coach-api/billiard/wallet/withdrawal/create
Authorization: Bearer {coach_token}
tenant-id: 122
Content-Type: application/json

{
  "withdrawAmount": 30000,
  "accountType": 2,
  "accountNo": "coach@example.com",
  "realName": "张三"
}
```

**JSON 响应示例：**

```json
{
  "code": 0,
  "msg": "",
  "data": 70001
}
```

---

### 4.4 GET /coach-api/billiard/wallet/withdrawal/page — 查询提现申请分页

**功能**：分页查询当前登录助教的提现申请记录。

**请求参数（`CoachWithdrawalPageReqVO` + `PageParam`）：**

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pageNo` | int | 是 | 页码，从 1 开始，最小 1，默认 1 |
| `pageSize` | int | 是 | 每页条数，最小 1，最大 200，默认 10 |
| `status` | int | 否 | 提现状态，枚举见下方 `BilliardWithdrawalStatusEnum` |

**`status` 枚举值（`BilliardWithdrawalStatusEnum.status`，完整）：**

| 枚举值 | 说明 |
| --- | --- |
| `0` | 待处理（PENDING） |
| `1` | 处理中（PROCESSING） |
| `2` | 已成功（SUCCESS） |
| `3` | 已驳回（REJECTED） |

**响应体（分页 `list` 单条 `CoachWithdrawalRespVO`）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | bigint | 是 | 提现申请编号 |
| `withdrawAmount` | int | 是 | 提现金额（分） |
| `accountType` | int | 是 | 收款账号类型：`1=微信`，`2=支付宝` |
| `accountNo` | string | 是 | 收款账号 |
| `realName` | string | 是 | 收款实名 |
| `status` | int | 是 | 提现状态，枚举见上方 `BilliardWithdrawalStatusEnum` |
| `rejectReason` | string | 否 | 驳回原因 |
| `applyTime` | string(datetime) | 是 | 申请时间 |
| `handleTime` | string(datetime) | 否 | 处理时间 |
| `payTime` | string(datetime) | 否 | 打款时间 |

**HTTP 请求示例：**

```http
GET /coach-api/billiard/wallet/withdrawal/page?pageNo=1&pageSize=10&status=0
Authorization: Bearer {coach_token}
tenant-id: 122
```

**JSON 响应示例：**

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "total": 1,
    "list": [
      {
        "id": 70001,
        "withdrawAmount": 30000,
        "accountType": 2,
        "accountNo": "coach@example.com",
        "realName": "张三",
        "status": 0,
        "rejectReason": null,
        "applyTime": "2026-04-25 18:05:00",
        "handleTime": null,
        "payTime": null
      }
    ]
  }
}
```

---

### 4.5 GET /coach-api/billiard/wallet/deduction/page — 查询扣款明细分页

**功能**：分页查询当前登录助教的扣款记录及申诉处理结果。

**请求参数（`CoachDeductionPageReqVO` + `PageParam`）：**

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pageNo` | int | 是 | 页码，从 1 开始，最小 1，默认 1 |
| `pageSize` | int | 是 | 每页条数，最小 1，最大 200，默认 10 |
| `status` | int | 否 | 扣款申诉状态，枚举见下方 `BilliardDeductionStatusEnum` |

**`status` 枚举值（`BilliardDeductionStatusEnum.status`，完整）：**

| 枚举值 | 说明 |
| --- | --- |
| `0` | 待申诉（PENDING_APPEAL） |
| `1` | 申诉中（APPEALING） |
| `2` | 维持扣款（HOLD） |
| `3` | 已退回（REFUNDED） |

**响应体（分页 `list` 单条 `CoachDeductionRespVO`）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | bigint | 是 | 扣款记录编号 |
| `orderId` | bigint | 否 | 关联订单编号 |
| `deductAmount` | int | 是 | 扣款金额（分） |
| `deductReason` | string | 是 | 扣款原因 |
| `status` | int | 是 | 扣款申诉状态，枚举见上方 `BilliardDeductionStatusEnum` |
| `appealContent` | string | 否 | 申诉内容 |
| `appealTime` | string(datetime) | 否 | 申诉时间 |
| `resolveNote` | string | 否 | 平台处理说明 |
| `resolveTime` | string(datetime) | 否 | 平台处理时间 |

**HTTP 请求示例：**

```http
GET /coach-api/billiard/wallet/deduction/page?pageNo=1&pageSize=10&status=0
Authorization: Bearer {coach_token}
tenant-id: 122
```

**JSON 响应示例：**

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "total": 1,
    "list": [
      {
        "id": 81001,
        "orderId": 9527,
        "deductAmount": 5000,
        "deductReason": "服务迟到扣款",
        "status": 0,
        "appealContent": null,
        "appealTime": null,
        "resolveNote": null,
        "resolveTime": null
      }
    ]
  }
}
```

---

### 4.6 POST /coach-api/billiard/wallet/deduction/appeal — 发起扣款申诉

**功能**：当前登录助教对指定扣款记录提交申诉内容。

**请求体（`CoachDeductionAppealReqVO`）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `deductionId` | bigint | 是 | 扣款记录编号（`billiard_deduction_record.id`） |
| `appealContent` | string | 是 | 申诉内容 |

**业务说明：**
- 助教只能申诉自己的扣款记录。
- 申诉提交后，扣款状态进入 `APPEALING(1)`。

**响应体：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `data` | boolean | 是 | 是否提交成功，成功返回 `true` |

**HTTP 请求示例：**

```http
POST /coach-api/billiard/wallet/deduction/appeal
Authorization: Bearer {coach_token}
tenant-id: 122
Content-Type: application/json

{
  "deductionId": 81001,
  "appealContent": "本次迟到由球厅临时换桌导致，已与用户沟通确认。"
}
```

**JSON 响应示例：**

```json
{
  "code": 0,
  "msg": "",
  "data": true
}
```

---

## 5. 财务模块

Controller 类：`CoachFinanceController`（或合并至 `CoachSelfController`）
建议包路径：`cn.iocoder.yudao.module.billiard.controller.coach.finance.CoachFinanceController`
注解路由：`@RequestMapping("/coach-api/billiard/finance")`

### 5.1 GET /coach-api/billiard/finance/dashboard — 助教数据看板

**功能**：返回当日汇总数据，用于助教端工作台首屏展示。

**响应体（CoachFinanceDashboardRespVO）：**

| 字段                    | 类型  | 说明                                                                             |
| --------------------- | --- | ------------------------------------------------------------------------------ |
| `todayServiceCount`   | int | 今日服务次数，查 billiard_order 当日 status=COMPLETED(60) 的数量                            |
| `todayServiceMinutes` | int | 今日服务总时长（分钟）                                                                    |
| `todayDuration`       | int | 今日上钟总时长（分钟，对齐设计文档），查 billiard_timer_record 当日 actual_duration 之和                      |
| `todayIncome`         | int | 今日收入（分）                                                                        |
| `todayExpectedIncome` | int | 预计今日收入（分，对齐设计文档），查 billiard_finance_settlement 当日 final_income 之和（settle_time 在今日范围内） |
| `totalFreezeIncome`   | int | 累计冻结收入（分）                                                                      |
| `totalUnfreezeIncome` | int | 累计解冻收入（分）                                                                      |

**计算逻辑说明：**

| 指标                    | 数据源                                     | 过滤条件                                                                               |
| --------------------- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| `todayDuration`       | `billiard_timer_record.actual_duration` | `coach_id = 当前助教 AND end_time BETWEEN 今日00:00 AND NOW()`                           |
| `todayServiceCount`   | `billiard_order`                        | `coach_id = 当前助教 AND status = 60 AND end_time BETWEEN 今日00:00 AND NOW()`           |
| `todayExpectedIncome` | `billiard_finance_settlement`           | `coach_id = 当前助教 AND settle_time BETWEEN 今日00:00 AND NOW() AND settle_status >= 1` |

**性能建议：**
- 接口建议加 Redis 缓存，key = `coach:dashboard:{coachId}`，TTL = 60 秒
- 助教切换上下线、订单状态变更时主动清除缓存

---

### 5.2 GET /coach-api/billiard/finance/settlement/page — 助教收益明细分页

**功能**：助教查询自身历史结算记录（收益流水）。

**请求参数：**

| 参数          | 类型       | 说明             |
| ----------- | -------- | -------------- |
| `pageNo`    | int      | 页码，默认 1        |
| `pageSize`  | int      | 每页数量，默认 10     |
| `settleTime[0]` | long | settle_time 起始（毫秒时间戳） |
| `settleTime[1]` | long | settle_time 截止（毫秒时间戳） |

**固定过滤：** `coach_id = 当前助教 AND deleted = 0 AND settle_status >= 1`，按 `settle_time DESC` 排序

**响应字段（单条）：**

| 字段                | 类型 | 必填 | 说明        |
| ----------------- | --- | --- | --------- |
| `orderId`         | bigint | 是 | 关联订单ID    |
| `orderNo`         | string | 是 | 订单号       |
| `totalAmount`     | int | 是 | 结算基础金额（分） |
| `commissionRate`  | decimal | 是 | 佣金比例快照    |
| `coachIncome`     | int | 是 | 订单实得（分）   |
| `tipAmount`       | int | 是 | 打赏（分）     |
| `deductionAmount` | int | 是 | 扣款（分）     |
| `finalIncome`     | int | 是 | 最终到手（分）   |
| `settleTime`      | long | 是 | 结算时间（毫秒时间戳）      |

---

## 7. 异常订单模块

Controller 类：`CoachExceptionOrderController`
包路径：`cn.iocoder.yudao.module.billiard.controller.coach.exception.CoachExceptionOrderController`
路由前缀：`/coach-api/billiard/exception`
鉴权：助教端 Token（`system_users` 体系）

### 7.1 POST /coach-api/billiard/exception/report — 助教报告异常

**功能**：助教在到达服务地址后，如果联系不到客户，可向负责人反馈异常。

**请求体（CoachExceptionReportReqVO）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `orderId` | bigint | 是 | billiard_order.id，必须归属当前登录助教 |
| `exceptionType` | tinyint | 是 | 异常类型：1=联系不到客户 2=客户违规 3=其他 |
| `reason` | string | 是 | 异常说明，最长 500 字符 |
| `evidenceUrls` | string | 否 | 证据 URL 数组字符串，例如 `["https://img/1.png"]` |

**业务校验：**

1. 订单存在且归属当前登录助教（防越权）
2. 订单状态必须为 `ACCEPTED(30)` 且 `arrive_time` 不为空，或 `IN_SERVICE(40)`
3. 同一订单在 24 小时内不可重复提交同类型异常（防刷单）

**操作：**

1. 插入 `billiard_exception_order`（`status=PENDING`，`claimUserId=NULL`）
2. 更新 `billiard_order.is_abnormal = 1`
3. 推送站内通知给客服组：`"新异常订单待处理：订单 ${orderNo}，助教反馈：${reason}"`

**响应体：**`Long` (返回新创建的 exceptionOrderId)

Controller 类：`CoachAppealController`
包路径：`cn.iocoder.yudao.module.billiard.controller.coach.appeal.CoachAppealController`
路由前缀：`/coach-api/billiard/appeal`

### 6.1 POST /coach-api/billiard/appeal/submit — 助教发起申诉

**功能**：助教对异常订单发起申诉。

**请求体（CoachAppealSubmitReqVO）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `exceptionOrderId` | bigint | 是 | 异常订单编号（billiard_exception_order.id） |
| `appealReason` | string | 是 | 申诉理由 |

**业务校验：**

1. 异常订单存在且归属当前助教（防越权）
2. 申诉理由不能为空

**操作：**

1. 插入 `billiard_appeal`（`status = PENDING`）
2. 若异常订单当前状态为待处理，则自动推进为处理中
3. 推送通知给客服组：`"助教 ${stageName} 对异常订单 ${exceptionOrderId} 发起申诉"`

**响应体：**`Long` (返回新创建的 appealId)

---

### 6.2 GET /coach-api/billiard/appeal/page — 助教查看申诉进度

**请求参数：**

| 参数             | 类型      | 必填  | 说明            |
| -------------- | ------- | --- | ------------- |
| `pageNo`       | int     | 否   | 页码，默认 1       |
| `pageSize`     | int     | 否   | 每页数量，默认 10    |
| `status` | tinyint | 否   | 申诉状态筛选；不传返回全部 |

**固定过滤：** `coach_id = 当前助教 AND deleted = 0`，按 `create_time DESC` 排序

**响应字段（单条）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | bigint | 是 | 申诉记录ID |
| `exceptionOrderId` | bigint | 是 | 异常订单ID |
| `orderId` | bigint | 是 | 关联订单ID |
| `appealReason` | string | 是 | 申诉理由 |
| `status` | tinyint | 是 | 申诉状态：0=待处理 1=处理中 2=已处理 |
| `reviewNote` | string | 否 | 客服处理备注 |
| `reviewTime` | long | 否 | 客服处理时间（毫秒时间戳） |
| `createTime` | long | 是 | 申诉创建时间（毫秒时间戳） |
