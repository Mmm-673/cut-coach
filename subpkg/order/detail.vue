<template>
  <view class="order-detail-wrapper" :class="{ 'order-detail-finished': !isProcessing }" :style="{ paddingBottom: footerPaddingBottom }">
    <!-- 进行中状态：显示计时器区域 -->
    <view v-if="orderStatus === ORDER_STATUS.PROCESSING" class="timer-section">
      <uni-tag :text="getStatusText(orderStatus)" :type="getStatusType(orderStatus)" size="normal" class="status-tag"  style="font-weight: bold"/>
      <template v-if="orderInfo.orderId">
        <text class="big-time">{{ usedText }}</text>
        <text class="time-label">已服务时长</text>
        <!-- 剩余时长：仅小时价订单展示 -->
        <text v-if="!isFixedPricing(orderInfo.pricingMode)" class="left-time">剩余时长：{{ leftText }}</text>
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
        <text class="label">教学类型</text>
        <text class="value">{{ getServiceTypeName(orderInfo.serviceType) }}</text>
      </view>
      <!-- 教学/预约时长：固定价不展示预约时长，只展示实际履约时长 -->
      <view class="info-row" v-if="!isFixedPricing(orderInfo.pricingMode)">
        <text class="label">教学时长</text>
        <text class="value">{{ orderInfo.serviceDuration ? `${orderInfo.serviceDuration}分钟` : '-' }}</text>
      </view>
      <view class="info-row" v-else-if="orderInfo.actualDurationMinutes">
        <text class="label">服务时长</text>
        <text class="value">{{ orderInfo.actualDurationMinutes }}分钟</text>
      </view>
      <view class="info-row">
        <text class="label">订单金额</text>
        <text class="value price">
          ¥{{ orderInfo.totalAmount ? formatFenToYuan(orderInfo.totalAmount) : '-' }}
          <text class="price-unit">{{ isFixedPricing(orderInfo.pricingMode) ? '（单次价）' : '（小时价）' }}</text>
        </text>
      </view>
      <view class="info-row">
        <text class="label">预约时间</text>
        <text class="value">{{ orderInfo.bookingTimeText || formatTime(orderInfo.bookingTime) || orderInfo.bookingTime || '-' }}</text>
      </view>
      <view class="info-row">
        <text class="label">创建时间</text>
        <text class="value">{{ orderInfo.createTimeText || formatTime(orderInfo.createTime) || orderInfo.createTime || '-' }}</text>
      </view>
    </view>

    <!-- 教学地点卡片 -->
    <view class="card" v-if="!isMockVenue(orderInfo.venueName, orderInfo.venueAddress)">
      <view class="card-title">服务地点</view>
      <image class="shop-img" :src="orderInfo.venuePhotoUrl || orderInfo.venueImg || '/static/images/banner/billiards_2.jpg'" mode="aspectFill"></image>
      <view class="shop-info">
        <view class="shop-left">
          <text class="shop-name">{{ orderInfo.venueName }}</text>
          <text class="shop-address">{{ orderInfo.venueAddress || '-' }}</text>
        </view>
        <button
            class="nav-btn"
            @click="navigate"
        >
          <uni-icons type="location-filled" size="20" color="#fff" />
        </button>
      </view>
    </view>

    <!-- 客户信息卡片 -->
    <view class="card" v-if="orderInfo.userPhone && orderInfo.userPhone !== '-'">
      <view class="card-title">客户信息</view>
      <view class="customer-info" @click="goToUserReviewHistory">
        <image
            class="avatar"
            :src="orderInfo.userAvatar"
            mode="aspectFill"
        ></image>

        <view class="customer-left">
          <text class="customer-name">{{ orderInfo.userNickname}}</text>
          <text class="customer-phone">{{ orderInfo.userPhone }}</text>
        </view>

        <view class="customer-actions">
          <view
              class="call-btn-mini"
              @click.stop="makeCall"
          >
            <uni-icons
                type="phone"
                size="18"
                color="#10B981"
            />
          </view>

          <view class="right-arrow">
            <uni-icons
                type="right"
                size="16"
                color="#9ca3af"
            />
          </view>
        </view>
      </view>
      <view class="safe-area-bottom"></view>
    </view>

    <!-- 底部操作区 -->
    <view class="footer" id="orderDetailFooter">
      <!-- 待接单状态显示接单/拒单按钮 -->
      <template v-if="orderStatus === ORDER_STATUS.PENDING">
        <view class="btn-row">
          <button class="btn-danger" @click="rejectOrder">拒单</button>
          <button class="btn-primary" @click="acceptOrder">接单</button>
        </view>
      </template>
      <!-- 已接单状态（待出发/已出发/已到达） -->
      <template v-else-if="orderStatus === ORDER_STATUS.ACCEPTED">
        <!-- 台球服务完整流程 -->
        <template v-if="orderInfo.serviceType === 1">
          <!-- 未确认出发 -->
          <template v-if="!departureConfirmTime">
            <view class="btn-single">
              <button class="btn-primary" @click="confirmDeparture">确认出发</button>
            </view>
          </template>
          <!-- 已确认出发，未到达 -->
          <template v-else-if="departureConfirmTime && !arriveTime">
            <view class="status-hint">
              <uni-icons type="checkmarkempty" size="20" color="#10b981"></uni-icons>
              <text class="hint-text">已确认出发，请尽快前往约定地点</text>
            </view>
            <view class="btn-single">
              <button class="btn-success" @click="arrive">到达约定地点</button>
            </view>
          </template>
          <!-- 已到达，未开始教学 -->
          <template v-else-if="arriveTime && !startTime">
            <view class="status-hint">
              <uni-icons type="checkmarkempty" size="20" color="#10b981"></uni-icons>
              <text class="hint-text">已到达约定地点，开始服务</text>
            </view>
            <view class="btn-row">
              <button class="btn-warning" @click="showReportException">报告异常</button>
              <button class="btn-primary" @click="startService">开始服务</button>
            </view>
          </template>
        </template>

        <!-- 其他服务简化流程 -->
        <template v-else>
          <!-- 未到达 -->
          <template v-if="!arriveTime">
            <view class="btn-single">
              <button class="btn-success" @click="arrive">确认到达</button>
            </view>
          </template>
          <!-- 已到达，未开始教学 -->
          <template v-else-if="arriveTime && !startTime">
            <view class="status-hint">
              <uni-icons type="checkmarkempty" size="20" color="#10b981"></uni-icons>
              <text class="hint-text">已到达约定地点，开始服务</text>
            </view>
            <view class="btn-row">
              <button class="btn-warning" @click="showReportException">报告异常</button>
              <button class="btn-primary" @click="startService">开始服务</button>
            </view>
          </template>
        </template>
      </template>
      <!-- 进行中状态显示结束教学按钮 -->
      <template v-else-if="orderStatus === ORDER_STATUS.PROCESSING">
        <view class="btn-single">
          <button class="btn-end" @click="endService">结束订单</button>
        </view>
      </template>
      <!-- 待评价状态且裁教未评价时显示去评价按钮 -->
      <template v-else-if="shouldShowEvaluateButton">
        <view class="btn-single">
          <button class="btn-primary" @click="goEvaluate">去评价</button>
        </view>
      </template>
      <!-- 待评价状态且裁教已评价时不显示按钮 -->
      <template v-else-if="orderStatus === ORDER_STATUS.PENDING_REVIEW"></template>
      <!-- 其他状态显示联系客服 -->
      <template v-else>
        <view class="btn-single">
          <button class="btn-service" @click="contactService">联系客服</button>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onUnload, onShow } from '@dcloudio/uni-app'
import { nextTick, watch, getCurrentInstance } from 'vue'
import { openMapNavigation, isMockVenue, calculateDistance, makePhoneCall } from '@/utils/platform'
import { getOrderDetail, finishService, acceptOrder as acceptOrderApi, rejectOrder as rejectOrderApi, confirmDeparture as confirmDepartureApi, arrive as arriveApi, startService as startServiceApi, reportException as reportExceptionApi, startTimer as startTimerApi, endTimer as endTimerApi, getInProgressOrder } from '@/api/billiard/order'
import { getLocation } from '@/utils/location'
import { ORDER_PRICING_MODE, isFixedPricing, formatFenToYuan } from '@/utils/onsiteOrder'

	// 服务类型映射
	const getServiceTypeName = (serviceType) => {
		const serviceTypeMap = {
			1: '台球指导',
			2: '潮玩领航',
			3: '酒艺品鉴',
			4: '影视赏析'
		}
		return serviceTypeMap[serviceType] || '未知服务'
	}

	// 所有服务类型都需要位置校验
	const needLocationCheck = (serviceType) => {
		return true // 所有服务都需要位置校验
	}

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

// 订单进度状态
const departureConfirmTime = ref(null)
const arriveTime = ref(null)
const startTime = ref(null)

// 计时器轮询
let timerPollTimer = null
// 本地秒级递减计时器
let localTimer = null
// 总教学时长（秒）
let totalDurationSec = 0
// 标记本地计时器是否已经启动
let localTimerStarted = false

// 计时显示文本
const usedText = ref('00:00')
const leftText = ref('00:00:00')

// 状态计算属性
const isProcessing = computed(() => orderStatus.value === ORDER_STATUS.PROCESSING)
const shouldShowEvaluateButton = computed(() => {
  const reviewStatus = orderInfo.value.coachUserReviewStatus
  return orderStatus.value === ORDER_STATUS.PENDING_REVIEW &&
    reviewStatus !== null &&
    reviewStatus !== undefined &&
    String(reviewStatus).trim() !== '' &&
    Number(reviewStatus) === 0
})

// 底部 footer 动态高度（用于撑开页面 padding-bottom，避免遮挡上方卡片）
const footerHeight = ref(0)
const footerPaddingBottom = computed(() => {
  const h = footerHeight.value || 200
  return `calc(${h}rpx + env(safe-area-inset-bottom) + 32rpx)`
})

const instance = getCurrentInstance()
const measureFooter = () => {
  nextTick(() => {
    try {
      const query = uni.createSelectorQuery().in(instance.proxy)
      query.select('#orderDetailFooter').boundingClientRect((rect) => {
        if (rect && rect.height) {
          // px -> rpx：rpx = px * (750 / windowWidth)
          const sys = uni.getSystemInfoSync()
          const ratio = 750 / (sys.windowWidth || 375)
          footerHeight.value = Math.ceil(rect.height * ratio)
        }
      }).exec()
    } catch (e) {
      console.warn('测量 footer 高度失败', e)
    }
  })
}

// 状态/进度变化时重新测量 footer 高度
watch([orderStatus, departureConfirmTime, arriveTime, startTime, () => orderInfo.value.serviceType], () => {
  measureFooter()
})

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
      return '已接单，待教学'
    case ORDER_STATUS.PENDING_REVIEW:
      return '教学已完成'
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
      return `金额 ¥${orderInfo.value.totalAmount ? formatFenToYuan(orderInfo.value.totalAmount) : '-'}`
    case ORDER_STATUS.PENDING:
      return `预约时间 ${orderInfo.value.bookingTimeText || '-'}`
    case ORDER_STATUS.ACCEPTED:
      return `预约时间 ${orderInfo.value.bookingTimeText || '-'}`
    case ORDER_STATUS.PENDING_REVIEW:
      return `教学时长 ${orderInfo.value.serviceDuration || '-'}分钟`
    case ORDER_STATUS.FINISHED:
      return `感谢您的教学`
    case ORDER_STATUS.CANCELLED:
      return '如有疑问请联系客服'
    default:
      return ''
  }
}

// 时间格式化函数
const fmtMM = (s) => {
  const m = Math.floor(s / 60)
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const min = m % 60
    return min > 0 ? `${h}小时${min}分钟` : `${h}小时`
  }
  return `${m}分钟`
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

const formatTime = (timestamp) => {
  if (!timestamp && timestamp !== 0) return ''

  let date
  if (typeof timestamp === 'number') {
    date = new Date(timestamp)
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp)
  } else {
    return ''
  }

  if (isNaN(date.getTime())) {
    return ''
  }

  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
}

const syncOrderInfo = (data) => {
  orderInfo.value = {
    ...orderInfo.value,
    ...data,
    bookingTimeText: formatTime(data.bookingTime),
    createTimeText: formatTime(data.createTime)
  }
  if (data.status) {
    orderStatus.value = data.status
  }
  departureConfirmTime.value = data.departureConfirmTime
  arriveTime.value = data.arriveTime
  startTime.value = data.startTime
}

const syncProcessingTimer = (data, isInitial = false) => {
  // 固定价订单：只展示已服务时长，不计算剩余时间
  if (isFixedPricing(data.pricingMode ?? orderInfo.value.pricingMode)) {
    if (data.startTime) {
      usedSec.value = Math.floor((Date.now() - new Date(data.startTime).getTime()) / 1000)
    }
    usedText.value = fmtHHMM(usedSec.value)
    leftText.value = ''
    totalDurationSec = 0
    return
  }

  // 小时价订单：原有逻辑
  // 保存总教学时长
  if (data.serviceDuration) {
    totalDurationSec = data.serviceDuration * 60
  }

  // 只有在初始化时才从服务端同步时间
  if (isInitial || !localTimerStarted) {
    if (data.startTime) {
      usedSec.value = Math.floor((Date.now() - new Date(data.startTime).getTime()) / 1000)
    }

    // 优先用服务端剩余时间，但如果有总时长，后续用本地计算保持一致性
    if (data.remainingMinutes !== undefined && data.remainingMinutes !== null) {
      leftSec.value = data.remainingMinutes * 60
    } else if (data.serviceDuration && data.startTime) {
      const elapsed = Math.floor((Date.now() - new Date(data.startTime).getTime()) / 1000)
      leftSec.value = Math.max(0, totalDurationSec - elapsed)
    }

    // 校验：如果有总时长，确保已用+剩余=总时长
    if (totalDurationSec > 0) {
      const diff = totalDurationSec - usedSec.value - leftSec.value
      if (Math.abs(diff) <= 60 && diff !== 0) {
        // 相差在1分钟内，调整剩余时间使等式成立
        leftSec.value = Math.max(0, totalDurationSec - usedSec.value)
      }
    }
  } else {
    // 后续轮询只更新已用时间（用于展示），不更新剩余时间（避免跳动）
    // 剩余时间完全由本地计时器维护，确保已用+剩余=总时长
    if (data.startTime) {
      usedSec.value = Math.floor((Date.now() - new Date(data.startTime).getTime()) / 1000)
    }
  }

  usedText.value = fmtMM(usedSec.value)
  leftText.value = fmtHHMM(leftSec.value)
}

// 获取订单详情
const fetchOrderDetail = async () => {
  if (!orderId.value) return

  try {
    const res = await getOrderDetail(orderId.value)
    if (res.data) {
      console.log('订单详情数据:', res.data)
      syncOrderInfo(res.data)

      if (orderStatus.value === ORDER_STATUS.PROCESSING) {
        syncProcessingTimer(res.data, true)
        startLocalTimer()
        startInProgressPolling()
      } else {
        stopLocalTimer()
        stopInProgressPolling()
      }
    }
  } catch (err) {
    console.error('获取订单详情失败', err)
    uni.showToast({ title: '获取订单详情失败', icon: 'none' })
  }
}

const startLocalTimer = () => {
  stopLocalTimer()
  const isFixed = isFixedPricing(orderInfo.value.pricingMode)
  usedText.value = isFixed ? fmtHHMM(usedSec.value) : fmtMM(usedSec.value)
  leftText.value = isFixed ? '' : fmtHHMM(leftSec.value)
  localTimerStarted = true

  localTimer = setInterval(() => {
    // 固定价：只累加已服务时长，不计算剩余
    if (isFixed) {
      usedSec.value++
      usedText.value = fmtHHMM(usedSec.value)
      return
    }
    // 小时价：原有逻辑
    // 如果有总时长，用总时长来计算，确保已用+剩余=总时长
    if (totalDurationSec > 0) {
      usedSec.value++
      leftSec.value = Math.max(0, totalDurationSec - usedSec.value)
    } else {
      // 没有总时长时，按原方式分别计算
      usedSec.value++
      if (leftSec.value > 0) {
        leftSec.value--
      }
    }

    usedText.value = fmtMM(usedSec.value)
    leftText.value = fmtHHMM(leftSec.value)
  }, 1000)
}

const stopLocalTimer = () => {
  if (localTimer) {
    clearInterval(localTimer)
    localTimer = null
  }
  localTimerStarted = false
}

const startInProgressPolling = () => {
  fetchInProgressOrder()
  if (timerPollTimer) clearInterval(timerPollTimer)
  timerPollTimer = setInterval(() => {
    fetchInProgressOrder()
  }, 5000)
}

const stopInProgressPolling = () => {
  if (timerPollTimer) {
    clearInterval(timerPollTimer)
    timerPollTimer = null
  }
}

const fetchInProgressOrder = async () => {
  if (orderStatus.value !== ORDER_STATUS.PROCESSING) return
  try {
    const resp = await getInProgressOrder()
    if (!resp?.data) {
      await fetchOrderDetail()
      return
    }

    const data = resp.data
    syncOrderInfo(data)

    if (orderStatus.value !== ORDER_STATUS.PROCESSING) {
      stopLocalTimer()
      stopInProgressPolling()
      return
    }

    syncProcessingTimer(data)
  } catch (err) {
    console.error('查询进行中订单失败', err)
  }
}

const confirmDeparture = async () => {
  try {
    await confirmDepartureApi({
      orderId: orderId.value
    })
    departureConfirmTime.value = new Date().toISOString()
    uni.showToast({ title: '已确认出发', icon: 'success' })
    await fetchOrderDetail()
  } catch (err) {
    console.error('确认出发失败', err)
    uni.showToast({ title: err?.msg || '操作失败', icon: 'none' })
  }
}

// 校验是否在允许范围内
const checkLocationInRange = (targetLat, targetLon, maxDistance = 1000) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 校验目标坐标是否有效
      if (!targetLat || !targetLon) {
        reject(new Error('场馆坐标信息缺失'))
        return
      }

      // 每次都重新获取当前位置，确保位置新鲜准确
      const location = await getLocation()

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

const arrive = async () => {
  // 所有服务都需要位置校验
  uni.showLoading({ title: '校验位置...' })

  try {
    // 先校验位置
    const targetLat = orderInfo.value.venueLatitude
    const targetLon = orderInfo.value.venueLongitude

    if (targetLat && targetLon) {
      await checkLocationInRange(targetLat, targetLon, 1000)
    }

    uni.hideLoading()

    await arriveApi({
      orderId: orderId.value
    })
    arriveTime.value = new Date().toISOString()
    uni.showToast({ title: '已到达', icon: 'success' })
    await fetchOrderDetail()
  } catch (err) {
    uni.hideLoading()
    console.error('确认到达失败', err)
    // 如果是位置校验失败，显示具体错误
    if (err.message && err.message.includes('距离')) {
      uni.showToast({ title: err.message, icon: 'none', duration: 3000 })
    } else {
      uni.showToast({ title: err?.msg || '操作失败', icon: 'none' })
    }
  }
}

const startService = async () => {
  try {
    await startServiceApi({
      orderId: orderId.value
    })
    const timerResp = await startTimerApi({
      orderId: orderId.value
    })
    console.log('计时器已启动:', timerResp)
    orderStatus.value = ORDER_STATUS.PROCESSING
    startTime.value = new Date().toISOString()

    await fetchInProgressOrder()
    startLocalTimer()
    startInProgressPolling()
    uni.showToast({ title: '教学已开始', icon: 'success' })
  } catch (err) {
    console.error('开始教学失败', err)
    uni.showToast({ title: err?.msg || '操作失败', icon: 'none' })
  }
}

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
                orderId: orderId.value,
                exceptionType: type,
                reason: content
              })
              uni.showToast({ title: '已提交异常', icon: 'success' })
            } catch (err) {
              uni.showToast({ title: err?.msg || '提交失败', icon: 'none' })
            }
          }
        }
      })
    }
  })
}

onLoad((options) => {
  orderId.value = options.orderId ? parseInt(options.orderId) : null
  orderStatus.value = options.status ? parseInt(options.status) : null

  if (orderId.value) {
    fetchOrderDetail()
  } else {
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

const navigate = () => {
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

const makeCall = () => {
  const realMobile = orderInfo.value.userRealMobile || orderInfo.value.userPhone
  if (!realMobile) {
    uni.showToast({ title: '暂无联系电话', icon: 'none' })
    return
  }

  // 使用封装好的拨打电话函数，包含权限管控
  makePhoneCall(realMobile)
}

const goToUserReviewHistory = () => {
  if (!orderInfo.value.userId) {
    uni.showToast({ title: '用户信息不完整', icon: 'none' })
    return
  }
  uni.navigateTo({
    url: `/subpkg/order/user-review-history?userId=${orderInfo.value.userId}&userName=${encodeURIComponent(orderInfo.value.userNickname || orderInfo.value.userPhone || '')}&userAvatar=${encodeURIComponent(orderInfo.value.userAvatar || '')}`
  })
}

const contactService = () => {
  const hotline = '15900560488'
  // 使用封装好的拨打电话函数，包含权限管控
  makePhoneCall(hotline)
}

const goEvaluate = () => {
  uni.navigateTo({ url: `/subpkg/order/review?orderId=${orderId.value}` })
}

const acceptOrder = async () => {
  uni.showLoading({ title: '接单中...' })
  try {
    await acceptOrderApi({
      orderId: orderId.value
    })
    uni.hideLoading()
    uni.showToast({ title: '接单成功', icon: 'success' })
    await fetchOrderDetail()
  } catch (err) {
    uni.hideLoading()
    console.error('接单失败', err)
    uni.showToast({ title: err?.msg || '接单失败', icon: 'none' })
  }
}

const rejectOrder = () => {
  uni.showModal({
    title: '确认拒单',
    content: '确定要拒绝此订单吗？',
    editable: true,
    placeholderText: '请输入拒单原因（可选）',
    success: async (res) => {
      if (res.confirm) {
        try {
          await rejectOrderApi({
            orderId: orderId.value,
            rejectReason: res.content || ''
          })
          uni.showToast({ title: '已拒绝', icon: 'success' })
          await fetchOrderDetail()
        } catch (err) {
          console.error('拒单失败', err)
          uni.showToast({ title: err?.msg || '拒单失败', icon: 'none' })
        }
      }
    }
  })
}

const endService = () => {
  uni.showModal({
    title: '确认结束',
    content: '确定要结束当前教学吗？结束后无法继续计时',
    success: async (res) => {
      if (res.confirm) {
        try {
          const timerResp = await endTimerApi({
            orderId: orderId.value
          })
          console.log('计时器已结束:', timerResp)
          await finishService({
            orderId: orderId.value
          })
          stopLocalTimer()
          stopInProgressPolling()
          await fetchOrderDetail()
          uni.$emit('serviceEnded', {
            orderId: orderId.value,
            usedTime: usedText.value
          })
          uni.showToast({ title: '教学已结束', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack()
          }, 1000)
        } catch (err) {
          console.error('结束教学失败', err)
          uni.showToast({ title: err?.msg || '操作失败', icon: 'none' })
        }
      }
    }
  })
}

onShow(() => {
  if (orderId.value) {
    fetchOrderDetail()
  }
})

onUnload(() => {
  stopLocalTimer()
  stopInProgressPolling()
})
</script>

<style lang="scss" scoped>
.order-detail-wrapper {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  box-sizing: border-box;
}

.timer-section {
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  text-align: center;
  padding: 50rpx 30rpx 60rpx;
  padding-top: calc(50rpx + var(--status-bar-height, 0px));
  margin-bottom: -20rpx;

  .status-tag {
    margin-bottom: 24rpx;
  }

  .big-time {
    font-size: 100rpx;
    font-weight: bold;
    color: #fff;
    display: block;
    line-height: 1;
    margin: 20rpx 0;
  }

  .time-label {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.8);
    display: block;
    margin-bottom: 16rpx;
  }

  .left-time {
    font-size: 28rpx;
    color: #ffeb3b;
    font-weight: bold;
  }
}

.status-section {
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  padding: 50rpx 32rpx;
  padding-top: calc(50rpx + var(--status-bar-height, 0px));
  margin-bottom: -20rpx;
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
    background: rgba(255, 255, 255, 0.2);
  }

  .status-content {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  .status-main-text {
    font-size: 34rpx;
    font-weight: bold;
    color: #fff;
  }

  .status-sub-text {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.85);
  }
}

.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin: 30rpx 24rpx 0;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .card-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 28rpx;
  }
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }

  .label {
    font-size: 28rpx;
    color: #6b7280;
  }

  .value {
    font-size: 28rpx;
    color: #374151;
    font-weight: 500;
  }

  .price {
    color: #2f6bee;
    font-weight: bold;
    font-size: 32rpx;
  }

  .price-unit {
    font-size: 24rpx;
    font-weight: normal;
    color: #9ca3af;
    margin-left: 8rpx;
  }
}

.shop-img {
  width: 100%;
  height: 320rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  border: 2rpx solid #f3f4f6;
}

.shop-info {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .shop-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10rpx;

    .shop-name {
      font-size: 30rpx;
      font-weight: 600;
      color: #1f2937;
    }

    .shop-address {
      font-size: 26rpx;
      color: #6b7280;
    }
  }

  .nav-btn {
    width: 84rpx;
    height: 84rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.3);
    transition: transform 0.2s;

    &:active {
      transform: scale(0.95);
    }
  }
}

.customer-info {
  display: flex;
  align-items: center;
  gap: 20rpx;

  .avatar {
    width: 92rpx;
    height: 92rpx;
    border-radius: 50%;
    border: 2rpx solid #f3f4f6;
  }

  .customer-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .customer-name {
      font-size: 30rpx;
      font-weight: 600;
      color: #1f2937;
    }

    .customer-phone {
      font-size: 26rpx;
      color: #6b7280;
    }
  }
  .customer-actions {
    display: flex;
    align-items: center;
    margin-left: auto;
  }

  .call-btn-mini {
    width: 64rpx;
    height: 64rpx;
    border-radius: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0fdf4;
    margin-right: 12rpx;
  }

  .call-btn {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    transition: transform 0.2s;

    &:active {
      transform: scale(0.95);
    }
  }
}


.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  padding: 24rpx 0;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  z-index: 99;

  .btn-row {
    display: flex;
    gap: 16rpx;
    padding: 0 24rpx;
  }

  .btn-single {
    padding: 0 24rpx;
  }

  .btn-danger, .btn-primary, .btn-success, .btn-warning, .btn-end, .btn-service {
    width: 100%;
    height: 96rpx;
    line-height: 96rpx;
    border-radius: 20rpx;
    font-size: 32rpx;
    font-weight: 600;
    border: none;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
    transition: transform 0.2s, box-shadow 0.2s;

    &:active {
      transform: scale(0.98);
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
    }

    &::after {
      border: none;
    }
  }

  .btn-danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: #fff;
    box-shadow: 0 8rpx 20rpx rgba(245, 63, 63, 0.25);
  }

  .btn-primary {
    background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
    color: #fff;
    box-shadow: 0 8rpx 20rpx rgba(47, 107, 238, 0.3);
  }

  .btn-success {
    background: linear-gradient(135deg, #10b981 0%, #0da271 100%);
    color: #fff;
    box-shadow: 0 8rpx 20rpx rgba(16, 185, 129, 0.25);
  }

  .btn-warning {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: #fff;
    box-shadow: 0 8rpx 20rpx rgba(245, 158, 11, 0.25);
  }

  .btn-end {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: #fff;
    box-shadow: 0 8rpx 20rpx rgba(245, 63, 63, 0.25);
  }

  .btn-service {
    background: #fff;
    color: #374151;
    border: 2rpx solid #e5e7eb;
    font-weight: 500;
    box-shadow: none;
  }

  .status-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    padding: 24rpx;
    background: rgba(16, 185, 129, 0.1);
    border-radius: 16rpx;
    margin: 0 24rpx 16rpx;

    .hint-text {
      font-size: 26rpx;
      color: #10b981;
      font-weight: 500;
    }
  }
}

:deep(.uni-button) {
  border: none;
  box-shadow: none;
  outline: none;
}
</style>
