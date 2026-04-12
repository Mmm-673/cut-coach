<template>
  <view class="withdraw-page">
    <!-- 可提现余额卡片 -->
    <view class="balance-card">
      <text class="card-label">可提现余额(元)</text>
      <text class="balance-amount">¥{{ usableBalance }}</text>
      <view class="all-withdraw-btn" @click="handleAllWithdraw">
        <text>全部提现</text>
        <uni-icons type="right" size="14" color="#007aff" />
      </view>
    </view>

    <!-- 提现金额输入（完美居中 + 不偏移 + 大字号） -->
    <view class="input-section">
      <text class="section-title">提现金额</text>
      <view class="input-wrap">
        <text class="currency">¥</text>
        <input
            v-model="withdrawAmount"
            type="digit"
            class="amount-input"
            placeholder="0.00"
            @input="handleAmountInput"
        />
      </view>
      <view class="input-tip-row">
        <text class="min-tip">单笔最低提现金额100元</text>
        <text class="quota-link" @click="showQuotaDesc">限额说明</text>
      </view>
    </view>

    <!-- 到账银行卡 -->
    <view class="bank-section" @click="chooseBank">
      <text class="section-title">到账银行卡</text>
      <view class="bank-info">
        <view class="bank-left">
          <view class="bank-icon-wrap">
            <uni-icons type="card" size="24" color="#007aff" />
          </view>
          <view class="bank-detail">
            <text class="bank-name">{{ bankCard }}</text>
            <text class="bank-arrive-tip">预计1-3个工作日到账</text>
          </view>
        </view>
        <uni-icons type="right" size="16" color="#ccc" />
      </view>
    </view>

    <!-- 费用明细 -->
    <view class="fee-section">
      <view class="fee-item">
        <text class="fee-label">提现手续费</text>
        <text class="fee-value">¥{{ serviceFee }}</text>
      </view>
      <view class="fee-item">
        <text class="fee-label">实际到账金额</text>
        <text class="actual-value">¥{{ actualAmount }}</text>
      </view>
    </view>

    <!-- 确认提现按钮 -->
    <view class="btn-area">
      <button
          class="confirm-btn"
          :class="{ disabled: !canWithdraw || submitting }"
          :loading="submitting"
          @click="handleConfirm"
      >
        确认提现
      </button>
    </view>

    <!-- 提现须知 -->
    <view class="notice-section">
      <text class="section-title">提现须知</text>
      <view class="notice-content">
        <text class="notice-item">· 单笔提现金额最低100元，最高50000元</text>
        <text class="notice-item">· 每日最多可发起3次提现申请</text>
        <text class="notice-item">· 提现申请提交后，预计1-3个工作日到账，遇节假日顺延</text>
        <text class="notice-item">· 每月前2笔提现免手续费，超出部分按0.3%收取手续费，最低2元</text>
      </view>
    </view>

    <!-- 最近提现记录 -->
    <view class="record-section">
      <view class="record-header">
        <text class="section-title">最近提现记录</text>
        <text class="view-all" @click="viewAllRecord">查看全部</text>
      </view>
      <view class="record-item" v-for="(item, index) in recentRecords" :key="index">
        <view class="record-left">
          <text class="record-desc">{{ item.desc }}</text>
          <text class="record-time">{{ item.time }}</text>
        </view>
        <view class="record-right">
          <text class="record-amount">-¥{{ item.amount }}</text>
          <text class="record-status">{{ item.status }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const usableBalance = ref('2580.00')
const withdrawAmount = ref('')
const serviceFee = ref('0.00')
const actualAmount = ref('0.00')
const bankCard = ref('招商银行(尾号8975)')
const submitting = ref(false)

const recentRecords = ref([
  { desc: '提现到招商银行', amount: '1500.00', status: '已到账', time: '2024-05-15 14:32:11' },
  { desc: '提现到招商银行', amount: '2000.00', status: '已到账', time: '2024-05-08 09:15:47' },
  { desc: '提现到招商银行', amount: '1800.00', status: '已到账', time: '2024-04-28 16:48:23' }
])

const canWithdraw = computed(() => {
  const amount = parseFloat(withdrawAmount.value || 0)
  const balance = parseFloat(usableBalance.value)
  return amount >= 100 && amount <= balance && !submitting.value
})

const handleBack = () => uni.navigateBack()

const handleAllWithdraw = () => {
  withdrawAmount.value = usableBalance.value
  calculateFee()
}

const handleAmountInput = (e) => {
  let value = e.detail.value.replace(/[^\d.]/g, '')
  const dotIndex = value.indexOf('.')
  if (dotIndex > -1) value = value.slice(0, dotIndex + 3)
  withdrawAmount.value = value
  calculateFee()
}

const calculateFee = () => {
  const amount = parseFloat(withdrawAmount.value || 0)
  if (amount < 100) {
    serviceFee.value = '0.00'
    actualAmount.value = '0.00'
    return
  }
  serviceFee.value = '0.00'
  actualAmount.value = amount.toFixed(2)
}

const chooseBank = () => uni.showToast({ title: '选择银行卡', icon: 'none' })
const showQuotaDesc = () => uni.showModal({ title: '限额说明', content: '单笔最低100元，最高50000元', showCancel: false })

const handleConfirm = () => {
  if (!canWithdraw.value) return uni.showToast({ title: '请输入有效金额', icon: 'none' })
  submitting.value = true
  setTimeout(() => {
    submitting.value = false
    uni.showModal({
      title: '提现申请成功',
      content: '预计1-3个工作日到账',
      showCancel: false,
      success: () => uni.navigateBack()
    })
  }, 1500)
}

const viewAllRecord = () => uni.navigateTo({ url: '/pages/wallet/withdraw-record' })
</script>

<style scoped lang="scss">
.withdraw-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 120rpx;
}

.header {
  height: 90rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #66b3ff;
  position: relative;
}
.back-icon {
  position: absolute;
  left: 30rpx;
  top: 50%;
  transform: translateY(-50%);
}
.title {
  font-size: 36rpx;
  font-weight: 500;
  color: #fff;
}

.balance-card {
  background-color: #fff;
  margin: 30rpx;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.card-label {
  font-size: 30rpx;
  color: #999;
  text-align: center;
}
.balance-amount {
  font-size: 80rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.2;
  text-align: center;
}
.all-withdraw-btn {
  align-self: flex-end;
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  background-color: #f0f7ff;
}
.all-withdraw-btn text {
  font-size: 28rpx;
  color: #007aff;
}

/* ====================================== */
/* 【完美修复】提现金额区域               */
/* ====================================== */
.input-section {
  background-color: #fff;
  margin: 0 30rpx 30rpx;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
}
.section-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 30rpx;
}
.input-wrap {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 20rpx;
}
.currency {
  font-size: 56rpx;
  color: #333;
  line-height: 1;
  margin-right: 12rpx;
}
.amount-input {
  font-size: 56rpx;
  color: #333;
  line-height: 1.2;
  padding: 0;
  border: none;
  outline: none;
  height: auto;
}
.amount-input::placeholder {
  font-size: 56rpx;
  color: #ccc;
  line-height: 1.2;
}
.input-tip-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.min-tip {
  font-size: 28rpx;
  color: #999;
}
.quota-link {
  font-size: 28rpx;
  color: #007aff;
}

.bank-section {
  background-color: #fff;
  margin: 0 30rpx 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}
.bank-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.bank-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.bank-icon-wrap {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  background-color: #e6f0ff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bank-detail {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.bank-name {
  font-size: 34rpx;
  color: #333;
  font-weight: 500;
}
.bank-arrive-tip {
  font-size: 28rpx;
  color: #999;
}

.fee-section {
  background-color: #fff;
  margin: 0 30rpx 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.fee-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.fee-label {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
}
.fee-value {
  font-size: 34rpx;
  color: #333;
  font-weight: 500;
}
.actual-value {
  font-size: 34rpx;
  color: #ff3b30;
  font-weight: 500;
}

.btn-area {
  position: fixed;
  bottom: 40rpx;
  left: 30rpx;
  right: 30rpx;
  z-index: 10;
}
.confirm-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background-color: #007aff;
  color: #fff;
  border-radius: 16rpx;
  font-size: 34rpx;
  border: none;
}
.confirm-btn.disabled {
  background-color: #ccc;
  color: #fff;
}

.notice-section {
  background-color: #fff;
  margin: 0 30rpx 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}
.notice-content {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.notice-item {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
}

.record-section {
  background-color: #fff;
  margin: 0 30rpx 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}
.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}
.view-all {
  font-size: 28rpx;
  color: #007aff;
}
.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.record-item:last-child {
  border-bottom: none;
}
.record-left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.record-desc {
  font-size: 30rpx;
  color: #333;
}
.record-time {
  font-size: 28rpx;
  color: #999;
}
.record-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}
.record-amount {
  font-size: 30rpx;
  color: #ff3b30;
  font-weight: 500;
}
.record-status {
  font-size: 28rpx;
  color: #00b578;
  font-weight: 500;
}
</style>