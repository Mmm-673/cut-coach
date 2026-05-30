<template>
  <view class="review-page">
    <!-- 顶部状态区域 -->
    <view class="header-section">
      <view class="status-badge">
        <uni-icons type="star" size="20" color="#fff"></uni-icons>
        <text class="badge-text">评价用户</text>
      </view>
      <view class="status-desc">
        <text class="main-text">请对本次教学进行评价</text>
        <text class="sub-text">您的评价将帮助我们提升服务质量</text>
      </view>
    </view>

    <!-- 订单信息卡片 -->
    <view class="card" v-if="orderInfo.orderId">
      <view class="card-title">订单信息</view>
      <view class="info-row">
        <text class="label">订单编号</text>
        <text class="value">{{ orderInfo.orderNo || '-' }}</text>
      </view>
      <view class="info-row">
        <text class="label">服务类型</text>
        <text class="value">{{ orderInfo.serviceType === 1 ? '台球陪练' : '陪游' }}</text>
      </view>
      <view class="info-row">
        <text class="label">教学时长</text>
        <text class="value">{{ orderInfo.serviceDuration ? `${orderInfo.serviceDuration}分钟` : '-' }}</text>
      </view>
    </view>

    <!-- 评分区域 -->
    <view class="card">
      <view class="card-title">综合评分</view>
      <view class="star-section">
        <view class="star-tip">请为用户评分</view>
        <view class="star-wrapper">
          <view
              v-for="(star, index) in 5"
              :key="index"
              class="star-item"
              @click="handleStarClick(index + 1)"
          >
            <uni-icons
                :type="index < rating ? 'star-filled' : 'star'"
                size="48"
                :color="index < rating ? '#ff9500' : '#d1d5db'"
            ></uni-icons>
          </view>
        </view>
        <view class="star-text">{{ getStarText(rating) }}</view>
      </view>
    </view>

    <!-- 评价内容区域 -->
    <view class="card">
      <view class="card-title">评价内容</view>
      <view class="textarea-wrapper">
        <textarea
            v-model="content"
            class="textarea"
            placeholder="请输入您对本次服务的评价（选填，最多512字）"
            :maxlength="512"
            :show-confirm-bar="true"
            :auto-height="true"
            :cursor-spacing="20"
            confirm-type="done"
        ></textarea>
        <view class="char-count">{{ content.length }}/512</view>
      </view>
    </view>

    <!-- 底部提交按钮 -->
    <view class="footer">
      <button
          class="btn-submit"
          :class="{ disabled: submitting || rating === 0 }"
          :disabled="submitting || rating === 0"
          @click="handleSubmit"
      >
        {{ submitting ? '提交中...' : '提交评价' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getOrderDetail } from '@/api/billiard/order'
import { createUserReview } from '@/api/billiard/coach'


// 订单信息
const orderId = ref(null)
const orderInfo = ref({})

// 评分和评价内容
const rating = ref(0)
const content = ref('')
const submitting = ref(false)

// 获取星级文本
const getStarText = (star) => {
  const texts = {
    1: '非常不满意',
    2: '不满意',
    3: '一般',
    4: '满意',
    5: '非常满意'
  }
  return texts[star] || ''
}

// 点击星级
const handleStarClick = (star) => {
  rating.value = star
}

// 获取订单详情
const fetchOrderDetail = async () => {
  if (!orderId.value) return

  try {
    const res = await getOrderDetail(orderId.value)
    if (res.data) {
      orderInfo.value = res.data
    }
  } catch (err) {
    console.error('获取订单详情失败', err)
    uni.showToast({ title: '获取订单详情失败', icon: 'none' })
  }
}

// 提交评价
const handleSubmit = async () => {
  if (rating.value === 0) {
    uni.showToast({ title: '请先选择评分', icon: 'none' })
    return
  }

  if (submitting.value) return

  submitting.value = true

  try {
    await createUserReview({
      orderId: orderId.value,
      star: rating.value,
      content: content.value.trim()
    })

    uni.showToast({ title: '评价提交成功', icon: 'success' })

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (err) {
    console.error('提交评价失败', err)
    uni.showToast({ title: err?.msg || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onLoad((options) => {
  orderId.value = options.orderId ? parseInt(options.orderId) : null

  if (orderId.value) {
    fetchOrderDetail()
  } else {
    uni.showToast({ title: '订单信息缺失', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})
</script>

<style lang="scss" scoped>
.review-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  padding-bottom: calc(180rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.header-section {
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  padding: 50rpx 32rpx;
  padding-top: calc(50rpx + var(--status-bar-height, 0px));
  text-align: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 32rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  margin-bottom: 24rpx;
}

.status-desc {
  display: flex;
  flex-direction: column;
  gap: 8rpx;

  .main-text {
    font-size: 34rpx;
    font-weight: bold;
    color: #fff;
  }

  .sub-text {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.85);
  }
}

.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin: 30rpx 24rpx 0;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .card-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 28rpx;
  }
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }

  .label {
    font-size: 28rpx;
    color: #6b7280;
  }

  .value {
    font-size: 28rpx;
    color: #374151;
    font-weight: 500;
  }
}

.star-section {
  text-align: center;
  padding: 20rpx 0;
}

.star-tip {
  font-size: 28rpx;
  color: #6b7280;
  margin-bottom: 24rpx;
}

.star-wrapper {
  display: flex;
  justify-content: center;
  gap: 24rpx;
  margin-bottom: 20rpx;
}

.star-item {
  transition: transform 0.2s;

  &:active {
    transform: scale(0.9);
  }
}

.star-text {
  font-size: 30rpx;
  color: #ff9500;
  font-weight: 500;
}

.textarea-wrapper {
  position: relative;
}

.textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 24rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #374151;
  line-height: 1.6;
  box-sizing: border-box;
  display: block;
}

.char-count {
  text-align: right;
  font-size: 24rpx;
  color: #9ca3af;
  margin-top: 12rpx;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f3f4f6;
  z-index: 99;
}

.btn-submit {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 20rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  color: #fff;
  box-shadow: 0 8rpx 20rpx rgba(47, 107, 238, 0.3);
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;

  &:active:not(.disabled) {
    transform: scale(0.98);
    box-shadow: 0 2rpx 8rpx rgba(47, 107, 238, 0.06);
  }

  &::after {
    border: none;
  }

  &.disabled {
    opacity: 0.5;
  }
}
</style>