# 现场开单（助教端）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在助教端 App 中实现完整的现场开单、服务计时、多方式支付流程，入口位于个人中心。

**Architecture:** 独立子包 `subpkg/onsite/` + 独立 API 模块（`onsiteOrder.js` / `onsitePayment.js`），与现有预约订单完全隔离。请求拦截器统一追加 `client-version` 和 `client-platform` header。uQRCode 组件复用已有 `uni_modules/Sansnn-uQRCode`。

**Tech Stack:** UniApp + Vue 3 (Composition API / `<script setup>`) + Pinia + SCSS + ColorUI + Sansnn-uQRCode (uni_modules)

## Global Constraints

- 版本号：`config.appInfo.version = '1.0.1'`
- 请求头：所有登录态请求携带 `tenant-id: '122'`、`client-version`、`client-platform`
- 金额单位：接口使用"分"（整数），展示时转"元"（保留 2 位小数），禁止浮点数累加金额
- 服务时间：`startTime` / `endTime` 以服务端为准，客户端计时仅用于展示
- 幂等：创建订单使用 UUID 作为 `requestId`，重试时复用
- 二维码：使用 `displayContent` 原文生成，**不**使用 `cashierToken`
- 支付状态：`paymentStatus = 10` 后关闭所有支付入口
- 命名规范：文件 kebab-case，变量/函数 camelCase，组件 PascalCase
- 不影响现有功能：新代码独立子包 + 独立 API 文件，仅在拦截器和个人中心做增量修改

---

## Task 1: 基础改造 — 版本号 & 请求头

**Files:**
- Modify: `config.js`
- Modify: `utils/request.js`

**Interfaces:**
- Produces: 所有请求自动携带 `client-version` 和 `client-platform` header

**Steps:**

- [ ] **Step 1: 升级版本号**

修改 `config.js` 第 6 行：
```js
version: '1.0.1'
```

- [ ] **Step 2: 请求拦截器追加 header**

修改 `utils/request.js` 的 `request` 函数，在 `config.header['tenant-id'] = '122'` 之后追加：
```js
// 添加 client-version（现场开单等新功能需要）
config.header['client-version'] = config.appInfo?.version || '1.0.0'
// 添加 client-platform
import { getPlatform } from '@/utils/platform'
// （import 放在文件顶部）
config.header['client-platform'] = getPlatform()
```

注意：`import` 语句要放在文件顶部（第 1~6 行附近），不要放在函数内部。

实际修改时，import 放在文件顶部：
```js
import { getPlatform } from '@/utils/platform'
```

在设置 header 的位置（第 64 行 `tenant-id` 之后）添加：
```js
// 添加客户端版本号和平台标识
import config from '@/config'
```
（config 已经在顶部引入了，直接用）

```js
config.header['client-version'] = config.appInfo?.version || '1.0.0'
config.header['client-platform'] = getPlatform()
```

**注意**：函数参数叫 `config`，和顶部 import 的 `config` 重名了。需要用不同方式引用全局配置。查看现有代码，顶部已经有 `import config from '@/config'`，但函数参数也叫 `config`。实际在函数内部，`config` 指的是函数参数（请求配置对象）。所以要给 import 的 config 起个别名，或者用另一种方式。

修正方案：将顶部 import 改为：
```js
import appConfig from '@/config'
```
然后把文件中所有引用全局配置的 `config.baseUrl` 改为 `appConfig.baseUrl`（第 8 行、第 82 行附近）。

再添加：
```js
config.header['client-version'] = appConfig.appInfo?.version || '1.0.0'
config.header['client-platform'] = getPlatform()
```

**更简单的方案**：直接使用已经在顶部声明的 `baseUrl` 常量是从 `config.baseUrl` 来的。我们直接在顶部取出版本号常量即可，不动现有引用：

在 `utils/request.js` 顶部（第 8 行 `const baseUrl = config.baseUrl` 之后）添加：
```js
const clientVersion = config.appInfo?.version || '1.0.0'
```

然后在 header 设置处使用：
```js
config.header['client-version'] = clientVersion
```

这样改动最小，不影响现有 `config` 命名。

- [ ] **Step 3: 验证构建不报错**

用 HBuilderX 或 `npm run dev:h5`（如果有）验证项目能正常启动，现有页面不报错。

---

## Task 2: 新增 API 模块 — onsiteOrder.js

**Files:**
- Create: `api/billiard/onsiteOrder.js`

**Interfaces:**
- Produces: `searchMember`, `createOnsiteOrder`, `getOnsiteOrderPage`, `getOnsiteOrderDetail`, `updateReturnTravel`, `cancelOnsiteOrder`, `startOnsiteService`, `finishOnsiteService`
- Consumes: `utils/request.js` (request 函数)

**Steps:**

- [ ] **Step 1: 创建 API 文件**

创建 `api/billiard/onsiteOrder.js`，参照 `api/billiard/order.js` 的风格：

```js
import request from '@/utils/request'

// 手机号后四位查询会员
export function searchMember(mobileSuffix) {
  return request({
    url: '/coach-api/billiard/onsite-order/member-search',
    method: 'get',
    params: { mobileSuffix }
  })
}

// 创建现场订单
export function createOnsiteOrder(data) {
  return request({
    url: '/coach-api/billiard/onsite-order/create',
    method: 'post',
    data
  })
}

// 现场订单分页列表
export function getOnsiteOrderPage(params) {
  return request({
    url: '/coach-api/billiard/onsite-order/page',
    method: 'get',
    params
  })
}

// 现场订单详情
export function getOnsiteOrderDetail(id) {
  return request({
    url: '/coach-api/billiard/onsite-order/get',
    method: 'get',
    params: { id }
  })
}

// 修改返程车费
export function updateReturnTravel(data) {
  return request({
    url: '/coach-api/billiard/onsite-order/update-return-travel',
    method: 'post',
    data
  })
}

// 取消现场订单
export function cancelOnsiteOrder(orderId) {
  return request({
    url: '/coach-api/billiard/onsite-order/cancel',
    method: 'post',
    data: { orderId }
  })
}

// 开始服务
export function startOnsiteService(orderId) {
  return request({
    url: '/coach-api/billiard/onsite-order/start',
    method: 'post',
    data: { orderId }
  })
}

// 结束服务并锁价
export function finishOnsiteService(orderId) {
  return request({
    url: '/coach-api/billiard/onsite-order/finish',
    method: 'post',
    data: { orderId }
  })
}
```

---

## Task 3: 新增 API 模块 — onsitePayment.js

**Files:**
- Create: `api/billiard/onsitePayment.js`

**Interfaces:**
- Produces: `createOnsitePayment`, `createOnsiteQrCode`, `getOnsitePaymentStatus`
- Consumes: `utils/request.js` (request 函数)

**Steps:**

- [ ] **Step 1: 创建支付 API 文件**

创建 `api/billiard/onsitePayment.js`：

```js
import request from '@/utils/request'

// 创建助教本机 App 支付尝试
export function createOnsitePayment(data) {
  return request({
    url: '/coach-api/billiard/onsite-payment/create',
    method: 'post',
    data
  })
}

// 创建固定金额原生二维码
export function createOnsiteQrCode(data) {
  return request({
    url: '/coach-api/billiard/onsite-payment/create-qr',
    method: 'post',
    data
  })
}

// 查询支付和结算状态
export function getOnsitePaymentStatus(orderId) {
  return request({
    url: '/coach-api/billiard/onsite-payment/status',
    method: 'get',
    params: { orderId }
  })
}
```

---

## Task 4: 新增工具函数 — onsiteOrder.js

**Files:**
- Create: `utils/onsiteOrder.js`

**Interfaces:**
- Produces: `SERVICE_TYPE_MAP`, `ORDER_STATUS_MAP`, `PAYMENT_STATUS_MAP`, `SETTLEMENT_STATUS_MAP`, `formatFenToYuan`, `generateUUID`, `formatDuration`
- Consumes: 无外部依赖（纯工具函数）

**Steps:**

- [ ] **Step 1: 创建工具文件**

创建 `utils/onsiteOrder.js`：

```js
// ============ 状态枚举 ============

// 服务类型
export const SERVICE_TYPE_MAP = {
  1: { name: '台球陪练', color: '#2f6bff' },
  2: { name: '达人带路', color: '#10b981' },
  3: { name: '酒文化讲解', color: '#8b5cf6' },
  4: { name: '影视讲解分享', color: '#f59e0b' }
}

// 订单状态
export const ORDER_STATUS_MAP = {
  15: { name: '待开始', color: '#f59e0b' },
  40: { name: '进行中', color: '#2f6bff' },
  45: { name: '待付款', color: '#ef4444' },
  50: { name: '待评价', color: '#8b5cf6' },
  60: { name: '已完成', color: '#10b981' },
  70: { name: '已取消', color: '#9ca3af' }
}

// 支付主状态
export const PAYMENT_STATUS_MAP = {
  0: { name: '未支付', color: '#6b7280' },
  10: { name: '已支付', color: '#10b981' },
  20: { name: '支付异常', color: '#ef4444' }
}

// 结算状态
export const SETTLEMENT_STATUS_MAP = {
  0: { name: '未开始', color: '#6b7280' },
  10: { name: '处理中', color: '#f59e0b' },
  20: { name: '成功', color: '#10b981' },
  30: { name: '失败待重试', color: '#f59e0b' }
}

// ============ 金额工具 ============

/**
 * 分转元，保留两位小数
 * @param {number} fen 分
 * @returns {string} 元，如 "12.30"
 */
export function formatFenToYuan(fen) {
  if (fen === null || fen === undefined || isNaN(fen)) return '0.00'
  return (Number(fen) / 100).toFixed(2)
}

// ============ UUID 生成 ============

/**
 * 生成 32 位无横线 UUID（用于 requestId）
 * @returns {string} 32 位十六进制字符串
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '')
  }
  // 降级方案
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, () => {
    return (Math.random() * 16 | 0).toString(16)
  })
}

// ============ 时间工具 ============

/**
 * 秒数格式化为 HH:MM:SS
 * @param {number} seconds 总秒数
 * @returns {string} 如 "01:23:45"
 */
export function formatDuration(seconds) {
  seconds = Math.max(0, Math.floor(Number(seconds) || 0))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n) => n.toString().padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/**
 * 计算两个时间字符串的差值（秒）
 * @param {string} startStr 开始时间，格式 "YYYY-MM-DD HH:mm:ss"
 * @param {string} endStr 结束时间，默认当前时间
 * @returns {number} 秒数
 */
export function diffSeconds(startStr, endStr) {
  if (!startStr) return 0
  const start = new Date(startStr.replace(/-/g, '/')).getTime()
  const end = endStr
    ? new Date(endStr.replace(/-/g, '/')).getTime()
    : Date.now()
  return Math.max(0, Math.floor((end - start) / 1000))
}

/**
 * 计算距离过期时间的剩余秒数
 * @param {string} expireTimeStr 过期时间，格式 "YYYY-MM-DD HH:mm:ss"
 * @returns {number} 剩余秒数，过期返回 0
 */
export function getRemainingSeconds(expireTimeStr) {
  if (!expireTimeStr) return 0
  const expire = new Date(expireTimeStr.replace(/-/g, '/')).getTime()
  const now = Date.now()
  return Math.max(0, Math.floor((expire - now) / 1000))
}
```

---

## Task 5: 注册子包 — pages.json 配置

**Files:**
- Modify: `pages.json`

**Interfaces:**
- Produces: `subpkg/onsite` 子包注册，含 4 个页面

**Steps:**

- [ ] **Step 1: 在 pages.json 的 subPackages 数组中追加 onsite 子包**

找到 `subPackages` 数组，在最后一个子包之后添加：

```json
{
  "root": "subpkg/onsite",
  "pages": [
    {
      "path": "order-list",
      "style": {
        "navigationBarTitleText": "现场订单",
        "navigationBarBackgroundColor": "#ffffff",
        "navigationBarTextStyle": "black",
        "backgroundColor": "#F7F8FA"
      }
    },
    {
      "path": "create",
      "style": {
        "navigationBarTitleText": "创建订单",
        "navigationBarBackgroundColor": "#ffffff",
        "navigationBarTextStyle": "black",
        "backgroundColor": "#F7F8FA"
      }
    },
    {
      "path": "detail",
      "style": {
        "navigationBarTitleText": "订单详情",
        "navigationBarBackgroundColor": "#ffffff",
        "navigationBarTextStyle": "black",
        "backgroundColor": "#F7F8FA"
      }
    },
    {
      "path": "qr-pay",
      "style": {
        "navigationBarTitleText": "扫码支付",
        "navigationBarBackgroundColor": "#ffffff",
        "navigationBarTextStyle": "black",
        "backgroundColor": "#F7F8FA"
      }
    }
  ]
}
```

注意：检查 JSON 格式，逗号分隔，确保语法正确。

---

## Task 6: 个人中心添加入口

**Files:**
- Modify: `pages/mine/index.vue`

**Interfaces:**
- Consumes: 无（纯导航跳转）
- Produces: "现场开单"菜单项，跳转 `/subpkg/onsite/order-list`

**Steps:**

- [ ] **Step 1: 在功能菜单区最上方添加"现场开单"菜单项**

在 `pages/mine/index.vue` 的 `section-card` 功能菜单中，找到第一个 `menu-item`（"个人信息"），在它**之前**插入：

```vue
<view class="menu-item" @click="navToOnsiteOrder">
  <view class="menu-item-left">
    <view class="icon-box icon-blue">
      <uni-icons type="compose" size="22" color="#fff"></uni-icons>
    </view>
    <view class="menu-text">现场开单</view>
  </view>
  <uni-icons type="right" size="18" color="#999"></uni-icons>
</view>

<view class="divider"></view>
```

- [ ] **Step 2: 添加跳转方法**

在 `<script setup>` 中添加：

```js
const navToOnsiteOrder = () => {
  uni.navigateTo({ url: '/subpkg/onsite/order-list' })
}
```

注意：`icon-blue` 在 style 中可能还没有定义，检查现有样式。现有 `.icon-box` 样式类中有 `icon-orange`、`icon-green`、`icon-purple`、`icon-cyan`、`icon-red`、`icon-gray`、`icon-pink`，**没有** `icon-blue`。需要在 style 中补充。

在 `.icon-pink` 后面添加：

```scss
.icon-blue {
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
}
```

---

## Task 7: 现场订单列表页

**Files:**
- Create: `subpkg/onsite/order-list.vue`

**Interfaces:**
- Consumes: `getOnsiteOrderPage` from `api/billiard/onsiteOrder.js`, `ORDER_STATUS_MAP`, `SERVICE_TYPE_MAP`, `formatFenToYuan` from `utils/onsiteOrder.js`

**Steps:**

- [ ] **Step 1: 创建列表页骨架**

创建 `subpkg/onsite/order-list.vue`，包含：
- 导航栏右侧"+ 新建"按钮（用 uni-icons 或文字）—— UniApp 中通过自定义导航栏按钮或页面内浮动按钮实现。由于 pages.json 原生导航栏右侧按钮限制较多，用页面内顶部 tab + 右上角按钮更灵活。

模板结构：
```vue
<template>
  <view class="onsite-order-list">
    <!-- 状态筛选 tab -->
    <scroll-view scroll-x class="status-tabs">
      <view
        v-for="tab in statusTabs"
        :key="tab.value"
        class="status-tab"
        :class="{ active: currentStatus === tab.value }"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </scroll-view>

    <!-- 新建按钮（浮动/固定） -->
    <view class="create-btn" @click="navToCreate">
      <uni-icons type="plus" size="20" color="#fff"></uni-icons>
      <text>新建订单</text>
    </view>

    <!-- 订单列表 -->
    <view class="order-list">
      <view
        v-for="item in orderList"
        :key="item.id"
        class="order-card"
        @click="navToDetail(item.id)"
      >
        <view class="card-header">
          <text class="order-no">{{ item.orderNo }}</text>
          <text class="status-tag" :style="{ color: getStatusColor(item.status) }">
            {{ getStatusName(item.status) }}
          </text>
        </view>
        <view class="card-body">
          <view class="info-row">
            <text class="label">服务类型</text>
            <text class="value">{{ getServiceTypeName(item.serviceType) }}</text>
          </view>
          <view class="info-row">
            <text class="label">客户类型</text>
            <text class="value">{{ item.customerType === 1 ? '平台会员' : '散客' }}</text>
          </view>
          <view class="info-row" v-if="item.payAmount !== null && item.payAmount !== undefined">
            <text class="label">订单金额</text>
            <text class="value amount">¥{{ formatFenToYuan(item.payAmount) }}</text>
          </view>
        </view>
        <view class="card-footer">
          <text class="create-time">{{ item.startTime || item.createTime || '' }}</text>
        </view>
      </view>

      <view v-if="orderList.length === 0 && !loading" class="empty">
        <text>暂无订单</text>
      </view>

      <view v-if="loading" class="loading">加载中...</view>
      <view v-if="noMore && orderList.length > 0" class="no-more">没有更多了</view>
    </view>
  </view>
</template>
```

- [ ] **Step 2: 实现业务逻辑**

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { getOnsiteOrderPage } from '@/api/billiard/onsiteOrder'
import { ORDER_STATUS_MAP, SERVICE_TYPE_MAP, formatFenToYuan } from '@/utils/onsiteOrder'

const statusTabs = [
  { label: '全部', value: '' },
  { label: '待开始', value: 15 },
  { label: '进行中', value: 40 },
  { label: '待付款', value: 45 },
  { label: '已完成', value: 60 },
  { label: '已取消', value: 70 }
]

const currentStatus = ref('')
const orderList = ref([])
const pageNo = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const noMore = ref(false)

const getStatusName = (status) => ORDER_STATUS_MAP[status]?.name || '未知'
const getStatusColor = (status) => ORDER_STATUS_MAP[status]?.color || '#666'
const getServiceTypeName = (type) => SERVICE_TYPE_MAP[type]?.name || '未知'

const fetchList = async (isRefresh = false) => {
  if (loading.value) return
  if (isRefresh) {
    pageNo.value = 1
    noMore.value = false
    orderList.value = []
  }
  if (noMore.value) return

  loading.value = true
  try {
    const params = {
      pageNo: pageNo.value,
      pageSize: pageSize.value
    }
    if (currentStatus.value !== '') {
      params.status = currentStatus.value
    }
    const res = await getOnsiteOrderPage(params)
    const list = res.data?.list || []
    if (isRefresh) {
      orderList.value = list
    } else {
      orderList.value = [...orderList.value, ...list]
    }
    if (list.length < pageSize.value) {
      noMore.value = true
    } else {
      pageNo.value++
    }
  } catch (e) {
    console.error('获取现场订单列表失败', e)
  } finally {
    loading.value = false
    if (isRefresh) {
      uni.stopPullDownRefresh()
    }
  }
}

const switchTab = (value) => {
  currentStatus.value = value
  fetchList(true)
}

const navToCreate = () => {
  uni.navigateTo({ url: '/subpkg/onsite/create' })
}

const navToDetail = (id) => {
  uni.navigateTo({ url: `/subpkg/onsite/detail?id=${id}` })
}

onShow(() => {
  fetchList(true)
})

onPullDownRefresh(() => {
  fetchList(true)
})

onReachBottom(() => {
  fetchList(false)
})
</script>
```

- [ ] **Step 3: 样式（SCSS）**

参照现有页面风格（如 `pages/order/index.vue`），保持一致的卡片、间距、颜色。
- 背景色 `#f7f8fa`
- 卡片白色、圆角 24rpx、阴影
- 状态标签右对齐、加粗

---

## Task 8: 创建现场订单页

**Files:**
- Create: `subpkg/onsite/create.vue`

**Interfaces:**
- Consumes: `searchMember`, `createOnsiteOrder` from `api/billiard/onsiteOrder.js`
- Consumes: `getCoachProfile` from `api/billiard/coach.js`（获取已开通的服务类型）
- Consumes: `generateUUID`, `SERVICE_TYPE_MAP` from `utils/onsiteOrder.js`
- Produces: 创建成功后跳转订单详情页

**Steps:**

- [ ] **Step 1: 创建页面模板**

创建 `subpkg/onsite/create.vue`，页面分为几个区块：
1. 服务类型选择（横向卡片）
2. 客户类型切换（tab）
3. 会员查询区（条件显示）
4. 返程车费输入
5. 底部创建按钮

- [ ] **Step 2: 实现会员查询逻辑**
- 输入框只允许 4 位数字
- 满 4 位自动调用 `searchMember`
- 结果列表展示（头像、昵称、脱敏手机号），单选
- 空结果提示，可切换为无会员
- 频率限制错误处理

- [ ] **Step 3: 实现创建订单逻辑**
- 生成 UUID 作为 `requestId`
- 组装请求体：`serviceType`、`customerType`、`memberUserId`（会员时）、`returnTravelAmount`（分）
- 调用创建接口
- 成功后跳转订单详情页
- 失败时保留 `requestId` 便于重试

- [ ] **Step 4: 服务类型从 coachProfile 读取**
- 页面加载时获取教练档案
- 读取服务类型列表（假设字段为 `serviceTypes` 或 `serviceTypeList`，如果返回的是单个字段做兜底）
- 档案没有时默认展示"台球陪练"

注意：教练档案的服务类型字段名需要确认。接口字段暂时按 `serviceTypes`（数组）处理，如果是逗号分隔字符串就 split。如果没有这个字段，兜底为 `[1]`（台球陪练）。

---

## Task 9: 订单详情页（含计时 + 支付入口）

**Files:**
- Create: `subpkg/onsite/detail.vue`

**Interfaces:**
- Consumes: `getOnsiteOrderDetail`, `updateReturnTravel`, `cancelOnsiteOrder`, `startOnsiteService`, `finishOnsiteService` from `api/billiard/onsiteOrder.js`
- Consumes: `createOnsitePayment`, `getOnsitePaymentStatus` from `api/billiard/onsitePayment.js`
- Consumes: 所有工具函数和枚举从 `utils/onsiteOrder.js`
- Produces: 完整的订单详情 + 状态流转 + 支付入口

**Steps:**

- [ ] **Step 1: 页面骨架与顶部信息区**
- 接收 `id` 参数
- 页面加载时获取订单详情
- 顶部展示订单号、服务类型、客户信息、状态标签

- [ ] **Step 2: 状态 15 — 待开始**
- 展示小时单价、返程车费
- 修改返程车费弹窗（数字输入，0-50元）
- 取消订单按钮（二次确认）
- 开始服务按钮（主按钮）

- [ ] **Step 3: 状态 40 — 进行中 + 计时器**
- 大字展示实时计时 HH:MM:SS
- 基于服务端 `startTime`，本地 setInterval 每秒刷新
- `onShow` 时重新拉取详情校准
- 结束服务按钮（红色，二次确认）

- [ ] **Step 4: 状态 45 — 待付款 + 支付入口**
- 展示：实际时长、计费分钟、服务金额、返程车费、应付总额
- 支付状态展示
- 4 个支付按钮：微信支付、支付宝支付、微信收款码、支付宝收款码
- paymentStatus = 10 时隐藏所有支付按钮，显示处理中/成功状态
- 支付轮询：每 3 秒查一次支付状态

- [ ] **Step 5: 状态 50/60/70 — 终态展示**
- 完整订单信息展示
- 无操作按钮（或返回列表）

- [ ] **Step 6: App 支付流程**
- 点击微信/支付宝支付
- 调用 `createOnsitePayment({ orderId, channelCode })`
- 拿到 `payOrderId` 后，调用现有支付提交接口
- 拉起对应 App 支付
- 支付结果回调后刷新支付状态

注意：现有项目中可能没有现成的 App 支付封装。如果项目里没有 `/app-api/pay/order/submit` 的封装，需要在本任务中创建。由于文档明确说"调用现有支付提交接口"，但搜索结果中没找到相关代码，实现时先检查，没有就新增一个支付 API 文件。

---

## Task 10: 二维码支付页

**Files:**
- Create: `subpkg/onsite/qr-pay.vue`

**Interfaces:**
- Consumes: `createOnsiteQrCode`, `getOnsitePaymentStatus` from `api/billiard/onsitePayment.js`
- Consumes: `formatFenToYuan`, `getRemainingSeconds`, `formatDuration` from `utils/onsiteOrder.js`
- Consumes: uQRCode 组件（uni_modules 已安装）

**Steps:**

- [ ] **Step 1: 页面模板**
- 接收 `orderId` 和 `channelCode` 参数
- 顶部：支付渠道标识 + 金额
- 中间：二维码区域（uQRCode 组件）
- 提示文字（微信/支付宝扫码）
- 过期倒计时
- 支付状态
- 重新生成按钮

- [ ] **Step 2: 二维码生成逻辑**
- 页面加载时调用 `createOnsiteQrCode`
- 校验 `displayMode === 'qr_code'` 且 `displayContent` 非空
- 使用 uQRCode 渲染 `displayContent`
- 保存 `cashierExpireTime` 用于倒计时

- [ ] **Step 3: 支付状态轮询**
- 每 2~3 秒调用 `getOnsitePaymentStatus`
- `paymentStatus = 10` 时停止轮询，隐藏二维码，显示支付成功
- `onShow` 立即查询一次，`onHide` 暂停
- 最大轮询次数上限 200 次

- [ ] **Step 4: 过期处理**
- 本地倒计时到 0 后显示"二维码已过期"
- 显示"重新生成二维码"按钮
- 点击重新生成：调用 `createOnsiteQrCode` 生成新二维码
- 防重复点击，同一时间只展示最新二维码

- [ ] **Step 5: 样式**
- 居中布局，白色大卡片
- 二维码尺寸 400rpx × 400rpx
- 金额醒目大字（红色/主色）
- 参照 `subpkg/mine/qrcode/index.vue` 的 uQRCode 用法

---

## Task 11: 联调验证 & 细节完善

**Files:**
- Modify: 多个页面（根据实际联调情况微调）

**Steps:**

- [ ] **Step 1: 验证请求头**
- 浏览器 Network 或真机调试确认所有请求携带了 `client-version` 和 `client-platform`
- 确认版本号为 `1.0.1`

- [ ] **Step 2: 验证创建订单流程**
- 进入个人中心 → 现场开单 → 新建订单
- 选择服务类型 → 选择客户类型 → （会员时）查询会员 → 输入返程车费 → 创建
- 确认订单创建成功并跳转到详情页，状态为"待开始"

- [ ] **Step 3: 验证服务计时流程**
- 点击"开始服务" → 状态变为进行中
- 计时器正常走动，退到后台再回来时间校准正确
- 点击"结束服务" → 状态变为待付款，金额正确

- [ ] **Step 4: 验证二维码支付**
- 点击"微信收款码" → 二维码正常显示
- 验证二维码内容是 `displayContent` 原文
- 过期倒计时正常
- 重新生成功能正常

- [ ] **Step 5: 验证订单列表**
- 各状态 tab 切换正常
- 下拉刷新、上拉加载正常
- 点击跳转到详情正确

- [ ] **Step 6: 验证不影响现有功能**
- 工作台、预约订单、钱包等原有功能正常
- 老接口调用不受新 header 影响

---

## 附录：文件清单

### 新增文件
- `api/billiard/onsiteOrder.js` — 现场订单 API
- `api/billiard/onsitePayment.js` — 现场支付 API
- `utils/onsiteOrder.js` — 枚举常量 + 工具函数
- `subpkg/onsite/order-list.vue` — 现场订单列表
- `subpkg/onsite/create.vue` — 创建现场订单
- `subpkg/onsite/detail.vue` — 订单详情 + 计时 + 支付
- `subpkg/onsite/qr-pay.vue` — 二维码支付页

### 修改文件
- `config.js` — 版本号升级
- `utils/request.js` — 追加 client-version / client-platform header
- `pages.json` — 注册 subpkg/onsite 子包
- `pages/mine/index.vue` — 新增"现场开单"入口

### 零影响保证
- 现有预约订单代码（`api/billiard/order.js`、`pages/order/`、`subpkg/order/`）完全不动
- 工作台（`pages/work/index.vue`）完全不动
- 钱包、评价等模块完全不动
- 仅新增 header 字段，老接口自动忽略
