<template>
  <view class="withdraw-record-page">
    <!-- 顶部统计栏 -->
    <view class="stats-header">
      <view class="stats-row">
        <view class="stats-item">
          <view class="stats-value green">¥5,280.00</view>
          <view class="stats-label">累计提现</view>
        </view>
        <view class="stats-divider"></view>
        <view class="stats-item">
          <view class="stats-value orange">¥500.00</view>
          <view class="stats-label">提现中</view>
        </view>
        <view class="stats-divider"></view>
        <view class="stats-item">
          <view class="stats-value blue">12</view>
          <view class="stats-label">提现次数</view>
        </view>
      </view>
    </view>

    <!-- 标签栏 -->
    <view class="tab-bar">
      <view
          v-for="tab in tabList"
          :key="tab.value"
          class="tab-item"
          :class="{ active: activeTab === tab.value }"
          @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 提现记录列表 -->
    <scroll-view
        scroll-y
        class="record-list"
        @scrolltolower="handleLoadMore"
    >
      <!-- 2026年3月 -->
      <view class="month-group">
        <view class="month-title">2026年3月</view>
        <view
            v-for="item in marchList"
            :key="item.id"
            class="record-item"
        >
          <view class="item-left">
            <view class="status-tag" :class="item.status">
              {{ item.statusText }}
            </view>
            <view class="item-title">提现到银行卡</view>
            <view class="bank-info">{{ item.bankInfo }}</view>
            <view class="create-time">{{ item.createTime }}</view>
          </view>
          <view class="item-right">
            <view class="amount">¥{{ item.amount }}</view>
            <view class="arrive-time" :class="item.status">
              {{ item.arriveTimeText }}
            </view>
          </view>
        </view>
      </view>

      <!-- 2026年2月 -->
      <view class="month-group">
        <view class="month-title">2026年2月</view>
        <view
            v-for="item in febList"
            :key="item.id"
            class="record-item"
        >
          <view class="item-left">
            <view class="status-tag" :class="item.status">
              {{ item.statusText }}
            </view>
            <view class="item-title">提现到银行卡</view>
            <view class="bank-info">{{ item.bankInfo }}</view>
            <view class="create-time">{{ item.createTime }}</view>
          </view>
          <view class="item-right">
            <view class="amount">¥{{ item.amount }}</view>
            <view class="arrive-time" :class="item.status">
              {{ item.arriveTimeText }}
            </view>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading">加载中...</view>
      <view v-if="!loading && hasMore" class="load-more">上拉加载更多</view>
      <view v-if="!hasMore" class="no-more">已经到底啦~</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

// 标签栏数据
const tabList = reactive([
  { label: '全部', value: 'all' },
  { label: '审核中', value: 'pending' },
  { label: '已到账', value: 'success' },
  { label: '已失败', value: 'fail' }
])
const activeTab = ref('all')

// 提现记录数据（模拟接口数据）
const allRecordList = reactive([
  // 3月数据
  {
    id: 1,
    status: 'pending',
    statusText: '审核中',
    amount: '500.00',
    bankInfo: '招商银行(尾号8888)',
    createTime: '2026-03-21 15:30:45',
    arriveTimeText: '预计3个工作日到账',
    month: '2026年3月'
  },
  {
    id: 2,
    status: 'success',
    statusText: '已到账',
    amount: '1,280.00',
    bankInfo: '招商银行(尾号8888)',
    createTime: '2026-03-15 10:20:16',
    arriveTimeText: '2026-03-17 14:30:00到账',
    month: '2026年3月'
  },
  // 2月数据
  {
    id: 3,
    status: 'success',
    statusText: '已到账',
    amount: '3,500.00',
    bankInfo: '招商银行(尾号8888)',
    createTime: '2026-02-29 16:45:32',
    arriveTimeText: '2026-03-03 09:15:00到账',
    month: '2026年2月'
  }
])

// 按月份分组数据
const marchList = computed(() => allRecordList.filter(item => item.month === '2026年3月'))
const febList = computed(() => allRecordList.filter(item => item.month === '2026年2月'))

// 分页加载状态
const loading = ref(false)
const hasMore = ref(true)

// 页面交互逻辑
const handleBack = () => {
  uni.navigateBack()
}

const switchTab = (value) => {
  activeTab.value = value
  // 实际开发中根据标签筛选数据
  uni.showToast({ title: `切换到${tabList.find(t => t.value === value)?.label}`, icon: 'none' })
}

const handleLoadMore = () => {
  if (loading.value || !hasMore.value) return

  loading.value = true
  // 模拟接口请求
  setTimeout(() => {
    loading.value = false
    hasMore.value = false
  }, 800)
}
</script>

<style scoped lang="scss">
.withdraw-record-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

/* 顶部统计栏 */
.stats-header {
  background-color: #fff;
  padding: 30rpx;
  position: relative;
}

.back-btn {
  position: absolute;
  left: 30rpx;
  top: 30rpx;
  z-index: 10;
}

.page-title {
  text-align: center;
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 40rpx;
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.stats-item {
  text-align: center;
  flex: 1;
}

.stats-value {
  font-size: 48rpx;
  font-weight: bold;
  line-height: 1.2;
  margin-bottom: 10rpx;
}

.green {
  color: #00b578;
}

.orange {
  color: #ff9500;
}

.blue {
  color: #007aff;
}

.stats-label {
  font-size: 28rpx;
  color: #999;
}

.stats-divider {
  width: 2rpx;
  height: 60rpx;
  background-color: #f0f0f0;
}

/* 标签栏 */
.tab-bar {
  display: flex;
  background-color: #fff;
  padding: 20rpx 0;
  margin-bottom: 20rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  font-size: 32rpx;
  color: #999;
  padding: 10rpx 0;
  position: relative;
  transition: all 0.3s;

  &.active {
    color: #007aff;
    font-weight: 500;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60rpx;
      height: 4rpx;
      background-color: #007aff;
      border-radius: 2rpx;
    }
  }
}

/* 记录列表 */
.record-list {
  height: calc(100vh - 400rpx);
  padding: 0 30rpx;
}

.month-group {
  margin-bottom: 30rpx;
}

.month-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #666;
  margin-bottom: 20rpx;
}

.record-item {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.item-left {
  flex: 1;
}

.status-tag {
  display: inline-block;
  padding: 6rpx 20rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  font-weight: 500;
  margin-bottom: 10rpx;

  &.pending {
    background-color: #fff3e0;
    color: #ff9500;
  }

  &.success {
    background-color: #e6ffe6;
    color: #00b578;
  }

  &.fail {
    background-color: #ffe6e6;
    color: #ff3b30;
  }
}

.item-title {
  font-size: 34rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 10rpx;
}

.bank-info {
  font-size: 30rpx;
  color: #999;
  margin-bottom: 30rpx;
}

.create-time {
  font-size: 28rpx;
  color: #999;
}

.item-right {
  text-align: right;
}

.amount {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.arrive-time {
  font-size: 28rpx;
  color: #999;

  &.success {
    color: #00b578;
  }
}

/* 加载状态 */
.loading, .load-more, .no-more {
  text-align: center;
  padding: 30rpx 0;
  font-size: 28rpx;
  color: #999;
}
</style>