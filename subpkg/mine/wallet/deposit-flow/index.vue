<template>
  <view class="deposit-flow-page">
    <scroll-view
        scroll-y
        class="flow-list"
        :refresher-enabled="true"
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="handleLoadMore"
    >
      <view v-for="item in recordList" :key="item.id" class="flow-item">
        <view class="item-left">
          <view class="item-top-row">
            <view class="biz-tag" :class="bizTagClass(item)">
              {{ getBizTypeText(item.bizType) }}
            </view>
            <view class="item-time">{{ formatTime(item.createTime) }}</view>
          </view>
          <view class="item-reason" v-if="item.reason">{{ item.reason }}</view>
          <view class="item-balance">
            余额 ¥{{ formatDepositAmount(item.balanceAfter) }}
          </view>
          <!-- 关联订单：可跳转订单详情 -->
          <view
              class="item-ref link"
              v-if="item.orderId"
              @click="goOrderDetail(item)"
          >
            关联订单：{{ item.orderId }} >
          </view>
          <!-- 关联案件：本期仅展示，不跳转（助教案件详情接口未补齐） -->
          <view class="item-ref" v-if="item.caseId">关联案件：{{ item.caseId }}</view>
          <!-- 冲正关系：仅展示 -->
          <view class="item-ref" v-if="item.reversalOf">冲正流水：{{ item.reversalOf }}</view>
        </view>
        <view class="item-right">
          <view class="flow-amount" :class="signedAmount(item).isIncome ? 'income' : 'expense'">
            {{ signedAmount(item).text }}
          </view>
        </view>
      </view>

      <!-- 加载失败（可重试） -->
      <view v-if="loadFailed && !loading && recordList.length === 0" class="error-tip">
        <uni-icons type="info" size="48" :color="textTertiaryColor" />
        <text>加载失败，请稍后重试</text>
        <button class="retry-btn" @click="onRefresh">重新加载</button>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && !loadFailed && recordList.length === 0" class="empty-tip">
        <uni-icons type="info" size="48" :color="textTertiaryColor" />
        <text>暂无押金流水</text>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-tip">加载中...</view>
      <view v-if="!hasMore && recordList.length > 0" class="no-more-tip">已经到底啦~</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getDepositFlowPage } from '@/api/billiard/deposit'
import { formatDepositAmount, getBizTypeText, formatSignedAmount } from '@/utils/deposit'
import { usePageTheme, useThemeColor } from '@/utils/theme'

// 页面主题初始化
usePageTheme()

const textTertiaryColor = useThemeColor('textTertiary')

const PAGE_SIZE = 20

const recordList = ref([])
const pageNo = ref(1)
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)
const loadFailed = ref(false)
// 刷新失败后置位：触底加载先补一次重置，避免在旧 pageNo 上继续 append 重复页
const pendingReset = ref(false)

const signedAmount = (item) => formatSignedAmount(item.deltaAmount)

// 标签样式类按业务类型区分：处罚红色，其余（缴纳/未知类型）蓝色
const bizTagClass = (item) => (item.bizType === 'PENALTY' ? 'tag-penalty' : 'tag-payment')

const formatTime = (time) => {
  if (!time) return '—'
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const loadFlow = async (reset) => {
  if (loading.value) return
  if (pendingReset.value) reset = true
  if (!reset && !hasMore.value) return
  loading.value = true
  if (reset) {
    loadFailed.value = false
    pageNo.value = 1
    hasMore.value = true
  }
  try {
    const res = await getDepositFlowPage({ pageNo: pageNo.value, pageSize: PAGE_SIZE })
    const list = (res && res.data && res.data.list) || []
    const total = (res && res.data && res.data.total) || 0
    if (reset) {
      recordList.value = list
    } else {
      recordList.value = [...recordList.value, ...list]
    }
    hasMore.value = recordList.value.length < total
    pageNo.value = pageNo.value + 1
    pendingReset.value = false
  } catch (err) {
    uni.showToast({ title: typeof err === 'string' && err ? err : '加载失败', icon: 'none' })
    if (reset) {
      loadFailed.value = true
      pendingReset.value = true
    }
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const onRefresh = () => {
  refreshing.value = true
  loadFlow(true)
}

const handleLoadMore = () => {
  loadFlow(false)
}

// 关联订单跳转：orderId 按字符串透传，不做数值转换
const goOrderDetail = (item) => {
  uni.navigateTo({ url: `/subpkg/order/detail?orderId=${item.orderId}` })
}

onMounted(() => {
  loadFlow(true)
})
</script>

<style lang="scss" scoped>
.deposit-flow-page {
  height: 100vh;
  background: var(--bg-page, #f8fbff);
}

.flow-list {
  height: 100%;
  padding: 20rpx 30rpx;
  box-sizing: border-box;
}

.flow-item {
  display: flex;
  justify-content: space-between;
  background: var(--bg-card, #fff);
  border-radius: 24rpx;
  padding: 28rpx 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx var(--shadow-card, rgba(0, 0, 0, 0.05));
}

.item-left {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  flex: 1;
  min-width: 0;
}

.item-top-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.biz-tag {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;

  &.tag-payment {
    color: var(--color-primary, #2f6bee);
    background: rgba(47, 107, 238, 0.08);
  }

  &.tag-penalty {
    color: var(--color-danger, #ef4444);
    background: rgba(239, 68, 68, 0.08);
  }
}

.item-time {
  font-size: 24rpx;
  color: var(--text-tertiary, #9ca3af);
}

.item-reason {
  font-size: 28rpx;
  color: var(--text-primary, #1f2937);
  word-break: break-all;
}

.item-balance {
  font-size: 24rpx;
  color: var(--text-tertiary, #9ca3af);
}

.item-ref {
  font-size: 24rpx;
  color: var(--text-tertiary, #9ca3af);
  word-break: break-all;

  &.link {
    color: var(--color-primary, #2f6bee);
  }
}

.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
  margin-left: 20rpx;
}

.flow-amount {
  font-size: 32rpx;
  font-weight: bold;

  &.income {
    color: var(--color-success, #10b981);
  }

  &.expense {
    color: var(--color-danger, #ef4444);
  }
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 0;
  gap: 20rpx;
  font-size: 28rpx;
  color: var(--text-tertiary, #9ca3af);
}

.error-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 0;
  gap: 20rpx;
  font-size: 28rpx;
  color: var(--text-tertiary, #9ca3af);
}

.retry-btn {
  background: var(--color-primary, #2f6bee);
  color: #fff;
  font-size: 28rpx;
  border-radius: 40rpx;
  padding: 0 60rpx;
  line-height: 76rpx;

  &::after {
    border: none;
  }
}

.loading-tip,
.no-more-tip {
  text-align: center;
  padding: 30rpx 0;
  font-size: 26rpx;
  color: var(--text-tertiary, #9ca3af);
}
</style>
