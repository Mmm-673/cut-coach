<template>
  <view class="notification-page">
    <!-- 顶部 Tab 筛选栏 + 全部已读 -->
    <view class="tab-bar-wrapper">
      <view class="tab-bar">
        <view
          class="tab-item"
          :class="{ active: currentTab === item.value }"
          v-for="item in tabs"
          :key="item.value"
          @click="handleTabChange(item.value)"
        >
          <text>{{ item.label }}</text>
          <view class="tab-underline"></view>
        </view>
      </view>
      <view
        class="read-all-btn"
        :class="{ disabled: !unreadCount }"
        @click="handleReadAll"
      >
        全部已读
      </view>
    </view>

    <!-- 通知列表 -->
    <scroll-view
      class="list-scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <view class="notification-list">
        <view
          v-for="item in list"
          :key="item.id"
          class="notification-item"
          :class="{ 'is-top': item.topFlag }"
          @click="goToDetail(item)"
        >
          <!-- 未读红点 -->
          <view class="unread-dot" v-if="item.readStatus === 0"></view>

          <view class="item-header">
            <view
              class="type-tag"
              :style="{ background: getTypeConfig(item.type).bgColor, color: getTypeConfig(item.type).color }"
            >
              {{ getTypeConfig(item.type).label }}
            </view>
            <view class="top-tag" v-if="item.topFlag">
              <text>置顶</text>
            </view>
            <text class="publish-time">{{ formatTime(item.publishTime) }}</text>
          </view>

          <view class="item-title">
            {{ item.title }}
          </view>

          <view class="item-summary">
            {{ item.summary }}
          </view>
        </view>

        <!-- 空状态 -->
        <view class="empty-tip" v-if="!list.length && !loading">
          <uni-icons type="info" size="48" color="#d1d5db" />
          <text>暂无通知</text>
        </view>

        <!-- 加载更多提示 -->
        <view class="load-more-tip" v-if="loading">
          <text>加载中...</text>
        </view>
        <view class="load-more-tip no-more" v-if="!hasMore && list.length > 0 && !loading">
          <text>没有更多了</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getNotificationPage } from '@/api/billiard/notification'
import { useNotificationStore } from '@/store/modules/notification'

const notificationStore = useNotificationStore()

const unreadCount = computed(() => notificationStore.unreadCount)

// 时间格式化（兼容时间戳和 ISO 字符串）
const formatTime = (time) => {
  if (!time) return ''
  let date
  // 如果是数字时间戳（秒或毫秒）
  if (typeof time === 'number' || /^\d+$/.test(String(time))) {
    const t = Number(time)
    // 秒级时间戳转毫秒
    date = new Date(t < 1e12 ? t * 1000 : t)
  } else {
    date = new Date(time)
  }
  if (isNaN(date.getTime())) return time
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}

// Tab 配置
const tabs = [
  { label: '全部', value: 'all' },
  { label: '未读', value: 'unread' },
  { label: '已读', value: 'read' }
]

const currentTab = ref('all')
const list = ref([])
const pageNo = ref(1)
const pageSize = 10
const hasMore = ref(true)
const loading = ref(false)
const refreshing = ref(false)

// 通知类型配置
const typeConfig = {
  1: { label: '重大通知', color: '#ef4444', bgColor: '#fef2f2' },
  2: { label: '公告', color: '#2f6bff', bgColor: '#eff4ff' },
  3: { label: '活动', color: '#f59e0b', bgColor: '#fffbeb' },
  4: { label: '版本更新', color: '#10b981', bgColor: '#f0fdf4' },
  5: { label: '打赏播报', color: '#ec4899', bgColor: '#fdf2f8' }
}

const getTypeConfig = (type) => {
  return typeConfig[type] || { label: '通知', color: '#6b7280', bgColor: '#f3f4f6' }
}

// 切换 Tab
const handleTabChange = (val) => {
  if (currentTab.value === val) return
  currentTab.value = val
  resetList()
  fetchList()
}

// 获取 readStatus 参数
const getReadStatus = () => {
  if (currentTab.value === 'unread') return 0
  if (currentTab.value === 'read') return 1
  return undefined
}

// 重置列表
const resetList = () => {
  pageNo.value = 1
  hasMore.value = true
  list.value = []
}

// 请求列表
const fetchList = () => {
  if (loading.value || !hasMore.value) return
  loading.value = true

  const params = {
    pageNo: pageNo.value,
    pageSize: pageSize
  }
  const readStatus = getReadStatus()
  if (readStatus !== undefined) {
    params.readStatus = readStatus
  }

  getNotificationPage(params).then(res => {
    if (res.code === 0 || res.code === 200) {
      const records = res.data?.records || res.data?.list || []
      if (pageNo.value === 1) {
        list.value = records
      } else {
        list.value = [...list.value, ...records]
      }
      hasMore.value = records.length >= pageSize
    }
  }).catch(() => {
    // 错误处理
  }).finally(() => {
    loading.value = false
    refreshing.value = false
  })
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  resetList()
  fetchList()
  notificationStore.fetchUnreadCount()
}

// 上拉加载更多
const onLoadMore = () => {
  if (hasMore.value && !loading.value) {
    pageNo.value++
    fetchList()
  }
}

// 全部已读
const handleReadAll = () => {
  if (!unreadCount.value) return
  uni.showModal({
    title: '提示',
    content: '确定将全部通知标记为已读？',
    success: (res) => {
      if (res.confirm) {
        notificationStore.markAllRead().then(() => {
          // 刷新当前列表，将未读的都置为已读
          list.value = list.value.map(item => ({ ...item, readStatus: 1 }))
          uni.showToast({ title: '已全部标记为已读', icon: 'success' })
        })
      }
    }
  })
}

// 跳转到详情
const goToDetail = (item) => {
  uni.navigateTo({
    url: `/subpkg/notification/detail?id=${item.id}`
  })
}

onShow(() => {
  notificationStore.fetchUnreadCount()
  // 从详情页返回时，刷新列表第一页（保持已读状态同步）
  if (list.value.length > 0) {
    pageNo.value = 1
    hasMore.value = true
    fetchList()
  }
})

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
$primary: #2f6bff;
$text-primary: #1f2937;
$text-secondary: #6b7280;
$text-tertiary: #9ca3af;
$bg-page: #f7f8fa;
$bg-card: #ffffff;
$border-light: #f3f4f6;
$radius-base: 16rpx;

.notification-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $bg-page;
}

/* Tab 栏 */
.tab-bar-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32rpx;
  background: $bg-card;
  border-bottom: 1rpx solid $border-light;
  position: relative;
  z-index: 10;
}

.tab-bar {
  display: flex;
  align-items: center;
  flex: 1;
}

.tab-item {
  position: relative;
  padding: 28rpx 0;
  margin-right: 48rpx;
  font-size: 30rpx;
  color: $text-secondary;
  transition: color 0.3s;

  text {
    position: relative;
    z-index: 1;
  }

  &.active {
    color: $primary;
    font-weight: 600;

    .tab-underline {
      width: 32rpx;
      opacity: 1;
    }
  }
}

.tab-underline {
  position: absolute;
  bottom: 16rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 6rpx;
  background: $primary;
  border-radius: 3rpx;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.21, 0.64, 0.29, 0.99);
}

.read-all-btn {
  font-size: 26rpx;
  color: $primary;
  padding: 12rpx 0;

  &.disabled {
    color: $text-tertiary;
    pointer-events: none;
  }
}

/* 列表滚动区 */
.list-scroll {
  flex: 1;
  overflow: hidden;
}

.notification-list {
  padding: 24rpx 32rpx;
}

/* 通知项 */
.notification-item {
  position: relative;
  padding: 28rpx 28rpx 28rpx 28rpx;
  margin-bottom: 20rpx;
  background: $bg-card;
  border-radius: $radius-base;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

  &.is-top {
    background: linear-gradient(135deg, #fff 0%, #fef9f5 100%);
  }
}

.unread-dot {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  width: 16rpx;
  height: 16rpx;
  background: #ef4444;
  border-radius: 50%;
}

.item-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.type-tag {
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
  line-height: 1.4;
  margin-right: 14rpx;
}

.top-tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  background: linear-gradient(135deg, #ff7a45 0%, #ff4d4f 100%);
  color: #fff;
  border-radius: 6rpx;
  line-height: 1.4;
  margin-right: auto;
}

.publish-time {
  font-size: 24rpx;
  color: $text-tertiary;
  margin-left: auto;
}

.item-title {
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 600;
  line-height: 1.5;
  margin-bottom: 12rpx;
  padding-right: 32rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-summary {
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 空状态 */
.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
  color: $text-tertiary;
  font-size: 28rpx;

  uni-icons {
    margin-bottom: 24rpx;
  }
}

/* 加载更多 */
.load-more-tip {
  text-align: center;
  padding: 30rpx 0;
  font-size: 24rpx;
  color: $text-tertiary;

  &.no-more {
    color: $text-tertiary;
  }
}
</style>
