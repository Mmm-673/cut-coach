<template>
  <view class="evaluate-page">
    <!-- 顶部评分统计 -->
    <view class="score-header">
<!---->
      <view class="score-main">
        <view class="score-num">
          <text class="score">4.9</text>
          <text class="total">/5.0</text>
        </view>
        <view class="stars">
          <uni-icons
              v-for="(item, index) in 5"
              :key="index"
              :type="index < 4.9 ? 'star-filled' : 'star'"
              size="20"
              color="#ff9500"
          ></uni-icons>
        </view>
        <view class="score-desc">
          累计收到评价 {{ totalCount }} 条 · 好评率 {{ goodRate }}
        </view>
      </view>
    </view>

    <!-- 评价标签 -->
    <view class="tag-card">
      <view class="card-title">评价标签</view>
      <view class="tag-list">
        <view
            v-for="tag in tagList"
            :key="tag.name"
            class="tag-item"
            :style="{ backgroundColor: tag.bgColor }"
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
          @scrolltolower="handleLoadMore"
      >
        <view
            v-for="(item, index) in evaluateList"
            :key="index"
            class="evaluate-item"
        >
          <!-- 用户信息 -->
          <view class="user-info">
            <image class="avatar" :src="item.avatar" mode="aspectFill"></image>
            <view class="user-detail">
              <view class="user-name">{{ item.name }}</view>
              <view class="time">{{ item.time }}</view>
            </view>
            <view class="user-stars">
              <uni-icons
                  v-for="(s, i) in 5"
                  :key="i"
                  :type="i < item.score ? 'star-filled' : 'star'"
                  size="16"
                  color="#ff9500"
              ></uni-icons>
            </view>
          </view>

          <!-- 标签 -->
          <view class="item-tags">
            <text v-for="t in item.tags" :key="t" class="item-tag">{{ t }}</text>
          </view>

          <!-- 评价内容 -->
          <view class="content">{{ item.content }}</view>

          <!-- 服务项目 -->
          <view class="service-info">{{ item.service }}</view>
        </view>

        <!-- 加载状态 -->
        <view v-if="loading" class="loading">加载中...</view>
        <view v-if="!loading && hasMore" class="load-more">上拉加载更多</view>
        <view v-if="!hasMore" class="no-more">已经到底啦~</view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'

// 页面数据
const totalCount = ref(128)
const goodRate = ref('98%')

// 评价标签数据
const tagList = reactive([
  { name: '球技专业', count: 86, bgColor: '#fff3e0' },
  { name: '态度友好', count: 78, bgColor: '#e6f0ff' },
  { name: '准时到达', count: 72, bgColor: '#e6ffe6' },
  { name: '教学耐心', count: 65, bgColor: '#f3e6ff' },
  { name: '经验丰富', count: 58, bgColor: '#ffe6e6' }
])

// 评价列表数据（模拟接口数据）
const evaluateList = reactive([
  {
    name: '李先生',
    avatar: '/static/avatar1.jpg',
    time: '今天 15:35',
    score: 5,
    tags: ['球技专业', '态度友好', '准时到达'],
    content: '张教练球技非常专业，教学也很有耐心，纠正了我很多错误动作，一个小时收获很大，下次还会约！',
    service: '服务项目：中式八球陪练 1小时 · XX台球厅（XX路店）'
  },
  {
    name: '王女士',
    avatar: '/static/avatar2.jpg',
    time: '昨天 12:15',
    score: 4.5,
    tags: ['教学耐心', '经验丰富'],
    content: '作为新手第一次学台球，张教练教的很细致，从握杆姿势到瞄准方法都讲的很清楚，两个小时就能打进球了，非常满意！',
    service: '服务项目：斯诺克教学 2小时 · XX台球俱乐部'
  },
  {
    name: '陈先生',
    avatar: '/static/avatar1.jpg',
    time: '2026-03-20 21:30',
    score: 5,
    tags: ['球技专业', '准时到达'],
    content: '陪练水平很高，打起来很过瘾，还教了我很多实战技巧，非常不错的体验。',
    service: '服务项目：中式八球陪练 2小时 · XX台球会所'
  }
])

// 分页加载状态
const loading = ref(false)
const hasMore = ref(true)

// 页面交互逻辑
const handleBack = () => {
  uni.navigateBack()
}

const handleLoadMore = () => {
  if (loading.value || !hasMore.value) return

  loading.value = true
  // 模拟接口请求
  setTimeout(() => {
    // 模拟追加数据
    const newData = [
      {
        name: '赵先生',
        avatar: '/static/avatar3.jpg',
        time: '2026-03-18 19:20',
        score: 5,
        tags: ['经验丰富', '态度友好'],
        content: '教练很专业，讲解清晰，对新手非常友好，强烈推荐！',
        service: '服务项目：中式八球教学 1小时 · XX台球城'
      }
    ]
    evaluateList.push(...newData)
    loading.value = false
    // 模拟没有更多数据
    if (evaluateList.length >= 10) {
      hasMore.value = false
    }
  }, 800)
}
</script>

<style scoped lang="scss">
.evaluate-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

/* 顶部评分栏 */
.score-header {
  background-color: #fff;
  padding: 30rpx;
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
  color: #ff9500;
  line-height: 1.2;
  margin-bottom: 20rpx;
}

.score {
  font-size: 120rpx;
}

.total {
  font-size: 32rpx;
  color: #999;
  font-weight: normal;
}

.stars {
  display: flex;
  justify-content: center;
  gap: 8rpx;
  margin-bottom: 20rpx;
}

.score-desc {
  font-size: 32rpx;
  color: #666;
}

/* 标签卡片 */
.tag-card {
  background-color: #fff;
  margin: 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.card-title {
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 30rpx;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.tag-item {
  padding: 12rpx 24rpx;
  border-radius: 40rpx;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.tag-name {
  color: #333;
  font-weight: 500;
}

.tag-count {
  color: #666;
}

/* 评价列表 */
.evaluate-list {
  flex: 1;
  padding: 0 30rpx 40rpx;
}

.list-title {
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 20rpx;
}

.scroll-container {
  height: calc(100vh - 500rpx);
}

.evaluate-item {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.user-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 34rpx;
  font-weight: 500;
  color: #333;
}

.time {
  font-size: 28rpx;
  color: #999;
}

.user-stars {
  display: flex;
  gap: 4rpx;
}

.item-tags {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.item-tag {
  background-color: #f0f0f0;
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #666;
}

.content {
  font-size: 32rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 30rpx;
}

.service-info {
  font-size: 28rpx;
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