<template>
  <view class="order-list-wrapper">
    <!-- 订单状态分类栏 -->
    <view class="tab-bar">
      <text
          v-for="tab in tabs"
          :key="tab.value"
          class="tab-item"
          :class="{ active: currentTab === tab.value }"
          @click="currentTab = tab.value"
      >{{tab.label}}</text>
    </view>

    <!-- 订单列表 -->
    <view class="order-list" :style="{ paddingBottom: currentTab === 1 ? '160rpx' : '40rpx' }">
      <view
          v-for="order in orderList"
          v-show="currentTab === order.status"
          :key="order.orderNo"
          class="order-item"
          @click="goToDetail(order)"
      >
        <view class="order-header">
          <text class="order-no">订单号：{{order.orderNo}}</text>
          <uni-tag
              :text="order.status === 1 ? '进行中' : '已结束'"
              :type="order.status === 1 ? 'primary' : 'grey'"
              size="small"
          />
        </view>
        <view class="order-body">
          <view class="order-info-row">
            <text class="label">服务类型：</text>
            <text class="value">{{order.serviceName}}</text>
          </view>
          <view class="order-info-row">
            <text class="label">预约时间：</text>
            <text class="value">{{order.appointTime}}</text>
          </view>
          <view class="order-info-row">
            <text class="label">金额：</text>
            <text class="value price">¥{{order.price}}</text>
          </view>
        </view>
        <view class="order-footer">
          <text class="arrow">查看详情 ＞</text>
        </view>
      </view>
      <view class="empty-tip" v-if="!orderList.filter(item => item.status === currentTab).length">
        暂无订单
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const tabs = [
  { label: '进行中', value: 1 },
  { label: '历史订单', value: 2 }
]
const currentTab = ref(1)

// 模拟订单数据
const orderList = ref([
  {
    orderNo: '202603221430001',
    status: 1,
    serviceName: '台球助教',
    appointTime: '2026-03-22 14:30',
    price: 128,
    lat: 31.230416,
    lon: 121.473701,
    address: '上海市浦东新区XX路123号',
    shopName: 'XX台球厅（XX路店）',
    customerName: '李先生',
    customerPhone: '138****8888',
    duration: '1小时',
    usedSec: 120,
    leftSec: 2400
  },
  {
    orderNo: '202603211030001',
    status: 2,
    serviceName: '健身陪练',
    appointTime: '2026-03-21 10:30',
    price: 198,
    lat: 31.230416,
    lon: 121.473701,
    address: '上海市浦东新区XX路456号',
    shopName: 'XX健身工作室',
    customerName: '张女士',
    customerPhone: '135****6666',
    duration: '1.5小时',
  }
])

// 跳转到订单详情
const goToDetail = (order) => {
  uni.navigateTo({
    url: `/pages/order/detail?orderInfo=${encodeURIComponent(JSON.stringify(order))}&usedSec=${order.usedSec || 0}&leftSec=${order.leftSec || 0}`
  })
}
</script>

<style lang="scss" scoped>
.order-list-wrapper {
  min-height: 100vh;
  background: #F8F9FB;
}
.tab-bar {
  display: flex;
  background: #fff;
  padding: 0 24rpx;
  .tab-item {
    font-size: 28rpx;
    color: #666;
    padding: 24rpx 32rpx;
    position: relative;
    &.active {
      color: #2F6BEE;
      font-weight: bold;
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 6rpx;
        background: #2F6BEE;
        border-radius: 3rpx;
      }
    }
  }
}
.order-list {
  padding: 24rpx;
}
.order-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid #F0F0F0;
    margin-bottom: 16rpx;
    .order-no {
      font-size: 26rpx;
      color: #333;
    }
  }
  .order-info-row {
    display: flex;
    align-items: center;
    margin-bottom: 12rpx;
    .label {
      font-size: 26rpx;
      color: #666;
    }
    .value {
      font-size: 26rpx;
      color: #333;
    }
    .price {
      color: #2F6BEE;
      font-weight: bold;
    }
  }
  .order-footer {
    text-align: right;
    padding-top: 12rpx;
    .arrow {
      font-size: 26rpx;
      color: #999;
    }
  }
}
.empty-tip {
  text-align: center;
  font-size: 26rpx;
  color: #999;
  padding-top: 100rpx;
}
</style>