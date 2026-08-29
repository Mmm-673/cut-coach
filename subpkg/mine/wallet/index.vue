<template>
  <view class="wallet-page">
    <!-- 顶部余额卡片 -->
    <view class="balance-card">
      <view class="card-label">可提现余额</view>
      <view class="balance-amount">¥{{ formatAmount(balance) }}</view>
      <view class="frozen-info" v-if="frozen > 0">
        <text class="frozen-label">冻结金额：</text>
        <text class="frozen-amount">¥{{ formatAmount(frozen) }}</text>
      </view>
    </view>

    <!-- 快捷操作区域 -->
    <view class="action-section">
      <view class="action-item" @click="goWithdraw">
        <view class="action-icon withdraw-icon">
          <uni-icons type="redo" size="32" color="#fff"></uni-icons>
        </view>
        <text class="action-label">申请提现</text>
      </view>
      <view class="action-item" @click="goWithdrawRecord">
        <view class="action-icon record-icon">
          <uni-icons type="list" size="32" color="#fff"></uni-icons>
        </view>
        <text class="action-label">提现记录</text>
      </view>
      <view class="action-item" @click="goDeduction">
        <view class="action-icon deduct-icon">
          <uni-icons type="info" size="32" color="#fff"></uni-icons>
        </view>
        <text class="action-label">扣款记录</text>
      </view>
      <view class="action-item" @click="goRewardRecord">
        <view class="action-icon reward-icon">
          <uni-icons type="heart-filled" size="32" color="#fff"></uni-icons>
        </view>
        <text class="action-label">打赏记录</text>
      </view>
    </view>

    <!-- 最近记录预览 -->
    <view class="recent-section" v-if="recentRecords.length > 0">
      <view class="section-header">
        <text class="section-title">最近记录</text>
        <text class="see-more" @click="goWithdrawRecord">查看全部</text>
      </view>
      <view class="record-list">
        <view class="record-item" v-for="item in recentRecords" :key="item.id">
          <view class="record-left">
            <view class="record-type">{{ getAccountTypeText(item.accountType) }}</view>
            <view class="record-time">{{ formatTime(item.applyTime) }}</view>
          </view>
          <view class="record-right">
            <view class="record-amount">-¥{{ formatAmount(item.withdrawAmount) }}</view>
            <view class="record-status" :class="getStatusClass(item.status)">
              {{ getStatusText(item.status) }}
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="!loading && recentRecords.length === 0">
      <uni-icons type="list" size="64" color="#d1d5db"></uni-icons>
      <text class="empty-text">暂无记录</text>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getWalletBalance, getWithdrawalPage } from '@/api/billiard/wallet'

const balance = ref(0)
const frozen = ref(0)
const recentRecords = ref([])
const loading = ref(false)

const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00'
  return (Number(amount) / 100).toFixed(2)
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getAccountTypeText = (type) => {
  const map = { 1: '微信', 2: '支付宝' }
  return map[type] || '银行卡'
}

const statusTextMap = {
  0: '申请中',
  1: '处理中',
  2: '已到账',
  3: '已拒绝'
}

const statusClassMap = {
  0: 'pending',
  1: 'processing',
  2: 'success',
  3: 'rejected'
}

const getStatusText = (status) => {
  return statusTextMap[status] || '未知'
}

const getStatusClass = (status) => {
  return statusClassMap[status] || ''
}

const fetchWalletData = async () => {
  loading.value = true
  try {
    const [balanceRes, recordRes] = await Promise.all([
      getWalletBalance(),
      getWithdrawalPage({ pageNo: 1, pageSize: 5 })
    ])

    if (balanceRes && balanceRes.data) {
      balance.value = balanceRes.data.balance || 0
      frozen.value = balanceRes.data.frozen || 0
    }

    if (recordRes && recordRes.data && recordRes.data.list) {
      recentRecords.value = recordRes.data.list
    }
  } catch (err) {
    console.error('获取钱包数据失败', err)
  } finally {
    loading.value = false
  }
}

const goWithdraw = () => {
  uni.navigateTo({ url: '/subpkg/mine/wallet/withdraw/index' })
}

const goWithdrawRecord = () => {
  uni.navigateTo({ url: '/subpkg/mine/wallet/withdraw-record/index' })
}

const goDeduction = () => {
  uni.navigateTo({ url: '/subpkg/mine/wallet/deduct/index' })
}

const goRewardRecord = () => {
  uni.navigateTo({ url: '/subpkg/mine/wallet/reward-record/index' })
}

onShow(() => {
  fetchWalletData()
})

onMounted(() => {
  fetchWalletData()
})
</script>

<style lang="scss" scoped>
.wallet-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  padding: 30rpx;
}

/* 余额卡片 */
.balance-card {
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(47, 107, 238, 0.25);
}

.card-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 16rpx;
}

.balance-amount {
  font-size: 72rpx;
  font-weight: bold;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 20rpx;
}

.frozen-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
}

.frozen-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.frozen-amount {
  font-size: 28rpx;
  color: #fcd34d;
  font-weight: 500;
}

/* 快捷操作 */
.action-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx 30rpx;
  margin-bottom: 30rpx;
  display: flex;
  justify-content: space-around;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.action-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;

  &:active {
    transform: scale(0.95);
  }
}

.withdraw-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.record-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.deduct-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.reward-icon {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
}

.action-label {
  font-size: 26rpx;
  color: #374151;
  font-weight: 500;
}

/* 最近记录 */
.recent-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
}

.see-more {
  font-size: 26rpx;
  color: #2f6bee;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
}

.record-left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.record-type {
  font-size: 30rpx;
  color: #1f2937;
  font-weight: 500;
}

.record-time {
  font-size: 24rpx;
  color: #9ca3af;
}

.record-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.record-amount {
  font-size: 32rpx;
  font-weight: bold;
  color: #ef4444;
}

.record-status {
  font-size: 24rpx;

  &.pending {
    color: #f59e0b;
  }

  &.processing {
    color: #2f6bee;
  }

  &.success {
    color: #10b981;
  }

  &.rejected {
    color: #ef4444;
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
  gap: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #9ca3af;
}

/* 加载状态 */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  font-size: 28rpx;
  color: #9ca3af;
}
</style>
