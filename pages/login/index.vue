<template>
	<view class="normal-login-container" :style="{ paddingBottom: keyboardHeight + 'px' }">
		<view class="logo-section">
			<view class="logo-box">
				<image class="logo-img" :src="globalConfig.appInfo.logo" mode="aspectFit"></image>
			</view>
			<text class="app-title">台球助教端</text>
			<text class="app-subtitle">欢迎回来，请登录您的账号</text>
		</view>

		<view class="login-form-content">
			<view class="login-tabs">
				<view :class="['tab-item', loginForm.loginType === 'pwd' ? 'active' : '']"
					@click="switchLoginType('pwd')">密码登录</view>
				<view :class="['tab-item', loginForm.loginType === 'sms' ? 'active' : '']"
					@click="switchLoginType('sms')">短信登录</view>
			</view>

			<view class="input-group">
				<view class="input-item flex align-center">
					<view class="iconfont icon-user icon"></view>
					<input v-model="loginForm.username" class="input" type="text"
						:placeholder="loginForm.loginType === 'sms' ? '请输入手机号' : '请输入账号'"
						:maxlength="loginForm.loginType === 'sms' ? 11 : 30" :focus="focusIndex === 0"
						@focus="onInputFocus(0)" @blur="onInputBlur" confirm-type="next" @confirm="focusNextInput(1)" />
				</view>

				<view class="input-item flex align-center" v-if="loginForm.loginType === 'pwd'">
					<view class="iconfont icon-password icon"></view>
					<input v-model="loginForm.password" :type="showPassword ? 'text' : 'password'" class="input"
						placeholder="请输入密码" maxlength="20" :focus="focusIndex === 1" @focus="onInputFocus(1)"
						@blur="onInputBlur" confirm-type="done" @confirm="handleLogin" />
					<view class="password-toggle" @click="showPassword = !showPassword">
						<text :class="['iconfont', showPassword ? 'icon-eye-open' : 'icon-eye-close']"></text>
					</view>
				</view>

				<view class="input-item flex align-center" v-if="loginForm.loginType === 'pwd' && captchaEnabled">
					<view class="iconfont icon-code icon"></view>
					<input v-model="loginForm.code" type="number" class="input" placeholder="验证码" maxlength="4"
						:focus="focusIndex === 2" @focus="onInputFocus(2)" @blur="onInputBlur" confirm-type="done"
						@confirm="handleLogin" />
					<view class="login-code-wrapper">
						<image :src="codeUrl" @click="getCode" class="login-code-img" mode="aspectFill"></image>
					</view>
				</view>

				<view class="input-item flex align-center" v-if="loginForm.loginType === 'sms'">
					<view class="iconfont icon-code icon"></view>
					<input v-model="loginForm.smsCode" type="number" class="input" placeholder="请输入验证码" maxlength="6"
						:focus="focusIndex === 1" @focus="onInputFocus(1)" @blur="onInputBlur" confirm-type="done"
						@confirm="handleLogin" />
					<view class="sms-code-btn" :class="{ 'disabled': countdown > 0 }" @click="handleGetSmsCode">
						{{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
					</view>
				</view>
			</view>

			<view class="forget-pwd" v-if="loginForm.loginType === 'pwd'" @click="handleForgetPwd">忘记密码？</view>

			<view class="action-btn">
				<button @click="handleLogin" :disabled="isLoggingIn" class="login-btn cu-btn block bg-blue lg round">
					{{ isLoggingIn ? '登录中...' : '登录' }}
				</button>
			</view>

			<view class="xieyi-section">
				<checkbox-group @change="onCheckChange">
					<label class="flex align-center justify-center">
						<checkbox value="check" :checked="isAgreed" color="#2F6BEE" style="transform:scale(0.6)" />
						<view class="text-grey-dark">
							我已阅读并同意
							<text @click.stop="handleUserAgrement" class="text-blue">《用户协议》</text>
							和
							<text @click.stop="handlePrivacy" class="text-blue">《隐私政策》</text>
						</view>
					</label>
				</checkbox-group>
			</view>
		</view>

		<view class="bottom-footer">
			遇到问题？<text class="text-blue" @click="handleContactService">联系客服</text>
		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		getCurrentInstance,
		onMounted,
		onUnmounted
	} from "vue"
	import {
		getCodeImg,
		sendSmsCode
	} from '@/api/login'
	import {
		updateLocation
	} from '@/api/billiard/coach'
	import {
		getLocation as getPlatformLocation,
		showLocationPermissionGuide,
		getPlatform
	} from '@/utils/platform'
	import {
		useConfigStore,
		useUserStore
	} from '@/store'

	const {
		proxy
	} = getCurrentInstance()
	const globalConfig = useConfigStore().config
	const userStore = useUserStore()

	const codeUrl = ref("")
	const captchaEnabled = ref(false)
	const isAgreed = ref(true)
	const countdown = ref(0)
	const showPassword = ref(false)
	const focusIndex = ref(-1)
	const keyboardHeight = ref(0)
	const isLoggingIn = ref(false)

	const loginForm = ref({
		loginType: 'pwd',
		username: "c930036",
		password: "admin123",
		code: "",
		smsCode: "",
		uuid: ""
	})

	let countdownTimer = null
	let keyboardHeightListener = null

	function switchLoginType(type) {
		loginForm.value.loginType = type
		loginForm.value.smsCode = ""
		loginForm.value.code = ""
		focusIndex.value = -1
	}

	function getCode() {
		getCodeImg().then(res => {
			captchaEnabled.value = res.captchaEnabled ?? false
			if (captchaEnabled.value && res.img) {
				codeUrl.value = 'data:image/gif;base64,' + res.img
				loginForm.value.uuid = res.uuid
			}
		}).catch(() => {
			captchaEnabled.value = false
		})
	}

	async function handleGetSmsCode() {
		if (!/^1[3-9]\d{9}$/.test(loginForm.value.username)) {
			return proxy.$modal.msgError("请输入正确的手机号")
		}
		if (countdown.value > 0) return

		proxy.$modal.loading("发送中...")
		try {
			const res = await sendSmsCode(loginForm.value.username)
			if (res.code === 0) {
				proxy.$modal.msgSuccess("验证码已发送")
				startCountdown()
			} else {
				proxy.$modal.msgError(res.msg || '发送失败')
			}
		} catch (err) {
			proxy.$modal.msgError(err?.msg || err || '发送失败')
		} finally {
			proxy.$modal.closeLoading()
		}
	}

	function startCountdown() {
		countdown.value = 60
		if (countdownTimer) clearInterval(countdownTimer)
		countdownTimer = setInterval(() => {
			countdown.value--
			if (countdown.value <= 0) {
				clearInterval(countdownTimer)
				countdownTimer = null
			}
		}, 1000)
	}

	function onInputFocus(index) {
		focusIndex.value = index
	}

	function onInputBlur() {
		// 延迟清除，避免点击按钮时输入框失去焦点导致按钮无法点击
		setTimeout(() => {
			focusIndex.value = -1
		}, 100)
	}

	function focusNextInput(nextIndex) {
		focusIndex.value = nextIndex
	}

	function onCheckChange(e) {
		isAgreed.value = e.detail.value.length > 0
	}

	async function handleLogin() {
		if (!isAgreed.value) {
			return proxy.$modal.msgError("请先同意用户协议")
		}

		const {
			username,
			password,
			code,
			smsCode,
			loginType
		} = loginForm.value

		if (username === "") return proxy.$modal.msgError(loginType === 'sms' ? "请输入手机号" : "请输入账号")

		isLoggingIn.value = true
		proxy.$modal.loading("登录中...")

		try {
			if (loginType === 'pwd') {
				if (password === "") return proxy.$modal.msgError("请输入密码")
				if (captchaEnabled.value && !code) return proxy.$modal.msgError("请输入图形验证码")

				await userStore.login(loginForm.value)
			} else {
				if (smsCode === "") return proxy.$modal.msgError("请输入短信验证码")

				await userStore.smsLogin(loginForm.value)
			}

			proxy.$modal.closeLoading()
			loginSuccess()
		} catch (err) {
			proxy.$modal.closeLoading()
			proxy.$modal.msgError(err || '登录失败，请重试')
			if (captchaEnabled.value && loginType === 'pwd') getCode()
		} finally {
			isLoggingIn.value = false
		}
	}

	function loginSuccess() {
		userStore.getInfo().then(() => {
			// 登录成功后上报位置
			reportLocationAfterLogin()
		}).catch(() => {
			// 即使获取用户信息失败，也尝试上报位置
			reportLocationAfterLogin()
		})
	}

	// 登录成功后获取位置并上报（多端兼容）
	async function reportLocationAfterLogin() {
		const platform = getPlatform()
		console.log('当前平台:', platform)

		try {
			// 使用多端兼容的位置获取
			const location = await getPlatformLocation({
				type: 'gcj02',
				highAccuracy: true,
				timeout: 15000
			})

			try {
				await updateLocation({
					longitude: location.longitude,
					latitude: location.latitude
				})
				console.log('位置上报成功', location)
			} catch (err) {
				console.error('位置上报失败', err)
				// 位置上报失败不影响跳转
			}

			// 跳转工作台
			proxy.$tab.reLaunch('/pages/work/index')

		} catch (err) {
			console.warn('获取位置失败', err)

			// 判断是否是权限问题
			if (err.message && err.message.includes('权限')) {
				uni.showModal({
					title: '位置权限',
					content: '需要位置权限才能提供更好的服务，是否前往设置？',
					confirmText: '去设置',
					cancelText: '跳过',
					success: (res) => {
						if (res.confirm) {
							showLocationPermissionGuide()
						}
						// 无论是否去设置，都先跳转工作台
						setTimeout(() => {
							proxy.$tab.reLaunch('/pages/work/index')
						}, 100)
					}
				})
			} else {
				// 其他原因失败，直接跳转
				uni.showToast({
					title: '获取位置失败，已进入工作台',
					icon: 'none',
					duration: 2000
				})
				setTimeout(() => {
					proxy.$tab.reLaunch('/pages/work/index')
				}, 1500)
			}
		}
	}

	function handleForgetPwd() {
		proxy.$modal.msgToast('忘记密码功能开发中')
	}

	function handleContactService() {
		proxy.$modal.msgToast('联系客服功能开发中')
	}

	function handlePrivacy() {
		// #ifdef H5
		window.open(globalConfig.appInfo.agreements[1].url, '_blank')
		// #endif
		// #ifndef H5
		proxy.$tab.navigateTo('/pages/common/webview/index?url=' + encodeURIComponent(globalConfig.appInfo.agreements[1]
			.url))
		// #endif
	}

	function handleUserAgrement() {
		// #ifdef H5
		window.open(globalConfig.appInfo.agreements[0].url, '_blank')
		// #endif
		// #ifndef H5
		proxy.$tab.navigateTo('/pages/common/webview/index?url=' + encodeURIComponent(globalConfig.appInfo.agreements[0]
			.url))
		// #endif
	}

	function onKeyboardHeightChange(e) {
		// #ifdef APP-PLUS || MP-HARMONY
		keyboardHeight.value = e.height
		// #endif
		// #ifdef MP-WEIXIN
		keyboardHeight.value = e.height
		// #endif
		// #ifdef H5
		keyboardHeight.value = 0
		// #endif
	}

	onMounted(() => {
		getCode()

		// 监听键盘高度变化
		// #ifdef APP-PLUS || MP-HARMONY || MP-WEIXIN
		keyboardHeightListener = uni.onKeyboardHeightChange(onKeyboardHeightChange)
		// #endif
	})

	onUnmounted(() => {
		if (countdownTimer) {
			clearInterval(countdownTimer)
			countdownTimer = null
		}
		// #ifdef APP-PLUS || MP-HARMONY || MP-WEIXIN
		if (keyboardHeightListener) {
			keyboardHeightListener.off()
		}
		// #endif
	})
</script>

<style lang="scss" scoped>
page {
  background: linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%);
}

.normal-login-container {
  min-height: 100vh;
  padding: 0 60rpx;
  box-sizing: border-box;

  .logo-section {
    padding-top: 120rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 80rpx;

    .logo-box {
      width: 140rpx;
      height: 140rpx;
      background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
      border-radius: 36rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 30rpx;
      box-shadow: 0 8rpx 24rpx rgba(47, 107, 238, 0.1);

      .logo-img {
        width: 80rpx;
        height: 80rpx;
      }
    }

    .app-title {
      font-size: 48rpx;
      font-weight: bold;
      color: $text-primary;
    }

    .app-subtitle {
      font-size: 26rpx;
      color: $text-tertiary;
      margin-top: 10rpx;
    }
  }

  .login-tabs {
    display: flex;
    background: #fff;
    border: 1rpx solid $border-light;
    padding: 8rpx;
    border-radius: $radius-xl;
    margin-bottom: 40rpx;
    box-shadow: $shadow-sm;

    .tab-item {
      flex: 1;
      text-align: center;
      height: 80rpx;
      line-height: 80rpx;
      font-size: 28rpx;
      color: $text-secondary;
      border-radius: $radius-lg;
      transition: all $duration-base $ease-out;

      &.active {
        background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
        color: #fff;
        box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.3);
      }
    }
  }

  .input-item {
    background-color: $bg-card;
    height: 100rpx;
    border-radius: $radius-xl;
    margin-bottom: 30rpx;
    padding: 0 30rpx;
    box-shadow: $shadow-sm;
    border: 2rpx solid transparent;
    position: relative;
    transition: border-color $duration-fast, box-shadow $duration-fast;

    &:focus-within {
      border-color: $primary;
      box-shadow: 0 0 0 6rpx $primary-light;
    }

    .icon {
      font-size: 38rpx;
      color: $text-tertiary;
    }

    .input {
      flex: 1;
      padding-left: 20rpx;
      font-size: 28rpx;
      height: 100%;
      line-height: 100rpx;
      color: $text-primary;
    }

    .password-toggle {
      padding: 10rpx;

      .iconfont {
        font-size: 36rpx;
        color: $text-tertiary;
      }
    }

    .login-code-img {
      width: 160rpx;
      height: 60rpx;
      border-radius: $radius-sm;
    }

    .sms-code-btn {
      font-size: 24rpx;
      color: $primary;
      background: $primary-light;
      padding: 12rpx 24rpx;
      border-radius: $radius-base;
      white-space: nowrap;
      flex-shrink: 0;
      transition: all $duration-fast;

      &.disabled {
        color: $text-tertiary;
        background: $border-light;
      }
    }
  }

  .forget-pwd {
    text-align: right;
    color: $primary;
    font-size: 24rpx;
    margin-bottom: 40rpx;
  }

  .login-btn {
    height: 100rpx;
    background: linear-gradient(135deg, $primary 0%, $primary-dark 100%) !important;
    border-radius: $radius-xl;
    font-size: 32rpx;
    color: #fff;
    border: none;
    font-weight: 600;
    box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.3);
    transition: transform $duration-fast, box-shadow $duration-fast, opacity $duration-fast;

    &:active {
      transform: scale(0.97);
      box-shadow: 0 2rpx 6rpx rgba(47, 107, 238, 0.2);
    }

    &:disabled {
      background: #A5C3F0 !important;
      box-shadow: none;
    }
  }

  .xieyi-section {
    margin-top: 40rpx;
    font-size: 24rpx;

    .text-grey-dark {
      color: $text-secondary;
    }
  }

  .bottom-footer {
    position: fixed;
    bottom: 60rpx;
    left: 0;
    width: 100%;
    text-align: center;
    font-size: 26rpx;
    color: $text-tertiary;
  }
}
</style>