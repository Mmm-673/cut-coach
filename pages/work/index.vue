<template>
  <view class="workbench-wrapper">

    <!-- 工作状态卡片 -->
    <uni-card title="工作状态" :is-shadow="true" :border="false">
      <view class="status-row">
        <text class="status-label">当前状态</text>
        <view class="switch-wrapper">
          <text class="label-off" :class="{ active: !isOnline }">下线</text>
          <view
              class="custom-switch"
              :class="{ 'is-checked': isOnline, 'is-disabled': switchLoading }"
              @click="handleSwitchClick"
          >
            <view class="switch-knob"></view>
          </view>
          <text class="label-on" :class="{ active: isOnline }">上线</text>
        </view>
      </view>
      <uni-tag
          :text="isOnline ? '在线接单中' : '已下线，不接收新订单'"
          :type="isOnline ? 'success' : 'default'"
          size="normal"
          class="status-tag"
      />
    </uni-card>

    <!-- 空订单状态 -->
    <uni-card v-if="!isOnline || orderStatus === 'idle'" :is-shadow="true" :border="false">
      <view class="empty-order">
        <uni-icons type="list" size="80" color="#B0B4BC"></uni-icons>
        <text class="empty-text">暂无新订单邀请</text>
      </view>
    </uni-card>

    <!-- 待接单状态 -->
    <uni-card v-else-if="orderStatus === 'pending'" :is-shadow="true" :border="false">
      <view class="pending-order">
        <view class="pending-header">
          <view class="location">
            <uni-icons type="location" size="18" color="#2F6BEE"></uni-icons>
            <text class="location-text">{{ pendingOrder.venueName }}</text>
          </view>
          <view class="countdown" v-if="pendingOrder.expireAt">
            <uni-tag text="剩余" type="warning" size="small" />
            <text class="time-text">{{ pendingCountdownText }}</text>
          </view>
        </view>

        <view class="order-info">
          <text class="order-name">{{ pendingOrder.serviceType === 1 ? '台球陪练' : '陪游' }} {{ Math.round(pendingOrder.serviceDuration / 60) }}分钟</text>
          <text class="order-price">¥{{ (pendingOrder.totalAmount / 100).toFixed(2) }}</text>
        </view>

        <view class="order-detail-row">
          <text class="detail-label">预约时间：</text>
          <text class="detail-value">{{ formatTime(pendingOrder.bookingTime) }}</text>
        </view>
        <view class="order-detail-row">
          <text class="detail-label">球厅地址：</text>
          <text class="detail-value">{{ pendingOrder.venueAddress }}</text>
        </view>
        <view class="order-detail-row">
          <text class="detail-label">下单时间：</text>
          <text class="detail-value">{{ formatTime(pendingOrder.createTime) }}</text>
        </view>

        <view class="btn-group">
          <button class="btn btn-reject" @click="rejectOrder">拒绝</button>
          <button class="btn btn-accept" @click="acceptOrder">接单</button>
        </view>
      </view>
    </uni-card>

    <!-- 已接单待出发状态 -->
    <uni-card v-else-if="orderStatus === 'accepted'" title="已接单" :is-shadow="true" :border="false">
      <view class="accepted-order">
        <view class="order-info-header">
          <text class="order-title">{{ pendingOrder.serviceType === 1 ? '台球陪练' : '陪游' }}</text>
          <uni-tag text="待出发" type="warning" size="small" />
        </view>

        <view class="order-detail-row">
          <text class="detail-label">预约时间：</text>
          <text class="detail-value">{{ formatTime(pendingOrder.bookingTime) }}</text>
        </view>
        <view class="order-detail-row">
          <text class="detail-label">球厅：</text>
          <text class="detail-value">{{ pendingOrder.venueName }}</text>
        </view>
        <view class="order-detail-row">
          <text class="detail-label">地址：</text>
          <text class="detail-value">{{ pendingOrder.venueAddress }}</text>
        </view>

        <view class="btn-group" v-if="!pendingOrder.departureConfirmTime">
          <button class="btn btn-confirm-depart" @click="confirmDeparture">确认出发</button>
        </view>

        <view class="status-hint" v-else>
          <uni-icons type="checkmarkempty" size="20" color="#10B981"></uni-icons>
          <text class="hint-text">已确认出发，请尽快前往服务地点</text>
        </view>

        <view class="btn-group" v-if="pendingOrder.departureConfirmTime && !pendingOrder.arriveTime">
          <button class="btn btn-arrive" @click="arrive">到达服务地址</button>
        </view>

        <view class="status-hint" v-if="pendingOrder.arriveTime">
          <uni-icons type="checkmarkempty" size="20" color="#10B981"></uni-icons>
          <text class="hint-text">已到达服务地点，请等待用户确认</text>
        </view>

        <view class="btn-group" v-if="pendingOrder.arriveTime">
          <button class="btn btn-accept" @click="startService">开始服务</button>
        </view>

        <view class="nav-row">
          <button class="nav-btn" @click="navigate">
            <uni-icons type="location" size="16" color="#fff"></uni-icons>
            <text>导航</text>
          </button>
          <button class="call-btn" @click="makeCall">
            <uni-icons type="phone" size="16" color="#10B981"></uni-icons>
            <text>联系客户</text>
          </button>
        </view>
      </view>
    </uni-card>

    <!-- 服务中状态 -->
    <uni-card v-else-if="orderStatus === 'serving'" title="进行中服务" :is-shadow="true" :border="false">
      <view class="serving-order">
        <view class="serve-top">
          <text class="left-time">剩余时长 {{ servingLeftTimeText }}</text>
        </view>

        <view class="timer-box">
          <text class="big-time">{{ servingUsedTimeText }}</text>
          <text class="time-desc">已服务时长</text>
        </view>

        <button class="btn-end" @click="endService">结束服务</button>

        <uni-section title="订单详情" type="line" margin-top="20rpx" >
          <view class="detail-box" @click="goToDetail">
            <image class="shop-img" :src="pendingOrder.shopImg || 'https://picsum.photos/120/120'" mode="aspectFill"></image>
            <view class="info">
              <text class="shop-name">{{ pendingOrder.venueName }}</text>
              <view class="contact-row">
                <text>客户：{{ pendingOrder.userPhone }}</text>
                <button class="call-btn" @click.stop="makeCall">
                  <uni-icons type="phone" size="16" color="#10B981"></uni-icons>
                </button>
              </view>
              <text class="service-name">{{ pendingOrder.serviceType === 1 ? '台球陪练' : '陪游' }}</text>
              <text class="service-price">¥{{ (pendingOrder.totalAmount / 100).toFixed(2) }}</text>
              <view class="tip-box">
                <uni-icons type="info" size="14" color="#F59E0B"></uni-icons>
                <text>支持客户加钟，时长自动更新</text>
              </view>
            </view>
            <button class="nav-btn" @click.stop="navigate">导航</button>
          </view>
        </uni-section>
      </view>
    </uni-card>

    <!-- 今日数据 -->
    <uni-section title="今日数据" type="line">
      <view class="data-grid">
        <view class="data-card" v-for="(item, i) in todayData" :key="i">
          <view class="data-icon" :style="{ background: item.bgColor }">
            <uni-icons :type="item.icon" size="20" :color="item.color"></uni-icons>
          </view>
          <text class="data-value">{{ item.value }}</text>
          <text class="data-label">{{ item.label }}</text>
          <uni-tag text="实时" type="success" size="mini" class="real-tag"></uni-tag>
        </view>
      </view>
    </uni-section>

    <!-- 历史订单 -->
    <uni-card
        :is-shadow="true"
        :border="false"
    >
      <view class="card-header">
        <text class="card-title">历史订单</text>
        <text class="view-all-text" @click="goToAllOrder">查看全部</text>
      </view>
      <uni-segmented-control
          :current="currentTab"
          :values="tabs"
          activeColor="#2F6BEE"
          style-type="button"
          class="history-tabs"
          @clickItem="onTabClick"
      />
      <view class="history-order-list">
        <view class="history-order-item" v-for="(item, index) in displayOrders" :key="index">
          <view class="order-top">
            <text class="order-title">{{ item.name }}</text>
            <text class="order-price">¥{{ item.price }}</text>
          </view>
          <view class="order-bottom">
            <text class="order-time">{{ item.time }}</text>
            <uni-tag
                :text="currentTab === 0 ? '已完成' : '已取消'"
                :type="currentTab === 0 ? 'success' : 'default'"
                size="small"
            />
          </view>
        </view>
      </view>
    </uni-card>

  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import {
  updateWorkStatus,
  updateLocation
} from '@/api/billiard/coach'
import {
  getPendingOrders,
  acceptOrder as acceptOrderApi,
  confirmDeparture as confirmDepartureApi,
  arrive as arriveApi,
  rejectOrder as rejectOrderApi,
  startService as startServiceApi,
  finishService as finishServiceApi
} from '@/api/billiard/order'
import {
  getLocation,
  openMapNavigation,
  makePhoneCall as makePhoneCallUtil,
  showLocationPermissionGuide,
  getPlatform
} from '@/utils/platform'

const { proxy } = getCurrentInstance()

// ====================== 基础状态 ======================
const isOnline = ref(false)
const orderStatus = ref('idle') // idle, pending, accepted, serving
const currentTab = ref(0)
const tabs = ref(['已完成', '已取消'])
const switchLoading = ref(false)

// 轮询相关
let pollTimer = null
let pendingTimer = null
let usedTimer = null
let leftTimer = null

// 待接单数据
const pendingOrder = ref({})
const pendingCountdown = ref(0)
const pendingCountdownText = ref('0分0秒')

// 服务计时
const usedSec = ref(0)
const servingUsedTimeText = ref('00:00')
const leftSec = ref(3600)
const servingLeftTimeText = ref('01:00:00')

// 数据 - 已完成订单
const completedOrders = ref([
  { name: '中式八球陪练 1小时', time: '今天 14:30 · XX台球厅', price: '120' },
  { name: '斯诺克教学 2小时', time: '今天 10:00 · XX台球俱乐部', price: '300' }
])

// 数据 - 已取消订单
const cancelledOrders = ref([
  { name: '中式八球陪练 2小时', time: '昨天 16:00 · XX台球馆', price: '200' },
  { name: '斯诺克陪练 1小时', time: '昨天 11:30 · XX俱乐部', price: '150' }
])

const displayOrders = ref(completedOrders.value)

const todayData = ref([
  { icon: 'calendar', value: '2小时30分', label: '今日上钟时长', color: '#2F6BEE', bgColor: '#EFF6FF' },
  { icon: 'checkbox', value: '3单', label: '今日服务次数', color: '#10B981', bgColor: '#ECFDF5' },
  { icon: 'wallet', value: '¥360', label: '预计收入', color: '#F59E0B', bgColor: '#FFF7ED' }
])

// 时间格式化
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

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
}

// 获取位置（使用多端兼容工具）
const getPlatformLocation = () => {
  return getLocation({
    type: 'gcj02',
    highAccuracy: true,
    timeout: 10000
  })
}

// 开关点击+下线二次确认逻辑
const handleSwitchClick = () => {
  if (switchLoading.value) return
  const targetStatus = !isOnline.value

  if (targetStatus) {
    onSwitchChange(targetStatus)
    return
  }

  let confirmText = '确认下线吗？下线后将无法接收新订单'
  if (orderStatus.value === 'serving') {
    confirmText = '您当前有正在进行中的服务，确认下线将强制结束服务，是否继续？'
  }

  uni.showModal({
    title: '确认下线',
    content: confirmText,
    success: (res) => {
      if (res.confirm) {
        onSwitchChange(targetStatus)
      }
    }
  })
}

// 开关切换逻辑 - 对接API
const onSwitchChange = async (targetStatus) => {
  switchLoading.value = true

  try {
    let locationData = {}
    if (targetStatus) {
      try {
        const loc = await getPlatformLocation()
        locationData = {
          longitude: loc.longitude,
          latitude: loc.latitude
        }
      } catch (err) {
        console.warn('获取位置失败', err)
        // 显示权限引导
        uni.showModal({
          title: '需要位置权限',
          content: '上线需要获取位置信息，请授权位置权限',
          confirmText: '去设置',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              showLocationPermissionGuide()
            }
          }
        })
        switchLoading.value = false
        return
      }
    }

    await updateWorkStatus({
      workStatus: targetStatus ? 1 : 0,
      ...locationData
    })

    isOnline.value = targetStatus

    if (isOnline.value) {
      // 上线后开始轮询
      startPolling()
    } else {
      // 下线，停止轮询，清空所有状态
      stopPolling()
      orderStatus.value = 'idle'
      clearInterval(pendingTimer)
      clearInterval(usedTimer)
      clearInterval(leftTimer)
    }

    proxy.$modal.msgSuccess(targetStatus ? '已上线' : '已下线')
  } catch (err) {
    console.error('切换状态失败', err)
    proxy.$modal.msgError(err?.msg || '操作失败')
  } finally {
    switchLoading.value = false
  }
}

// 开始轮询待接单列表
const startPolling = () => {
  stopPolling()
  // 立即查询一次
  fetchPendingOrders()
  // 5秒轮询
  pollTimer = setInterval(() => {
    if (orderStatus.value === 'idle') {
      fetchPendingOrders()
    }
  }, 5000)
}

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// 查询待接单列表
const fetchPendingOrders = async () => {
  try {
    // const res = await getPendingOrders()
    const res  = {"code":0,"msg":"","data":{"total":1,"list":[{"orderId":22,"orderNo":"20260331141626630416","userPhone":"138****8000","venueName":"Mock球厅-9","venueAddress":"Mock地址-9","venueLongitude":116.397128,"venueLatitude":39.916527,"serviceType":1,"bookingTime":0,"serviceDuration":120,"totalAmount":20000,"expireAt":1874938103000,"createTime":1774937787000}]}}
    if (res.data && res.data?.list?.length > 0) {
      // 有待接单，停止轮询
      stopPolling()
      pendingOrder.value = res.data.list[0]
      orderStatus.value = 'pending'

      // 计算倒计时
      if (pendingOrder.value.expireAt) {
        const now = Date.now()
        const expire = new Date(pendingOrder.value.expireAt).getTime()
        pendingCountdown.value = Math.max(0, Math.floor((expire - now) / 1000))
        startPendingCountdown()
      }
    }
  } catch (err) {
    console.error('查询待接单失败', err)
  }
}

// 待接单倒计时
const startPendingCountdown = () => {
  clearInterval(pendingTimer)
  pendingTimer = setInterval(() => {
    pendingCountdown.value--
    if (pendingCountdown.value <= 0) {
      clearInterval(pendingTimer)
      orderStatus.value = 'idle'
      // 恢复轮询
      startPolling()
      uni.showToast({ title: '订单已超时', icon: 'none' })
      return
    }
    const m = Math.floor(pendingCountdown.value / 60)
    const s = pendingCountdown.value % 60
    pendingCountdownText.value = `${m}分${s}秒`
  }, 1000)
}

// 拒单
const rejectOrder = () => {
  uni.showModal({
    title: '确认拒绝',
    content: '确定要拒绝此订单吗？',
    editable: true,
    placeholderText: '请输入拒单原因（可选）',
    success: async (res) => {
      if (res.confirm) {
        try {
          await rejectOrderApi({
            orderId: pendingOrder.value.orderId,
            rejectReason: res.content || ''
          })
          clearInterval(pendingTimer)
          orderStatus.value = 'idle'
          cancelledOrders.value.unshift({
            name: pendingOrder.value.serviceType === 1 ? '台球陪练' : '陪游',
            time: `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2,'0')} · ${pendingOrder.value.venueName}`,
            price: (pendingOrder.value.totalAmount / 100).toFixed(2)
          })
          // 恢复轮询
          startPolling()
          uni.showToast({ title:'已拒绝' })
        } catch (err) {
          console.error('拒单失败', err)
          proxy.$modal.msgError(err?.msg || '拒单失败')
        }
      }
    }
  })
}

// 接单
const acceptOrder = async () => {
  uni.showLoading({ title:'接单中...' })
  try {
    await acceptOrderApi({
      orderId: pendingOrder.value.orderId
    })
    uni.hideLoading()
    clearInterval(pendingTimer)
    orderStatus.value = 'accepted'
    uni.showToast({ title: '接单成功', icon: 'success' })
  } catch (err) {
    uni.hideLoading()
    console.error('接单失败', err)
    proxy.$modal.msgError(err?.msg || '接单失败')
  }
}

// 确认出发
const confirmDeparture = async () => {
  try {
    await confirmDepartureApi({
      orderId: pendingOrder.value.orderId
    })
    pendingOrder.value.departureConfirmTime = new Date().toISOString()
    uni.showToast({ title: '已确认出发', icon: 'success' })
  } catch (err) {
    console.error('确认出发失败', err)
    proxy.$modal.msgError(err?.msg || '操作失败')
  }
}

// 到达服务地址
const arrive = async () => {
  try {
    await arriveApi({
      orderId: pendingOrder.value.orderId
    })
    pendingOrder.value.arriveTime = new Date().toISOString()
    uni.showToast({ title: '已到达', icon: 'success' })
  } catch (err) {
    console.error('确认到达失败', err)
    proxy.$modal.msgError(err?.msg || '操作失败')
  }
}

// 开始服务
const startService = async () => {
  try {
    await startServiceApi({
      orderId: pendingOrder.value.orderId
    })
    orderStatus.value = 'serving'
    startServeTimer()
    uni.showToast({ title: '服务已开始', icon: 'success' })
  } catch (err) {
    console.error('开始服务失败', err)
    proxy.$modal.msgError(err?.msg || '操作失败')
  }
}

// 服务计时
const startServeTimer = () => {
  clearInterval(usedTimer)
  clearInterval(leftTimer)
  usedSec.value = 0
  leftSec.value = pendingOrder.value.serviceDuration || 3600

  usedTimer = setInterval(()=>{
    usedSec.value++
    servingUsedTimeText.value = fmtMMSS(usedSec.value)
  }, 1000)

  leftTimer = setInterval(()=>{
    if(leftSec.value <=0){
      clearInterval(leftTimer)
      clearInterval(usedTimer)
      uni.showToast({ title: '服务时长已到', icon: 'none' })
      return
    }
    leftSec.value--
    servingLeftTimeText.value = fmtHHMMSS(leftSec.value)
  }, 1000)
}

// 跳转到订单详情页
const goToDetail = () => {
  const params = encodeURIComponent(JSON.stringify(pendingOrder.value))
  uni.navigateTo({
    url: `/pages/order/detail?orderInfo=${params}&usedSec=${usedSec.value}&leftSec=${leftSec.value}`
  })
}

// 结束服务
const endService = () => {
  uni.showModal({
    title: '确认结束',
    content: '确定要结束当前服务吗？',
    success: async (res) => {
      if(res.confirm){
        try {
          await finishServiceApi({
            orderId: pendingOrder.value.orderId
          })
          clearInterval(usedTimer)
          clearInterval(leftTimer)
          orderStatus.value = 'idle'
          completedOrders.value.unshift({
            name: pendingOrder.value.serviceType === 1 ? '台球陪练' : '陪游',
            time: `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2,'0')} · ${pendingOrder.value.venueName}`,
            price: (pendingOrder.value.totalAmount / 100).toFixed(2)
          })
          todayData.value[0].value = '3小时30分'
          todayData.value[1].value = '4单'
          todayData.value[2].value = '¥480'
          // 恢复轮询
          startPolling()
          uni.showToast({ title:'服务已结束', icon:'success' })
        } catch (err) {
          console.error('结束服务失败', err)
          proxy.$modal.msgError(err?.msg || '操作失败')
        }
      }
    }
  })
}

// 导航（多端兼容）
const navigate = () => {
  const lat = pendingOrder.value.venueLatitude
  const lon = pendingOrder.value.venueLongitude
  const shopName = pendingOrder.value.venueName
  const address = pendingOrder.value.venueAddress

  openMapNavigation({
    latitude: lat,
    longitude: lon,
    name: shopName,
    address: address,
    mode: 'driving'
  })
}

// 打电话（多端兼容）
const makeCall = () => {
  const phoneNumber = pendingOrder.value.userPhone || '13800008888'
  makePhoneCallUtil(phoneNumber)
}

// 标签切换
const onTabClick = (e) => {
  currentTab.value = e.currentIndex
  displayOrders.value = e.currentIndex === 0 ? completedOrders.value : cancelledOrders.value
}

// 查看全部订单
const goToAllOrder = () => {
  uni.showToast({ title:'跳转到全部订单页', icon:'none' })
}

onMounted(() => {
  // 上线状态下进入页面时开始轮询
  if (isOnline.value) {
    startPolling()
  }
})

onUnmounted(() => {
  stopPolling()
  clearInterval(pendingTimer)
  clearInterval(usedTimer)
  clearInterval(leftTimer)
})
</script>

<style lang="scss" scoped>
:deep(.uni-button) {
  border: none;
  box-shadow: none;
  outline: none;
}
:deep(.uni-card) {
  margin: 0 !important;
  border-radius: $radius-xl !important;
  box-shadow: $shadow-base;
}
:deep(.uni-card .uni-card__header) {
  padding: 20rpx 24rpx !important;
  border-bottom: 1rpx solid $border-light;
  font-weight: bold;
  color: $text-primary;
}
:deep(.uni-card .uni-card__content) {
  padding: 24rpx !important;
}
:deep(.uni-section .uni-section__header) {
  padding: 0 4rpx 12rpx !important;
}

.workbench-wrapper {
  min-height: 100vh;
  background: $bg-page;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 20rpx 0;
  border-bottom: 1rpx solid $border-light;
  .status-label {
    font-size: 28rpx;
    font-weight: bold;
    color: $text-primary;
  }
}
.status-tag {
  margin-top: 20rpx;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
  .label-off, .label-on {
    font-size: 26rpx;
    color: $text-tertiary;
  }
  .active {
    color: $success;
    font-weight: bold;
  }
}

.custom-switch {
  width: 88rpx;
  height: 48rpx;
  border-radius: 24rpx;
  background: $border;
  position: relative;
  transition: all $duration-base $ease-out;
  flex-shrink: 0;
  cursor: pointer;

  .switch-knob {
    position: absolute;
    top: 4rpx;
    left: 4rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: #fff;
    transition: all $duration-base $ease-out;
    box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.1);
  }

  &.is-checked {
    background: $success;
    .switch-knob {
      left: calc(100% - 44rpx);
    }
  }

  &.is-disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

.empty-order {
  min-height: 320rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .empty-text {
    margin-top: 24rpx;
    font-size: 28rpx;
    color: $text-secondary;
  }
}

.pending-header, .order-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  .location {
    display: flex;
    align-items: center;
    gap: 6rpx;
    .location-text {
      font-size: 26rpx;
      color: $text-primary;
    }
  }
  .countdown {
    display: flex;
    align-items: center;
    gap: 6rpx;
    .time-text {
      font-size: 26rpx;
      color: $warning;
      font-weight: bold;
    }
  }
  .order-title {
    font-size: 30rpx;
    font-weight: bold;
    color: $text-primary;
  }
}

.order-info {
  margin-bottom: 24rpx;
  .order-name {
    font-size: 30rpx;
    font-weight: bold;
    display: block;
    margin-bottom: 8rpx;
    color: $text-primary;
  }
  .order-price {
    font-size: 36rpx;
    color: $primary;
    font-weight: bold;
  }
}

.order-detail-row {
  display: flex;
  padding: 8rpx 0;
  .detail-label {
    font-size: 24rpx;
    color: $text-tertiary;
    width: 160rpx;
    flex-shrink: 0;
  }
  .detail-value {
    font-size: 24rpx;
    color: $text-secondary;
    flex: 1;
  }
}

.btn-group {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
  .btn {
    height: 72rpx;
    line-height: 72rpx;
    font-size: 26rpx;
    border-radius: $radius-base;
    flex: 1;
    font-weight: 600;
    transition: transform $duration-fast;
    &:active {
      transform: scale(0.97);
    }
  }
  .btn-reject {
    background: $danger;
    color: #fff;
  }
  .btn-accept {
    background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
    color: #fff;
  }
  .btn-confirm-depart, .btn-arrive {
    background: $success;
    color: #fff;
  }
}

.status-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 20rpx;
  background: $success-light;
  border-radius: $radius-base;
  margin-top: 24rpx;
  .hint-text {
    font-size: 26rpx;
    color: $success;
  }
}

.nav-row {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
  .nav-btn, .call-btn {
    flex: 1;
    height: 72rpx;
    border-radius: $radius-base;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    font-size: 26rpx;
    padding: 0;
    margin: 0;
    font-weight: 500;
    transition: transform $duration-fast;
    &:active {
      transform: scale(0.97);
    }
  }
  .nav-btn {
    background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
    color: #fff;
  }
  .call-btn {
    background: $success-light;
    color: $success;
  }
}

.accepted-order {
  .order-info-header {
    margin-bottom: 16rpx;
  }
}

.serve-top {
  .left-time {
    font-size: 26rpx;
    color: $primary;
    font-weight: bold;
  }
}
.timer-box {
  text-align: center;
  padding: 32rpx 0;
  background: $bg-page;
  border-radius: $radius-base;
  margin: 24rpx 0;
  .big-time {
    font-size: 64rpx;
    font-weight: bold;
    color: $text-primary;
    display: block;
  }
  .time-desc {
    font-size: 24rpx;
    color: $text-tertiary;
    margin-top: 8rpx;
  }
}
.btn-end {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background: $danger;
  color: #fff;
  border-radius: $radius-base;
  font-size: 28rpx;
  font-weight: 600;
  transition: transform $duration-fast;
  &:active {
    transform: scale(0.97);
  }
}
.detail-box {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 16rpx;
  .shop-img {
    width: 120rpx;
    height: 120rpx;
    border-radius: $radius-base;
  }
  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    .shop-name {
      font-size: 28rpx;
      font-weight: bold;
      color: $text-primary;
    }
    .contact-row {
      display: flex;
      align-items: center;
      gap: 8rpx;
      font-size: 24rpx;
      color: $text-secondary;
      .call-btn {
        background: transparent;
        padding: 0;
        width: 32rpx;
        height: 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        margin: 0;
      }
    }
    .service-name {
      font-size: 26rpx;
      color: $text-secondary;
    }
    .service-price {
      font-size: 28rpx;
      color: $primary;
      font-weight: bold;
    }
    .tip-box {
      display: flex;
      align-items: center;
      gap: 4rpx;
      font-size: 22rpx;
      color: $warning;
      margin-top: 4rpx;
    }
  }
  .nav-btn {
    background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
    color: #fff;
    border-radius: $radius-sm;
    font-size: 24rpx;
    height: 60rpx;
    padding: 0 20rpx;
    line-height: 60rpx;
    margin: 0;
  }
}

.data-grid {
  display: flex;
  gap: 16rpx;
  margin-top: 12rpx;
}
.data-card {
  flex: 1;
  background: $bg-card;
  border-radius: $radius-xl;
  padding: 24rpx 16rpx;
  text-align: center;
  position: relative;
  border: 1rpx solid $border-light;
  transition: transform $duration-base $ease-out, box-shadow $duration-base $ease-out;

  &:active {
    transform: translateY(-4rpx);
    box-shadow: $shadow-lg;
  }

  .data-icon {
    width: 48rpx;
    height: 48rpx;
    border-radius: $radius-base;
    margin: 0 auto 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .data-value {
    font-size: 28rpx;
    font-weight: bold;
    display: block;
    margin-bottom: 8rpx;
    color: $text-primary;
  }
  .data-label {
    font-size: 24rpx;
    color: $text-tertiary;
  }
  .real-tag {
    transform: scale(0.75);
    position: absolute;
    top: 8rpx;
    right: 8rpx;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid $border-light;
}
.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: $text-primary;
}

.view-all-text {
  font-size: 26rpx;
  color: $primary;
  padding: 8rpx 0;
  &:active {
    opacity: 0.7;
  }
}

.history-tabs {
  margin: 20rpx 0;
}
.history-order-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.history-order-item {
  padding: 20rpx;
  background: $bg-page;
  border-radius: $radius-base;
  .order-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8rpx;
    .order-title {
      font-size: 28rpx;
      font-weight: 500;
      color: $text-primary;
    }
    .order-price {
      font-size: 28rpx;
      color: $primary;
      font-weight: bold;
    }
  }
  .order-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .order-time {
      font-size: 24rpx;
      color: $text-tertiary;
    }
  }
}
</style>
