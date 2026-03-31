<template>
  <view class="map-navigation-wrapper">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="nav-back" @click="goBack">
        <uni-icons type="back" size="20" color="#333" />
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
      <view class="dest-info">
        <text class="dest-name">{{ destName }}</text>
        <text class="dest-address">{{ destAddress }}</text>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="footer">
      <button class="btn-nav" @click="startNavigation">开始导航</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getLocation } from '@/utils/platform.js'

// 接收参数
const destLat = ref(0)
const destLon = ref(0)
const destName = ref('')
const destAddress = ref('')

// 地图数据
const centerLat = ref(0)
const centerLon = ref(0)
const scale = ref(14)
const markers = ref([])
const myLat = ref(0)
const myLon = ref(0)

// 页面加载接收参数
onLoad((options) => {
  destLat.value = parseFloat(options.latitude)
  destLon.value = parseFloat(options.longitude)
  destName.value = options.name || '目的地'
  destAddress.value = options.address || ''

  // 初始中心设为目的地
  centerLat.value = destLat.value
  centerLon.value = destLon.value

  // 添加目的地标记（不使用自定义图标，使用默认）
  markers.value = [{
    id: 2,
    latitude: destLat.value,
    longitude: destLon.value,
    width: 30,
    height: 30,
    callout: {
      content: destName.value,
      padding: 6,
      borderRadius: 4,
      display: 'ALWAYS',
      bgColor: '#fff',
      color: '#333'
    }
  }]
})

// 挂载后获取我的位置
onMounted(async () => {
  try {
    const res = await getLocation({ highAccuracy: true })
    myLat.value = res.latitude
    myLon.value = res.longitude

    // 添加我的位置标记（不使用自定义图标，使用默认）
    markers.value.unshift({
      id: 1,
      latitude: myLat.value,
      longitude: myLon.value,
      width: 20,
      height: 20
    })

    // 自动缩放视野，同时包含起点和终点
    fitBounds()
  } catch (err) {
    console.log('获取当前位置失败', err)
    uni.showToast({ title: '获取当前位置失败，可直接开始导航', icon: 'none' })
  }
})

// 自动适配视野，同时显示起点终点
const fitBounds = () => {
  if (!myLat.value || !myLon.value) return

  // 计算中心点
  centerLat.value = (myLat.value + destLat.value) / 2
  centerLon.value = (myLon.value + destLon.value) / 2

  // 根据两点距离调整缩放级别
  const distance = getDistance(myLat.value, myLon.value, destLat.value, destLon.value)
  if (distance < 1) { // 小于1公里
    scale.value = 16
  } else if (distance < 5) { // 1-5公里
    scale.value = 14
  } else if (distance < 20) { // 5-20公里
    scale.value = 12
  } else { // 大于20公里
    scale.value = 10
  }
}

// 计算两点距离（单位：公里）
const getDistance = (lat1, lon1, lat2, lon2) => {
  const radLat1 = lat1 * Math.PI / 180.0
  const radLat2 = lat2 * Math.PI / 180.0
  const a = radLat1 - radLat2
  const b = lon1 * Math.PI / 180.0 - lon2 * Math.PI / 180.0
  let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)))
  s = s * 6378.137 // 地球半径
  return Math.round(s * 10000) / 10000
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 点击标记唤起导航
const handleMarkerTap = (e) => {
  if (e.detail.markerId === 2) { // 点击目的地标记直接唤起导航
    startNavigation()
  }
}

// 开始导航：唤起微信原生导航
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
  background: #fff;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* 顶部导航栏 */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  padding-top: calc(var(--status-bar-height) + 10rpx);
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
  .nav-back {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-title {
    font-size: 32rpx;
    font-weight: 500;
    color: #333;
  }
  .nav-placeholder {
    width: 60rpx;
  }
}

/* 地图主体 */
.map {
  flex: 1;
  width: 100%;
}

/* 目的地信息卡片 */
.dest-card {
  position: absolute;
  top: calc(var(--status-bar-height) + 120rpx);
  left: 24rpx;
  right: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
  .dest-info {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    .dest-name {
      font-size: 30rpx;
      font-weight: bold;
      color: #333;
    }
    .dest-address {
      font-size: 26rpx;
      color: #666;
    }
  }
}

/* 底部按钮 */
.footer {
  padding: 20rpx 30rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid rgba(0,0,0,0.05);
  .btn-nav {
    width: 100%;
    height: 90rpx;
    line-height: 90rpx;
    background: #2F6BEE;
    color: #fff;
    border-radius: 45rpx;
    font-size: 30rpx;
    font-weight: bold;
    box-shadow: 0 8rpx 20rpx rgba(47, 107, 238, 0.2);
    border: none;
    &::after { border: none; }
  }
}
</style>