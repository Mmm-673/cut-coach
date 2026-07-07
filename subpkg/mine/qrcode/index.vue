<template>
  <view class="qrcode-page">
    <!-- 头部信息 -->
    <view class="header-section">
      <view class="avatar-wrapper">
        <image class="avatar" :src="coachProfile.avatar || '/static/images/default-avatar.png'" mode="aspectFill"></image>
      </view>
      <view class="user-info">
        <view class="user-name">{{ coachProfile.stageName || '裁教' }}</view>
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
        <canvas canvas-id="composite-canvas" style="width: 300px; height: 450px; position: absolute; left: -9999rpx;"></canvas>

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
      <button class="save-btn" @click="savePoster" style="margin-top: 20rpx; background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
        <uni-icons type="image" size="18" color="#fff"></uni-icons>
        <text>导出海报</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue' // 引入 nextTick
import { getCoachProfile } from '@/api/billiard/coach'
import constant from '@/utils/constant'
import { mediaPermissionMessages } from '@/utils/permission-messages'
import { requestStoragePermission, isIOS, isAndroid, isHarmony } from '@/utils/platform'

// 检查用户是否已同意相机/相册权限说明
const hasMediaPermissionAgreed = () => {
  const agreed = uni.getStorageSync(constant.mediaPermissionAgreed)
  return !!agreed
}

// 设置用户同意相机/相册权限说明
const setMediaPermissionAgreed = (agreed = true) => {
  uni.setStorageSync(constant.mediaPermissionAgreed, agreed)
}

// 显示相机/相册权限说明弹框
const showMediaPermissionExplanation = () => {
  return new Promise((resolve, reject) => {
    uni.showModal({
      title: mediaPermissionMessages.title,
      content: mediaPermissionMessages.qrcode,
      confirmText: '同意',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          setMediaPermissionAgreed(true)
          resolve(true)
        } else {
          reject(new Error('用户拒绝相机/相册权限说明'))
        }
      },
      fail: () => {
        reject(new Error('弹框显示失败'))
      }
    })
  })
}

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
        stageName: res.data.stageName || res.data.name || '裁教',
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

  // 直接调用组件的 toTempFilePath 方法获取二维码图片路径
  if (uqrcodeRef.value) {
    uqrcodeRef.value.toTempFilePath({
      success: (res) => {
        console.log('二维码临时路径：', res.tempFilePath)
        qrcodeFilePath.value = res.tempFilePath
      },
      fail: (err) => {
        console.error('获取二维码临时路径失败：', err)
      }
    })
  }
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

  // iOS 直接保存，不需要权限说明和请求
  if (isIOS()) {
    saveQrcodeToAlbum(instance)
    return
  }

  // 检查用户是否已同意相机/相册权限说明（仅 Android/鸿蒙 需要）
  if (!hasMediaPermissionAgreed() && (isAndroid() || isHarmony())) {
    showMediaPermissionExplanation().then(() => {
      setMediaPermissionAgreed(true);
      // 用户同意权限说明后，请求系统相册权限
      return requestStoragePermission();
    }).then(() => {
      // 系统权限获取成功，保存二维码
      saveQrcodeToAlbum(instance)
    }).catch((err) => {
      uni.showToast({
        title: mediaPermissionMessages.saveFailed,
        icon: 'none'
      })
    })
  } else {
    // 用户已同意权限说明，请求系统相册权限
    requestStoragePermission().then(() => {
      saveQrcodeToAlbum(instance)
    }).catch((err) => {
      uni.showToast({
        title: mediaPermissionMessages.saveFailed,
        icon: 'none'
      })
    })
  }
}

// 保存二维码到相册
const saveQrcodeToAlbum = (instance) => {
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

// 导出海报
const savePoster = () => {
  // iOS 直接保存，不需要权限说明和请求
  if (isIOS()) {
    generateAndSavePoster()
    return
  }

  // 检查用户是否已同意相机/相册权限说明（仅 Android/鸿蒙 需要）
  if (!hasMediaPermissionAgreed() && (isAndroid() || isHarmony())) {
    showMediaPermissionExplanation().then(() => {
      setMediaPermissionAgreed(true);
      // 用户同意权限说明后，请求系统相册权限
      return requestStoragePermission();
    }).then(() => {
      // 系统权限获取成功，生成并保存海报
      generateAndSavePoster()
    }).catch((err) => {
      uni.showToast({
        title: mediaPermissionMessages.exportFailed,
        icon: 'none'
      })
    })
  } else {
    // 用户已同意权限说明，请求系统相册权限
    requestStoragePermission().then(() => {
      generateAndSavePoster()
    }).catch((err) => {
      uni.showToast({
        title: mediaPermissionMessages.exportFailed,
        icon: 'none'
      })
    })
  }
}

// 生成并保存海报
const generateAndSavePoster = () => {
  uni.showLoading({ title: '海报生成中...' })

  // 使用 canvas 合成海报
  const ctx = uni.createCanvasContext('composite-canvas')

  // 设置海报尺寸
  const width = 300
  const height = 450

  // 绘制背景
  ctx.setFillStyle('#fff')
  ctx.fillRect(0, 0, width, height)

  // 绘制头部渐变背景
  const gradient = ctx.createLinearGradient(0, 0, 0, 150)
  gradient.addColorStop(0, '#2f6bee')
  gradient.addColorStop(1, '#1a50d9')
  ctx.setFillStyle(gradient)
  ctx.fillRect(0, 0, width, 150)

  // 绘制标题
  ctx.setFillStyle('#fff')
  ctx.setFontSize(20)
  ctx.setTextAlign('center')
  ctx.fillText('初球裁教', width / 2, 40)
  ctx.setFontSize(14)
  ctx.fillText('专业台球教练服务', width / 2, 65)

  // 绘制教练头像
  if (coachProfile.value.avatar) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(width / 2, 115, 30, 0, 2 * Math.PI)
    ctx.clip()
    ctx.drawImage(coachProfile.value.avatar, width / 2 - 30, 80, 60, 60)
    ctx.restore()
  }

  // 绘制教练姓名
  ctx.setFillStyle('#1f2937')
  ctx.setFontSize(18)
  ctx.setTextAlign('center')
  ctx.fillText(coachProfile.value.stageName || '裁教', width / 2, 180)

  // 绘制二维码
  console.log('qrcodeFilePath:', qrcodeFilePath.value)
  if (qrcodeFilePath.value) {
    ctx.drawImage(qrcodeFilePath.value, width / 2 - 75, 200, 150, 150)
  } else {
    console.error('二维码图片路径为空')
  }

  // 绘制底部提示
  ctx.setFillStyle('#6b7280')
  ctx.setFontSize(12)
  ctx.setTextAlign('center')
  ctx.fillText('扫码查看教练信息', width / 2, 370)

  // 绘制平台名称
  ctx.setFillStyle('#9ca3af')
  ctx.setFontSize(10)
  ctx.fillText('初球裁教平台', width / 2, 400)

  // 绘制完成
  ctx.draw(false, () => {
    // 将 canvas 转换为图片
    uni.canvasToTempFilePath({
      canvasId: 'composite-canvas',
      width: width,
      height: height,
      destWidth: width * 2,
      destHeight: height * 2,
      success: (res) => {
        // 保存图片到相册
        uni.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            uni.hideLoading()
            uni.showToast({
              title: '海报已保存到相册',
              icon: 'success'
            })
          },
          fail: (err) => {
            uni.hideLoading()
            console.error('保存海报失败', err)
            uni.showToast({
              title: '保存失败',
              icon: 'none'
            })
          }
        })
      },
      fail: (err) => {
        uni.hideLoading()
        console.error('canvas 转图片失败', err)
        uni.showToast({
          title: '生成海报失败',
          icon: 'none'
        })
      }
    })
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