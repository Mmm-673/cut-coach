# 助教端 - 重大通知与打赏汇总 API 文档

## 一、公共配置

### 测试环境

| 项目 | 值 |
|------|-----|
| HTTP BaseURL | `https://www.qiulem.com/test` |
| WebSocket | `wss://www.qiulem.com/test/infra/ws?token={accessToken}` |
| tenant-id | `122` |

### HTTP 请求头

```
Authorization: Bearer {accessToken}
tenant-id: 122
```

> 助教端使用助教 Token。WebSocket 地址与用户端相同，后端根据 Token 自动识别用户身份。

---

## 二、重大通知 WebSocket

### 1. 建立连接

```
wss://www.qiulem.com/test/infra/ws?token={助教AccessToken}
```

> 只有后台发布的"重大通知"会发送该消息，普通公告、活动通知、版本更新不会触发。

### 2. 消息格式

WebSocket 收到的第一层数据：

```json
{
  "type": "billiard_major_notification",
  "content": "{\"notificationId\":1001,\"notificationType\":1,\"title\":\"初球来电重大通知\",\"summary\":\"通知摘要\",\"coverUrl\":null,\"publishTime\":\"2026-08-28T10:30:00\",\"actionType\":1,\"actionValue\":null,\"actionParams\":null}"
}
```

> **注意：** `content` 是 JSON 字符串，需要再次解析。

**解析示例：**

```javascript
const message = JSON.parse(event.data)

if (message.type === 'billiard_major_notification') {
  const notification = JSON.parse(message.content)
  console.log(notification)
}
```

### content 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| notificationId | Long | 通知ID，同时用于消息去重 |
| notificationType | Integer | 通知类型，重大通知固定为 `1` |
| title | String | 通知标题 |
| summary | String | 通知摘要 |
| coverUrl | String / null | 封面图片 |
| publishTime | String | 发布时间 |
| actionType | Integer | 点击行为类型 |
| actionValue | String / null | 跳转目标 |
| actionParams | String / null | 跳转参数，可能也是 JSON 字符串 |

### actionType 取值说明

| 值 | 含义 |
|----|------|
| 0 | 不跳转 |
| 1 | 打开通知详情 |
| 2 | 打开 App 内指定页面 |
| 3 | 打开 HTTPS 网页 |
| 4 | App 版本更新 |

### 3. 收到消息后的处理建议

1. 根据 `notificationId` 去重。
2. 展示 App 内通知提醒。
3. 点击后调用助教通知详情接口。
4. WebSocket 消息本身不会自动标记已读。
5. 断线重连后不会补发历史 WebSocket 消息，需要刷新未读数量或通知列表。

---

## 三、通知相关 HTTP 接口

### 1. 通知详情

**接口地址：** `GET /coach-api/billiard/notification-center/get`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 通知ID |

**示例：**

```
GET /coach-api/billiard/notification-center/get?id=1001
```

---

### 2. 未读数量

**接口地址：** `GET /coach-api/billiard/notification-center/unread-count`

**请求参数：** 无

---

### 3. 标记已读

**接口地址：** `POST /coach-api/billiard/notification-center/read`

**Content-Type：** `application/json`

**请求体：**

```json
{
  "id": 1001
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 通知ID |

---

## 四、打赏汇总

> 建议放在助教端"打赏记录"页面顶部，与打赏记录分页接口同时请求。

### 1. 接口

**接口地址：** `GET /coach-api/billiard/reward/summary`

**请求参数：** 无

> 不需要也不能传 `coachId`。后端根据当前登录助教身份查询，避免越权。

### 2. 响应示例

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "totalAmount": 11000,
    "rewardCount": 2
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| totalAmount | Long | 累计收到的有效打赏金额，单位：**分** |
| rewardCount | Long | 累计收到的有效打赏笔数 |

### 金额展示

```javascript
const amountYuan = (data.totalAmount / 100).toFixed(2)
// 例如 11000 展示为 ¥110.00
```

### 统计规则

- 只统计当前登录助教。
- 只统计支付成功的打赏。
- 当前为全部时间累计统计。
- 待支付、失败或无效打赏不计入。
- 没有打赏时返回：

```json
{
  "totalAmount": 0,
  "rewardCount": 0
}
```

> ⚠️ **注意：** 打赏记录列表继续使用 `GET /coach-api/billiard/reward/page?pageNo=1&pageSize=20`。**不要**用当前分页列表自行累加总金额，应以 `/summary` 返回的数据为准。

---

## 五、注意事项

- WebSocket 连接应在登录成功后建立。
- Token 刷新后需要断开旧连接并使用新 Token 重连。
- 断线建议按 **1、2、5、10、30 秒**递增重试。
- 如极光通知和 WebSocket 同时到达，使用 `notificationId` 去重。
