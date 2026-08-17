<template>
  <view class="detail-page">
    <!-- 顶部状态卡 -->
    <view class="status-card" :style="{ background: getStatusGradient(orderDetail.status) }">
      <view class="status-name">{{ getStatusName(orderDetail.status) }}</view>
      <view class="order-no">订单号：{{ orderDetail.orderNo }}</view>
    </view>

    <!-- 基本信息 -->
    <view class="info-card">
      <view class="info-item">
        <text class="info-label">服务类型</text>
        <text class="info-value">{{ getServiceTypeName(orderDetail.serviceType) }}</text>
      </view>
      <view class="divider"></view>
      <view class="info-item">
        <text class="info-label">客户类型</text>
        <text class="info-value">{{ orderDetail.customerType === 1 ? '平台会员' : '散客' }}</text>
      </view>
      <view class="divider" v-if="orderDetail.customerType === 1 && orderDetail.userId"></view>
      <view class="info-item" v-if="orderDetail.customerType === 1 && orderDetail.userId">
        <text class="info-label">会员ID</text>
        <text class="info-value">{{ orderDetail.userId }}</text>
      </view>
    </view>

    <!-- 待开始：状态 15 -->
    <view v-if="orderDetail.status === 15" class="section-card">
      <view class="section-title">订单信息</view>
      <view class="info-item">
        <text class="info-label">小时单价</text>
        <text class="info-value">¥{{ formatFenToYuan(orderDetail.unitPrice) }}/小时</text>
      </view>
      <view class="divider"></view>
      <view class="info-item">
        <text class="info-label">返程车费</text>
        <view class="info-value-row">
          <text class="info-value">¥0.00</text>
          <text class="travel-tip">待结束时确认</text>
        </view>
      </view>
    </view>

    <!-- 进行中：状态 40 -->
    <view v-if="orderDetail.status === 40" class="timer-card">
      <view class="timer-label">已服务时长</view>
      <view class="timer-value">{{ currentDuration }}</view>
      <view class="timer-tip">
        <uni-icons type="info" size="14" color="#9ca3af"></uni-icons>
        <text>计时以服务端为准</text>
      </view>
    </view>

    <view v-if="orderDetail.status === 40" class="section-card">
      <view class="info-item">
        <text class="info-label">开始时间</text>
        <text class="info-value">{{ orderDetail.startTime }}</text>
      </view>
      <view class="divider"></view>
      <view class="info-item">
        <text class="info-label">小时单价</text>
        <text class="info-value">¥{{ formatFenToYuan(orderDetail.unitPrice) }}/小时</text>
      </view>
      <view class="divider"></view>
      <view class="info-item">
        <text class="info-label">返程车费</text>
        <view class="info-value-row">
          <text class="info-value">¥{{ formatFenToYuan(orderDetail.returnTravelAmount) }}</text>
          <text class="travel-tip">待结束确认</text>
        </view>
      </view>
    </view>

    <!-- 待付款/已完成：状态 45/50/60 -->
    <view v-if="[45, 50, 60].includes(orderDetail.status)" class="amount-card" :class="{ completed: orderDetail.status === 60  || orderDetail.status === 50 }">
      <view class="amount-label">应付金额</view>
      <view class="amount-value">¥{{ formatFenToYuan(orderDetail.payAmount) }}</view>
      <view class="payment-status" :style="{ color: getPaymentStatusColor() }">
        {{ getPaymentStatusText() }}
      </view>
    </view>

    <view v-if="[45, 50, 60].includes(orderDetail.status)" class="section-card">
      <view class="section-title">费用明细</view>
      <view class="info-item">
        <text class="info-label">实际时长</text>
        <text class="info-value">{{ formatActualDuration() }}</text>
      </view>
      <view class="divider"></view>
      <view class="info-item">
        <text class="info-label">计费分钟</text>
        <text class="info-value">{{ orderDetail.billingMinutes || 0 }} 分钟</text>
      </view>
      <view class="divider"></view>
      <view class="info-item">
        <text class="info-label">服务金额</text>
        <text class="info-value">¥{{ formatFenToYuan(serviceAmount) }}</text>
      </view>
      <view class="divider"></view>
      <view class="info-item">
        <text class="info-label">返程车费</text>
        <text class="info-value">¥{{ formatFenToYuan(orderDetail.returnTravelAmount) }}</text>
      </view>
    </view>

    <!-- 时间线（已完成/已取消） -->
    <view v-if="[50, 60, 70].includes(orderDetail.status)" class="section-card">
      <view class="section-title">订单时间</view>
      <view class="info-item">
        <text class="info-label">开始时间</text>
        <text class="info-value">{{ orderDetail.startTime || '-' }}</text>
      </view>
      <view class="divider"></view>
      <view class="info-item">
        <text class="info-label">结束时间</text>
        <text class="info-value">{{ orderDetail.endTime || '-' }}</text>
      </view>
    </view>

    <!-- 待付款：支付入口 -->
    <view v-if="orderDetail.status === 45 && paymentInfo.paymentStatus === 0" class="pay-section">
      <view class="section-title">选择支付方式</view>

      <view class="pay-method-list">
        <view
          v-for="item in payMethodList"
          :key="item.code"
          class="pay-method-item"
          @click="item.type === 'app' ? handleAppPay(item.code) : navToQrPay(item.code)"
        >
          <image class="pay-icon-img" :src="item.icon" mode="aspectFit"></image>
          <view class="pay-info">
            <view class="pay-name">{{ item.name }}</view>
            <view class="pay-desc">{{ item.desc }}</view>
          </view>
          <uni-icons type="right" size="18" color="#ccc"></uni-icons>
        </view>
      </view>
    </view>

    <!-- 已支付状态提示 -->
    <view v-if="paymentInfo.paymentStatus === 10 && [45, 50].includes(orderDetail.status)" class="pay-success-tip">
      <uni-icons type="checkmarkempty" size="32" color="#10b981"></uni-icons>
      <view class="tip-text">
        <view class="tip-title">{{ getPaymentStatusText() }}</view>
        <view class="tip-desc">请稍候，订单状态更新中...</view>
      </view>
    </view>

    <!-- 底部操作区 -->
    <view v-if="showBottomActions" class="bottom-bar">
      <!-- 待开始 -->
      <template v-if="orderDetail.status === 15">
        <button class="btn-secondary" @click="handleCancel">取消订单</button>
        <button class="btn-primary" :loading="operating" @click="handleStartService">开始服务</button>
      </template>

      <!-- 进行中 -->
      <template v-else-if="orderDetail.status === 40">
        <button class="btn-danger" :loading="operating" @click="handleFinishService">结束服务</button>
      </template>
    </view>

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

  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onLoad, onShow, onHide,onPageShow } from '@dcloudio/uni-app'
import { getCurrentInstance } from 'vue'
import {
  getOnsiteOrderDetail,
  cancelOnsiteOrder,
  startOnsiteService,
  finishOnsiteService
} from '@/api/billiard/onsiteOrder'
import {
  createOnsitePayment,
  createOnsitePaymentSubmit,
  getOnsitePaymentStatus,
  getEnablePayChannelList
} from '@/api/billiard/onsitePayment'
import request from '@/utils/request'
import config from '@/config'
import {
  ORDER_STATUS_MAP,
  SERVICE_TYPE_MAP,
  PAYMENT_STATUS_MAP,
  SETTLEMENT_STATUS_MAP,
  formatFenToYuan,
  formatDuration,
  diffSeconds
} from '@/utils/onsiteOrder'

const { proxy } = getCurrentInstance()

const orderId = ref(null)
const orderDetail = ref({})
const paymentInfo = ref({ paymentStatus: 0, settlementStatus: 0 })
const enabledChannels = ref([])
const operating = ref(false)

// 结束服务车费输入弹窗
const showFinishTravelPopup = ref(false)
const finishTravelYuan = ref('0')
const finishSubmitting = ref(false)

// 支付渠道显示配置（图标保持原样）
const PAY_CHANNEL_CONFIG = {
  wx_app: {
    name: '微信支付',
    desc: '使用本机微信 App 支付',
    icon: '/static/images/pay/wechat.png',
    type: 'app'
  },
  alipay_app: {
    name: '支付宝支付',
    desc: '使用本机支付宝 App 支付',
    icon: '/static/images/pay/alipay.png',
    type: 'app'
  },
  wx_native: {
    name: '微信收款码',
    desc: '展示二维码，客户微信扫码支付',
    icon: '/static/images/pay/wechat.png',
    type: 'qr'
  },
  alipay_qr: {
    name: '支付宝收款码',
    desc: '展示二维码，客户支付宝扫码支付',
    icon: '/static/images/pay/alipay.png',
    type: 'qr'
  }
}

// 已启用的支付方式列表（按配置顺序）
const payMethodList = computed(() => {
  const order = ['wx_app', 'alipay_app', 'wx_native', 'alipay_qr']
  return order
    .filter(code => enabledChannels.value.includes(code) && PAY_CHANNEL_CONFIG[code])
    .map(code => ({ code, ...PAY_CHANNEL_CONFIG[code] }))
})
const currentDuration = ref('00:00:00')
let timerInterval = null
let pollInterval = null
let pollCount = 0
const MAX_POLL = 200

// 服务金额（计算）
const serviceAmount = computed(() => {
  const pay = Number(orderDetail.value.payAmount || 0)
  const travel = Number(orderDetail.value.returnTravelAmount || 0)
  return Math.max(0, pay - travel)
})

// 是否显示底部操作区
const showBottomActions = computed(() => {
  return [15, 40].includes(orderDetail.value.status)
})

const getStatusName = (status) => ORDER_STATUS_MAP[status]?.name || '未知'
const getServiceTypeName = (type) => SERVICE_TYPE_MAP[type]?.name || '未知'

const getStatusGradient = (status) => {
  const map = {
    15: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    40: 'linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%)',
    45: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    50: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    60: 'linear-gradient(135deg, #10b981 0%, #0da271 100%)',
    70: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
  }
  return map[status] || map[70]
}

const getPaymentStatusText = () => {
  const ps = paymentInfo.value.paymentStatus
  const ss = paymentInfo.value.settlementStatus
  if (ps === 0) return '待支付'
  if (ps === 10) {
    if (ss === 20) return '支付成功'
    if (ss === 10 || ss === 30) return '支付成功，结算处理中...'
    return '已支付'
  }
  if (ps === 20) return '支付异常，请联系客服'
  return ''
}

const getPaymentStatusColor = () => {
  const ps = paymentInfo.value.paymentStatus
  if (ps === 0) return '#ef4444'
  if (ps === 10) return '#10b981'
  if (ps === 20) return '#ef4444'
  return '#666'
}

const formatActualDuration = () => {
  const sec = Number(orderDetail.value.actualDurationSeconds || 0)
  return formatDuration(sec)
}

// 获取已启用的支付渠道
const fetchEnabledChannels = async () => {
  try {
    const res = await getEnablePayChannelList(config.appInfo.payAppId)
    if (Array.isArray(res.data)) {
      enabledChannels.value = res.data
      console.log(res.data,'===res.datares.data')
    }
  } catch (e) {
    console.error('获取支付渠道列表失败', e)
  }
}

// 获取订单详情
const fetchDetail = async () => {
  if (!orderId.value) return
  try {
    const res = await getOnsiteOrderDetail(orderId.value)
    if (res.data) {
      orderDetail.value = res.data
      // 从详情中提取支付状态
      paymentInfo.value = {
        paymentStatus: res.data.paymentStatus ?? 0,
        settlementStatus: res.data.settlementStatus ?? 0
      }
      // 如果是进行中，启动计时器
      if (res.data.status === 40) {
        startTimer()
      } else {
        stopTimer()
      }
      // 如果是待付款且未支付，加载支付渠道并启动支付轮询
      if (res.data.status === 45 && paymentInfo.value.paymentStatus === 0) {
        fetchEnabledChannels()
        startPaymentPoll()
      }
    }
  } catch (e) {
    console.error('获取订单详情失败', e)
  }
}

// 计时器
const startTimer = () => {
  stopTimer()
  updateDuration()
  timerInterval = setInterval(() => {
    updateDuration()
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const updateDuration = () => {
  if (!orderDetail.value.startTime) return
  const sec = diffSeconds(orderDetail.value.startTime)
  currentDuration.value = formatDuration(sec)
}

// 支付状态轮询
const startPaymentPoll = () => {
  stopPaymentPoll()
  pollCount = 0
  pollInterval = setInterval(() => {
    pollCount++
    if (pollCount > MAX_POLL) {
      stopPaymentPoll()
      return
    }
    fetchPaymentStatus()
  }, 3000)
}

const stopPaymentPoll = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

const fetchPaymentStatus = async () => {
  try {
    const res = await getOnsitePaymentStatus(orderId.value)
    if (res.data) {
      paymentInfo.value = {
        paymentStatus: res.data.paymentStatus ?? paymentInfo.value.paymentStatus,
        settlementStatus: res.data.settlementStatus ?? paymentInfo.value.settlementStatus
      }
      // 支付成功后停止轮询，刷新订单详情
      if (res.data.paymentStatus === 10) {
        stopPaymentPoll()
        if (res.data.settlementStatus === 20) {
          fetchDetail()
        }
      }
    }
  } catch (e) {
    console.error('查询支付状态失败', e)
  }
}

// 开始服务
const handleStartService = () => {
  if (operating.value) return
  proxy.$modal.confirm('确定开始服务吗？开始后将进入计时状态。').then(async () => {
    operating.value = true
    try {
      const res = await startOnsiteService(orderId.value)
      if (res.code === 0 || res.code === 200) {
        uni.showToast({ title: '服务已开始', icon: 'success' })
        fetchDetail()
      }
    } catch (e) {
      console.error('开始服务失败', e)
    } finally {
      operating.value = false
    }
  }).catch(() => {})
}

// 结束服务
const handleFinishService = () => {
  if (operating.value) return
  // 重置车费输入
  finishTravelYuan.value = '0'
  showFinishTravelPopup.value = true
}

// 车费输入失焦校验
const onFinishTravelBlur = () => {
  let val = parseFloat(finishTravelYuan.value)
  if (isNaN(val) || val < 0) val = 0
  if (val > 50) val = 50
  finishTravelYuan.value = val.toFixed(2)
}

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
    // 失败后先查询订单详情确认状态（幂等处理）
    try {
      await fetchDetail()
      // 如果订单已经是终态（待付款/待评价/已完成），说明首次请求已成功
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

// 取消订单
const handleCancel = () => {
  if (operating.value) return
  proxy.$modal.confirm('确定取消该订单吗？取消后无法恢复。').then(async () => {
    operating.value = true
    try {
      const res = await cancelOnsiteOrder(orderId.value)
      if (res.code === 0 || res.code === 200) {
        uni.showToast({ title: '已取消', icon: 'success' })
        fetchDetail()
      }
    } catch (e) {
      console.error('取消订单失败', e)
    } finally {
      operating.value = false
    }
  }).catch(() => {})
}

// App 支付
const handleAppPay = async (channelCode) => {
  if (operating.value) return
  operating.value = true
  try {
    const res = await createOnsitePayment({
      orderId: orderId.value,
      channelCode
    })
    console.log(res,'=====createOnsitePayment')
    if (res.data?.payOrderId) {
      // 使用现有支付提交接口拉起支付
      await invokeAppPay(res.data.payOrderId, channelCode)
    }
  } catch (e) {
    console.error('创建支付失败', e)
  } finally {
    operating.value = false
  }
}

// 拉起 App 支付
const invokeAppPay = async (payOrderId, channelCode) => {
  console.log(payOrderId, channelCode,'=====payOrderId')
  try {
    // 调用支付提交接口
    const submitRes = await createOnsitePaymentSubmit({
      id: payOrderId,
      channelCode
    })
    console.log(submitRes,'=====submitRes')

    if (submitRes.code === 0 || submitRes.code === 200) {
      const payData = submitRes.data
      // 根据渠道拉起对应支付
      if (channelCode === 'wx_app') {
        // #ifdef APP-PLUS || MP-WEIXIN
        const payParams =  JSON.parse(submitRes.data.displayContent)
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
          success: () => {
            uni.showToast({ title: '支付成功', icon: 'success' })
            fetchPaymentStatus()
            fetchDetail()
          },
          fail: (err) => {
            console.warn('微信支付失败', err)
            fetchPaymentStatus()
          }
        })
        // #endif
        // #ifdef H5
        uni.showToast({ title: '请在 App 中使用微信支付', icon: 'none' })
        // #endif
      } else if (channelCode === 'alipay_app') {
        // #ifdef APP-PLUS
        const payParams =  submitRes.data.displayContent
        uni.requestPayment({
          provider: 'alipay',
          orderInfo: payParams,
          success: () => {
            uni.showToast({ title: '支付成功', icon: 'success' })
            fetchPaymentStatus()
            fetchDetail()
          },
          fail: (err) => {
            console.warn('支付宝支付失败', err)
            fetchPaymentStatus()
          }
        })
        // #endif
        // #ifndef APP-PLUS
        uni.showToast({ title: '请在 App 中使用支付宝支付', icon: 'none' })
        // #endif
      }
    }
  } catch (e) {
    console.error('支付提交失败', e)
    uni.showToast({ title: '支付拉起失败，请重试', icon: 'none' })
  }
}

// 跳转二维码支付页
const navToQrPay = (channelCode) => {
  uni.navigateTo({
    url: `/subpkg/onsite/qr-pay?orderId=${orderId.value}&channelCode=${channelCode}`
  })
}

// 应用从后台切回前台：用当前时间校准剩余秒数，再重启定时器
onPageShow(() => {
  if (orderId.value) {
    fetchDetail()
  }
})

onLoad((options) => {
  orderId.value = options?.id
  fetchDetail()
})

onShow(() => {
  if (orderId.value) {
    fetchDetail()
  }
})

onHide(() => {
  stopTimer()
  stopPaymentPoll()
})

onUnmounted(() => {
  stopTimer()
  stopPaymentPoll()
})
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 24rpx;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.status-card {
  color: #fff;
  padding: 40rpx 32rpx;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.status-name {
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 12rpx;
}

.order-no {
  font-size: 24rpx;
  opacity: 0.85;
}

.section-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.info-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
}

.info-label {
  font-size: 28rpx;
  color: #666;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.info-value-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.edit-link {
  font-size: 24rpx;
  color: #2f6bee;
}

.travel-tip {
  font-size: 22rpx;
  color: #9ca3af;
  margin-left: 8rpx;
}

.divider {
  height: 1rpx;
  background: #f3f4f6;
}

/* 计时器卡片 */
.timer-card {
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  color: #fff;
  border-radius: 20rpx;
  padding: 60rpx 32rpx;
  margin-bottom: 20rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(47, 107, 238, 0.25);
}

.timer-label {
  font-size: 28rpx;
  opacity: 0.85;
  margin-bottom: 20rpx;
}

.timer-value {
  font-size: 80rpx;
  font-weight: bold;
  font-family: monospace;
  letter-spacing: 4rpx;
  margin-bottom: 16rpx;
}

.timer-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: 22rpx;
  opacity: 0.75;
}

/* 金额卡片 */
.amount-card {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  border-radius: 20rpx;
  padding: 48rpx 32rpx;
  margin-bottom: 20rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(239, 68, 68, 0.25);

  &.completed {
    background: linear-gradient(135deg, #10b981 0%, #0da271 100%);
    box-shadow: 0 4rpx 16rpx rgba(16, 185, 129, 0.25);
  }
}

.amount-label {
  font-size: 26rpx;
  opacity: 0.85;
  margin-bottom: 12rpx;
}

.amount-value {
  font-size: 64rpx;
  font-weight: bold;
  margin-bottom: 12rpx;
}

.payment-status {
  font-size: 26rpx;
  font-weight: 500;
  background: #fff;
  padding: 10rpx 24rpx;
  border-radius: 24rpx;
  display: inline-block;
  color: #333;
}

/* 支付方式 */
.pay-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.pay-method-list {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.pay-method-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 16rpx;
  border-radius: 16rpx;
  transition: background 0.2s;

  &:active {
    background: #f8f9fb;
  }
}

.pay-icon-img {
  width: 64rpx;
  height: 64rpx;
  border-radius: 12rpx;
}

.pay-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.pay-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.pay-desc {
  font-size: 24rpx;
  color: #999;
}

/* 支付成功提示 */
.pay-success-tip {
  background: #ecfdf5;
  border: 2rpx solid #10b98133;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.tip-text {
  flex: 1;
}

.tip-title {
  font-size: 30rpx;
  color: #10b981;
  font-weight: 600;
  margin-bottom: 6rpx;
}

.tip-desc {
  font-size: 24rpx;
  color: #6b7280;
}

/* 底部操作区 */
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
  gap: 20rpx;
  z-index: 100;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  flex: 1;
  height: 90rpx;
  line-height: 90rpx;
  border-radius: 20rpx;
  border: none;
  font-size: 30rpx;
  font-weight: 600;
}

.btn-primary {
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.3);
}

.btn-secondary {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.3);
}

/* 弹窗 */
.popup-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.popup-content {
  width: 80%;
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 32rpx;
}

.popup-input-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 24rpx;
  background: #f7f8fa;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
}

.popup-input {
  font-size: 40rpx;
  font-weight: 600;
  color: #ef4444;
  text-align: right;
  width: 180rpx;
}

.popup-unit {
  font-size: 28rpx;
  color: #666;
}

.popup-tip {
  font-size: 24rpx;
  color: #9ca3af;
  text-align: center;
  margin-bottom: 32rpx;
}

.popup-actions {
  display: flex;
  gap: 20rpx;
}

.popup-cancel,
.popup-confirm {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 16rpx;
  border: none;
  font-size: 28rpx;
  font-weight: 500;
}

.popup-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.popup-confirm {
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  color: #fff;
}

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
</style>
