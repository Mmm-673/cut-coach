<template>
  <view class="onsite-order-list">
    <!-- 状态筛选 tab -->
    <scroll-view scroll-x class="status-tabs" :show-scrollbar="false">
      <view
        v-for="tab in statusTabs"
        :key="tab.value"
        class="status-tab"
        :class="{ active: currentStatus === tab.value }"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </scroll-view>

    <!-- 订单列表 -->
    <view class="order-list">
      <view
        v-for="item in orderList"
        :key="item.id"
        class="order-card"
        @click="navToDetail(item.id)"
      >
        <view class="card-header">
          <text class="order-no">{{ item.orderNo }}</text>
          <text class="status-tag" :style="{ color: getStatusColor(item.status) }">
            {{ getStatusName(item.status) }}
          </text>
        </view>
        <view class="card-body">
          <view class="info-row">
            <text class="label">服务类型</text>
            <text class="value">{{ getServiceTypeName(item.serviceType) }}</text>
          </view>
          <view class="info-row">
            <text class="label">客户类型</text>
            <text class="value">{{ item.customerType === 1 ? '平台会员' : '散客' }}</text>
          </view>
          <view class="info-row" v-if="hasPayAmount(item)">
            <text class="label">订单金额</text>
            <text class="value amount">¥{{ formatFenToYuan(item.payAmount) }}</text>
          </view>
        </view>
        <view class="card-footer">
          <text class="create-time">{{ formatTime(item.createTime) }}</text>
        </view>
      </view>

      <view v-if="orderList.length === 0 && !loading" class="empty">
        <uni-icons type="info" size="48" color="#d1d5db"></uni-icons>
        <text class="empty-text">暂无订单</text>
      </view>

      <view v-if="loading && orderList.length === 0" class="loading">加载中...</view>
      <view v-if="noMore && orderList.length > 0" class="no-more">没有更多了</view>
    </view>

    <!-- 新建浮动按钮 -->
    <view class="fab-btn" @click="navToCreate">
      <uni-icons type="plus" size="22" color="#fff"></uni-icons>
      <text>新建</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { getOnsiteOrderPage } from '@/api/billiard/onsiteOrder'
import { ORDER_STATUS_MAP, SERVICE_TYPE_MAP, formatFenToYuan } from '@/utils/onsiteOrder'

const statusTabs = [
  { label: '全部', value: '' },
  { label: '待开始', value: 15 },
  { label: '进行中', value: 40 },
  { label: '待付款', value: 45 },
  { label: '已完成', value: 60 },
  { label: '已取消', value: 70 }
]

const currentStatus = ref('')
const orderList = ref([])
const pageNo = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const noMore = ref(false)

const getStatusName = (status) => ORDER_STATUS_MAP[status]?.name || '未知'
const getStatusColor = (status) => ORDER_STATUS_MAP[status]?.color || '#666'
const getServiceTypeName = (type) => SERVICE_TYPE_MAP[type]?.name || '未知'

const hasPayAmount = (item) => {
  return item.payAmount !== null && item.payAmount !== undefined && item.payAmount !== 0
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr
}

const fetchList = async (isRefresh = false) => {
  if (loading.value) return
  if (isRefresh) {
    pageNo.value = 1
    noMore.value = false
  }
  if (noMore.value && !isRefresh) return

  loading.value = true
  try {
    const params = {
      pageNo: pageNo.value,
      pageSize: pageSize.value
    }
    if (currentStatus.value !== '') {
      params.status = currentStatus.value
    }
    const res = await getOnsiteOrderPage(params)
    const list = res.data?.list || res.data?.records || []
    if (isRefresh) {
      orderList.value = list
    } else {
      orderList.value = [...orderList.value, ...list]
    }
    if (list.length < pageSize.value) {
      noMore.value = true
    } else {
      pageNo.value++
    }
  } catch (e) {
    console.error('获取现场订单列表失败', e)
  } finally {
    loading.value = false
    if (isRefresh) {
      uni.stopPullDownRefresh()
    }
  }
}

const switchTab = (value) => {
  currentStatus.value = value
  fetchList(true)
}

const navToCreate = () => {
  uni.navigateTo({ url: '/subpkg/onsite/create' })
}

const navToDetail = (id) => {
  uni.navigateTo({ url: `/subpkg/onsite/detail?id=${id}` })
}

onShow(() => {
  fetchList(true)
})

onPullDownRefresh(() => {
  fetchList(true)
})

onReachBottom(() => {
  fetchList(false)
})
</script>

<style lang="scss" scoped>
.onsite-order-list {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 120rpx;
  box-sizing: border-box;
}

.status-tabs {
  white-space: nowrap;
  background: #fff;
  padding: 0 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.status-tab {
  display: inline-block;
  padding: 24rpx 28rpx;
  font-size: 28rpx;
  color: #666;
  position: relative;

  &.active {
    color: #2f6bee;
    font-weight: 600;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40rpx;
      height: 6rpx;
      border-radius: 3rpx;
      background: #2f6bee;
    }
  }
}

.order-list {
  padding: 24rpx;
}

.order-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  transition: opacity 0.2s;

  &:active {
    opacity: 0.7;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.order-no {
  font-size: 26rpx;
  color: #999;
}

.status-tag {
  font-size: 26rpx;
  font-weight: 600;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 28rpx;
}

.label {
  color: #999;
}

.value {
  color: #333;
  font-weight: 500;

  &.amount {
    color: #ef4444;
    font-size: 30rpx;
    font-weight: 600;
  }
}

.card-footer {
  margin-top: 20rpx;
  padding-top: 16rpx;
  border-top: 1rpx dashed #f0f0f0;
}

.create-time {
  font-size: 24rpx;
  color: #bbb;
}

.empty {
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

.loading,
.no-more {
  text-align: center;
  padding: 30rpx 0;
  font-size: 26rpx;
  color: #9ca3af;
}

.fab-btn {
  position: fixed;
  right: 40rpx;
  bottom: calc(60rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx 36rpx;
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  border-radius: 50rpx;
  box-shadow: 0 8rpx 24rpx rgba(47, 107, 238, 0.35);
  z-index: 99;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.95);
  }
}
</style>
