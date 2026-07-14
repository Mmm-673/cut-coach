<template>
  <view class="normal-login-container" :style="{ paddingBottom: keyboardHeight + 'px' }">
    <view class="logo-section">
      <view class="logo-box">
        <image class="logo-img" :src="globalConfig.appInfo.logo" mode="aspectFit"></image>
      </view>
      <text class="app-subtitle">欢迎回来，请登录您的裁教账号</text>
    </view>

    <view class="login-form-content">
      <view class="login-tabs" v-if="isPwdLoginEnabled">
        <view :class="['tab-item', activeTab === 'pwd' ? 'active' : '']"
              @click="switchTab('pwd')">密码登录</view>
        <view :class="['tab-item', activeTab === 'sms' ? 'active' : '']"
              @click="switchTab('sms')">短信登录</view>
      </view>

      <view class="input-group">
        <!-- 密码登录表单 -->
        <template v-if="isPwdLoginEnabled && activeTab === 'pwd'">
          <view class="input-item flex align-center">
            <view class="iconfont icon-user icon"></view>
            <input v-model="pwdForm.username" class="input" type="text"
                   placeholder="请输入账号" :maxlength="30" :focus="focusIndex === 0"
                   @focus="onInputFocus(0)" @blur="onInputBlur" confirm-type="next" @confirm="focusNextInput(1)" />
          </view>

          <view class="input-item flex align-center">
            <view class="iconfont icon-password icon"></view>
            <input class="input" v-model="pwdForm.password" :password="!showPassword"
                   placeholder="请输入密码" :maxlength="20" :focus="focusIndex === 1" @focus="onInputFocus(1)"
                   @blur="onInputBlur" confirm-type="done" @confirm="handlePwdLogin" />
            <view class="password-toggle" @click="showPassword = !showPassword">
              <uni-icons :type="showPassword ? 'eye' : 'eye-slash'" size="20" color="#999"></uni-icons>
            </view>
          </view>

        </template>

        <!-- 短信登录表单 -->
        <template v-if="activeTab === 'sms'">
          <view class="input-item flex align-center">
            <view class="iconfont icon-user icon"></view>
            <input v-model="smsForm.mobile" class="input" type="number"
                   placeholder="请输入手机号" :maxlength="11" :focus="focusIndex === 0"
                   @focus="onInputFocus(0)" @blur="onInputBlur" confirm-type="next" @confirm="focusNextInput(1)" />
          </view>

          <view class="input-item flex align-center">
            <view class="iconfont icon-code icon"></view>
            <input v-model="smsForm.smsCode" type="number" class="input" placeholder="请输入验证码" :maxlength="6"
                   :focus="focusIndex === 1" @focus="onInputFocus(1)" @blur="onInputBlur" confirm-type="done"
                   @confirm="handleSmsLogin" />
            <view class="sms-code-btn" :class="{ 'disabled': countdown > 0 }" @click="handleGetSmsCode">
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </view>
          </view>
        </template>
      </view>

      <view class="forget-pwd" v-if="isPwdLoginEnabled && activeTab === 'pwd'" @click="handleForgetPwd">忘记密码？</view>

      <view class="action-btn">
        <button @click="handleLogin" :disabled="isLoggingIn" class="login-btn cu-btn block bg-blue lg round">
          {{ isLoggingIn ? '登录中...' : '登录/注册' }}
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
    <!-- #ifdef APP-PLUS -->
    <ios-privacy-dialog ref="privacyDialogRef" />
    <!-- #endif -->
</template>

<script setup>
import {
  ref,
  getCurrentInstance,
  onMounted,
  onUnmounted, nextTick
} from "vue"
import config from '@/config'
import {
  getCodeImg,
  sendSmsCode
} from '@/api/login'
import {
  getPwdSwitch
} from '@/api/billiard/coach'
import {
  useConfigStore,
  useUserStore
} from '@/store'
import { onShow } from '@dcloudio/uni-app'

import { syncPushForUser } from '@/utils/jpush'
import { getUserId } from '@/utils/auth'
import { shouldShowIosPrivacy, hasPrivacyRefused } from '@/utils/privacy'


const {
  proxy
} = getCurrentInstance()
const globalConfig = useConfigStore().config
const userStore = useUserStore()

const isAgreed = ref(false)
const countdown = ref(0)
const showPassword = ref(false)
const focusIndex = ref(-1)
const keyboardHeight = ref(0)
const isLoggingIn = ref(false)
const activeTab = ref('sms')
const privacyDialogRef = ref(null)
const isPwdLoginEnabled = ref(true)

const pwdForm = ref({
  username: "",
  password: ""
})

const smsForm = ref({
  mobile: "",
  smsCode: ""
})

let countdownTimer = null
let keyboardHeightListener = null

function switchTab(tab) {
  activeTab.value = tab
  focusIndex.value = -1
}

/** 查询密码登录是否可用 */
async function fetchPwdLoginEnabled() {
  try {
    // const res = await getPwdSwitch()
    // if (res.code === 0 || res.code === 200) {
    //   isPwdLoginEnabled.value = !!res.data
    //   // 如果密码登录可用，默认显示密码登录；否则只显示短信登录
    //   if (isPwdLoginEnabled.value) {
    //     activeTab.value = 'pwd'
    //   }
    // }
  } catch (err) {
    // 接口调用失败时，默认不显示密码登录
    isPwdLoginEnabled.value = false
  }
}

/** 打开 iOS 隐私协议弹窗 */
function openPrivacyDialogIfNeeded() {
  if (!shouldShowIosPrivacy() && !hasPrivacyRefused()) {
    return
  }
  nextTick(() => {
    privacyDialogRef.value?.open()
  })
}

onShow(() => {
  openPrivacyDialogIfNeeded()
})

onMounted(() => {
  fetchPwdLoginEnabled()
  openPrivacyDialogIfNeeded()
  keyboardHeightListener = uni.onKeyboardHeightChange(onKeyboardHeightChange)
})

async function handleGetSmsCode() {
  if (!/^1[3-9]\d{9}$/.test(smsForm.value.mobile)) {
    return proxy.$modal.msgError("请输入正确的手机号")
  }
  if (countdown.value > 0) return

  proxy.$modal.loading("发送中...")
  try {
    const res = await sendSmsCode(smsForm.value.mobile)
    if (res.code === 0 || res.code === 200) {
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
    return proxy.$modal.msgError("请先勾选并同意用户协议和隐私政策")
  }

  if (activeTab.value === 'pwd') {
    await handlePwdLogin()
  } else {
    await handleSmsLogin()
  }
}

async function handlePwdLogin() {
  if (!isAgreed.value) {
    return proxy.$modal.msgError("请先勾选并同意用户协议和隐私政策")
  }

  const { username, password } = pwdForm.value

  if (!username) {
    return proxy.$modal.msgError("请输入账号")
  }
  if (!password) {
    return proxy.$modal.msgError("请输入密码")
  }

  isLoggingIn.value = true
  proxy.$modal.loading("登录中...")

  try {
    await userStore.login({
      loginType: 'pwd',
      username,
      password
    })

    proxy.$modal.closeLoading()
    loginSuccess()
  } catch (err) {
    proxy.$modal.closeLoading()
    proxy.$modal.msgError(err || '登录失败，请重试')
  } finally {
    isLoggingIn.value = false
  }
}

async function handleSmsLogin() {
  if (!isAgreed.value) {
    return proxy.$modal.msgError("请先勾选并同意用户协议和隐私政策")
  }

  const { mobile, smsCode } = smsForm.value

  if (!/^1[3-9]\d{9}$/.test(mobile)) {
    return proxy.$modal.msgError("请输入正确的手机号")
  }
  if (!smsCode) {
    return proxy.$modal.msgError("请输入短信验证码")
  }

  isLoggingIn.value = true
  proxy.$modal.loading("登录中...")

  try {
    await userStore.smsLogin({
      loginType: 'sms',
      username: mobile,
      smsCode
    })

    proxy.$modal.closeLoading()
    loginSuccess()
  } catch (err) {
    proxy.$modal.closeLoading()
    proxy.$modal.msgError(err?.msg || err || '登录失败，请重试')
  } finally {
    isLoggingIn.value = false
  }
}

function loginSuccess() {
  // 先绑定推送
  bindPushAfterLogin()

  // 尝试获取用户信息
  userStore.getInfo().then(() => {
    // 获取成功，跳转首页
    proxy.$tab.reLaunch('/pages/work/index')
  }).catch((err) => {
    console.warn('获取用户信息失败，但继续进入首页:', err)
    // 即使获取用户信息失败，也继续进入首页
    proxy.$tab.reLaunch('/pages/work/index')
  })
}

function bindPushAfterLogin() {
  // #ifdef APP-PLUS
  const userId = getUserId()
  if (userId) {
    syncPushForUser(userId)
  }
  // #endif
}


function handleForgetPwd() {
  uni.showToast({
    title: '请联系负责人进行密码修改',
    icon: 'none',
    duration: 2000
  })
}

function handleContactService() {
  uni.showModal({
    title: '联系客服',
    content: `客服电话：${config.appInfo.customerServicePhone}\n工作时间：${config.appInfo.customerServiceHours}`,
    showCancel: false
  })
}

function openAgreementPage(title) {
  const agreement = config.appInfo.agreements.find(item => item.title === title)
  if (!agreement?.url) return

  uni.navigateTo({
    url: `/subpkg/common/webview/index?url=${encodeURIComponent(agreement.url)}&title=${encodeURIComponent(title)}`
  })
}

function handlePrivacy() {
  openAgreementPage('隐私政策')
}

function handleUserAgrement() {
  openAgreementPage('用户服务协议')
}

function onKeyboardHeightChange(e) {
  keyboardHeight.value = e.height || 0
}

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  if (keyboardHeightListener) {
    keyboardHeightListener.off()
  }
})
</script>

<style lang="scss" scoped>
page {
  background: linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%);
}

.normal-login-container {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 120rpx 48rpx 40rpx;
  padding-top: calc(120rpx + var(--status-bar-height));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

.logo-section {
  padding-top: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.logo-box {
  width: 140rpx;
  height: 140rpx;
  border-radius: 36rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-img {
  width: 140rpx;
  height: 140rpx;
}

.app-subtitle {
  font-size: 26rpx;
  color: #999;
  margin-top: 10rpx;
}

.login-tabs {
  display: flex;
  background: #fff;
  padding: 8rpx;
  border-radius: 24rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  text-align: center;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  color: #666;
  border-radius: 20rpx;
  transition: all 0.3s ease;
}

.tab-item.active {
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.3);
}

.input-item {
  background-color: #fff;
  height: 100rpx;
  border-radius: 24rpx;
  margin-bottom: 30rpx;
  padding: 0 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  border: 2rpx solid transparent;
  position: relative;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-item:focus-within {
  border-color: #2f6bee;
  box-shadow: 0 0 0 6rpx rgba(47, 107, 238, 0.1);
}

.icon {
  font-size: 38rpx;
  color: #999;
}

.input {
  flex: 1;
  padding-left: 20rpx;
  font-size: 28rpx;
  height: 100%;
  line-height: 100rpx;
  color: #333;
}

.password-toggle {
  padding: 10rpx;
}

.login-code-img {
  width: 160rpx;
  height: 60rpx;
  border-radius: 12rpx;
}

.sms-code-btn {
  font-size: 24rpx;
  color: #2f6bee;
  background: #e6f0ff;
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;
}

.sms-code-btn.disabled {
  color: #999;
  background: #f5f5f5;
}

.forget-pwd {
  text-align: right;
  color: #2f6bee;
  font-size: 24rpx;
  margin-bottom: 40rpx;
}

.login-btn {
  height: 100rpx;
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%) !important;
  border-radius: 24rpx;
  font-size: 32rpx;
  color: #fff;
  border: none;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.3);
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
}

.login-btn:active {
  transform: scale(0.97);
}

.login-btn:disabled {
  background: #A5C3F0 !important;
  box-shadow: none;
}

.xieyi-section {
  margin-top: 40rpx;
  font-size: 24rpx;
}

.text-grey-dark {
  color: #666;
}

.text-blue {
  color: #2f6bee;
}

.bottom-footer {
  position: fixed;
  bottom: 60rpx;
  left: 0;
  width: 100%;
  text-align: center;
  font-size: 26rpx;
  color: #999;
}
</style>