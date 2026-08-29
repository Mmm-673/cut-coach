# 助教 App 通知中心 & 打赏播报 设计文档

> 日期：2026-08-27
> 来源需求：`助教App-前端修改清单.md`（需求 2 / 需求 4 / 需求 5 / 需求 7）
> 测试环境接口前缀：`https://www.qiulem.com/test/coach-api`
> WebSocket 测试地址：`wss://www.qiulem.com/test/infra/ws`

---

## 一、概述

本次迭代新增 3 个功能模块 + 1 个反向需求：

| 模块 | 需求来源 | 说明 |
|------|----------|------|
| 通知中心 | 需求 2 | 通知列表、详情、未读角标、双入口 |
| 打赏播报 | 需求 4 | WebSocket 实时接收、动画展示、队列播放 |
| 打赏记录 | 需求 5 | 打赏记录列表页 |
| 移除开票 | 需求 7 | 当前项目无开票代码，无需处理 |

### 技术栈
- UniApp + Vue 3 + Pinia
- 原生 WebSocket API（UniApp `uni.connectSocket`）
- 事件总线 `uni.$emit / uni.$on`
- 本地存储 `uni.setStorageSync`

---

## 二、WebSocket 基础设施

### 2.1 连接管理

**文件**：`utils/websocket.js`

**设计为单例类 `WsManager`**，全局唯一实例。

#### 连接参数
```
wss://{host}/infra/ws?token={encodeURIComponent(accessToken)}
```
- 测试环境 host: `www.qiulem.com/test`
- 生产环境 host: `www.qiulem.com`
- token 为助教端 Access Token，**不带 Bearer 前缀**
- token 必须 `encodeURIComponent` 编码

#### 生命周期
- **连接时机**：登录成功后（`user store` 的 login/smsLogin 成功回调中调用 `wsManager.connect()`）
- **断开时机**：退出登录时调用 `wsManager.close()`
- **App 启动**：如已有 token 则自动连接（`App.vue onLaunch` 中判断）
- **网络变化**：监听 `uni.onNetworkStatusChange`，网络恢复时立即重连

#### 心跳机制
- 连接成功后启动心跳定时器
- 每 **30 秒**发送纯文本 `ping`
- 超时 **10 秒**未收到 `pong` 视为连接断开，触发重连
- 收到 `pong` 直接跳过，不进入业务消息解析

#### 重连机制
- 断开后按以下间隔重试：**1s → 2s → 5s → 10s → 30s**
- 最大重连间隔 **30 秒**，持续尝试不停止
- 手动调用 `close()` 时停止重连
- 重连成功后：
  1. 重置重连计数
  2. 发送事件 `ws:connected`
  3. 通知层监听此事件，刷新未读数和未读通知列表（补偿离线消息）

### 2.2 消息分发

#### 消息格式
```javascript
// 服务端发送文本帧
{
  "type": "billiard_reward_broadcast",
  "content": "{\"notificationId\":1001,...}"  // JSON 字符串，需二次 parse
}
```

#### 解析流程
1. 收到 `event.data === 'pong'` → 心跳响应，直接 return
2. `JSON.parse(event.data)` 得到外层 frame
3. 按 `frame.type` 分发
4. 业务消息需再次 `JSON.parse(frame.content)` 得到业务载荷

#### 事件分发
通过 UniApp 事件总线广播，业务方按需订阅：

| 事件名 | 载荷 | 触发时机 |
|--------|------|----------|
| `ws:connected` | 无 | 连接建立成功 |
| `ws:disconnected` | `{ code, reason }` | 连接断开 |
| `ws:error` | `error` | 连接错误 |
| `ws:billiard_reward_broadcast` | `payload` 对象 | 收到打赏播报 |

### 2.3 API 设计

```javascript
import wsManager from '@/utils/websocket'

wsManager.connect(token)     // 建立连接
wsManager.close()            // 关闭连接（停止重连）
wsManager.isConnected        // 当前是否连接（响应式？非响应式，用事件）
wsManager.send(data)         // 发送消息（对象自动 JSON.stringify）
```

---

## 三、通知中心

### 3.1 API 层

**文件**：`api/billiard/notification.js`

| 方法 | 接口 | 说明 |
|------|------|------|
| `getNotificationPage(params)` | `GET /billiard/notification-center/page` | 分页列表；`readStatus` 不传=全部、0=未读、1=已读 |
| `getNotificationDetail(id)` | `GET /billiard/notification-center/get?id=` | 详情，**不自动已读** |
| `getUnreadCount()` | `GET /billiard/notification-center/unread-count` | 未读数 |
| `readNotification(id)` | `POST /billiard/notification-center/read` | 单条已读，Body `{id}` |
| `readAllNotification()` | `POST /billiard/notification-center/read-all` | 全部已读 |

### 3.2 Store 层

**文件**：`store/modules/notification.js`

```javascript
state: {
  unreadCount: 0,      // 未读数
}
actions: {
  fetchUnreadCount()   // 拉取未读数并更新
  markRead(id)         // 单条已读 + 更新未读数
  markAllRead()        // 全部已读 + 更新未读数
  incrementUnread()    // WebSocket 收到新通知时 +1
}
```

**未读数更新时机：**
- App 启动 / 回到前台
- WebSocket 收到新通知（+1）
- 标记已读 / 全部已读后重新拉取
- WebSocket 重连成功后

### 3.3 通知列表页

**路径**：`subpkg/notification/index.vue`（新增分包）

**页面结构：**
- 顶部导航栏：标题「消息通知」
- 三 Tab 筛选：全部 / 未读 / 已读（`uni-segmented-control` 或自定义）
- 右上角操作：「全部已读」按钮（未读/全部 Tab 时显示，无未读时置灰）
- 列表区域：下拉刷新 + 上拉加载更多

**列表项布局：**
```
[置顶][类型标签]  标题              [未读红点]
                  摘要
                  发布时间
```
- 置顶：`topFlag=true` 时显示置顶标识，排序列表最前
- 类型标签：按 `type` 显示不同颜色文字（1重大通知/2公告/3活动/4版本更新/5打赏播报）
- 未读：`readStatus=0` 时右侧显示红点
- 打赏播报：`type===5 && sourceType===2 && bizType==='REWARD'`，类型标签显示「打赏」

**交互：**
- 点击列表项 → 跳转通知详情页
- 下拉刷新 → 重置分页，重新加载第一页
- 上拉加载 → pageNo+1，追加列表

### 3.4 通知详情页

**路径**：`subpkg/notification/detail.vue`

**页面结构：**
- 顶部导航栏：标题「通知详情」
- 正文区：
  - 标题（大字体）
  - 发布时间（灰色小字）
  - 正文内容（纯文本展示，行间距适中）
  - 如有 `coverUrl` 则在正文顶部展示封面图

**生命周期：**
- `onLoad` 接收参数 `id`
- 请求详情接口
- 详情加载成功后**立即调用 `/read` 标记已读**，然后触发全局未读数刷新

**注意：**
- `content` 字段暂按纯文本处理（`\n` 换行）
- 如后续确认是富文本，改为 `<rich-text :nodes="content">`

### 3.5 入口设计

#### 入口 1：工作台顶部铃铛
- **位置**：`pages/work/index.vue` 顶部导航栏右侧，绝对定位
- **样式**：铃铛图标（iconfont）+ 右上角数字角标
- **角标规则**：未读数 = 0 不显示；1~99 显示数字；> 99 显示「99+」
- **点击**：跳转通知列表页

#### 入口 2：「我的」页面菜单项
- **位置**：`pages/mine/index.vue` 功能菜单区，新增「消息通知」项
- **右侧**：显示未读数（0 不显示）
- **点击**：跳转通知列表页

---

## 四、打赏播报

### 4.1 组件设计

**文件**：`components/reward-broadcast/index.vue`

**挂载位置**：`App.vue` 模板最外层，全屏覆盖，`z-index: 9999`

### 4.2 核心逻辑

#### 消息接收
- `onMounted` 时订阅 `uni.$on('ws:billiard_reward_broadcast', handleMessage)`
- `onUnmounted` 时取消订阅（App.vue 不会卸载，但保持规范）

#### 去重机制
- **内存去重**：`Set` 存储已处理的 `notificationId`
- **本地去重**：`uni.setStorageSync('reward_seen_ids', [{id, time}])`，存最近 1 小时记录
- 收到消息先查内存 Set → 存在则跳过
- 内存不存在则查 storage → 存在则跳过并加入内存 Set
- 都不存在 → 加入队列 + 写入内存 Set + 写入 storage

#### 播放队列
- 维护 `queue` 数组（FIFO）
- 维护 `isPlaying` 标志位
- 新消息入队后，如当前未播放则取队首开始播放
- 播放结束（或关闭）后自动取下一条
- **播放前检查**：`animationExpireTime` 是否已过期，过期则跳过

#### 动效实现
- **直接复用**工作台现有霸屏小心心动效
- 将动效代码抽取为 `RewardBroadcast` 组件
- 展示内容：`title` + `content`（含品牌信息）
- 关闭按钮：右上角 ×
- 自动消失：动画播放完毕后自动隐藏

#### 已读时机
| 场景 | 是否调用 /read |
|------|---------------|
| WebSocket 消息到达 | ❌ 否 |
| 用户点击关闭按钮 | ✅ 是 |
| 用户点击动画（跳详情） | 跳转后由详情页调用 |
| 动画自动播放完毕 | ❌ 否 |

### 4.3 补播机制

**触发时机**：
- App 回到前台（`onShow`）
- WebSocket 重连成功（`ws:connected` 事件）

**补播逻辑**：
1. 请求通知列表 `readStatus=0`（未读）
2. 过滤条件：`type===5 && sourceType===2 && bizType==='REWARD'`
3. 时间过滤：`publishTime` 在 **30 分钟内**
4. 去重：跳过已在内存 Set / storage 中的 ID
5. 按时间正序加入队列播放
6. 用 `reward_compensated_ids` 标记已补播过，避免重复补

### 4.4 数据结构

业务载荷（二次 parse 后）：
```javascript
{
  notificationId: 1001,
  bizType: 'REWARD',
  rewardId: 9001,
  city: '苏州市',
  amount: 2000,           // 分
  memberNickname: '小王',
  coachName: '小李',
  title: '初球来电打赏播报',
  content: '球友小王为初球来电助教小李打赏了20元',
  voiceText: '...',       // 本次不做TTS，忽略
  animationType: 'reward',
  animationExpireTime: '2026-08-26T10:30:00'
}
```

---

## 五、打赏记录页面

### 5.1 API 层

**文件**：`api/billiard/reward.js`

| 方法 | 接口 | 说明 |
|------|------|------|
| `getRewardPage(params)` | `GET /billiard/reward/page` | 分页查询已支付打赏；只有分页参数 |

### 5.2 页面设计

**路径**：`subpkg/mine/wallet/reward-record/index.vue`（放在 mine 分包内）

**页面结构：**
- 顶部导航栏：「打赏记录」
- 列表区域：下拉刷新 + 上拉加载更多
- 列表项：
  ```
  [头像]  昵称                  ¥20.00（强调色，右对齐）
          2026-08-26 10:30:00
  ```
- 空状态：居中显示「暂无打赏记录」+ 图标

**金额展示**：`amount` 单位为分，展示时除以 100，保留两位小数，前缀 `¥`

### 5.3 入口

- **位置**：`pages/mine/wallet/index.vue` 钱包页面
- 与「提现记录」「扣款记录」同级，新增「打赏记录」入口

---

## 六、移除开票入口

- 经检查，当前项目无任何开票（invoice / 发票 / 开票）相关代码
- **无需处理**，保持现状即可

---

## 七、文件变更总览

### 新增文件（9 个）

| 文件 | 说明 |
|------|------|
| `utils/websocket.js` | WebSocket 连接管理器（单例） |
| `api/billiard/notification.js` | 通知中心 API |
| `api/billiard/reward.js` | 打赏相关 API |
| `store/modules/notification.js` | 通知状态管理 |
| `components/reward-broadcast/index.vue` | 打赏播报动画组件 |
| `subpkg/notification/index.vue` | 通知列表页 |
| `subpkg/notification/detail.vue` | 通知详情页 |
| `subpkg/mine/wallet/reward-record/index.vue` | 打赏记录页 |

### 修改文件（7 个）

| 文件 | 修改内容 |
|------|----------|
| `App.vue` | 挂载打赏播报组件；启动时初始化 WS（如有 token） |
| `pages.json` | 新增 notification 分包；新增页面路由 |
| `main.js` / `store/index.js` | 注册 notification store |
| `store/modules/user.js` | 登录成功后连接 WS；退出登录后关闭 WS |
| `pages/work/index.vue` | 顶部新增通知铃铛 + 角标 |
| `pages/mine/index.vue` | 功能菜单新增「消息通知」项 |
| `pages/mine/wallet/index.vue` | 新增「打赏记录」入口 |

---

## 八、错误处理与边界情况

### 8.1 WebSocket 异常
- 连接失败：静默重连，不打扰用户
- 消息解析失败：`try/catch` 包裹，单条失败不影响后续
- 心跳超时：视为断开，触发重连流程

### 8.2 通知 API 异常
- 未读数拉取失败：不显示角标（显示 0 或不显示）
- 列表加载失败：显示错误提示 + 重试按钮
- 详情加载失败：显示错误页面

### 8.3 打赏播报异常
- 动效组件报错：`try/catch`，跳过当前条，继续队列下一条
- 去重 storage 读写失败：降级为仅内存去重
- 动画过期：不展示，直接从队列移除

### 8.4 金额计算
- 统一除以 100，保留两位小数
- 使用 `Number(amount / 100).toFixed(2)`，注意浮点数精度（分转元不会有精度问题）

---

## 九、测试关注点

1. **WebSocket 重连**：手动断网后恢复，验证自动重连
2. **消息去重**：同一条消息多次到达，只展示一次
3. **队列播放**：同时收到多条，依次播放，不同时出现
4. **过期动画**：收到已过期的消息，不展示
5. **补播机制**：杀掉 App 后 10 分钟内重新打开，补播离线期间的打赏
6. **未读数同步**：通知已读后，工作台和「我的」角标同步减少
7. **多平台兼容**：App / H5 / 微信小程序 三端验证

---

## 十、不做的事（Out of Scope）

- TTS 语音播报（本次不做）
- 通知分类跳转（`actionType` 暂不处理，只展示内容）
- 极光推送点击跳转通知详情（本次新增 WS 通道，JPush 点击暂不接入）
- 开票功能（后端未开发，前端也无代码）
