<template>
  <view class="deduct-page">
    <!-- 顶部统计栏 -->
    <view class="stats-header">
      <view class="total-deduct">
        <text class="label">累计扣款</text>
        <text class="value">-¥{{ (totalDeduction / 100).toFixed(2) }}</text>
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

    <!-- 扣款明细列表 -->
    <scroll-view
        scroll-y
        class="deduct-list"
        :refresher-enabled="true"
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="handleLoadMore"
    >
      <view
          v-for="item in displayRecords"
          :key="item.id"
          class="deduct-item"
      >
        <view class="item-top">
          <view class="status-tag" :class="getStatusClass(item.status)">
            {{ getStatusText(item.status) }}
          </view>
          <view class="amount red">-¥{{ (item.deductAmount / 100).toFixed(2) }}</view>
        </view>
        <view class="order-no">订单号：{{ item.orderId || '-' }}</view>
        <view class="reason">扣款原因：{{ item.deductReason || '-' }}</view>
        <view class="item-bottom">
          <view class="time">{{ formatTime(item.createTime) }}</view>
          <view
              class="appeal-btn"
              :class="{ disabled: item.status !== 0 }"
              @click="handleAppeal(item)"
          >
            {{ item.status === 0 ? '申诉' : '已申诉' }}
          </view>
        </view>
        <!-- 申诉信息 -->
        <view class="appeal-info" v-if="item.appealContent">
          <view class="appeal-label">申诉内容：</view>
          <view class="appeal-content">{{ item.appealContent }}</view>
        </view>
        <view class="appeal-info" v-if="item.appealResult">
          <view class="appeal-label">处理结果：</view>
          <view class="appeal-content">{{ item.appealResult }}</view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && displayRecords.length === 0" class="empty-state">
        <uni-icons type="list" size="80" color="#ccc"></uni-icons>
        <text class="empty-text">暂无扣款记录</text>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-tip">加载中...</view>
      <view v-if="!hasMore && displayRecords.length > 0" class="no-more-tip">已经到底啦~</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDeductionPage } from '@/api/billiard/wallet'

// 标签栏数据
const tabList = [
  { label: '全部', value: null},
  { label: '待申诉', value: 0 },
  { label: '申诉中', value: 1 },
  { label: '维持扣款', value: 2 },
  { label: '已退还', value: 3 }
]
const activeTab = ref(null)

// 统计数据
const totalDeduction = ref(0)

// 扣款记录数据
const recordList = ref([])
const pageNo = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)

// 按tab筛选（API已按status筛选，这里直接返回）
const displayRecords = computed(() => {
  return recordList.value
})

// 状态映射
const statusTextMap = {
  0: '待申诉',
  1: '申诉中',
  2: '维持扣款',
  3: '已退还'
}

const statusClassMap = {
  0: 'pending',
  1: 'appealing',
  2: 'kept',
  3: 'refunded'
}

const getStatusText = (status) => {
  return statusTextMap[status] || '未知'
}

const getStatusClass = (status) => {
  return statusClassMap[status] || ''
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
}

// 获取扣款记录
const fetchDeductionRecords = async (reset = false) => {
  if (loading.value) return
  if (!reset && !hasMore.value) return

  loading.value = true
  try {
    const params = {
      pageNo: reset ? 1 : pageNo.value,
      pageSize: pageSize.value
    }
    if (activeTab.value !== null) {
      params.status = activeTab.value
    }

    const res = await getDeductionPage(params)
    if (res.data) {
      const list = res.data.list || []

      if (reset) {
        recordList.value = list
        pageNo.value = 1
        totalDeduction.value = res.data.totalDeduction || 0
      } else {
        recordList.value = [...recordList.value, ...list]
        pageNo.value++
      }
      hasMore.value = list.length >= pageSize.value
    }
  } catch (err) {
    console.error('获取扣款记录失败', err)
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
  fetchDeductionRecords(true)
}

// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true
  await fetchDeductionRecords(true)
  refreshing.value = false
}

// 上拉加载更多
const handleLoadMore = () => {
  if (!loading.value && hasMore.value) {
    fetchDeductionRecords(false)
  }
}

const handleAppeal = (item) => {
  if (item.status !== 0) {
    uni.showToast({ title: '该订单已申诉', icon: 'none' })
    return
  }
  uni.navigateTo({
    url: `/pages/mine/wallet/appeal/index?recordId=${item.id}&orderId=${item.orderId || ''}&reason=${encodeURIComponent(item.deductReason || '')}&amount=${item.deductAmount}`
  })
}

onMounted(() => {
  fetchDeductionRecords(true)
})
</script>

<style lang="scss" scoped>
.deduct-page {
  min-height: 100vh;
  background: $bg-page;
}

/* 顶部统计栏 */
.stats-header {
  background: $bg-card;
  padding: 32rpx 30rpx;
}

.total-deduct {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 30rpx;
  color: $text-secondary;
}

.value {
  font-size: 48rpx;
  font-weight: bold;
  color: $danger;
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

/* 扣款列表 */
.deduct-list {
  height: calc(100vh - 280rpx);
  padding: 0 32rpx;
}

.deduct-item {
  background: $bg-card;
  border-radius: $radius-xl;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.status-tag {
  display: inline-block;
  padding: 6rpx 20rpx;
  border-radius: $radius-sm;
  font-size: 24rpx;
  font-weight: 500;

  &.pending {
    background: #FFF7ED;
    color: $warning;
  }

  &.appealing {
    background: #EFF6FF;
    color: $primary;
  }

  &.kept {
    background: #FEF2F2;
    color: $danger;
  }

  &.refunded {
    background: #ECFDF5;
    color: $success;
  }
}

.amount {
  font-size: 36rpx;
  font-weight: bold;
  color: $text-primary;
  &.red {
    color: $danger;
  }
}

.order-no {
  font-size: 26rpx;
  color: $text-secondary;
  margin-bottom: 8rpx;
}

.reason {
  font-size: 28rpx;
  color: $text-secondary;
  line-height: 1.5;
  margin-bottom: 16rpx;
}

.item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time {
  font-size: 26rpx;
  color: $text-tertiary;
}

.appeal-btn {
  padding: 8rpx 24rpx;
  border-radius: $radius-sm;
  font-size: 26rpx;
  background: #FFF7ED;
  color: $warning;
  transition: all $duration-fast;
  &:active {
    opacity: 0.8;
  }
  &.disabled {
    background: $bg-page;
    color: $text-tertiary;
  }
}

.appeal-info {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid $border-light;
  .appeal-label {
    font-size: 26rpx;
    color: $text-tertiary;
    margin-bottom: 8rpx;
  }
  .appeal-content {
    font-size: 28rpx;
    color: $text-secondary;
    line-height: 1.5;
  }
}

/* 空状态 */
.empty-state {
  background: $bg-card;
  border-radius: $radius-xl;
  padding: 80rpx 30rpx;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.empty-text {
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
