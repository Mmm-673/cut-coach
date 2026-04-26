<template>
  <view class="appeal-page">

    <!-- 扣款信息卡片 -->
    <view class="info-card">
      <view class="card-item">
        <text>扣款类型</text>
        <text class="text-dark">扣款申诉</text>
      </view>
      <view class="card-item">
        <text>扣款金额</text>
        <text class="text-red">¥{{ formatAmount(deductAmount) }}</text>
      </view>
      <view class="card-item">
        <text>订单编号</text>
        <text class="text-dark">{{ orderId || '-' }}</text>
      </view>
      <view class="card-item">
        <text>扣款原因</text>
        <text class="text-dark">{{ deductReason || '-' }}</text>
      </view>
    </view>

    <!-- 申诉表单 -->
    <view class="form-box">
      <view class="form-title">申诉信息</view>

      <!-- 申诉内容 -->
      <view class="form-item">
        <text class="label">申诉说明</text>
        <textarea
            v-model="form.content"
            class="textarea"
            placeholder="请详细描述申诉原因，越详细处理越快"
            max-length="200"
        />
        <view class="count">{{ form.content.length }}/200</view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="btn-box">
      <button
          class="submit-btn"
          :class="{ disabled: !canSubmit }"
          :loading="submitting"
          @click="handleSubmit"
      >
        提交申诉
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { postDeductionAppeal } from '@/api/billiard/wallet'

// 从URL获取参数
const recordId = ref('')
const orderId = ref('')
const deductReason = ref('')
const deductAmount = ref(0)

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options || {}
  recordId.value = options.recordId || ''
  orderId.value = options.orderId || ''
  deductReason.value = decodeURIComponent(options.reason || '')
  deductAmount.value = parseInt(options.amount || '0')
})

// 格式化金额
const formatAmount = (fen) => {
  return (fen / 100).toFixed(2)
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

// 返回
const handleBack = () => {
  uni.navigateBack()
}

// 提交申诉
const handleSubmit = async () => {
  if (!canSubmit.value) return

  // 校验长度
  if (form.value.content.length < 5) {
    uni.showToast({
      title: '申诉说明至少5个字',
      icon: 'none'
    })
    return
  }

  submitting.value = true
  try {
    await postDeductionAppeal({
      deductionId: parseInt(recordId.value),
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
    uni.showToast({ title: '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.appeal-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 120rpx;
}

/* 顶部导航 */
.page-header {
  background: #fff;
  height: 90rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-bottom: 1rpx solid #f0f0f0;
}
.back-btn {
  position: absolute;
  left: 30rpx;
  top: 50%;
  transform: translateY(-50%);
}
.title {
  font-size: 34rpx;
  font-weight: 500;
  color: #333;
}

/* 扣款信息卡片 */
.info-card {
  background: #fff;
  margin: 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}
.card-item {
  display: flex;
  justify-content: space-between;
  padding: 24rpx 0;
  font-size: 30rpx;
  color: #666;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}
.text-dark {
  color: #333;
  font-weight: 500;
}
.text-red {
  color: #ff3b30;
  font-weight: 500;
}

/* 表单 */
.form-box {
  background: #fff;
  margin: 0 30rpx 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}
.form-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 30rpx;
}
.form-item {
  margin-bottom: 40rpx;
}
.label {
  display: block;
  font-size: 30rpx;
  color: #333;
  margin-bottom: 20rpx;
}

/* 多行输入 */
.textarea {
  width: 100%;
  min-height: 240rpx;
  background: #f7f8fa;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 30rpx;
  box-sizing: border-box;
}
.count {
  text-align: right;
  font-size: 26rpx;
  color: #999;
  margin-top: 12rpx;
}

/* 上传 */
.upload-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}
.upload-item {
  width: 140rpx;
  height: 140rpx;
  position: relative;
}
.upload-img {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}
.del-btn {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upload-add {
  width: 140rpx;
  height: 140rpx;
  border-radius: 12rpx;
  background: #f7f8fa;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tip {
  font-size: 26rpx;
  color: #999;
  margin-top: 16rpx;
  display: block;
}

/* 提交按钮 */
.btn-box {
  padding: 0 30rpx;
  position: fixed;
  bottom: 40rpx;
  left: 0;
  right: 0;
}
.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #007aff;
  color: #fff;
  border-radius: 16rpx;
  font-size: 34rpx;
  border: none;

  &.disabled {
    background: #ccc;
    color: #fff;
  }
}
</style>