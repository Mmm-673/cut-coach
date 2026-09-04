<template>
  <view class="setting-container">
    <view class="header-section">
      <view class="title">设置</view>
    </view>

    <view class="menu-section">
      <view class="menu-card">
        <view class="menu-item" @click="handleToPwd">
          <view class="menu-item-left">
            <view class="icon-box icon-blue">
              <view class="iconfont icon-password"></view>
            </view>
            <view class="menu-text">修改密码</view>
          </view>
          <uni-icons type="right" size="18" :color="textTertiaryColor"></uni-icons>
        </view>

        <view class="divider"></view>
      </view>
    </view>

    <view class="action-btn">
      <button @click="handleLogout" class="logout-btn cu-btn block bg-red lg round">
        退出登录
      </button>
    </view>
  </view>
</template>

<script setup>
import { getCurrentInstance } from 'vue'
import { useUserStore } from '@/store'
import { usePageTheme, useThemeColor } from '@/utils/theme'

// 页面主题初始化
usePageTheme()

const textTertiaryColor = useThemeColor('textTertiary')

const { proxy } = getCurrentInstance()

function handleToPwd() {
  proxy.$tab.navigateTo('/subpkg/mine/pwd/index')
}

function handleLogout() {
  proxy.$modal.confirm('确定注销并退出系统吗？').then(() => {
    useUserStore().logOut().then(() => {}).finally(()=>{
      proxy.$tab.reLaunch('/pages/login/index')
    })
  })
}


</script>

<style lang="scss" scoped>
page {
  background: var(--bg-page-gradient, linear-gradient(180deg, var(--bg-page, #F8FBFF) 0%, #FFFFFF 100%));
}

.setting-container {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 0rpx 40rpx;
  padding-top: calc(48rpx + var(--status-bar-height));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

.header-section {
  margin-bottom: 60rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: var(--text-primary, #333);
  margin-bottom: 12rpx;
}

.subtitle {
  font-size: 28rpx;
  color: var(--text-tertiary, #999);
}

.menu-section {
  margin-bottom: 40rpx;
}

.menu-card {
  background: var(--bg-card, #fff);
  border-radius: 24rpx;
  padding: 0 30rpx;
  box-shadow: 0 2rpx 12rpx var(--shadow-card, rgba(0, 0, 0, 0.05));
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 0;
  transition: opacity 0.2s;
}

.menu-item:active {
  opacity: 0.7;
}

.menu-item-left {
  display: flex;
  align-items: center;
}

.icon-box {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.icon-box .iconfont {
  font-size: 40rpx;
  color: #fff;
}

.icon-blue {
  background: var(--gradient-primary, linear-gradient(135deg, var(--color-primary, #2f6bee) 0%, var(--color-primary-dark, #1a50d9) 100%));
}

.icon-green {
  background: linear-gradient(135deg, var(--color-success, #10b981) 0%, var(--color-green-dark, #0da271) 100%);
}

.icon-orange {
  background: linear-gradient(135deg, var(--color-warning, #f59e0b) 0%, var(--color-orange-dark, #d97706) 100%);
}

.menu-text {
  font-size: 30rpx;
  color: var(--text-primary, #333);
  font-weight: 500;
}

.divider {
  height: 1rpx;
  background: var(--border-light, #f0f0f0);
  margin: 0;
}

.action-btn {
  margin-top: 40rpx;
}

.logout-btn {
  height: 100rpx;
  background: linear-gradient(135deg, var(--color-danger, #ef4444) 0%, var(--color-red-dark, #dc2626) 100%) !important;
  border-radius: 24rpx;
  font-size: 32rpx;
  color: #fff;
  border: none;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.25);
  transition: transform 0.2s, box-shadow 0.2s;
}

.logout-btn:active {
  transform: scale(0.97);
}
</style>
