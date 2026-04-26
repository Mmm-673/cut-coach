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

        <view class="btn-group" v-if="pendingOrder.arriveTime && !pendingOrder.startTime">
          <button class="btn btn-exception" @click="showReportException">报告异常</button>
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
import {
  updateWorkStatus,
  updateLocation,
  updateFreeTravel,
  getCoachDashboard,
  getWorkStatus
} from '@/api/billiard/coach'
import {
  getPendingOrders,
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
  openMapNavigation,
  makePhoneCall as makePhoneCallUtil,
  showLocationPermissionGuide,
  getPlatform
} from '@/utils/platform'

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

// 服务计时
const usedSec = ref(0)
const servingUsedTimeText = ref('00:00')
const leftSec = ref(3600)
const servingLeftTimeText = ref('01:00:00')

// 历史订单
const historyOrders = ref([])
const historyPageNo = ref(1)
const historyPageSize = ref(5)

const displayHistoryOrders = computed(() => {
  return historyOrders.value.filter(order => order.status === historyTab.value)
})

// 获取历史订单
const fetchHistoryOrders = async () => {
  try {
    // TODO: 上线前删除这段模拟数据
    const USE_MOCK = true
    if (USE_MOCK) {
      const now = Date.now()
      historyOrders.value = [
        {
          orderId: 1001,
          orderNo: '202604181000001',
          serviceType: 1,
          bookingTime: now - 2 * 60 * 60 * 1000,
          totalAmount: 20000,
          status: 60,
          createTime: now - 3 * 60 * 60 * 1000,
          venueName: '星牌台球俱乐部',
          venueAddress: '北京市朝阳区建国路88号SOHO现代城',
          userPhone: '138****8888'
        },
        {
          orderId: 1002,
          orderNo: '202604171430002',
          serviceType: 1,
          bookingTime: now - 24 * 60 * 60 * 1000,
          totalAmount: 12800,
          status: 60,
          createTime: now - 25 * 60 * 60 * 1000,
          venueName: '来力台球会所',
          venueAddress: '上海市浦东新区张杨路1000号',
          userPhone: '139****6666'
        },
        {
          orderId: 1003,
          orderNo: '202604161030003',
          serviceType: 2,
          bookingTime: now - 48 * 60 * 60 * 1000,
          totalAmount: 36000,
          status: 70,
          createTime: now - 50 * 60 * 60 * 1000,
          venueName: '金台球俱乐部',
          venueAddress: '广州市天河区天河路100号',
          userPhone: '136****5555'
        },
        {
          orderId: 1004,
          orderNo: '202604151030004',
          serviceType: 1,
          bookingTime: now - 72 * 60 * 60 * 1000,
          totalAmount: 18000,
          status: 50,
          createTime: now - 73 * 60 * 60 * 1000,
          venueName: '绅士台球厅',
          venueAddress: '深圳市南山区科技园路200号',
          userPhone: '135****4444'
        }
      ]
      return
    }

    const res = await getOrderPage({
      pageNo: historyPageNo.value,
      pageSize: historyPageSize.value,
      status: 0 // 全部
    })
    if (res.data) {
      historyOrders.value = res.data.list || []
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
  { icon: 'checkbox', value: '0单', label: '今日服务次数', color: '#10B981', bgColor: '#ECFDF5' },
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
        { icon: 'checkbox', value: `${todayServiceCount}单`, label: '今日服务次数', color: '#10B981', bgColor: '#ECFDF5' },
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
    }
  } catch (err) {
    console.error('获取工作状态失败', err)
  }
}

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

// 计算两点之间的距离（米），使用 Haversine 公式
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000 // 地球半径（米）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// 校验是否在允许范围内（默认200米）
const checkLocationInRange = (targetLat, targetLon, maxDistance = 200) => {
  return new Promise(async (resolve, reject) => {
    try {
      const location = await getPlatformLocation()
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        targetLat,
        targetLon
      )
      console.log(`当前位置与球厅距离: ${Math.round(distance)}米`)
      if (distance <= maxDistance) {
        resolve(distance)
      } else {
        reject(new Error(`距离球厅${Math.round(distance)}米，超出允许范围${maxDistance}米`))
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
        loc = await getPlatformLocation()
      } catch (err) {
        // 获取位置失败，检查是否是权限问题
        if (err.message?.includes('权限') || err.message?.includes('auth deny')) {
          showLocationPermissionGuide()
          // const modalRes = await new Promise((resolve) => {
          //   uni.showModal({
          //     title: '需要位置权限',
          //     content: '上线需要获取位置信息，请授权位置权限',
          //     confirmText: '去设置',
          //     cancelText: '取消',
          //     success: resolve
          //   })
          // })

          // if (modalRes.confirm) {
          //   showLocationPermissionGuide()
          //   // 延迟后重新尝试获取位置
          //   setTimeout(async () => {
          //     try {
          //       loc = await getPlatformLocation()
          //       await doOnlineWithLocation(loc)
          //     } catch (e) {
          //       console.error('重新获取位置失败', e)
          //     }
          //   }, 1000)
          // }
        } else {
          proxy.$modal.msgError('获取位置失败')
        }
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
  console.log('位置上报成功')

  // 上线后开始轮询
  startPolling()
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

// ====================== Mock数据 ======================
const USE_MOCK = ref(true)

const mockPendingOrder = {
  orderId: 9527,
  orderNo: '202604261000001',
  userPhone: '138****8000',
  venueName: '星牌台球俱乐部',
  venueAddress: '北京市朝阳区建国路88号SOHO现代城',
  venueLongitude: 116.397128,
  venueLatitude: 39.916527,
  serviceType: 1,
  bookingTime: Date.now() + 30 * 60 * 1000,
  serviceDuration: 3600,
  totalAmount: 20000,
  expireAt: Date.now() + 120 * 1000,
  createTime: Date.now() - 5 * 60 * 1000
}

const mockAcceptedOrder = ref({ ...mockPendingOrder })
// =====================================================

// 查询待接单列表
const fetchPendingOrders = async () => {
  if (USE_MOCK.value) {
    stopPolling()
    pendingOrder.value = { ...mockPendingOrder }
    orderStatus.value = 'pending'
    pendingCountdown.value = 120
    startPendingCountdown()
    return
  }

  try {
    const res = await getPendingOrders()
    if (res.data && res.data?.list?.length > 0) {
      stopPolling()
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
  if (USE_MOCK.value) {
    uni.showLoading({ title: '接单中...' })
    await new Promise(r => setTimeout(r, 500))
    uni.hideLoading()
    clearInterval(pendingTimer)
    orderStatus.value = 'accepted'
    mockAcceptedOrder.value = { ...mockPendingOrder }
    uni.showToast({ title: '接单成功', icon: 'success' })
    return
  }

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
  if (USE_MOCK.value) {
    mockAcceptedOrder.value.departureConfirmTime = new Date().toISOString()
    pendingOrder.value = { ...mockAcceptedOrder.value }
    uni.showToast({ title: '已确认出发', icon: 'success' })
    return
  }

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
  if (USE_MOCK.value) {
    mockAcceptedOrder.value.arriveTime = new Date().toISOString()
    pendingOrder.value = { ...mockAcceptedOrder.value }
    uni.showToast({ title: '已到达', icon: 'success' })
    return
  }

  // 校验当前位置是否在球厅范围内（200米内）
  uni.showLoading({ title: '校验位置...' })
  try {
    await checkLocationInRange(
      pendingOrder.value.venueLatitude,
      pendingOrder.value.venueLongitude,
      200
    )
    uni.hideLoading()
  } catch (err) {
    uni.hideLoading()
    // 位置校验失败
    if (err.message?.includes('距离')) {
      uni.showModal({
        title: '位置不在范围内',
        content: err.message + '，请确认已到达球厅地址',
        showCancel: false
      })
    } else {
      // 权限问题，引导开启
      uni.showModal({
        title: '需要位置权限',
        content: '确认到达需要获取位置信息，请授权位置权限',
        confirmText: '去设置',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            showLocationPermissionGuide()
          }
        }
      })
    }
    return
  }

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
  if (USE_MOCK.value) {
    mockAcceptedOrder.value.startTime = new Date().toISOString()
    pendingOrder.value = { ...mockAcceptedOrder.value }
    orderStatus.value = 'serving'
    startServeTimer()
    uni.showToast({ title: '服务已开始', icon: 'success' })
    return
  }

  try {
    // 1. 调用订单开始服务API
    await startServiceApi({
      orderId: pendingOrder.value.orderId
    })

    // 2. 调用计时器开始API，获取服务端时间
    const timerResp = await startTimerApi({
      orderId: pendingOrder.value.orderId
    })
    console.log('计时器已启动:', timerResp)

    // 3. 启动本地计时器（使用服务端返回的时间）
    orderStatus.value = 'serving'
    startServeTimer()
    startTimerPolling()
    uni.showToast({ title: '服务已开始', icon: 'success' })
  } catch (err) {
    console.error('开始服务失败', err)
    proxy.$modal.msgError(err?.msg || '操作失败')
  }
}

// 计时器状态轮询
let timerPollTimer = null

const startTimerPolling = () => {
  // 先立即查询一次
  fetchTimerStatus()
  // 每30秒轮询一次
  if (timerPollTimer) clearInterval(timerPollTimer)
  timerPollTimer = setInterval(() => {
    fetchTimerStatus()
  }, 30000)
}

const stopTimerPolling = () => {
  if (timerPollTimer) {
    clearInterval(timerPollTimer)
    timerPollTimer = null
  }
}

const fetchTimerStatus = async () => {
  if (!pendingOrder.value.orderId || orderStatus.value !== 'serving') return
  try {
    const resp = await getTimerStatusApi(pendingOrder.value.orderId)
    if (resp) {
      console.log('计时器状态:', resp)
      // 更新已服务时长和剩余时长
      usedSec.value = resp.elapsedSeconds || 0
      servingUsedTimeText.value = fmtMMSS(usedSec.value)
      const remaining = resp.remainingSeconds || 0
      servingLeftTimeText.value = fmtHHMMSS(Math.max(0, remaining))
    }
  } catch (err) {
    console.error('查询计时器状态失败', err)
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
  uni.navigateTo({
    url: `/pages/order/detail?orderId=${pendingOrder.value.orderId}&status=40`
  })
}

// 结束服务
const endService = () => {
  uni.showModal({
    title: '确认结束',
    content: '确定要结束当前服务吗？',
    success: async (res) => {
      if (res.confirm) {
        if (USE_MOCK.value) {
          clearInterval(usedTimer)
          clearInterval(leftTimer)
          stopTimerPolling()
          orderStatus.value = 'idle'
          uni.showToast({ title: '服务已结束', icon: 'success' })
          return
        }

        try {
          // 1. 调用计时器结束API，获取实际服务时长
          const timerResp = await endTimerApi({
            orderId: pendingOrder.value.orderId
          })
          console.log('计时器已结束:', timerResp)

          // 2. 调用订单结束服务API
          await finishServiceApi({
            orderId: pendingOrder.value.orderId
          })

          // 3. 停止计时器
          clearInterval(usedTimer)
          clearInterval(leftTimer)
          stopTimerPolling()
          orderStatus.value = 'idle'
          completedOrders.value.unshift({
            name: pendingOrder.value.serviceType === 1 ? '台球陪练' : '陪游',
            time: `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2,'0')} · ${pendingOrder.value.venueName}`,
            price: (pendingOrder.value.totalAmount / 100).toFixed(2)
          })

          // 4. 查询真实看板数据
          fetchDashboard()

          // 5. 恢复轮询
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
          if (modalRes.confirm && modalRes.content) {
            try {
              if (USE_MOCK.value) {
                await new Promise(r => setTimeout(r, 500))
                uni.showToast({ title: '已提交异常', icon: 'success' })
                return
              }
              await reportExceptionApi({
                orderId: pendingOrder.value.orderId,
                exceptionType: type,
                reason: modalRes.content
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
    url: `/pages/order/detail?orderId=${order.orderId}&status=${order.status}`
  })
}

onMounted(() => {
  // 获取当前工作状态
  fetchWorkStatus()
  // 获取看板数据
  fetchDashboard()
  // 获取历史订单
  fetchHistoryOrders()

  // Mock: 上线状态下自动拉取待接单
  if (USE_MOCK.value) {
    isOnline.value = true
    startPolling()
  } else if (isOnline.value) {
    startPolling()
  }
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
  .btn-exception {
    background: $warning;
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
    background: linear-gradient(135deg, $primary-dark 0%, darken($primary, 15%) 100%);
    color: #fff;
  }
  .call-btn {
    background: lighten($success, 40%);
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
