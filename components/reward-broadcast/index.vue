<template>
	<view>
		<!-- 霸屏心动效组件 -->
		<fullscreen-heart ref="heartRef" />

		<!-- 点击检测层：动效播放时覆盖，区分点击卡片区域 / 空白区域 -->
		<view
			v-if="detectVisible"
			class="rb-detect-layer"
			@click="handleLayerClick"
		>
			<!-- 与动效卡片位置大小对应的"卡片区域"，用于判断点击位置 -->
			<view
				class="rb-card-area"
				@click.stop="handleCardClick"
			/>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import FullscreenHeart from '@/components/fullscreen-heart/fullscreen-heart.vue'
import { getNotificationPage, getNotificationDetail, readNotification } from '@/api/billiard/notification'
import { useNotificationStore } from '@/store/modules/notification'

const heartRef = ref(null)
const detectVisible = ref(false)
const notificationStore = useNotificationStore()

// ========== 常量 ==========
const SEEN_STORAGE_KEY = 'reward_broadcast_seen'
const COMPENSATED_STORAGE_KEY = 'reward_compensated'
const SEEN_MAX_AGE = 60 * 60 * 1000 // 1 小时
const COMPENSATE_MAX_AGE = 30 * 60 * 1000 // 30 分钟
const PLAY_DURATION = 5000 // 播放时长 5 秒

// ========== 状态 ==========
const queue = ref([]) // 待播放队列 FIFO
const isPlaying = ref(false)
const currentPayload = ref(null) // 当前播放的消息
const seenIds = new Set() // 内存去重
let playTimer = null // 播放结束定时器
let compensateTimer = null // 补播防抖定时器
let autoClosed = false // 当前这次关闭是否是自动到期关闭

// ========== Storage 工具 ==========

const safeGetStorage = (key, defaultValue) => {
	try {
		const val = uni.getStorageSync(key)
		if (val === '' || val === undefined || val === null) {
			return defaultValue
		}
		return val
	} catch (e) {
		console.warn('[reward-broadcast] 读取 storage 失败:', key, e)
		return defaultValue
	}
}

const safeSetStorage = (key, value) => {
	try {
		uni.setStorageSync(key, value)
	} catch (e) {
		console.warn('[reward-broadcast] 写入 storage 失败:', key, e)
	}
}

// ========== 去重 ==========

const loadSeenFromStorage = () => {
	try {
		const list = safeGetStorage(SEEN_STORAGE_KEY, [])
		if (!Array.isArray(list)) return
		const now = Date.now()
		const valid = list.filter(item => item && item.id && now - item.time < SEEN_MAX_AGE)
		valid.forEach(item => seenIds.add(String(item.id)))
		if (valid.length !== list.length) {
			safeSetStorage(SEEN_STORAGE_KEY, valid)
		}
	} catch (e) {
		console.warn('[reward-broadcast] 加载已见列表失败:', e)
	}
}

const markSeen = (id) => {
	if (!id) return
	const strId = String(id)
	seenIds.add(strId)
	try {
		const list = safeGetStorage(SEEN_STORAGE_KEY, [])
		const now = Date.now()
		const filtered = list.filter(
			item => item && item.id && now - item.time < SEEN_MAX_AGE && String(item.id) !== strId
		)
		filtered.push({ id: strId, time: now })
		const finalList = filtered.length > 500 ? filtered.slice(filtered.length - 500) : filtered
		safeSetStorage(SEEN_STORAGE_KEY, finalList)
	} catch (e) {
		console.warn('[reward-broadcast] 写入已见列表失败:', e)
	}
}

const hasSeen = (id) => {
	if (!id) return true
	return seenIds.has(String(id))
}

// ========== 补播去重 ==========

const loadCompensatedFromStorage = () => {
	try {
		const list = safeGetStorage(COMPENSATED_STORAGE_KEY, [])
		if (!Array.isArray(list)) return []
		const now = Date.now()
		const valid = list.filter(item => item && item.id && now - item.time < COMPENSATE_MAX_AGE)
		if (valid.length !== list.length) {
			safeSetStorage(COMPENSATED_STORAGE_KEY, valid)
		}
		return valid.map(item => String(item.id))
	} catch (e) {
		console.warn('[reward-broadcast] 加载补播记录失败:', e)
		return []
	}
}

const markCompensated = (ids) => {
	if (!ids || !ids.length) return
	try {
		const list = safeGetStorage(COMPENSATED_STORAGE_KEY, [])
		const now = Date.now()
		const strIds = ids.map(String)
		const filtered = list.filter(
			item => item && item.id && now - item.time < COMPENSATE_MAX_AGE && !strIds.includes(String(item.id))
		)
		strIds.forEach(id => filtered.push({ id, time: now }))
		const finalList = filtered.length > 500 ? filtered.slice(filtered.length - 500) : filtered
		safeSetStorage(COMPENSATED_STORAGE_KEY, finalList)
	} catch (e) {
		console.warn('[reward-broadcast] 写入补播记录失败:', e)
	}
}

// ========== 队列播放 ==========

const enqueue = (payload) => {
	if (!payload || !payload.notificationId) return
	if (hasSeen(payload.notificationId)) return
	markSeen(payload.notificationId)
	queue.value.push(payload)
	if (!isPlaying.value) {
		playNext()
	}
}

const playNext = () => {
	if (isPlaying.value) return
	if (!queue.value.length) return

	// 跳过过期的
	const now = Date.now()
	while (queue.value.length) {
		const item = queue.value[0]
		if (item.animationExpireTime && new Date(item.animationExpireTime).getTime() < now) {
			queue.value.shift()
			continue
		}
		break
	}

	if (!queue.value.length) return

	const current = queue.value.shift()
	currentPayload.value = current
	isPlaying.value = true
	autoClosed = false

	try {
		// 头像优先取打赏用户（会员）头像，兜底用默认头像
		const avatar = current.coachAvatar
      || current.userAvatar
			|| '/static/images/profile.jpg'
		const nickname = current.coachName
			|| current.memberNickname
			|| '神秘用户'
		const amountVal = current.amount ?? 0
		const content = current?.content || ''

		const info = {
			avatar,
			nickname,
			content,
			amount: amountVal ? (Number(amountVal) / 100).toFixed(2) : '0.00',
			tags: ['打赏'],
		}

		console.log('[reward-broadcast] 组装info:', JSON.stringify(info))
		console.log('[reward-broadcast] heartRef存在吗?', !!heartRef.value)
		console.log('[reward-broadcast] play方法存在吗?', heartRef.value && typeof heartRef.value.play === 'function')

		// 显示点击检测层
		detectVisible.value = true

		// 播放动效
		if (heartRef.value && typeof heartRef.value.play === 'function') {
			heartRef.value.play(info, { duration: 0 }) // 设为 0 不让动效自动关闭，由我们自己控制
			console.log('[reward-broadcast] play已调用')
		} else {
			console.error('[reward-broadcast] heartRef或play方法不存在')
		}

		// 不自动关闭，用户手动点击才关闭（未读状态保持）
	} catch (e) {
		console.error('[reward-broadcast] 播放失败:', e)
		isPlaying.value = false
		currentPayload.value = null
		detectVisible.value = false
		playNext()
	}
}

/**
 * 自动播放结束（不标记已读）
 */
const handleAutoClose = () => {
	try {
		if (heartRef.value && typeof heartRef.value.close === 'function') {
			heartRef.value.close()
		}
	} catch (e) {
		console.warn('[reward-broadcast] 自动关闭动效失败:', e)
	}
	detectVisible.value = false
	isPlaying.value = false
	currentPayload.value = null
	// 继续下一条
	playNext()
}

/**
 * 用户主动关闭（标记已读）
 */
const handleUserClose = () => {
	if (playTimer) {
		clearTimeout(playTimer)
		playTimer = null
	}

	const payload = currentPayload.value

	try {
		if (heartRef.value && typeof heartRef.value.close === 'function') {
			heartRef.value.close()
		}
	} catch (e) {
		console.warn('[reward-broadcast] 手动关闭动效失败:', e)
	}
	detectVisible.value = false
	isPlaying.value = false
	currentPayload.value = null

	// 标记已读
	if (payload && payload.notificationId) {
		try {
			notificationStore.markRead && notificationStore.markRead(payload.notificationId)
		} catch (e) {
			console.warn('[reward-broadcast] 标记已读失败:', e)
		}
	}

	// 继续下一条
	playNext()
}

// ========== 点击检测 ==========

/**
 * 点击空白区域 → 关闭 + 标记已读
 */
const handleLayerClick = () => {
	if (!isPlaying.value) return
	handleUserClose()
}

/**
 * 点击卡片区域 → 关闭 + 标记已读（不跳转）
 */
const handleCardClick = () => {
	if (!isPlaying.value) return
	handleUserClose()
}

// ========== 消息处理 ==========

const handleMessage = (payload) => {
	try {
		if (!payload || !payload.notificationId) return
		enqueue(payload)

		// 新增未读数
		try {
			notificationStore.incrementUnread && notificationStore.incrementUnread()
		} catch (e) {
			console.warn('[reward-broadcast] 更新未读数失败:', e)
		}
	} catch (e) {
		console.error('[reward-broadcast] 处理消息失败:', e)
	}
}

// ========== 补播 ==========

const triggerCompensate = () => {
	if (compensateTimer) {
		clearTimeout(compensateTimer)
	}
	compensateTimer = setTimeout(() => {
		doCompensate()
	}, 1000)
}

const doCompensate = () => {
	try {
		getNotificationPage({ pageNo: 1, pageSize: 20, readStatus: 0 }).then(res => {
			if (!(res.code === 0 || res.code === 200)) return
      console.log('getNotificationPage,====',res)
			const records = res.data?.records || res.data?.list || []
			if (!records.length) return

			const compensatedIds = loadCompensatedFromStorage()
			const compensatedSet = new Set(compensatedIds)
			const now = Date.now()
			const newCompensated = []

			const validList = records.filter(item => {
				if (!item) return false
				if (item.type !== 5 && item.bizType !== 'reward') return false
				const publishTime = item.publishTime || item.createTime
				if (!publishTime) return false
				const pubTs = new Date(publishTime).getTime()
				if (now - pubTs > COMPENSATE_MAX_AGE) return false
				const id = item.notificationId || item.id
				if (!id) return false
				if (hasSeen(id)) return false
				if (compensatedSet.has(String(id))) return false
				return true
			})

			// 按时间正序入队
			validList.sort((a, b) => {
				const ta = new Date(a.publishTime || a.createTime).getTime()
				const tb = new Date(b.publishTime || b.createTime).getTime()
				return ta - tb
			})

			validList.forEach(item => {
				const id = item.notificationId || item.id

				// 解析 actionParams（通知列表将业务数据放在 JSON 字符串字段里）
				let actionData = {}
				try {
					if (item.actionParams && typeof item.actionParams === 'string') {
						actionData = JSON.parse(item.actionParams)
					} else if (item.actionParams && typeof item.actionParams === 'object') {
						actionData = item.actionParams
					}
				} catch (e) {
					console.warn('[reward-broadcast] 解析 actionParams 失败:', e)
				}

				// 合并：优先用 actionParams 里的数据，兜底用 item 顶层字段
				const payload = {
					notificationId: actionData.notificationId || id,
					bizType: actionData.bizType || item.bizType || 'reward',
					rewardId: actionData.rewardId ?? item.rewardId,
					city: actionData.city || item.city,
					amount: actionData.amount ?? item.amount,
					memberNickname: actionData.memberNickname || item.memberNickname || item.nickname,
					userAvatar: actionData.userAvatar || item.userAvatar || item.avatar,
					coachAvatar: actionData.coachAvatar || item.coachAvatar,
					coachName: actionData.coachName || item.coachName,
					title: actionData.title || item.title,
					content: actionData.content || item.content,
					voiceText: actionData.voiceText || item.voiceText,
					animationType: actionData.animationType || item.animationType,
					animationExpireTime: actionData.animationExpireTime || item.animationExpireTime,
					publishTime: item.publishTime || item.createTime,
				}
				enqueue(payload)
				newCompensated.push(String(id))
			})

			if (newCompensated.length) {
				markCompensated(newCompensated)
			}
		}).catch(err => {
			console.warn('[reward-broadcast] 补播请求失败:', err)
		})
	} catch (e) {
		console.error('[reward-broadcast] 补播异常:', e)
	}
}

const handleWsConnected = () => {
	triggerCompensate()
}

const handleAppShow = () => {
	triggerCompensate()
}

// ========== 生命周期 ==========

onMounted(() => {
	try {
		loadSeenFromStorage()

		// 监听 WebSocket 打赏消息
		uni.$on('ws:billiard_reward_broadcast', handleMessage)

		// 监听 WebSocket 重连成功
		uni.$on('ws:connected', handleWsConnected)

		// 监听 App 从后台进入前台
		// #ifdef APP-PLUS
		try {
			plus.globalEvent.addEventListener('show', handleAppShow)
		} catch (e) {
			// ignore
		}
		// #endif

		// 兜底：业务层如有自定义 app:show 事件也监听
		uni.$on('app:show', handleAppShow)

		// 挂载时尝试补播一次
		triggerCompensate()
	} catch (e) {
		console.error('[reward-broadcast] 初始化失败:', e)
	}
})

onUnmounted(() => {
	try {
		uni.$off('ws:billiard_reward_broadcast', handleMessage)
		uni.$off('ws:connected', handleWsConnected)
		uni.$off('app:show', handleAppShow)

		// #ifdef APP-PLUS
		try {
			plus.globalEvent.removeEventListener('show', handleAppShow)
		} catch (e) {
			// ignore
		}
		// #endif

		if (compensateTimer) {
			clearTimeout(compensateTimer)
			compensateTimer = null
		}
		if (playTimer) {
			clearTimeout(playTimer)
			playTimer = null
		}

		// 关闭动效
		try {
			if (heartRef.value && typeof heartRef.value.close === 'function') {
				heartRef.value.close()
			}
		} catch (e) {
			// ignore
		}

		detectVisible.value = false
		queue.value = []
		isPlaying.value = false
		currentPayload.value = null
	} catch (e) {
		console.error('[reward-broadcast] 卸载清理失败:', e)
	}
})
</script>

<style lang="scss" scoped>
.rb-detect-layer {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 10000; // 比 fullscreen-heart 的 9999 高一层
	background: transparent;
	display: flex;
	align-items: center;
	justify-content: center;
}

.rb-card-area {
	// 与 fullscreen-heart 卡片尺寸大致匹配
	width: 580rpx;
	height: 800rpx; // 卡片高度（留足余量）
	background: transparent;
}
</style>
