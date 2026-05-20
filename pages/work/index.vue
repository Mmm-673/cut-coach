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
      <view class="status-row">
        <text class="status-label">免费出行</text>
        <view class="switch-wrapper">
          <text class="label-off" :class="{ active: !isFreeTravel }">关闭</text>
          <view
              class="custom-switch"
              :class="{ 'is-checked': isFreeTravel, 'is-disabled': freeTravelLoading }"
              @click="handleFreeTravelSwitchClick"
          >
            <view class="switch-knob"></view>
          </view>
          <text class="label-on" :class="{ active: isFreeTravel }">开启</text>
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
          <uni-tag :text="pendingOrder.serviceType === 1 ? '待出发' : '待开始'" type="warning" size="small" />
        </view>

        <view class="order-detail-row">
          <text class="detail-label">预约时间：</text>
          <text class="detail-value">{{ formatTime(pendingOrder.bookingTime) }}</text>
        </view>
        <view class="order-detail-row" v-if="pendingOrder.serviceType === 1">
          <text class="detail-label">球厅：</text>
          <text class="detail-value">{{ pendingOrder.venueName }}</text>
        </view>
        <view class="order-detail-row" v-if="pendingOrder.serviceType === 1">
          <text class="detail-label">地址：</text>
          <text class="detail-value">{{ pendingOrder.venueAddress }}</text>
        </view>

        <!-- 陪练完整流程 -->
        <template v-if="pendingOrder.serviceType === 1">
          <view class="btn-group" v-if="!pendingOrder.departureConfirmTime">
            <button class="btn btn-confirm-depart" @click="confirmDeparture">确认出发</button>
          </view>

          <view class="status-hint" v-if="pendingOrder.departureConfirmTime && !pendingOrder.arriveTime">
            <uni-icons type="checkmarkempty" size="20" color="#10B981"></uni-icons>
            <text class="hint-text">已确认出发，请尽快前往教学地点</text>
          </view>

          <view class="btn-group" v-if="pendingOrder.departureConfirmTime && !pendingOrder.arriveTime">
            <button class="btn btn-arrive" @click="arrive">到达教学地址</button>
          </view>

          <view class="status-hint" v-if="pendingOrder.arriveTime">
            <uni-icons type="checkmarkempty" size="20" color="#10B981"></uni-icons>
            <text class="hint-text">已到达教学地点，开始教学</text>
          </view>
        </template>

        <!-- 陪游简化流程：接单后直接可以开始 -->
        <template v-else>
          <view class="status-hint" v-if="!pendingOrder.startTime">
            <uni-icons type="info" size="20" color="#007AFF"></uni-icons>
            <text class="hint-text">准备就绪，请开始服务</text>
          </view>
        </template>

        <!-- 开始服务按钮 - 陪练需要到达后才显示，陪游接单后就显示 -->
        <view class="btn-group" v-if="canStartService">
          <button class="btn btn-exception" v-if="pendingOrder.serviceType === 1" @click="showReportException">报告异常</button>
          <button class="btn btn-accept" @click="startService">开始服务</button>
        </view>

        <!-- 导航和联系客户 - 陪练显示 -->
        <view class="nav-row" v-if="pendingOrder.serviceType === 1">
          <button class="nav-btn" @click="navigate">
            <uni-icons type="location" size="16" color="#fff"></uni-icons>
            <text>导航</text>
          </button>
          <button class="call-btn" @click="makeCall">
            <uni-icons type="phone" size="16" color="#10B981"></uni-icons>
            <text>联系客户</text>
          </button>
        </view>

        <!-- 仅联系客户 - 陪游显示 -->
        <view class="nav-row" v-else>
          <button class="call-btn nav-btn" @click="makeCall">
            <uni-icons type="phone" size="16" color="#fff"></uni-icons>
            <text>联系客户</text>
          </button>
        </view>
      </view>
    </uni-card>

    <!-- 教学中状态 -->
    <uni-card v-else-if="orderStatus === 'serving'" title="进行中教学" :is-shadow="true" :border="false">
      <view class="serving-order">
        <view class="serve-top">
          <text class="left-time">剩余时长 {{ servingLeftTimeText }}</text>
        </view>

        <view class="timer-box">
          <text class="big-time">{{ servingUsedTimeText }}</text>
          <text class="time-desc">已教学时长</text>
        </view>

        <button class="btn-end" @click="endService">结束教学</button>

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
          :current="historyTabIndex"
          :values="historyTabs.map(t => t.label)"
          activeColor="#2F6BEE"
          style-type="button"
          class="history-tabs"
          @clickItem="onHistoryTabClick"
      />
      <view class="history-order-list">
        <view
            class="history-order-item"
            v-for="item in displayHistoryOrders"
            :key="item.orderId"
            @click="goToOrderDetail(item)"
        >
          <view class="order-top">
            <text class="order-title">{{ item.serviceType === 1 ? '台球陪练' : '陪游' }}</text>
            <text class="order-price">¥{{ (item.totalAmount / 100).toFixed(2) }}</text>
          </view>
          <view class="order-bottom">
            <text class="order-time">{{ formatOrderTime(item.bookingTime) }}</text>
            <uni-tag
                :text="getHistoryStatusText(item.status)"
                :type="getHistoryStatusType(item.status)"
                size="small"
            />
          </view>
        </view>
        <view class="empty-tip" v-if="!displayHistoryOrders.length">
          暂无订单
        </view>
      </view>
    </uni-card>

  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  updateWorkStatus,
  updateLocation,
  updateFreeTravel,
  getCoachDashboard,
  getWorkStatus
} from '@/api/billiard/coach'
import {
  getPendingOrders,
  getOrderDetail,
  getInProgressOrder,
  acceptOrder as acceptOrderApi,
  confirmDeparture as confirmDepartureApi,
  arrive as arriveApi,
  rejectOrder as rejectOrderApi,
  startService as startServiceApi,
  finishService as finishServiceApi,
  getOrderPage,
  reportException as reportExceptionApi,
  startTimer as startTimerApi,
  endTimer as endTimerApi,
  getTimerStatus as getTimerStatusApi
} from '@/api/billiard/order'
import {
  getLocation,
  showPermissionModal
} from '@/utils/location'
import { openMapNavigation, makePhoneCall as makePhoneCallUtil, calculateDistance } from '@/utils/platform'

const { proxy } = getCurrentInstance()

// ====================== 基础状态 ======================
const isOnline = ref(false)
const isFreeTravel = ref(false)
const switchLoading = ref(false)
const freeTravelLoading = ref(false)

// 订单状态
const orderStatus = ref('idle')

// 历史订单 tab
const historyTabs = [
  { label: '待评价', value: 50 },
  { label: '已完成', value: 60 },
  { label: '已取消', value: 70 }
]
const historyTab = ref(60)

// 轮询相关
let pollTimer = null
let pendingTimer = null
let usedTimer = null
let leftTimer = null

// 待接单数据
const pendingOrder = ref({})
const pendingCountdown = ref(0)
const pendingCountdownText = ref('0分0秒')

// 教学计时
const usedSec = ref(0)
const servingUsedTimeText = ref('00:00')
const leftSec = ref(3600)
const servingLeftTimeText = ref('01:00:00')

// 历史订单
const historyOrders = ref([])
const historyPageNo = ref(1)
const historyPageSize = ref(2)

const displayHistoryOrders = computed(() => {
  return historyOrders.value
})

// 判断是否可以开始服务
const canStartService = computed(() => {
  if (!pendingOrder.value || !pendingOrder.value.serviceType) return false
  if (pendingOrder.value.startTime) return false // 已经开始了就不显示

  if (pendingOrder.value.serviceType === 1) {
    // 陪练：必须到达后才能开始
    return !!pendingOrder.value.arriveTime
  } else {
    // 陪游：接单后就可以开始
    return true
  }
})


// 获取历史订单
const fetchHistoryOrders = async (reset = false) => {
  if (reset) {
    historyPageNo.value = 1
    historyOrders.value = []
  }
  try {
    const res = await getOrderPage({
      pageNo: historyPageNo.value,
      pageSize: historyPageSize.value,
      status: historyTab.value // 使用当前选中的tab状态
    })
    if (res.data) {
      if (reset) {
        historyOrders.value = res.data.list || []
      } else {
        historyOrders.value = [...historyOrders.value, ...(res.data.list || [])]
      }
    }
  } catch (err) {
    console.error('获取历史订单失败', err)
  }
}

// 格式化时间
const formatOrderTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
  const time = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
  if (dateStr === today) {
    return `今天 ${time}`
  }
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`
  if (dateStr === yesterdayStr) {
    return `昨天 ${time}`
  }
  return `${dateStr} ${time}`
}

// 历史订单状态文本
const getHistoryStatusText = (status) => {
  const statusMap = {
    50: '待评价',
    60: '已完成',
    70: '已取消'
  }
  return statusMap[status] || '未知'
}

// 历史订单状态类型
const getHistoryStatusType = (status) => {
  const typeMap = {
    50: 'warning',
    60: 'success',
    70: 'default'
  }
  return typeMap[status] || 'default'
}

const todayData = ref([
  { icon: 'calendar', value: '0小时0分', label: '今日上钟时长', color: '#2F6BEE', bgColor: '#EFF6FF' },
  { icon: 'checkbox', value: '0单', label: '今日教学次数', color: '#10B981', bgColor: '#ECFDF5' },
  { icon: 'wallet', value: '¥0', label: '预计收入', color: '#F59E0B', bgColor: '#FFF7ED' }
])

// 获取看板数据
const fetchDashboard = async () => {
  try {
    const res = await getCoachDashboard()
    if (res.data) {
      const { todayServiceMinutes, todayServiceCount, todayEstimatedIncome } = res.data
      const hours = Math.floor(todayServiceMinutes / 60)
      const mins = todayServiceMinutes % 60
      todayData.value = [
        { icon: 'calendar', value: `${hours}小时${mins}分`, label: '今日上钟时长', color: '#2F6BEE', bgColor: '#EFF6FF' },
        { icon: 'checkbox', value: `${todayServiceCount}单`, label: '今日教学次数', color: '#10B981', bgColor: '#ECFDF5' },
        { icon: 'wallet', value: `¥${Number(todayEstimatedIncome).toFixed(2)}`, label: '预计收入', color: '#F59E0B', bgColor: '#FFF7ED' }
      ]
    }
  } catch (err) {
    console.error('获取看板数据失败', err)
  }
}

// 查询当前工作状态
const fetchWorkStatus = async () => {
  try {
    const res = await getWorkStatus()
    if (res.data) {
      isOnline.value = res.data.workStatus === 1
      isFreeTravel.value = res.data.freeTravel === 1
    }
  } catch (err) {
    console.error('获取工作状态失败', err)
  }
}

// 时间格式化
const fmtMM = (s) => {
  const m = Math.floor(s / 60)
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const min = m % 60
    if (min > 0) {
      return `${String(h)}小时${String(min)}分钟`
    } else {
      return `${String(h)}小时`
    }
  } else {
    return `${String(m)}分钟`
  }
}
const fmtHHMM = (s) => {
  const h = Math.floor(s/3600)
  const m = Math.floor((s%3600)/60)
  if (h > 0) {
    return `${String(h)}小时${String(m)}分钟`
  } else {
    return `${String(m)}分钟`
  }
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
}

// 定位相关
const locating = ref(false)
const currentLocation = ref({
  longitude: null,
  latitude: null
})

// 获取当前位置（使用统一封装）
const getCurrentLocation = async () => {
  if (locating.value) return
  locating.value = true

  try {
    const { longitude, latitude } = await getLocation({ needRegeocode: false })
    currentLocation.value = { longitude, latitude }
    return { longitude, latitude }
  } catch (err) {
    if (err.message === 'permission_denied') {
      showPermissionModal({
        content: '您未开启定位权限，将无法接单和打卡。是否前往开启？',
        onSuccess: getCurrentLocation
      })
    } else {
      uni.showToast({ title: '定位失败', icon: 'none' })
    }
    throw err
  } finally {
    locating.value = false
  }
}

// 校验是否在允许范围内（默认200米）
const checkLocationInRange = (targetLat, targetLon, maxDistance = 200) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 校验目标坐标是否有效
      if (!targetLat || !targetLon) {
        reject(new Error('场馆坐标信息缺失'))
        return
      }

      // 每次都重新获取当前位置，确保位置新鲜准确
      const location = await getCurrentLocation()

      // 校验获取到的位置是否有效
      if (!location || !location.latitude || !location.longitude) {
        reject(new Error('获取位置信息失败'))
        return
      }

      const distance = calculateDistance(
        parseFloat(location.latitude),
        parseFloat(location.longitude),
        parseFloat(targetLat),
        parseFloat(targetLon)
      )

      console.log('========== 位置校验 ==========')
      console.log('当前位置:', location.latitude, location.longitude)
      console.log('目标位置:', targetLat, targetLon)
      console.log('计算距离:', Math.round(distance), '米')
      console.log('允许范围:', maxDistance, '米')
      console.log('============================')

      if (distance <= maxDistance) {
        resolve(distance)
      } else {
        reject(new Error(`距离球厅${Math.round(distance)}米，超出打卡范围${maxDistance}米`))
      }
    } catch (err) {
      reject(err)
    }
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
    confirmText = '您当前有正在进行中的教学，确认下线将强制结束教学，是否继续？'
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

// 免费出行开关点击
const handleFreeTravelSwitchClick = () => {
  if (freeTravelLoading.value) return
  const targetStatus = !isFreeTravel.value

  uni.showModal({
    title: '确认切换',
    content: targetStatus ? '确认开启免费出行？' : '确认关闭免费出行？',
    success: async (res) => {
      if (res.confirm) {
        freeTravelLoading.value = true
        try {
          await updateFreeTravel({
            freeTravel: targetStatus
          })
          isFreeTravel.value = targetStatus
          proxy.$modal.msgSuccess(targetStatus ? '已开启免费出行' : '已关闭免费出行')
        } catch (err) {
          console.error('切换免费出行失败', err)
          proxy.$modal.msgError(err?.msg || '操作失败')
        } finally {
          freeTravelLoading.value = false
        }
      }
    }
  })
}

// 开关切换逻辑 - 对接API
const onSwitchChange = async (targetStatus) => {
  switchLoading.value = true

  try {
    if (targetStatus) {
      // 上线前必须先获取位置
      let loc
      try {
        loc = await getCurrentLocation()
      } catch (err) {
        // 获取位置失败，getCurrentLocation 内部已处理了权限提示
        switchLoading.value = false
        return
      }

      await doOnlineWithLocation(loc)
    } else {
      // 下线不需要位置
      await updateWorkStatus({
        workStatus: 0
      })

      // 下线，停止轮询，清空所有状态
      stopPolling()
      stopTimerPolling()
      orderStatus.value = 'idle'
      clearInterval(pendingTimer)
      clearInterval(usedTimer)
      clearInterval(leftTimer)
    }

    isOnline.value = targetStatus
    proxy.$modal.msgSuccess(targetStatus ? '已上线' : '已下线')
  } catch (err) {
    console.error('切换状态失败', err)
    proxy.$modal.msgError(err?.msg || '操作失败')
  } finally {
    switchLoading.value = false
  }
}

// 上线并上报位置
const doOnlineWithLocation = async (loc) => {
  // 上线时传递位置
  await updateWorkStatus({
    workStatus: 1,
    longitude: loc.longitude,
    latitude: loc.latitude
  })

  // 上线成功后再次上报位置
  await updateLocation({
    longitude: loc.longitude,
    latitude: loc.latitude
  })

  // 上线后开始轮询
  startPolling()
}

// 开始轮询（优先查询进行中订单，没有再查询待接单）
const startPolling = () => {
  stopPolling()
  // 立即查询一次
  fetchOrders()
  // 5秒轮询
  pollTimer = setInterval(() => {
    fetchOrders()
  }, 5000)
}

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// 查询订单（优先查进行中接口保证状态同步）
const fetchOrders = async () => {
  try {
    // 如果已上线，优先查询进行中的订单
    if (isOnline.value) {
      try {
        const inProgressRes = await getInProgressOrder()
        if (inProgressRes.data) {
          // 有进行中的订单
          const order = inProgressRes.data
          pendingOrder.value = order

          // 根据订单状态更新页面状态
          if (order.status === 40) {
            // 进行中
            orderStatus.value = 'serving'
            if (!timerPollTimer) {
              startServeTimer()
              startTimerPolling()
            }
          } else if (order.status === 30) {
            // 已接单
            orderStatus.value = 'accepted'
          } else if (order.status === 20) {
            // 待接单
            orderStatus.value = 'pending'
            updatePendingCountdown(order)
          } else {
            // 其他状态（已完成/已取消），清空并回到idle
            resetOrderState()
          }
          return
        }
      } catch (err) {
        console.log('无进行中的订单', err)
      }
    }

    // 如果当前有订单ID，查该订单详情
    const currentOrderId = getOrderId(pendingOrder.value)
    if (currentOrderId) {
      const orderRes = await getOrderDetail(currentOrderId)
      if (orderRes.data) {
        const order = orderRes.data
        pendingOrder.value = order

        // 根据订单状态更新页面状态
        if (order.status === 40) {
          // 进行中
          orderStatus.value = 'serving'
          if (!timerPollTimer) {
            startServeTimer()
            startTimerPolling()
          }
        } else if (order.status === 30) {
          // 已接单
          orderStatus.value = 'accepted'
        } else if (order.status === 20) {
          // 待接单
          orderStatus.value = 'pending'
          updatePendingCountdown(order)
        } else {
          // 其他状态（已完成/已取消），清空并回到idle
          resetOrderState()
        }
        return
      }
    }

    // 没有订单ID，说明是 idle 状态，只查待接单列表
    const pendingRes = await getPendingOrders()
    if (pendingRes.data && pendingRes.data?.list?.length > 0) {
      // 查询到待接单，停止轮询
      stopPolling()
      pendingOrder.value = pendingRes.data.list[0]
      orderStatus.value = 'pending'
      updatePendingCountdown(pendingOrder.value)
    } else {
        // 没有待接单，保持 idle
        orderStatus.value = 'idle'
    }
  } catch (err) {
    console.error('查询订单失败', err)
  }
}

// 更新待接单倒计时
const updatePendingCountdown = (order) => {
  if (order && order.expireAt) {
    const now = Date.now()
    let expireTime
    // 兼容 expireAt 可能是秒或毫秒时间戳
    const expireAtVal = order.expireAt
    if (typeof expireAtVal === 'string' || typeof expireAtVal === 'number') {
      expireTime = new Date(expireAtVal).getTime()
      // 如果是秒级时间戳，转换为毫秒
      if (expireTime < 10000000000) {
        expireTime = expireTime * 1000
      }
    } else {
      expireTime = new Date(order.expireAt).getTime()
    }
    pendingCountdown.value = Math.max(0, Math.floor((expireTime - now) / 1000))
    startPendingCountdown()
  }
}

// 重置订单状态
const resetOrderState = () => {
  pendingOrder.value = {}
  orderStatus.value = 'idle'
  stopTimerPolling()
  clearInterval(pendingTimer)
  clearInterval(usedTimer)
  clearInterval(leftTimer)
}

// 查询待接单列表（保留用于兼容）
const fetchPendingOrders = async () => {
  try {
    const res = await getPendingOrders()
    if (res.data && res.data?.list?.length > 0) {
      pendingOrder.value = res.data.list[0]
      orderStatus.value = 'pending'
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
    // 显示分钟和秒，补零
    const m = Math.floor(pendingCountdown.value / 60)
    const s = pendingCountdown.value % 60
    pendingCountdownText.value = `${m}分${s.toString().padStart(2, '0')}秒`
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
            orderId: getOrderId(pendingOrder.value),
            rejectReason: res.content || ''
          })
          clearInterval(pendingTimer)
          pendingOrder.value = {}
          orderStatus.value = 'idle'
          // 拒单后重启轮询
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

// 获取订单ID的兼容方法
const getOrderId = (order) => {
  return order?.id || order?.orderId
}

// 接单
const acceptOrder = async () => {
  uni.showLoading({ title:'接单中...' })
  const currentOrderId = getOrderId(pendingOrder.value)
  console.log('接单 - 当前订单ID:', currentOrderId)
  try {
    await acceptOrderApi({
      orderId: currentOrderId
    })
    uni.hideLoading()
    clearInterval(pendingTimer)
    // 接单成功后查询该订单详情
    const orderRes = await getOrderDetail(currentOrderId)
    console.log('接单 - 订单详情返回:', orderRes)
    if (orderRes.data) {
      pendingOrder.value = orderRes.data
      console.log('接单 - 更新后的pendingOrder:', pendingOrder.value)
      console.log('接单 - 更新后的orderId:', getOrderId(pendingOrder.value))
      orderStatus.value = 'accepted'
    }
    uni.showToast({ title: '接单成功', icon: 'success' })
  } catch (err) {
    uni.hideLoading()
    console.error('接单失败', err)
    proxy.$modal.msgError(err?.msg || '接单失败')
  }
}

// 确认出发
const confirmDeparture = async () => {
  const currentOrderId = getOrderId(pendingOrder.value)
  console.log('确认出发 - 当前订单ID:', currentOrderId)
  console.log('确认出发 - 完整pendingOrder:', pendingOrder.value)

  if (!currentOrderId) {
    console.error('确认出发失败 - orderId为空')
    proxy.$modal.msgError('订单信息异常，请刷新页面重试')
    return
  }

  try {
    await confirmDepartureApi({
      orderId: currentOrderId
    })
    // 确认出发后查询订单详情更新
    const orderRes = await getOrderDetail(currentOrderId)
    console.log('确认出发 - 订单详情返回:', orderRes)
    if (orderRes.data) {
      pendingOrder.value = orderRes.data
      console.log('确认出发 - 更新后的pendingOrder:', pendingOrder.value)
    }
    uni.showToast({ title: '已确认出发', icon: 'success' })
  } catch (err) {
    console.error('确认出发失败', err)
    proxy.$modal.msgError(err?.msg || '操作失败')
  }
}

// 到达教学地址
const arrive = async () => {
  // 校验当前位置是否在球厅范围内（200米内）
  uni.showLoading({ title: '校验位置中...' })

  try {
    // 先校验位置
    // const targetLat = pendingOrder.value.venueLatitude
    // const targetLon = pendingOrder.value.venueLongitude
    //
    // if (targetLat && targetLon) {
    //   await checkLocationInRange(targetLat, targetLon, 200)
    // }
    //
    // uni.hideLoading()

    await arriveApi({
      orderId: getOrderId(pendingOrder.value)
    })
    // 确认到达后查询订单详情更新
    const orderRes = await getOrderDetail(getOrderId(pendingOrder.value))
    if (orderRes.data) {
      pendingOrder.value = orderRes.data
    }
    uni.showToast({ title: '已到达', icon: 'success' })
  } catch (err) {
    uni.hideLoading()
    console.error('确认到达失败', err)
    // 如果是位置校验失败，显示具体错误
    if (err.message && err.message.includes('距离')) {
      uni.showToast({ title: err.message, icon: 'none', duration: 3000 })
    } else {
      proxy.$modal.msgError(err?.msg || '操作失败')
    }
  }
}

// 开始教学
const startService = async () => {
  try {
    // 1. 调用订单开始教学API
    await startServiceApi({
      orderId: getOrderId(pendingOrder.value)
    })

    // 2. 调用计时器开始API，获取教学端时间
    const timerResp = await startTimerApi({
      orderId: getOrderId(pendingOrder.value)
    })
    console.log('计时器已启动:', timerResp)

    // 3. 启动本地计时器（使用教学端返回的时间）
    orderStatus.value = 'serving'
    startServeTimer()
    startTimerPolling()
    uni.showToast({ title: '教学已开始', icon: 'success' })
  } catch (err) {
    console.error('开始教学失败', err)
    proxy.$modal.msgError(err?.msg || '操作失败')
  }
}

// 计时器状态轮询
let timerPollTimer = null

const startTimerPolling = () => {
  // 先立即查询一次
  fetchTimerStatus()
  // 每5秒轮询一次，与订单详情页面保持一致
  if (timerPollTimer) clearInterval(timerPollTimer)
  timerPollTimer = setInterval(() => {
    fetchTimerStatus()
  }, 5000)
}

const stopTimerPolling = () => {
  if (timerPollTimer) {
    clearInterval(timerPollTimer)
    timerPollTimer = null
  }
}

const fetchTimerStatus = async () => {
  const currentOrderId = getOrderId(pendingOrder.value)
  if (!currentOrderId || orderStatus.value !== 'serving') return
  try {
    // 使用 getInProgressOrder 来更新计时器信息，与订单详情页面保持一致
    const resp = await getInProgressOrder()
    if (resp && resp.data) {
      const data = resp.data
      // 更新订单信息
      pendingOrder.value = {
        ...pendingOrder.value,
        ...data
      }
      // 更新剩余时长
      if (data.remainingMinutes !== undefined && data.remainingMinutes !== null) {
        leftSec.value = data.remainingMinutes * 60
        servingLeftTimeText.value = fmtHHMM(leftSec.value)
      }
      // 更新已用时长 - 完全以服务器 startTime 为准，消除本地计时器的误差
      if (data.startTime) {
        usedSec.value = Math.floor((Date.now() - new Date(data.startTime).getTime()) / 1000)
        servingUsedTimeText.value = fmtMM(usedSec.value)
      }
    }
  } catch (err) {
    console.error('查询计时器状态失败', err)
  }
}

// 教学计时
const startServeTimer = () => {
  clearInterval(usedTimer)
  clearInterval(leftTimer)

  // 根据订单信息初始化计时
  if (pendingOrder.value.startTime) {
    usedSec.value = Math.floor((Date.now() - new Date(pendingOrder.value.startTime).getTime()) / 1000)
  } else {
    usedSec.value = 0
  }

  if (pendingOrder.value.remainingMinutes !== undefined && pendingOrder.value.remainingMinutes !== null) {
    leftSec.value = pendingOrder.value.remainingMinutes * 60
  } else {
    leftSec.value = (pendingOrder.value.serviceDuration || 3600) - usedSec.value
  }

  servingUsedTimeText.value = fmtMM(usedSec.value)
  servingLeftTimeText.value = fmtHHMM(Math.max(0, leftSec.value))

  // 只启动已用时长的本地计时器，剩余时长依赖服务器轮询更新
  usedTimer = setInterval(() => {
    usedSec.value++
    servingUsedTimeText.value = fmtMM(usedSec.value)
  }, 1000)
}

// 跳转到订单详情页
const goToDetail = () => {
  uni.navigateTo({
    url: `/subpkg/order/detail?orderId=${getOrderId(pendingOrder.value)}&status=40`
  })
}

// 结束教学
const endService = () => {
  uni.showModal({
    title: '确认结束',
    content: '确定要结束当前教学吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          // 1. 调用计时器结束API，获取实际教学时长
          const timerResp = await endTimerApi({
            orderId: getOrderId(pendingOrder.value)
          })
          console.log('计时器已结束:', timerResp)

          // 2. 调用订单结束教学API
          await finishServiceApi({
            orderId: getOrderId(pendingOrder.value)
          })

          // 3. 停止计时器
          clearInterval(usedTimer)
          clearInterval(leftTimer)
          stopTimerPolling()

          // 4. 查询真实看板数据
          fetchDashboard()

          // 5. 刷新历史订单
          fetchHistoryOrders()

          // 6. 清空当前订单状态，重新开始轮询
          pendingOrder.value = {}
          orderStatus.value = 'idle'
          startPolling()

          uni.showToast({ title:'教学已结束', icon:'success' })
        } catch (err) {
          console.error('结束教学失败', err)
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
  if (!pendingOrder.value.userPhone) {
    uni.showToast({
      title: '暂无联系电话',
      icon: 'none'
    })
    return
  }
  makePhoneCallUtil(pendingOrder.value.userPhone)
}

// 报告异常弹窗
const showReportException = () => {
  const exceptionTypes = [
    { label: '联系不到客户', value: 1 },
    { label: '客户违规', value: 2 },
    { label: '其他', value: 3 }
  ]
  uni.showActionSheet({
    itemList: exceptionTypes.map(t => t.label),
    success: async (res) => {
      const type = exceptionTypes[res.tapIndex].value
      uni.showModal({
        title: '异常说明',
        editable: true,
        placeholderText: '请输入异常描述（500字以内）',
        success: async (modalRes) => {
          if (modalRes.confirm) {
            const content = modalRes.content?.trim()
            if (!content) {
              return uni.showToast({ title: '请输入异常描述', icon: 'none' })
            }
            if (content.length > 500) {
              return uni.showToast({ title: '描述不能超过500字', icon: 'none' })
            }
            try {
              await reportExceptionApi({
                orderId: getOrderId(pendingOrder.value),
                exceptionType: type,
                reason: content
              })
              uni.showToast({ title: '已提交异常', icon: 'success' })
            } catch (err) {
              proxy.$modal.msgError(err?.msg || '提交失败')
            }
          }
        }
      })
    }
  })
}

// 历史订单 tab索引计算
const historyTabIndex = computed(() => {
  const idx = historyTabs.findIndex(t => t.value === historyTab.value)
  return idx >= 0 ? idx : 0
})

// 历史订单tab切换
const onHistoryTabClick = (e) => {
  historyTab.value = historyTabs[e.currentIndex].value
  fetchHistoryOrders(true) // 切换tab时重新获取数据
}

// 跳转到全部订单
const goToAllOrder = () => {
  uni.switchTab({
    url: '/pages/order/index'
  })
}

// 跳转到订单详情
const goToOrderDetail = (order) => {
  uni.navigateTo({
    url: `/subpkg/order/detail?orderId=${order.orderId}&status=${order.status}`
  })
}

const refreshPageData = async () => {
  // 获取看板数据
  fetchDashboard()
  // 获取历史订单
  fetchHistoryOrders(true)
  // 获取当前工作状态
  await fetchWorkStatus()

  // 如果已上线，恢复订单状态
  if (isOnline.value) {
    // 1. 优先检查当前是否有订单ID，有的话先查这个订单详情
    const currentOrderId = getOrderId(pendingOrder.value)
    if (currentOrderId) {
      if (await tryRestoreOrder(currentOrderId)) {
        return
      }
    }

    // 2. 查询进行中的订单
    try {
      const inProgressRes = await getInProgressOrder()
      if (inProgressRes.data) {
        const order = inProgressRes.data
        if (await checkAndSetOrder(order)) {
          return
        }
      }
    } catch (err) {
      console.log('无进行中的订单', err)
    }

    // 3. 查询待接单列表
    try {
      const pendingRes = await getPendingOrders()
      if (pendingRes.data && pendingRes.data.list && pendingRes.data.list.length > 0) {
        const order = pendingRes.data.list[0]
        if (await checkAndSetOrder(order)) {
          return
        }
      }
    } catch (err) {
      console.log('无待接单', err)
    }

    // 4. 查询最近订单列表，查找活跃订单
    try {
      const pageRes = await getOrderPage({ pageNo: 1, pageSize: 10 })
      if (pageRes.data && pageRes.data.list && pageRes.data.list.length > 0) {
        // 找到第一个非结束状态的订单
        for (const order of pageRes.data.list) {
          if (await checkAndSetOrder(order)) {
            return
          }
        }
      }
    } catch (err) {
      console.log('查询订单列表失败', err)
    }

    // 5. 都没有找到活跃订单，重置状态开始轮询
    resetOrderState()
    if (!pollTimer) {
      startPolling()
    }
  }
}

// 检查订单并设置状态，返回是否成功设置
const checkAndSetOrder = async (order) => {
  // 只有这些状态才不展示：50待评价、60已完成、70已取消
  if (order.status === 50 || order.status === 60 || order.status === 70) {
    return false
  }

  // 获取完整的订单详情
  const orderId = getOrderId(order)
  let fullOrder = order
  if (orderId) {
    try {
      const orderRes = await getOrderDetail(orderId)
      if (orderRes.data) {
        fullOrder = orderRes.data
      }
    } catch (err) {
      console.log('获取订单详情失败', err)
    }
  }

  // 设置订单
  pendingOrder.value = fullOrder
  if (fullOrder.status === 40) {
    orderStatus.value = 'serving'
    startServeTimer()
    startTimerPolling()
  } else if (fullOrder.status === 30) {
    orderStatus.value = 'accepted'
  } else if (fullOrder.status === 20) {
    orderStatus.value = 'pending'
    updatePendingCountdown(fullOrder)
  }
  return true
}

// 尝试用订单ID恢复订单
const tryRestoreOrder = async (orderId) => {
  try {
    const orderRes = await getOrderDetail(orderId)
    if (orderRes.data) {
      const order = orderRes.data
      // 只有这些状态才不展示：50待评价、60已完成、70已取消
      if (order.status === 50 || order.status === 60 || order.status === 70) {
        return false
      }
      pendingOrder.value = order
      if (order.status === 40) {
        orderStatus.value = 'serving'
        startServeTimer()
        startTimerPolling()
      } else if (order.status === 30) {
        orderStatus.value = 'accepted'
      } else if (order.status === 20) {
        orderStatus.value = 'pending'
        updatePendingCountdown(order)
      }
      return true
    }
  } catch (err) {
    console.log('恢复订单失败', err)
  }
  return false
}

onMounted(async () => {
  await refreshPageData()
})

// 每次页面显示时刷新数据
let lastRefreshTime = 0
onShow(async () => {
  const now = Date.now()
  // 避免频繁刷新（5秒内只刷新一次）
  if (now - lastRefreshTime < 5000) return
  lastRefreshTime = now

  await refreshPageData()
})

onUnmounted(() => {
  stopPolling()
  stopTimerPolling()
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
  border-radius: 24rpx !important;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  border: none !important;
}
:deep(.uni-card .uni-card__header) {
  padding: 20rpx 24rpx !important;
  border-bottom: 1rpx solid #f3f4f6;
  font-weight: 600;
  color: #1f2937;
}
:deep(.uni-card .uni-card__content) {
  padding: 28rpx !important;
}
:deep(.uni-section .uni-section__header) {
  padding: 0 4rpx 12rpx !important;
}

.workbench-wrapper {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 24rpx 0;
  border-bottom: 1rpx solid #f3f4f6;
  .status-label {
    font-size: 30rpx;
    font-weight: 600;
    color: #1f2937;
  }
}
.status-tag {
  margin-top: 24rpx;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
  .label-off, .label-on {
    font-size: 26rpx;
    color: #9ca3af;
  }
  .active {
    color: #10b981;
    font-weight: 600;
  }
}

.custom-switch {
  width: 88rpx;
  height: 48rpx;
  border-radius: 24rpx;
  background: #e5e7eb;
  position: relative;
  transition: all 0.3s ease-out;
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
    transition: all 0.3s ease-out;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  }

  &.is-checked {
    background: linear-gradient(135deg, #10b981 0%, #0da271 100%);
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
    color: #6b7280;
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
      font-size: 28rpx;
      color: #1f2937;
    }
  }
  .countdown {
    display: flex;
    align-items: center;
    gap: 6rpx;
    .time-text {
      font-size: 26rpx;
      color: #f59e0b;
      font-weight: 600;
    }
  }
  .order-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #1f2937;
  }
}

.order-info {
  margin-bottom: 24rpx;
  .order-name {
    font-size: 30rpx;
    font-weight: 600;
    display: block;
    margin-bottom: 8rpx;
    color: #1f2937;
  }
  .order-price {
    font-size: 36rpx;
    color: #2f6bee;
    font-weight: bold;
  }
}

.order-detail-row {
  display: flex;
  padding: 10rpx 0;
  .detail-label {
    font-size: 26rpx;
    color: #9ca3af;
    width: 160rpx;
    flex-shrink: 0;
  }
  .detail-value {
    font-size: 26rpx;
    color: #6b7280;
    flex: 1;
  }
}

.btn-group {
  display: flex;
  gap: 16rpx;
  margin-top: 28rpx;
  .btn {
    height: 88rpx;
    line-height: 88rpx;
    font-size: 28rpx;
    border-radius: 20rpx;
    flex: 1;
    font-weight: 600;
    transition: transform 0.2s, box-shadow 0.2s;
    &:active {
      transform: scale(0.97);
    }
  }
  .btn-reject {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: #fff;
    box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.25);
  }
  .btn-accept {
    background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
    color: #fff;
    box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.3);
  }
  .btn-exception {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: #fff;
    box-shadow: 0 4rpx 12rpx rgba(245, 158, 11, 0.25);
  }
  .btn-confirm-depart, .btn-arrive {
    background: linear-gradient(135deg, #10b981 0%, #0da271 100%);
    color: #fff;
    box-shadow: 0 4rpx 12rpx rgba(16, 185, 129, 0.25);
  }
}

.status-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 22rpx;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 20rpx;
  margin-top: 24rpx;
  .hint-text {
    font-size: 26rpx;
    color: #10b981;
    font-weight: 500;
  }
}

.nav-row {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
  .nav-btn, .call-btn {
    flex: 1;
    height: 80rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    font-size: 26rpx;
    padding: 0;
    margin: 0;
    font-weight: 500;
    transition: transform 0.2s, box-shadow 0.2s;
    &:active {
      transform: scale(0.97);
    }
  }
  .nav-btn {
    background: linear-gradient(135deg, #1a50d9 0%, #1a40b8 100%);
    color: #fff;
    box-shadow: 0 4rpx 12rpx rgba(26, 80, 217, 0.25);
  }
  .call-btn {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    &.nav-btn {
      background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
      color: #fff;
      box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.3);
    }
  }
}

.accepted-order {
  .order-info-header {
    margin-bottom: 20rpx;
  }
}

.serve-top {
  .left-time {
    font-size: 26rpx;
    color: #2f6bee;
    font-weight: 600;
  }
}
.timer-box {
  text-align: center;
  padding: 36rpx 0;
  background: linear-gradient(135deg, rgba(47, 107, 238, 0.05) 0%, rgba(26, 80, 217, 0.05) 100%);
  border-radius: 20rpx;
  margin: 24rpx 0;
  .big-time {
    font-size: 60rpx;
    font-weight: bold;
    color: #1f2937;
    display: block;
    line-height: 100%;
  }
  .time-desc {
    font-size: 24rpx;
    color: #9ca3af;
    margin-top: 10rpx;
  }
}
.btn-end {
  width: 100%;
  height: 92rpx;
  line-height: 92rpx;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  border-radius: 20rpx;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.25);
  transition: transform 0.2s, box-shadow 0.2s;
  &:active {
    transform: scale(0.97);
  }
}
.detail-box {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 20rpx;
  .shop-img {
    width: 120rpx;
    height: 120rpx;
    border-radius: 20rpx;
    border: 2rpx solid #f3f4f6;
  }
  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    .shop-name {
      font-size: 30rpx;
      font-weight: 600;
      color: #1f2937;
    }
    .contact-row {
      display: flex;
      align-items: center;
      gap: 8rpx;
      font-size: 24rpx;
      color: #6b7280;
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
      color: #6b7280;
    }
    .service-price {
      font-size: 30rpx;
      color: #2f6bee;
      font-weight: bold;
    }
    .tip-box {
      display: flex;
      align-items: center;
      gap: 4rpx;
      font-size: 22rpx;
      color: #f59e0b;
      margin-top: 4rpx;
    }
  }
  .nav-btn {
    background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
    color: #fff;
    border-radius: 16rpx;
    font-size: 24rpx;
    height: 64rpx;
    padding: 0 20rpx;
    line-height: 64rpx;
    margin: 0;
    box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.25);
  }
}

.data-grid {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}
.data-card {
  flex: 1;
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx 20rpx;
  text-align: center;
  position: relative;
  border: 1rpx solid #f3f4f6;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;

  &:active {
    transform: translateY(-4rpx);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  }

  .data-icon {
    width: 52rpx;
    height: 52rpx;
    border-radius: 16rpx;
    margin: 0 auto 14rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .data-value {
    font-size: 30rpx;
    font-weight: 600;
    display: block;
    margin-bottom: 8rpx;
    color: #1f2937;
  }
  .data-label {
    font-size: 24rpx;
    color: #9ca3af;
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
  padding-bottom: 18rpx;
  border-bottom: 1rpx solid #f3f4f6;
}
.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
}

.view-all-text {
  font-size: 26rpx;
  color: #2f6bee;
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
  gap: 16rpx;
}
.history-order-item {
  padding: 22rpx;
  background: #f8fbff;
  border-radius: 20rpx;
  transition: background 0.2s;
  &:active {
    background: #f3f4f6;
  }
  .order-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10rpx;
    .order-title {
      font-size: 28rpx;
      font-weight: 500;
      color: #1f2937;
    }
    .order-price {
      font-size: 30rpx;
      color: #2f6bee;
      font-weight: bold;
    }
  }
  .order-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .order-time {
      font-size: 24rpx;
      color: #9ca3af;
    }
  }
}
</style>
