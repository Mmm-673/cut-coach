<template>
  <view class="evaluate-page">
    <!-- 顶部评分统计 -->
    <view class="score-header">
      <view class="score-main">
        <view class="score-num">
          <text class="score">{{ averageScore }}</text>
          <text class="total">/5.0</text>
        </view>
        <view class="stars">
          <uni-icons
              v-for="(item, index) in 5"
              :key="index"
              :type="index < Math.floor(averageScore) ? 'star-filled' : 'star'"
              size="24"
              color="#ff9500"
              ></uni-icons>
        </view>
        <view class="score-desc">
          累计收到评价 {{ totalCount }} 条 · 好评率 {{ goodRate }}
        </view>
      </view>
    </view>

    <!-- 评价标签 -->
    <view class="tag-card" v-if="tagList.length > 0">
      <view class="card-title">评价标签</view>
      <view class="tag-list">
        <view
            v-for="tag in tagList"
            :key="tag.name"
            class="tag-item"
            :style="getTagStyle(tag.name)"
        >
          <text class="tag-name">{{ tag.name }}</text>
          <text class="tag-count">({{ tag.count }})</text>
        </view>
      </view>
    </view>

    <!-- 全部评价列表 -->
    <view class="evaluate-list">
      <view class="list-title">全部评价</view>
      <scroll-view
          scroll-y
          class="scroll-container"
          refresher-enabled
          :refresher-triggered="refreshing"
          @refresherrefresh="onRefresh"
          @scrolltolower="handleLoadMore"
      >
        <view
            v-for="(item, index) in evaluateList"
            :key="item.reviewId"
            class="evaluate-item"
        >
          <!-- 用户信息 -->
          <view class="user-info">
            <image v-if="item.userAvatar" class="avatar" :src="item.userAvatar" mode="aspectFill"></image>
            <view v-else class="avatar avatar-placeholder">
              <uni-icons type="person" size="40" color="#ccc"></uni-icons>
            </view>
            <view class="user-detail">
              <view class="user-name">{{ item.userNickname }}</view>
              <view class="time">{{ formatTime(item.createTime) }}</view>
            </view>
            <view class="user-stars">
              <uni-icons
                  v-for="(s, i) in 5"
                  :key="i"
                  :type="i < item.star ? 'star-filled' : 'star'"
                  size="16"
                  color="#ff9500"
              ></uni-icons>
            </view>
          </view>

          <!-- 标签 -->
          <view class="item-tags" v-if="item.tags && item.tags.length > 0">
            <text v-for="t in item.tags" :key="t" class="item-tag" :style="getTagStyle(t)">{{ t }}</text>
          </view>

          <!-- 评价内容 -->
          <view class="content" v-if="item.content">{{ item.content }}</view>

          <!-- 评价图片 -->
          <view class="images-list" v-if="item.images && item.images.length > 0">
            <image v-for="(img, idx) in item.images" :key="idx" class="review-image" :src="img" mode="aspectFill" @click="previewImage(item.images, idx)"></image>
          </view>
        </view>

        <!-- 加载状态 -->
        <view v-if="loading" class="loading">加载中...</view>
        <view v-if="!loading && hasMore && evaluateList.length > 0" class="load-more">上拉加载更多</view>
        <view v-if="!hasMore && evaluateList.length > 0" class="no-more">已经到底啦~</view>
        <view v-if="!loading && evaluateList.length === 0" class="empty">暂无评价</view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getReviewPage } from '@/api/billiard/coach'

// 页面数据
const totalCount = ref(0)
const averageScore = ref(0)
const goodRate = ref('0%')

// 评价标签数据（临时）
const tagList = reactive([])

// 评价列表数据
const evaluateList = ref([])

// 分页加载状态
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)
const pageNo = ref(1)
const pageSize = ref(10)

// 标签颜色配置
const tagColors = [
  { bg: '#e3f2fd', color: '#1976d2' },    // 蓝色
  { bg: '#f3e5f5', color: '#7b1fa2' },    // 紫色
  { bg: '#e8f5e9', color: '#388e3c' },    // 绿色
  { bg: '#fff3e0', color: '#f57c00' },    // 橙色
  { bg: '#ffebee', color: '#d32f2f' },    // 红色
  { bg: '#fffde7', color: '#fbc02d' },    // 黄色
  { bg: '#e0f7fa', color: '#0097a7' },    // 青色
  { bg: '#fce4ec', color: '#c2185b' },    // 粉色
]

// 根据标签文本获取颜色（相同标签始终获得相同颜色）
const getTagStyle = (tagText) => {
  let hash = 0
  for (let i = 0; i < tagText.length; i++) {
    hash = tagText.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % tagColors.length
  return {
    backgroundColor: tagColors[index].bg,
    color: tagColors[index].color
  }
}

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

// 图片预览
const previewImage = (urls, currentIndex) => {
  uni.previewImage({
    urls: urls,
    current: currentIndex
  })
}

// 获取评价列表
const fetchReviewList = async (reset = false) => {
  if (loading.value) return

  if (reset) {
    pageNo.value = 1
    hasMore.value = true
  }

  loading.value = true
  try {
    const res = await getReviewPage({
      pageNo: pageNo.value,
      pageSize: pageSize.value
    })

    if (res.data && res.data.list) {
      const list = res.data.list

      if (reset) {
        evaluateList.value = list
      } else {
        evaluateList.value = [...evaluateList.value, ...list]
      }

      // 更新总数（第一页）
      if (reset && res.data.total) {
        totalCount.value = res.data.total
      }

      // 计算平均分（临时简单计算）
      if (evaluateList.value.length > 0) {
        const sum = evaluateList.value.reduce((acc, item) => acc + (item.star || 0), 0)
        averageScore.value = (sum / evaluateList.value.length).toFixed(1)
        const goodCount = evaluateList.value.filter(item => item.star >= 4).length
        goodRate.value = Math.round(goodCount / evaluateList.value.length * 100) + '%'
      }

      // 判断是否还有更多
      hasMore.value = list.length >= pageSize.value
      if (!reset) {
        pageNo.value++
      }

      // 从评价列表提取所有标签并统计
      updateTagList()
    }
  } catch (err) {
    console.error('获取评价列表失败', err)
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

// 更新标签列表（从评价中提取）
const updateTagList = () => {
  const tagMap = new Map()

  // 遍历所有评价，收集标签
  evaluateList.value.forEach(item => {
    if (item.tags && item.tags.length > 0) {
      item.tags.forEach(tag => {
        if (tagMap.has(tag)) {
          tagMap.set(tag, tagMap.get(tag) + 1)
        } else {
          tagMap.set(tag, 1)
        }
      })
    }
  })

  // 转换为数组并按数量降序排序
  tagList.length = 0
  tagMap.forEach((count, name) => {
    tagList.push({ name, count })
  })

  // 按数量降序排序
  tagList.sort((a, b) => b.count - a.count)
}

// 加载更多
const handleLoadMore = () => {
  if (loading.value || !hasMore.value) return
  fetchReviewList(false)
}

onMounted(() => {
  fetchReviewList(true)
})

onShow(() => {
  fetchReviewList(true)
})
</script>

<style lang="scss" scoped>
.evaluate-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

/* 顶部评分栏 */
.score-header {
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  padding: 60rpx 40rpx 80rpx;
  padding-top: calc(60rpx + var(--status-bar-height, 0px));
  position: relative;
  text-align: center;
}

.back-btn {
  position: absolute;
  left: 30rpx;
  top: 30rpx;
  z-index: 10;
}

.score-main {
  padding: 20rpx 0;
}

.score-num {
  font-size: 120rpx;
  font-weight: bold;
  color: #ffffff;
  line-height: 1.2;
  margin-bottom: 20rpx;
}

.score {
  font-size: 120rpx;
}

.total {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.7);
  font-weight: normal;
}

.stars {
  display: flex;
  justify-content: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.score-desc {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
}

/* 标签卡片 */
.tag-card {
  background: #ffffff;
  margin: -40rpx 30rpx 30rpx;
  border-radius: 24rpx;
  padding: 36rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 10;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 28rpx;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-item {
  padding: 14rpx 28rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-weight: 500;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.95);
  }
}

.tag-name {
  font-weight: 500;
}

.tag-count {
  opacity: 0.8;
  font-size: 26rpx;
}

/* 评价列表 */
.evaluate-list {
  flex: 1;
  padding: 0 30rpx 40rpx;
}

.list-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24rpx;
}

.scroll-container {
  height: calc(100vh - 520rpx);
}

.evaluate-item {
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

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.avatar {
  width: 88rpx;
  height: 88rpx;
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

.user-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
}

.time {
  font-size: 26rpx;
  color: #9ca3af;
}

.user-stars {
  display: flex;
  gap: 4rpx;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.item-tag {
  padding: 10rpx 24rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 500;
}

.content {
  font-size: 30rpx;
  color: #4b5563;
  line-height: 1.7;
  margin-bottom: 24rpx;
}

.images-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.review-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 16rpx;
  border: 2rpx solid #f3f4f6;
}

/* 加载状态 */
.loading, .load-more, .no-more, .empty {
  text-align: center;
  padding: 50rpx 0;
  font-size: 28rpx;
  color: #9ca3af;
}
</style>
