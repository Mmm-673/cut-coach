<template>
  <view class="about-page">
    <!-- Logo区域 -->
    <view class="logo-section">
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <view class="app-name">球了么裁教端</view>
      <view class="version">v{{ version }}</view>
    </view>

    <!-- 信息列表 -->
    <view class="info-section">
      <view class="info-card">
        <view class="info-item" @click="copyAppName">
          <view class="item-left">
            <view class="icon-wrapper app-icon">
              <uni-icons type="chatbubble" size="18" color="#fff"></uni-icons>
            </view>
            <text class="item-label">应用名称</text>
          </view>
          <view class="item-right">
            <text class="item-value">球了么裁教端</text>
            <uni-icons type="right" size="14" color="#d1d5db"></uni-icons>
          </view>
        </view>
        <view class="info-item" @click="copyVersion">
          <view class="item-left">
            <view class="icon-wrapper version-icon">
              <uni-icons type="info" size="18" color="#fff"></uni-icons>
            </view>
            <text class="item-label">当前版本</text>
          </view>
          <view class="item-right">
            <text class="item-value">v{{ version }}</text>
            <uni-icons type="right" size="14" color="#d1d5db"></uni-icons>
          </view>
        </view>
        <view class="info-item">
          <view class="item-left">
            <view class="icon-wrapper website-icon">
              <uni-icons type="globe" size="18" color="#fff"></uni-icons>
            </view>
            <text class="item-label">官方网站</text>
          </view>
          <view class="item-right">
            <text class="item-value">-</text>
            <uni-icons type="right" size="14" color="#d1d5db"></uni-icons>
          </view>
        </view>
        <view class="info-item">
          <view class="item-left">
            <view class="icon-wrapper email-icon">
              <uni-icons type="email" size="18" color="#fff"></uni-icons>
            </view>
            <text class="item-label">联系邮箱</text>
          </view>
          <view class="item-right">
            <text class="item-value">-</text>
            <uni-icons type="right" size="14" color="#d1d5db"></uni-icons>
          </view>
        </view>
      </view>
    </view>

    <!-- 公司介绍 -->
    <view class="intro-section">
      <view class="intro-card">
        <view class="intro-header">
          <uni-icons type="heart" size="18" color="#2f6bee"></uni-icons>
          <text class="intro-title">关于我们</text>
        </view>
        <view class="intro-content">
          <text>球了么裁教端是面向台球专业教练、裁教从业者打造的服务平台。</text>
          <text>教练可以在线接收用户陪练预约订单，自主接单，管理服务日程，查看收益明细。</text>
          <text>平台提供统一合规的结算、订单管理与客服协作，助力台球从业者线上接单，</text>
          <text>灵活增收，高效开展台球教学陪练服务。</text>
        </view>
      </view>
    </view>

    <!-- 版权信息 -->
    <view class="copyright-section">
      <text class="copyright-text">Copyright © 2026 球了么 All Rights Reserved.</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useConfigStore } from '@/store'

const version = ref(useConfigStore().config.appInfo.version || '1.2.0')

const copyAppName = () => {
  uni.setClipboardData({
    data: '球了么裁教端',
    success: () => {
      uni.showToast({ title: '复制成功', icon: 'success' })
    }
  })
}

const copyVersion = () => {
  uni.setClipboardData({
    data: `v${version.value}`,
    success: () => {
      uni.showToast({ title: '复制成功', icon: 'success' })
    }
  })
}
</script>

<style lang="scss" scoped>
.about-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  padding: 40rpx 24rpx 60rpx;
}

/* Logo区域 */
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0 60rpx;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  border-radius: 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 28rpx;
}

.app-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12rpx;
}

.version {
  font-size: 26rpx;
  color: #9ca3af;
  font-weight: 500;
}

/* 信息列表 */
.info-section {
  margin-bottom: 24rpx;
}

.info-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 0;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f3f4f6;
  transition: background 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #f8fafc;
  }
}

.item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.icon-wrapper {
  width: 60rpx;
  height: 60rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &.app-icon {
    background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  }

  &.version-icon {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }

  &.website-icon {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  }

  &.email-icon {
    background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
  }
}

.item-label {
  font-size: 28rpx;
  color: #374151;
  font-weight: 500;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.item-value {
  font-size: 26rpx;
  color: #6b7280;
}

/* 公司介绍 */
.intro-section {
  margin-bottom: 40rpx;
}

.intro-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.intro-header {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 20rpx;
}

.intro-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
}

.intro-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;

  text {
    font-size: 26rpx;
    color: #6b7280;
    line-height: 1.8;
  }
}

/* 版权信息 */
.copyright-section {
  text-align: center;
  padding-top: 20rpx;
}

.copyright-text {
  font-size: 24rpx;
  color: #9ca3af;
}
</style>
