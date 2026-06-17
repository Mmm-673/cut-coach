<template>
  <view class="workbench-wrapper">
    <!-- 顶部标题栏 -->
    <uni-nav-bar
      title="裁教工作台"
      left-icon=""
      :fixed="false"
      :border="false"
      backgroundColor="transparent"
      titleColor="#111"
    >
      <template #right>
        <view class="notice-icon" @click="handleNotice">
          <uni-icons type="notification" size="24" color="#333"></uni-icons>
        </view>
      </template>
    </uni-nav-bar>

    <!-- 工作状态卡片 -->
    <uni-card :is-shadow="true" :border="false">
      <view class="status-row">
        <text class="status-label">工作状态</text>
        <view class="switch-group">
          <text class="switch-text" :class="{ 'active': !isOnline }">下线</text>
          <uni-data-checkbox
            v-model="switchValue"
            :localdata="switchOptions"
            type="button"
            selectedColor="#00C531"
            @change="onSwitchChange"
          />
          <text class="switch-text" :class="{ 'active': isOnline }">上线</text>
        </view>
      </view>
      <text class="status-desc" :class="isOnline ? 'online' : 'offline'">
        {{ isOnline ? '在线接单中' : '已下线，不接收新订单' }}
      </text>
    </uni-card>

    <!-- 空订单状态 -->
    <uni-card v-if="!isOnline || (isOnline && orderStatus === 'idle')" :is-shadow="true" :border="false">
      <view class="empty-order">
        <view class="empty-icon">
          <uni-icons type="paperplane" size="60" color="#E5E7EB"></uni-icons>
        </view>
        <text class="empty-text">暂无新订单邀请</text>
      </view>
    </uni-card>

    <!-- 待接单状态 -->
    <uni-card v-else-if="orderStatus === 'pending'" :is-shadow="true" :border="false">
      <view class="pending-order">
        <view class="pending-header">
          <view class="location">
            <uni-icons type="location-filled" size="18" color="#2F6BEE"></uni-icons>
            <text class="location-text">XX台球厅（XX路店）</text>
          </view>
          <uni-tag text="剩余" type="warning" size="small"  style="font-weight: bold"/>
          <text class="countdown-tag">{{ pendingCountdownText }}</text>
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
    </uni-card>

    <!-- 服务中状态 -->
    <uni-card v-else-if="orderStatus === 'serving'" :is-shadow="true" :border="false">
      <view class="serving-order">
        <view class="serving-header">
          <text class="serving-title">进行中服务</text>
          <text class="serving-countdown">剩余时长 {{ servingLeftTimeText }}</text>
        </view>
        <view class="serving-timer">
          <text class="timer-text">{{ servingUsedTimeText }}</text>
          <text class="timer-desc">已服务时长</text>
        </view>
        <button class="end-service-btn" @click="endService">结束服务</button>

        <uni-section title="订单详情" type="line">
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
        </uni-section>
      </view>
    </uni-card>

    <!-- 历史订单卡片 -->
    <uni-card title="历史订单" :is-shadow="true" :border="false" extra="查看全部 >" @click="viewMoreOrders">
      <uni-segmented-control :current="currentTab" :values="tabs" @clickItem="onTabClick" style-type="button" activeColor="#2F6BEE" />
      <uni-list>
        <uni-list-item
          v-for="(item, index) in historyOrders"
          :key="index"
          :title="item.name"
          :note="item.time"
          :rightText="'¥' + item.price"
          clickable
        />
      </uni-list>
    </uni-card>

    <!-- 今日数据 -->
    <uni-section title="今日数据" type="line">
      <uni-grid :column="3" :showBorder="false">
        <uni-grid-item v-for="(item, index) in todayData" :key="index">
          <view class="data-item">
            <view class="data-icon" :style="{ backgroundColor: item.bgColor }">
              <uni-icons :type="item.icon" size="20" :color="item.color"></uni-icons>
            </view>
            <text class="data-value">{{ item.value }}</text>
            <text class="data-label">{{ item.label }}</text>
            <uni-tag text="实时" style="font-weight: bold" type="success" size="mini" class="real-time-tag" />
          </view>
        </uni-grid-item>
      </uni-grid>
    </uni-section>
  </view>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { makePhoneCall } from '@/utils/platform'

const isOnline = ref(false)
const orderStatus = ref('idle')
const switchValue = ref([0])
const switchOptions = ref([
  { value: 0, text: '' },
  { value: 1, text: '' }
])
const currentTab = ref(0)
const tabs = ref(['已完成', '已取消'])

let pendingTimer = null
const pendingCountdown = ref(150)
const pendingCountdownText = ref('2分30秒')

let servingUsedTimer = null
let servingLeftTimer = null
const servingUsedSec = ref(0)
const servingUsedTimeText = ref('00:00')
const servingLeftSec = ref(2112)
const servingLeftTimeText = ref('00:35:12')

const historyOrders = ref([
  { name: '中式八球陪练 1小时', time: '今天 14:30 · XX台球厅', price: '120' },
  { name: '斯诺克教学 2小时', time: '今天 10:00 · XX台球俱乐部', price: '300' }
])

const todayData = ref([
  { icon: 'clock', value: '2小时30分', label: '今日上钟时长', color: '#2F6BEE', bgColor: '#EFF6FF' },
  { icon: 'checkbox', value: '3单', label: '今日服务次数', color: '#10B981', bgColor: '#ECFDF5' },
  { icon: 'wallet', value: '¥360', label: '预计今日收入', color: '#F59E0B', bgColor: '#FFF7ED' }
])

const formatMMSS = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const formatHHMMSS = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

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

const startServingTimer = () => {
  clearInterval(servingUsedTimer)
  clearInterval(servingLeftTimer)
  servingUsedSec.value = 0
  servingLeftSec.value = 2112

  servingUsedTimer = setInterval(() => {
    servingUsedSec.value++
    servingUsedTimeText.value = formatMMSS(servingUsedSec.value)
  }, 1000)

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

const onSwitchChange = (e) => {
  const val = e.value[0]
  isOnline.value = val === 1
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

const onTabClick = (e) => {
  currentTab.value = e.currentIndex
}

const handleNotice = () => {
  uni.showToast({ title: '消息通知', icon: 'none' })
}

const rejectOrder = () => {
  clearInterval(pendingTimer)
  orderStatus.value = 'idle'
}

const acceptOrder = () => {
  uni.showLoading({ title: '接单中...' })
  setTimeout(() => {
    uni.hideLoading()
    clearInterval(pendingTimer)
    orderStatus.value = 'serving'
    startServingTimer()
  }, 1000)
}

const endService = () => {
  clearInterval(servingUsedTimer)
  clearInterval(servingLeftTimer)
  orderStatus.value = 'idle'
  uni.showToast({ title: '服务已结束', icon: 'success' })
}

const navigate = () => {
  uni.showToast({ title: '跳转到导航', icon: 'none' })
}

const makeCall = () => {
  makePhoneCall('138****8888')
}

const viewMoreOrders = () => {
  uni.showToast({ title: '跳转到历史订单页', icon: 'none' })
}

onUnmounted(() => {
  clearInterval(pendingTimer)
  clearInterval(servingUsedTimer)
  clearInterval(servingLeftTimer)
})
</script>

<style lang="scss" scoped>
.workbench-wrapper {
  min-height: 100vh;
  background: #F7F8FA;
  padding: 20rpx;
}

.notice-icon {
  padding: 8rpx;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  .status-label {
    font-size: 32rpx;
    font-weight: 500;
    color: #222;
  }
  .switch-group {
    display: flex;
    align-items: center;
    gap: 20rpx;
    .switch-text {
      font-size: 26rpx;
      color: #666;
      &.active {
        color: #00C531;
        font-weight: 500;
      }
    }
  }
}

.status-desc {
  font-size: 26rpx;
  &.online {
    color: #00C531;
    font-weight: 500;
  }
  &.offline {
    color: #9CA3AF;
  }
}

.empty-order {
  text-align: center;
  padding: 70rpx 0;
  .empty-icon {
    margin-bottom: 24rpx;
  }
  .empty-text {
    font-size: 28rpx;
    color: #999;
    margin-top: 10rpx;
  }
}

.pending-order {
  .pending-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    .location {
      display: flex;
      align-items: center;
      gap: 8rpx;
      .location-text {
        font-size: 30rpx;
        color: #222;
        font-weight: 500;
      }
    }
    .countdown-tag {
      color: #F43F50;
      font-size: 24rpx;
      margin-left: 8rpx;
    }
  }
  .pending-info {
    margin-bottom: 32rpx;
    .order-name {
      font-size: 34rpx;
      font-weight: bold;
      color: #111;
      margin-bottom: 12rpx;
      display: block;
    }
    .order-price {
      font-size: 44rpx;
      font-weight: bold;
      color: #111;
    }
  }
  .pending-buttons {
    display: flex;
    gap: 24rpx;
    .btn {
      flex: 1;
      height: 88rpx;
      border-radius: 16rpx;
      font-size: 30rpx;
      font-weight: 500;
      border: none;
    }
    .reject-btn {
      background: #F5F7F9;
      color: #666;
    }
    .accept-btn {
      background: #2F6BEE;
      color: #fff;
    }
  }
}

.serving-order {
  .serving-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    .serving-title {
      font-size: 32rpx;
      font-weight: bold;
    }
    .serving-countdown {
      font-size: 26rpx;
      color: #F43F50;
    }
  }
  .serving-timer {
    text-align: center;
    margin: 40rpx 0;
    .timer-text {
      font-size: 88rpx;
      font-weight: bold;
      color: #111;
      display: block;
    }
    .timer-desc {
      font-size: 26rpx;
      color: #888;
      margin-top: 8rpx;
    }
  }
  .end-service-btn {
    width: 100%;
    height: 92rpx;
    background: #F43F50;
    color: #fff;
    border-radius: 16rpx;
    font-size: 32rpx;
    font-weight: 500;
    margin-bottom: 40rpx;
    border: none;
  }
  .detail-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    .detail-left {
      display: flex;
      gap: 24rpx;
      .store-img {
        width: 120rpx;
        height: 120rpx;
        border-radius: 16rpx;
      }
      .store-info {
        flex: 1;
        .store-name {
          font-size: 30rpx;
          font-weight: 500;
          margin-bottom: 8rpx;
          display: block;
        }
        .contact {
          display: flex;
          align-items: center;
          gap: 12rpx;
          margin-bottom: 12rpx;
          .contact-text {
            font-size: 26rpx;
            color: #666;
          }
          .call-btn {
            background: #ECFDF5;
            border-radius: 8rpx;
            padding: 8rpx 12rpx;
            border: none;
            line-height: 1;
          }
        }
        .service-type {
          font-size: 26rpx;
          color: #666;
          margin-bottom: 8rpx;
          display: block;
        }
        .service-price {
          font-size: 28rpx;
          font-weight: bold;
          margin-bottom: 12rpx;
          display: block;
        }
        .add-time-tip {
          background: #FFF9EB;
          padding: 10rpx 14rpx;
          border-radius: 8rpx;
          text {
            font-size: 24rpx;
            color: #F59E0B;
          }
        }
      }
    }
    .nav-btn {
      background: #2F6BEE;
      color: #fff;
      font-size: 26rpx;
      padding: 12rpx 20rpx;
      border-radius: 12rpx;
      border: none;
    }
  }
}

.data-item {
  padding: 28rpx 20rpx;
  text-align: center;
  position: relative;
  .data-icon {
    width: 56rpx;
    height: 56rpx;
    border-radius: 14rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16rpx;
  }
  .data-value {
    font-size: 32rpx;
    font-weight: bold;
    color: #111;
    display: block;
  }
  .data-label {
    font-size: 24rpx;
    color: #888;
    margin-top: 4rpx;
    display: block;
  }
  .real-time-tag {
    position: absolute;
    top: 20rpx;
    right: 20rpx;
  }
}
</style>
