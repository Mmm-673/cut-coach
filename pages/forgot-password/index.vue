<template>
  <view class="forgot-container" :style="{ paddingBottom: keyboardHeight + 'px' }">
    <!-- 头部 -->
    <view class="header-section">
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <view class="title">忘记密码</view>
      <view class="subtitle">重置您的登录密码</view>
    </view>

    <!-- 表单区域 -->
    <view class="form-section">
      <!-- 手机号 -->
      <view class="input-item">
        <view class="iconfont icon-phone icon"></view>
        <input
          v-model="formData.mobile"
          class="input"
          type="number"
          placeholder="请输入手机号"
          :maxlength="11"
          :focus="focusIndex === 0"
          @focus="onInputFocus(0)"
          @blur="onInputBlur"
        />
      </view>

      <!-- 验证码 -->
      <view class="input-item">
        <view class="iconfont icon-code icon"></view>
        <input
          v-model="formData.smsCode"
          class="input"
          type="number"
          placeholder="请输入验证码"
          :maxlength="6"
          :focus="focusIndex === 1"
          @focus="onInputFocus(1)"
          @blur="onInputBlur"
        />
        <view
          class="code-btn"
          :class="{ disabled: countdown > 0 }"
          @click="handleGetSmsCode"
        >
          {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
        </view>
      </view>

      <!-- 新密码 -->
      <view class="input-item">
        <view class="iconfont icon-password icon"></view>
        <input
          v-model="formData.password"
          class="input"
          :password="!showPassword"
          placeholder="请输入新密码"
          :maxlength="20"
          :focus="focusIndex === 2"
          @focus="onInputFocus(2)"
          @blur="onInputBlur"
        />
        <view class="password-toggle" @click="showPassword = !showPassword">
          <uni-icons :type="showPassword ? 'eye' : 'eye-slash'" size="20" color="#999"></uni-icons>
        </view>
      </view>

      <!-- 确认密码 -->
      <view class="input-item">
        <view class="iconfont icon-password icon"></view>
        <input
          v-model="formData.confirmPassword"
          class="input"
          :password="!showConfirmPassword"
          placeholder="请确认新密码"
          :maxlength="20"
          :focus="focusIndex === 3"
          @focus="onInputFocus(3)"
          @blur="onInputBlur"
        />
        <view class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
          <uni-icons :type="showConfirmPassword ? 'eye' : 'eye-slash'" size="20" color="#999"></uni-icons>
        </view>
      </view>
    </view>

    <!-- 协议 -->
    <view class="agreement-section">
      <checkbox-group @change="onCheckChange">
        <label class="flex align-center justify-center">
          <checkbox value="check" :checked="isAgreed" color="#2f6bee" style="transform: scale(0.6)" />
          <view class="text">
            我已阅读并同意
            <text @click.stop="handleUserAgreement" class="link">《用户协议》</text>
            和
            <text @click.stop="handlePrivacy" class="link">《隐私政策》</text>
          </view>
        </label>
      </checkbox-group>
    </view>

    <!-- 按钮 -->
    <view class="btn-section">
      <button
        @click="handleReset"
        :disabled="isSubmitting"
        class="reset-btn"
        :class="{ disabled: isSubmitting }"
      >
        {{ isSubmitting ? '提交中...' : '确认重置' }}
      </button>
    </view>

    <!-- 返回登录 -->
    <view class="back-login" @click="goBackLogin">
      <text>返回登录</text>
    </view>
  </view>
</template>

<script setup>
import { ref, getCurrentInstance, onMounted, onUnmounted } from 'vue'
import { sendSmsCode } from '@/api/login'

const { proxy } = getCurrentInstance()

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const focusIndex = ref(-1)
const keyboardHeight = ref(0)
const countdown = ref(0)
const isAgreed = ref(true)
const isSubmitting = ref(false)

let countdownTimer = null
let keyboardHeightListener = null

const formData = ref({
  mobile: '',
  smsCode: '',
  password: '',
  confirmPassword: ''
})

// 切换输入框焦点
const onInputFocus = (index) => {
  focusIndex.value = index
}

const onInputBlur = () => {
  setTimeout(() => {
    focusIndex.value = -1
  }, 100)
}

// 协议勾选
const onCheckChange = (e) => {
  isAgreed.value = e.detail.value.length > 0
}

// 获取验证码
const handleGetSmsCode = async () => {
  if (!formData.value.mobile) {
    return proxy.$modal.msgError('请输入手机号')
  }
  if (!/^1[3-9]\d{9}$/.test(formData.value.mobile)) {
    return proxy.$modal.msgError('请输入正确的手机号')
  }
  if (countdown.value > 0) return

  proxy.$modal.loading('发送中...')
  try {
    const res = await sendSmsCode(formData.value.mobile)
    if (res.code === 0 || res.code === 200) {
      proxy.$modal.msgSuccess('验证码已发送')
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

// 倒计时
const startCountdown = () => {
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

// 验证表单
const validateForm = () => {
  if (!formData.value.mobile) {
    proxy.$modal.msgError('请输入手机号')
    return false
  }
  if (!/^1[3-9]\d{9}$/.test(formData.value.mobile)) {
    proxy.$modal.msgError('请输入正确的手机号')
    return false
  }
  if (!formData.value.smsCode) {
    proxy.$modal.msgError('请输入验证码')
    return false
  }
  if (!formData.value.password) {
    proxy.$modal.msgError('请输入新密码')
    return false
  }
  if (formData.value.password.length < 6) {
    proxy.$modal.msgError('密码长度至少6位')
    return false
  }
  if (formData.value.password !== formData.value.confirmPassword) {
    proxy.$modal.msgError('两次密码输入不一致')
    return false
  }
  if (!isAgreed.value) {
    proxy.$modal.msgError('请先阅读并同意协议')
    return false
  }
  return true
}

// 重置密码
const handleReset = async () => {
  if (!validateForm()) return

  isSubmitting.value = true
  proxy.$modal.loading('提交中...')

  try {
    // TODO: 调用重置密码API
    // 这里先模拟成功
    setTimeout(() => {
      proxy.$modal.closeLoading()
      proxy.$modal.msgSuccess('密码重置成功')
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }, 1000)
  } catch (err) {
    proxy.$modal.closeLoading()
    proxy.$modal.msgError(err?.msg || err || '重置失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

// 返回登录
const goBackLogin = () => {
  uni.navigateBack()
}

// 用户协议
const handleUserAgreement = () => {
  uni.showToast({
    title: '用户协议',
    icon: 'none'
  })
}

// 隐私政策
const handlePrivacy = () => {
  uni.showToast({
    title: '隐私政策',
    icon: 'none'
  })
}

// 键盘高度变化
const onKeyboardHeightChange = (e) => {
  keyboardHeight.value = e.height + 'px'
}

onMounted(() => {
  // 监听键盘高度变化
  keyboardHeightListener = uni.onKeyboardHeightChange(onKeyboardHeightChange)
})

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
.forgot-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  padding: 80rpx 48rpx 40rpx;
  padding-top: calc(80rpx + var(--status-bar-height));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

/* 头部 */
.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 60rpx;
  margin-bottom: 60rpx;
}

.logo {
  width: 140rpx;
  height: 140rpx;
  border-radius: 36rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-top: 30rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #999;
  margin-top: 10rpx;
}

/* 表单 */
.form-section {
  margin-bottom: 40rpx;
}

.input-item {
  background-color: #fff;
  height: 100rpx;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
  padding: 0 30rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  border: 2rpx solid transparent;
  transition: border-color 0.2s;
  position: relative;
}

.input-item:focus-within {
  border-color: #2f6bee;
  box-shadow: 0 0 0 6rpx rgba(47, 107, 238, 0.1);
}

.input-item .icon {
  font-size: 36rpx;
  color: #999;
}

.input-item .input {
  flex: 1;
  padding-left: 20rpx;
  font-size: 30rpx;
  height: 100%;
  color: #333;
}

.code-btn {
  font-size: 26rpx;
  color: #2f6bee;
  background: #e6f0ff;
  padding: 14rpx 28rpx;
  border-radius: 40rpx;
  white-space: nowrap;
  transition: all 0.2s;
}

.code-btn.disabled {
  color: #999;
  background: #f5f5f5;
}

.password-toggle {
  padding: 10rpx;
}

/* 协议 */
.agreement-section {
  margin-bottom: 50rpx;
}

.agreement-section .flex {
  display: flex;
}

.agreement-section .align-center {
  align-items: center;
}

.agreement-section .justify-center {
  justify-content: center;
}

.agreement-section .text {
  font-size: 26rpx;
  color: #666;
}

.agreement-section .link {
  color: #2f6bee;
}

/* 按钮 */
.btn-section {
  margin-bottom: 40rpx;
}

.reset-btn {
  width: 100%;
  height: 100rpx;
  line-height: 100rpx;
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  color: #fff;
  border-radius: 24rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.3);
  transition: all 0.2s;
}

.reset-btn:active {
  transform: scale(0.97);
}

.reset-btn.disabled {
  background: #a5c3f0 !important;
  box-shadow: none;
}

.reset-btn::after {
  border: none;
}

/* 返回登录 */
.back-login {
  text-align: center;
  font-size: 28rpx;
  color: #2f6bee;
  margin-top: 30rpx;
}
</style>