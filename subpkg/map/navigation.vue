<template>
  <view class="map-navigation-wrapper">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="nav-back" @click="goBack">
        <uni-icons type="back" size="22" :color="textColor" />
      </view>
      <view class="nav-title">地图导航</view>
      <view class="nav-placeholder"></view>
    </view>

    <!-- 地图主体 -->
    <map
      class="map"
      :latitude="centerLat"
      :longitude="centerLon"
      :markers="markers"
      :scale="scale"
      @markertap="handleMarkerTap"
      show-location
      enable-traffic
    ></map>

    <!-- 目的地信息卡片 -->
    <view class="dest-card">
      <view class="card-header">
        <uni-icons type="location" size="20" :color="primaryColor"></uni-icons>
        <text class="card-title">目的地</text>
      </view>
      <view class="dest-info">
        <text class="dest-name">{{ destName }}</text>
        <text class="dest-address">{{ destAddress || '暂无地址信息' }}</text>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="footer">
      <button class="btn-nav" @click="startNavigation">
        <uni-icons type="paperplane" size="20" color="#fff"></uni-icons>
        <text>开始导航</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getLocation } from '@/utils/platform.js'
import { usePageTheme, useThemeColor } from '@/utils/theme'

// 页面主题初始化
usePageTheme()

const primaryColor = useThemeColor('primary')
const textColor = useThemeColor('text')

const destLat = ref(0)
const destLon = ref(0)
const destName = ref('')
const destAddress = ref('')

const centerLat = ref(0)
const centerLon = ref(0)
const scale = ref(14)
const markers = ref([])
const myLat = ref(0)
const myLon = ref(0)

onLoad((options) => {
  destLat.value = parseFloat(options.latitude)
  destLon.value = parseFloat(options.longitude)
  destName.value = options.name || '目的地'
  destAddress.value = options.address || ''

  centerLat.value = destLat.value
  centerLon.value = destLon.value

  markers.value = [{
    id: 2,
    latitude: destLat.value,
    longitude: destLon.value,
    width: 30,
    height: 30,
    callout: {
      content: destName.value,
      padding: 8,
      borderRadius: 8,
      display: 'ALWAYS',
      bgColor: '#fff',
      color: '#374151',
      fontSize: 12,
      borderWidth: 1,
      borderColor: '#e5e7eb'
    }
  }]
})

onMounted(async () => {
  try {
    const res = await getLocation({ highAccuracy: true })
    myLat.value = res.latitude
    myLon.value = res.longitude

    markers.value.unshift({
      id: 1,
      latitude: myLat.value,
      longitude: myLon.value,
      width: 24,
      height: 24
    })

    fitBounds()
  } catch (err) {
    console.log('获取当前位置失败', err)
    uni.showToast({ title: '获取当前位置失败，可直接开始导航', icon: 'none' })
  }
})

const fitBounds = () => {
  if (!myLat.value || !myLon.value) return

  centerLat.value = (myLat.value + destLat.value) / 2
  centerLon.value = (myLon.value + destLon.value) / 2

  const distance = getDistance(myLat.value, myLon.value, destLat.value, destLon.value)
  if (distance < 1) {
    scale.value = 16
  } else if (distance < 5) {
    scale.value = 14
  } else if (distance < 20) {
    scale.value = 12
  } else {
    scale.value = 10
  }
}

const getDistance = (lat1, lon1, lat2, lon2) => {
  const radLat1 = lat1 * Math.PI / 180.0
  const radLat2 = lat2 * Math.PI / 180.0
  const a = radLat1 - radLat2
  const b = lon1 * Math.PI / 180.0 - lon2 * Math.PI / 180.0
  let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)))
  s = s * 6378.137
  return Math.round(s * 10000) / 10000
}

const goBack = () => {
  uni.navigateBack()
}

const handleMarkerTap = (e) => {
  if (e.detail.markerId === 2) {
    startNavigation()
  }
}

const startNavigation = () => {
  uni.openLocation({
    latitude: destLat.value,
    longitude: destLon.value,
    name: destName.value,
    address: destAddress.value,
    scale: 18,
    fail: (err) => {
      uni.showToast({ title: '打开导航失败：' + err.errMsg, icon: 'none' })
    }
  })
}


</script>

<style lang="scss" scoped>
.map-navigation-wrapper {
  width: 100vw;
  height: 100vh;
  background: var(--bg-page, #f8fbff);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  padding-top: calc(var(--status-bar-height) + 16rpx);
  background: var(--bg-card, #fff);
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  z-index: 10;

  .nav-back {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    border-radius: 50%;
    transition: all 0.2s;

    &:active {
      background: var(--border-color, #e5e7eb);
      transform: scale(0.95);
    }
  }

  .nav-title {
    font-size: 34rpx;
    font-weight: 600;
    color: var(--text-primary, #1f2937);
  }

  .nav-placeholder {
    width: 72rpx;
  }
}

.map {
  flex: 1;
  width: 100%;
}

.dest-card {
  position: absolute;
  top: calc(var(--status-bar-height) + 140rpx);
  left: 24rpx;
  right: 24rpx;
  background: var(--bg-card, #fff);
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  z-index: 10;

  .card-header {
    display: flex;
    align-items: center;
    gap: 10rpx;
    margin-bottom: 16rpx;
  }

  .card-title {
    font-size: 26rpx;
    color: var(--text-tertiary, #9ca3af);
    font-weight: 500;
  }

  .dest-info {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  .dest-name {
    font-size: 32rpx;
    font-weight: 700;
    color: var(--text-primary, #1f2937);
  }

  .dest-address {
    font-size: 26rpx;
    color: var(--text-secondary, #6b7280);
    line-height: 1.5;
  }
}

.footer {
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: var(--bg-card, #fff);
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
  z-index: 10;

  .btn-nav {
    width: 100%;
    height: 100rpx;
    line-height: 100rpx;
    background: var(--gradient-primary, linear-gradient(135deg, var(--color-primary, #2f6bee) 0%, var(--color-primary-dark, #1a50d9) 100%));
    color: #fff;
    border-radius: 24rpx;
    font-size: 32rpx;
    font-weight: 600;
    box-shadow: 0 8rpx 24rpx var(--color-primary-shadow, rgba(47, 107, 238, 0.3));
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    transition: all 0.2s;

    &::after {
      border: none;
    }

    &:active {
      transform: scale(0.97);
      opacity: 0.9;
    }
  }
}
</style>
