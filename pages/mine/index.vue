<template>
  <view class="my-page">
    <!-- 顶部用户信息栏 -->
    <view class="user-header">
      <view class="user-info">
        <image class="avatar" src="/static/avatar.jpg" mode="aspectFill"></image>
        <view class="user-detail">
          <view class="user-name">
            <text class="name">张助教</text>
            <text class="badge">金牌助教</text>
          </view>
          <view class="user-id">ID: 123456</view>
        </view>
      </view>
      <view class="edit-icon" @click="handleEdit">
        <uni-icons type="compose" size="20" color="#fff"></uni-icons>
      </view>
    </view>

    <!-- 钱包模块 -->
    <view class="wallet-card">
      <view class="wallet-title">我的钱包</view>
      <view class="balance-wrap">
        <view class="balance">¥2580.00</view>
        <view class="balance-tip">可提现余额</view>
      </view>
      <view class="pending-audit">
        待审核：¥500，预计3个工作日到账
      </view>
      <button class="withdraw-btn" @click="handleWithdraw">去提现</button>
      <view class="wallet-links">
        <view class="link-item" @click="navToDeduct">
          <text>扣款明细</text>
          <uni-icons type="right" size="14" color="#ccc"></uni-icons>
        </view>
        <view class="link-item" @click="navToWithdrawRecord">
          <text>提现记录</text>
          <uni-icons type="right" size="14" color="#ccc"></uni-icons>
        </view>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="func-list">
      <view class="func-item" @click="navToOrder">
        <view class="func-icon icon-blue">
          <uni-icons type="list" size="20" color="#007aff"></uni-icons>
        </view>
        <text class="func-name">我的订单</text>
        <uni-icons type="right" size="16" color="#ccc"></uni-icons>
      </view>

      <view class="func-item" @click="navToEvaluate">
        <view class="func-icon icon-green">
          <uni-icons type="star" size="20" color="#34c759"></uni-icons>
        </view>
        <text class="func-name">我的评价</text>
        <uni-icons type="right" size="16" color="#ccc"></uni-icons>
      </view>

      <view class="func-item" @click="navToBankCard">
        <view class="func-icon icon-orange">
          <uni-icons type="creditcard" size="20" color="#ff9500"></uni-icons>
        </view>
        <text class="func-name">银行卡管理</text>
        <uni-icons type="right" size="16" color="#ccc"></uni-icons>
      </view>

      <view class="func-item" @click="navToService">
        <view class="func-icon icon-purple">
          <uni-icons type="headphones" size="20" color="#af52de"></uni-icons>
        </view>
        <text class="func-name">客服中心</text>
        <uni-icons type="right" size="16" color="#ccc"></uni-icons>
      </view>

      <view class="func-item" @click="navToSetting">
        <view class="func-icon icon-lightblue">
          <uni-icons type="gear" size="20" color="#00aaff"></uni-icons>
        </view>
        <text class="func-name">设置</text>
        <uni-icons type="right" size="16" color="#ccc"></uni-icons>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
// 自动引入uni-icons（uni-app 3.x + Vue3 自动导入，无需手动import）

// 页面交互逻辑
const handleEdit = () => {
  uni.showToast({
    title: '编辑个人信息',
    icon: 'none'
  })
  // 实际开发中跳转到编辑页：uni.navigateTo({ url: '/pages/my/edit' })
}

const handleWithdraw = () => {


  uni.showModal({
    title: '提现',
    content: `当前可提现余额：¥2580.00`,
    success: (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '跳转提现页...' })
        setTimeout(() => {
          uni.hideLoading()
          // 实际开发中跳转到提现页
          uni.navigateTo({ url: '/pages/mine/wallet/withdraw/index' })
        }, 800)
      }
    }
  })
}

// 页面跳转逻辑
const navToDeduct = () => {
  uni.navigateTo({ url: '/pages/mine/wallet/deduct/index' })
}

const navToWithdrawRecord = () => {
  uni.navigateTo({ url: '/pages/mine/wallet/withdraw-record/index' })
}

const navToOrder = () => {
  uni.navigateTo({ url: '/pages/order/list' })
}

const navToEvaluate = () => {
  uni.navigateTo({ url: '/pages/mine/evaluate/index' })
}

const navToBankCard = () => {
  uni.navigateTo({ url: '/pages/wallet/bank-card' })
}

const navToService = () => {
  uni.navigateTo({ url: '/pages/service/index' })
}

const navToSetting = () => {
  uni.navigateTo({ url: '/pages/setting/index' })
}
</script>

<style scoped lang="scss">
.my-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 40rpx;
}

/* 顶部用户栏 */
.user-header {
  background-color: #66b3ff;
  padding: 40rpx 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 24rpx;
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.name {
  font-size: 40rpx;
  font-weight: bold;
}

.badge {
  background-color: rgba(255, 255, 255, 0.3);
  padding: 6rpx 20rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
}

.user-id {
  font-size: 30rpx;
  opacity: 0.9;
}

.edit-icon {
  font-size: 40rpx;
}

/* 钱包卡片 */
.wallet-card {
  background-color: #fff;
  margin: 30rpx;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
}

.wallet-title {
  font-size: 34rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 30rpx;
}

.balance-wrap {
  text-align: center;
  margin-bottom: 30rpx;
}

.balance {
  font-size: 80rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.2;
}

.balance-tip {
  font-size: 30rpx;
  color: #999;
  margin-top: 10rpx;
}

.pending-audit {
  background-color: #f7f8fa;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 30rpx;
  color: #666;
  margin-bottom: 30rpx;
}

.withdraw-btn {
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  background-color: #007aff;
  color: #fff;
  border-radius: 16rpx;
  border: none;
  font-size: 34rpx;
  font-weight: 500;
  margin-bottom: 30rpx;
}

.wallet-links {
  display: flex;
  justify-content: space-between;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 32rpx;
  color: #333;
}

/* 功能列表 */
.func-list {
  background-color: #fff;
  margin: 0 30rpx;
  border-radius: 20rpx;
  padding: 20rpx 0;
}

.func-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  gap: 20rpx;
}

.func-icon {
  width: 70rpx;
  height: 70rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-blue {
  background-color: #e6f0ff;
}

.icon-green {
  background-color: #e6ffe6;
}

.icon-orange {
  background-color: #fff2e6;
}

.icon-purple {
  background-color: #f3e6ff;
}

.icon-lightblue {
  background-color: #e6f7ff;
}

.func-name {
  flex: 1;
  font-size: 34rpx;
  color: #333;
}
</style>