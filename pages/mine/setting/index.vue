<template>
  <view class="setting-container">
    <view class="header-section">
      <view class="title">设置</view>
      <view class="subtitle">管理您的账户和偏好</view>
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
          <uni-icons type="right" size="18" color="#999"></uni-icons>
        </view>

        <view class="divider"></view>

        <view class="menu-item" @click="handleToUpgrade">
          <view class="menu-item-left">
            <view class="icon-box icon-green">
              <view class="iconfont icon-refresh"></view>
            </view>
            <view class="menu-text">检查更新</view>
          </view>
          <uni-icons type="right" size="18" color="#999"></uni-icons>
        </view>

        <view class="divider"></view>

        <view class="menu-item" @click="handleCleanTmp">
          <view class="menu-item-left">
            <view class="icon-box icon-orange">
              <view class="iconfont icon-clean"></view>
            </view>
            <view class="menu-text">清理缓存</view>
          </view>
          <uni-icons type="right" size="18" color="#999"></uni-icons>
        </view>
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
import { useUserStore } from '@/store'
import { getCurrentInstance } from "vue"

const { proxy } = getCurrentInstance()

function handleToPwd() {
  proxy.$tab.navigateTo('/pages/mine/pwd/index')
}

function handleToUpgrade() {
  proxy.$modal.showToast('模块建设中~')
}

function handleCleanTmp() {
  proxy.$modal.showToast('模块建设中~')
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
  background: linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%);
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
  color: #333;
  margin-bottom: 12rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #999;
}

.menu-section {
  margin-bottom: 40rpx;
}

.menu-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 0 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
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
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
}

.icon-green {
  background: linear-gradient(135deg, #10b981 0%, #0da271 100%);
}

.icon-orange {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.menu-text {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.divider {
  height: 1rpx;
  background: #f0f0f0;
  margin: 0;
}

.action-btn {
  margin-top: 40rpx;
}

.logout-btn {
  height: 100rpx;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
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
