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
            <button class="pay-btn" @click="openPayPopup">在线缴纳</button>
            <text class="service-link" @click="contactService">联系客服补齐</text>
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

    <!-- 在线缴纳弹层（哑组件，支付编排在概览页） -->
    <pay-popup
      :show="showPayPopup"
      :default-fen="depositCheck.shortfall"
      @close="closePayPopup"
      @confirm="handlePayConfirm"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getDepositOverview, createDepositPayment, submitDepositPayment, getDepositPayment } from '@/api/billiard/deposit'
import { formatDepositAmount, checkDepositBeforeOnline } from '@/utils/deposit'
import { makePhoneCall } from '@/utils/platform'
import { generateUUID } from '@/utils/onsiteOrder'
import config from '@/config'
import { usePageTheme, useThemeColor } from '@/utils/theme'
import PayPopup from './pay-popup.vue'

// 页面主题初始化
usePageTheme()

const textTertiaryColor = useThemeColor('textTertiary')

// 待支付押金支付单本地暂存 key（进程被杀后凭此恢复查单）
const PAYING_ID_STORAGE_KEY = 'Coach-Deposit-Paying-Id'

const overview = ref(null)
const loading = ref(false)
const loadFailed = ref(false)
const loadErrorMsg = ref('')

// 在线缴纳弹层与待支付单幂等记录 { id, amountFen, channelCode }
const showPayPopup = ref(false)
const paying = ref(null)
const paySubmitting = ref(false)

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
    content: `上线补缴缺口 ¥${formatDepositAmount(depositCheck.value.shortfall)}，请致电客服 ${config.appInfo.customerServicePhone}（服务时间 ${config.appInfo.customerServiceHours}）办理押金补缴，到账后即可重新上线`,
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

const openPayPopup = () => {
  showPayPopup.value = true
}

const closePayPopup = () => {
  showPayPopup.value = false
}

// 弹层确认 → 支付编排：create（幂等）→ submit → 按渠道拉起 SDK
const handlePayConfirm = async ({ amountFen, channelCode }) => {
  // #ifndef APP-PLUS
  uni.showToast({ title: '请在 App 中缴纳', icon: 'none' })
  closePayPopup()
  return
  // #endif
  // #ifdef APP-PLUS
  if (paySubmitting.value) return
  paySubmitting.value = true
  // SDK 已实际拉起时释放责任移交 settlePay（支付面板期间确认保持禁用）
  let isSdkInvoked = false
  try {
    let paymentId = null
    // 幂等：金额与渠道都没变则复用原支付单，不重复创建（防重复扣款）
    if (paying.value && paying.value.amountFen === amountFen && paying.value.channelCode === channelCode) {
      paymentId = paying.value.id
    } else {
      const createRes = await createDepositPayment({
        amount: amountFen,
        channelCode,
        requestId: generateUUID()
      })
      paymentId = createRes && createRes.data && createRes.data.depositPaymentId
      if (!paymentId) {
        uni.showToast({ title: '创建支付单失败，请重试', icon: 'none' })
        return
      }
      paying.value = { id: paymentId, amountFen, channelCode }
      uni.setStorageSync(PAYING_ID_STORAGE_KEY, paymentId)
    }
    const submitRes = await submitDepositPayment({ depositPaymentId: paymentId })
    if (submitRes && (submitRes.code === 0 || submitRes.code === 200)) {
      // 渠道用客户端自持入参分支（契约 submit 响应不含 channelCode）
      isSdkInvoked = invokeDepositPay(submitRes.data, paymentId, channelCode)
    } else {
      uni.showToast({ title: '支付拉起失败，请重试', icon: 'none' })
    }
  } catch (err) {
    // 101000311/312/313/314 等业务文案由 request 层 reject 字符串直出，不做字符串匹配
    uni.showToast({ title: typeof err === 'string' && err ? err : '支付拉起失败，请重试', icon: 'none' })
  } finally {
    if (!isSdkInvoked) paySubmitting.value = false
  }
  // #endif
}

// 按渠道拉起支付；渠道取客户端入参而非 submit 响应。
// displayContent 为 SDK 参数，禁止写入日志。实际调起 SDK 返回 true，否则 false。
const invokeDepositPay = (payData, paymentId, channelCode) => {
  const displayContent = payData && payData.displayContent
  if (!displayContent) {
    uni.showToast({ title: '支付拉起失败，请重试', icon: 'none' })
    return false
  }
  // success/fail/complete 一律以查单为准；去重防止 complete 与 success/fail 双触发
  let isSettled = false
  const settlePay = () => {
    if (isSettled) return
    isSettled = true
    paySubmitting.value = false
    confirmPayment(paymentId)
  }
  if (channelCode === 'wx_app') {
    let payParams = null
    try {
      payParams = JSON.parse(displayContent)
    } catch (e) {
      uni.showToast({ title: '支付拉起失败，请重试', icon: 'none' })
      return false
    }
    uni.requestPayment({
      provider: 'wxpay',
      orderInfo: {
        appid: payParams.appid,
        partnerid: payParams.partnerId,
        prepayid: payParams.prepayId,
        package: payParams.packageValue,
        noncestr: payParams.noncestr,
        timestamp: payParams.timestamp,
        sign: payParams.sign
      },
      success: settlePay,
      fail: settlePay,
      complete: settlePay
    })
    return true
  } else if (channelCode === 'alipay_app') {
    uni.requestPayment({
      provider: 'alipay',
      orderInfo: displayContent,
      success: settlePay,
      fail: settlePay,
      complete: settlePay
    })
    return true
  }
  uni.showToast({ title: '暂不支持该支付渠道', icon: 'none' })
  return false
}

// 查单确认入账：无论 SDK 成功/取消/超时都以服务端 CREDITED 为准
const confirmPayment = async (paymentId) => {
  try {
    const res = await getDepositPayment(paymentId)
    const status = res && res.data && res.data.status
    if (status === 'CREDITED') {
      uni.removeStorageSync(PAYING_ID_STORAGE_KEY)
      paying.value = null
      uni.showToast({ title: '缴纳成功', icon: 'success' })
      closePayPopup()
      fetchOverview()
    } else if (status === 'CREATED') {
      // 不误报失败；保留本地支付单 ID 供回前台恢复查单
      uni.showToast({ title: '支付确认中，入账后自动更新', icon: 'none' })
      closePayPopup()
    } else {
      uni.showToast({ title: '查询失败', icon: 'none' })
      closePayPopup()
    }
  } catch (err) {
    uni.showToast({ title: typeof err === 'string' && err ? err : '查询失败', icon: 'none' })
    closePayPopup()
  }
}

// 进程被杀后恢复：凭本地支付单 ID 继续查单，CREDITED 则补刷新；CREATED 静默保留
const resumePayingPayment = async () => {
  try {
    const savedId = uni.getStorageSync(PAYING_ID_STORAGE_KEY)
    if (!savedId) return
    const res = await getDepositPayment(savedId)
    const status = res && res.data && res.data.status
    if (status === 'CREDITED') {
      uni.removeStorageSync(PAYING_ID_STORAGE_KEY)
      paying.value = null
      uni.showToast({ title: '押金缴纳成功', icon: 'success' })
      fetchOverview()
    }
  } catch (err) {
    // 查单失败静默保留本地 ID，下次回前台重试
  }
}

onShow(() => {
  fetchOverview()
  resumePayingPayment()
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

.pay-btn {
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

.service-link {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--text-tertiary, #9ca3af);
  text-decoration: underline;
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
