<template>
  <view class="order-detail-wrapper" :class="{ 'order-detail-finished': !isProcessing }">
    <!-- 进行中状态：显示计时器区域 -->
    <view v-if="orderStatus === ORDER_STATUS.PROCESSING" class="timer-section">
      <uni-tag :text="getStatusText(orderStatus)" :type="getStatusType(orderStatus)" size="normal" class="status-tag" />
      <template v-if="orderInfo.orderId">
        <text class="big-time">{{ usedText }}</text>
        <text class="time-label">已服务时长</text>
        <text class="left-time">剩余时长：{{ leftText }}</text>
      </template>
    </view>

    <!-- 其他状态：显示状态卡片 -->
    <view v-else class="status-section" :class="`status-${orderStatus}`">
      <view class="status-header">
        <view class="status-badge" :class="`badge-${orderStatus}`">
          <uni-icons :type="getStatusIcon(orderStatus)" :size="20" color="#fff" />
          <text class="badge-text">{{ getStatusText(orderStatus) }}</text>
        </view>
      </view>
      <view class="status-content">
        <text class="status-main-text">{{ getStatusMainText(orderStatus) }}</text>
        <text class="status-sub-text">{{ getStatusSubText(orderStatus) }}</text>
      </view>
    </view>

    <!-- 订单信息卡片 -->
    <view class="card">
      <view class="card-title">订单信息</view>
      <view class="info-row">
        <text class="label">订单编号</text>
        <text class="value">{{ orderInfo.orderNo || '-' }}</text>
      </view>
      <view class="info-row">
        <text class="label">服务类型</text>
        <text class="value">{{ orderInfo.serviceType === 1 ? '台球陪练' : '陪游' }}</text>
      </view>
      <view class="info-row">
        <text class="label">服务时长</text>
        <text class="value">{{ orderInfo.serviceDuration ? `${orderInfo.serviceDuration}分钟` : '-' }}</text>
      </view>
      <view class="info-row">
        <text class="label">订单金额</text>
        <text class="value price">¥{{ orderInfo.totalAmount ? (orderInfo.totalAmount / 100).toFixed(2) : '-' }}</text>
      </view>
      <view class="info-row">
        <text class="label">预约时间</text>
        <text class="value">{{ orderInfo.bookingTimeText || '-' }}</text>
      </view>
      <view class="info-row">
        <text class="label">创建时间</text>
        <text class="value">{{ orderInfo.createTimeText || '-' }}</text>
      </view>
    </view>

    <!-- 服务地点卡片 -->
    <view class="card" v-if="orderInfo.venueName && orderInfo.venueName !== '-'">
      <view class="card-title">服务地点</view>
      <image class="shop-img" :src="orderInfo.venueImg || 'https://picsum.photos/750/300'" mode="aspectFill"></image>
      <view class="shop-info">
        <view class="shop-left">
          <text class="shop-name">{{ orderInfo.venueName }}</text>
          <text class="shop-address">{{ orderInfo.venueAddress || '-' }}</text>
        </view>
        <button
            class="nav-btn"
            :class="{ 'nav-btn-disabled': !isProcessing }"
            @click="navigate"
        >
          <uni-icons type="location-filled" size="20" color="#fff" />
        </button>
      </view>
    </view>

    <!-- 客户信息卡片 -->
    <view class="card" v-if="orderInfo.userPhone && orderInfo.userPhone !== '-'">
      <view class="card-title">客户信息</view>
      <view class="customer-info">
        <image class="avatar" src="https://picsum.photos/100/100" mode="aspectFill"></image>
        <view class="customer-left">
          <text class="customer-name">{{ orderInfo.userPhone }}</text>
          <text class="customer-phone">脱敏手机号</text>
        </view>
        <button class="call-btn" @click="makeCall">
          <uni-icons type="phone" size="20" color="#10B981" />
        </button>
      </view>
    </view>

    <!-- 底部操作区 -->
    <view class="footer">
      <!-- 待接单状态显示接单/拒单按钮 -->
      <template v-if="orderStatus === ORDER_STATUS.PENDING">
        <view class="btn-row">
          <button class="btn-danger" @click="rejectOrder">拒单</button>
          <button class="btn-primary" @click="acceptOrder">接单</button>
        </view>
      </template>
      <!-- 进行中状态显示结束服务按钮 -->
      <template v-else-if="orderStatus === ORDER_STATUS.PROCESSING">
        <button class="btn-end" @click="endService">结束服务</button>
      </template>
      <!-- 其他状态显示联系客服 -->
      <template v-else>
        <button class="btn-service" @click="contactService">联系客服</button>
      </template>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { openMapNavigation } from '@/utils/platform'
import { getOrderDetail, finishService } from '@/api/billiard/order'

// 订单状态枚举
const ORDER_STATUS = {
  UNPAID: 10,        // 待付款
  PENDING: 20,       // 待接单
  ACCEPTED: 30,     // 已接单
  PROCESSING: 40,    // 进行中
  PENDING_REVIEW: 50, // 待评价
  FINISHED: 60,     // 已完成
  CANCELLED: 70     // 已取消
}

// 接收路由参数
const orderId = ref(null)
const orderStatus = ref(null)
const orderInfo = ref({})
const usedSec = ref(0)
const leftSec = ref(0)

// 计时显示文本
const usedText = ref('00:00')
const leftText = ref('00:00:00')

// 状态计算属性
const isProcessing = computed(() => orderStatus.value === ORDER_STATUS.PROCESSING)

// 获取状态类型（用于uni-tag）
const getStatusType = (status) => {
  const typeMap = {
    10: 'warning',
    20: 'warning',
    30: 'primary',
    40: 'primary',
    50: 'warning',
    60: 'success',
    70: 'default'
  }
  return typeMap[status] || 'default'
}

// 获取状态图标
const getStatusIcon = (status) => {
  const iconMap = {
    10: 'wallet',
    20: 'calendar',
    30: 'check',
    40: 'play',
    50: 'star',
    60: 'checkmarkempty',
    70: 'close'
  }
  return iconMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    10: '待付款',
    20: '待接单',
    30: '已接单',
    40: '进行中',
    50: '待评价',
    60: '已完成',
    70: '已取消'
  }
  return textMap[status] || '未知'
}

// 获取状态主文本
const getStatusMainText = (status) => {
  switch (status) {
    case ORDER_STATUS.UNPAID:
      return '等待用户付款'
    case ORDER_STATUS.PENDING:
      return '等待您接单'
    case ORDER_STATUS.ACCEPTED:
      return '已接单，待服务'
    case ORDER_STATUS.PENDING_REVIEW:
      return '服务已完成'
    case ORDER_STATUS.FINISHED:
      return '订单已完成'
    case ORDER_STATUS.CANCELLED:
      return '订单已取消'
    default:
      return ''
  }
}

// 获取状态副文本
const getStatusSubText = (status) => {
  switch (status) {
    case ORDER_STATUS.UNPAID:
      return `金额 ¥${orderInfo.value.totalAmount ? (orderInfo.value.totalAmount / 100).toFixed(2) : '-'}`
    case ORDER_STATUS.PENDING:
      return `预约时间 ${orderInfo.value.bookingTimeText || '-'}`
    case ORDER_STATUS.ACCEPTED:
      return `预约时间 ${orderInfo.value.bookingTimeText || '-'}`
    case ORDER_STATUS.PENDING_REVIEW:
      return `服务时长 ${orderInfo.value.serviceDuration || '-'}分钟`
    case ORDER_STATUS.FINISHED:
      return `感谢您的服务`
    case ORDER_STATUS.CANCELLED:
      return '如有疑问请联系客服'
    default:
      return ''
  }
}

// 计时器实例
let usedTimer = null
let leftTimer = null

// 时间格式化函数
const fmtMMSS = (s) => {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2,0)}:${String(sec).padStart(2,0)}`
}
const fmtHHMMSS = (s) => {
  const h = Math.floor(s/3600)
  const m = Math.floor((s%3600)/60)
  const sec = s%60
  return `${String(h).padStart(2,0)}:${String(m).padStart(2,0)}:${String(sec).padStart(2,0)}`
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
}

// 获取订单详情
const fetchOrderDetail = async () => {
  if (!orderId.value) return

  try {
    const res = await getOrderDetail(orderId.value)
    if (res.data) {
      orderInfo.value = {
        ...res.data,
        bookingTimeText: formatTime(res.data.bookingTime),
        createTimeText: formatTime(res.data.createTime)
      }

      // 如果是进行中订单，启动计时
      if (orderStatus.value === ORDER_STATUS.PROCESSING) {
        // 计算已服务时长
        if (res.data.startTime) {
          usedSec.value = Math.floor((Date.now() - res.data.startTime) / 1000)
        }
        // 计算剩余时长
        if (res.data.remainingMinutes) {
          leftSec.value = res.data.remainingMinutes * 60
        } else if (res.data.serviceDuration && res.data.startTime) {
          // 根据预定时长和开始时间计算剩余
          const elapsed = Math.floor((Date.now() - res.data.startTime) / 1000)
          const total = res.data.serviceDuration * 60
          leftSec.value = Math.max(0, total - elapsed)
        }
        startTimer()
      }
    }
  } catch (err) {
    console.error('获取订单详情失败', err)
    uni.showToast({ title: '获取订单详情失败', icon: 'none' })
  }
}

// 启动计时
const startTimer = () => {
  // 初始化显示
  usedText.value = fmtMMSS(usedSec.value)
  leftText.value = fmtHHMMSS(leftSec.value)

  // 已服务时长计时
  usedTimer = setInterval(() => {
    usedSec.value++
    usedText.value = fmtMMSS(usedSec.value)
  }, 1000)

  // 剩余时长计时
  leftTimer = setInterval(() => {
    if (leftSec.value <= 0) {
      clearInterval(leftTimer)
      clearInterval(usedTimer)
      return
    }
    leftSec.value--
    leftText.value = fmtHHMMSS(leftSec.value)
  }, 1000)
}

// 页面加载时接收参数
onLoad((options) => {
  orderId.value = options.orderId ? parseInt(options.orderId) : null
  orderStatus.value = options.status ? parseInt(options.status) : null

  // 如果有订单ID，通过API获取详情
  if (orderId.value) {
    fetchOrderDetail()
  } else {
    // 兜底：使用传入的信息（兼容没有orderId的情况）
    orderInfo.value = {
      orderNo: options.orderNo || '-',
      serviceType: options.serviceType ? parseInt(options.serviceType) : null,
      totalAmount: options.totalAmount ? parseInt(options.totalAmount) : 0,
      bookingTimeText: decodeURIComponent(options.bookingTimeText || '-'),
      createTimeText: decodeURIComponent(options.createTimeText || '-'),
      venueName: decodeURIComponent(options.venueName || ''),
      venueAddress: decodeURIComponent(options.venueAddress || ''),
      venueLongitude: options.venueLongitude ? parseFloat(options.venueLongitude) : null,
      venueLatitude: options.venueLatitude ? parseFloat(options.venueLatitude) : null,
      userPhone: decodeURIComponent(options.userPhone || '')
    }
  }
})

// 导航
const navigate = () => {
  if (!isProcessing.value) {
    return uni.showToast({ title: '服务已结束，无需导航', icon: 'none' })
  }

  const { venueLatitude, venueLongitude, venueName, venueAddress } = orderInfo.value
  if (!venueLatitude || !venueLongitude) {
    return uni.showToast({ title: '地址信息有误', icon: 'none' })
  }

  openMapNavigation({
    latitude: venueLatitude,
    longitude: venueLongitude,
    name: venueName,
    address: venueAddress,
    mode: 'driving'
  })
}

// 打电话
const makeCall = () => {
  // 脱敏手机号无法直接拨打，提示用户
  uni.showToast({ title: '无法拨打脱敏号码', icon: 'none' })
}

// 联系客服
const contactService = () => {
  uni.showToast({ title: '正在联系客服', icon: 'none' })
}

// 接单
const acceptOrder = () => {
  uni.showToast({ title: '接单功能待实现', icon: 'none' })
}

// 拒单
const rejectOrder = () => {
  uni.showModal({
    title: '确认拒单',
    content: '确定要拒绝此订单吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '拒单功能待实现', icon: 'none' })
      }
    }
  })
}

// 结束服务
const endService = () => {
  uni.showModal({
    title: '确认结束',
    content: '确定要结束当前服务吗？结束后无法继续计时',
    success: async (res) => {
      if (res.confirm) {
        try {
          await finishService({
            orderId: orderId.value
          })
          // 清空计时器
          clearInterval(usedTimer)
          clearInterval(leftTimer)
          // 更新状态
          orderStatus.value = ORDER_STATUS.FINISHED
          // 通知工作台服务已结束
          uni.$emit('serviceEnded', {
            orderId: orderId.value,
            usedTime: usedText.value
          })
          uni.showToast({ title: '服务已结束', icon: 'success' })
          // 延迟返回
          setTimeout(() => {
            uni.navigateBack()
          }, 1000)
        } catch (err) {
          console.error('结束服务失败', err)
          uni.showToast({ title: err?.msg || '操作失败', icon: 'none' })
        }
      }
    }
  })
}

// 页面卸载时清空计时器
onUnload(() => {
  clearInterval(usedTimer)
  clearInterval(leftTimer)
})
</script>

<style lang="scss" scoped>
.order-detail-wrapper {
  min-height: 100vh;
  background: $bg-page;
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}
.order-detail-finished {
  padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
}

:deep(.uni-nav-bar) {
  background: $bg-card !important;
  border-bottom: 1rpx solid $border-light !important;
}

/* 进行中计时区域 */
.timer-section {
  background: $bg-card;
  text-align: center;
  padding: 32rpx 24rpx 48rpx;
  margin-bottom: 24rpx;
  box-shadow: $shadow-sm;
  .status-tag {
    margin-bottom: 16rpx;
  }
  .big-time {
    font-size: 96rpx;
    font-weight: bold;
    color: $text-primary;
    display: block;
    line-height: 1;
    margin: 16rpx;
  }
  .time-label {
    font-size: 26rpx;
    color: $text-tertiary;
    display: block;
    margin-bottom: 16rpx;
  }
  .left-time {
    font-size: 28rpx;
    color: $danger;
    font-weight: bold;
  }
}

/* 状态区域 */
.status-section {
  background: $bg-card;
  padding: 40rpx 32rpx;
  margin-bottom: 24rpx;
  text-align: center;

  .status-header {
    margin-bottom: 24rpx;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
    padding: 12rpx 32rpx;
    border-radius: 40rpx;
    font-size: 28rpx;
    font-weight: bold;
    color: #fff;

    &.badge-10 { background: linear-gradient(135deg, #FF9500 0%, #FF6B00 100%); } // 待付款-橙色
    &.badge-20 { background: linear-gradient(135deg, #007AFF 0%, #0056FF 100%); } // 待接单-蓝色
    &.badge-30 { background: linear-gradient(135deg, #8E8E93 0%, #636366 100%); } // 已接单-灰色
    &.badge-40 { background: linear-gradient(135deg, #34C759 0%, #28A745 100%); } // 进行中-绿色
    &.badge-50 { background: linear-gradient(135deg, #FF2D55 0%, #E91E63 100%); } // 待评价-粉红色
    &.badge-60 { background: linear-gradient(135deg, #5856D6 0%, #3F3F98 100%); } // 已完成-紫色
    &.badge-70 { background: linear-gradient(135deg, #8E8E93 0%, #636366 100%); } // 已取消-灰色
  }

  .status-content {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  .status-main-text {
    font-size: 32rpx;
    font-weight: bold;
    color: $text-primary;
  }

  .status-sub-text {
    font-size: 26rpx;
    color: $text-tertiary;
  }
}

/* 通用卡片样式 */
.card {
  background: $bg-card;
  border-radius: $radius-xl;
  padding: 24rpx;
  margin: 0 24rpx 24rpx;
  box-shadow: $shadow-sm;
  .card-title {
    font-size: 30rpx;
    font-weight: bold;
    color: $text-primary;
    margin-bottom: 24rpx;
  }
}

/* 订单信息行 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid $bg-page;
  &:last-child {
    border-bottom: none;
  }
  .label {
    font-size: 26rpx;
    color: $text-tertiary;
  }
  .value {
    font-size: 26rpx;
    color: $text-secondary;
  }
  .price {
    color: $primary;
    font-weight: bold;
  }
}

/* 服务地点样式 */
.shop-img {
  width: 100%;
  height: 300rpx;
  border-radius: $radius-base;
  margin-bottom: 20rpx;
}
.shop-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .shop-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    .shop-name {
      font-size: 28rpx;
      font-weight: bold;
      color: $text-primary;
    }
    .shop-address {
      font-size: 24rpx;
      color: $text-secondary;
    }
  }
  .nav-btn {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    transition: transform $duration-fast;
    &:active {
      transform: scale(0.95);
    }
  }
  /* 导航禁用样式：置灰+不可点击 */
  .nav-btn-disabled {
    background: $border !important;
    opacity: 0.5;
    pointer-events: none;
  }
}

/* 客户信息样式 */
.customer-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
  .avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
  }
  .customer-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    .customer-name {
      font-size: 28rpx;
      font-weight: bold;
      color: $text-primary;
    }
    .customer-phone {
      font-size: 24rpx;
      color: $text-secondary;
    }
  }
  .call-btn {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    background: $success-light;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    transition: transform $duration-fast;
    &:active {
      transform: scale(0.95);
    }
  }
}
.card:last-of-type {
  margin-bottom: 20rpx;
}

/* 底部操作区 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  padding: 20rpx 32rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid $border-light;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  z-index: 99;

  .btn-row {
    display: flex;
    gap: 24rpx;
  }

  .btn-danger, .btn-primary {
    flex: 1;
    height: 88rpx;
    line-height: 88rpx;
    border-radius: $radius-base;
    font-size: 32rpx;
    font-weight: 600;
    border: none;
    transition: transform $duration-fast;
    &:active {
      transform: scale(0.98);
    }
    &::after { border: none; }
  }

  .btn-danger {
    background: $danger;
    color: #fff;
    box-shadow: 0 8rpx 20rpx rgba(245, 63, 63, 0.2);
  }

  .btn-primary {
    background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
    color: #fff;
    box-shadow: 0 8rpx 20rpx rgba($primary, 0.3);
  }

  .btn-end {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    background: $danger;
    color: #fff;
    border-radius: $radius-base;
    font-size: 32rpx;
    font-weight: 600;
    box-shadow: 0 8rpx 20rpx rgba(245, 63, 63, 0.2);
    border: none;
    transition: transform $duration-fast;
    &:active {
      transform: scale(0.98);
    }
    &::after { border: none; }
  }

  .btn-service {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    background: $bg-card;
    color: $text-secondary;
    border: 2rpx solid $border-light;
    border-radius: $radius-base;
    font-size: 32rpx;
    font-weight: 500;
    &::after { border: none; }
  }
}

:deep(.uni-button) {
  border: none;
  box-shadow: none;
  outline: none;
}
</style>