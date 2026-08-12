<template>
  <view class="qr-pay-page">
    <!-- 支付信息卡 -->
    <view class="pay-info-card">
      <view class="channel-name">
        <image
          class="channel-icon"
          :src="channelCode === 'wx_native' ? '/static/images/pay/wechat.png' : '/static/images/pay/alipay.png'"
          mode="aspectFit"
        ></image>
        <text>{{ channelName }}</text>
      </view>
      <view class="amount-label">应付金额</view>
      <view class="amount-value">¥{{ formatFenToYuan(payAmount) }}</view>
    </view>

    <!-- 二维码区域 -->
    <view class="qr-card">
      <!-- 支付成功 -->
      <view v-if="paymentStatus === 10" class="qr-success">
        <view class="success-icon">
          <uni-icons type="checkmarkempty" size="80" color="#10b981"></uni-icons>
        </view>
        <view class="success-title">支付成功</view>
        <view class="success-desc">{{ settlementText }}</view>
      </view>

      <!-- 二维码过期 -->
      <view v-else-if="isExpired && qrContent" class="qr-expired">
        <view class="expired-icon">
          <uni-icons type="info" size="60" color="#f59e0b"></uni-icons>
        </view>
        <view class="expired-title">二维码已过期</view>
        <view class="expired-desc">请点击下方按钮重新生成</view>
      </view>

      <!-- 二维码组件（常驻，auto=false 避免重绘闪烁） -->
      <view v-else-if="qrContent" class="qr-wrapper">
        <uqrcode
          ref="uqrcodeRef"
          canvas-id="onsite-pay-qr"
          :value="qrContent"
          :size="qrSize"
          type="normal"
          :auto="false"
          :options="qrOptions"
          @complete="onQrComplete"
        ></uqrcode>
      </view>

      <!-- 加载中 -->
      <view v-else class="qr-loading">
        <view class="loading-spinner"></view>
        <text>二维码生成中...</text>
      </view>
    </view>

    <!-- 扫码提示 -->
    <view v-if="qrContent && !isExpired && paymentStatus !== 10" class="scan-tip">
      <uni-icons type="scan" size="20" :color="channelColor"></uni-icons>
      <text>请使用{{ channelName.replace('支付', '') }}扫码支付</text>
    </view>

    <!-- 过期倒计时 -->
    <view v-if="qrContent && !isExpired && paymentStatus !== 10" class="expire-countdown">
      <uni-icons type="clock" size="16" color="#9ca3af"></uni-icons>
      <text>二维码将在 {{ countdownText }} 后过期</text>
    </view>

    <!-- 支付状态 -->
    <view class="status-section">
      <view class="status-item">
        <text class="status-label">支付状态</text>
        <text class="status-value" :style="{ color: paymentStatusColor }">
          {{ paymentStatusText }}
        </text>
      </view>
    </view>

    <!-- 重新生成按钮 -->
    <view class="bottom-bar">
      <button
        class="refresh-btn"
        :class="{ disabled: generating || paymentStatus === 10 }"
        :loading="generating"
        @click="handleRefreshQr"
      >
        {{ paymentStatus === 10 ? '支付已完成' : (isExpired ? '重新生成二维码' : '刷新二维码') }}
      </button>

      <button class="back-btn" @click="handleBack">
        返回订单详情
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted, nextTick } from 'vue'
import { onLoad, onShow, onHide, onPageShow, onPageHide } from '@dcloudio/uni-app'
import { createOnsiteQrCode, getOnsitePaymentStatus } from '@/api/billiard/onsitePayment'
import {
  PAYMENT_STATUS_MAP,
  SETTLEMENT_STATUS_MAP,
  formatFenToYuan,
  getRemainingSeconds,
  formatDuration
} from '@/utils/onsiteOrder'

const uqrcodeRef = ref(null)
const orderId = ref(null)
const channelCode = ref('wx_native')
const payAmount = ref(0)
const qrContent = ref('')
const cashierExpireTime = ref('')
const paymentStatus = ref(0)
const settlementStatus = ref(0)
const generating = ref(false)
const remainingSeconds = ref(0)

// 二维码组件稳定 props（避免每次渲染创建新对象触发 deep watch 重绘）
const qrSize = 200
const qrOptions = { margin: 10 }

let countdownTimer = null
let pollTimer = null
let pollCount = 0
const MAX_POLL = 200

const channelName = computed(() => {
  return channelCode.value === 'wx_native' ? '微信支付' : '支付宝支付'
})

const channelColor = computed(() => {
  return channelCode.value === 'wx_native' ? '#07c160' : '#1677ff'
})

const isExpired = computed(() => {
  return remainingSeconds.value <= 0 && cashierExpireTime.value
})

const countdownText = computed(() => {
  return formatDuration(remainingSeconds.value)
})

const paymentStatusText = computed(() => {
  const ps = paymentStatus.value
  const ss = settlementStatus.value
  if (ps === 0) return '等待支付'
  if (ps === 10) {
    if (ss === 20) return '支付成功'
    if (ss === 10 || ss === 30) return '支付成功，结算处理中'
    return '已支付'
  }
  if (ps === 20) return '支付异常'
  return '未知'
})

const paymentStatusColor = computed(() => {
  return PAYMENT_STATUS_MAP[paymentStatus.value]?.color || '#666'
})

const settlementText = computed(() => {
  const ss = settlementStatus.value
  return SETTLEMENT_STATUS_MAP[ss]?.name || ''
})

// 二维码绘制完成回调
// 注意：组件 auto=false，qrContent 不变时不会重绘，
// 倒计时和支付状态轮询更新的是其他 ref，不会影响二维码组件
const onQrComplete = () => {
  // 绘制完成，无需额外处理
}

// 生成二维码
const generateQrCode = async () => {
  if (!orderId.value) return
  generating.value = true
  qrContent.value = ''
  try {
    const res = await createOnsiteQrCode({
      orderId: orderId.value,
      channelCode: channelCode.value
    })
    const data = res.data || {}
    if (data.displayMode === 'qr_code' && data.displayContent) {
      // 先设置二维码内容，组件挂载后下一刻手动触发绘制
      qrContent.value = data.displayContent
      cashierExpireTime.value = data.cashierExpireTime || ''
      payAmount.value = data.amount || 0
      paymentStatus.value = data.paymentStatus ?? 0
      settlementStatus.value = data.settlementStatus ?? 0

      // 启动倒计时
      startCountdown()

      // 未支付则启动轮询
      if (paymentStatus.value === 0) {
        startPoll()
      }

      // 组件 v-if 由 qrContent 控制切换，需要等待 DOM 更新后再手动 make
      nextTick(() => {
        if (uqrcodeRef.value && typeof uqrcodeRef.value.make === 'function') {
          uqrcodeRef.value.make()
        }
      })
    } else {
      uni.showToast({ title: '二维码生成失败', icon: 'none' })
    }
  } catch (e) {
    console.error('生成二维码失败', e)
    uni.showToast({ title: '二维码生成失败，请重试', icon: 'none' })
  } finally {
    generating.value = false
  }
}

const handleRefreshQr = () => {
  if (generating.value || paymentStatus.value === 10) return
  generateQrCode()
}

// 过期倒计时
const startCountdown = () => {
  stopCountdown()
  updateRemaining()
  countdownTimer = setInterval(() => {
    updateRemaining()
    if (remainingSeconds.value <= 0) {
      stopCountdown()
      stopPoll()
    }
  }, 1000)
}

const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const updateRemaining = () => {
  remainingSeconds.value = getRemainingSeconds(cashierExpireTime.value)
}

// 支付状态轮询
const startPoll = () => {
  stopPoll()
  pollCount = 0
  pollTimer = setInterval(() => {
    pollCount++
    if (pollCount > MAX_POLL) {
      stopPoll()
      return
    }
    fetchPaymentStatus()
  }, 2500)
}

const stopPoll = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const fetchPaymentStatus = async () => {
  try {
    const res = await getOnsitePaymentStatus(orderId.value)
    if (res.data) {
      paymentStatus.value = res.data.paymentStatus ?? paymentStatus.value
      settlementStatus.value = res.data.settlementStatus ?? settlementStatus.value

      if (paymentStatus.value === 10) {
        stopPoll()
        stopCountdown()
      }
    }
  } catch (e) {
    console.error('查询支付状态失败', e)
  }
}

const handleBack = () => {
  uni.navigateBack()
}

onLoad((options) => {
  orderId.value = options?.orderId
  channelCode.value = options?.channelCode || 'wx_native'
  generateQrCode()
})

onShow(() => {
  if (orderId.value && paymentStatus.value === 0 && !isExpired.value) {
    // 回前台立即刷新剩余时间 + 查一次支付状态
    updateRemaining()
    fetchPaymentStatus()
    // 重新启动倒计时和支付状态轮询（onHide 中已停止）
    startCountdown()
    startPoll()
  }
})

onHide(() => {
  stopCountdown()
  stopPoll()
})

// 应用退到后台（按 Home 键）：停止定时器，避免被系统挂起后时间不准
onPageHide(() => {
  stopCountdown()
  stopPoll()
})

// 应用从后台切回前台：用当前时间校准剩余秒数，再重启定时器
onPageShow(() => {
  if (orderId.value && paymentStatus.value === 0 && !isExpired.value) {
    updateRemaining()
    fetchPaymentStatus()
    startCountdown()
    startPoll()
  }
})

onUnmounted(() => {
  stopCountdown()
  stopPoll()
})
</script>

<style lang="scss" scoped>
.qr-pay-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 24rpx;
  padding-bottom: calc(240rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.pay-info-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  text-align: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.channel-name {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.channel-icon {
  width: 44rpx;
  height: 44rpx;
}

.amount-label {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.amount-value {
  font-size: 56rpx;
  font-weight: bold;
  color: #ef4444;
}

/* 二维码卡 */
.qr-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 48rpx 32rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 480rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.qr-wrapper {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-success,
.qr-expired,
.qr-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  padding: 40rpx 0;
}

.success-icon {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: #ecfdf5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #10b981;
}

.success-desc {
  font-size: 26rpx;
  color: #6b7280;
}

.expired-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: #fff7ed;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expired-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #f59e0b;
}

.expired-desc {
  font-size: 26rpx;
  color: #9ca3af;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #e5e7eb;
  border-top-color: #2f6bee;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.qr-loading text {
  font-size: 26rpx;
  color: #9ca3af;
}

/* 扫码提示 */
.scan-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 20rpx;
}

/* 过期倒计时 */
.expire-countdown {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #6b7280;
  margin-bottom: 24rpx;
}

/* 状态区 */
.status-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-label {
  font-size: 28rpx;
  color: #666;
}

.status-value {
  font-size: 28rpx;
  font-weight: 600;
}

/* 底部按钮 */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  z-index: 100;
}

.refresh-btn {
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  color: #fff;
  border-radius: 20rpx;
  border: none;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.3);

  &.disabled {
    opacity: 0.6;
  }

  &:active {
    transform: scale(0.98);
  }
}

.back-btn {
  width: 100%;
  height: 76rpx;
  line-height: 76rpx;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 16rpx;
  border: none;
  font-size: 28rpx;
  font-weight: 500;

  &:active {
    opacity: 0.7;
  }
}
</style>
