<template>
  <view class="service-page">
    <!-- 头部 -->
    <view class="header-section">
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <view class="title">客服中心</view>
      <view class="subtitle">如有问题，请联系我们</view>
    </view>

    <!-- 企业微信二维码 -->
    <view class="qr-section">
      <view class="qr-card">
        <view class="qr-box">
          <image
            class="qr-image"
            src="/static/images/service-qrcode.png"
            mode="aspectFit"
            @error="onQrError"
          ></image>
          <view class="qr-placeholder" v-if="showQrPlaceholder">
            <uni-icons type="qr-scan" size="80" color="#ccc"></uni-icons>
            <view class="placeholder-text">企业微信二维码</view>
          </view>
        </view>
        <view class="qr-tip">长按识别添加企业微信</view>
      </view>
    </view>

    <!-- 微信号 -->
    <view class="wechat-section">
      <view class="wechat-card">
        <view class="wechat-label">微信号</view>
        <view class="wechat-box">
          <text class="wechat-id">{{ wechatId }}</text>
          <view class="copy-btn" @click="copyWechatId">
            <uni-icons type="copy" size="18" color="#fff"></uni-icons>
            <text>复制</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 工作时间 -->
    <view class="time-section">
      <view class="time-card">
        <view class="time-icon">
          <uni-icons type="clock" size="24" color="#fff"></uni-icons>
        </view>
        <view class="time-content">
          <view class="time-label">客服工作时间</view>
          <view class="time-value">周一至周日 9:00-21:00</view>
        </view>
      </view>
    </view>

    <!-- 常见问题 -->
    <view class="faq-section">
      <view class="section-header">
        <uni-icons type="help" size="20" color="#2f6bee"></uni-icons>
        <text class="section-title">常见问题</text>
      </view>
      <view class="faq-list">
        <view class="faq-item" v-for="(item, index) in faqList" :key="index" @click="goFaq">
          <view class="faq-icon" :style="{ background: item.bgColor }">
            <uni-icons :type="item.icon" size="18" :color="item.iconColor"></uni-icons>
          </view>
          <view class="faq-text">{{ item.title }}</view>
          <uni-icons type="right" size="16" color="#d1d5db"></uni-icons>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const wechatId = ref('qiuleme_coach')
const showQrPlaceholder = ref(true)

const faqList = ref([
  {
    title: '如何提现？',
    icon: 'wallet',
    bgColor: 'linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%)',
    iconColor: '#fff'
  },
  {
    title: '如何修改接单设置？',
    icon: 'gear',
    bgColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    iconColor: '#fff'
  },
  {
    title: '订单问题反馈',
    icon: 'chatbubble',
    bgColor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    iconColor: '#fff'
  }
])

const copyWechatId = () => {
  uni.setClipboardData({
    data: wechatId.value,
    success: () => {
      uni.showToast({
        title: '复制成功',
        icon: 'success'
      })
    }
  })
}

const onQrError = () => {
  showQrPlaceholder.value = true
}

const goFaq = () => {
  uni.navigateTo({ url: '/pages/mine/help/index' })
}
</script>

<style lang="scss" scoped>
.service-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  padding: 30rpx 24rpx 60rpx;
}

.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0 50rpx;
}

.logo {
  width: 140rpx;
  height: 140rpx;
  border-radius: 36rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1f2937;
  margin-top: 28rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #9ca3af;
  margin-top: 12rpx;
}

.qr-section {
  margin-bottom: 24rpx;
}

.qr-card {
  background: #fff;
  border-radius: 28rpx;
  padding: 50rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.qr-box {
  width: 400rpx;
  height: 400rpx;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border: 2rpx dashed #e5e7eb;
}

.qr-image {
  width: 100%;
  height: 100%;
}

.qr-placeholder {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.placeholder-text {
  font-size: 28rpx;
  color: #9ca3af;
}

.qr-tip {
  font-size: 26rpx;
  color: #6b7280;
  margin-top: 28rpx;
}

.wechat-section {
  margin-bottom: 24rpx;
}

.wechat-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.wechat-label {
  font-size: 26rpx;
  color: #9ca3af;
  margin-bottom: 20rpx;
}

.wechat-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 24rpx;
  background: linear-gradient(135deg, #f8fbff 0%, #f1f5f9 100%);
  border-radius: 18rpx;
  border: 1rpx solid #e5e7eb;
}

.wechat-id {
  font-size: 32rpx;
  color: #1f2937;
  font-weight: 600;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 14rpx 28rpx;
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  border-radius: 40rpx;
  font-size: 26rpx;
  color: #fff;
  font-weight: 500;
  box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.25);
}

.time-section {
  margin-bottom: 24rpx;
}

.time-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.time-icon {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.2);
}

.time-content {
  flex: 1;
}

.time-label {
  font-size: 26rpx;
  color: #9ca3af;
  margin-bottom: 8rpx;
}

.time-value {
  font-size: 30rpx;
  color: #374151;
  font-weight: 600;
}

.faq-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.faq-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f3f4f6;
  transition: background 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #f8fafc;
    margin: 0 -32rpx;
    padding: 28rpx 32rpx;
  }
}

.faq-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.faq-text {
  flex: 1;
  font-size: 30rpx;
  color: #374151;
  font-weight: 500;
}
</style>
