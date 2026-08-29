# 助教 App 前端修改清单

> 来源文档：`2026-08-26-requirements-1-7-frontend-guide.md`
> 测试环境接口前缀：`https://www.qiulem.com/test/coach-api`
> 请求头：`tenant-id: 122`、`Authorization: Bearer <token>`

---

## 一、新增：通知中心（需求 2）

### 1.1 页面与入口
- 在 App 合适入口（首页 / 我的 / 消息中心）增加「通知」入口，展示未读数角标。
- 通知列表页（全部 / 未读 / 已读 三 Tab 筛选）。
- 通知详情页。

### 1.2 接口

前缀：`/coach-api/billiard/notification-center`

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/page?pageNo=1&pageSize=20&readStatus=0` | 分页；`readStatus` 不传=全部、0=未读、1=已读 |
| GET | `/get?id=1001` | 详情，**不会自动改为已读** |
| GET | `/unread-count` | 未读数（用于角标） |
| POST | `/read` | Body `{"id":1001}`，单条已读，幂等 |
| POST | `/read-all` | 全部已读，无请求体 |

### 1.3 通知响应项

```ts
interface NotificationItem {
  id: number
  type: number          // 1重大通知、2公告、3活动、4版本更新；5=系统自动打赏播报
  title: string
  summary: string
  content: string
  coverUrl?: string
  actionType: number
  actionValue?: string
  actionParams?: string // JSON 字符串，打赏播报的动画载荷位于此字段
  sourceType: number    // 1运营创建，2系统自动创建
  bizType?: string      // 打赏播报为 "REWARD"
  bizId?: string
  targetCity?: string
  topFlag: boolean
  publishTime: string
  readStatus: 0 | 1
  readTime?: string
}
```

### 1.4 客户端要求
- 首页或「我的」使用 `/unread-count` 展示角标。
- 列表支持全部、未读、已读筛选。
- 打开详情后**显式调用** `/read`，再刷新角标。
- Push 点击只携带通知 ID，再请求详情获取正文。
- 通知列表可用 `type===5 && sourceType===2 && bizType==='REWARD'` 识别打赏播报。

---

## 二、新增：同城打赏 App 内播报（需求 4）

### 2.1 WebSocket
- 助教登录后连接现有 `/infra/ws`。
- 消息类型：`billiard_reward_broadcast`。
- 外层消息的 `content` 是 JSON 字符串，需再次 `JSON.parse`。

业务载荷：

| 字段 | 说明 |
|---|---|
| `notificationId` | 通知 ID，用于去重和调用 `/read` |
| `rewardId` | 打赏记录 ID |
| `city` | 播报城市 |
| `amount` | 金额，分 |
| `memberNickname` | 打赏人展示昵称 |
| `coachName` | 被打赏助教展示名 |
| `title` / `content` | 列表/动画文案，均含「初球来电」品牌信息 |
| `voiceText` | 客户端使用设备 TTS 朗读的完整话术 |
| `animationType` | 固定 `reward` |
| `animationExpireTime` | 动画失效时间 |

### 2.2 助教 App 行为
1. 登录后建立 WebSocket，收到事件后按 `notificationId` 做**内存 + 本地短期去重**。
2. 未过 `animationExpireTime` 时**排队**展示动画，并朗读 `voiceText`；**多条消息不能同时播放**。
3. WebSocket 到达**不自动已读**。
4. 用户关闭动画或打开通知详情时调用：
   ```http
   POST /coach-api/billiard/notification-center/read
   {"id": 1001}
   ```
5. App 回到前台时刷新未读数和 `readStatus=0` 的列表；**30 分钟内**的未读打赏可补展示一次，超过 30 分钟不补动画。
6. 通知列表中打赏播报可用 `type=5 && sourceType=2 && bizType==='REWARD'` 识别，动画载荷位于 `actionParams`。

---

## 三、新增：打赏记录页面（需求 5 + 新增助教端接口）

### 3.1 页面与入口
- 在助教 App「我的」或钱包相关区域新增「打赏记录」入口。
- 列表分页展示，按时间倒序。
- 金额单位「分」，前端展示除以 100。

### 3.2 接口

```http
GET /coach-api/billiard/reward/page?pageNo=1&pageSize=20
```

**功能**：分页查询当前登录助教收到的**已支付**打赏。
- 助教身份**只从 Token 获取**，接口不接受 `coachId`，避免越权查询其他助教数据。
- 无需传额外筛选参数（只有分页）。

### 3.3 响应字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | number | 打赏记录 ID |
| `rewarderNickname` | string | 打赏人昵称；会员资料缺失时返回「球友」 |
| `rewarderAvatar` | string | 打赏人头像；缺失时返回空字符串 |
| `amount` | number | 金额，**分** |
| `payTime` | string | 支付时间 |
| `createTime` | string | 创建时间 |

> ⚠️ 隐私：接口**不返回**实名、手机号及支付明细信息。

### 3.4 列表展示建议
- 头像 + 昵称（左），金额（右，强调色）。
- 下方展示 `payTime`。
- 空数据页展示「暂无打赏记录」。
- 上拉加载更多 / 下拉刷新。

---

## 四、移除：开票入口（需求 7，反向）

### 4.1 背景
- 需求 7「消费发票」后端**未开发**，暂无任何 `billiard` 开票接口。

### 4.2 修改
- 移除/隐藏助教 App 中所有开票相关入口（如订单详情「开发票」、钱包/我的「发票」等）。
- 如产品必须保留占位，仅展示「功能建设中」静态提示，**不得发起任何 HTTP 请求**。

---

## 五、通用约定
- 金额字段单位均为「分」，展示时除以 100 保留两位小数。
- 日期时间使用 `yyyy-MM-dd HH:mm:ss` 或 ISO `yyyy-MM-ddTHH:mm:ss` 格式。
- HTTP 客户端已统一拼接 `/coach-api` 前缀时，业务代码只写 `/billiard/**`。
- WebSocket 重连、心跳沿用现有基础能力。
