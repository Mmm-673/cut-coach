<template>
  <view class="edit-page">
    <!-- 头部提示 -->
    <view class="header-tip">
      <uni-icons type="info" size="18" :color="primaryColor"></uni-icons>
      <text>完善您的个人信息，让更多用户了解您</text>
    </view>

    <!-- 表单区域 -->
    <view class="form-section">
      <!-- 昵称 -->
      <view class="form-item">
        <view class="form-label">
          <text class="required">*</text>
          <text>用户昵称</text>
        </view>
        <input
          class="form-input"
          v-model="user.nickName"
          placeholder="请输入昵称"
          placeholder-class="placeholder"
        />
      </view>

      <!-- 手机号 -->
      <view class="form-item">
        <view class="form-label">
          <text class="required">*</text>
          <text>手机号码</text>
        </view>
        <input
          class="form-input"
          v-model="user.phonenumber"
          type="number"
          placeholder="请输入手机号码"
          placeholder-class="placeholder"
          :maxlength="11"
        />
      </view>

      <!-- 邮箱 -->
      <view class="form-item">
        <view class="form-label">
          <text class="required">*</text>
          <text>邮箱地址</text>
        </view>
        <input
          class="form-input"
          v-model="user.email"
          placeholder="请输入邮箱"
          placeholder-class="placeholder"
        />
      </view>

      <!-- 性别 -->
      <view class="form-item">
        <view class="form-label">
          <text class="required">*</text>
          <text>性别</text>
        </view>
        <view class="gender-selector">
          <view
            class="gender-option"
            :class="{ active: user.sex === '0' }"
            @click="user.sex = '0'"
          >
            <uni-icons type="person" :size="20" :color="user.sex === '0' ? primaryColor : textTertiaryColor"></uni-icons>
            <text>男</text>
          </view>
          <view
            class="gender-option"
            :class="{ active: user.sex === '1' }"
            @click="user.sex = '1'"
          >
            <uni-icons type="person" :size="20" :color="user.sex === '1' ? '#ec4899' : textTertiaryColor"></uni-icons>
            <text>女</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button
        class="submit-btn"
        :class="{ disabled: !canSubmit || isSubmitting }"
        :disabled="!canSubmit || isSubmitting"
        :loading="isSubmitting"
        @click="handleSubmit"
      >
        {{ isSubmitting ? '提交中...' : '保存修改' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getUserProfile, updateUserProfile } from '@/api/system/user'
import { usePageTheme, useThemeColor } from '@/utils/theme'

// 页面主题初始化
usePageTheme()

const primaryColor = useThemeColor('primary')
const textTertiaryColor = useThemeColor('textTertiary')

const user = ref({
  nickName: '',
  phonenumber: '',
  email: '',
  sex: ''
})

const isSubmitting = ref(false)

const canSubmit = computed(() => {
  return user.value.nickName &&
    user.value.phonenumber &&
    /^1[3-9]\d{9}$/.test(user.value.phonenumber) &&
    user.value.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.value.email) &&
    user.value.sex !== ''
})

const getUserInfo = async () => {
  try {
    const res = await getUserProfile()
    if (res.data) {
      user.value = {
        nickName: res.data.nickName || '',
        phonenumber: res.data.phonenumber || '',
        email: res.data.email || '',
        sex: res.data.sex !== undefined && res.data.sex !== null ? String(res.data.sex) : ''
      }
    }
  } catch (err) {
    console.error('获取用户信息失败', err)
  }
}

const handleSubmit = async () => {
  if (!canSubmit.value) {
    if (!user.value.nickName) {
      uni.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    if (!user.value.phonenumber) {
      uni.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(user.value.phonenumber)) {
      uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (!user.value.email) {
      uni.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.value.email)) {
      uni.showToast({ title: '请输入正确的邮箱', icon: 'none' })
      return
    }
    if (user.value.sex === '') {
      uni.showToast({ title: '请选择性别', icon: 'none' })
      return
    }
    return
  }

  isSubmitting.value = true
  try {
    await updateUserProfile(user.value)
    uni.showToast({ title: '修改成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (err) {
    console.error('更新失败', err)
    uni.showToast({ title: err?.msg || '修改失败，请重试', icon: 'none' })
  } finally {
    isSubmitting.value = false
  }
}

onShow(() => {
  getUserInfo()
})

onMounted(() => {
  getUserInfo()
})


</script>

<style lang="scss" scoped>
.edit-page {
  min-height: 100vh;
  background: var(--bg-page-gradient, linear-gradient(180deg, var(--bg-page, #f8fbff) 0%, #ffffff 100%));
  padding: 24rpx 24rpx 180rpx;
}

.header-tip {
  background: linear-gradient(135deg, #e6f0ff 0%, #f0f7ff 100%);
  border-radius: 18rpx;
  padding: 24rpx;
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;

  text {
    font-size: 26rpx;
    color: var(--color-primary, #2f6bee);
    flex: 1;
    line-height: 1.6;
  }
}

.form-section {
  background: var(--bg-card, #fff);
  border-radius: 28rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 12rpx var(--shadow-card, rgba(0, 0, 0, 0.05));
}

.form-item {
  margin-bottom: 36rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
  font-size: 28rpx;
  color: var(--text-primary, #374151);
  font-weight: 500;

  .required {
    color: var(--color-danger, #ef4444);
    font-size: 32rpx;
    line-height: 1;
  }
}

.form-input {
  width: 100%;
  height: 96rpx;
  background: #f8fafc;
  border-radius: 18rpx;
  padding: 0 28rpx;
  font-size: 30rpx;
  color: var(--text-primary, #1f2937);
  box-sizing: border-box;
  border: 2rpx solid transparent;
  transition: all 0.2s;

  &:focus {
    background: var(--bg-card, #fff);
    border-color: var(--color-primary, #2f6bee);
    box-shadow: 0 0 0 6rpx rgba(47, 107, 238, 0.1);
  }
}

.placeholder {
  color: var(--text-tertiary, #9ca3af);
}

.gender-selector {
  display: flex;
  gap: 20rpx;
}

.gender-option {
  flex: 1;
  height: 96rpx;
  background: #f8fafc;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  font-size: 30rpx;
  color: var(--text-secondary, #6b7280);
  border: 2rpx solid transparent;
  transition: all 0.2s;

  &:active {
    transform: scale(0.98);
  }

  &.active {
    background: linear-gradient(135deg, #e6f0ff 0%, #f0f7ff 100%);
    color: var(--color-primary, #2f6bee);
    border-color: var(--color-primary, #2f6bee);
    font-weight: 600;
  }
}

.submit-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: var(--bg-card, #fff);
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.submit-btn {
  width: 100%;
  height: 100rpx;
  line-height: 100rpx;
  background: var(--gradient-primary, linear-gradient(135deg, var(--color-primary, #2f6bee) 0%, var(--color-primary-dark, #1a50d9) 100%));
  color: #fff;
  border-radius: 24rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  box-shadow: 0 4rpx 12rpx var(--color-primary-shadow, rgba(47, 107, 238, 0.3));
  transition: all 0.2s;

  &::after {
    border: none;
  }

  &:active {
    transform: scale(0.97);
  }

  &.disabled {
    background: var(--border-color, #e5e7eb);
    color: var(--text-tertiary, #9ca3af);
    box-shadow: none;
  }
}
</style>
