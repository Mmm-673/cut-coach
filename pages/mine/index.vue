<template>
  <view class="my-page">
    <!-- 顶部用户信息栏 -->
    <view class="user-header">
      <view class="user-info">
        <image class="avatar" :src="coachProfile.avatar || '/static/avatar.jpg'" mode="aspectFill"></image>
        <view class="user-detail">
          <view class="user-name">
            <text class="name">{{ coachProfile.stageName || '助教' }}</text>
            <uni-tag :text="levelName" type="primary" size="small" :inverted="true" />
          </view>
          <view class="user-id">ID: {{ coachProfile.id || '-' }}</view>
        </view>
      </view>
      <view class="edit-icon" @click="handleEdit">
        <uni-icons type="compose" size="20" color="#fff"></uni-icons>
      </view>
    </view>

    <!-- 钱包模块 -->
    <uni-card :is-shadow="true" :border="false" class="wallet-card">
      <view class="wallet-title">我的钱包</view>
      <view class="balance-wrap">
        <view class="balance">¥{{ (walletInfo.balance / 100).toFixed(2) || '0.00' }}</view>
        <view class="balance-tip">可提现余额</view>
      </view>
      <view class="pending-audit" v-if="walletInfo.freezePrice > 0">
        <uni-icons type="wallet" size="16" color="#F59E0B"></uni-icons>
        <text>冻结金额：¥{{ (walletInfo.freezePrice / 100).toFixed(2) }}</text>
      </view>
      <button class="withdraw-btn" @click="handleWithdraw">去提现</button>
      <view class="wallet-links">
        <view class="link-item" @click="navToDeduct">
          <text>扣款明细</text>
          <uni-icons type="right" size="14" color="$text-tertiary"></uni-icons>
        </view>
        <view class="link-item" @click="navToWithdrawRecord">
          <text>提现记录</text>
          <uni-icons type="right" size="14" color="$text-tertiary"></uni-icons>
        </view>
      </view>
    </uni-card>

    <!-- 功能列表 -->
    <uni-card :is-shadow="true" :border="false" class="func-card">
      <view class="func-item" @click="navToOrder">
        <view class="func-icon icon-blue">
          <uni-icons type="list" size="20" color="#2F6BEE"></uni-icons>
        </view>
        <text class="func-name">我的订单</text>
        <uni-icons type="right" size="16" color="$text-tertiary"></uni-icons>
      </view>
      <view class="func-item" @click="navToEvaluate">
        <view class="func-icon icon-green">
          <uni-icons type="star" size="20" color="#10B981"></uni-icons>
        </view>
        <text class="func-name">我的评价</text>
        <uni-icons type="right" size="16" color="$text-tertiary"></uni-icons>
      </view>
      <view class="func-item" @click="navToBankCard">
        <view class="func-icon icon-orange">
          <uni-icons type="creditcard" size="20" color="#F59E0B"></uni-icons>
        </view>
        <text class="func-name">银行卡管理</text>
        <uni-icons type="right" size="16" color="$text-tertiary"></uni-icons>
      </view>
      <view class="func-item" @click="navToService">
        <view class="func-icon icon-purple">
          <uni-icons type="headphones" size="20" color="#8B5CF6"></uni-icons>
        </view>
        <text class="func-name">客服中心</text>
        <uni-icons type="right" size="16" color="$text-tertiary"></uni-icons>
      </view>
      <view class="func-item" @click="navToSetting">
        <view class="func-icon icon-lightblue">
          <uni-icons type="gear" size="20" color="#00A6E3"></uni-icons>
        </view>
        <text class="func-name">设置</text>
        <uni-icons type="right" size="16" color="$text-tertiary"></uni-icons>
      </view>
    </uni-card>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getCoachProfile } from '@/api/billiard/coach'
import { getWalletBalance } from '@/api/billiard/wallet'

// 教练档案
const coachProfile = ref({
  id: '',
  stageName: '',      // 艺名
  level: 0,          // 助教级别 0/1/2
  mobile: '',         // 手机号
  avatar: '',         // 头像
  introduction: '',   // 简介
  commissionRate: 0   // 扣佣比例
})

// 钱包信息
const walletInfo = ref({
  balance: 0,         // 可提现余额（分）
  freezePrice: 0     // 冻结金额（分）
})

// 级别映射
const levelNameMap = {
  0: '普通助教',
  1: '高级助教',
  2: '金牌助教'
}

// 计算属性：级别名称
const levelName = computed(() => {
  return levelNameMap[coachProfile.value.level] || '普通助教'
})

// 获取教练档案
const fetchCoachProfile = async () => {
  try {
    const res = await getCoachProfile()
    if (res.data) {
      coachProfile.value = {
        id: res.data.id || '',
        stageName: res.data.stageName || res.data.name || '助教',
        level: res.data.level ?? 0,
        mobile: res.data.mobile || '',
        avatar: res.data.avatar || '',
        introduction: res.data.introduction || '',
        commissionRate: res.data.commissionRate || 0
      }
    }
  } catch (err) {
    console.error('获取教练档案失败', err)
  }
}

// 获取钱包余额
const fetchWalletBalance = async () => {
  try {
    const res = await getWalletBalance()
    if (res.data) {
      walletInfo.value = {
        balance: res.data.balance ?? 0,
        freezePrice: res.data.freezePrice ?? 0
      }
    }
  } catch (err) {
    console.error('获取钱包余额失败', err)
  }
}

const handleEdit = () => {
  uni.showToast({
    title: '编辑个人信息',
    icon: 'none'
  })
}

const handleWithdraw = () => {
  uni.showModal({
    title: '提现',
    content: `当前可提现余额：¥${(walletInfo.balance / 100).toFixed(2)}`,
    success: (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '跳转提现页...' })
        setTimeout(() => {
          uni.hideLoading()
          uni.navigateTo({ url: '/pages/mine/wallet/withdraw/index' })
        }, 800)
      }
    }
  })
}

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

onMounted(() => {
  fetchCoachProfile()
  fetchWalletBalance()
})
</script>

<style lang="scss" scoped>
:deep(.uni-card) {
  margin: 0 32rpx 24rpx !important;
  border-radius: $radius-xl !important;
  box-shadow: $shadow-base;
}
:deep(.uni-card .uni-card__content) {
  padding: 0 !important;
}

.my-page {
  min-height: 100vh;
  background: $bg-page;
  padding-top: 32rpx;
  padding-bottom: 40rpx;
}

/* 顶部用户栏 */
.user-header {
  background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
  padding: 48rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.name {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.user-id {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.edit-icon {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

/* 钱包卡片 */
.wallet-card {
  :deep(.uni-card__content) {
    padding: 32rpx !important;
  }
}

.wallet-title {
  font-size: 30rpx;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: 24rpx;
}

.balance-wrap {
  text-align: center;
  margin-bottom: 24rpx;
}

.balance {
  font-size: 72rpx;
  font-weight: bold;
  color: $primary;
  line-height: 1.2;
}

.balance-tip {
  font-size: 26rpx;
  color: $text-tertiary;
  margin-top: 8rpx;
}

.pending-audit {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: $warning-light;
  border-radius: $radius-base;
  padding: 20rpx 24rpx;
  font-size: 26rpx;
  color: $warning;
  margin-bottom: 24rpx;
}

.withdraw-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
  color: #fff;
  border-radius: $radius-base;
  border: none;
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
  transition: transform $duration-fast;
  &:active {
    transform: scale(0.98);
  }
}

.wallet-links {
  display: flex;
  justify-content: space-between;
  padding-top: 24rpx;
  border-top: 1rpx solid $border-light;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 28rpx;
  color: $text-secondary;
  &:active {
    opacity: 0.7;
  }
}

/* 功能列表 */
.func-card {
  :deep(.uni-card__content) {
    padding: 0 !important;
  }
}

.func-list {
  background-color: #fff;
  margin: 0 32rpx;
  border-radius: $radius-xl;
  overflow: hidden;
}

.func-item {
  display: flex;
  align-items: center;
  padding: 32rpx;
  gap: 20rpx;
  background: $bg-card;
  transition: background $duration-fast;
  &:active {
    background: $bg-page;
  }
  &:not(:last-child) {
    border-bottom: 1rpx solid $border-light;
  }
}

.func-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: $radius-base;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-blue {
  background: #EFF6FF;
}

.icon-green {
  background: #ECFDF5;
}

.icon-orange {
  background: #FFF7ED;
}

.icon-purple {
  background: #F5F3FF;
}

.icon-lightblue {
  background: #E0F2FE;
}

.func-name {
  flex: 1;
  font-size: 30rpx;
  color: $text-primary;
}
</style>
