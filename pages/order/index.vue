<template>
  <view class="order-list-wrapper">
    <!-- 订单状态分类栏 -->
    <view class="tab-bar-wrapper">
      <scroll-view class="tab-bar" scroll-x enable-flex>
        <view
            class="tab-item"
            :class="{ active: currentTab === tab.value }"
            v-for="tab in tabs"
            :key="tab.value"
            @click="handleTabClick(tab.value)"
        >
          <text>{{tab.label}}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 订单列表 -->
    <scroll-view
        class="order-list-scroll"
        scroll-y
        refresher-enabled
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="onLoadMore"
    >
      <view class="order-list">
        <view
            v-for="order in displayOrders"
            :key="order.orderId"
            class="order-item"
            @click="goToDetail(order)"
        >
          <view class="order-header">
            <view class="order-header-left">
              <text class="order-no">订单编号：{{order.orderNo}}</text>
              <text class="order-type-tag" :style="{ background: getOrderTypeColor(order.type) + '22', color: getOrderTypeColor(order.type) }">
                {{ getOrderTypeName(order.type) }}
              </text>
            </view>
            <uni-tag
                :text="getStatusText(order.status)"
                :type="getStatusType(order.status)"
                size="small"
                style="font-weight: bold"
            />
          </view>
          <view class="order-body">
            <view class="order-info-row">
              <text class="label">服务类型</text>
              <text class="value">{{getServiceTypeName(order.serviceType)}}</text>
            </view>
            <view class="order-info-row" v-if="order.type === 1">
              <text class="label">预约时间</text>
              <text class="value">{{order.bookingTimeText || '-'}}</text>
            </view>
            <view class="order-info-row" v-else>
              <text class="label">开始时间</text>
              <text class="value">{{formatTime(order.createTime) || '-'}}</text>
            </view>
            <!-- 预约时长：仅小时价普通订单展示 -->
            <view class="order-info-row" v-if="order.type === 1 && order.serviceDuration && !isFixedPricing(order.pricingMode)">
              <text class="label">预约时长</text>
              <text class="value">{{order.serviceDuration}}分钟</text>
            </view>
            <view class="order-info-row" v-if="order.totalAmount">
              <text class="label">订单金额</text>
              <text class="value price">{{ formatPriceWithUnit(order.totalAmount, order.pricingMode) }}</text>
            </view>
          </view>
          <view class="order-footer">
            <text class="arrow">查看详情</text>
            <uni-icons type="right" size="16" :color="textTertiaryColor" />
          </view>
        </view>
        <view class="empty-tip" v-if="!displayOrders.length && !loading">
          <uni-icons type="info" size="48" :color="textTertiaryColor" />
          <text>暂无订单</text>
        </view>
        <view class="loading-tip" v-if="loading">
          <text>加载中...</text>
        </view>
        <view class="no-more-tip" v-if="!hasMore && displayOrders.length > 0">
          <text>没有更多了</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getOrderPage } from '@/api/billiard/order'
import { ORDER_TYPE_MAP, formatPriceWithUnit, isFixedPricing } from '@/utils/onsiteOrder'
import { usePageTheme, useThemeColor } from '@/utils/theme'

// 页面主题初始化
usePageTheme()

const textTertiaryColor = useThemeColor('textTertiary')

	// 服务类型映射
	const getServiceTypeName = (serviceType) => {
		const serviceTypeMap = {
			1: '台球指导',
			2: '潮玩领航',
			3: '酒艺品鉴',
			4: '影视赏析'
		}
		return serviceTypeMap[serviceType] || '未知服务'
	}

const tabs = [
  { label: '全部', value: 0 },
  { label: '待付款(普通)', value: 10 },
  { label: '待接单', value: 20 },
  { label: '已接单', value: 30 },
  { label: '待开始', value: 15 },
  { label: '进行中', value: 40 },
  { label: '待付款(现场)', value: 45 },
  { label: '待评价', value: 50 },
  { label: '已完成', value: 60 },
  { label: '已取消', value: 70 }
]
const currentTab = ref(0)

const orderList = ref([])
const loading = ref(false)
const refreshing = ref(false)
const pageNo = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)

const displayOrders = computed(() => {
  return orderList.value
})

// 获取订单列表
const fetchOrders = async (reset = false) => {
  if (loading.value) return
  if (!reset && !hasMore.value) return

  loading.value = true
  try {
    const params = {
      pageNo: reset ? 1 : pageNo.value,
      pageSize: pageSize.value
    }
    // 全部订单不传status参数
    if (currentTab.value !== 0) {
      params.status = currentTab.value
    }
    const res = await getOrderPage(params)
    console.log('res=-------', res)
    if (res.data) {
      const list = res.data.list || []
      const orders = list.map(item => ({
        ...item,
        bookingTimeText: formatTime(item.bookingTime)
      }))
      if (reset) {
        orderList.value = orders
        pageNo.value = 1
      } else {
        orderList.value = [...orderList.value, ...orders]
      }
      hasMore.value = orders.length >= pageSize.value
      if (!reset) {
        pageNo.value++
      }
    }
  } catch (err) {
    console.error('获取订单列表失败', err)
  } finally {
    loading.value = false
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp && timestamp !== 0) return ''
  if (!timestamp && timestamp !== 0) return ''

  let date
  if (typeof timestamp === 'number') {
    date = new Date(timestamp)
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp)
  } else {
    return ''
  }

  if (isNaN(date.getTime())) {
    return ''
  }

  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
}

// tab切换
const handleTabClick = (value) => {
  if (currentTab.value === value) return
  currentTab.value = value
  orderList.value = []
  hasMore.value = true
  pageNo.value = 1
  fetchOrders(true)
}

// 跳转到订单详情
const goToDetail = (order) => {
  if (order.type === 2) {
    // 现场订单
    uni.navigateTo({
      url: `/subpkg/onsite/detail?id=${order.orderId}`
    })
  } else {
    // 普通订单（type=1 或默认）
    uni.navigateTo({
      url: `/subpkg/order/detail?orderId=${order.orderId}&status=${order.status}`
    })
  }
}

const getOrderTypeName = (type) => {
  return ORDER_TYPE_MAP[type]?.name || '未知'
}

const getOrderTypeColor = (type) => {
  return ORDER_TYPE_MAP[type]?.color || '#9ca3af'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    10: '待付款',
    15: '待开始',
    20: '待接单',
    30: '已接单',
    40: '进行中',
    45: '待付款',
    50: '待评价',
    60: '已完成',
    70: '已取消'
  }
  return statusMap[status] || '未知'
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    10: 'warning',
    15: 'warning',
    20: 'warning',
    30: 'primary',
    40: 'primary',
    45: 'warning',
    50: 'warning',
    60: 'success',
    70: 'default'
  }
  return typeMap[status] || 'default'
}

// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true
  await fetchOrders(true)
  refreshing.value = false
}

// 上拉加载更多
const onLoadMore = () => {
  if (!loading.value && hasMore.value) {
    fetchOrders(false)
  }
}

onShow(() => {
  fetchOrders(true)
})


</script>

<style lang="scss" scoped>
.order-list-wrapper {
  min-height: 100vh;
  background: var(--bg-page-gradient, linear-gradient(180deg, var(--bg-page, #f8fbff) 0%, #ffffff 100%));
  display: flex;
  flex-direction: column;
}

.tab-bar-wrapper {
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 99;
  background: var(--bg-card, #fff);
}

.tab-bar {
  white-space: nowrap;
  background: var(--bg-card, #fff);
  padding: 0 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.tab-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: var(--text-secondary, #6b7280);
  padding: 28rpx 24rpx;
  position: relative;
  transition: color 0.2s;

  &.active {
    color: var(--color-primary, #2f6bee);
    font-weight: bold;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40rpx;
      height: 6rpx;
      background: var(--gradient-primary, linear-gradient(135deg, var(--color-primary, #2f6bee) 0%, var(--color-primary-dark, #1a50d9) 100%));
      border-radius: 3rpx;
    }
  }
}

.order-list-scroll {
  flex: 1;
  height: calc(100vh - 100rpx);
}

.order-list {
  padding: 24rpx;
}

.order-item {
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

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid var(--border-light, #f3f4f6);
  margin-bottom: 20rpx;
}

.order-header-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.order-type-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-weight: 500;
}

.order-no {
  font-size: 26rpx;
  color: var(--text-primary, #374151);
  font-weight: 500;
}

.order-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14rpx;
}

.order-info-row:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 28rpx;
  color: var(--text-tertiary, #9ca3af);
}

.value {
  font-size: 28rpx;
  color: var(--text-secondary, #4b5563);
  font-weight: 500;
}

.price {
  color: var(--color-primary, #2f6bee);
  font-weight: bold;
  font-size: 32rpx;
}

.order-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid var(--border-light, #f3f4f6);
  margin-top: 20rpx;
  gap: 6rpx;
}

.arrow {
  font-size: 26rpx;
  color: var(--text-tertiary, #9ca3af);
}

.empty-tip, .loading-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding-top: 160rpx;
  font-size: 28rpx;
  color: var(--text-tertiary, #9ca3af);
}

.no-more-tip {
  text-align: center;
  font-size: 26rpx;
  color: var(--text-tertiary, #9ca3af);
  padding: 32rpx 0;
}
</style>
