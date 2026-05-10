<template>
  <view class="withdraw-record-page">
    <!-- 顶部统计栏 -->
    <view class="stats-header">
      <view class="stats-row">
        <view class="stats-item">
          <view class="stats-value green">¥{{ (totalWithdraw / 100).toFixed(2) }}</view>
          <view class="stats-label">累计提现</view>
        </view>
        <view class="stats-divider"></view>
        <view class="stats-item">
          <view class="stats-value orange">¥{{ (pendingWithdraw / 100).toFixed(2) }}</view>
          <view class="stats-label">提现中</view>
        </view>
        <view class="stats-divider"></view>
        <view class="stats-item">
          <view class="stats-value blue">{{ totalCount }}次</view>
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
        :refresher-enabled="true"
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="handleLoadMore"
    >
      <view
          v-for="item in displayRecords"
          :key="item.id"
          class="record-item"
      >
        <view class="item-left">
          <view class="status-tag" :class="getStatusClass(item.status)">
            {{ getStatusText(item.status) }}
          </view>
          <view class="item-title">{{ getAccountTypeText(item.accountType) }}</view>
          <view class="bank-info">{{ item.realName }} {{ maskAccountNo(item.accountNo) }}</view>
          <view class="create-time">申请时间：{{ formatTime(item.applyTime) }}</view>
        </view>
        <view class="item-right">
          <view class="amount">¥{{ (item.withdrawAmount / 100).toFixed(2) }}</view>
          <view class="fee-info" v-if="item.feeAmount > 0">含手续费¥{{ (item.feeAmount / 100).toFixed(2) }}</view>
          <view class="arrive-time" :class="getStatusClass(item.status)">
            {{ getArriveTimeText(item) }}
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && displayRecords.length === 0" class="empty-tip">
        <text>暂无提现记录</text>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-tip">加载中...</view>
      <view v-if="!hasMore && displayRecords.length > 0" class="no-more-tip">已经到底啦~</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getWithdrawalPage } from '@/api/billiard/wallet'

// 标签栏数据
const tabList = [
  { label: '全部', value: -1 },
  { label: '申请中', value: 0 },
  { label: '处理中', value: 1 },
  { label: '已到账', value: 2 },
  { label: '已拒绝', value: 3 }
]
const activeTab = ref(-1)

// 统计数据
const totalWithdraw = ref(0)
const pendingWithdraw = ref(0)
const totalCount = ref(0)

// 提现记录数据
const recordList = ref([])
const pageNo = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)

// 按tab筛选
const displayRecords = computed(() => {
  if (activeTab.value === -1) {
    return recordList.value
  }
  return recordList.value.filter(item => item.status === activeTab.value)
})

// 状态映射
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

const getAccountTypeText = (type) => {
  const map = { 1: '提现到微信', 2: '提现到支付宝' }
  return map[type] || '提现到银行卡'
}

const maskAccountNo = (no) => {
  if (!no) return ''
  if (no.length > 8) {
    return `(${no.slice(-4)})`
  }
  return `(${no})`
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
}

const getArriveTimeText = (item) => {
  if (item.status === 2 && item.payTime) {
    return `${formatTime(item.payTime)}到账`
  }
  if (item.status === 3 && item.rejectReason) {
    return `拒绝原因：${item.rejectReason}`
  }
  if (item.status === 0) {
    return '预计3个工作日到账'
  }
  if (item.status === 1) {
    return '处理中，请耐心等待'
  }
  return '-'
}

// 获取提现记录
const fetchWithdrawalRecords = async (reset = false) => {
  if (loading.value) return
  if (!reset && !hasMore.value) return

  loading.value = true
  try {
    const params = {
      pageNo: reset ? 1 : pageNo.value,
      pageSize: pageSize.value
    }
    // 全部不传status，其他传status筛选
    if (activeTab.value !== -1) {
      params.status = activeTab.value
    }

    const res = await getWithdrawalPage(params)
    if (res.data) {
      const list = res.data.list || []

      if (reset) {
        recordList.value = list
        pageNo.value = 1
        // 只有一页数据时，从列表计算统计
        if (res.data.total <= pageSize.value && list.length > 0) {
          let total = 0
          let pending = 0
          let cnt = 0
          list.forEach(item => {
            total += item.withdrawAmount
            cnt++
            if (item.status === 0 || item.status === 1) {
              pending += item.withdrawAmount
            }
          })
          totalWithdraw.value = total
          pendingWithdraw.value = pending
          totalCount.value = cnt
        }
      } else {
        recordList.value = [...recordList.value, ...list]
        pageNo.value++
      }
      hasMore.value = list.length >= pageSize.value
    }
  } catch (err) {
    console.error('获取提现记录失败', err)
  } finally {
    loading.value = false
  }
}

// 切换tab
const switchTab = (value) => {
  if (activeTab.value === value) return
  activeTab.value = value
  recordList.value = []
  hasMore.value = true
  pageNo.value = 1
  fetchWithdrawalRecords(true)
}

// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true
  await fetchWithdrawalRecords(true)
  refreshing.value = false
}

// 上拉加载更多
const handleLoadMore = () => {
  if (!loading.value && hasMore.value) {
    fetchWithdrawalRecords(false)
  }
}

onMounted(() => {
  fetchWithdrawalRecords(true)
})
</script>

<style lang="scss" scoped>
.withdraw-record-page {
  min-height: 100vh;
  background: $bg-page;
}

/* 顶部统计栏 */
.stats-header {
  background: $bg-card;
  padding: 32rpx 30rpx;
}

.stats-row {
  display: flex;
  align-items: center;
}

.stats-item {
  text-align: center;
  flex: 1;
}

.stats-value {
  font-size: 44rpx;
  font-weight: bold;
  line-height: 1.2;
  margin-bottom: 8rpx;
  &.green { color: $success; }
  &.orange { color: $warning; }
  &.blue { color: $primary; }
}

.stats-label {
  font-size: 26rpx;
  color: $text-tertiary;
}

.stats-divider {
  width: 2rpx;
  height: 60rpx;
  background: $border-light;
}

/* 标签栏 */
.tab-bar {
  display: flex;
  background: $bg-card;
  padding: 0 16rpx;
  margin-bottom: 16rpx;
  box-shadow: $shadow-sm;
}

.tab-item {
  flex: 1;
  text-align: center;
  font-size: 28rpx;
  color: $text-tertiary;
  padding: 24rpx 0;
  position: relative;
  transition: all $duration-base;

  &.active {
    color: $primary;
    font-weight: bold;
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 48rpx;
      height: 6rpx;
      background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
      border-radius: 3rpx;
    }
  }
}

/* 记录列表 */
.record-list {
  height: calc(100vh - 300rpx);
  padding: 0 32rpx;
}

.record-item {
  background: $bg-card;
  border-radius: $radius-xl;
  padding: 28rpx;
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
  border-radius: $radius-sm;
  font-size: 24rpx;
  font-weight: 500;
  margin-bottom: 12rpx;

  &.pending {
    background: #FFF7ED;
    color: $warning;
  }

  &.processing {
    background: #EFF6FF;
    color: $primary;
  }

  &.success {
    background: #ECFDF5;
    color: $success;
  }

  &.rejected {
    background: #FEF2F2;
    color: $danger;
  }
}

.item-title {
  font-size: 30rpx;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 8rpx;
}

.bank-info {
  font-size: 26rpx;
  color: $text-secondary;
  margin-bottom: 8rpx;
}

.create-time {
  font-size: 24rpx;
  color: $text-tertiary;
}

.item-right {
  text-align: right;
  flex-shrink: 0;
  margin-left: 20rpx;
}

.amount {
  font-size: 40rpx;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: 4rpx;
}

.fee-info {
  font-size: 22rpx;
  color: $text-tertiary;
  margin-bottom: 8rpx;
}

.arrive-time {
  font-size: 24rpx;
  color: $text-tertiary;
  &.success {
    color: $success;
  }
  &.rejected {
    color: $danger;
  }
}

/* 空状态 */
.empty-tip {
  text-align: center;
  padding: 100rpx 0;
  font-size: 28rpx;
  color: $text-tertiary;
}

/* 加载状态 */
.loading-tip, .no-more-tip {
  text-align: center;
  padding: 30rpx 0;
  font-size: 26rpx;
  color: $text-tertiary;
}
</style>
