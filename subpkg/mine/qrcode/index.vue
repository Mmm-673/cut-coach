<template>
  <view class="qrcode-page">
    <!-- 头部信息 -->
    <view class="header-section">
      <view class="avatar-wrapper">
        <image class="avatar" :src="coachProfile.avatar || '/static/images/default-avatar.png'" mode="aspectFill"></image>
      </view>
      <view class="user-info">
        <view class="user-name">{{ coachProfile.stageName || '助教' }}</view>
      </view>
    </view>

    <!-- 二维码区域 -->
    <view class="qrcode-section">
      <view class="qrcode-card">
        <view class="qrcode-title">我的二维码</view>
        <view class="qrcode-desc">扫码查看教练信息</view>

        <view class="qrcode-wrapper" @longpress="handleLongPress">
          <uqrcode
              v-if="isLoaded"
              ref="uqrcodeRef"
              canvas-id="coach-qrcode"
              :value="qrcodeValue"
              :size="200"
              :options="{ margin: 10 }"
              @complete="onQrcodeComplete"
          ></uqrcode>

          <!-- 二维码中心头像 -->
          <view class="qrcode-avatar" v-if="isLoaded && coachProfile.avatar">
            <image class="avatar-img" :src="coachProfile.avatar" mode="aspectFill"></image>
          </view>

          <view v-else class="loading-placeholder" style="width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; color: #999;">
            二维码生成中...
          </view>
        </view>

        <!-- 用于合成图片的隐藏 canvas -->
        <canvas canvas-id="composite-canvas" style="width: 200px; height: 200px; position: absolute; left: -9999rpx;"></canvas>

        <view class="qrcode-tip">
          <uni-icons type="info" size="16" color="#9ca3af"></uni-icons>
          <text>长按二维码或点击下方按钮保存</text>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-section">
      <button class="save-btn" @click="saveQrcode">
        <uni-icons type="download" size="18" color="#fff"></uni-icons>
        <text>保存二维码</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue' // 引入 nextTick
import { getCoachProfile } from '@/api/billiard/coach'

const uqrcodeRef = ref(null)
const qrcodeFilePath = ref('')
const isLoaded = ref(false) // 👈 新增：标记数据是否加载完毕

// 教练档案
const coachProfile = ref({
  coachId: '',
  stageName: '',
  level: 0,
  mobile: '',
  avatar: ''
})

// 二维码内容
const qrcodeValue = computed(() => {
  // 如果连 ID 都没有，直接返回空，配合 v-if 阻断渲染
  if (!coachProfile.value.coachId) return ''

  return JSON.stringify({
    type: 'coach',
    coachId: coachProfile.value.coachId,
    name: coachProfile.value.stageName
  })
})

// 获取教练档案
const fetchCoachProfile = async () => {
  try {
    const res = await getCoachProfile()
    if (res && res.data) {
      coachProfile.value = {
        coachId: res.data.id || '',
        stageName: res.data.stageName || res.data.name || '助教',
        level: res.data.level ?? 0,
        mobile: res.data.mobile || '',
        avatar: res.data.avatar || ''
      }

      // 👈 核心修改：如果拿到了有效 coachId，开启渲染开关
      if (coachProfile.value.coachId) {
        isLoaded.value = true
        // 👇 核心修复：等待 DOM 渲染完成后，手动触发二维码绘制
        nextTick(() => {
          console.log('====== uqrcode实例 ======')
          console.log(uqrcodeRef.value)

          if (uqrcodeRef.value) {
            console.log('实例属性：')
            console.log(Object.keys(uqrcodeRef.value))
          }

          if (uqrcodeRef.value && typeof uqrcodeRef.value.make === 'function') {
            uqrcodeRef.value.make()
          }
        })
      } else {
        console.error('后台返回的教练ID为空，无法生成二维码')
      }
    }
  } catch (err) {
    console.error('获取教练档案失败', err)
  }
}

const onQrcodeComplete = (res) => {
  console.log('====== 二维码完成回调 ======')
  console.log('res类型：', typeof res)
  console.log('res值：', res)
  console.log('res对象属性：', res ? Object.keys(res) : 'undefined')

  if (typeof res === 'string') {
    qrcodeFilePath.value = res
  } else if (res && res.tempFilePath) {
    qrcodeFilePath.value = res.tempFilePath
  } else if (res && res.success) {
    qrcodeFilePath.value = res.tempFilePath || ''
  } else if (res) {
    // 如果以上条件都不满足，尝试直接将 res 作为图片路径
    qrcodeFilePath.value = res
  }

  console.log('最终图片路径：', qrcodeFilePath.value)
}

// 长按事件
const handleLongPress = () => {
  // #ifdef H5
  uni.showModal({
    title: '提示',
    content: '请长按二维码图片进行保存',
    showCancel: false
  })
  // #endif

  // #ifndef H5
  saveQrcode()
  // #endif
}

const saveQrcode = () => {
  const instance = uqrcodeRef.value

  if (!instance) {
    uni.showToast({
      title: '二维码未生成',
      icon: 'none'
    })
    return
  }

  uni.showLoading({
    title: '保存中...'
  })

  instance.save({
    success: () => {
      uni.showToast({
        title: '已保存到相册',
        icon: 'success'
      })
    },
    fail: (err) => {
      console.error('保存失败', err)

      uni.showToast({
        title: '保存失败',
        icon: 'none'
      })
    },
    complete: () => {
      uni.hideLoading()
    }
  })
}

onMounted(() => {
  fetchCoachProfile()
})
</script>

<style lang="scss" scoped>
.qrcode-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  padding: 40rpx 32rpx 80rpx;
  box-sizing: border-box; /* 防止 padding 撑开宽度 */
}

/* 头部信息 */
.header-section {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 40rpx 32rpx;
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  border-radius: 32rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(47, 107, 238, 0.2);
}

.avatar-wrapper {
  padding: 4rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 4rpx solid rgba(255, 255, 255, 0.5);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
}

.user-id {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 二维码区域 */
.qrcode-section {
  margin-bottom: 48rpx;
}

.qrcode-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 48rpx 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qrcode-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8rpx;
}

.qrcode-desc {
  font-size: 26rpx;
  color: #6b7280;
  margin-bottom: 48rpx;
}

.qrcode-wrapper {
  background: #fff;
  padding: 24rpx;
  border-radius: 24rpx;
  border: 2rpx solid #f3f4f6;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.qrcode-avatar {
  position: absolute;
  width: 85rpx;
  height: 85rpx;
  border-radius: 20%;
  border: 4rpx solid #fff;
  overflow: hidden;
  background: #fff;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 20%;
}

.qrcode-tip {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 32rpx;
  font-size: 24rpx;
  color: #9ca3af;
}

/* 操作按钮 */
.action-section {
  padding: 0 16rpx;
}

.save-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  color: #fff;
  border-radius: 24rpx;
  border: none;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 24rpx rgba(47, 107, 238, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin: 0;
  padding: 0;
}

.save-btn::after {
  border: none; /* 移除 uni 按钮自带的黑边框 */
}

.save-btn:active {
  transform: scale(0.97);
}
</style>