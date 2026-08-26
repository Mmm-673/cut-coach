<template>
	<view class="workbench-wrapper">

		<!-- 工作状态卡片 -->
		<uni-card title="工作状态" :is-shadow="true" :border="false">
			<view class="status-row">
				<text class="status-label">当前状态</text>
				<view class="switch-wrapper">
					<text class="label-off" :class="{ active: !isOnline }">下线</text>
					<view class="custom-switch" :class="{ 'is-checked': isOnline, 'is-disabled': switchLoading }"
						@click="handleSwitchClick">
						<view class="switch-knob"></view>
					</view>
					<text class="label-on" :class="{ active: isOnline }">上线</text>
				</view>
			</view>
			<view class="status-row">
				<text class="status-label">低碳出行</text>
				<view class="switch-wrapper">
					<text class="label-off" :class="{ active: !isFreeTravel }">关闭</text>
					<view class="custom-switch"
						:class="{ 'is-checked': isFreeTravel, 'is-disabled': freeTravelLoading }"
						@click="handleFreeTravelSwitchClick">
						<view class="switch-knob"></view>
					</view>
					<text class="label-on" :class="{ active: isFreeTravel }">开启</text>
				</view>
			</view>
<!--			<view class="status-row">-->
<!--				<text class="status-label">更新位置</text>-->
<!--				<view class="button-wrapper">-->
<!--					<button class="update-location-btn" :class="{ 'is-disabled': updatingLocation }"-->
<!--						@click="reportLocationAfterLogin">-->
<!--						{{ updatingLocation ? '更新中...' : '更新位置' }}-->
<!--					</button>-->
<!--				</view>-->
<!--			</view>-->
			<uni-tag :text="isOnline ? '在线接单中' : '已下线，不接收新订单'" :type="isOnline ? 'success' : 'default'" size="normal"
				class="status-tag" style="font-weight: bold" />
			<!-- 模拟打赏动效（调试用） -->
			<view class="debug-trigger" @click="mockRewardHeart">
				<uni-icons type="heart-filled" size="14" color="#ff4d6d"></uni-icons>
				<text class="debug-text">模拟收到打赏</text>
			</view>
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
						<uni-icons type="location" size="18" color="#2F6BEE" ></uni-icons>
						<text class="location-text">{{ pendingOrder.venueName }}</text>
					</view>
					<view class="countdown" v-if="pendingOrder.expireAt">
						<uni-tag text="剩余" type="warning" size="small" style="font-weight: bold" />
						<text class="time-text">{{ pendingCountdownText }}</text>
					</view>
				</view>

				<view class="order-info">
					<text class="order-name">{{ getServiceTypeName(pendingOrder.serviceType) }}
						{{ Math.round(pendingOrder.serviceDuration) }}分钟</text>
					<text class="order-price">¥{{ (pendingOrder.totalAmount / 100).toFixed(2) }}</text>
				</view>

				<!-- 用户历史评价信息 -->
				<view class="user-review-section"
					v-if="pendingOrder.userAverageScore || pendingOrder.latestUserReviewContent">
					<view class="review-header">
						<uni-icons type="star-filled" size="16" color="#ff9500"></uni-icons>
						<text class="review-title">用户评价</text>
					</view>
					<view class="review-content">
						<view class="avg-score" v-if="pendingOrder.userAverageScore">
							<uni-icons v-for="n in 5" :key="n"
								:type="n <= Math.round(pendingOrder.userAverageScore) ? 'star-filled' : 'star'"
								size="14"
								:color="n <= Math.round(pendingOrder.userAverageScore) ? '#ff9500' : '#d1d5db'"></uni-icons>
							<text class="score-text">{{ pendingOrder.userAverageScore.toFixed(1) }}分</text>
							<text class="review-count" v-if="pendingOrder.userReviewCount">
								({{ pendingOrder.userReviewCount }}次评价)
							</text>
						</view>
						<view class="latest-review" v-if="pendingOrder.latestUserReviewContent">
							<text class="review-label">最新评价：</text>
							<text class="review-text">{{ pendingOrder.latestUserReviewContent }}</text>
						</view>
					</view>
				</view>

				<view class="order-detail-row">
					<text class="detail-label">预约时间：</text>
					<text class="detail-value">{{ formatTime(pendingOrder.bookingTime) }}</text>
				</view>
				<view class="order-detail-row">
					<text class="detail-label">服务地址：</text>
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
					<text class="order-title">{{ getServiceTypeName(pendingOrder.serviceType) }}</text>
					<uni-tag :text="acceptedStageText" type="warning" size="small" style="font-weight: bold" />
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

				<!-- 台球服务完整流程 -->
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

				<!-- 其他服务简化流程 -->
				<template v-else>
					<view class="btn-group" v-if="!pendingOrder.arriveTime">
						<button class="btn btn-arrive" @click="arrive">确认到达</button>
					</view>

					<view class="status-hint" v-if="pendingOrder.arriveTime">
						<uni-icons type="checkmarkempty" size="20" color="#10B981"></uni-icons>
						<text class="hint-text">已到达约定地点，开始服务</text>
					</view>
				</template>


				<!-- 开始服务按钮 - 所有服务都需要到达后才显示 -->
				<view class="btn-group" v-if="canStartService">
					<button class="btn btn-exception" @click="showReportException">报告异常</button>
					<button class="btn btn-accept" @click="startService">开始服务</button>
				</view>

				<!-- 导航和联系客户 - 所有服务都显示 -->
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

		<!-- 教学中状态 -->
		<uni-card v-else-if="orderStatus === 'serving'" title="进行中教学" :is-shadow="true" :border="false">
			<view class="serving-order">
				<!-- 剩余时长：仅小时价订单展示 -->
				<view class="serve-top" v-if="!isFixedPricing(pendingOrder.pricingMode)">
					<text class="left-time">剩余时长 {{ servingLeftTimeText }}</text>
				</view>

				<view class="timer-box">
					<text class="big-time">{{ servingUsedTimeText }}</text>
					<text class="time-desc">已服务时长</text>
				</view>

				<button class="btn-end" @click="endService">结束教学</button>

				<uni-section title="订单详情" type="line" margin-top="20rpx">
					<view class="detail-box" @click="goToDetail">
						<image class="shop-img" :src="pendingOrder.shopImg || 'https://picsum.photos/120/120'"
							mode="aspectFill"></image>
						<view class="info">
							<text class="shop-name">{{ pendingOrder.venueName }}</text>
							<view class="contact-row">
								<text>客户：{{ pendingOrder.userPhone }}</text>
								<button class="call-btn" @click.stop="makeCall">
									<uni-icons type="phone" size="16" color="#10B981"></uni-icons>
								</button>
							</view>
							<text class="service-name">{{ getServiceTypeName(pendingOrder.serviceType) }}</text>
							<text class="service-price">
								¥{{ formatFenToYuan(pendingOrder.totalAmount) }}
								<text class="price-unit">{{ isFixedPricing(pendingOrder.pricingMode) ? '/次' : '/小时' }}</text>
							</text>
							<!-- 加钟提示：仅小时价订单展示 -->
							<view class="tip-box" v-if="!isFixedPricing(pendingOrder.pricingMode)">
								<uni-icons type="info" size="14" color="#F59E0B"></uni-icons>
								<text>支持客户加钟，时长自动更新</text>
							</view>
							<!-- 固定价提示 -->
							<view class="tip-box" v-else>
								<uni-icons type="info" size="14" color="#10b981"></uni-icons>
								<text>固定价服务，时长不影响费用</text>
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
					<uni-tag text="实时" type="success" size="mini" class="real-tag" style="font-weight: bold"></uni-tag>
				</view>
			</view>
		</uni-section>

		<!-- 历史订单 -->
		<uni-card :is-shadow="true" :border="false">
			<view class="card-header">
				<text class="card-title">历史订单</text>
				<text class="view-all-text" @click="goToAllOrder">查看全部</text>
			</view>
			<uni-segmented-control :current="historyTabIndex" :values="historyTabs.map(t => t.label)"
				activeColor="#2F6BEE" style-type="button" class="history-tabs" @clickItem="onHistoryTabClick" />
			<view class="history-order-list">
				<view class="history-order-item" v-for="item in displayHistoryOrders" :key="item.orderId"
					@click="goToOrderDetail(item)">
					<view class="order-top">
						<text class="order-title">{{ getServiceTypeName(item.serviceType) }}</text>
						<text class="order-price">¥{{ (item.totalAmount / 100).toFixed(2) }}</text>
					</view>
					<view class="order-bottom">
						<text class="order-time">{{ formatOrderTime(item.bookingTime) }}</text>
						<uni-tag :text="getHistoryStatusText(item.status)" :type="getHistoryStatusType(item.status)"
							size="small" style="font-weight: bold" />
					</view>
				</view>
				<view class="empty-tip" v-if="!displayHistoryOrders.length">
					暂无订单
				</view>
			</view>
		</uni-card>

		<!-- 霸屏小心心动效组件 -->
		<fullscreen-heart ref="heartAnimRef" />

	</view>
</template>

<script setup>
	import {
		ref,
		computed,
		onMounted,
		onUnmounted,
		getCurrentInstance
	} from 'vue'
	import {
		onShow
	} from '@dcloudio/uni-app'
	import {
		updateWorkStatus,
		updateLocation,
		updateFreeTravel,
		getCoachDashboard,
		getWorkStatus,
		getCoachProfile
	} from '@/api/billiard/coach'
	import {
		getPendingOrders,
		getCurrentUnfinishedOrder,
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
			getCountdownEnabled
	} from '@/api/billiard/order'
	import {
		getLocation,
		showPermissionModal
	} from '@/utils/location'
	import {
		openMapNavigation,
		makePhoneCall as makePhoneCallUtil,
		calculateDistance
	} from '@/utils/platform'
	import { locationPermissionMessages } from '@/utils/permission-messages'
	import { isFixedPricing, formatFenToYuan } from '@/utils/onsiteOrder'
	import { getLatestHeartMessage } from '@/api/billiard/message'
	import fullscreenHeart from '@/components/fullscreen-heart/fullscreen-heart.vue'

	const {
		proxy
	} = getCurrentInstance()

	// 霸屏小心心动效组件引用
	const heartAnimRef = ref(null)

	// ====================== 基础状态 ======================
	const isOnline = ref(false)
	const isFreeTravel = ref(false)
	const switchLoading = ref(false)
	const freeTravelLoading = ref(false)
	const updatingLocation = ref(false)

	// 订单状态
	const orderStatus = ref('idle')

	// 倒计时开关状态缓存
	const countdownEnabled = ref(false)

	// 历史订单 tab
	const historyTabs = [{
			label: '待评价',
			value: 50
		},
		{
			label: '已完成',
			value: 60
		},
		{
			label: '已取消',
			value: 70
		}
	]
	const historyTab = ref(60)

	// 轮询相关
	let pollTimer = null
	let pendingTimer = null
	let usedTimer = null
	let leftTimer = null
	let fetchingOrders = false
	let hasCurrentUnfinishedOrder = false

	// 待接单数据
	const pendingOrder = ref({})
	const pendingCountdown = ref(0)
	const pendingCountdownText = ref('0分0秒')
	const pendingReviewSnapshot = ref({
		orderId: null,
		userAverageScore: null,
		userReviewCount: null,
		latestUserReviewContent: ''
	})

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
		return true // 所有服务都需要位置校验（打卡）
	}

	// 判断是否可以开始服务
	const canStartService = computed(() => {
		if (!pendingOrder.value || !pendingOrder.value.serviceType) return false
		if (pendingOrder.value.startTime) return false // 已经开始了就不显示

		// 所有服务都需要到达后才能开始
		return !!pendingOrder.value.arriveTime
	})

	const acceptedStageText = computed(() => {
		if (!pendingOrder.value || !pendingOrder.value.serviceType) return '已接单'

		if (pendingOrder.value.startTime) {
			return '服务中'
		}

		// 台球服务显示完整阶段
		if (pendingOrder.value.serviceType === 1) {
			if (!pendingOrder.value.departureConfirmTime) {
				return '未出发'
			}

			if (!pendingOrder.value.arriveTime) {
				return '已出发未到达'
			}

			return '已到达待开始'
		} else {
			// 其他服务简化阶段
			if (!pendingOrder.value.arriveTime) {
				return '待到达'
			}

			return '已到达待开始'
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
		const today =
			`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
		const dateStr =
			`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
		const time = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
		if (dateStr === today) {
			return `今天 ${time}`
		}
		const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
		const yesterdayStr =
			`${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`
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

	const todayData = ref([{
			icon: 'calendar',
			value: '0小时0分',
			label: '今日上钟时长',
			color: '#2F6BEE',
			bgColor: '#EFF6FF'
		},
		{
			icon: 'checkbox',
			value: '0单',
			label: '今日教学次数',
			color: '#10B981',
			bgColor: '#ECFDF5'
		},
		{
			icon: 'wallet',
			value: '¥0',
			label: '预计收入',
			color: '#F59E0B',
			bgColor: '#FFF7ED'
		}
	])

	// 获取看板数据
	const fetchDashboard = async () => {
		try {
			const res = await getCoachDashboard()
			if (res.data) {
				const {
					todayServiceMinutes,
					todayServiceCount,
					todayEstimatedIncome
				} = res.data
				const hours = Math.floor(todayServiceMinutes / 60)
				const mins = todayServiceMinutes % 60
				todayData.value = [{
						icon: 'calendar',
						value: `${hours}小时${mins}分`,
						label: '今日上钟时长',
						color: '#2F6BEE',
						bgColor: '#EFF6FF'
					},
					{
						icon: 'checkbox',
						value: `${todayServiceCount}单`,
						label: '今日教学次数',
						color: '#10B981',
						bgColor: '#ECFDF5'
					},
					{
						icon: 'wallet',
						value: `¥${Number(todayEstimatedIncome).toFixed(2)}`,
						label: '预计收入',
						color: '#F59E0B',
						bgColor: '#FFF7ED'
					}
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
		const h = Math.floor(s / 3600)
		const m = Math.floor((s % 3600) / 60)
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
			const {
				longitude,
				latitude
			} = await getLocation({
				needRegeocode: false
			})
			currentLocation.value = {
				longitude,
				latitude
			}
			return {
				longitude,
				latitude
			}
		} catch (err) {
			if (err.message === 'permission_denied') {
				showPermissionModal({
					content: '您未开启定位权限，将无法接单和打卡。是否前往开启？',
					onSuccess: getCurrentLocation
				})
			} else {
				uni.showToast({
					title: '更新失败',
					icon: 'none'
				})
			}
			throw err
		} finally {
			locating.value = false
		}
	}

	// 更新位置方法（从登录页面迁移）
	const reportLocationAfterLogin = async () => {
		if (updatingLocation.value) return

		updatingLocation.value = true

		try {

			const location = await getCurrentLocation()
      console.log(location,'====location')
			try {
				await updateLocation({
					longitude: location.longitude,
					latitude: location.latitude
				})
				console.log('位置更新成功', location)
			} catch (err) {
				uni.showToast({
					title: err,
					icon: 'none'
				})
			}
		} catch (err) {
			console.warn('获取位置失败', err)

			if (err.message && err.message.includes('权限')) {
				uni.showModal({
					title: locationPermissionMessages.title,
					content: locationPermissionMessages.updateGuide.content,
					confirmText: '去设置',
					cancelText: '取消',
					success: (res) => {
						if (res.confirm) {
							// 这里可以添加打开权限设置的方法
							uni.openSetting({
								success: (res) => {
									if (res.authSetting['scope.userLocation']) {
										// 权限已开启，再次尝试更新位置
										reportLocationAfterLogin()
									}
								}
							})
						}
					}
				})
			} else {
				uni.showToast({
					title: '获取位置失败',
					icon: 'none'
				})
			}
		} finally {
			uni.hideLoading()
			updatingLocation.value = false
		}
	}

	// 校验是否在允许范围内（默认200米）
	const checkLocationInRange = (targetLat, targetLon, maxDistance = 1000) => {
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

		if (orderStatus.value === 'serving') {
			uni.showToast({
				title: '请先结束教学后再下线',
				icon: 'none'
			})
			return
		}

		uni.showModal({
			title: '确认下线',
			content: '确认下线吗？下线后将无法接收新订单',
			success: (res) => {
				if (res.confirm) {
					onSwitchChange(targetStatus)
				}
			}
		})
	}

	// 低碳出行开关点击
	const handleFreeTravelSwitchClick = () => {
		if (freeTravelLoading.value) return
		const targetStatus = !isFreeTravel.value

		uni.showModal({
			title: '确认切换',
			content: targetStatus ? '确认开启低碳出行？' : '确认关闭低碳出行？',
			success: async (res) => {
				if (res.confirm) {
					freeTravelLoading.value = true
					try {
						await updateFreeTravel({
							freeTravel: targetStatus
						})
						isFreeTravel.value = targetStatus
						proxy.$modal.msgSuccess(targetStatus ? '已开启低碳出行' : '已关闭低碳出行')
					} catch (err) {
						console.error('切换低碳出行失败', err)
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
				stopHeartMessagePolling()
				applyIdleState()
			}

			isOnline.value = targetStatus
			proxy.$modal.msgSuccess(targetStatus ? '已上线' : '已下线')
		} catch (err) {
			console.error('切换状态失败', err)
			proxy.$modal.msgError(err || '操作失败')
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
		// 开启霸屏小心心消息轮询
		startHeartMessagePolling()
	}

	// 开始轮询（待接单优先，没有待接单再查询进行中订单）
	const startPolling = () => {
		if (orderStatus.value === 'serving') return
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

	const getPendingList = async () => {
		const res = await getPendingOrders()
		return res.data?.list || []
	}

	const cachePendingReviewFields = (order) => {
		const orderId = getOrderId(order)
		pendingReviewSnapshot.value = {
			orderId,
			userAverageScore: order?.userAverageScore ?? null,
			userReviewCount: order?.userReviewCount ?? null,
			latestUserReviewContent: order?.latestUserReviewContent || ''
		}
	}

	const clearPendingReviewFields = () => {
		pendingReviewSnapshot.value = {
			orderId: null,
			userAverageScore: null,
			userReviewCount: null,
			latestUserReviewContent: ''
		}
	}

	const mergePendingReviewFields = (order) => {
		const orderId = getOrderId(order)
		const snapshot = pendingReviewSnapshot.value
		if (!orderId || snapshot.orderId !== orderId) return order

		return {
			...order,
			userAverageScore: snapshot.userAverageScore,
			userReviewCount: snapshot.userReviewCount,
			latestUserReviewContent: snapshot.latestUserReviewContent
		}
	}

	const stopPendingCountdown = () => {
		if (pendingTimer) {
			clearInterval(pendingTimer)
			pendingTimer = null
		}
	}

	const stopServeTimer = () => {
		clearInterval(usedTimer)
		clearInterval(leftTimer)
		usedTimer = null
		leftTimer = null
	}

	const startDiscoveryPollingIfNeeded = () => {
		if (!isOnline.value || orderStatus.value === 'serving' || pollTimer) return

		pollTimer = setInterval(() => {
			fetchOrders()
		}, 5000)
	}

	const applyPendingOrder = (order) => {
		stopTimerPolling()
		stopServeTimer()
		cachePendingReviewFields(order)
		pendingOrder.value = mergePendingReviewFields(order)
		orderStatus.value = 'pending'
		updatePendingCountdown(pendingOrder.value)
	}

	// ====================== 霸屏小心心动效（后台消息触发） ======================
	// 播放霸屏小心心动效
	const playHeartAnimation = (info) => {
		if (!heartAnimRef.value) return
		heartAnimRef.value.play(info, { duration: 5000 })
	}

	// 模拟收到打赏（调试用：点击模拟按钮触发）
	// 真实场景：由消息轮询接口返回数据后调用
	const mockRewardHeart = () => {
		const mockReward = {
			avatar: '',
			nickname: '小美同学',
			content: '教练教得超棒，下次还约！💕',
			amount: '88.00',
			tags: ['萌新', '颜值高'],
		}
		playHeartAnimation(mockReward)
	}

	// 后台消息轮询（用于触发霸屏小心心动效）
	// 后端提供一个接口，轮询是否有新的点赞/好评/打赏等消息
	let heartMessagePollTimer = null
	let lastHeartMsgId = null // 记录上一次展示的消息 ID，避免重复播放

	const pollHeartMessage = async () => {
		try {
			const res = await getLatestHeartMessage()
			if (res.code === 200 && res.data && res.data.id !== lastHeartMsgId) {
				lastHeartMsgId = res.data.id
				const info = {
					avatar: res.data.avatar || '',
					nickname: res.data.nickname || '',
					content: res.data.content || '',
					amount: res.data.amount || '0.00',
					tags: res.data.tags || [],
				}
				playHeartAnimation(info)
			}
		} catch (err) {
			console.error('获取心跳消息失败', err)
		}
	}

	const startHeartMessagePolling = () => {
		if (heartMessagePollTimer) return
		// 每 10 秒轮询一次（上线时开启）
		heartMessagePollTimer = setInterval(() => {
			pollHeartMessage()
		}, 10000)
	}

	const stopHeartMessagePolling = () => {
		if (heartMessagePollTimer) {
			clearInterval(heartMessagePollTimer)
			heartMessagePollTimer = null
		}
	}

	const applyAcceptedOrder = (order) => {
		stopTimerPolling()
		stopServeTimer()
		stopPendingCountdown()
		clearPendingReviewFields()
		pendingOrder.value = order
		orderStatus.value = 'accepted'
	}

	const applyServingOrder = (order) => {
		stopPolling()
		stopPendingCountdown()
		clearPendingReviewFields()
		pendingOrder.value = order
		orderStatus.value = 'serving'
		startServeTimer()
		startTimerPolling()
	}

	const applyIdleState = () => {
		pendingOrder.value = {}
		orderStatus.value = 'idle'
		stopTimerPolling()
		stopPendingCountdown()
		stopServeTimer()
		clearPendingReviewFields()
	}


	const resolveWorkbenchOrderState = async () => {
		if (!isOnline.value) {
			applyIdleState()
			return
		}

		clearPendingReviewFields()

		// 【新逻辑】优先查询 current-unfinished 接口
		try {
			const currentUnfinishedRes = await getCurrentUnfinishedOrder()
			if (currentUnfinishedRes.data && currentUnfinishedRes.data.status !== 20 ) {
				const order = currentUnfinishedRes.data

				// 根据返回的 status 字段直接处理
				if (order.status === 20) {
					// 待接单状态
					applyPendingOrder(order)
					return
				} else if (order.status === 30) {
					// 已接单状态
					applyAcceptedOrder(order)
					return
				} else if (order.status === 40) {
					// 进行中状态
					applyServingOrder(order)
					return
				}
			}
		} catch (err) {
			console.log("查询当前未完成订单失败", err)
		}

		// current-unfinished 没有数据，再查待接单列表
		let pendingList = []
		try {
			pendingList = await getPendingList()
		} catch (err) {
			console.error("查询待接单失败", err)
		}

		if (pendingList.length > 0) {
			applyPendingOrder(pendingList[0])
			return
		}

		applyIdleState()
	}

	// 查询订单（统一待接单优先，服务中交给计时轮询）
	const fetchOrders = async () => {
		if (fetchingOrders) return

		fetchingOrders = true
		try {
			await resolveWorkbenchOrderState()
		} catch (err) {
			console.error('查询订单失败', err)
		} finally {
			fetchingOrders = false
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
			// 根据缓存的开关状态决定是否启动倒计时
			// if (countdownEnabled.value) {
				startPendingCountdown()
			// }
		}
	}


	const updatePendingCountdownText = () => {
		const m = Math.floor(pendingCountdown.value / 60)
		const s = pendingCountdown.value % 60
		pendingCountdownText.value = `${m}分${s.toString().padStart(2, '0')}秒`
	}

	// 待接单倒计时
	const startPendingCountdown = () => {
		stopPendingCountdown()
		updatePendingCountdownText()
		pendingTimer = setInterval(() => {
			pendingCountdown.value--
			if (pendingCountdown.value <= 0) {
				applyIdleState()
				// 恢复轮询
				if (isOnline.value) {
					fetchOrders()
					startDiscoveryPollingIfNeeded()
				}
				return
			}
			updatePendingCountdownText()
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
						applyIdleState()
						// 拒单后重启轮询
						if (isOnline.value) {
							fetchOrders()
							startDiscoveryPollingIfNeeded()
						}
						uni.showToast({
							title: '已拒绝'
						})
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
		uni.showLoading({
			title: '接单中...'
		})
		const currentOrderId = getOrderId(pendingOrder.value)
		console.log('接单 - 当前订单ID:', currentOrderId)
		try {
			await acceptOrderApi({
				orderId: currentOrderId
			})
			uni.hideLoading()
			stopPendingCountdown()
			// 接单成功后查询当前未完成订单获取最新状态
			const orderRes = await getCurrentUnfinishedOrder()
			console.log('接单 - 当前未完成订单返回:', orderRes)
			if (orderRes.data) {
				applyAcceptedOrder(orderRes.data)
				console.log('接单 - 更新后的pendingOrder:', pendingOrder.value)
				console.log('接单 - 更新后的orderId:', getOrderId(pendingOrder.value))
			}
			uni.showToast({
				title: '接单成功',
				icon: 'success'
			})
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
			// 确认出发后查询当前未完成订单获取最新状态
			const orderRes = await getCurrentUnfinishedOrder()
			console.log('确认出发 - 当前未完成订单返回:', orderRes)
			if (orderRes.data) {
				applyAcceptedOrder(orderRes.data)
				console.log('确认出发 - 更新后的pendingOrder:', pendingOrder.value)
			}
			uni.showToast({
				title: '已确认出发',
				icon: 'success'
			})
		} catch (err) {
			console.error('确认出发失败', err)
			proxy.$modal.msgError(err?.msg || '操作失败')
		}
	}

	// 到达教学地址
	const arrive = async () => {
		// 校验当前位置是否在球厅范围内（200米内）
		uni.showLoading({
			title: '校验位置中...'
		})

		try {
			// 先校验位置
			const targetLat = pendingOrder.value.venueLatitude
			const targetLon = pendingOrder.value.venueLongitude

			if (targetLat && targetLon) {
				await checkLocationInRange(targetLat, targetLon, 1000)
			}

			uni.hideLoading()

			await arriveApi({
				orderId: getOrderId(pendingOrder.value)
			})
			// 确认到达后查询当前未完成订单获取最新状态
			const orderRes = await getCurrentUnfinishedOrder()
			if (orderRes.data) {
				applyAcceptedOrder(orderRes.data)
			}
			uni.showToast({
				title: '已到达',
				icon: 'success'
			})
		} catch (err) {
			uni.hideLoading()
			console.error('确认到达失败', err)
			// 如果是位置校验失败，显示具体错误
			if (err.message && err.message.includes('距离')) {
				uni.showToast({
					title: err.message,
					icon: 'none',
					duration: 3000
				})
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

			// 3. 启动服务中状态，优先使用服务端最新进行中数据校准时间
			try {
				const inProgressRes = await getCurrentUnfinishedOrder()
				if (inProgressRes.data) {
					applyServingOrder(inProgressRes.data)
				} else {
					applyServingOrder(pendingOrder.value)
				}
			} catch (err) {
				console.log('开始教学后获取进行中订单失败', err)
				applyServingOrder(pendingOrder.value)
			}
			uni.showToast({
				title: '教学已开始',
				icon: 'success'
			})
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
			// 使用 getCurrentUnfinishedOrder 来更新计时器信息
			const resp = await getCurrentUnfinishedOrder()
			if (resp && resp.data) {
				const data = resp.data
				if (data.status && data.status !== 40) {
					if (data.status === 30) {
						applyAcceptedOrder({
							...pendingOrder.value,
							...data
						})
					} else {
						await resolveWorkbenchOrderState()
					}
					return
				}

				// 更新订单信息
				pendingOrder.value = {
					...pendingOrder.value,
					...data
				}
				// 更新剩余时长 - 仅小时价订单
				if (!isFixedPricing(data.pricingMode ?? pendingOrder.value.pricingMode) &&
					data.remainingMinutes !== undefined && data.remainingMinutes !== null) {
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
		stopServeTimer()

		// 根据订单信息初始化计时
		if (pendingOrder.value.startTime) {
			usedSec.value = Math.floor((Date.now() - new Date(pendingOrder.value.startTime).getTime()) / 1000)
		} else {
			usedSec.value = 0
		}

			// 固定价订单：不计算剩余时长
			if (!isFixedPricing(pendingOrder.value.pricingMode)) {
				if (pendingOrder.value.remainingMinutes !== undefined && pendingOrder.value.remainingMinutes !== null) {
					leftSec.value = pendingOrder.value.remainingMinutes * 60
				} else {
					const totalDurationSeconds = (pendingOrder.value.serviceDuration || 60) * 60
					leftSec.value = Math.max(0, totalDurationSeconds - usedSec.value)
				}
				servingLeftTimeText.value = fmtHHMM(Math.max(0, leftSec.value))
			} else {
				servingLeftTimeText.value = ''
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
						applyIdleState()

						// 4. 查询真实看板数据
						fetchDashboard()

						// 5. 刷新历史订单
						fetchHistoryOrders()

						// 6. 重新开始轮询
						if (isOnline.value) {
							fetchOrders()
							startDiscoveryPollingIfNeeded()
						}

						uni.showToast({
							title: '教学已结束',
							icon: 'success'
						})
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
		if (!pendingOrder.value.userRealMobile) {
			uni.showToast({
				title: '暂无联系电话',
				icon: 'none'
			})
			return
		}
		makePhoneCallUtil(pendingOrder.value.userRealMobile)
	}

	// 报告异常弹窗
	const showReportException = () => {
		const exceptionTypes = [{
				label: '联系不到客户',
				value: 1
			},
			{
				label: '客户违规',
				value: 2
			},
			{
				label: '其他',
				value: 3
			}
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
								return uni.showToast({
									title: '请输入异常描述',
									icon: 'none'
								})
							}
							if (content.length > 500) {
								return uni.showToast({
									title: '描述不能超过500字',
									icon: 'none'
								})
							}
							try {
								await reportExceptionApi({
									orderId: getOrderId(pendingOrder.value),
									exceptionType: type,
									reason: content
								})
								uni.showToast({
									title: '已提交异常',
									icon: 'success'
								})
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
		uni.navigateTo({
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
		// 获取教练信息以获取低碳出行状态
		try {
			const profileRes = await getCoachProfile()
			if (profileRes.data) {
				isFreeTravel.value = profileRes.data.freeTravel
			}
		} catch (err) {
			console.error('获取教练信息失败', err)
		}
		// 获取倒计时开关状态
		// try {
		// 	const countdownRes = await getCountdownEnabled()
		// 	countdownEnabled.value = countdownRes.data === true
		// } catch (err) {
		// 	console.error('获取倒计时开关状态失败', err)
		// }

		if (!isOnline.value) {
			stopPolling()
			applyIdleState()
			return
		}

		await resolveWorkbenchOrderState()

		startDiscoveryPollingIfNeeded()
	}



	// #ifdef APP-PLUS
	const onJpushNewOrder = (extras) => {
		if (extras?.type !== 'new_order') return
		if (!isOnline.value || orderStatus.value !== 'idle') return
		fetchOrders()
		uni.vibrateShort({
			type: 'medium'
		})
	}
	// #endif

	onMounted(async () => {
		// #ifdef APP-PLUS
		uni.$on('jpush:notificationArrived', onJpushNewOrder)
		// #endif
		await refreshPageData()
	})

	// 每次页面显示时刷新数据
	let lastRefreshTime = 0
	onShow(async () => {
    await reportLocationAfterLogin()
		const now = Date.now()
		// 避免频繁刷新（5秒内只刷新一次）
		if (now - lastRefreshTime < 5000) return
		lastRefreshTime = now

		await refreshPageData()
	})

	onUnmounted(() => {
		// #ifdef APP-PLUS
		uni.$off('jpush:notificationArrived', onJpushNewOrder)
		// #endif
		stopPolling()
		stopTimerPolling()
		stopPendingCountdown()
		stopServeTimer()
		stopHeartMessagePolling()
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

	.debug-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		margin-top: 20rpx;
		padding: 12rpx 0;
		border: 1rpx dashed #ffb3c6;
		border-radius: 12rpx;
		background: rgba(255, 77, 109, 0.05);

		.debug-text {
			font-size: 22rpx;
			color: #ff4d6d;
		}
	}

	.update-location-btn {
		height: 72rpx;
		line-height: 72rpx;
		padding: 0 24rpx;
		background: linear-gradient(135deg, #10b981 0%, #0da271 100%);
		color: #fff;
		font-size: 28rpx;
		border-radius: 16rpx;
		font-weight: 500;
		transition: all 0.2s;
		border: none;
		box-shadow: 0 4rpx 12rpx rgba(16, 185, 129, 0.25);
	}

	.update-location-btn:active {
		transform: scale(0.97);
	}

	.update-location-btn.is-disabled {
		background: #a7f3d0 !important;
		color: #fff !important;
		opacity: 0.6;
		pointer-events: none;
	}

	.button-wrapper {
		display: flex;
		justify-content: flex-end;
	}

	.switch-wrapper {
		display: flex;
		align-items: center;
		gap: 16rpx;

		.label-off,
		.label-on {
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

	.pending-header,
	.order-info-header {
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

	.user-review-section {
		background: linear-gradient(135deg, rgba(255, 149, 0, 0.05) 0%, rgba(255, 170, 0, 0.03) 100%);
		border-radius: 20rpx;
		padding: 24rpx;
		margin: 24rpx 0;
		border: 1rpx solid rgba(255, 149, 0, 0.1);

		.review-header {
			display: flex;
			align-items: center;
			gap: 8rpx;
			margin-bottom: 16rpx;

			.review-title {
				font-size: 28rpx;
				font-weight: 600;
				color: #1f2937;
			}
		}

		.review-content {
			.avg-score {
				display: flex;
				align-items: center;
				gap: 8rpx;
				margin-bottom: 12rpx;

				.score-text {
					font-size: 26rpx;
					font-weight: 600;
					color: #ff9500;
					margin-left: 4rpx;
				}

				.review-count {
					font-size: 24rpx;
					color: #9ca3af;
				}
			}

			.latest-review {
				display: flex;
				align-items: flex-start;
				gap: 8rpx;

				.review-label {
					font-size: 26rpx;
					color: #6b7280;
					flex-shrink: 0;
				}

				.review-text {
					font-size: 26rpx;
					color: #4b5563;
					flex: 1;
					line-height: 1.6;
				}
			}
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

		.btn-confirm-depart,
		.btn-arrive {
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

		.nav-btn,
		.call-btn {
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

			.price-unit {
				font-size: 22rpx;
				color: #9ca3af;
				font-weight: normal;
				margin-left: 4rpx;
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