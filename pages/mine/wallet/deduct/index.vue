<template>
  <view class="deduct-detail-page">
    <!-- 顶部统计栏 -->
    <view class="stats-header">
      <view class="total-deduct">
        <text class="label">累计扣款</text>
        <text class="value">¥180.00</text>
      </view>
    </view>

    <!-- 扣款明细列表 -->
    <scroll-view
        scroll-y
        class="deduct-list"
        @scrolltolower="handleLoadMore"
    >
      <!-- 2026年3月 -->
      <view class="month-group">
        <view class="month-title">2026年3月</view>
        <view
            v-for="item in marchList"
            :key="item.id"
            class="deduct-item"
        >
          <view class="item-top">
            <view class="item-title">{{ item.title }}</view>
            <view class="amount red">-¥{{ item.amount }}</view>
          </view>
          <view class="order-no">订单号：{{ item.orderNo }}</view>
          <view class="reason">扣款原因：{{ item.reason }}</view>
          <view class="item-bottom">
            <view class="time">{{ item.time }}</view>
            <view
                class="appeal-btn"
                :class="{ disabled: item.appealed }"
                @click="handleAppeal(item)"
            >
              {{ item.appealed ? '已申诉' : '申诉' }}
            </view>
          </view>
        </view>
      </view>

      <!-- 2026年2月 -->
      <view class="month-group">
        <view class="month-title">2026年2月</view>
        <view v-if="febList.length === 0" class="empty-state">
          <uni-icons type="list" size="80" color="#ccc"></uni-icons>
          <text class="empty-text">暂无扣款记录</text>
        </view>
        <view
            v-else
            v-for="item in febList"
            :key="item.id"
            class="deduct-item"
        >
          <view class="item-top">
            <view class="item-title">{{ item.title }}</view>
            <view class="amount red">-¥{{ item.amount }}</view>
          </view>
          <view class="order-no">订单号：{{ item.orderNo }}</view>
          <view class="reason">扣款原因：{{ item.reason }}</view>
          <view class="item-bottom">
            <view class="time">{{ item.time }}</view>
            <view
                class="appeal-btn"
                :class="{ disabled: item.appealed }"
                @click="handleAppeal(item)"
            >
              {{ item.appealed ? '已申诉' : '申诉' }}
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

// 扣款明细数据（模拟接口数据）
const allDeductList = reactive([
  // 3月数据
  {
    id: 1,
    title: '爽约扣款',
    amount: '120.00',
    orderNo: '202603151800001',
    reason: '未按时到达服务地点，客户取消订单',
    time: '2026-03-15 18:05',
    appealed: false,
    month: '2026年3月'
  },
  {
    id: 2,
    title: '拒单扣款',
    amount: '60.00',
    orderNo: '202603101400001',
    reason: '接单后10分钟内拒单，扣除订单金额的50%',
    time: '2026-03-10 14:02',
    appealed: true,
    month: '2026年3月'
  }
])

// 按月份分组数据
const marchList = computed(() => allDeductList.filter(item => item.month === '2026年3月'))
const febList = computed(() => allDeductList.filter(item => item.month === '2026年2月'))

// 分页加载状态
const loading = ref(false)
const hasMore = ref(true)

// 页面交互逻辑
const handleBack = () => {
  uni.navigateBack()
}

const handleAppeal = (item) => {
  if (item.appealed) {
    uni.showToast({ title: '该订单已申诉', icon: 'none' })
    return
  }
  uni.navigateTo({
    url: '/pages/mine/wallet/appeal/index'
  })

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
.deduct-detail-page {
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

.total-deduct {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10rpx;
}

.label {
  font-size: 32rpx;
  color: #666;
}

.value {
  font-size: 48rpx;
  font-weight: bold;
  color: #ff3b30;
}

/* 扣款列表 */
.deduct-list {
  height: calc(100vh - 300rpx);
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

.deduct-item {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.item-title {
  font-size: 34rpx;
  font-weight: 500;
  color: #333;
}

.amount {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;

  &.red {
    color: #ff3b30;
  }
}

.order-no {
  font-size: 30rpx;
  color: #999;
  margin-bottom: 16rpx;
}

.reason {
  font-size: 30rpx;
  color: #666;
  line-height: 1.5;
  margin-bottom: 30rpx;
}

.item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time {
  font-size: 28rpx;
  color: #999;
}

.appeal-btn {
  padding: 8rpx 24rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  background-color: #fff3e0;
  color: #ff9500;

  &.disabled {
    background-color: #f0f0f0;
    color: #ccc;
  }
}

/* 空状态 */
.empty-state {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 80rpx 30rpx;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #999;
}

/* 加载状态 */
.loading, .load-more, .no-more {
  text-align: center;
  padding: 30rpx 0;
  font-size: 28rpx;
  color: #999;
}
</style>