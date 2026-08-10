<template>
  <view class="appeal-page">
    <!-- 扣款信息卡片 -->
    <view class="info-card">
      <view class="card-header">
        <uni-icons type="info" size="20" color="#2f6bee"></uni-icons>
        <text class="card-title">扣款信息</text>
      </view>
      <view class="card-item">
        <text class="item-label">扣款类型</text>
        <text class="item-value">扣款申诉</text>
      </view>
      <view class="card-item">
        <text class="item-label">扣款金额</text>
        <text class="item-value red">¥{{ formatAmount(deductAmount) }}</text>
      </view>
      <view class="card-item">
        <text class="item-label">订单编号</text>
        <text class="item-value">{{ orderId || '-' }}</text>
      </view>
      <view class="card-item">
        <text class="item-label">扣款原因</text>
        <text class="item-value">{{ deductReason || '-' }}</text>
      </view>
    </view>

    <!-- 申诉表单 -->
    <view class="form-card">
      <view class="form-header">
        <uni-icons type="compose" size="20" color="#2f6bee"></uni-icons>
        <text class="form-title">申诉信息</text>
      </view>

      <!-- 申诉内容 -->
      <view class="form-item">
        <text class="form-label">申诉说明</text>
        <textarea
          v-model="form.content"
          class="form-textarea"
          placeholder="请详细描述申诉原因，越详细处理越快（至少5个字）"
          :maxlength="200"
          :show-confirm-bar="false"
          :auto-height="true"
          :min-height="200"
        ></textarea>
        <view class="char-count">{{ form.content.length }}/200</view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button
        class="submit-btn"
        :class="{ disabled: !canSubmit || submitting }"
        :disabled="!canSubmit || submitting"
        :loading="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '提交中...' : '提交申诉' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { postDeductionAppeal } from '@/api/billiard/wallet'

// 从URL获取参数
const recordId = ref('')
const orderId = ref('')
const deductReason = ref('')
const deductAmount = ref(0)

onLoad((options) => {
  recordId.value = options.recordId || ''
  orderId.value = options.orderId || ''
  deductReason.value = decodeURIComponent(options.reason || '')
  deductAmount.value = parseInt(options.amount || '0')
})

// 格式化金额
const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00'
  return (Number(amount) / 100).toFixed(2)
}

// 表单数据
const form = ref({
  content: ''
})

// 加载状态
const submitting = ref(false)

// 是否可提交
const canSubmit = computed(() => {
  return form.value.content.trim().length >= 5 && !submitting.value
})

// 提交申诉
const handleSubmit = async () => {
  if (!canSubmit.value) {
    if (form.value.content.trim().length < 5) {
      uni.showToast({
        title: '申诉说明至少5个字',
        icon: 'none'
      })
    }
    return
  }

  // 校验扣款记录ID
  const deductionId = parseInt(recordId.value)
  if (!recordId.value || isNaN(deductionId)) {
    uni.showToast({
      title: '扣款记录ID无效',
      icon: 'none'
    })
    return
  }

  submitting.value = true
  try {
    await postDeductionAppeal({
      deductionId,
      appealContent: form.value.content.trim()
    })
    uni.showModal({
      title: '提交成功',
      content: '我们将在1-3个工作日内处理完成，请耐心等待',
      showCancel: false,
      success: () => {
        uni.navigateBack()
      }
    })
  } catch (err) {
    console.error('提交申诉失败', err)
    uni.showToast({
      title: err?.msg || '提交失败，请重试',
      icon: 'none'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.appeal-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  padding: 24rpx;
  padding-bottom: 160rpx;
}

/* 扣款信息卡片 */
.info-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f3f4f6;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
}

.card-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;

  &:not(:last-child) {
    border-bottom: 1rpx solid #f9fafb;
  }
}

.item-label {
  font-size: 28rpx;
  color: #6b7280;
}

.item-value {
  font-size: 28rpx;
  color: #1f2937;
  font-weight: 500;
  max-width: 400rpx;
  text-align: right;
  word-break: break-all;

  &.red {
    color: #ef4444;
  }
}

/* 表单卡片 */
.form-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.form-header {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 24rpx;
}

.form-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
}

.form-item {
  margin-bottom: 10rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #374151;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.form-textarea {
  width: 100%;
  min-height: 200rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: #1f2937;
  line-height: 1.6;
  box-sizing: border-box;
  border: 2rpx solid transparent;
  transition: all 0.2s;

  &:focus {
    background: #fff;
    border-color: #2f6bee;
  }
}

.char-count {
  text-align: right;
  font-size: 24rpx;
  color: #9ca3af;
  margin-top: 12rpx;
}

/* 提交按钮区域 */
.submit-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  color: #fff;
  border-radius: 24rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.3);
  transition: all 0.2s;

  &::after {
    border: none;
  }

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }

  &.disabled {
    background: #e5e7eb;
    color: #9ca3af;
    box-shadow: none;
  }
}
</style>
