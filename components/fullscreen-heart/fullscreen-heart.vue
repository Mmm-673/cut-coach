<template>
	<view v-if="visible" class="fullscreen-heart-mask" @click="handleClose">
		<!-- 背景光晕 -->
		<view class="glow-layer">
			<view class="glow glow-1"></view>
			<view class="glow glow-2"></view>
			<view class="glow glow-3"></view>
			<view class="glow glow-4"></view>
		</view>

		<!-- 闪烁星星层 -->
		<view class="sparkles-layer">
			<view
				v-for="sparkle in sparkles"
				:key="sparkle.id"
				class="sparkle"
				:style="sparkleStyle(sparkle)"
			>
				✦
			</view>
		</view>

		<!-- 飘落金币 -->
		<view class="coins-layer">
			<view
				v-for="coin in coins"
				:key="coin.id"
				class="falling-coin"
				:class="`coin-${coin.size}`"
				:style="coinStyle(coin)"
			>
				<text class="coin-icon">💰</text>
			</view>
		</view>

		<!-- 中央打赏卡片 -->
		<view class="reward-card" @click.stop>
			<!-- 顶部光效 -->
			<view class="card-top-light"></view>

			<!-- 礼物图标 -->
			<view class="gift-wrapper">
				<view class="gift-box">
					<text class="gift-emoji">🎁</text>
				</view>
				<view class="gift-ring"></view>
				<view class="gift-ring ring-2"></view>
			</view>

			<!-- 打赏标题 -->
			<view class="reward-title-row">
				<text class="reward-title">收到打赏</text>
				<text class="reward-badge">NEW</text>
			</view>

			<!-- 金额特写 -->
			<view class="amount-wrapper">
				<text class="amount-currency">¥</text>
				<text class="amount-number" :key="amountAnimKey">{{ rewardInfo.amount || '0.00' }}</text>
			</view>

			<!-- 用户信息 -->
			<view class="user-row">
				<image class="user-avatar" :src="rewardInfo.avatar || defaultAvatar" mode="aspectFill" />
				<view class="user-info">
					<text class="user-name">{{ rewardInfo.nickname || '神秘用户' }}</text>
					<text class="reward-content" v-if="rewardInfo.content">{{ rewardInfo.content }}</text>
					<text class="reward-content" v-else>送了你一份心意 💕</text>
				</view>
			</view>

			<!-- 用户标签 -->
			<view class="user-tags" v-if="rewardInfo.tags && rewardInfo.tags.length">
				<text class="tag" v-for="(tag, idx) in rewardInfo.tags.slice(0, 3)" :key="idx">{{ tag }}</text>
			</view>

			<!-- 关闭提示 -->
			<text class="close-hint">点击任意处关闭</text>
		</view>
	</view>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'

const defaultAvatar = '/static/images/default-avatar.png'

const visible = ref(false)
const sparkles = ref([])
const coins = ref([])
const amountAnimKey = ref(0)

const rewardInfo = reactive({
	avatar: '',
	nickname: '',
	content: '',
	amount: '',
	tags: [],
})

let sparkleTimer = null
let coinTimer = null
let closeTimer = null
let idCounter = 0

const SPARKLE_COLORS = [
	'#ffffff',
	'#ffd700',
	'#ffeb3b',
	'#fff5b1',
]

// 生成闪烁星星
const createSparkle = () => {
	const id = ++idCounter
	const size = Math.random() > 0.5 ? 'lg' : 'sm'
	const color = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)]
	const left = Math.random() * 100
	const top = Math.random() * 100
	const duration = 1.2 + Math.random() * 1.5
	const delay = Math.random() * 1.5

	return { id, size, color, left, top, duration, delay }
}

const sparkleStyle = (s) => {
	return {
		left: `${s.left}%`,
		top: `${s.top}%`,
		color: s.color,
		animationDuration: `${s.duration}s`,
		animationDelay: `${s.delay}s`,
		fontSize: s.size === 'lg' ? '32rpx' : '20rpx',
	}
}

// 生成飘落金币
const createCoin = () => {
	const id = ++idCounter
	const size = Math.random() > 0.6 ? 'lg' : 'sm'
	const left = Math.random() * 100
	const duration = 3.5 + Math.random() * 2.5
	const delay = Math.random() * 2
	const sway = (Math.random() - 0.5) * 60

	return { id, size, left, duration, delay, sway }
}

const coinStyle = (c) => {
	return {
		left: `${c.left}%`,
		animationDuration: `${c.duration}s`,
		animationDelay: `${c.delay}s`,
		'--sway-x': `${c.sway}px`,
	}
}

// 启动动效
const startEffects = () => {
	// 初始星星
	const initialSparkles = []
	for (let i = 0; i < 25; i++) {
		initialSparkles.push(createSparkle())
	}
	sparkles.value = initialSparkles

	// 初始金币（大量）
	const initialCoins = []
	for (let i = 0; i < 30; i++) {
		initialCoins.push(createCoin())
	}
	coins.value = initialCoins

	// 持续补充星星
	sparkleTimer = setInterval(() => {
		if (sparkles.value.length > 50) {
			sparkles.value = sparkles.value.slice(-40)
		}
		sparkles.value.push(createSparkle())
	}, 200)

	// 持续补充金币（大量）
	coinTimer = setInterval(() => {
		if (coins.value.length > 80) {
			coins.value = coins.value.slice(-60)
		}
		coins.value.push(createCoin())
	}, 120)
}

const stopEffects = () => {
	if (sparkleTimer) { clearInterval(sparkleTimer); sparkleTimer = null }
	if (coinTimer) { clearInterval(coinTimer); coinTimer = null }
}

/**
 * 播放霸屏打赏动效
 * @param {Object} info - 打赏信息
 * @param {string} info.avatar - 用户头像
 * @param {string} info.nickname - 用户昵称
 * @param {string} info.content - 打赏留言
 * @param {string} info.amount - 打赏金额（元）
 * @param {string[]} info.tags - 用户标签
 * @param {Object} [options] - 配置
 * @param {number} [options.duration=5000] - 自动关闭时间（毫秒），0 不自动关闭
 */
const play = (info = {}, options = {}) => {
	Object.assign(rewardInfo, {
		avatar: info.avatar || '',
		nickname: info.nickname || '',
		content: info.content || '',
		amount: info.amount || '0.00',
		tags: info.tags || [],
	})

	// 触发金额数字跳动动画
	amountAnimKey.value++

	visible.value = true
	startEffects()

	// 震动
	// #ifdef APP-PLUS
	plus.device.vibrate(300)
	// #endif

	const autoDuration = options.duration !== undefined ? options.duration : 5000
	if (autoDuration > 0) {
		if (closeTimer) clearTimeout(closeTimer)
		closeTimer = setTimeout(() => {
			close()
		}, autoDuration)
	}
}

const close = () => {
	visible.value = false
	stopEffects()
	sparkles.value = []
	coins.value = []
	if (closeTimer) {
		clearTimeout(closeTimer)
		closeTimer = null
	}
}

const handleClose = () => {
	close()
}

onUnmounted(() => {
	stopEffects()
	if (closeTimer) clearTimeout(closeTimer)
})

defineExpose({
	play,
	close,
})
</script>

<style lang="scss" scoped>
.fullscreen-heart-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 9999;
	background: radial-gradient(ellipse at 50% 30%, rgba(255, 190, 11, 0.45) 0%, rgba(255, 77, 109, 0.6) 50%, rgba(106, 27, 154, 0.75) 100%);
	backdrop-filter: blur(10px);
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	animation: maskFadeIn 0.35s ease-out forwards;
}

@keyframes maskFadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

/* === 背景光晕 === */
.glow-layer {
	position: absolute;
	top: 0; left: 0;
	width: 100%; height: 100%;
	pointer-events: none;
	overflow: hidden;
}

.glow {
	position: absolute;
	border-radius: 50%;
	filter: blur(80rpx);
	opacity: 0.7;

	&.glow-1 {
		width: 500rpx; height: 500rpx;
		background: #ffbe0b;
		top: -120rpx; left: 50%;
		transform: translateX(-50%);
		animation: glowPulse 2.5s ease-in-out infinite alternate;
	}
	&.glow-2 {
		width: 450rpx; height: 450rpx;
		background: #ff4d6d;
		bottom: 10%; left: -100rpx;
		animation: glowPulse 3s ease-in-out infinite alternate-reverse;
	}
	&.glow-3 {
		width: 400rpx; height: 400rpx;
		background: #9d4edd;
		bottom: -80rpx; right: -80rpx;
		animation: glowPulse 2.8s ease-in-out infinite alternate;
	}
	&.glow-4 {
		width: 300rpx; height: 300rpx;
		background: #ffc8dd;
		top: 30%; right: 10%;
		opacity: 0.4;
		animation: glowPulse 2s ease-in-out infinite alternate-reverse;
	}
}

@keyframes glowPulse {
	from { transform: scale(1) translateX(0); }
	to   { transform: scale(1.2) translateX(30rpx); }
}

/* === 闪烁星星 === */
.sparkles-layer {
	position: absolute;
	top: 0; left: 0;
	width: 100%; height: 100%;
	pointer-events: none;
	overflow: hidden;
}

.sparkle {
	position: absolute;
	animation: sparkleBlink 1.5s ease-in-out infinite;
	text-shadow: 0 0 16rpx rgba(255, 215, 0, 0.9);
	will-change: transform, opacity;
}

@keyframes sparkleBlink {
	0%, 100% {
		transform: scale(0.4) rotate(0deg);
		opacity: 0;
	}
	50% {
		transform: scale(1.2) rotate(180deg);
		opacity: 1;
	}
}

/* === 飘落金币 === */
.coins-layer {
	position: absolute;
	top: 0; left: 0;
	right: 0; bottom: 0;
	width: 100%; height: 100%;
	pointer-events: none;
	overflow: hidden;
}

.falling-coin {
	position: absolute;
	top: -100rpx;
	animation-name: coinFall;
	animation-timing-function: ease-in;
	animation-iteration-count: 1;
	animation-fill-mode: forwards;
	will-change: transform;
}

.coin-icon {
	font-style: normal;
	display: block;
	filter: drop-shadow(0 4rpx 10rpx rgba(255, 180, 0, 0.6));
	animation: coinPulse 0.8s ease-in-out infinite alternate;
}

.coin-sm .coin-icon { font-size: 40rpx; }
.coin-lg .coin-icon { font-size: 64rpx; }

@keyframes coinFall {
	0% {
		top: -10%;
		transform: translateX(0) rotate(0deg);
		opacity: 0;
	}
	10% { opacity: 1; }
	50% {
		transform: translateX(var(--sway-x, 30px)) rotate(180deg);
	}
	100% {
		top: 110%;
		transform: translateX(calc(var(--sway-x, 30px) * 0.5)) rotate(360deg);
		opacity: 0;
	}
}

@keyframes coinPulse {
	from { transform: scale(1); }
	to   { transform: scale(1.15); }
}

/* === 打赏卡片 === */
.reward-card {
	position: relative;
	z-index: 10;
	width: 580rpx;
	max-height: 85vh;
	background: linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(255,248,225,0.98) 100%);
	border-radius: 36rpx;
	padding: 70rpx 36rpx 32rpx;
	box-shadow:
		0 0 60rpx rgba(255, 190, 11, 0.5),
		0 20rpx 60rpx rgba(0, 0, 0, 0.25);
	animation: cardPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	box-sizing: border-box;
	overflow: visible;
}

@keyframes cardPop {
	0%   { transform: scale(0.4) rotate(-8deg); opacity: 0; }
	60%  { transform: scale(1.1) rotate(2deg); opacity: 1; }
	80%  { transform: scale(0.96) rotate(-1deg); }
	100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

/* 卡片顶部金色光效 */
.card-top-light {
	position: absolute;
	top: 0; left: 0; right: 0;
	height: 140rpx;
	background: linear-gradient(180deg, rgba(255, 215, 0, 0.25) 0%, rgba(255, 215, 0, 0) 100%);
	pointer-events: none;
	border-radius: 36rpx 36rpx 0 0;
}

/* 礼物图标 */
.gift-wrapper {
	position: absolute;
	top: -50rpx;
	left: 50%;
	transform: translateX(-50%);
	width: 110rpx;
	height: 110rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.gift-box {
	width: 100rpx;
	height: 100rpx;
	border-radius: 26rpx;
	background: linear-gradient(135deg, #ff6b9d, #ff4d6d);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(255, 77, 109, 0.5);
	animation: giftBounce 1.2s ease-in-out infinite;
	z-index: 2;
}

.gift-emoji {
	font-size: 48rpx;
}

@keyframes giftBounce {
	0%, 100% { transform: translateY(0) rotate(-4deg); }
	50%      { transform: translateY(-12rpx) rotate(4deg); }
}

.gift-ring {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 100%;
	height: 100%;
	border: 3rpx solid rgba(255, 190, 11, 0.6);
	border-radius: 50%;
	transform: translate(-50%, -50%);
	animation: ringExpand 2s ease-out infinite;
}

.gift-ring.ring-2 {
	animation-delay: 1s;
}

@keyframes ringExpand {
	0% {
		width: 100%;
		height: 100%;
		opacity: 1;
	}
	100% {
		width: 220%;
		height: 220%;
		opacity: 0;
	}
}

/* 打赏标题 */
.reward-title-row {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	margin-top: 8rpx;
	margin-bottom: 16rpx;
}

.reward-title {
	font-size: 34rpx;
	font-weight: bold;
	background: linear-gradient(135deg, #ff4d6d, #ffbe0b);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	letter-spacing: 4rpx;
}

.reward-badge {
	font-size: 18rpx;
	font-weight: bold;
	color: #fff;
	background: linear-gradient(135deg, #ff4d6d, #ff006e);
	padding: 3rpx 12rpx;
	border-radius: 20rpx;
	animation: badgePulse 1.5s ease-in-out infinite;
}

@keyframes badgePulse {
	0%, 100% { transform: scale(1); }
	50%      { transform: scale(1.1); }
}

/* 金额特写 */
.amount-wrapper {
	display: flex;
	align-items: baseline;
	justify-content: center;
	margin-bottom: 24rpx;
	padding: 18rpx 0;
	background: linear-gradient(135deg, rgba(255, 190, 11, 0.1), rgba(255, 77, 109, 0.1));
	border-radius: 20rpx;
	border: 2rpx solid rgba(255, 190, 11, 0.3);
}

.amount-currency {
	font-size: 36rpx;
	font-weight: bold;
	color: #ff4d6d;
	margin-right: 4rpx;
}

.amount-number {
	font-size: 64rpx;
	font-weight: 900;
	background: linear-gradient(135deg, #ffbe0b, #ff4d6d, #ff006e);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	letter-spacing: 2rpx;
	animation: amountBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes amountBounce {
	0%   { transform: scale(0.3); opacity: 0; }
	60%  { transform: scale(1.2); opacity: 1; }
	100% { transform: scale(1); }
}

/* 用户行 */
.user-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 16rpx 20rpx;
	background: #fff;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
	margin-bottom: 16rpx;
}

.user-avatar {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	border: 2rpx solid #ffd166;
	flex-shrink: 0;
}

.user-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4rpx;
	overflow: hidden;
}

.user-name {
	font-size: 28rpx;
	font-weight: bold;
	color: #1f2937;
}

.reward-content {
	font-size: 22rpx;
	color: #6b7280;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* 标签 */
.user-tags {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	gap: 10rpx;
	margin-bottom: 12rpx;
}

.tag {
	font-size: 20rpx;
	color: #ff4d6d;
	background: rgba(255, 77, 109, 0.1);
	padding: 4rpx 14rpx;
	border-radius: 20rpx;
}

/* 关闭提示 */
.close-hint {
	display: block;
	text-align: center;
	font-size: 20rpx;
	color: #9ca3af;
	margin-top: 4rpx;
	animation: hintBlink 1.5s ease-in-out infinite;
}

@keyframes hintBlink {
	0%, 100% { opacity: 0.5; }
	50%      { opacity: 1; }
}
</style>
