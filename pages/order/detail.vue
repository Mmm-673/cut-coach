<template>
  <view class="order-detail-wrapper" :class="{ 'order-detail-finished': !isProcessing }">
    <!-- 状态计时区域：根据状态动态渲染 -->
    <view class="timer-section" :class="{ 'timer-section-finished': !isProcessing }">
      <uni-tag :text="statusText" :type="statusType" size="normal" class="status-tag" />
      <!-- 仅进行中显示已服务/剩余时长，已结束隐藏 -->
      <template v-if="isProcessing">
        <text class="big-time">{{ usedText }}</text>
        <text class="time-label">已服务时长</text>
        <text class="left-time">剩余时长：{{ leftText }}</text>
      </template>
    </view>

    <!-- 订单信息卡片 -->
    <view class="card">
      <view class="card-title">订单信息</view>
      <view class="info-row">
        <text class="label">订单编号</text>
        <text class="value">{{ orderInfo.orderNo || '202603221430001' }}</text>
      </view>
      <view class="info-row">
        <text class="label">服务类型</text>
        <text class="value">{{ orderInfo.serviceName }}</text>
      </view>
      <view class="info-row">
        <text class="label">服务时长</text>
        <text class="value">{{ orderInfo.duration || '1小时' }}</text>
      </view>
      <view class="info-row">
        <text class="label">订单金额</text>
        <text class="value price">¥{{ orderInfo.price }}</text>
      </view>
      <!-- 已结束可以显示最终服务时长，需要的话打开注释即可 -->
      <!-- <view class="info-row" v-if="!isProcessing">
        <text class="label">实际服务时长</text>
        <text class="value">{{ usedText }}</text>
      </view> -->
      <view class="info-row">
        <text class="label">预约时间</text>
        <text class="value">{{ orderInfo.appointTime || '2026-03-22 14:30' }}</text>
      </view>
      <view class="info-row">
        <text class="label">创建时间</text>
        <text class="value">{{ orderInfo.createTime || '2026-03-22 14:25:12' }}</text>
      </view>
    </view>

    <!-- 服务地点卡片 -->
    <view class="card">
      <view class="card-title">服务地点</view>
      <image class="shop-img" src="https://picsum.photos/750/300" mode="aspectFill"></image>
      <view class="shop-info">
        <view class="shop-left">
          <text class="shop-name">{{ orderInfo.shopName }}</text>
          <text class="shop-address">{{ orderInfo.address || '上海市浦东新区XX路123号' }}</text>
          <text class="distance">距离您{{ orderInfo.distance || '2.3公里' }}，驾车约{{ orderInfo.driveTime || '10分钟' }}</text>
        </view>
        <!-- 导航按钮：已结束自动加禁用样式，点击失效 -->
        <button
            class="nav-btn"

            @click="navigate"
        >
          <uni-icons type="location-filled" size="20" color="#fff" />
        </button>
      </view>
    </view>

    <!-- 客户信息卡片 -->
    <view class="card">
      <view class="card-title">客户信息</view>
      <view class="customer-info">
        <image class="avatar" src="https://picsum.photos/100/100" mode="aspectFill"></image>
        <view class="customer-left">
          <text class="customer-name">{{ orderInfo.customerName || '李先生' }}</text>
          <text class="customer-phone">{{ orderInfo.customerPhone || '138****8888' }}</text>
        </view>
        <button class="call-btn" @click="makeCall">
          <uni-icons type="phone" size="20" color="#10B981" />
        </button>
      </view>
    </view>

    <!-- 底部操作区 -->
    <view class="footer">
      <!-- 仅进行中显示结束服务按钮，已结束自动隐藏 -->
      <button v-if="isProcessing" class="btn-end" @click="endService">结束服务</button>
      <button class="btn-service" @click="contactService">联系客服</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { openMapNavigation } from '@/utils/platform'

// 订单状态枚举（可根据你的业务修改状态值）
const ORDER_STATUS = {
  // 进行中
  PROCESSING: 1,
  // 已结束
  FINISHED: 2
}

// 接收路由参数
const orderInfo = ref({})
const usedSec = ref(0)
const leftSec = ref(0)

// 计时显示文本
const usedText = ref('00:00')
const leftText = ref('00:00:00')

// 状态计算属性（自动判断）
const isProcessing = computed(() => orderInfo.value.status === ORDER_STATUS.PROCESSING)
const statusText = computed(() => isProcessing.value ? '进行中' : '已结束')
const statusType = computed(() => isProcessing.value ? 'primary' : 'grey')

// 计时器实例
let usedTimer = null
let leftTimer = null

// 时间格式化函数（和工作台保持一致）
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

// 启动计时
const startTimer = () => {
  // 只有进行中才启动计时
  if (!isProcessing.value) return

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
  if (options.orderInfo) {
    orderInfo.value = JSON.parse(decodeURIComponent(options.orderInfo))
  }
  usedSec.value = parseInt(options.usedSec || 0)
  leftSec.value = parseInt(options.leftSec || 3600)

  // 默认参数补全
  orderInfo.value.status = orderInfo.value.status || ORDER_STATUS.PROCESSING
  orderInfo.value.lat = orderInfo.value.lat || 31.230416
  orderInfo.value.lon = orderInfo.value.lon || 121.473701
  orderInfo.value.address = orderInfo.value.address || '上海市浦东新区XX路123号'
  orderInfo.value.shopName = orderInfo.value.shopName || 'XX台球厅（XX路店）'
  orderInfo.value.serviceName = orderInfo.value.serviceName || '台球助教'
  orderInfo.value.price = orderInfo.value.price || 128

  startTimer()
})

// ====================== 导航逻辑 ======================
const navigate = () => {
  // 已结束直接拦截
  if (!isProcessing.value) {
    return uni.showToast({ title: '服务已结束，无需导航', icon: 'none' })
  }

  const { lat, lon, shopName, address } = orderInfo.value
  if (!lat || !lon) {
    return uni.showToast({ title: '地址信息有误', icon: 'none' })
  }

  // 使用多端兼容的导航函数
  openMapNavigation({
    latitude: lat,
    longitude: lon,
    name: shopName,
    address: address,
    mode: 'driving'
  })
}
// ====================== 导航逻辑结束 ======================

// 打电话
const makeCall = () => {
  const phone = orderInfo.value.customerPhone?.replace(/\*/g, '') || '13800008888'
  uni.makePhoneCall({ phoneNumber: phone })
}

// 联系客服
const contactService = () => {
  uni.showToast({ title: '正在联系客服', icon: 'none' })
}

// 结束服务
const endService = () => {
  uni.showModal({
    title: '确认结束',
    content: '确定要结束当前服务吗？结束后无法继续计时',
    success: (res) => {
      if (res.confirm) {
        // 清空计时器
        clearInterval(usedTimer)
        clearInterval(leftTimer)
        // ✅ 本地立即更新状态，页面自动切换成已结束样式，不用返回也能看到变化
        orderInfo.value.status = ORDER_STATUS.FINISHED
        // 通知工作台服务已结束
        uni.$emit('serviceEnded', {
          order: orderInfo.value,
          usedTime: usedText.value
        })
        uni.showToast({ title: '服务已结束', icon: 'success' })
        // 延迟返回
        setTimeout(() => {
          uni.navigateBack()
        }, 1000)
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
/* 已结束状态：调小底部padding，避免空白 */
.order-detail-finished {
  padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
}

:deep(.uni-nav-bar) {
  background: $bg-card !important;
  border-bottom: 1rpx solid $border-light !important;
}

/* 计时区域 */
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
/* 已结束计时区域：压缩高度，布局更紧凑 */
.timer-section-finished {
  padding-bottom: 32rpx;
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
    .distance {
      font-size: 24rpx;
      color: $primary;
      margin-top: 4rpx;
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
  padding: 20rpx 30rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid $border-light;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  z-index: 99;

  .btn-end {
    width: 100%;
    height: 90rpx;
    line-height: 90rpx;
    background: $danger;
    color: #fff;
    border-radius: 45rpx;
    font-size: 30rpx;
    font-weight: bold;
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
    height: 72rpx;
    line-height: 72rpx;
    background: transparent;
    color: $text-tertiary;
    border: none;
    font-size: 26rpx;
    text-decoration: underline;
    &::after { border: none; }
  }
}

:deep(.uni-button) {
  border: none;
  box-shadow: none;
  outline: none;
}
</style>