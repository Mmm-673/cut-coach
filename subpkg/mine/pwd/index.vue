<template>
  <view class="pwd-container">
    <view class="header-section">
      <view class="title">修改密码</view>
      <view class="subtitle">请设置新密码</view>
    </view>

    <view class="form-content">
      <view class="input-group">
        <view class="input-item flex align-center">
          <view class="iconfont icon-password icon"></view>
          <input
            class="input"
            v-model="user.newPassword"
            :password="!showNewPassword"
            placeholder="请输入新密码"
            :maxlength="20"
            :focus="focusIndex === 0"
            @focus="onInputFocus(0)"
            @blur="onInputBlur"
            confirm-type="next"
            @confirm="focusNextInput(1)"
          />
          <view class="password-toggle" @click="showNewPassword = !showNewPassword">
            <uni-icons :type="showNewPassword ? 'eye' : 'eye-slash'" size="20" color="#999"></uni-icons>
          </view>
        </view>

        <view class="input-item flex align-center">
          <view class="iconfont icon-password icon"></view>
          <input
            class="input"
            v-model="user.confirmPassword"
            :password="!showConfirmPassword"
            placeholder="请确认新密码"
            :maxlength="20"
            :focus="focusIndex === 1"
            @focus="onInputFocus(1)"
            @blur="onInputBlur"
            confirm-type="done"
            @confirm="submit"
          />
          <view class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
            <uni-icons :type="showConfirmPassword ? 'eye' : 'eye-slash'" size="20" color="#999"></uni-icons>
          </view>
        </view>
      </view>

      <view class="action-btn">
        <button @click="submit" :disabled="isSubmitting" class="submit-btn cu-btn block bg-blue lg round">
          {{ isSubmitting ? '提交中...' : '确认修改' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { updateUserPwd } from "@/api/system/user"
import { ref, reactive, getCurrentInstance } from "vue"

const { proxy } = getCurrentInstance()
const user = reactive({
  newPassword: undefined,
  confirmPassword: undefined
})

const focusIndex = ref(-1)
const isSubmitting = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

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

function validate() {
  if (!user.newPassword) {
    proxy.$modal.msgError('请输入新密码')
    return false
  }
  if (user.newPassword.length < 6 || user.newPassword.length > 20) {
    proxy.$modal.msgError('新密码长度在 6 到 20 个字符')
    return false
  }
  if (!user.confirmPassword) {
    proxy.$modal.msgError('请确认新密码')
    return false
  }
  if (user.newPassword !== user.confirmPassword) {
    proxy.$modal.msgError('两次输入的密码不一致')
    return false
  }
  return true
}

async function submit() {
  if (!validate()) return

  isSubmitting.value = true
  try {
    // 传空字符串作为旧密码，与用户端保持一致
    await updateUserPwd('', user.newPassword)
    proxy.$modal.msgSuccess("修改成功")
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (err) {
    // 错误已通过拦截器处理
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style lang="scss" scoped>
page {
  background: linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%);
}

.pwd-container {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 48rpx 40rpx;
}

.header-section {
  margin-bottom: 80rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #999;
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

.submit-btn {
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

.submit-btn:active {
  transform: scale(0.97);
}

.submit-btn:disabled {
  background: #A5C3F0 !important;
  box-shadow: none;
}

.action-btn {
  margin-top: 40rpx;
}
</style>
