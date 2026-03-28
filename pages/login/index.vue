<template>
  <view class="normal-login-container">
    <view class="logo-section">
      <view class="logo-box">
        <image class="logo-img" :src="globalConfig.appInfo.logo" mode="aspectFit"></image>
      </view>
      <text class="app-title">台球助教端</text>
      <text class="app-subtitle">欢迎回来，请登录您的账号</text>
    </view>

    <view class="login-form-content">
      <view class="login-tabs">
        <view
            :class="['tab-item', loginForm.loginType === 'sms' ? 'active' : '']"
            @click="loginForm.loginType = 'sms'"
        >短信登录</view>
        <view
            :class="['tab-item', loginForm.loginType === 'pwd' ? 'active' : '']"
            @click="loginForm.loginType = 'pwd'"
        >密码登录</view>
      </view>

      <view class="input-group">
        <view class="input-item flex align-center">
          <view class="iconfont icon-user icon"></view>
          <input
              v-model="loginForm.username"
              class="input"
              type="text"
              :placeholder="loginForm.loginType === 'sms' ? '请输入手机号' : '请输入账号'"
              maxlength="30"
          />
        </view>

        <view class="input-item flex align-center" v-if="loginForm.loginType === 'pwd'">
          <view class="iconfont icon-password icon"></view>
          <input v-model="loginForm.password" type="password" class="input" placeholder="请输入密码" maxlength="20" />
        </view>

        <view class="input-item flex align-center" v-if="loginForm.loginType === 'pwd' && captchaEnabled">
          <view class="iconfont icon-code icon"></view>
          <input v-model="loginForm.code" type="number" class="input" placeholder="验证码" maxlength="4" />
          <view class="login-code-wrapper">
            <image :src="codeUrl" @click="getCode" class="login-code-img"></image>
          </view>
        </view>

        <view class="input-item flex align-center" v-if="loginForm.loginType === 'sms'">
          <view class="iconfont icon-code icon"></view>
          <input v-model="loginForm.smsCode" type="number" class="input" placeholder="请输入验证码" maxlength="6" />
          <view class="sms-code-btn" :class="{ 'disabled': countdown > 0 }" @click="handleGetSmsCode">
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </view>
        </view>
      </view>

      <view class="forget-pwd" v-if="loginForm.loginType === 'pwd'">忘记密码？</view>

      <view class="action-btn">
        <button @click="handleLogin" class="login-btn cu-btn block bg-blue lg round">登录</button>
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
      遇到问题？<text class="text-blue">联系客服</text>
    </view>
  </view>
</template>

<script setup>
import { ref, getCurrentInstance } from "vue"
import { getCodeImg } from '@/api/login'
import { useConfigStore, useUserStore } from '@/store'

const { proxy } = getCurrentInstance()
const globalConfig = useConfigStore().config

const codeUrl = ref("")
const captchaEnabled = ref(false)
const isAgreed = ref(true)
const countdown = ref(0)

const loginForm = ref({
  loginType: 'pwd', // 'sms' 或 'pwd'
  username: "coach_demo_01",
  password: "admin123",
  code: "",      // 图形验证码
  smsCode: "",   // 短信验证码
  uuid: ""
})

// 获取图形验证码（当前禁用，保留接口供后续使用）
function getCode() {
  getCodeImg().then(res => {
    captchaEnabled.value = res.captchaEnabled ?? false
    if (captchaEnabled.value && res.img) {
      codeUrl.value = 'data:image/gif;base64,' + res.img
      loginForm.value.uuid = res.uuid
    }
  })
}

// 模拟获取短信验证码（待后续接入）
function handleGetSmsCode() {
  if (!/^1[3-9]\d{9}$/.test(loginForm.value.username)) {
    return proxy.$modal.msgError("请输入正确的手机号")
  }
  if (countdown.value > 0) return

  proxy.$modal.msgSuccess("验证码已发送")
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

function onCheckChange(e) {
  isAgreed.value = e.detail.value.length > 0
}

async function handleLogin() {
  if (!isAgreed.value) {
    return proxy.$modal.msgError("请先同意用户协议")
  }

  const { username, password, code, smsCode, loginType } = loginForm.value

  if (username === "") return proxy.$modal.msgError(loginType === 'sms' ? "请输入手机号" : "请输入账号")

  if (loginType === 'pwd') {
    if (password === "") return proxy.$modal.msgError("请输入密码")
    if (captchaEnabled.value && !code) return proxy.$modal.msgError("请输入图形验证码")

    proxy.$modal.loading("登录中...")

    useUserStore().login(loginForm.value).then(() => {
      proxy.$modal.closeLoading()
      loginSuccess()
    }).catch((err) => {
      proxy.$modal.closeLoading()
      proxy.$modal.msgError(err || '登录失败，请重试')
      if (captchaEnabled.value) getCode()
    })
  } else {
    if (smsCode === "") return proxy.$modal.msgError("请输入短信验证码")
    proxy.$modal.msgError("短信登录功能待接入")
  }
}

function loginSuccess() {
  useUserStore().getInfo().then(() => {
    proxy.$tab.reLaunch('/pages/index')
  }).catch(() => {
    proxy.$tab.reLaunch('/pages/index')
  })
}

function handlePrivacy() {}
function handleUserAgrement() {}

getCode()
</script>

<style lang="scss" scoped>
page { background-color: #f8fbff; }

.normal-login-container {
  padding: 0 60rpx;

  .logo-section {
    padding-top: 120rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 80rpx;

    .logo-box {
      width: 140rpx;
      height: 140rpx;
      background: #edf4ff;
      border-radius: 36rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 30rpx;
      .logo-img { width: 80rpx; height: 80rpx; }
    }
    .app-title { font-size: 48rpx; font-weight: bold; color: #1e293b; }
    .app-subtitle { font-size: 26rpx; color: #94a3b8; margin-top: 10rpx; }
  }

  .login-tabs {
    display: flex;
    background: #fff;
    border: 1px solid #f1f5f9;
    padding: 8rpx;
    border-radius: 20rpx;
    margin-bottom: 40rpx;

    .tab-item {
      flex: 1;
      text-align: center;
      height: 80rpx;
      line-height: 80rpx;
      font-size: 28rpx;
      color: #64748b;
      border-radius: 16rpx;
      &.active {
        background-color: #2f6bee;
        color: #fff;
      }
    }
  }

  .input-item {
    background-color: #ffffff;
    height: 100rpx;
    border-radius: 20rpx;
    margin-bottom: 30rpx;
    padding: 0 30rpx;
    box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.02);

    .icon { font-size: 38rpx; color: #94a3b8; }
    .input { flex: 1; padding-left: 20rpx; font-size: 28rpx; }

    .login-code-img { width: 160rpx; height: 60rpx; }
    .sms-code-btn {
      font-size: 24rpx;
      color: #2f6bee;
      background: #f0f7ff;
      padding: 10rpx 20rpx;
      border-radius: 10rpx;
      &.disabled { color: #cbd5e1; }
    }
  }

  .forget-pwd {
    text-align: right;
    color: #2f6bee;
    font-size: 24rpx;
    margin-bottom: 40rpx;
  }

  .login-btn {
    height: 100rpx;
    background-color: #2f6bee !important;
    border-radius: 20rpx;
    font-size: 32rpx;
  }

  .xieyi-section {
    margin-top: 40rpx;
    font-size: 24rpx;
    .text-grey-dark { color: #64748b; }
  }

  .bottom-footer {
    position: fixed;
    bottom: 60rpx;
    left: 0;
    width: 100%;
    text-align: center;
    font-size: 26rpx;
    color: #94a3b8;
  }
}
</style>