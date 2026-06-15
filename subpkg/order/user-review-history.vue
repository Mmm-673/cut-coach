<template>
  <view class="user-review-history-page">
<!--    &lt;!&ndash; 顶部导航栏 &ndash;&gt;-->
<!--    <view class="nav-header">-->
<!--      <view class="back-btn" @click="goBack">-->
<!--        <uni-icons type="left" size="24" color="#1f2937"></uni-icons>-->
<!--      </view>-->
<!--      <view class="nav-title">用户历史评价</view>-->
<!--      <view class="nav-placeholder"></view>-->
<!--    </view>-->

    <!-- 顶部用户信息 -->
    <view class="user-header" v-if="userName">
      <view class="user-avatar-wrapper">
        <image v-if="userAvatar" class="user-avatar" :src="userAvatar" mode="aspectFill"></image>
        <view v-else class="user-avatar user-avatar-placeholder">
          <uni-icons type="person" size="50" color="#ccc"></uni-icons>
        </view>
      </view>
      <view class="user-info-wrapper">
        <view class="user-name">{{ userName }}</view>
        <view class="user-stats">
          <text class="stat-item">共 {{ totalCount }} 条评价</text>
          <text class="stat-divider">·</text>
          <text class="stat-item">平均 {{ averageScore }} 分</text>
        </view>
      </view>
    </view>

    <!-- 评价列表 -->
    <view class="review-list">
      <scroll-view
          scroll-y
          class="scroll-container"
          refresher-enabled
          :refresher-triggered="refreshing"
          @refresherrefresh="onRefresh"
          @scrolltolower="handleLoadMore"
      >
        <view
            v-for="(item, index) in reviewList"
            :key="item.reviewId"
            class="review-item"
        >
          <!-- 评价者信息 -->
          <view class="coach-info">
            <image v-if="item.coachAvatar" class="coach-avatar" :src="item.coachAvatar" mode="aspectFill"></image>
            <view v-else class="coach-avatar coach-avatar-placeholder">
              <uni-icons type="person" size="36" color="#ccc"></uni-icons>
            </view>
            <view class="coach-detail">
              <view class="coach-name">{{ item.coachStageName || '裁教' }}</view>
              <view class="time">{{ formatTime(item.createTime) }}</view>
            </view>
            <view class="coach-stars">
              <uni-icons
                  v-for="(s, i) in 5"
                  :key="i"
                  :type="i < item.star ? 'star-filled' : 'star'"
                  size="16"
                  color="#ff9500"
              ></uni-icons>
            </view>
          </view>

          <!-- 评价内容 -->
          <view class="content" v-if="item.content">{{ item.content }}</view>
        </view>

        <!-- 加载状态 -->
        <view v-if="loading" class="loading">加载中...</view>
        <view v-if="!loading && hasMore && reviewList.length > 0" class="load-more">上拉加载更多</view>
        <view v-if="!hasMore && reviewList.length > 0" class="no-more">已经到底啦~</view>
        <view v-if="!loading && reviewList.length === 0" class="empty">暂无评价</view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getUserReviewHistoryPage } from '@/api/billiard/coach'

// 路由参数
const userId = ref(null)
const userName = ref('')
const userAvatar = ref('')

// 页面数据
const totalCount = ref(0)
const averageScore = ref(0)

// 评价列表数据
const reviewList = ref([])

// 分页加载状态
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)
const pageNo = ref(1)
const pageSize = ref(10)

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`
  const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
  const time = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`

  if (dateStr === today) {
    return `今天 ${time}`
  } else if (dateStr === yesterdayStr) {
    return `昨天 ${time}`
  }
  return `${dateStr} ${time}`
}

// 获取评价列表
const fetchReviewList = async (reset = false) => {
  if (loading.value) return
  if (!userId.value) return

  if (reset) {
    pageNo.value = 1
    hasMore.value = true
  }

  loading.value = true
  try {
    const res = await getUserReviewHistoryPage({
      userId: userId.value,
      pageNo: pageNo.value,
      pageSize: pageSize.value
    })

    if (res.data && res.data.list) {
      const list = res.data.list

      if (reset) {
        reviewList.value = list
      } else {
        reviewList.value = [...reviewList.value, ...list]
      }

      // 更新总数（第一页）
      if (reset && res.data.total !== undefined) {
        totalCount.value = res.data.total
      }

      // 计算平均分
      if (reviewList.value.length > 0) {
        const sum = reviewList.value.reduce((acc, item) => acc + (item.star || 0), 0)
        averageScore.value = (sum / reviewList.value.length).toFixed(1)
      }

      // 判断是否还有更多
      hasMore.value = list.length >= pageSize.value
      if (!reset) {
        pageNo.value++
      }
    }
  } catch (err) {
    console.error('获取用户历史评价失败', err)
    uni.showToast({
      title: '获取评价失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true
  await fetchReviewList(true)
}

// 加载更多
const handleLoadMore = () => {
  if (loading.value || !hasMore.value) return
  fetchReviewList(false)
}

// 页面加载
onLoad((options) => {
  userId.value = options.userId ? parseInt(options.userId) : null
  userName.value = decodeURIComponent(options.userName) || ''
  userAvatar.value = decodeURIComponent(options.userAvatar) || ''

  if (userId.value) {
    fetchReviewList(true)
  }
})

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.user-review-history-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

/* 导航栏 */
.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 30rpx 20rpx;
  padding-top: calc(30rpx + var(--status-bar-height, 0px));
  background: #ffffff;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1f2937;
}

.nav-placeholder {
  width: 60rpx;
}

/* 用户信息头部 */
.user-header {
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  padding: 40rpx 30rpx 50rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.user-avatar-wrapper {
  flex-shrink: 0;
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  &-placeholder {
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.user-info-wrapper {
  flex: 1;
}

.user-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12rpx;
}

.user-stats {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}

.stat-divider {
  opacity: 0.6;
}

/* 评价列表 */
.review-list {
  flex: 1;
  padding: 30rpx;
}

.scroll-container {
  height: calc(100vh - 320rpx);
}

.review-item {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.coach-info {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.coach-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  border: 3rpx solid #f3f4f6;
  &-placeholder {
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.coach-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.coach-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
}

.time {
  font-size: 26rpx;
  color: #9ca3af;
}

.coach-stars {
  display: flex;
  gap: 4rpx;
}

.content {
  font-size: 30rpx;
  color: #4b5563;
  line-height: 1.7;
}

/* 加载状态 */
.loading, .load-more, .no-more, .empty {
  text-align: center;
  padding: 50rpx 0;
  font-size: 28rpx;
  color: #9ca3af;
}
</style>