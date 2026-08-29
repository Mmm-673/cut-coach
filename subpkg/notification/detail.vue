<template>
  <view class="detail-page">
    <view class="detail-card" v-if="detail">
      <!-- 类型标签 -->
      <view
        class="type-tag"
        :style="{ background: getTypeConfig(detail.type).bgColor, color: getTypeConfig(detail.type).color }"
      >
        {{ getTypeConfig(detail.type).label }}
      </view>

      <!-- 标题 -->
      <view class="detail-title">{{ detail.title }}</view>

      <!-- 发布时间 -->
      <view class="publish-time">{{ formatTime(detail.publishTime) }}</view>

      <!-- 分割线 -->
      <view class="divider"></view>

      <!-- 正文内容（支持 HTML，图片自适应） -->
      <view class="detail-content">
        <rich-text :nodes="formattedContent"></rich-text>
      </view>
    </view>

    <!-- 加载中 -->
    <view class="loading-tip" v-if="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getNotificationDetail, readNotification } from '@/api/billiard/notification'
import { useNotificationStore } from '@/store/modules/notification'

const notificationStore = useNotificationStore()

const detail = ref(null)
const loading = ref(false)
let notificationId = null

// 时间格式化（兼容时间戳和 ISO 字符串）
const formatTime = (time) => {
  if (!time) return ''
  let date
  if (typeof time === 'number' || /^\d+$/.test(String(time))) {
    const t = Number(time)
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

// 处理富文本内容：图片自适应
const formattedContent = computed(() => {
  let html = detail.value?.content || ''
  if (!html) return ''
  // 给所有 img 标签加上 max-width:100%;height:auto; 保证图片不超出屏幕
  html = html.replace(/<img\b([^>]*)>/gi, (match, attrs) => {
    const hasStyle = /\sstyle=/i.test(attrs)
    if (hasStyle) {
      // 已有 style 属性，追加样式
      return match.replace(
        /\sstyle="([^"]*)"/i,
        ' style="$1;max-width:100%;height:auto;display:block;"'
      )
    } else {
      // 没有 style 属性，加上
      return `<img style="max-width:100%;height:auto;display:block;"${attrs}>`
    }
  })
  return html
})

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

// 加载详情
const fetchDetail = () => {
  if (!notificationId) return
  loading.value = true

  getNotificationDetail(notificationId).then(res => {
    if (res.code === 0 || res.code === 200) {
      detail.value = res.data
      // 加载成功后标记已读
      markAsRead()
    }
  }).catch(() => {
    // 错误处理
  }).finally(() => {
    loading.value = false
  })
}

// 标记已读
const markAsRead = () => {
  if (!notificationId) return
  readNotification(notificationId).then(res => {
    if (res.code === 0 || res.code === 200) {
      notificationStore.fetchUnreadCount()
    }
  })
}

onLoad((options) => {
  notificationId = options.id
  fetchDetail()
})

onMounted(() => {
  // 设置导航栏标题
  uni.setNavigationBarTitle({ title: '通知详情' })
})
</script>

<style lang="scss" scoped>
$text-primary: #1f2937;
$text-secondary: #6b7280;
$text-tertiary: #9ca3af;
$bg-page: #f7f8fa;
$bg-card: #ffffff;
$border-light: #f3f4f6;
$radius-xl: 24rpx;

.detail-page {
  min-height: 100vh;
  background: $bg-page;
  padding: 32rpx;
  box-sizing: border-box;
}

.detail-card {
  background: $bg-card;
  border-radius: $radius-xl;
  padding: 40rpx 32rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.type-tag {
  display: inline-block;
  font-size: 24rpx;
  padding: 6rpx 18rpx;
  border-radius: 8rpx;
  line-height: 1.4;
  margin-bottom: 24rpx;
}

.detail-title {
  font-size: 36rpx;
  font-weight: 700;
  color: $text-primary;
  line-height: 1.5;
  margin-bottom: 16rpx;
}

.publish-time {
  font-size: 26rpx;
  color: $text-tertiary;
  margin-bottom: 32rpx;
}

.divider {
  height: 1rpx;
  background: $border-light;
  margin-bottom: 32rpx;
}

.detail-content {
  font-size: 28rpx;
  color: $text-secondary;
  line-height: 1.8;

  text {
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.loading-tip {
  text-align: center;
  padding: 120rpx 0;
  font-size: 28rpx;
  color: $text-tertiary;
}
</style>
