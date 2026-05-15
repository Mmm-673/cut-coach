# 助教端 - 认证接口文档

## 环境信息

| 项目 | 值 |
|------|-----|
| 服务器地址 | `http://114.67.69.228` |
| 租户 Header | `tenant-id: 122` |

> 所有请求必须携带 `tenant-id: 122` Header

---

## 测试账号

| 字段 | 值 |
|------|----|
| 用户名 | `coach_test` |
| 密码 | `admin123` |
| 手机号 | `13800138001` |

---

## 接口列表

### 1. 账号密码登录

```
POST /coach-api/billiard/coach/auth/login
```

**Headers：**
```
Content-Type: application/json
tenant-id: 122
```

**Request Body：**
```json
{
  "username": "coach_test",
  "password": "admin123"
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | String | ✅ | 登录账号，4-30位 |
| password | String | ✅ | 登录密码，4-16位 |

**Response：**
```json
{
  "code": 0,
  "msg": "",
  "data": {
    "userId": 149,
    "accessToken": "c4f7acf73b014e39810c0ff4d229c37a",
    "refreshToken": "5715f92fc62d4cb0bbc2663670446f95",
    "expiresTime": 1774770037222
  }
}
```

> 限流：同一 IP 每分钟最多 10 次

---

### 2. 发送短信验证码

```
POST /coach-api/billiard/coach/auth/send-sms-code
```

**Headers：**
```
Content-Type: application/json
tenant-id: 122
```

**Request Body：**
```json
{
  "mobile": "13800138001"
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mobile | String | ✅ | 合法手机号 |

**Response：**
```json
{
  "code": 0,
  "msg": "",
  "data": true
}
```

> 限制：同一手机号 60 秒内只能发一次，每日最多 10 次

---

### 3. 手机验证码登录

```
POST /coach-api/billiard/coach/auth/sms-login
```

**Headers：**
```
Content-Type: application/json
tenant-id: 122
```

**Request Body：**
```json
{
  "mobile": "13800138001",
  "code": "123456"
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mobile | String | ✅ | 合法手机号 |
| code | String | ✅ | 短信验证码，4-6位纯数字 |

**Response：** 同账号密码登录

> 限流：同一 IP 每分钟最多 10 次

---

### 4. 刷新 Token

```
POST /coach-api/billiard/coach/auth/refresh-token?refreshToken={refreshToken}
```

**Headers：**
```
tenant-id: 122
```

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refreshToken | String | ✅ | 登录时返回的 refreshToken |

**Response：** 返回新的 accessToken 和 refreshToken，格式同登录接口

---

### 5. 退出登录

```
POST /coach-api/billiard/coach/auth/logout
```

**Headers：**
```
tenant-id: 122
Authorization: Bearer {accessToken}
```

**Response：**
```json
{
  "code": 0,
  "msg": "",
  "data": true
}
```

---

## Token 说明

| 项目 | 值 |
|------|-----|
| accessToken 有效期 | 30 分钟 |
| refreshToken 有效期 | 30 天 |
| 登录后请求 Header | `Authorization: Bearer {accessToken}` |

---

## 通用错误码

| code | 说明 |
|------|------|
| 0 | 成功 |
| 401 | 未登录 / Token 过期 |
| 429 | 请求过于频繁（触发限流） |
| 1002004000 | 用户不存在 |
| 1002004001 | 账号被禁用 |
