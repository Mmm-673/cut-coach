<template>
  <view class="splash-container">
    <text class="loading-text">{{ loadingText }}</text>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAccessToken, getRefreshToken, getUserId } from '@/utils/auth'

const loadingText = ref('正在加载...')

onMounted(() => {
  console.log('=== 启动页加载 ===')

  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()
  const userId = getUserId()

  console.log('Token 检查:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    userId: userId
  })

  if (accessToken || refreshToken) {
    console.log('已登录，跳首页')
    loadingText.value = '已登录，跳转中...'
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/work/index',
        success: () => console.log('跳转成功'),
        fail: (err) => console.error('跳转失败:', err)
      })
    }, 300)
  } else {
    console.log('未登录，跳登录页')
    loadingText.value = '未登录，跳转中...'
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/login/index',
        success: () => console.log('跳转成功'),
        fail: (err) => console.error('跳转失败:', err)
      })
    }, 300)
  }
})
</script>

<style lang="scss" scoped>
.splash-container {
  min-height: 100vh;
  background: #f8fbff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: var(--status-bar-height);
}

.loading-text {
  font-size: 32rpx;
  color: #333;
}
</style>
