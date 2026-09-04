<template>
  <view class="deduct-page">
    <!-- 顶部统计栏 -->
    <view class="stats-header">
      <view class="total-deduct">
        <text class="label">累计扣款</text>
        <text class="value">-¥{{ formatAmount(totalDeduction) }}</text>
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
      <view v-for="item in displayRecords" :key="item.id" class="deduct-item">
        <view class="item-top">
          <view class="status-tag" :class="getStatusClass(item.status)">
            {{ getStatusText(item.status) }}
          </view>
          <view class="amount red">-¥{{ formatAmount(item.deductAmount) }}</view>
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
        <uni-icons type="list" size="64" :color="textTertiaryColor"></uni-icons>
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
import { onShow } from '@dcloudio/uni-app'
import { getDeductionPage } from '@/api/billiard/wallet'
import { usePageTheme, useThemeColor } from '@/utils/theme'

// 页面主题初始化
usePageTheme()

const textTertiaryColor = useThemeColor('textTertiary')

// 标签栏数据
const tabList = [
  { label: '全部', value: null },
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

// 按tab筛选
const displayRecords = computed(() => {
  return recordList.value
})

const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00'
  return (Number(amount) / 100).toFixed(2)
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

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
        totalDeduction.value = res.data.totalDeductAmount || 0
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
    url: `/subpkg/mine/wallet/appeal/index?recordId=${item.id}&orderId=${item.orderId || ''}&reason=${encodeURIComponent(item.deductReason || '')}&amount=${item.deductAmount}`
  })
}

onShow(() => {
  fetchDeductionRecords(true)
})

onMounted(() => {
  fetchDeductionRecords(true)
})


</script>

<style lang="scss" scoped>
.deduct-page {
  min-height: 100vh;
  background: var(--bg-page-gradient, linear-gradient(180deg, var(--bg-page, #f8fbff) 0%, #ffffff 100%));
}

/* 顶部统计栏 */
.stats-header {
  background: linear-gradient(135deg, var(--color-danger, #ef4444) 0%, var(--color-red-dark, #dc2626) 100%);
  padding: 50rpx 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.2);
}

.total-deduct {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.value {
  font-size: 56rpx;
  font-weight: bold;
  color: #fff;
}

/* 标签栏 */
.tab-bar {
  display: flex;
  background: var(--bg-card, #fff);
  padding: 0 16rpx;
  margin-top: 20rpx;
  box-shadow: 0 2rpx 8rpx var(--shadow-card, rgba(0, 0, 0, 0.05));
}

.tab-item {
  flex: 1;
  text-align: center;
  font-size: 28rpx;
  color: var(--text-tertiary, #9ca3af);
  padding: 28rpx 0;
  position: relative;
  transition: all 0.2s;

  &.active {
    color: var(--color-primary, #2f6bee);
    font-weight: 600;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 48rpx;
      height: 6rpx;
      background: var(--gradient-primary, linear-gradient(135deg, var(--color-primary, #2f6bee) 0%, var(--color-primary-dark, #1a50d9) 100%));
      border-radius: 3rpx;
    }
  }
}

/* 扣款列表 */
.deduct-list {
  height: calc(100vh - 280rpx);
  padding: 24rpx;
}

.deduct-item {
  background: var(--bg-card, #fff);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx var(--shadow-card, rgba(0, 0, 0, 0.05));
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.status-tag {
  display: inline-block;
  padding: 8rpx 20rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  font-weight: 500;

  &.pending {
    background: var(--color-warning-light, #fff7ed);
    color: var(--color-warning, #f59e0b);
  }

  &.appealing {
    background: var(--color-primary-light, #eff6ff);
    color: var(--color-primary, #2f6bee);
  }

  &.kept {
    background: #fef2f2;
    color: var(--color-danger, #ef4444);
  }

  &.refunded {
    background: var(--color-success-light, #ecfdf5);
    color: var(--color-success, #10b981);
  }
}

.amount {
  font-size: 36rpx;
  font-weight: bold;
  color: var(--text-primary, #1f2937);

  &.red {
    color: var(--color-danger, #ef4444);
  }
}

.order-no {
  font-size: 26rpx;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 8rpx;
}

.reason {
  font-size: 28rpx;
  color: var(--text-primary, #374151);
  line-height: 1.5;
  margin-bottom: 16rpx;
}

.item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time {
  font-size: 24rpx;
  color: var(--text-tertiary, #9ca3af);
}

.appeal-btn {
  padding: 10rpx 28rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  background: linear-gradient(135deg, var(--color-warning, #f59e0b) 0%, var(--color-orange-dark, #d97706) 100%);
  color: #fff;
  font-weight: 500;
  transition: all 0.2s;

  &:active {
    opacity: 0.8;
  }

  &.disabled {
    background: var(--border-color, #e5e7eb);
    color: var(--text-tertiary, #9ca3af);
  }
}

.appeal-info {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid var(--border-light, #f3f4f6);

  .appeal-label {
    font-size: 24rpx;
    color: var(--text-tertiary, #9ca3af);
    margin-bottom: 8rpx;
  }

  .appeal-content {
    font-size: 26rpx;
    color: var(--text-secondary, #6b7280);
    line-height: 1.5;
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
  color: var(--text-tertiary, #9ca3af);
}

/* 加载状态 */
.loading-tip,
.no-more-tip {
  text-align: center;
  padding: 40rpx 0;
  font-size: 26rpx;
  color: var(--text-tertiary, #9ca3af);
}
</style>
