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
            <text class="order-no">订单号：{{order.orderNo}}</text>
            <uni-tag
                :text="getStatusText(order.status)"
                :type="getStatusType(order.status)"
                size="small"
            />
          </view>
          <view class="order-body">
            <view class="order-info-row">
              <text class="label">服务类型：</text>
              <text class="value">{{order.serviceType === 1 ? '台球陪练' : '陪游'}}</text>
            </view>
            <view class="order-info-row">
              <text class="label">预约时间：</text>
              <text class="value">{{order.bookingTimeText}}</text>
            </view>
            <view class="order-info-row">
              <text class="label">金额：</text>
              <text class="value price">¥{{(order.totalAmount / 100).toFixed(2)}}</text>
            </view>
          </view>
          <view class="order-footer">
            <text class="arrow">查看详情 ＞</text>
          </view>
        </view>
        <view class="empty-tip" v-if="!displayOrders.length && !loading">
          暂无订单
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
import { getOrderPage } from '@/api/billiard/order'

const tabs = [
  { label: '全部', value: 0 },
  { label: '待付款', value: 10 },
  { label: '待接单', value: 20 },
  { label: '已接单', value: 30 },
  { label: '进行中', value: 40 },
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
  if (currentTab.value === 0) {
    return orderList.value // 全部订单不过滤
  }
  return orderList.value.filter(order => order.status === currentTab.value)
})

// 获取订单列表
const fetchOrders = async (reset = false) => {
  if (loading.value) return
  if (!reset && !hasMore.value) return

  loading.value = true
  try {
    // TODO: 上线前删除这段模拟数据
    const USE_MOCK = true
    if (USE_MOCK) {
      const now = Date.now()
      const mockOrders = [
        {
          orderId: 1001,
          orderNo: '202604181000001',
          serviceType: 1,
          bookingTime: now + 30 * 60 * 1000,
          serviceDuration: 120,
          totalAmount: 20000,
          status: 40,
          createTime: now - 60 * 60 * 1000,
          venueName: '星牌台球俱乐部',
          venueAddress: '北京市朝阳区建国路88号SOHO现代城',
          venueLongitude: 116.47823,
          venueLatitude: 39.916527,
          userPhone: '138****8888'
        },
        {
          orderId: 1002,
          orderNo: '202604171430002',
          serviceType: 1,
          bookingTime: now - 24 * 60 * 60 * 1000,
          serviceDuration: 60,
          totalAmount: 12800,
          status: 60,
          createTime: now - 25 * 60 * 60 * 1000,
          venueName: '来力台球会所',
          venueAddress: '上海市浦东新区张杨路1000号',
          venueLongitude: 121.54412,
          venueLatitude: 31.22154,
          userPhone: '139****6666'
        },
        {
          orderId: 1003,
          orderNo: '202604161030003',
          serviceType: 2,
          bookingTime: now - 48 * 60 * 60 * 1000,
          serviceDuration: 180,
          totalAmount: 36000,
          status: 20,
          createTime: now - 50 * 60 * 60 * 1000,
          venueName: '金台球俱乐部',
          venueAddress: '广州市天河区天河路100号',
          venueLongitude: 113.36123,
          venueLatitude: 23.13512,
          userPhone: '136****5555'
        },
        {
          orderId: 1004,
          orderNo: '202604151030004',
          serviceType: 1,
          bookingTime: now + 60 * 60 * 1000,
          serviceDuration: 90,
          totalAmount: 18000,
          status: 30,
          createTime: now - 30 * 60 * 1000,
          venueName: '绅士台球厅',
          venueAddress: '深圳市南山区科技园路200号',
          venueLongitude: 113.95412,
          venueLatitude: 22.54312,
          userPhone: '135****4444'
        },
        {
          orderId: 1005,
          orderNo: '202604141030005',
          serviceType: 1,
          bookingTime: now + 2 * 60 * 60 * 1000,
          serviceDuration: 60,
          totalAmount: 12000,
          status: 10,
          createTime: now - 10 * 60 * 1000,
          venueName: '巨星台球俱乐部',
          venueAddress: '杭州市西湖区文一路88号',
          venueLongitude: 120.15412,
          venueLatitude: 30.27543,
          userPhone: '137****3333'
        },
        {
          orderId: 1006,
          orderNo: '202604131030006',
          serviceType: 1,
          bookingTime: now - 72 * 60 * 60 * 1000,
          serviceDuration: 120,
          totalAmount: 24000,
          status: 50,
          createTime: now - 73 * 60 * 60 * 1000,
          venueName: '红牛台球俱乐部',
          venueAddress: '成都市武侯区科华北路66号',
          venueLongitude: 104.06582,
          venueLatitude: 30.64062,
          userPhone: '158****2222'
        },
        {
          orderId: 1007,
          orderNo: '202604121030007',
          serviceType: 2,
          bookingTime: now - 96 * 60 * 60 * 1000,
          serviceDuration: 90,
          totalAmount: 18000,
          status: 70,
          createTime: now - 97 * 60 * 60 * 1000,
          venueName: '皇家台球会所',
          venueAddress: '武汉市洪山区珞喻路100号',
          venueLongitude: 114.41282,
          venueLatitude: 30.52143,
          userPhone: '186****1111'
        }
      ]
      const orders = mockOrders.map(item => ({
        ...item,
        bookingTimeText: formatTime(item.bookingTime)
      }))
      orderList.value = orders
      loading.value = false
      return
    }

    const params = {
      pageNo: reset ? 1 : pageNo.value,
      pageSize: pageSize.value
    }
    // 全部订单不传status参数
    if (currentTab.value !== 0) {
      params.status = currentTab.value
    }
    const res = await getOrderPage(params)
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
  if (!timestamp) return ''
  const date = new Date(timestamp)
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
  uni.navigateTo({
    url: `/pages/order/detail?orderId=${order.orderId}&status=${order.status}&orderNo=${order.orderNo || ''}&serviceType=${order.serviceType || ''}&totalAmount=${order.totalAmount || ''}&bookingTimeText=${encodeURIComponent(order.bookingTimeText || '')}&createTimeText=${encodeURIComponent(order.createTimeText || '')}&venueName=${encodeURIComponent(order.venueName || '')}&venueAddress=${encodeURIComponent(order.venueAddress || '')}&venueLongitude=${order.venueLongitude || ''}&venueLatitude=${order.venueLatitude || ''}&userPhone=${encodeURIComponent(order.userPhone || '')}`
  })
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    10: '待付款',
    20: '待接单',
    30: '已接单',
    40: '进行中',
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
    20: 'warning',
    30: 'primary',
    40: 'primary',
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

onMounted(() => {
  fetchOrders(true)
})
</script>

<style lang="scss" scoped>
.order-list-wrapper {
  min-height: 100vh;
  background: $bg-page;
  display: flex;
  flex-direction: column;
}
.tab-bar-wrapper {
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 99;
  background: $bg-card;
}
.tab-bar {
  white-space: nowrap;
  background: $bg-card;
  padding: 0 16rpx;
  box-shadow: $shadow-sm;
}
.order-list-scroll {
  flex: 1;
  height: calc(100vh - 88rpx);
}
.tab-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: $text-secondary;
  padding: 24rpx 24rpx;
  position: relative;
  transition: color $duration-fast;
  &.active {
    color: $primary;
    font-weight: bold;
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40rpx;
      height: 6rpx;
      background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
      border-radius: 3rpx;
    }
  }
}
.order-list {
  padding: 24rpx;
}
.order-item {
  background: $bg-card;
  border-radius: $radius-xl;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: $shadow-sm;
  transition: transform $duration-base, box-shadow $duration-base;
  &:active {
    transform: scale(0.98);
  }
  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid $border-light;
    margin-bottom: 16rpx;
    .order-no {
      font-size: 26rpx;
      color: $text-primary;
    }
  }
  .order-info-row {
    display: flex;
    align-items: center;
    margin-bottom: 12rpx;
    .label {
      font-size: 26rpx;
      color: $text-tertiary;
    }
    .value {
      font-size: 26rpx;
      color: $text-secondary;
    }
    .price {
      color: $primary;
      font-weight: bold;
    }
  }
  .order-footer {
    text-align: right;
    padding-top: 12rpx;
    .arrow {
      font-size: 26rpx;
      color: $text-tertiary;
    }
  }
}
.empty-tip, .loading-tip {
  text-align: center;
  font-size: 26rpx;
  color: $text-tertiary;
  padding-top: 100rpx;
}
.no-more-tip {
  text-align: center;
  font-size: 24rpx;
  color: $text-tertiary;
  padding: 24rpx 0;
}
</style>