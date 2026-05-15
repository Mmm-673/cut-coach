<template>
  <view class="info-container">
    <!-- 头像区域 -->
    <view class="avatar-section" @click="goEditAvatar">
      <image class="avatar" :src="coachInfo.avatar || '/static/images/default-avatar.png'" mode="aspectFill"></image>
      <view class="change-avatar">
        <uni-icons type="camera" size="18" color="#fff"></uni-icons>
      </view>
    </view>

    <!-- 信息列表 -->
    <view class="info-list">
      <view class="info-item">
        <view class="label">艺名</view>
        <view class="value">{{ coachInfo.stageName || '-' }}</view>
      </view>
      <view class="info-item">
        <view class="label">手机号</view>
        <view class="value">{{ coachInfo.mobile || '-' }}</view>
      </view>
      <view class="info-item">
        <view class="label">助教等级</view>
        <view class="value">{{ levelName }}</view>
      </view>
      <view class="info-item">
        <view class="label">简介</view>
        <view class="value">{{ coachInfo.introduction || '暂无简介' }}</view>
      </view>
      <view class="info-item" v-if="coachInfo.commissionRate">
        <view class="label">佣金比例</view>
        <view class="value">{{ coachInfo.commissionRate }}%</view>
      </view>
    </view>

    <!-- 编辑按钮 -->
    <view class="edit-btn" @click="goEdit">
      <uni-icons type="compose" size="20" color="#fff"></uni-icons>
      <text>编辑资料</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCoachProfile } from '@/api/billiard/coach'

const coachInfo = ref({})

// 等级映射
const levelNameMap = {
  0: '初级助教',
  1: '中级助教',
  2: '高级助教'
}

const levelName = computed(() => {
  return levelNameMap[coachInfo.value.level] || '普通助教'
})

// 获取教练信息
const fetchCoachInfo = async () => {
  try {
    const res = await getCoachProfile()
    if (res.data) {
      coachInfo.value = res.data
    }
  } catch (err) {
    console.error('获取教练信息失败', err)
    uni.showToast({
      title: '获取信息失败',
      icon: 'none'
    })
  }
}

// 跳转到编辑头像
const goEditAvatar = () => {
  uni.navigateTo({ url: '/pages/mine/avatar/index' })
}

// 跳转到编辑资料
const goEdit = () => {
  uni.navigateTo({ url: '/pages/mine/info/edit' })
}

onShow(() => {
  fetchCoachInfo()
})

onMounted(() => {
  fetchCoachInfo()
})
</script>

<style lang="scss" scoped>
.info-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  padding: 40rpx 24rpx;
}

/* 头像区域 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50rpx 0;
  position: relative;
}

.avatar {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  border: 5rpx solid #fff;
  box-shadow: 0 4rpx 16rpx rgba(47, 107, 238, 0.15);
}

.change-avatar {
  position: absolute;
  bottom: 40rpx;
  left: 50%;
  transform: translateX(45rpx);
  width: 56rpx;
  height: 56rpx;
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid #fff;
  box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.3);
}

/* 信息列表 */
.info-list {
  background-color: #fff;
  border-radius: 24rpx;
  margin-top: 30rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 28rpx;
  border-bottom: 1rpx solid #f3f4f6;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  font-size: 30rpx;
  color: #374151;
  font-weight: 500;
}

.info-item .value {
  font-size: 28rpx;
  color: #6b7280;
  max-width: 420rpx;
  text-align: right;
  word-break: break-all;
  line-height: 1.5;
}

/* 编辑按钮 */
.edit-btn {
  margin-top: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  border-radius: 24rpx;
  font-size: 30rpx;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx rgba(47, 107, 238, 0.3);
  transition: transform 0.2s;
  &:active {
    transform: scale(0.98);
  }
}
</style>
