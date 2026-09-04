<template>
  <view class="reward-record-page">
    <!-- 顶部统计栏 -->
    <view class="stats-header">
      <view class="total-reward">
        <text class="label">累计打赏</text>
        <text class="value">¥{{ formatAmount(summary.totalAmount) }}</text>
      </view>
      <view class="total-count">
        <text class="count-num">{{ summary.rewardCount }}</text>
        <text class="count-label">笔</text>
      </view>
    </view>

    <!-- 打赏记录列表 -->
    <scroll-view
      scroll-y
      class="reward-list"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="handleLoadMore"
    >
      <view v-for="item in recordList" :key="item.id" class="reward-item">
        <view class="item-left">
          <image
            class="avatar"
            :src="item.rewarderAvatar || defaultAvatar"
            mode="aspectFill"
          />
          <view class="user-info">
            <view class="nickname">{{ item.rewarderNickname || '球友' }}</view>
            <view class="pay-time">{{ formatTime(item.payTime) }}</view>
          </view>
        </view>
        <view class="item-right">
          <view class="amount">+¥{{ formatAmount(item.amount) }}</view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && recordList.length === 0" class="empty-state">
        <uni-icons type="gift" size="64" :color="textTertiaryColor"></uni-icons>
        <text class="empty-text">暂无打赏记录</text>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-tip">加载中...</view>
      <view v-if="!hasMore && recordList.length > 0" class="no-more-tip">已经到底啦~</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getRewardPage, getRewardSummary } from '@/api/billiard/reward'
import { usePageTheme, useThemeColor } from '@/utils/theme'

// 页面主题初始化
usePageTheme()

const textTertiaryColor = useThemeColor('textTertiary')

const defaultAvatar = '/static/images/profile.jpg'

// 统计数据（从 summary 接口取）
const summary = reactive({
  totalAmount: 0,
  rewardCount: 0
})

// 获取打赏汇总
const fetchSummary = async () => {
  try {
    const res = await getRewardSummary()
    if (res.code === 0 || res.code === 200) {
      summary.totalAmount = res.data?.totalAmount || 0
      summary.rewardCount = res.data?.rewardCount || 0
    }
  } catch (err) {
    console.error('获取打赏汇总失败', err)
  }
}

// 打赏记录数据
const recordList = ref([])
const pageNo = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)

const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00'
  return (Number(amount) / 100).toFixed(2)
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 获取打赏记录
const fetchRewardRecords = async (reset = false) => {
  if (loading.value) return
  if (!reset && !hasMore.value) return

  loading.value = true
  try {
    const params = {
      pageNo: reset ? 1 : pageNo.value,
      pageSize: pageSize.value
    }

    const res = await getRewardPage(params)
    if (res.data) {
      const list = res.data.list || []

      if (reset) {
        recordList.value = list
        pageNo.value = 1
      } else {
        recordList.value = [...recordList.value, ...list]
        pageNo.value++
      }
      hasMore.value = list.length >= pageSize.value
    }
  } catch (err) {
    console.error('获取打赏记录失败', err)
  } finally {
    loading.value = false
  }
}

// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true
  await Promise.all([
    fetchSummary(),
    fetchRewardRecords(true)
  ])
  refreshing.value = false
}

// 上拉加载更多
const handleLoadMore = () => {
  if (!loading.value && hasMore.value) {
    fetchRewardRecords(false)
  }
}

const loadData = () => {
  fetchSummary()
  fetchRewardRecords(true)
}

onShow(() => {
  loadData()
})

onMounted(() => {
  loadData()
})


</script>

<style lang="scss" scoped>
.reward-record-page {
  min-height: 100vh;
  background: var(--bg-page-gradient, linear-gradient(180deg, var(--bg-page, #f8fbff) 0%, #ffffff 100%));
}

/* 顶部统计栏 */
.stats-header {
  background: linear-gradient(135deg, var(--color-warning, #f59e0b) 0%, var(--color-orange-dark, #d97706) 100%);
  padding: 50rpx 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(245, 158, 11, 0.2);
}

.total-reward {
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

.total-count {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6rpx;
  margin-top: 12rpx;
}

.count-num {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
}

.count-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 打赏列表 */
.reward-list {
  height: calc(100vh - 180rpx);
  padding: 24rpx;
}

.reward-item {
  background: var(--bg-card, #fff);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 12rpx var(--shadow-card, rgba(0, 0, 0, 0.05));
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.item-left {
  display: flex;
  align-items: center;
  gap: 24rpx;
  flex: 1;
}

.avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: var(--border-light, #f3f4f6);
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex: 1;
  min-width: 0;
}

.nickname {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pay-time {
  font-size: 24rpx;
  color: var(--text-tertiary, #9ca3af);
}

.item-right {
  flex-shrink: 0;
  margin-left: 20rpx;
}

.amount {
  font-size: 40rpx;
  font-weight: bold;
  color: var(--color-success, #10b981);
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
