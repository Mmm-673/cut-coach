# 助教端押金模块实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为助教端新增押金模块——押金概览页、押金流水页、钱包页入口、上线押金预检拦截，对接已完成的后端押金接口。

**Architecture:** 展示逻辑全部收敛到 `utils/deposit.js` 纯函数（金额换算、类型标签、预检判断），页面薄渲染；API 独立模块 `api/billiard/deposit.js`；上线拦截采用「预检 + errorCode 文案兜底」双层策略，不改 `utils/request.js`。

**Tech Stack:** UniApp + Vue 3 `<script setup>` + SCSS + vitest（globals，jsdom）

**Spec:** `docs/superpowers/specs/2026-10-15-deposit-module-design.md`

## Global Constraints

- **禁止执行任何 git commit / push**：全部改动保留在工作区，由用户检查后自行提交（用户 2026-10-15 明确要求）
- 金额单位为「分」，展示层除以 100 转元；空金额/空时间显示「—」，不默认 0
- ID 字段（orderId/caseId/reversalOf）按字符串透传进 URL，不得用 `Number()`/`parseInt()` 包装（既有订单详情页内部的 `parseInt` 为既有行为，不在本次范围）
- 不修改 `utils/request.js`；业务码 `101000310`/`101000314` 的提示走 `utils/errorCode.js` 现有映射机制
- 客服电话统一取 `config.appInfo.customerServicePhone`（已存在，值 `15900560488`），不新增硬编码
- 缩进风格：`pages/work/index.vue` 用 **Tab** 缩进；`subpkg/` 下页面用 **2 空格**缩进——编辑时严格跟随所在文件
- 新建文件保持单一职责、<400 行
- 测试命令：`npm test`（vitest run），测试文件放 `tests/`，命名 `feature-*.test.js`

---

### Task 1: utils/deposit.js 纯函数（TDD）

**Files:**
- Create: `utils/deposit.js`
- Test: `tests/feature-deposit-utils.test.js`

**Interfaces:**
- Consumes: 无（纯函数，无依赖）
- Produces（后续任务依赖，签名精确如下）:
  - `formatDepositAmount(fen: number|null|undefined): string` — 分转元两位小数；null/undefined/NaN 返回 `'—'`
  - `getBizTypeText(bizType: string|undefined): string` — `PAYMENT`→`'押金缴纳'`、`PENALTY`→`'押金处罚'`、其他→`'资金变动'`
  - `formatSignedAmount(fen: number|null|undefined): { text: string, isIncome: boolean }` — 带符号金额；正/0 为 `+` 且 `isIncome: true`，负为 `-` 且 `isIncome: false`，空值 `text: '—'`
  - `checkDepositBeforeOnline(overview: { enabled?: boolean, balance?: number|null, requiredAmount?: number|null, onlineShortfall?: number|null }|null): { allowed: boolean, shortfall: number|null }` — 预检判断

- [ ] **Step 1: 写失败测试**

创建 `tests/feature-deposit-utils.test.js`：

```js
/**
 * 押金模块纯函数单元测试
 * 覆盖：金额分转元、流水类型标签、带符号金额、上线预检判断
 */
import { describe, it, expect } from 'vitest'
import {
  formatDepositAmount,
  getBizTypeText,
  formatSignedAmount,
  checkDepositBeforeOnline
} from '@/utils/deposit'

describe('formatDepositAmount 金额分转元', () => {
  it('正常分转元', () => {
    expect(formatDepositAmount(30000)).toBe('300.00')
  })

  it('0 分显示 0.00', () => {
    expect(formatDepositAmount(0)).toBe('0.00')
  })

  it('null 显示 —（不默认 0）', () => {
    expect(formatDepositAmount(null)).toBe('—')
  })

  it('undefined 显示 —', () => {
    expect(formatDepositAmount(undefined)).toBe('—')
  })

  it('非数字显示 —', () => {
    expect(formatDepositAmount('abc')).toBe('—')
  })

  it('负数金额转元', () => {
    expect(formatDepositAmount(-500)).toBe('-5.00')
  })
})

describe('getBizTypeText 流水类型标签', () => {
  it('PAYMENT 显示押金缴纳', () => {
    expect(getBizTypeText('PAYMENT')).toBe('押金缴纳')
  })

  it('PENALTY 显示押金处罚', () => {
    expect(getBizTypeText('PENALTY')).toBe('押金处罚')
  })

  it('未知类型显示通用标签', () => {
    expect(getBizTypeText('SOMETHING_NEW')).toBe('资金变动')
    expect(getBizTypeText(undefined)).toBe('资金变动')
  })
})

describe('formatSignedAmount 带符号金额', () => {
  it('正数带加号且为收入', () => {
    expect(formatSignedAmount(30000)).toEqual({ text: '+300.00', isIncome: true })
  })

  it('负数带减号且为支出', () => {
    expect(formatSignedAmount(-500)).toEqual({ text: '-5.00', isIncome: false })
  })

  it('0 视为收入', () => {
    expect(formatSignedAmount(0)).toEqual({ text: '+0.00', isIncome: true })
  })

  it('空值显示 —', () => {
    expect(formatSignedAmount(null)).toEqual({ text: '—', isIncome: true })
  })
})

describe('checkDepositBeforeOnline 上线预检', () => {
  it('未配置押金（enabled=false）放行', () => {
    expect(checkDepositBeforeOnline({ enabled: false, balance: 0 }))
      .toEqual({ allowed: true, shortfall: null })
  })

  it('overview 为空放行（预检失败不阻塞上线）', () => {
    expect(checkDepositBeforeOnline(null)).toEqual({ allowed: true, shortfall: null })
  })

  it('已配置且余额等于门槛放行', () => {
    expect(checkDepositBeforeOnline({ enabled: true, balance: 10000, requiredAmount: 10000 }))
      .toEqual({ allowed: true, shortfall: null })
  })

  it('已配置且余额高于门槛放行', () => {
    expect(checkDepositBeforeOnline({ enabled: true, balance: 30000, requiredAmount: 10000 }))
      .toEqual({ allowed: true, shortfall: null })
  })

  it('已配置且余额低于门槛拦截', () => {
    const result = checkDepositBeforeOnline({
      enabled: true, balance: 5000, requiredAmount: 10000, onlineShortfall: 5000
    })
    expect(result.allowed).toBe(false)
    expect(result.shortfall).toBe(5000)
  })

  it('拦截时优先使用后端 onlineShortfall', () => {
    const result = checkDepositBeforeOnline({
      enabled: true, balance: 5000, requiredAmount: 10000, onlineShortfall: 7000
    })
    expect(result.shortfall).toBe(7000)
  })

  it('无 onlineShortfall 时按门槛减余额计算', () => {
    const result = checkDepositBeforeOnline({ enabled: true, balance: 5000, requiredAmount: 10000 })
    expect(result.shortfall).toBe(5000)
  })

  it('balance 为 null 时不拦截（数据不完整，交给后端判定）', () => {
    expect(checkDepositBeforeOnline({ enabled: true, balance: null, requiredAmount: 10000 }))
      .toEqual({ allowed: true, shortfall: null })
  })

  it('requiredAmount 为 null 时不拦截', () => {
    expect(checkDepositBeforeOnline({ enabled: true, balance: 0, requiredAmount: null }))
      .toEqual({ allowed: true, shortfall: null })
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- feature-deposit-utils`
Expected: FAIL，报错 `Failed to resolve import "@/utils/deposit"`（模块尚不存在）

- [ ] **Step 3: 实现 utils/deposit.js**

创建 `utils/deposit.js`：

```js
/**
 * 押金模块纯函数：金额展示、流水类型标签、上线预检判断
 * 金额契约：服务端为整数「分」，展示层转元；空值显示「—」不默认 0
 */

const YUAN_PER_FEN = 100
const EMPTY_AMOUNT_TEXT = '—'

/**
 * 金额分转元展示；空值显示「—」
 * @param {number|null|undefined} fen 金额（分）
 * @returns {string}
 */
export function formatDepositAmount(fen) {
  if (fen === null || fen === undefined || isNaN(Number(fen))) return EMPTY_AMOUNT_TEXT
  return (Number(fen) / YUAN_PER_FEN).toFixed(2)
}

const BIZ_TYPE_TEXT_MAP = {
  PAYMENT: '押金缴纳',
  PENALTY: '押金处罚'
}

/**
 * 流水类型标签；未知类型用通用标签（后端可能新增枚举）
 * @param {string|undefined} bizType
 * @returns {string}
 */
export function getBizTypeText(bizType) {
  return BIZ_TYPE_TEXT_MAP[bizType] || '资金变动'
}

/**
 * 带符号流水金额：正/0 为收入（+），负为支出（-）
 * @param {number|null|undefined} fen 带符号金额（分）
 * @returns {{ text: string, isIncome: boolean }}
 */
export function formatSignedAmount(fen) {
  if (fen === null || fen === undefined || isNaN(Number(fen))) {
    return { text: EMPTY_AMOUNT_TEXT, isIncome: true }
  }
  const value = Number(fen)
  const sign = value < 0 ? '-' : '+'
  return { text: `${sign}${formatDepositAmount(Math.abs(value))}`, isIncome: value >= 0 }
}

/**
 * 上线预检：押金已配置且余额低于门槛时拦截。
 * 预检数据缺失/不完整时放行——最终以后端 POST work-status 结果为准。
 * @param {{ enabled?: boolean, balance?: number|null, requiredAmount?: number|null, onlineShortfall?: number|null }|null} overview
 * @returns {{ allowed: boolean, shortfall: number|null }}
 */
export function checkDepositBeforeOnline(overview) {
  if (!overview || !overview.enabled) return { allowed: true, shortfall: null }
  const { balance, requiredAmount, onlineShortfall } = overview
  if (balance === null || balance === undefined || requiredAmount === null || requiredAmount === undefined) {
    return { allowed: true, shortfall: null }
  }
  if (Number(balance) >= Number(requiredAmount)) return { allowed: true, shortfall: null }
  const shortfall = onlineShortfall !== null && onlineShortfall !== undefined
    ? Number(onlineShortfall)
    : Number(requiredAmount) - Number(balance)
  return { allowed: false, shortfall }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- feature-deposit-utils`
Expected: PASS，全部用例通过

---

### Task 2: API 模块 + 业务码文案

**Files:**
- Create: `api/billiard/deposit.js`
- Modify: `utils/errorCode.js`

**Interfaces:**
- Consumes: `@/utils/request` 默认导出（既有）
- Produces:
  - `getDepositOverview(): Promise<{ code, data: { coachId, enabled, requiredAmount, balance, onlineShortfall, reviewShortfall, ... } }>`
  - `getDepositFlowPage(params: { pageNo: number, pageSize: number }): Promise<{ code, data: { list: Array, total: number } }>`

- [ ] **Step 1: 创建 api/billiard/deposit.js**

```js
import request from '@/utils/request'

// 查询当前助教押金概览（门槛/余额/双缺口），后端绑定本人，无需传 coachId
export function getDepositOverview() {
  return request({
    url: '/coach-api/billiard/deposit/get',
    method: 'get'
  })
}

// 押金流水分页，最新在前
export function getDepositFlowPage(params) {
  return request({
    url: '/coach-api/billiard/deposit/flow/page',
    method: 'get',
    params
  })
}
```

- [ ] **Step 2: utils/errorCode.js 增加业务码文案**

整个文件修改为（原 4 个 key 保留，新增 2 个业务码）：

```js
export default {
  '401': '认证失败，无法访问系统资源',
  '403': '当前操作没有权限',
  '404': '访问资源不存在',
  '101000310': '押金余额不足，请联系客服补齐后再上线',
  '101000314': '押金功能暂未开放，请联系客服',
  'default': '系统未知错误，请反馈给管理员'
}
```

说明：`utils/request.js:139` 对非 0/200/401/500 的业务码 `reject(errorCode[code] || res.data.msg)`——增加这两个 key 后，押金不足/功能未启用的后端拒绝会自动带上明确中文文案，业务层无需解析错误码。

- [ ] **Step 3: 全量测试回归（确认无破坏）**

Run: `npm test`
Expected: PASS（含 Task 1 的用例）

---

### Task 3: 押金概览页 + 页面注册

**Files:**
- Create: `subpkg/mine/wallet/deposit/index.vue`
- Modify: `pages.json`（subpkg/mine 分包 pages 数组）
- Test: `tests/feature-deposit-pages.test.js`

**Interfaces:**
- Consumes: Task 1 的 `formatDepositAmount`/`checkDepositBeforeOnline`；Task 2 的 `getDepositOverview`；`config.appInfo.customerServicePhone`（已存在）；`makePhoneCall(phoneNumber)`（`@/utils/platform`，既有）
- Produces: 路由 `/subpkg/mine/wallet/deposit/index`（Task 5 钱包入口跳转目标）

- [ ] **Step 1: 创建 subpkg/mine/wallet/deposit/index.vue**

```vue
<template>
  <view class="deposit-page">
    <!-- 加载中 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 加载失败 -->
    <view class="error-state" v-else-if="loadFailed">
      <uni-icons type="info" size="48" :color="textTertiaryColor" />
      <text class="error-text">{{ loadErrorMsg }}</text>
      <button class="retry-btn" @click="fetchOverview">重试</button>
    </view>

    <template v-else-if="overview">
      <!-- 余额卡片 -->
      <view class="balance-card">
        <view class="card-label">押金余额（元）</view>
        <view class="balance-amount">¥{{ formatDepositAmount(overview.balance) }}</view>
        <view class="required-info">
          <text class="required-label">上线门槛：</text>
          <text class="required-value">¥{{ formatDepositAmount(overview.requiredAmount) }}</text>
        </view>
      </view>

      <!-- 状态区 -->
      <view class="status-card">
        <!-- 未配置押金 -->
        <view class="status-row" v-if="!overview.enabled">
          <uni-icons type="info" size="20" :color="textTertiaryColor" />
          <text class="status-text">暂未设置押金要求</text>
        </view>

        <template v-else>
          <!-- 已满足门槛 -->
          <view class="status-row" v-if="depositCheck.allowed">
            <uni-icons type="checkmarkempty" size="20" color="#10b981" />
            <text class="status-text ok-text">已满足上线门槛</text>
          </view>

          <!-- 上线补缴缺口 -->
          <view class="shortfall-box" v-else>
            <view class="shortfall-label">上线补缴缺口</view>
            <view class="shortfall-amount">¥{{ formatDepositAmount(depositCheck.shortfall) }}</view>
            <button class="contact-btn" @click="contactService">联系客服补齐</button>
          </view>

          <!-- 审核扣款缺口：独立展示，不与上线缺口相加 -->
          <view class="review-shortfall" v-if="hasReviewShortfall">
            <text class="review-label">待审核案件最大拟扣缺口：</text>
            <text class="review-value">¥{{ formatDepositAmount(overview.reviewShortfall) }}</text>
          </view>
        </template>
      </view>

      <!-- 底部说明 -->
      <view class="note-card">
        <text class="note-text">押金非收益余额，不能用于消费抵扣或提现</text>
      </view>

      <!-- 流水入口 -->
      <button class="flow-entry-btn" @click="goFlow">查看押金流水</button>
    </template>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getDepositOverview } from '@/api/billiard/deposit'
import { formatDepositAmount, checkDepositBeforeOnline } from '@/utils/deposit'
import { makePhoneCall } from '@/utils/platform'
import config from '@/config'
import { usePageTheme, useThemeColor } from '@/utils/theme'

// 页面主题初始化
usePageTheme()

const textTertiaryColor = useThemeColor('textTertiary')

const overview = ref(null)
const loading = ref(false)
const loadFailed = ref(false)
const loadErrorMsg = ref('')

// 预检判断复用纯函数（未配置/满足门槛 → allowed）
const depositCheck = computed(() => checkDepositBeforeOnline(overview.value))

// 审核扣款缺口：仅在有值且大于 0 时展示
const hasReviewShortfall = computed(() => {
  if (!overview.value || overview.value.reviewShortfall === null || overview.value.reviewShortfall === undefined) {
    return false
  }
  return Number(overview.value.reviewShortfall) > 0
})

const fetchOverview = async () => {
  loading.value = true
  loadFailed.value = false
  try {
    const res = await getDepositOverview()
    overview.value = (res && res.data) || null
    if (!overview.value) {
      loadFailed.value = true
      loadErrorMsg.value = '未获取到押金信息'
    }
  } catch (err) {
    // 101000314 等业务拒绝文案已由 errorCode.js 统一映射
    loadFailed.value = true
    loadErrorMsg.value = typeof err === 'string' && err ? err : '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 联系客服补齐押金（后台录入，客户端只引导致电）
const contactService = () => {
  uni.showModal({
    title: '联系客服补齐',
    content: `请致电客服 ${config.appInfo.customerServicePhone}（服务时间 ${config.appInfo.customerServiceHours}）办理押金补缴，到账后即可重新上线`,
    confirmText: '拨打电话',
    success: (res) => {
      if (res.confirm) {
        makePhoneCall(config.appInfo.customerServicePhone)
      }
    }
  })
}

const goFlow = () => {
  uni.navigateTo({ url: '/subpkg/mine/wallet/deposit-flow/index' })
}

onShow(() => {
  fetchOverview()
})

onMounted(() => {
  fetchOverview()
})
</script>

<style lang="scss" scoped>
.deposit-page {
  min-height: 100vh;
  background: var(--bg-page-gradient, linear-gradient(180deg, var(--bg-page, #f8fbff) 0%, #ffffff 100%));
  padding: 30rpx;
}

/* 余额卡片 */
.balance-card {
  background: var(--gradient-primary, linear-gradient(135deg, var(--color-primary, #2f6bee) 0%, var(--color-primary-dark, #1a50d9) 100%));
  border-radius: 32rpx;
  padding: 50rpx 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(47, 107, 238, 0.25);
}

.card-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 16rpx;
}

.balance-amount {
  font-size: 72rpx;
  font-weight: bold;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 20rpx;
}

.required-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
}

.required-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.required-value {
  font-size: 28rpx;
  color: #fcd34d;
  font-weight: 500;
}

/* 状态卡片 */
.status-card {
  background: var(--bg-card, #fff);
  border-radius: 24rpx;
  padding: 36rpx 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 12rpx var(--shadow-card, rgba(0, 0, 0, 0.05));
}

.status-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.status-text {
  font-size: 30rpx;
  color: var(--text-secondary, #6b7280);
}

.ok-text {
  color: var(--color-success, #10b981);
  font-weight: 500;
}

/* 缺口区块 */
.shortfall-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 0;
}

.shortfall-label {
  font-size: 28rpx;
  color: var(--text-secondary, #6b7280);
}

.shortfall-amount {
  font-size: 64rpx;
  font-weight: bold;
  color: var(--color-danger, #ef4444);
}

.contact-btn {
  margin-top: 12rpx;
  background: var(--color-danger, #ef4444);
  color: #fff;
  font-size: 30rpx;
  border-radius: 44rpx;
  padding: 0 60rpx;
  line-height: 80rpx;

  &::after {
    border: none;
  }
}

/* 审核扣款缺口 */
.review-shortfall {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid var(--border-light, #f3f4f6);
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.review-label {
  font-size: 26rpx;
  color: var(--text-tertiary, #9ca3af);
}

.review-value {
  font-size: 26rpx;
  color: var(--color-warning, #f59e0b);
  font-weight: 500;
}

/* 底部说明 */
.note-card {
  background: var(--bg-card, #fff);
  border-radius: 24rpx;
  padding: 28rpx 30rpx;
  margin-bottom: 30rpx;
}

.note-text {
  font-size: 26rpx;
  color: var(--text-tertiary, #9ca3af);
}

/* 流水入口 */
.flow-entry-btn {
  background: var(--color-primary, #2f6bee);
  color: #fff;
  font-size: 30rpx;
  border-radius: 44rpx;
  line-height: 88rpx;

  &::after {
    border: none;
  }
}

/* 加载/错误状态 */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
  font-size: 28rpx;
  color: var(--text-tertiary, #9ca3af);
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  gap: 24rpx;
}

.error-text {
  font-size: 28rpx;
  color: var(--text-tertiary, #9ca3af);
  text-align: center;
}

.retry-btn {
  background: var(--color-primary, #2f6bee);
  color: #fff;
  font-size: 28rpx;
  border-radius: 40rpx;
  padding: 0 60rpx;
  line-height: 76rpx;

  &::after {
    border: none;
  }
}
</style>
```

- [ ] **Step 2: pages.json 注册页面**

在 `pages.json` 的 `subpkg/mine` 分包（`"root": "subpkg/mine"`，约 124 行起）的 `pages` 数组中，`wallet/withdraw-record/index` 条目之后新增：

```json
        {
          "path": "wallet/deposit/index",
          "style": {
            "navigationBarTitleText": "押金",
            "navigationBarBackgroundColor": "#fff",
            "navigationBarTextStyle": "black",
            "enablePullDownRefresh": false
          }
        },
```

- [ ] **Step 3: 写页面注册静态测试**

创建 `tests/feature-deposit-pages.test.js`（用字符串断言，避免 pages.json 潜在注释导致 JSON.parse 失败）：

```js
/**
 * 押金模块页面注册检查
 * - subpkg/mine 分包应注册押金相关页面
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('押金模块页面注册', () => {
  const pagesJsonRaw = fs.readFileSync(path.resolve(__dirname, '../pages.json'), 'utf-8')

  it('应注册押金概览页 wallet/deposit/index', () => {
    expect(pagesJsonRaw).toContain('"wallet/deposit/index"')
  })
})
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test`
Expected: PASS（全部用例，含新的页面注册检查）

---

### Task 4: 押金流水页 + 页面注册

**Files:**
- Create: `subpkg/mine/wallet/deposit-flow/index.vue`
- Modify: `pages.json`（同 Task 3 位置）
- Modify: `tests/feature-deposit-pages.test.js`

**Interfaces:**
- Consumes: Task 1 的 `formatDepositAmount`/`getBizTypeText`/`formatSignedAmount`；Task 2 的 `getDepositFlowPage`；路由 `/subpkg/order/detail?orderId=<id>`（既有订单详情页）
- Produces: 路由 `/subpkg/mine/wallet/deposit-flow/index`（Task 3 概览页「查看押金流水」跳转目标）

- [ ] **Step 1: 创建 subpkg/mine/wallet/deposit-flow/index.vue**

```vue
<template>
  <view class="deposit-flow-page">
    <scroll-view
        scroll-y
        class="flow-list"
        :refresher-enabled="true"
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="handleLoadMore"
    >
      <view v-for="item in recordList" :key="item.id" class="flow-item">
        <view class="item-left">
          <view class="item-top-row">
            <view class="biz-tag" :class="bizTagClass(item)">
              {{ getBizTypeText(item.bizType) }}
            </view>
            <view class="item-time">{{ formatTime(item.createTime) }}</view>
          </view>
          <view class="item-reason" v-if="item.reason">{{ item.reason }}</view>
          <view class="item-balance">
            余额 ¥{{ formatDepositAmount(item.balanceAfter) }}
          </view>
          <!-- 关联订单：可跳转订单详情 -->
          <view
              class="item-ref link"
              v-if="item.orderId"
              @click="goOrderDetail(item)"
          >
            关联订单：{{ item.orderId }} >
          </view>
          <!-- 关联案件：本期仅展示，不跳转（助教案件详情接口未补齐） -->
          <view class="item-ref" v-if="item.caseId">关联案件：{{ item.caseId }}</view>
          <!-- 冲正关系：仅展示 -->
          <view class="item-ref" v-if="item.reversalOf">冲正流水：{{ item.reversalOf }}</view>
        </view>
        <view class="item-right">
          <view class="flow-amount" :class="signedAmount(item).isIncome ? 'income' : 'expense'">
            {{ signedAmount(item).text }}
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && recordList.length === 0" class="empty-tip">
        <uni-icons type="info" size="48" :color="textTertiaryColor" />
        <text>暂无押金流水</text>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-tip">加载中...</view>
      <view v-if="!hasMore && recordList.length > 0" class="no-more-tip">已经到底啦~</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getDepositFlowPage } from '@/api/billiard/deposit'
import { formatDepositAmount, getBizTypeText, formatSignedAmount } from '@/utils/deposit'
import { usePageTheme, useThemeColor } from '@/utils/theme'

// 页面主题初始化
usePageTheme()

const textTertiaryColor = useThemeColor('textTertiary')

const PAGE_SIZE = 20

const recordList = ref([])
const pageNo = ref(1)
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)

const signedAmount = (item) => formatSignedAmount(item.deltaAmount)

// 标签样式类按业务类型区分：处罚红色，其余（缴纳/未知类型）蓝色
const bizTagClass = (item) => (item.bizType === 'PENALTY' ? 'tag-penalty' : 'tag-payment')

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const loadFlow = async (reset) => {
  if (loading.value) return
  if (!reset && !hasMore.value) return
  loading.value = true
  if (reset) {
    pageNo.value = 1
    hasMore.value = true
  }
  try {
    const res = await getDepositFlowPage({ pageNo: pageNo.value, pageSize: PAGE_SIZE })
    const list = (res && res.data && res.data.list) || []
    const total = (res && res.data && res.data.total) || 0
    if (reset) {
      recordList.value = list
    } else {
      recordList.value = [...recordList.value, ...list]
    }
    hasMore.value = recordList.value.length < total
    pageNo.value = pageNo.value + 1
  } catch (err) {
    uni.showToast({ title: typeof err === 'string' && err ? err : '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const onRefresh = () => {
  refreshing.value = true
  loadFlow(true)
}

const handleLoadMore = () => {
  loadFlow(false)
}

// 关联订单跳转：orderId 按字符串透传，不做数值转换
const goOrderDetail = (item) => {
  uni.navigateTo({ url: `/subpkg/order/detail?orderId=${item.orderId}` })
}

onMounted(() => {
  loadFlow(true)
})
</script>

<style lang="scss" scoped>
.deposit-flow-page {
  height: 100vh;
  background: var(--bg-page, #f8fbff);
}

.flow-list {
  height: 100%;
  padding: 20rpx 30rpx;
  box-sizing: border-box;
}

.flow-item {
  display: flex;
  justify-content: space-between;
  background: var(--bg-card, #fff);
  border-radius: 24rpx;
  padding: 28rpx 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx var(--shadow-card, rgba(0, 0, 0, 0.05));
}

.item-left {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  flex: 1;
  min-width: 0;
}

.item-top-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.biz-tag {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;

  &.tag-payment {
    color: var(--color-primary, #2f6bee);
    background: rgba(47, 107, 238, 0.08);
  }

  &.tag-penalty {
    color: var(--color-danger, #ef4444);
    background: rgba(239, 68, 68, 0.08);
  }
}

.item-time {
  font-size: 24rpx;
  color: var(--text-tertiary, #9ca3af);
}

.item-reason {
  font-size: 28rpx;
  color: var(--text-primary, #1f2937);
  word-break: break-all;
}

.item-balance {
  font-size: 24rpx;
  color: var(--text-tertiary, #9ca3af);
}

.item-ref {
  font-size: 24rpx;
  color: var(--text-tertiary, #9ca3af);
  word-break: break-all;

  &.link {
    color: var(--color-primary, #2f6bee);
  }
}

.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
  margin-left: 20rpx;
}

.flow-amount {
  font-size: 32rpx;
  font-weight: bold;

  &.income {
    color: var(--color-success, #10b981);
  }

  &.expense {
    color: var(--color-danger, #ef4444);
  }
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 0;
  gap: 20rpx;
  font-size: 28rpx;
  color: var(--text-tertiary, #9ca3af);
}

.loading-tip,
.no-more-tip {
  text-align: center;
  padding: 30rpx 0;
  font-size: 26rpx;
  color: var(--text-tertiary, #9ca3af);
}
</style>
```

- [ ] **Step 2: pages.json 注册页面**

同 Task 3 位置（`subpkg/mine` 分包 pages 数组、`wallet/deposit/index` 条目之后）新增：

```json
        {
          "path": "wallet/deposit-flow/index",
          "style": {
            "navigationBarTitleText": "押金流水",
            "navigationBarBackgroundColor": "#fff",
            "navigationBarTextStyle": "black",
            "enablePullDownRefresh": false
          }
        },
```

- [ ] **Step 3: 扩展页面注册测试**

在 `tests/feature-deposit-pages.test.js` 的 `describe` 块内追加用例：

```js
  it('应注册押金流水页 wallet/deposit-flow/index', () => {
    expect(pagesJsonRaw).toContain('"wallet/deposit-flow/index"')
  })
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test`
Expected: PASS

---

### Task 5: 钱包页押金入口卡片

**Files:**
- Modify: `subpkg/mine/wallet/index.vue`

**Interfaces:**
- Consumes: Task 1 的 `formatDepositAmount`/`checkDepositBeforeOnline`；Task 2 的 `getDepositOverview`
- Produces: 无（叶子改动）

- [ ] **Step 1: 模板——在余额卡片后插入押金入口卡片**

在 `subpkg/mine/wallet/index.vue` 第 11 行 `</view>`（balance-card 闭合标签）之后插入：

```html
    <!-- 押金入口卡片 -->
    <view class="deposit-card" @click="goDeposit">
      <view class="deposit-info">
        <view class="deposit-title">押金</view>
        <view class="deposit-sub" :class="{ 'deposit-warning': depositHasShortfall }">
          {{ depositSummary }}
        </view>
      </view>
      <view class="deposit-right">
        <text class="deposit-amount">¥{{ formatDepositAmountText(depositOverview && depositOverview.balance) }}</text>
        <uni-icons type="right" size="16" color="#c0c4cc"></uni-icons>
      </view>
    </view>
```

- [ ] **Step 2: 脚本——新增押金摘要逻辑（独立请求，静默降级）**

在 `<script setup>` 中 `import { getWalletBalance, getWithdrawalPage } from '@/api/billiard/wallet'` 之后加：

```js
import { getDepositOverview } from '@/api/billiard/deposit'
import { formatDepositAmount, checkDepositBeforeOnline } from '@/utils/deposit'
```

在 `const loading = ref(false)` 之后加：

```js
// 押金摘要：独立于钱包余额请求，失败静默降级（只保留入口，不显示摘要）
const depositOverview = ref(null)

const depositCheckResult = computed(() => checkDepositBeforeOnline(depositOverview.value))

const depositHasShortfall = computed(() => {
  if (!depositOverview.value || !depositOverview.value.enabled) return false
  return !depositCheckResult.value.allowed
})

const depositSummary = computed(() => {
  if (!depositOverview.value || !depositOverview.value.enabled) return '暂未设置押金要求'
  if (depositCheckResult.value.allowed) return '已满足上线门槛'
  return `上线缺口 ¥${formatDepositAmount(depositCheckResult.value.shortfall)}，请联系客服`
})

// 展示层包装：押金未加载到时显示「—」而不是 0.00
const formatDepositAmountText = (fen) => {
  if (depositOverview.value === null) return '—'
  return formatDepositAmount(fen)
}

const fetchDepositSummary = async () => {
  try {
    const res = await getDepositOverview()
    depositOverview.value = (res && res.data) || null
  } catch (err) {
    // 押金概览失败不影响钱包页其余功能（101000314 功能未启用等场景静默降级）
    depositOverview.value = null
  }
}

const goDeposit = () => {
  uni.navigateTo({ url: '/subpkg/mine/wallet/deposit/index' })
}
```

注意：`<script setup>` 现有 import 里**没有** `computed`，把第 77 行改为：

```js
import { ref, computed, onMounted } from 'vue'
```

在 `onShow(() => { fetchWalletData() })` 内追加一行（onShow 与 onMounted 两处都加，与现有 fetchWalletData 保持同节奏）：

```js
  fetchDepositSummary()
```

- [ ] **Step 3: 样式——追加押金卡片样式**

在 `<style>` 内 `.balance-card` 相关样式之后（`.card-label` 前的注释 `/* 快捷操作 */` 之前）插入：

```scss
/* 押金入口卡片 */
.deposit-card {
  background: var(--bg-card, #fff);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 12rpx var(--shadow-card, rgba(0, 0, 0, 0.05));
}

.deposit-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.deposit-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

.deposit-sub {
  font-size: 24rpx;
  color: var(--text-tertiary, #9ca3af);

  &.deposit-warning {
    color: var(--color-danger, #ef4444);
  }
}

.deposit-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.deposit-amount {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--text-primary, #1f2937);
}
```

- [ ] **Step 4: 手动验证 + 全量测试**

Run: `npm test`
Expected: PASS

手动验证（HBuilderX 运行到 H5 或小程序）：钱包页出现押金卡片；点击进入押金概览页。

---

### Task 6: work 页上线押金预检拦截

**Files:**
- Modify: `pages/work/index.vue`（Tab 缩进！）

**Interfaces:**
- Consumes: Task 1 的 `checkDepositBeforeOnline`/`formatDepositAmount`；Task 2 的 `getDepositOverview`；`config.appInfo.customerServicePhone`；既有 `makePhoneCallUtil`（该文件已 `import { openMapNavigation, makePhoneCall as makePhoneCallUtil, calculateDistance } from '@/utils/platform'`）
- Produces: 无（叶子改动）

**设计要点（来自 spec 第 5 节，执行者须知）：**
- 预检在**获取位置授权之前**——业务弹窗先于系统权限弹窗
- 预检是点击上线时实时查询，**无缓存层**，因此 spec 中「强制下线后刷新押金概览缓存」无需额外实现（下次点击预检自然拿到最新值）——不新增代码（YAGNI）
- 兜底：后端 POST 拒绝 `101000310` 时，`utils/request.js` 现有分支经 `errorCode.js`（Task 2 已加文案）reject 文案字符串，`onSwitchChange` 现有 `catch` 的 `proxy.$modal.msgError(err)` 自动展示——**无需新增 catch 逻辑**

- [ ] **Step 1: 新增 import**

在 `import fullscreenHeart from '@/components/fullscreen-heart/fullscreen-heart.vue'` 之前插入两行：

```js
	import { getDepositOverview } from '@/api/billiard/deposit'
	import { checkDepositBeforeOnline, formatDepositAmount } from '@/utils/deposit'
```

在 `import { locationPermissionMessages } from '@/utils/permission-messages'` 之后插入：

```js
	import config from '@/config'
```

- [ ] **Step 2: 新增预检函数**

在 `const onSwitchChange = async (targetStatus) => {`（约 860 行）之前插入（Tab 缩进）：

```js
	// 上线前押金预检：已配置且余额低于门槛时拦截；预检失败不阻塞，最终以后端 POST 结果为准
	const ensureDepositForOnline = async () => {
		try {
			const res = await getDepositOverview()
			const check = checkDepositBeforeOnline(res && res.data)
			if (check.allowed) return true
			uni.showModal({
				title: '押金不足',
				content: `当前押金余额低于上线门槛，补缴 ¥${formatDepositAmount(check.shortfall)} 到账后方可上线接单`,
				confirmText: '联系客服',
				success: (modalRes) => {
					if (modalRes.confirm) {
						makePhoneCallUtil(config.appInfo.customerServicePhone)
					}
				}
			})
			return false
		} catch (err) {
			// 预检查询失败不阻塞上线（101000310 由 errorCode 文案在 POST 被拒时兜底）
			return true
		}
	}

```

- [ ] **Step 3: onSwitchChange 接入预检**

将（约 864 行，Tab 缩进）：

```js
			if (targetStatus) {
				// 上线前必须先获取位置
```

改为：

```js
			if (targetStatus) {
				// 上线前押金预检（已配置且余额不足时拦截，不触发位置授权）
				const depositOk = await ensureDepositForOnline()
				if (!depositOk) {
					switchLoading.value = false
					return
				}

				// 上线前必须先获取位置
```

- [ ] **Step 4: 全量测试回归**

Run: `npm test`
Expected: PASS

手动验证：配置押金门槛的测试账号（余额低于门槛）点击上线 → 弹「押金不足」缺口弹窗，确认可拨打电话，取消后不上线、不弹位置授权；未配置押金账号上线流程不受影响。

---

### Task 7: 客服电话统一 + 验收清单 + 回归

**Files:**
- Modify: `subpkg/mine/about/index.vue:149`
- Modify: `TEST_CHECKLIST.md`

**Interfaces:**
- Consumes: `config.appInfo.customerServicePhone`（about 页已 `import config from '@/config'`，第 99 行）
- Produces: 无

- [ ] **Step 1: about 页客服电话改用 config 常量（DRY）**

将 `subpkg/mine/about/index.vue` 中（约 149 行）这一行：

```js
  const phoneNumber = '15900560488'
```

改为：

```js
  const phoneNumber = config.appInfo.customerServicePhone
```

（只改这一行；config 已在该文件第 99 行 import。）

- [ ] **Step 2: TEST_CHECKLIST.md 追加押金模块验收项**

在文件末尾追加：

```markdown
## 押金模块 (2026-10-15)

### 手动验收项
- [ ] 旧助教未配置押金，上线不被误拦（不弹缺口弹窗）
- [ ] 已配置且余额不足：点击上线弹缺口 + 联系客服按钮，不触发位置授权
- [ ] 上线被后端 101000310 拒绝时提示「押金余额不足，请联系客服补齐后再上线」
- [ ] 押金处罚导致在线转离线：在服订单不中断，仅阻止新接单
- [ ] 审核缺口与上线缺口分别展示、不相加
- [ ] 流水列表分页加载、正负金额颜色区分、orderId 跳转订单详情正确
- [ ] 后台录入补缴到账后刷新概览，需手动再次上线
- [ ] 金额分转元展示、空值显示「—」、未知流水类型显示「资金变动」
- [ ] 钱包页押金卡片：正常显示摘要；押金接口失败时静默降级只留入口

### API 接口清单

### 押金模块 (deposit.js)
1. `GET /coach-api/billiard/deposit/get` - 押金概览（门槛/余额/双缺口）
2. `GET /coach-api/billiard/deposit/flow/page` - 押金流水（分页，最新在前）
```

- [ ] **Step 3: 全量回归**

Run: `npm test`
Expected: PASS，全部测试通过

- [ ] **Step 4: 汇报改动清单（不提交）**

向用户列出全部新增/修改文件清单，**等待用户检查**；用户确认后由用户自行执行 git 提交（或明确授权后代为提交）。

---

## 变更文件总览

| 文件 | 操作 | 所属任务 |
|---|---|---|
| `utils/deposit.js` | 新增 | Task 1 |
| `tests/feature-deposit-utils.test.js` | 新增 | Task 1 |
| `api/billiard/deposit.js` | 新增 | Task 2 |
| `utils/errorCode.js` | 修改（+2 业务码） | Task 2 |
| `subpkg/mine/wallet/deposit/index.vue` | 新增 | Task 3 |
| `pages.json` | 修改（+2 页面注册） | Task 3、4 |
| `tests/feature-deposit-pages.test.js` | 新增 | Task 3、4 |
| `subpkg/mine/wallet/deposit-flow/index.vue` | 新增 | Task 4 |
| `subpkg/mine/wallet/index.vue` | 修改（押金入口卡片） | Task 5 |
| `pages/work/index.vue` | 修改（预检拦截，约 +40 行） | Task 6 |
| `subpkg/mine/about/index.vue` | 修改（电话改用 config，1 行） | Task 7 |
| `TEST_CHECKLIST.md` | 修改（追加验收项） | Task 7 |

## 与 spec 的两处已说明偏差

1. **spec 说 `config.js` 新增 `SERVICE_PHONE` 常量**：实际 `config.appInfo.customerServicePhone` 已存在（值 `15900560488`），直接复用，不新增常量。
2. **spec 说「强制下线后静默刷新押金概览缓存」**：预检为点击时实时查询、无缓存层，无需刷新逻辑（Task 6 设计要点已说明）。
