<template>
	<view v-if="visible" class="announce-mask" @click.self="handleClose">
		<view class="announce-dialog">
			<!-- 顶部装饰条 -->
			<view class="announce-top-bar">
				<view class="bar-dot dot-left"></view>
				<view class="bar-dot dot-right"></view>
			</view>

			<!-- 图标 + 标签 -->
			<view class="announce-header">
				<view class="announce-icon-wrapper">
					<view class="announce-icon-ring"></view>
					<view class="announce-icon">
						<uni-icons type="sound" size="36" color="#fff"></uni-icons>
					</view>
				</view>
				<view class="announce-tag">
					<text class="tag-text">重大通知</text>
				</view>
			</view>

			<!-- 标题 -->
			<view class="announce-title">{{ notice.title || '通知' }}</view>

			<!-- 摘要内容 -->
			<scroll-view scroll-y class="announce-content-scroll">
				<view class="announce-content">{{ notice.summary || '' }}</view>
			</scroll-view>

			<!-- 底部按钮组 -->
			<view class="announce-footer">
				<view class="btn btn-secondary" @click="handleClose">
					我知道了
				</view>
				<view
					class="btn btn-primary"
					v-if="notice.actionType === 1"
					@click="handleViewDetail"
				>
					查看详情
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { readNotification, getNotificationPage } from '@/api/billiard/notification'
import { useNotificationStore } from '@/store/modules/notification'

const visible = ref(false)
const notice = ref({})
const notificationStore = useNotificationStore()

// 队列管理
const queue = ref([])
const isShowing = ref(false)
const seenIds = new Set()
const SEEN_STORAGE_KEY = 'announce_broadcast_seen'

// ========== Storage 去重 ==========
const loadSeenFromStorage = () => {
	try {
		const list = uni.getStorageSync(SEEN_STORAGE_KEY) || []
		if (!Array.isArray(list)) return
		const now = Date.now()
		const valid = list.filter(item => item && item.id && now - item.time < 24 * 60 * 60 * 1000)
		valid.forEach(item => seenIds.add(String(item.id)))
	} catch (e) {
		console.warn('[announce] 加载已见列表失败:', e)
	}
}

const markSeen = (id) => {
	if (!id) return
	const strId = String(id)
	seenIds.add(strId)
	try {
		const list = uni.getStorageSync(SEEN_STORAGE_KEY) || []
		const now = Date.now()
		const filtered = list.filter(
			item => item && item.id && now - item.time < 24 * 60 * 60 * 1000 && String(item.id) !== strId
		)
		filtered.push({ id: strId, time: now })
		uni.setStorageSync(SEEN_STORAGE_KEY, filtered.slice(-200))
	} catch (e) {
		console.warn('[announce] 写入已见列表失败:', e)
	}
}

const hasSeen = (id) => {
	if (!id) return true
	return seenIds.has(String(id))
}

// ========== 标记已读 ==========
const markRead = (id) => {
	if (!id) return
	try {
		readNotification(id).catch(() => {})
		notificationStore.fetchUnreadCount && notificationStore.fetchUnreadCount().catch(() => {})
	} catch (e) {
		console.warn('[announce] 标记已读失败:', e)
	}
}

// ========== 队列展示 ==========
const enqueue = (item) => {
	if (!item || !item.notificationId) return
	if (item.notificationType !== 1) return // 只弹重大通知
	if (hasSeen(item.notificationId)) return
	markSeen(item.notificationId)
	queue.value.push(item)
	if (!isShowing.value) {
		showNext()
	}
}

const showNext = () => {
	if (isShowing.value) return
	if (!queue.value.length) return

	const item = queue.value.shift()
	notice.value = item
	isShowing.value = true
	visible.value = true
}

const closeDialog = () => {
	visible.value = false
	setTimeout(() => {
		isShowing.value = false
		notice.value = {}
		showNext()
	}, 250)
}

// ========== 按钮点击 ==========

// 点击「我知道了」→ 标记已读 + 关闭
const handleClose = () => {
	const id = notice.value?.notificationId
	markRead(id)
	closeDialog()
}

// 点击「查看详情」→ 标记已读 + 跳详情
const handleViewDetail = () => {
	const id = notice.value?.notificationId
	if (!id) {
		handleClose()
		return
	}
	markRead(id)
	closeDialog()
	setTimeout(() => {
		uni.navigateTo({
			url: `/subpkg/notification/detail?id=${id}`
		})
	}, 250)
}

// ========== 补播（冷启动/重连后拉取未读重大通知） ==========
let compensateTimer = null
const COMPENSATE_MAX_AGE = 24 * 60 * 60 * 1000
const COMPENSATED_STORAGE_KEY = 'announce_compensated'

const loadCompensatedFromStorage = () => {
	try {
		const list = uni.getStorageSync(COMPENSATED_STORAGE_KEY) || []
		if (!Array.isArray(list)) return new Set()
		const now = Date.now()
		const valid = list.filter(item => item && item.id && now - item.time < COMPENSATE_MAX_AGE)
		return new Set(valid.map(item => String(item.id)))
	} catch (e) {
		return new Set()
	}
}

const markCompensated = (ids) => {
	if (!ids || !ids.length) return
	try {
		const list = uni.getStorageSync(COMPENSATED_STORAGE_KEY) || []
		const now = Date.now()
		const strIds = ids.map(String)
		const filtered = list.filter(
			item => item && item.id && now - item.time < COMPENSATE_MAX_AGE && !strIds.includes(String(item.id))
		)
		strIds.forEach(id => filtered.push({ id, time: now }))
		uni.setStorageSync(COMPENSATED_STORAGE_KEY, filtered.slice(-200))
	} catch (e) {
		console.warn('[announce] 写入补播记录失败:', e)
	}
}

const triggerCompensate = () => {
	if (compensateTimer) clearTimeout(compensateTimer)
	compensateTimer = setTimeout(() => {
		doCompensate()
	}, 500)
}

const doCompensate = () => {
	try {
		getNotificationPage({ pageNo: 1, pageSize: 20, readStatus: 0 }).then(res => {
			if (!(res.code === 0 || res.code === 200)) return
			const records = res.data?.records || res.data?.list || []
			if (!records.length) return

			const compensatedSet = loadCompensatedFromStorage()
			const now = Date.now()
			const newCompensated = []

			const validList = records.filter(item => {
				if (!item) return false
				if (item.type !== 1) return false
				const publishTime = item.publishTime || item.createTime
				if (!publishTime) return false
				const pubTs = new Date(publishTime).getTime()
				if (now - pubTs > COMPENSATE_MAX_AGE) return false
				const id = item.id || item.notificationId
				if (!id) return false
				if (hasSeen(id)) return false
				if (compensatedSet.has(String(id))) return false
				return true
			})

			validList.sort((a, b) => {
				const ta = new Date(a.publishTime || a.createTime).getTime()
				const tb = new Date(b.publishTime || b.createTime).getTime()
				return ta - tb
			})

			validList.forEach(item => {
				const id = item.id || item.notificationId
				const payload = {
					notificationId: id,
					notificationType: item.type,
					title: item.title,
					summary: item.summary,
					coverUrl: item.coverUrl,
					publishTime: item.publishTime,
					actionType: item.actionType,
					actionValue: item.actionValue,
					actionParams: item.actionParams,
				}
				enqueue(payload)
				newCompensated.push(String(id))
			})

			if (newCompensated.length) {
				markCompensated(newCompensated)
			}
		}).catch(err => {
			console.warn('[announce] 补播请求失败:', err)
		})
	} catch (e) {
		console.error('[announce] 补播异常:', e)
	}
}

const handleWsConnected = () => {
	triggerCompensate()
}

// ========== WebSocket 消息处理 ==========
const handleMessage = (payload) => {
	try {
		console.log('[announce] 收到重大通知:', payload)
		if (!payload) return
		enqueue(payload)
	} catch (e) {
		console.error('[announce] 处理消息失败:', e)
	}
}

// ========== 生命周期 ==========
onMounted(() => {
	try {
		loadSeenFromStorage()
		uni.$on('ws:billiard_major_notification', handleMessage)
		uni.$on('ws:connected', handleWsConnected)
		triggerCompensate()
	} catch (e) {
		console.error('[announce] 初始化失败:', e)
	}
})

onUnmounted(() => {
	try {
		uni.$off('ws:billiard_major_notification', handleMessage)
		uni.$off('ws:connected', handleWsConnected)
		if (compensateTimer) {
			clearTimeout(compensateTimer)
			compensateTimer = null
		}
	} catch (e) {
		// ignore
	}
})
</script>

<style lang="scss" scoped>
.announce-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	z-index: 9998;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 60rpx;
	box-sizing: border-box;
	animation: announceFadeIn 0.25s ease-out;
}

@keyframes announceFadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

.announce-dialog {
	position: relative;
	width: 100%;
	max-width: 600rpx;
	background: var(--bg-card, #ffffff);
	border-radius: 28rpx;
	padding: 0 0 40rpx;
	box-sizing: border-box;
	overflow: hidden;
	animation: announcePop 0.35s cubic-bezier(0.21, 0.64, 0.29, 0.99);
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
}

@keyframes announcePop {
	from {
		opacity: 0;
		transform: scale(0.85) translateY(-40rpx);
	}
	to {
		opacity: 1;
		transform: scale(1) translateY(0);
	}
}

/* 顶部装饰条 */
.announce-top-bar {
	position: relative;
	height: 12rpx;
	background: linear-gradient(90deg, #ef4444 0%, #f97316 50%, #ef4444 100%);
	background-size: 200% 100%;
	animation: barShine 3s linear infinite;
}

@keyframes barShine {
	0% { background-position: 0% 50%; }
	100% { background-position: 200% 50%; }
}

.bar-dot {
	position: absolute;
	top: 50%;
	width: 8rpx;
	height: 8rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.8);
	transform: translateY(-50%);
}

.dot-left { left: 20rpx; }
.dot-right { right: 20rpx; }

/* 头部图标 + 标签 */
.announce-header {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 56rpx 40rpx 24rpx;
}

.announce-icon-wrapper {
	position: relative;
	width: 120rpx;
	height: 120rpx;
	margin-bottom: 20rpx;
}

.announce-icon {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 96rpx;
	height: 96rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(239, 68, 68, 0.4);
	z-index: 2;
}

.announce-icon-ring {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border-radius: 50%;
	border: 3rpx solid rgba(239, 68, 68, 0.3);
	animation: ringPulse 2s ease-out infinite;
}

@keyframes ringPulse {
	0% {
		transform: scale(0.8);
		opacity: 1;
	}
	100% {
		transform: scale(1.3);
		opacity: 0;
	}
}

.announce-tag {
	padding: 8rpx 24rpx;
	border-radius: 24rpx;
	background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.tag-text {
	font-size: 24rpx;
	color: #dc2626;
	font-weight: 600;
	letter-spacing: 2rpx;
}

/* 标题 */
.announce-title {
	font-size: 38rpx;
	font-weight: bold;
	color: #1f2937;
	text-align: center;
	padding: 0 40rpx 24rpx;
	line-height: 1.4;
}

/* 内容区 */
.announce-content-scroll {
	max-height: 520rpx;
	padding: 0 40rpx;
	margin-bottom: 32rpx;
}

.announce-content {
	font-size: 28rpx;
	color: #4b5563;
	line-height: 1.8;
	white-space: pre-wrap;
	word-break: break-all;
}

/* 底部按钮 */
.announce-footer {
	display: flex;
	gap: 24rpx;
	padding: 0 40rpx;
}

.btn {
	flex: 1;
	height: 88rpx;
	border-radius: 44rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 30rpx;
	font-weight: 500;
	transition: all 0.2s;
}

.btn:active {
	transform: scale(0.97);
	opacity: 0.9;
}

.btn-secondary {
	background: #f3f4f6;
	color: #4b5563;
}

.btn-primary {
	background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	color: #ffffff;
	box-shadow: 0 8rpx 20rpx rgba(239, 68, 68, 0.35);
}

/* 单按钮时占满 */
.btn:only-child {
	flex: 1;
}
</style>
