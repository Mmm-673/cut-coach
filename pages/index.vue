<template>
  <view class="workbench-wrapper">
    <!-- 顶部标题栏 -->
    <view class="header">
      <text class="title">助教工作台</text>
      <view class="notice-icon">
        <uni-icons type="notification" size="24" color="#333"></uni-icons>
      </view>
    </view>

    <!-- 工作状态卡片 -->
    <view class="card status-card">
      <view class="status-row">
        <text class="status-label">工作状态</text>
        <view class="switch-group">
          <text class="switch-text">下线</text>
          <switch :checked="isOnline" color="#00C531" @change="toggleOnline" />
          <text class="switch-text">上线</text>
        </view>
      </view>
      <text class="status-desc" :class="isOnline ? 'online' : 'offline'">
        {{ isOnline ? '在线接单中' : '已下线，不接收新订单' }}
      </text>
    </view>

    <!-- 空订单状态（下线/空闲时） -->
    <view class="card empty-order" v-if="!isOnline || (isOnline && orderStatus === 'idle')">
      <view class="empty-icon">
        <uni-icons type="paperplane" size="60" color="#E5E7EB"></uni-icons>
      </view>
      <text class="empty-text">暂无新订单邀请</text>
    </view>

    <!-- 待接单状态 -->
    <view class="card pending-order" v-else-if="orderStatus === 'pending'">
      <view class="pending-header">
        <view class="location">
          <uni-icons type="location-filled" size="18" color="#2F6BEE"></uni-icons>
          <text class="location-text">XX台球厅（XX路店）</text>
        </view>
        <view class="countdown-tag">剩余{{ pendingCountdownText }}</view>
      </view>
      <view class="pending-info">
        <text class="order-name">中式八球陪练 1小时</text>
        <text class="order-price">¥120</text>
      </view>
      <view class="pending-buttons">
        <button class="btn reject-btn" @click="rejectOrder">拒绝</button>
        <button class="btn accept-btn" @click="acceptOrder">接单</button>
      </view>
    </view>

    <!-- 服务中状态 -->
    <view class="card serving-order" v-else-if="orderStatus === 'serving'">
      <view class="serving-header">
        <text class="serving-title">进行中服务</text>
        <text class="serving-countdown">剩余时长 {{ servingLeftTimeText }}</text>
      </view>
      <view class="serving-timer">
        <text class="timer-text">{{ servingUsedTimeText }}</text>
        <text class="timer-desc">已服务时长</text>
      </view>
      <button class="end-service-btn" @click="endService">结束服务</button>

      <view class="order-detail">
        <text class="detail-title">订单详情</text>
        <view class="detail-content">
          <view class="detail-left">
            <image class="store-img" src="https://picsum.photos/120/120" mode="aspectFill"></image>
            <view class="store-info">
              <text class="store-name">XX台球厅（XX路店）</text>
              <view class="contact">
                <text class="contact-text">客户联系方式：138****8888</text>
                <button class="call-btn" @click="makeCall">
                  <uni-icons type="phone" size="18" color="#10B981"></uni-icons>
                </button>
              </view>
              <text class="service-type">中式八球陪练 1小时</text>
              <text class="service-price">¥120</text>
              <view class="add-time-tip">
                <text>支持客户加钟，时长自动更新</text>
              </view>
            </view>
          </view>
          <button class="nav-btn" @click="navigate">导航</button>
        </view>
      </view>
    </view>

    <!-- 历史订单卡片（所有状态都显示） -->
    <view class="card history-card">
      <view class="history-tabs">
        <text class="tab active">已完成</text>
        <text class="tab">已取消</text>
      </view>
      <view class="history-list">
        <view class="history-item" v-for="(item, index) in historyOrders" :key="index">
          <view class="item-left">
            <text class="item-name">{{ item.name }}</text>
            <text class="item-time">{{ item.time }}</text>
          </view>
          <text class="item-price">¥{{ item.price }}</text>
        </view>
      </view>
      <view class="view-more" @click="viewMoreOrders">
        <text>查看全部历史订单 ></text>
      </view>
    </view>

    <!-- 今日数据 -->
    <view class="today-data">
      <text class="data-title">今日数据</text>
      <view class="data-grid">
        <view class="data-item" v-for="(item, index) in todayData" :key="index">
          <view class="data-icon" :style="{ backgroundColor: item.bgColor }">
            <uni-icons :type="item.icon" size="20" :color="item.color"></uni-icons>
          </view>
          <text class="data-value">{{ item.value }}</text>
          <text class="data-label">{{ item.label }}</text>
          <text class="real-time-tag">实时</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

// 状态管理
const isOnline = ref(false) // 初始下线
const orderStatus = ref('idle') // idle/pending/serving

// 待接单倒计时（2分30秒 = 150秒）
let pendingTimer = null
const pendingCountdown = ref(150)
const pendingCountdownText = ref('2分30秒')

// 服务中计时器
let servingUsedTimer = null
let servingLeftTimer = null
const servingUsedSec = ref(0)
const servingUsedTimeText = ref('00:00')
const servingLeftSec = ref(2112) // 00:35:12 = 2112秒
const servingLeftTimeText = ref('00:35:12')

// 历史订单数据
const historyOrders = ref([
  { name: '中式八球陪练 1小时', time: '今天 14:30 · XX台球厅', price: '120' },
  { name: '斯诺克教学 2小时', time: '今天 10:00 · XX台球俱乐部', price: '300' }
])

// 今日数据
const todayData = ref([
  { icon: 'clock', value: '2小时30分', label: '今日上钟时长', color: '#2F6BEE', bgColor: '#EFF6FF' },
  { icon: 'checkbox', value: '3单', label: '今日服务次数', color: '#10B981', bgColor: '#ECFDF5' },
  { icon: 'wallet', value: '¥360', label: '预计今日收入', color: '#F59E0B', bgColor: '#FFF7ED' }
])

// 格式化时间：秒 → 分:秒
const formatMMSS = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 格式化时间：秒 → 时:分:秒
const formatHHMMSS = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 启动待接单倒计时
const startPendingTimer = () => {
  clearInterval(pendingTimer)
  pendingCountdown.value = 150
  pendingCountdownText.value = '2分30秒'
  pendingTimer = setInterval(() => {
    pendingCountdown.value--
    if (pendingCountdown.value <= 0) {
      clearInterval(pendingTimer)
      orderStatus.value = 'idle'
      return
    }
    const m = Math.floor(pendingCountdown.value / 60)
    const s = pendingCountdown.value % 60
    pendingCountdownText.value = `${m}分${s}秒`
  }, 1000)
}

// 启动服务中计时器
const startServingTimer = () => {
  clearInterval(servingUsedTimer)
  clearInterval(servingLeftTimer)
  servingUsedSec.value = 0
  servingLeftSec.value = 2112 // 初始剩余 00:35:12

  // 已服务时长累加
  servingUsedTimer = setInterval(() => {
    servingUsedSec.value++
    servingUsedTimeText.value = formatMMSS(servingUsedSec.value)
  }, 1000)

  // 剩余时长倒计时
  servingLeftTimer = setInterval(() => {
    if (servingLeftSec.value <= 0) {
      clearInterval(servingLeftTimer)
      clearInterval(servingUsedTimer)
      return
    }
    servingLeftSec.value--
    servingLeftTimeText.value = formatHHMMSS(servingLeftSec.value)
  }, 1000)
}

// 切换在线/下线
const toggleOnline = (e) => {
  isOnline.value = e.detail.value
  if (isOnline.value) {
    orderStatus.value = 'pending'
    startPendingTimer()
  } else {
    orderStatus.value = 'idle'
    clearInterval(pendingTimer)
    clearInterval(servingUsedTimer)
    clearInterval(servingLeftTimer)
  }
}

// 拒绝订单
const rejectOrder = () => {
  clearInterval(pendingTimer)
  orderStatus.value = 'idle'
}

// 接单
const acceptOrder = () => {
  uni.showLoading({ title: '接单中...' })
  setTimeout(() => {
    uni.hideLoading()
    clearInterval(pendingTimer)
    orderStatus.value = 'serving'
    startServingTimer()
  }, 1000)
}

// 结束服务
const endService = () => {
  clearInterval(servingUsedTimer)
  clearInterval(servingLeftTimer)
  orderStatus.value = 'idle'
  uni.showToast({ title: '服务已结束', icon: 'success' })
}

// 导航
const navigate = () => {
  uni.showToast({ title: '跳转到导航', icon: 'none' })
}

// 打电话
const makeCall = () => {
  uni.makePhoneCall({ phoneNumber: '138****8888' })
}

// 查看更多订单
const viewMoreOrders = () => {
  uni.showToast({ title: '跳转到历史订单页', icon: 'none' })
}

// 页面销毁时清除定时器
onUnmounted(() => {
  clearInterval(pendingTimer)
  clearInterval(servingUsedTimer)
  clearInterval(servingLeftTimer)
})
</script>

<style lang="scss" scoped>
.workbench-wrapper {
  min-height: 100vh;
  background-color: #F9FAFB;
  padding: 20rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;
  .title {
    font-size: 48rpx;
    font-weight: 600;
    color: #1F2937;
  }
}

.card {
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

/* 工作状态卡片 */
.status-card {
  .status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10rpx;
    .status-label {
      font-size: 32rpx;
      color: #1F2937;
    }
    .switch-group {
      display: flex;
      align-items: center;
      gap: 16rpx;
      .switch-text {
        font-size: 28rpx;
        color: #6B7280;
      }
    }
  }
  .status-desc {
    font-size: 28rpx;
    &.online {
      color: #00C531;
    }
    &.offline {
      color: #9CA3AF;
    }
  }
}

/* 空订单状态 */
.empty-order {
  text-align: center;
  padding: 60rpx 0;
  .empty-icon {
    margin-bottom: 20rpx;
  }
  .empty-text {
    font-size: 28rpx;
    color: #9CA3AF;
  }
}

/* 待接单状态 */
.pending-order {
  .pending-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    .location {
      display: flex;
      align-items: center;
      gap: 8rpx;
      .location-text {
        font-size: 32rpx;
        color: #1F2937;
      }
    }
    .countdown-tag {
      background-color: #FEE2E2;
      color: #EF4444;
      font-size: 24rpx;
      padding: 8rpx 16rpx;
      border-radius: 20rpx;
    }
  }
  .pending-info {
    margin-bottom: 30rpx;
    .order-name {
      font-size: 32rpx;
      color: #1F2937;
      display: block;
      margin-bottom: 10rpx;
    }
    .order-price {
      font-size: 40rpx;
      font-weight: 600;
      color: #1F2937;
    }
  }
  .pending-buttons {
    display: flex;
    gap: 20rpx;
    .btn {
      flex: 1;
      height: 80rpx;
      border-radius: 12rpx;
      font-size: 32rpx;
    }
    .reject-btn {
      background-color: #F3F4F6;
      color: #6B7280;
    }
    .accept-btn {
      background-color: #2F6BEE;
      color: #FFFFFF;
    }
  }
}

/* 服务中状态 */
.serving-order {
  .serving-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    .serving-title {
      font-size: 32rpx;
      color: #1F2937;
    }
    .serving-countdown {
      font-size: 28rpx;
      color: #EF4444;
    }
  }
  .serving-timer {
    text-align: center;
    margin-bottom: 30rpx;
    .timer-text {
      font-size: 80rpx;
      font-weight: 700;
      color: #1F2937;
      display: block;
    }
    .timer-desc {
      font-size: 28rpx;
      color: #9CA3AF;
    }
  }
  .end-service-btn {
    width: 100%;
    height: 90rpx;
    background-color: #EF4444;
    color: #FFFFFF;
    border-radius: 12rpx;
    font-size: 32rpx;
    margin-bottom: 40rpx;
  }
  .order-detail {
    .detail-title {
      font-size: 32rpx;
      color: #1F2937;
      display: block;
      margin-bottom: 20rpx;
    }
    .detail-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      .detail-left {
        display: flex;
        gap: 20rpx;
        .store-img {
          width: 120rpx;
          height: 120rpx;
          border-radius: 12rpx;
        }
        .store-info {
          .store-name {
            font-size: 32rpx;
            color: #1F2937;
            display: block;
            margin-bottom: 10rpx;
          }
          .contact {
            display: flex;
            align-items: center;
            gap: 10rpx;
            margin-bottom: 10rpx;
            .contact-text {
              font-size: 28rpx;
              color: #6B7280;
            }
            .call-btn {
              background-color: #ECFDF5;
              border-radius: 8rpx;
              padding: 8rpx;
            }
          }
          .service-type {
            font-size: 28rpx;
            color: #6B7280;
            display: block;
            margin-bottom: 10rpx;
          }
          .service-price {
            font-size: 32rpx;
            font-weight: 600;
            color: #1F2937;
            display: block;
            margin-bottom: 10rpx;
          }
          .add-time-tip {
            background-color: #FFFBEB;
            padding: 10rpx;
            border-radius: 8rpx;
            text {
              font-size: 24rpx;
              color: #F59E0B;
            }
          }
        }
      }
      .nav-btn {
        background-color: #2F6BEE;
        color: #FFFFFF;
        font-size: 28rpx;
        padding: 10rpx 20rpx;
        border-radius: 8rpx;
      }
    }
  }
}

/* 历史订单卡片 */
.history-card {
  .history-tabs {
    display: flex;
    gap: 40rpx;
    margin-bottom: 30rpx;
    .tab {
      font-size: 32rpx;
      color: #9CA3AF;
      &.active {
        color: #2F6BEE;
        font-weight: 600;
      }
    }
  }
  .history-list {
    .history-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
      .item-left {
        .item-name {
          font-size: 32rpx;
          color: #1F2937;
          display: block;
          margin-bottom: 8rpx;
        }
        .item-time {
          font-size: 26rpx;
          color: #9CA3AF;
        }
      }
      .item-price {
        font-size: 32rpx;
        font-weight: 600;
        color: #1F2937;
      }
    }
  }
  .view-more {
    text-align: center;
    margin-top: 20rpx;
    text {
      font-size: 28rpx;
      color: #2F6BEE;
    }
  }
}

/* 今日数据 */
.today-data {
  .data-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #1F2937;
    margin-bottom: 20rpx;
  }
  .data-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20rpx;
    .data-item {
      background-color: #FFFFFF;
      border-radius: 16rpx;
      padding: 20rpx;
      position: relative;
      .data-icon {
        width: 50rpx;
        height: 50rpx;
        border-radius: 10rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10rpx;
      }
      .data-value {
        font-size: 36rpx;
        font-weight: 600;
        color: #1F2937;
        display: block;
        margin-bottom: 4rpx;
      }
      .data-label {
        font-size: 24rpx;
        color: #9CA3AF;
      }
      .real-time-tag {
        position: absolute;
        top: 20rpx;
        right: 20rpx;
        font-size: 22rpx;
        color: #10B981;
      }
    }
  }
}
</style>