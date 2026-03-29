<template>
  <view class="workbench-wrapper">

    <!-- 工作状态卡片 -->
    <uni-card title="工作状态" :is-shadow="true" :border="false">
      <view class="status-row">
        <text class="status-label">当前状态</text>
        <view class="switch-wrapper">
          <text class="label-off" :class="{ active: !isOnline }">下线</text>
          <!-- 替换为自定义滑动开关，完全替代原来的uni-data-checkbox -->
          <view
              class="custom-switch"
              :class="{ 'is-checked': isOnline, 'is-disabled': switchLoading }"
              @click="handleSwitchClick"
          >
            <view class="switch-knob"></view>
          </view>
          <text class="label-on" :class="{ active: isOnline }">上线</text>
        </view>
      </view>
      <uni-tag
          :text="isOnline ? '在线接单中' : '已下线，不接收新订单'"
          :type="isOnline ? 'success' : 'default'"
          size="normal"
          class="status-tag"
      />
    </uni-card>

    <!-- 空订单状态 -->
    <uni-card v-if="!isOnline || orderStatus === 'idle'" :is-shadow="true" :border="false">
      <view class="empty-order">
        <uni-icons type="list" size="80" color="#B0B4BC"></uni-icons>
        <text class="empty-text">暂无新订单邀请</text>
      </view>
    </uni-card>

    <!-- 待接单状态 -->
    <uni-card v-else-if="orderStatus === 'pending'" :is-shadow="true" :border="false">
      <view class="pending-order">
        <view class="pending-header">
          <view class="location">
            <uni-icons type="location" size="18" color="#2F6BEE"></uni-icons>
            <text class="location-text">{{ pendingOrder.shopName }}</text>
          </view>
          <view class="countdown">
            <uni-tag text="剩余" type="warning" size="small" />
            <text class="time-text">{{ pendingCountdownText }}</text>
          </view>
        </view>

        <view class="order-info">
          <text class="order-name">{{ pendingOrder.serviceName }}</text>
          <text class="order-price">¥{{ pendingOrder.price }}</text>
        </view>

        <view class="btn-group">
          <button class="btn btn-reject" @click="rejectOrder">拒绝</button>
          <button class="btn btn-accept" @click="acceptOrder">接单</button>
        </view>
      </view>
    </uni-card>

    <!-- 服务中状态 -->
    <uni-card v-else-if="orderStatus === 'serving'" title="进行中服务" :is-shadow="true" :border="false">
      <view class="serving-order">
        <view class="serve-top">
          <text class="left-time">剩余时长 {{ servingLeftTimeText }}</text>
        </view>

        <view class="timer-box">
          <text class="big-time">{{ servingUsedTimeText }}</text>
          <text class="time-desc">已服务时长</text>
        </view>

        <button class="btn-end" @click="endService">结束服务</button>

        <!-- 点击整个订单详情区域跳转 -->
        <uni-section title="订单详情" type="line" margin-top="20rpx" >
          <view class="detail-box" @click="goToDetail">
            <image class="shop-img" :src="pendingOrder.shopImg" mode="aspectFill"></image>
            <view class="info">
              <text class="shop-name">{{ pendingOrder.shopName }}</text>
              <view class="contact-row">
                <text>客户：{{ pendingOrder.customerPhone }}</text>
                <button class="call-btn" @click.stop="makeCall">
                  <uni-icons type="phone" size="16" color="#10B981"></uni-icons>
                </button>
              </view>
              <text class="service-name">{{ pendingOrder.serviceName }}</text>
              <text class="service-price">¥{{ pendingOrder.price }}</text>
              <view class="tip-box">
                <uni-icons type="info" size="14" color="#F59E0B"></uni-icons>
                <text>支持客户加钟，时长自动更新</text>
              </view>
            </view>
            <button class="nav-btn" @click.stop="navigate">导航</button>
          </view>
        </uni-section>
      </view>
    </uni-card>

    <!-- 今日数据 -->
    <uni-section title="今日数据" type="line">
      <view class="data-grid">
        <view class="data-card" v-for="(item, i) in todayData" :key="i">
          <view class="data-icon" :style="{ background: item.bgColor }">
            <uni-icons :type="item.icon" size="20" :color="item.color"></uni-icons>
          </view>
          <text class="data-value">{{ item.value }}</text>
          <text class="data-label">{{ item.label }}</text>
          <uni-tag text="实时" type="success" size="mini" class="real-tag"></uni-tag>
        </view>
      </view>
    </uni-section>

    <!-- 历史订单 -->
    <uni-card
        :is-shadow="true"
        :border="false"
    >
      <view class="card-header">
        <text class="card-title">历史订单</text>
        <text class="view-all-text" @click="goToAllOrder">查看全部</text>
      </view>
      <uni-segmented-control
          :current="currentTab"
          :values="tabs"
          activeColor="#2F6BEE"
          style-type="button"
          class="history-tabs"
          @clickItem="onTabClick"
      />
      <view class="history-order-list">
        <view class="history-order-item" v-for="(item, index) in displayOrders" :key="index">
          <view class="order-top">
            <text class="order-title">{{ item.name }}</text>
            <text class="order-price">¥{{ item.price }}</text>
          </view>
          <view class="order-bottom">
            <text class="order-time">{{ item.time }}</text>
            <uni-tag
                :text="currentTab === 0 ? '已完成' : '已取消'"
                :type="currentTab === 0 ? 'success' : 'default'"
                size="small"
            />
          </view>
        </view>
      </view>
    </uni-card>

  </view>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

// ====================== 基础状态 ======================
const isOnline = ref(false)
const orderStatus = ref('idle')
const currentTab = ref(0)
const tabs = ref(['已完成', '已取消'])
const switchLoading = ref(false) // 开关操作loading，防止重复点击

// ====================== 新增：订单mock数据（和详情页字段完全对齐） ======================
const pendingOrder = ref({
  id: '20260601001',
  orderNo: '202603221430001',
  shopName: 'XX台球厅（XX路店）',
  shopImg: 'https://picsum.photos/120/120',
  address: '上海市浦东新区XX路123号',
  serviceName: '中式八球陪练 1小时',
  price: 120,
  duration: 3600, // 总服务时长（秒）
  customerName: '李先生',
  customerPhone: '138****8888',
  appointTime: '2026-03-22 14:30',
  createTime: '2026-03-22 14:25:12',
  remainAcceptTime: 150 // 待接单倒计时
})

// 倒计时
let pendingTimer = null
const pendingCountdown = ref(pendingOrder.value.remainAcceptTime)
const pendingCountdownText = ref('2分30秒')

// 服务计时
let usedTimer = null
let leftTimer = null
const usedSec = ref(0)
const servingUsedTimeText = ref('00:00')
const leftSec = ref(2112)
const servingLeftTimeText = ref('00:35:12')

// 数据 - 已完成订单
const completedOrders = ref([
  { name: '中式八球陪练 1小时', time: '今天 14:30 · XX台球厅', price: '120' },
  { name: '斯诺克教学 2小时', time: '今天 10:00 · XX台球俱乐部', price: '300' }
])

// 数据 - 已取消订单
const cancelledOrders = ref([
  { name: '中式八球陪练 2小时', time: '昨天 16:00 · XX台球馆', price: '200' },
  { name: '斯诺克陪练 1小时', time: '昨天 11:30 · XX俱乐部', price: '150' }
])

// 当前显示的订单列表
const displayOrders = ref(completedOrders.value)

const todayData = ref([
  { icon: 'calendar', value: '2小时30分', label: '今日上钟时长', color: '#2F6BEE', bgColor: '#EFF6FF' },
  { icon: 'checkbox', value: '3单', label: '今日服务次数', color: '#10B981', bgColor: '#ECFDF5' },
  { icon: 'wallet', value: '¥360', label: '预计收入', color: '#F59E0B', bgColor: '#FFF7ED' }
])

// 时间格式化
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

// 待接单倒计时
const startPending = () => {
  clearInterval(pendingTimer)
  pendingCountdown.value = pendingOrder.value.remainAcceptTime
  pendingTimer = setInterval(() => {
    pendingCountdown.value--
    if (pendingCountdown.value <= 0) {
      clearInterval(pendingTimer)
      orderStatus.value = 'idle'
      uni.showToast({ title: '订单已超时', icon: 'none' })
      return
    }
    const m = Math.floor(pendingCountdown.value / 60)
    const s = pendingCountdown.value % 60
    pendingCountdownText.value = `${m}分${s}秒`
  },1000)
}

// 跳转到订单详情页
const goToDetail = () => {
  // 参数编码，防止特殊字符报错
  const params = encodeURIComponent(JSON.stringify(pendingOrder.value))
  uni.navigateTo({
    url: `/pages/order/detail?orderInfo=${params}&usedSec=${usedSec.value}&leftSec=${leftSec.value}`
  })
}

// 服务计时
const startServe = () => {
  clearInterval(usedTimer)
  clearInterval(leftTimer)
  usedSec.value = 0
  leftSec.value = pendingOrder.value.duration

  usedTimer = setInterval(()=>{
    usedSec.value++
    servingUsedTimeText.value = fmtMMSS(usedSec.value)
  },1000)

  leftTimer = setInterval(()=>{
    if(leftSec.value <=0){
      clearInterval(leftTimer)
      clearInterval(usedTimer)
      uni.showToast({ title: '服务时长已到', icon: 'none' })
      return
    }
    leftSec.value--
    servingLeftTimeText.value = fmtHHMMSS(leftSec.value)
  },1000)
}

// ====================== 新增：开关点击+下线二次确认逻辑 ======================
const handleSwitchClick = () => {
  if (switchLoading.value) return
  const targetStatus = !isOnline.value

  // 情况1：要切到上线，直接走逻辑
  if (targetStatus) {
    onSwitchChange(targetStatus)
    return
  }

  // 情况2：要切到下线，弹二次确认
  let confirmText = '确认下线吗？下线后将无法接收新订单'
  // 如果当前有正在服务的订单，增加风险提示
  if (orderStatus.value === 'serving') {
    confirmText = '您当前有正在进行中的服务，确认下线将强制结束服务，是否继续？'
  }

  uni.showModal({
    title: '确认下线',
    content: confirmText,
    success: (res) => {
      if (res.confirm) {
        // 用户确认，执行下线逻辑
        onSwitchChange(targetStatus)
      }
      // 用户取消，不做任何操作，开关状态不变
    }
  })
}

// 开关切换逻辑
const onSwitchChange = (targetStatus) => {
  switchLoading.value = true
  isOnline.value = targetStatus

  if(isOnline.value){
    // 上线，加载待接单
    orderStatus.value = 'pending'
    startPending()
  }else{
    // 下线，清空所有状态
    orderStatus.value = 'idle'
    clearInterval(pendingTimer)
    clearInterval(usedTimer)
    clearInterval(leftTimer)
  }

  setTimeout(() => {
    switchLoading.value = false
  }, 500)
}

// 拒绝订单
const rejectOrder = () => {
  uni.showModal({
    title: '确认拒绝',
    content: '确定要拒绝此订单吗？',
    success: (res)=>{
      if(res.confirm){
        clearInterval(pendingTimer)
        orderStatus.value = 'idle'
        // 加入取消列表
        cancelledOrders.value.unshift({
          name: pendingOrder.value.serviceName,
          time: `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2,'0')} · ${pendingOrder.value.shopName}`,
          price: pendingOrder.value.price
        })
        uni.showToast({ title:'已拒绝' })
      }
    }
  })
}

// ====================== 修改：接单成功后自动跳详情页 ======================
const acceptOrder = () => {
  uni.showLoading({ title:'接单中...' })
  setTimeout(()=>{
    uni.hideLoading()
    clearInterval(pendingTimer)
    orderStatus.value = 'serving'
    startServe()
    uni.showToast({ title: '接单成功', icon: 'success' })
    // 延迟1秒跳详情，让用户看到成功提示
    // setTimeout(() => {
    //   goToDetail()
    // }, 1000)
  },800)
}

// 结束服务
const endService = () => {
  uni.showModal({
    title: '确认结束',
    content: '确定要结束当前服务吗？',
    success: (res) => {
      if(res.confirm){
        clearInterval(usedTimer)
        clearInterval(leftTimer)
        orderStatus.value = 'idle'
        // 加入完成列表
        completedOrders.value.unshift({
          name: pendingOrder.value.serviceName,
          time: `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2,'0')} · ${pendingOrder.value.shopName}`,
          price: pendingOrder.value.price
        })
        // 更新今日数据
        todayData.value[0].value = '3小时30分'
        todayData.value[1].value = '4单'
        todayData.value[2].value = '¥480'
        uni.showToast({ title:'服务已结束', icon:'success' })
      }
    }
  })
}

// 导航
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

// 打电话
const makeCall = () => uni.makePhoneCall({ phoneNumber:'13800008888' })

// 标签切换
const onTabClick = (e) => {
  currentTab.value = e.currentIndex
  displayOrders.value = e.currentIndex === 0 ? completedOrders.value : cancelledOrders.value
}

// 查看全部订单
const goToAllOrder = () => {
  uni.showToast({ title:'跳转到全部订单页', icon:'none' })
  // uni.navigateTo({ url:'/pages/order/list' })
}

onUnmounted(()=>{
  clearInterval(pendingTimer)
  clearInterval(usedTimer)
  clearInterval(leftTimer)
})
</script>

<style lang="scss" scoped>
/* 全局样式重置 */
:deep(.uni-button) {
  border: none;
  box-shadow: none;
  outline: none;
}
:deep(.uni-card) {
  margin: 0 !important;
  border-radius: 16rpx !important;
}
/* 卡片头部样式 */
:deep(.uni-card .uni-card__header) {
  padding: 20rpx 24rpx !important;
  border-bottom: 1rpx solid #F0F0F0;
  font-weight: bold;
}
/* 卡片内容样式 */
:deep(.uni-card .uni-card__content) {
  padding: 24rpx !important;
}
:deep(.uni-section .uni-section__header) {
  padding: 0 4rpx 12rpx !important;
}

.workbench-wrapper {
  min-height: 100vh;
  background: #F8F9FB;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* 工作状态卡片内部 */
.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 20rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
  .status-label {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
  }
}
.status-tag {
  margin-top: 20rpx;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
  .label-off, .label-on {
    font-size: 26rpx;
    color: #999;
  }
  .active {
    color: #00C531;
    font-weight: bold;
  }
}

/* ====================== 新增：自定义滑动开关样式 ====================== */
.custom-switch {
  width: 88rpx;
  height: 48rpx;
  border-radius: 24rpx;
  background: #CDD0D6; /* 关闭时灰色 */
  position: relative;
  transition: all 0.3s ease;
  flex-shrink: 0;
  cursor: pointer;

  /* 滑动圆点 */
  .switch-knob {
    position: absolute;
    top: 4rpx;
    left: 4rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: #fff;
    transition: all 0.3s ease;
    box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.1);
  }

  /* 开启状态：绿色和需求一致 */
  &.is-checked {
    background: #00C531;
    .switch-knob {
      left: calc(100% - 44rpx); /* 平滑滑到右侧 */
    }
  }

  /* 禁用状态 */
  &.is-disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

/* 空订单居中处理 */
.empty-order {
  min-height: 320rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .empty-text {
    margin-top: 24rpx;
    font-size: 28rpx;
    color: #666;
  }
}

/* 待接单样式 */
.pending-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  .location {
    display: flex;
    align-items: center;
    gap: 6rpx;
    .location-text {
      font-size: 26rpx;
      color: #333;
    }
  }
  .countdown {
    display: flex;
    align-items: center;
    gap: 6rpx;
    .time-text {
      font-size: 26rpx;
      color: #F59E0B;
      font-weight: bold;
    }
  }
}
.order-info {
  margin-bottom: 24rpx;
  .order-name {
    font-size: 30rpx;
    font-weight: bold;
    display: block;
    margin-bottom: 8rpx;
  }
  .order-price {
    font-size: 36rpx;
    color: #2F6BEE;
    font-weight: bold;
  }
}
/* 接单按钮组样式 */
.btn-group {
  display: flex;
  gap: 16rpx;
  .btn {
    height: 72rpx;
    line-height: 72rpx;
    font-size: 26rpx;
    border-radius: 12rpx;
    flex: 1;
  }
  .btn-reject {
    background: #F53F3F;
    color: #fff;
  }
  .btn-accept {
    background: #2F6BEE;
    color: #fff;
  }
}

/* 服务中样式 */
.serve-top {
  .left-time {
    font-size: 26rpx;
    color: #2F6BEE;
    font-weight: bold;
  }
}
.timer-box {
  text-align: center;
  padding: 32rpx 0;
  background: #F8F9FB;
  border-radius: 12rpx;
  margin: 24rpx 0;
  .big-time {
    font-size: 64rpx;
    font-weight: bold;
    color: #333;
    display: block;
  }
  .time-desc {
    font-size: 24rpx;
    color: #999;
    margin-top: 8rpx;
  }
}
.btn-end {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background: #F53F3F;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
}
/* 订单详情样式 */
.detail-box {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 16rpx;
  .shop-img {
    width: 120rpx;
    height: 120rpx;
    border-radius: 12rpx;
  }
  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    .shop-name {
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
    }
    .contact-row {
      display: flex;
      align-items: center;
      gap: 8rpx;
      font-size: 24rpx;
      color: #666;
      .call-btn {
        background: transparent;
        padding: 0;
        width: 32rpx;
        height: 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        margin: 0;
      }
    }
    .service-name {
      font-size: 26rpx;
      color: #333;
    }
    .service-price {
      font-size: 28rpx;
      color: #2F6BEE;
      font-weight: bold;
    }
    .tip-box {
      display: flex;
      align-items: center;
      gap: 4rpx;
      font-size: 22rpx;
      color: #F59E0B;
      margin-top: 4rpx;
    }
  }
  .nav-btn {
    background: #2F6BEE;
    color: #fff;
    border-radius: 8rpx;
    font-size: 24rpx;
    height: 60rpx;
    padding: 0 20rpx;
    line-height: 60rpx;
    margin: 0;
  }
}

/* 今日数据卡片优化 */
.data-grid {
  display: flex;
  gap: 16rpx;
  margin-top: 12rpx;
}
.data-card {
  flex: 1;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 16rpx;
  text-align: center;
  position: relative;
  border: 1rpx solid #F0F0F0;

  .data-icon {
    width: 48rpx;
    height: 48rpx;
    border-radius: 10rpx;
    margin: 0 auto 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .data-value {
    font-size: 28rpx;
    font-weight: bold;
    display: block;
    margin-bottom: 8rpx;
  }
  .data-label {
    font-size: 24rpx;
    color: #888;
  }
  .real-tag {
    transform: scale(0.75);
    position: absolute;
    top: 8rpx;
    right: 8rpx;
  }
}

/* 自定义卡片标题栏 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #F0F0F0;
}
.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

/* 查看全部样式 */
.view-all-text {
  font-size: 26rpx;
  color: #2F6BEE;
  padding: 8rpx 0;
  &:active {
    opacity: 0.7;
  }
}

/* 历史订单优化样式 */
.history-tabs {
  margin: 20rpx 0;
}
.history-order-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.history-order-item {
  padding: 20rpx;
  background: #F8F9FB;
  border-radius: 12rpx;
  .order-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8rpx;
    .order-title {
      font-size: 28rpx;
      font-weight: 500;
      color: #333;
    }
    .order-price {
      font-size: 28rpx;
      color: #2F6BEE;
      font-weight: bold;
    }
  }
  .order-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .order-time {
      font-size: 24rpx;
      color: #999;
    }
  }
}
</style>