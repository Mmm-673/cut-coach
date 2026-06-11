<template>
  <view class="mine-container">
    <!-- 顶部用户信息栏 -->
    <view class="user-header">
      <view class="user-info">
        <image class="avatar" :src="coachProfile.avatar || '/static/images/default-avatar.png'" mode="aspectFill"></image>
        <view class="user-detail">
          <view class="user-name">
            <text class="name">{{ coachProfile.stageName || '助教' }}</text>
            <uni-tag :text="levelName" type="primary" size="small" :inverted="true"></uni-tag>
          </view>
        </view>
      </view>
    </view>

    <!-- 钱包模块 -->
    <view class="section-card">
      <view class="card-title">我的钱包</view>
      <view class="balance-wrap">
        <view class="balance-label">可提现余额</view>
        <view class="balance">¥{{ (walletInfo.balance / 100).toFixed(2) || '0.00' }}</view>
      </view>
      <view class="pending-audit" v-if="walletInfo.freezePrice > 0">
        <uni-icons type="wallet" size="16" color="#F59E0b"></uni-icons>
        <text>冻结金额：¥{{ (walletInfo.freezePrice / 100).toFixed(2) }}</text>
      </view>
      <button class="withdraw-btn" @click="handleWithdraw">去提现</button>
      <view class="wallet-links">
        <view class="link-item" @click="navToDeduct">
          <text>扣款明细</text>
          <uni-icons type="right" size="14" color="#999"></uni-icons>
        </view>
        <view class="link-divider"></view>
        <view class="link-item" @click="navToWithdrawRecord">
          <text>提现记录</text>
          <uni-icons type="right" size="14" color="#999"></uni-icons>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="section-card">
      <view class="menu-item" @click="navToInfo">
        <view class="menu-item-left">
          <view class="icon-box icon-orange">
            <uni-icons type="person" size="22" color="#fff"></uni-icons>
          </view>
          <view class="menu-text">个人信息</view>
        </view>
        <uni-icons type="right" size="18" color="#999"></uni-icons>
      </view>

      <view class="divider"></view>

      <view class="menu-item" @click="navToEvaluate">
        <view class="menu-item-left">
          <view class="icon-box icon-green">
            <uni-icons type="star" size="22" color="#fff"></uni-icons>
          </view>
          <view class="menu-text">我的评价</view>
        </view>
        <uni-icons type="right" size="18" color="#999"></uni-icons>
      </view>

      <view class="divider"></view>

      <view class="menu-item" @click="navToHelp">
        <view class="menu-item-left">
          <view class="icon-box icon-purple">
            <uni-icons type="help" size="22" color="#fff"></uni-icons>
          </view>
          <view class="menu-text">常见问题</view>
        </view>
        <uni-icons type="right" size="18" color="#999"></uni-icons>
      </view>

      <view class="divider"></view>

      <view class="menu-item" @click="navToQrcode">
        <view class="menu-item-left">
          <view class="icon-box icon-orange">
            <uni-icons type="scan" size="22" color="#fff"></uni-icons>
          </view>
          <view class="menu-text">我的二维码</view>
        </view>
        <uni-icons type="right" size="18" color="#999"></uni-icons>
      </view>

      <view class="divider"></view>

      <view class="menu-item" @click="navToAbout">
        <view class="menu-item-left">
          <view class="icon-box icon-cyan">
            <uni-icons type="info" size="22" color="#fff"></uni-icons>
          </view>
          <view class="menu-text">关于我们</view>
        </view>
        <uni-icons type="right" size="18" color="#999"></uni-icons>
      </view>

      <view class="divider"></view>

      <view class="menu-item" @click="handleLogout">
        <view class="menu-item-left">
          <view class="icon-box icon-gray">
            <uni-icons type="gear" size="22" color="#fff"></uni-icons>
          </view>
          <view class="menu-text">退出登录</view>
        </view>
        <uni-icons type="right" size="18" color="#999"></uni-icons>
      </view>
    </view>
  </view>
</template>

<script setup>
import {ref, computed, getCurrentInstance} from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCoachProfile } from '@/api/billiard/coach'
import { getWalletBalance } from '@/api/billiard/wallet'
import { useUserStore } from '@/store'


const { proxy } = getCurrentInstance()
// 教练档案
const coachProfile = ref({
  id: '',
  stageName: '',
  level: 0,
  mobile: '',
  avatar: '',
  introduction: '',
  commissionRate: 0
})

// 钱包信息
const walletInfo = ref({
  balance: 0,
  freezePrice: 0
})

// 级别映射
const levelNameMap = {
  0: '初级助教',
  1: '中级助教',
  2: '高级助教'
}

// 计算属性：级别名称
const levelName = computed(() => {
  return levelNameMap[coachProfile.value.level] || '普通助教'
})

// 获取教练档案
const fetchCoachProfile = async () => {
  try {
    const res = await getCoachProfile()
    console.log(res,'====roxy.$modal.msgError')
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
    if (res) {
      walletInfo.value = {
        balance: Number(res.data.balance) || 0,
        freezePrice: Number(res.data.freezePrice) || 0
      }
    }
  } catch (err) {
    console.error('获取钱包余额失败', err)
  }
}

const handleWithdraw = () => {
  if (!walletInfo.value.balance || walletInfo.value.balance <= 0) {
    uni.showToast({
      title: '余额不足，无法提现',
      icon: 'none'
    })
    return
  }

  uni.showModal({
    title: '提现',
    content: `当前可提现余额：¥${(walletInfo.value.balance / 100).toFixed(2)}`,
    success: (res) => {
      uni.navigateTo({ url: '/subpkg/mine/wallet/withdraw/index' })
    }
  })
}

const navToDeduct = () => {
  uni.navigateTo({ url: '/subpkg/mine/wallet/deduct/index' })
}

const navToWithdrawRecord = () => {
  uni.navigateTo({ url: '/subpkg/mine/wallet/withdraw-record/index' })
}

const navToOrder = () => {
  uni.switchTab({ url: '/pages/order/index' })
}

const navToInfo = () => {
  uni.navigateTo({ url: '/subpkg/mine/info/index' })
}

const navToEvaluate = () => {
  uni.navigateTo({ url: '/subpkg/mine/evaluate/index' })
}

const navToHelp = () => {
  uni.navigateTo({ url: '/subpkg/mine/help/index' })
}

const navToQrcode = () => {
  uni.navigateTo({ url: '/subpkg/mine/qrcode/index' })
}

const navToAbout = () => {
  uni.navigateTo({ url: '/subpkg/mine/about/index' })
}

const navToService = () => {
  uni.navigateTo({ url: '/subpkg/mine/service/index' })
}


const handleLogout = () => {
  proxy.$modal.confirm('确定注销并退出系统吗？').then(() => {
    useUserStore().logOut().then(() => {}).finally(()=>{
      proxy.$tab.reLaunch('/pages/login/index')
    })
  })
}
const navToSetting = () => {
  uni.navigateTo({ url: '/subpkg/mine/setting/index' })
}

onShow(() => {
  fetchCoachProfile()
  fetchWalletBalance()
})
</script>

<style lang="scss" scoped>
page {
  background: linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%);
}

.mine-container {
  min-height: 100vh;
  box-sizing: border-box;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

.user-header {
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  padding: 80rpx 40rpx 60rpx;
  padding-top: calc(80rpx + var(--status-bar-height));
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  margin-right: 28rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.2);
}

.user-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.name {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
}

.user-id {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.section-card {
  margin: 30rpx 40rpx 0;
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.balance-wrap {
  text-align: center;
  padding: 20rpx 0 30rpx;
}

.balance-label {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 10rpx;
}

.balance {
  font-size: 64rpx;
  font-weight: bold;
  color: #2f6bee;
  line-height: 1.2;
}

.pending-audit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  background: #fff7ed;
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  font-size: 26rpx;
  color: #f59e0b;
  margin-bottom: 30rpx;
}

.withdraw-btn {
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  color: #fff;
  border-radius: 20rpx;
  border: none;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.3);
  transition: transform 0.2s;
}

.withdraw-btn:active {
  transform: scale(0.97);
}

.wallet-links {
  display: flex;
  justify-content: space-between;
  padding-top: 28rpx;
  margin-top: 28rpx;
  border-top: 1rpx solid #f0f0f0;
}

.link-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  font-size: 26rpx;
  color: #666;
  padding: 10rpx 0;
  transition: opacity 0.2s;
}

.link-item:active {
  opacity: 0.7;
}

.link-divider {
  width: 1rpx;
  background: #f0f0f0;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36rpx 0;
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
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.icon-blue {
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
}

.icon-orange {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.icon-green {
  background: linear-gradient(135deg, #10b981 0%, #0da271 100%);
}

.icon-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.icon-cyan {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
}

.icon-pink {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
}

.icon-gray {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
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
</style>
