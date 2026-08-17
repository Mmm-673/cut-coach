# 现场订单融合与车费后移改造 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将普通订单与现场订单融合到统一订单列表，Tabbar 订单改为现场开单创建页，车费后移至结束服务时确认，个人中心入口调整。

**Architecture:** 
- 主包新增 `pages/onsite/create.vue` 作为 Tabbar "订单"页
- `pages/order/index.vue` 改造为统一订单列表（融合普通+现场），新增 type 字段判断和类型标签
- 个人中心"现场开单"改为"全部订单"，跳转到统一订单列表
- 现场订单详情页删除修改车费入口，新增结束服务时车费输入底部弹出层
- API 层调整：`finishOnsiteService` 增加 `returnTravelAmount`，删除 `updateReturnTravel`

**Tech Stack:** UniApp + Vue 3 (Composition API) + SCSS

## Global Constraints

- 不操作 git，所有改动完成后由用户检查再提交
- 车费单位：接口传输为分（整数），前端展示为元（两位小数）
- 服务类型：1=台球指导，2=潮玩领航，3=酒艺品鉴，4=影视赏析
- 起步时长：台球1H，潮玩领航2H，酒艺品鉴4H，影视赏析8H
- 订单类型：type=1 普通订单，type=2 现场订单
- Tabbar 页面使用 `switchTab` 跳转，不能用 `navigateTo`
- 结束服务幂等：失败重试时以服务端返回值为准，禁止客户端覆盖

---

## Task 1: API 层调整（onsiteOrder.js）

**Files:**
- Modify: `api/billiard/onsiteOrder.js`

**Interfaces:**
- Produces: `finishOnsiteService({ orderId, returnTravelAmount })` — 参数变为对象，包含 orderId 和 returnTravelAmount（分）
- Removes: `updateReturnTravel(data)` — 整个函数删除

**Steps:**

- [ ] **Step 1: 修改 finishOnsiteService 函数签名**

将 `finishOnsiteService(orderId)` 改为接收对象参数：
```js
// 结束服务并锁价
export function finishOnsiteService(data) {
  return request({
    url: '/coach-api/billiard/onsite-order/finish',
    method: 'post',
    data
  })
}
```
data 结构：`{ orderId, returnTravelAmount }`，returnTravelAmount 单位为分，范围 0～5000。

- [ ] **Step 2: 删除 updateReturnTravel 函数**

删除整个函数（约第 40-46 行）：
```js
// 修改返程车费
export function updateReturnTravel(data) {
  return request({
    url: '/coach-api/billiard/onsite-order/update-return-travel',
    method: 'post',
    data
  })
}
```

- [ ] **Step 3: 验证文件语法**

确认文件没有语法错误，导入导出正常。无需运行测试（UniApp 项目，手动验证）。

---

## Task 2: 工具函数补充（onsiteOrder.js 新增起步时长配置）

**Files:**
- Modify: `utils/onsiteOrder.js`

**Interfaces:**
- Produces: `SERVICE_MIN_HOURS` — 各服务类型的起步时长映射（小时）
- Produces: `ORDER_TYPE_MAP` — 订单类型映射（1=普通订单，2=现场订单）

**Steps:**

- [ ] **Step 1: 新增订单类型映射**

在状态枚举区域新增：
```js
// 订单类型
export const ORDER_TYPE_MAP = {
  1: { name: '普通订单', color: '#2f6bff' },
  2: { name: '现场订单', color: '#f59e0b' }
}
```

- [ ] **Step 2: 新增起步时长配置**

在服务类型下方新增：
```js
// 各服务起步时长（单位：小时）
export const SERVICE_MIN_HOURS = {
  1: 1,   // 台球指导
  2: 2,   // 潮玩领航
  3: 4,   // 酒艺品鉴
  4: 8    // 影视赏析
}
```

- [ ] **Step 3: 新增获取计费提示文案函数**

```js
/**
 * 获取服务计费规则提示文案
 * @param {number} serviceType 服务类型
 * @returns {string} 提示文案
 */
export function getBillingTip(serviceType) {
  const typeMap = {
    1: { name: '台球指导', hours: 1 },
    2: { name: '潮玩领航', hours: 2 },
    3: { name: '酒艺品鉴', hours: 4 },
    4: { name: '影视赏析', hours: 8 }
  }
  const info = typeMap[serviceType]
  if (!info) return ''
  return `温馨提示：${info.name}起步时长为${info.hours}小时，不足${info.hours}小时按${info.hours}小时计费，超出部分按分钟（单价/60）计费。`
}
```

---

## Task 3: pages.json 路由与 Tabbar 调整

**Files:**
- Modify: `pages.json`

**Interfaces:**
- Produces: 新的 tabbar 配置（订单 tab 指向 pages/onsite/create）
- Produces: 主包新增 pages/onsite/create 页面
- Produces: 分包 subpkg/onsite 移除 order-list 和 create

**Steps:**

- [ ] **Step 1: 在主包 pages 数组中新增 pages/onsite/create**

在 `pages` 数组中（`pages/mine/index` 之前或之后）新增：
```json
{
  "path": "pages/onsite/create",
  "style": {
    "navigationBarTitleText": "创建订单",
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#F7F8FA"
  }
}
```

- [ ] **Step 2: 修改 tabbar 订单页路径**

将 tabBar.list 中第二项的 pagePath 从 `"pages/order/index"` 改为 `"pages/onsite/create"`：
```json
{
  "pagePath": "pages/onsite/create",
  "iconPath": "static/images/tabbar/order.png",
  "selectedIconPath": "static/images/tabbar/order_.png",
  "text": "订单"
}
```

- [ ] **Step 3: 从分包 subpkg/onsite 移除 order-list 和 create**

保留 `detail` 和 `qr-pay`，删除 `order-list` 和 `create` 的配置项。修改后 subpkg/onsite 的 pages 数组为：
```json
[
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
```

- [ ] **Step 4: 调整 preloadRule**

将 `preloadRule` 中 `"pages/order/index"` 的 key 改为 `"pages/onsite/create"`，并确保预加载的包包括 `subpkg/onsite`：
```json
"preloadRule": {
  "pages/onsite/create": {
    "network": "all",
    "packages": ["subpkg/onsite"]
  },
  "pages/mine/index": {
    "network": "all",
    "packages": ["subpkg/mine"]
  }
}
```

---

## Task 4: 新建主包现场开单创建页（pages/onsite/create.vue）

**Files:**
- Create: `pages/onsite/create.vue`

**Interfaces:**
- Consumes: `getCoachProfile()` from `@/api/billiard/coach`
- Consumes: `searchMember(mobileSuffix)`, `createOnsiteOrder(data)` from `@/api/billiard/onsiteOrder`
- Consumes: `SERVICE_TYPE_MAP`, `generateUUID`, `getBillingTip` from `@/utils/onsiteOrder`
- Produces: 完整的创建页面，移除车费输入，新增计费规则提示

**Steps:**

- [ ] **Step 1: 创建文件并复制基础结构**

从 `subpkg/onsite/create.vue` 复制全部内容到 `pages/onsite/create.vue`，作为基础模板。

- [ ] **Step 2: 删除返程车费相关代码**

删除模板中的"返程车费" section-card（第 85-105 行左右）：
```html
<!-- 返程车费 -->
<view class="section-card">
  ...
</view>
```

删除 script 中相关变量和函数：
- `returnTravelYuan = ref('0')` 变量
- `onTravelBlur` 函数
- `canCreate` 中车费校验逻辑（删除 returnTravelAmount 相关判断）
- `handleCreate` 中 `returnTravelAmount` 计算和 data 中的字段

修改 `canCreate` 为：
```js
const canCreate = computed(() => {
  if (!selectedServiceType.value) return false
  if (customerType.value === 1 && !selectedMember.value) return false
  return true
})
```

修改 `handleCreate` 的 data 对象为：
```js
const data = {
  requestId: currentRequestId,
  serviceType: selectedServiceType.value,
  customerType: customerType.value
}
```

- [ ] **Step 3: 引入 getBillingTip 并新增计费规则提示**

在 import 中新增：
```js
import { SERVICE_TYPE_MAP, generateUUID, getBillingTip } from '@/utils/onsiteOrder'
```

在模板中，底部创建按钮之前（`bottom-bar` 的前面）新增计费提示：
```html
<!-- 计费规则提示 -->
<view class="billing-tip">
  <uni-icons type="info" size="14" color="#9ca3af"></uni-icons>
  <text class="billing-tip-text">{{ billingTipText }}</text>
</view>
```

在 script 中新增计算属性：
```js
const billingTipText = computed(() => {
  return getBillingTip(selectedServiceType.value)
})
```

- [ ] **Step 4: 新增计费提示样式**

在 style 中新增：
```scss
/* 计费规则提示 */
.billing-tip {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  padding: 20rpx 24rpx;
  background: #fef9e7;
  border-radius: 12rpx;
  margin: 0 24rpx 24rpx;
  margin-bottom: calc(140rpx + env(safe-area-inset-bottom));
}

.billing-tip-text {
  flex: 1;
  font-size: 24rpx;
  color: #92400e;
  line-height: 1.5;
}
```

注意：原来的 `.bottom-bar` padding-bottom 是 `calc(20rpx + env(safe-area-inset-bottom))`，保持不变。billing-tip 放在 bottom-bar 上方，需要调整 margin 避免被遮挡。

实际调整：把 billing-tip 放在页面底部固定栏之前的正常文档流中，bottom-bar 保持 fixed 在最底部，billing-tip 的 margin-bottom 需要留出底部按钮空间。

更简单的做法：把 billing-tip 也放进 bottom-bar 区域上方，或者直接放在最后一个 section-card 后面，正常文档流即可，bottom-bar 的 padding-bottom 足够。

建议：直接放在最后一个 section-card 的后面，作为普通内容展示，不做 fixed 定位。删除上面 `.billing-tip` 中的 `margin-bottom` 复杂计算，改为：
```scss
.billing-tip {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  padding: 20rpx 24rpx;
  background: #fef9e7;
  border-radius: 12rpx;
  margin: 0 0 24rpx;
}
```

- [ ] **Step 5: 删除金额输入相关样式**

删除 style 中 `.amount-input-box`、`.amount-symbol`、`.amount-input`、`.amount-unit`、`.amount-tip` 的样式（约 5 个样式块）。

- [ ] **Step 6: 验证页面结构完整性**

确认模板、script、style 三部分完整，import 路径正确（从 `@/` 引入，主包页面可以直接引用 api、utils）。

---

## Task 5: 统一订单列表页改造（pages/order/index.vue）

**Files:**
- Modify: `pages/order/index.vue`

**Interfaces:**
- Consumes: `getOrderPage(params)` from `@/api/billiard/order`（返回列表项含 type 字段）
- Consumes: `ORDER_TYPE_MAP` from `@/utils/onsiteOrder`
- Produces: 10 个状态 tab、订单类型标签、按 type 跳转不同详情页

**Steps:**

- [ ] **Step 1: 修改 tabs 数组为 10 个**

将 tabs 替换为：
```js
const tabs = [
  { label: '全部', value: 0 },
  { label: '待付款(普通)', value: 10 },
  { label: '待接单', value: 20 },
  { label: '已接单', value: 30 },
  { label: '待开始', value: 15 },
  { label: '进行中', value: 40 },
  { label: '待付款(现场)', value: 45 },
  { label: '待评价', value: 50 },
  { label: '已完成', value: 60 },
  { label: '已取消', value: 70 }
]
```

- [ ] **Step 2: 引入订单类型映射**

在 import 区域新增：
```js
import { ORDER_TYPE_MAP } from '@/utils/onsiteOrder'
```

- [ ] **Step 3: 修改订单卡片，新增订单类型标签**

在 `.order-header` 中，订单编号旁边新增类型标签。将 `order-header` 模板修改为：
```html
<view class="order-header">
  <view class="order-header-left">
    <text class="order-no">订单编号：{{order.orderNo}}</text>
    <text class="order-type-tag" :style="{ background: getOrderTypeColor(order.type) + '22', color: getOrderTypeColor(order.type) }">
      {{ getOrderTypeName(order.type) }}
    </text>
  </view>
  <uni-tag
      :text="getStatusText(order.status)"
      :type="getStatusType(order.status)"
      size="small"
      style="font-weight: bold"
  />
</view>
```

新增两个辅助函数：
```js
const getOrderTypeName = (type) => {
  return ORDER_TYPE_MAP[type]?.name || '未知'
}

const getOrderTypeColor = (type) => {
  return ORDER_TYPE_MAP[type]?.color || '#9ca3af'
}
```

- [ ] **Step 4: 修改跳转逻辑，按 type 区分**

将 `goToDetail` 函数改为：
```js
const goToDetail = (order) => {
  if (order.type === 2) {
    // 现场订单
    uni.navigateTo({
      url: `/subpkg/onsite/detail?id=${order.orderId}`
    })
  } else {
    // 普通订单（type=1 或默认）
    uni.navigateTo({
      url: `/subpkg/order/detail?orderId=${order.orderId}&status=${order.status}`
    })
  }
}
```

- [ ] **Step 5: 扩展状态文本和状态类型映射**

`getStatusText` 中新增现场订单状态的显示：
```js
const getStatusText = (status) => {
  const statusMap = {
    10: '待付款',
    15: '待开始',
    20: '待接单',
    30: '已接单',
    40: '进行中',
    45: '待付款',
    50: '用户待评价',
    60: '已完成',
    70: '已取消'
  }
  return statusMap[status] || '未知'
}
```

`getStatusType` 中新增：
```js
const getStatusType = (status) => {
  const typeMap = {
    10: 'warning',
    15: 'warning',
    20: 'warning',
    30: 'primary',
    40: 'primary',
    45: 'warning',
    50: 'warning',
    60: 'success',
    70: 'default'
  }
  return typeMap[status] || 'default'
}
```

- [ ] **Step 6: 新增订单类型标签样式**

在 style 中新增：
```scss
.order-header-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.order-type-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-weight: 500;
}
```

调整 `.order-no` 的 font-weight 为 500（可选，保持原样也可）。

---

## Task 6: 个人中心入口调整（pages/mine/index.vue）

**Files:**
- Modify: `pages/mine/index.vue`

**Interfaces:**
- Produces: "现场开单" → "全部订单"，跳转 switchTab 到订单列表页

**Steps:**

- [ ] **Step 1: 修改菜单文字**

将模板中的"现场开单"改为"全部订单"：
```html
<view class="menu-text">全部订单</view>
```

- [ ] **Step 2: 修改跳转函数**

将 `navToOnsiteOrder` 函数改为：
```js
const navToOnsiteOrder = () => {
  uni.switchTab({ url: '/pages/order/index' })
}
```

注意：函数名可以保留不变（调用处不变），也可以重命名。为减少改动，函数名保持 `navToOnsiteOrder` 即可，只改内部实现。

或者更干净地重命名为 `navToAllOrders`：
- 模板中 `@click="navToOnsiteOrder"` → `@click="navToAllOrders"`
- 函数定义 `const navToOnsiteOrder` → `const navToAllOrders`

建议重命名，保持语义清晰。

---

## Task 7: 现场订单详情页改造——删除修改车费入口

**Files:**
- Modify: `subpkg/onsite/detail.vue`

**Interfaces:**
- Consumes: `getOnsiteOrderDetail(id)`, `cancelOnsiteOrder(orderId)`, `startOnsiteService(orderId)`, `finishOnsiteService(data)` from `@/api/billiard/onsiteOrder`
- Removes: `updateReturnTravel` import 及相关调用

**Steps:**

- [ ] **Step 1: 删除 updateReturnTravel 的 import**

从 import 语句中删除 `updateReturnTravel`：
```js
import {
  getOnsiteOrderDetail,
  cancelOnsiteOrder,
  startOnsiteService,
  finishOnsiteService
} from '@/api/billiard/onsiteOrder'
```

- [ ] **Step 2: 删除待开始状态下的返程车费修改按钮**

修改待开始 section-card 中的返程车费项（约第 36-41 行）。将：
```html
<view class="info-item">
  <text class="info-label">返程车费</text>
  <view class="info-value-row">
    <text class="info-value">¥{{ formatFenToYuan(orderDetail.returnTravelAmount) }}</text>
    <text class="edit-link" @click="showReturnTravelPopup = true">修改</text>
  </view>
</view>
```
改为：
```html
<view class="info-item">
  <text class="info-label">返程车费</text>
  <view class="info-value-row">
    <text class="info-value">¥0.00</text>
    <text class="travel-tip">待结束时确认</text>
  </view>
</view>
```

- [ ] **Step 3: 删除修改返程车费弹窗模板**

删除模板底部的 "修改返程车费弹窗" 块（整个 `.popup-mask`，约第 162-180 行）。

- [ ] **Step 4: 删除相关状态变量和函数**

删除以下变量：
- `showReturnTravelPopup = ref(false)`
- `editTravelYuan = ref('0')`
- `travelUpdating = ref(false)`

删除 `handleUpdateTravel` 函数（整个函数，约 482-507 行）。

- [ ] **Step 5: 新增 .travel-tip 样式**

在 style 中新增：
```scss
.travel-tip {
  font-size: 22rpx;
  color: #9ca3af;
  margin-left: 8rpx;
}
```

可以删除不再使用的 `.edit-link` 样式（可选，留着也不影响）。

---

## Task 8: 现场订单详情页改造——结束服务时车费输入（底部弹出层）

**Files:**
- Modify: `subpkg/onsite/detail.vue`

**Interfaces:**
- Consumes: `finishOnsiteService({ orderId, returnTravelAmount })` from `@/api/billiard/onsiteOrder`
- Consumes: `getOnsiteOrderDetail(id)` — 用于失败后确认状态
- Produces: 底部车费输入弹出层，结束服务时弹出，校验后提交

**Steps:**

- [ ] **Step 1: 新增底部弹出层状态变量**

在 script 中新增：
```js
// 结束服务车费输入弹窗
const showFinishTravelPopup = ref(false)
const finishTravelYuan = ref('0')
const finishSubmitting = ref(false)
```

- [ ] **Step 2: 修改 handleFinishService 函数**

将原来直接调用 confirm + finish 的逻辑，改为先弹出车费输入面板：
```js
// 结束服务
const handleFinishService = () => {
  if (operating.value) return
  // 重置车费输入
  finishTravelYuan.value = '0'
  showFinishTravelPopup.value = true
}
```

- [ ] **Step 3: 新增确认结束函数（带车费校验和提交）**

```js
// 确认结束服务（提交车费）
const confirmFinishService = async () => {
  let val = parseFloat(finishTravelYuan.value)
  if (isNaN(val) || val < 0) {
    uni.showToast({ title: '请输入有效的返程车费', icon: 'none' })
    return
  }
  if (val > 50) {
    uni.showToast({ title: '返程车费不能超过 50 元', icon: 'none' })
    return
  }

  const returnTravelAmount = Math.round(val * 100)
  if (returnTravelAmount < 0 || returnTravelAmount > 5000) {
    uni.showToast({ title: '车费范围 0～50 元', icon: 'none' })
    return
  }

  finishSubmitting.value = true
  try {
    const res = await finishOnsiteService({
      orderId: orderId.value,
      returnTravelAmount
    })
    if (res.code === 0 || res.code === 200) {
      uni.showToast({ title: '服务已结束', icon: 'success' })
      showFinishTravelPopup.value = false
      // 以服务端返回的金额为准刷新
      fetchDetail()
    }
  } catch (e) {
    console.error('结束服务失败', e)
    // 失败后先查询订单详情确认状态
    try {
      await fetchDetail()
      // 如果订单已经是终态（待付款/已完成），说明首次请求已成功
      if ([45, 50, 60].includes(orderDetail.value.status)) {
        uni.showToast({ title: '服务已结束', icon: 'success' })
        showFinishTravelPopup.value = false
      }
    } catch (e2) {
      console.error('查询订单状态失败', e2)
    }
  } finally {
    finishSubmitting.value = false
  }
}
```

- [ ] **Step 4: 新增车费输入失焦校验函数**

```js
const onFinishTravelBlur = () => {
  let val = parseFloat(finishTravelYuan.value)
  if (isNaN(val) || val < 0) val = 0
  if (val > 50) val = 50
  finishTravelYuan.value = val.toFixed(2)
}
```

- [ ] **Step 5: 新增底部弹出层模板**

在模板底部（`</view>` 闭合标签之前）新增底部弹出层：
```html
    <!-- 结束服务车费确认弹窗（底部弹出） -->
    <view v-if="showFinishTravelPopup" class="bottom-popup-mask" @click="showFinishTravelPopup = false">
      <view class="bottom-popup-content" @click.stop>
        <view class="bottom-popup-header">
          <view class="bottom-popup-title">确认返程车费</view>
          <text class="bottom-popup-close" @click="showFinishTravelPopup = false">
            <uni-icons type="close" size="20" color="#999"></uni-icons>
          </text>
        </view>
        <view class="bottom-popup-desc">请输入实际返程车费（0～50元）</view>
        <view class="travel-input-box">
          <text class="travel-input-symbol">¥</text>
          <input
            class="travel-input"
            type="digit"
            v-model="finishTravelYuan"
            placeholder="0.00"
            @blur="onFinishTravelBlur"
          />
          <text class="travel-input-unit">元</text>
        </view>
        <view class="travel-input-tip">
          <uni-icons type="info" size="14" color="#9ca3af"></uni-icons>
          <text>允许输入 0 元，按实际情况填写</text>
        </view>
        <button class="confirm-finish-btn" :loading="finishSubmitting" @click="confirmFinishService">
          确认结束服务
        </button>
      </view>
    </view>
```

- [ ] **Step 6: 新增底部弹出层样式**

在 style 中新增：
```scss
/* 底部弹出层 */
.bottom-popup-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}

.bottom-popup-content {
  width: 100%;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 32rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.bottom-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.bottom-popup-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #333;
}

.bottom-popup-close {
  padding: 8rpx;
}

.bottom-popup-desc {
  font-size: 26rpx;
  color: #6b7280;
  margin-bottom: 32rpx;
}

.travel-input-box {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 12rpx;
  padding: 36rpx 32rpx;
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 100%);
  border-radius: 20rpx;
  border: 2rpx solid #2f6bee22;
  margin-bottom: 16rpx;
}

.travel-input-symbol {
  font-size: 36rpx;
  font-weight: 600;
  color: #ef4444;
}

.travel-input {
  flex: 1;
  text-align: center;
  font-size: 56rpx;
  font-weight: bold;
  color: #ef4444;
  line-height: 1;
}

.travel-input-unit {
  font-size: 28rpx;
  color: #666;
}

.travel-input-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #9ca3af;
  margin-bottom: 40rpx;
}

.confirm-finish-btn {
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  border-radius: 20rpx;
  border: none;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.3);
}
```

- [ ] **Step 7: 进行中状态下返程车费展示调整**

进行中的 section-card 里也有返程车费显示（第 66-67 行）。进行中的订单因为还没结束，车费也是 0，也应该显示"待结束确认"的提示。改为：
```html
<view class="info-item">
  <text class="info-label">返程车费</text>
  <view class="info-value-row">
    <text class="info-value">¥{{ formatFenToYuan(orderDetail.returnTravelAmount) }}</text>
    <text class="travel-tip">待结束确认</text>
  </view>
</view>
```

---

## Task 9: 删除废弃文件

**Files:**
- Delete: `subpkg/onsite/order-list.vue`
- Delete: `subpkg/onsite/create.vue`

**Steps:**

- [ ] **Step 1: 删除 subpkg/onsite/order-list.vue**

该页面已废弃，统一列表在 `pages/order/index.vue`。

- [ ] **Step 2: 删除 subpkg/onsite/create.vue**

该页面已迁移至 `pages/onsite/create.vue`。

---

## Task 10: 整体验证

**Files:** 全项目

**Steps:**

- [ ] **Step 1: 检查 pages.json 完整性**

确认所有页面路径存在，tabbar 配置正确，分包配置正确。重点检查：
- tabbar 的订单页路径是 `pages/onsite/create`
- 主包有 `pages/onsite/create` 页面配置
- 分包 `subpkg/onsite` 只剩 `detail` 和 `qr-pay`
- preloadRule 指向正确

- [ ] **Step 2: 检查所有 import 路径**

确认改动的文件中所有 import 路径正确：
- `pages/onsite/create.vue` 中 `@/api/billiard/coach`、`@/api/billiard/onsiteOrder`、`@/utils/onsiteOrder`
- `pages/order/index.vue` 中 `@/utils/onsiteOrder`
- `subpkg/onsite/detail.vue` 中移除了 `updateReturnTravel`

- [ ] **Step 3: 检查关键功能点清单**

对照需求逐条确认：
1. ✅ 创建页面底部有计费规则提示，随服务类型变化
2. ✅ Tabbar 订单 → 现场开单创建页（pages/onsite/create）
3. ✅ 个人中心"全部订单" → 订单列表页（switchTab）
4. ✅ 创建订单不输入车费
5. ✅ 结束服务时底部弹出层输入车费（0-50元）
6. ✅ 结束接口传 returnTravelAmount（分）
7. ✅ 订单列表融合，type 字段区分普通/现场
8. ✅ 订单卡片显示类型标签
9. ✅ 点击按 type 跳转不同详情页
10. ✅ 10 个状态 tab
11. ✅ 删除 updateReturnTravel 相关代码
12. ✅ 失败重试以服务端返回值为准

- [ ] **Step 4: 不提交 git**

确认没有执行任何 git commit/push 操作，所有改动保留在工作区供用户检查。