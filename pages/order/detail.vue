<template>
  <view class="order-detail-wrapper">
    <!-- 状态计时区域 -->
    <view class="timer-section">
      <uni-tag text="进行中" type="primary" size="normal" class="status-tag" />
      <text class="big-time">{{ usedText }}</text>
      <text class="time-label">已服务时长</text>
      <text class="left-time">剩余时长：{{ leftText }}</text>
    </view>

    <!-- 订单信息卡片 -->
    <view class="card">
      <view class="card-title">订单信息</view>
      <view class="info-row">
        <text class="label">订单编号</text>
        <text class="value">{{ orderInfo.orderNo || '202603221430001' }}</text>
      </view>
      <view class="info-row">
        <text class="label">服务类型</text>
        <text class="value">{{ orderInfo.serviceName }}</text>
      </view>
      <view class="info-row">
        <text class="label">服务时长</text>
        <text class="value">{{ orderInfo.duration || '1小时' }}</text>
      </view>
      <view class="info-row">
        <text class="label">订单金额</text>
        <text class="value price">¥{{ orderInfo.price }}</text>
      </view>
      <view class="info-row">
        <text class="label">预约时间</text>
        <text class="value">{{ orderInfo.appointTime || '2026-03-22 14:30' }}</text>
      </view>
      <view class="info-row">
        <text class="label">创建时间</text>
        <text class="value">{{ orderInfo.createTime || '2026-03-22 14:25:12' }}</text>
      </view>
    </view>

    <!-- 服务地点卡片 -->
    <view class="card">
      <view class="card-title">服务地点</view>
      <image class="shop-img" src="https://picsum.photos/750/300" mode="aspectFill"></image>
      <view class="shop-info">
        <view class="shop-left">
          <text class="shop-name">{{ orderInfo.shopName }}</text>
          <text class="shop-address">{{ orderInfo.address || '上海市浦东新区XX路123号' }}</text>
          <text class="distance">距离您{{ orderInfo.distance || '2.3公里' }}，驾车约{{ orderInfo.driveTime || '10分钟' }}</text>
        </view>
        <button class="nav-btn" @click="navigate">
          <uni-icons type="location-filled" size="20" color="#fff" />
        </button>
      </view>
    </view>

    <!-- 客户信息卡片 -->
    <view class="card">
      <view class="card-title">客户信息</view>
      <view class="customer-info">
        <image class="avatar" src="https://picsum.photos/100/100" mode="aspectFill"></image>
        <view class="customer-left">
          <text class="customer-name">{{ orderInfo.customerName || '李先生' }}</text>
          <text class="customer-phone">{{ orderInfo.customerPhone || '138****8888' }}</text>
        </view>
        <button class="call-btn" @click="makeCall">
          <uni-icons type="phone" size="20" color="#10B981" />
        </button>
      </view>
    </view>

    <!-- 底部操作区 -->
    <view class="footer">
      <button class="btn-end" @click="endService">结束服务</button>
      <button class="btn-service" @click="contactService">联系客服</button>
    </view>
  </view>
</template>

<script setup>
// 👇 这里改：ref从vue导，onLoad/onUnload是uni的生命周期，从@dcloudio/uni-app导
import { ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app' // ✅ 正确导入方式

// 接收路由参数
const orderInfo = ref({})
const usedSec = ref(0)
const leftSec = ref(0)

// 计时显示文本
const usedText = ref('00:00')
const leftText = ref('00:00:00')

// 计时器实例
let usedTimer = null
let leftTimer = null

// 时间格式化函数（和工作台保持一致）
const fmtMMSS = (s) => {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2,0)}:${String(sec).padStart(2,0)}`
}
const fmtHHMMSS = (s) => {
  const h = Math.floor(s/3600)
  const m = Math.floor((s%3600)/60)
  const sec = s%60
  return `${String(h).padStart(2,0)}:${String(m).padStart(2,0)}:${String(sec).padStart(2,0)}`
}

// 启动计时
const startTimer = () => {
  // 初始化显示
  usedText.value = fmtMMSS(usedSec.value)
  leftText.value = fmtHHMMSS(leftSec.value)

  // 已服务时长计时
  usedTimer = setInterval(() => {
    usedSec.value++
    usedText.value = fmtMMSS(usedSec.value)
  }, 1000)

  // 剩余时长计时
  leftTimer = setInterval(() => {
    if (leftSec.value <= 0) {
      clearInterval(leftTimer)
      clearInterval(usedTimer)
      return
    }
    leftSec.value--
    leftText.value = fmtHHMMSS(leftSec.value)
  }, 1000)
}

// 页面加载时接收参数
// 找到onLoad方法，补充默认经纬度
onLoad((options) => {
  if (options.orderInfo) {
    orderInfo.value = JSON.parse(decodeURIComponent(options.orderInfo))
  }
  usedSec.value = parseInt(options.usedSec || 0)
  leftSec.value = parseInt(options.leftSec || 3600)
  // 👇 新增：mock商家经纬度，真实场景从orderInfo里取
  orderInfo.value.lat = orderInfo.value.lat || 31.230416 // 维度，示例为上海坐标
  orderInfo.value.lon = orderInfo.value.lon || 121.473701 // 经度
  orderInfo.value.address = orderInfo.value.address || '上海市浦东新区XX路123号'
  orderInfo.value.shopName = orderInfo.value.shopName || 'XX台球厅（XX路店）'

  startTimer()
})

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// ====================== 新增：全端适配导航逻辑 ======================
const navigate = () => {
  const { lat, lon, shopName, address } = orderInfo.value
  if (!lat || !lon) {
    return uni.showToast({ title: '地址信息有误', icon: 'none' })
  }

  // 1. 先判断环境：微信小程序直接走小程序内置地图
  // #ifdef MP-WEIXIN
  uni.openLocation({
    latitude: parseFloat(lat),
    longitude: parseFloat(lon),
    name: shopName,
    address: address,
    scale: 18,
    success: () => console.log('打开地图成功'),
    fail: (err) => uni.showToast({ title: '打开地图失败：' + err.errMsg, icon: 'none' })
  })
  // #endif

  // 2. APP端（安卓/鸿蒙/iOS）：检测已安装地图，弹出选择
  // #ifdef APP-PLUS
  uni.showLoading({ title: '检测地图应用中...' })
  // 检测已安装的地图
  const hasAmap = plus.runtime.isApplicationExist({ pname: 'com.autonavi.minimap', action: 'iosamap://' }) // 高德
  const hasBaidumap = plus.runtime.isApplicationExist({ pname: 'com.baidu.BaiduMap', action: 'baidumap://' }) // 百度

  uni.hideLoading()

  const mapList = []
  if (hasAmap) mapList.push('高德地图')
  if (hasBaidumap) mapList.push('百度地图')

  if (mapList.length === 0) {
    return uni.showModal({
      title: '提示',
      content: '您未安装地图应用，请先安装高德或百度地图',
      showCancel: false
    })
  }

  // 弹出选择框
  uni.showActionSheet({
    itemList: mapList,
    success: (res) => {
      const selectMap = mapList[res.tapIndex]
      if (selectMap === '高德地图') {
        openAmap(lat, lon, shopName)
      } else if (selectMap === '百度地图') {
        // 百度坐标需要把GCJ02转成BD09，避免偏移
        const [bdLat, bdLon] = gcj02ToBd09(parseFloat(lat), parseFloat(lon))
        openBaidumap(bdLat, bdLon, shopName)
      }
    }
  })
  // #endif

  // H5端备用方案（可选）
  // #ifdef H5
  window.open(`https://uri.amap.com/navigation?to=${lon},${lat},${shopName}&mode=car`)
  // #endif
}

// 打开高德地图导航
const openAmap = (lat, lon, name) => {
  // #ifdef APP-PLUS
  const url = plus.os.name === 'iOS'
      ? `iosamap://route/plan/?dlat=${lat}&dlon=${lon}&dname=${encodeURIComponent(name)}&dev=0&t=0`
      : `amapuri://route/plan/?dlat=${lat}&dlon=${lon}&dname=${encodeURIComponent(name)}&dev=0&t=0`
  plus.runtime.openURL(url, (err) => {
    uni.showToast({ title: '打开高德地图失败', icon: 'none' })
  })
  // #endif
}

// 打开百度地图导航
const openBaidumap = (lat, lon, name) => {
  // #ifdef APP-PLUS
  const url = `baidumap://map/direction?origin=我的位置&destination=latlng:${lat},${lon}|name:${encodeURIComponent(name)}&mode=driving&src=你的应用名称`
  plus.runtime.openURL(url, (err) => {
    uni.showToast({ title: '打开百度地图失败', icon: 'none' })
  })
  // #endif
}

// 坐标转换：GCJ02(高德/微信) 转 BD09(百度)，解决百度地图偏移问题
const gcj02ToBd09 = (ggLat, ggLon) => {
  const xPI = 3.14159265358979324 * 3000.0 / 180.0
  const z = Math.sqrt(ggLon * ggLon + ggLat * ggLat) + 0.00002 * Math.sin(ggLat * xPI)
  const theta = Math.atan2(ggLat, ggLon) + 0.000003 * Math.cos(ggLon * xPI)
  const bdLon = z * Math.cos(theta) + 0.0065
  const bdLat = z * Math.sin(theta) + 0.006
  return [bdLat, bdLon]
}
// ====================== 导航逻辑结束 ======================

// 打电话
const makeCall = () => {
  uni.makePhoneCall({ phoneNumber: '13800008888' })
}

// 联系客服
const contactService = () => {
  uni.showToast({ title: '正在联系客服', icon: 'none' })
}

// 结束服务
const endService = () => {
  uni.showModal({
    title: '确认结束',
    content: '确定要结束当前服务吗？结束后无法继续计时',
    success: (res) => {
      if (res.confirm) {
        // 清空计时器
        clearInterval(usedTimer)
        clearInterval(leftTimer)
        // 通知工作台服务已结束
        uni.$emit('serviceEnded', {
          order: orderInfo.value,
          usedTime: usedText.value
        })
        uni.showToast({ title: '服务已结束', icon: 'success' })
        // 延迟返回，让用户看到提示
        setTimeout(() => {
          uni.navigateBack()
        }, 1000)
      }
    }
  })
}

// 页面卸载时清空计时器
onUnload(() => {
  clearInterval(usedTimer)
  clearInterval(leftTimer)
})
</script>

<style lang="scss" scoped>
.order-detail-wrapper {
  min-height: 100vh;
  background: #F8F9FB;
  /* 1. 调大底部内边距：计算公式 = 底部按钮区高度 + 额外的呼吸空间 */
  /* 这里增加到 320rpx 左右，确保客户信息卡片不会被遮挡 */
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}
/* 覆盖导航栏样式 */
:deep(.uni-nav-bar) {
  background: #fff !important;
  border-bottom: 1rpx solid #F0F0F0 !important;
}

/* 计时区域 */
.timer-section {
  background: #fff;
  text-align: center;
  padding: 32rpx 24rpx 48rpx;
  margin-bottom: 24rpx;
  .status-tag {
    margin-bottom: 16rpx;
  }
  .tip-text {
    font-size: 26rpx;
    color: #666;
    display: block;
    margin-bottom: 32rpx;
  }
  .big-time {
    font-size: 96rpx;
    font-weight: bold;
    color: #333;
    display: block;
    line-height: 1;
    margin: 16rpx;
  }
  .time-label {
    font-size: 26rpx;
    color: #999;
    display: block;
    margin-bottom: 16rpx;
  }
  .left-time {
    font-size: 28rpx;
    color: #F53F3F;
    font-weight: bold;
  }
}

/* 通用卡片样式 */
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 0 24rpx 24rpx;
  .card-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 24rpx;
  }
}

/* 订单信息行 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #F8F9FB;
  &:last-child {
    border-bottom: none;
  }
  .label {
    font-size: 26rpx;
    color: #666;
  }
  .value {
    font-size: 26rpx;
    color: #333;
  }
  .price {
    color: #2F6BEE;
    font-weight: bold;
  }
}

/* 服务地点样式 */
.shop-img {
  width: 100%;
  height: 300rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}
.shop-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .shop-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    .shop-name {
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
    }
    .shop-address {
      font-size: 24rpx;
      color: #666;
    }
    .distance {
      font-size: 24rpx;
      color: #2F6BEE;
      margin-top: 4rpx;
    }
  }
  .nav-btn {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: #2F6BEE;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
  }
}

/* 客户信息样式 */
.customer-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
  .avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
  }
  .customer-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    .customer-name {
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
    }
    .customer-phone {
      font-size: 24rpx;
      color: #666;
    }
  }
  .call-btn {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    background: #ECFDF5;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
  }
}
/* 客户信息卡片（增加底部间距，防止贴着底部栏） */
.card:last-of-type {
  margin-bottom: 20rpx;
}

/* 底部操作区 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98); // 略微透明增加高级感
  backdrop-filter: blur(10px); // 毛玻璃效果
  padding: 20rpx 30rpx; // 左右加宽，上下收紧
  /* 2. 优化安全区距离，让按钮“往下走”一点但保持在安全线内 */
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 16rpx; // 按钮之间的间距
  z-index: 99;

  .btn-end {
    width: 100%;
    height: 90rpx;
    line-height: 90rpx;
    background: #F53F3F;
    color: #fff;
    border-radius: 45rpx; // 改为圆角胶囊形更美观
    font-size: 30rpx;
    font-weight: bold;
    box-shadow: 0 8rpx 20rpx rgba(245, 63, 63, 0.2);
    border: none;
    &::after { border: none; }
  }

  .btn-service {
    width: 100%;
    height: 72rpx;
    line-height: 72rpx;
    background: transparent;
    color: #888;
    border: none; // 去掉边框，改为纯文本感，更干净
    font-size: 26rpx;
    text-decoration: underline; // 增加下划线提示可点击
    &::after { border: none; }
  }
}
/* 去掉按钮默认样式 */
:deep(.uni-button) {
  border: none;
  box-shadow: none;
  outline: none;
}
</style>