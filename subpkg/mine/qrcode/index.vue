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
            type="normal"
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { getCoachProfile } from '@/api/billiard/coach'
import constant from '@/utils/constant'
import { mediaPermissionMessages } from '@/utils/permission-messages'
import { isIOS, isAndroid, isHarmony, showPhotoPermissionGuide, isMpWeixin } from '@/utils/platform'

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
const isLoaded = ref(false)
const isLoadingShowing = ref(false) // 标记 loading 是否显示

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

      if (coachProfile.value.coachId) {
        isLoaded.value = true
        nextTick(() => {
          if (uqrcodeRef.value && typeof uqrcodeRef.value.make === 'function') {
            uqrcodeRef.value.make()
          }
        })
      }
    }
  } catch (err) {
    console.error('获取教练档案失败', err)
  }
}

const onQrcodeComplete = (res) => {
  if (uqrcodeRef.value) {
    uqrcodeRef.value.toTempFilePath({
      success: (res) => {
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

// 安全的 hideLoading
const safeHideLoading = () => {
  if (isLoadingShowing.value) {
    try {
      uni.hideLoading()
    } catch (e) {
      // 忽略错误
    }
    isLoadingShowing.value = false
  }
}

// 保存二维码 - 简化版：直接尝试保存，失败再处理
const saveQrcode = () => {
  const instance = uqrcodeRef.value

  if (!instance) {
    uni.showToast({
      title: '二维码未生成',
      icon: 'none'
    })
    return
  }

  // Android/鸿蒙 先弹自定义权限说明
  const doSave = () => {
    instance.save({
      success: () => {
        uni.showToast({
          title: '已保存到相册',
          icon: 'success'
        })
      },
      fail: (err) => {
        console.error('保存失败', err)
        handleSaveFail(err)
      }
    })
  }

  if (!hasMediaPermissionAgreed() && (isAndroid() || isHarmony())) {
    showMediaPermissionExplanation().then(() => {
      setMediaPermissionAgreed(true)
      doSave()
    }).catch(() => {
      // 用户拒绝
    })
  } else {
    doSave()
  }
}

// 处理保存失败
const handleSaveFail = (err) => {
  console.error('保存失败详情:', err)

  // #ifdef MP-WEIXIN
  // 微信小程序特殊处理
  if (err.errMsg && err.errMsg.includes('privacy')) {
    uni.showModal({
      title: '提示',
      content: '请先在小程序后台配置隐私协议，添加"保存到相册"功能',
      showCancel: false
    })
    return
  }
  // #endif

  // #ifdef APP-PLUS
  // APP 端：显示引导去设置
  showPhotoPermissionGuide()
  // #endif

  // #ifndef APP-PLUS
  // 小程序/H5 端：普通提示
  uni.showToast({
    title: '保存失败',
    icon: 'none',
    duration: 2000
  })
  // #endif
}

// 下载网络图片到本地（小程序中 canvas 只能绘制本地图片）
const downloadImage = (url) => {
  return new Promise((resolve, reject) => {
    // 如果不是网络图片，直接返回
    if (!url || !url.startsWith('http')) {
      resolve(url)
      return
    }
    uni.getImageInfo({
      src: url,
      success: (res) => {
        resolve(res.path)
      },
      fail: (err) => {
        console.error('下载图片失败:', err)
        // 下载失败时返回原图地址，至少尝试一下
        resolve(url)
      }
    })
  })
}

// 导出海报 - 简化版
const savePoster = () => {
  console.log('savePoster', '=======savePoster')
  // Android/鸿蒙 先弹自定义权限说明
  const doSave = async () => {
    isLoadingShowing.value = true
    uni.showLoading({ title: '海报生成中...' })

    try {
      // 先下载需要的图片
      const topAvatarPath = coachProfile.value.avatar ? await downloadImage(coachProfile.value.avatar) : ''
      let qrImagePath = qrcodeFilePath.value

      // #ifdef MP-WEIXIN
      // 微信小程序处理：如果是base64，先转换为临时文件
      if (qrImagePath && qrImagePath.startsWith('data:')) {
        const reg = new RegExp('^data:image/png;base64,', 'g')
        const dataURL = qrImagePath.replace(reg, '')
        const fs = wx.getFileSystemManager()
        const tempFilePath = `${wx.env.USER_DATA_PATH}/qr_${new Date().getTime()}.png`

        await new Promise((resolve, reject) => {
          fs.writeFile({
            filePath: tempFilePath,
            data: dataURL,
            encoding: 'base64',
            success: () => {
              qrImagePath = tempFilePath
              resolve()
            },
            fail: (err) => {
              console.error('base64转临时文件失败', err)
              reject(err)
            }
          })
        })
      }
      // #endif

      // 使用 canvas 合成海报
      const ctx = uni.createCanvasContext('composite-canvas')
      const width = 300
      const height = 450

      ctx.setFillStyle('#fff')
      ctx.fillRect(0, 0, width, height)

      const gradient = ctx.createLinearGradient(0, 0, 0, 150)
      gradient.addColorStop(0, '#2f6bee')
      gradient.addColorStop(1, '#1a50d9')
      ctx.setFillStyle(gradient)
      ctx.fillRect(0, 0, width, 150)

      ctx.setFillStyle('#fff')
      ctx.setFontSize(20)
      ctx.setTextAlign('center')
      ctx.fillText('初球裁教', width / 2, 40)
      ctx.setFontSize(14)
      ctx.fillText('专业台球教练服务', width / 2, 65)

      if (topAvatarPath) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(width / 2, 115, 30, 0, 2 * Math.PI)
        ctx.clip()
        ctx.drawImage(topAvatarPath, width / 2 - 30, 80, 60, 60)
        ctx.restore()
      }

      ctx.setFillStyle('#1f2937')
      ctx.setFontSize(18)
      ctx.setTextAlign('center')
      ctx.fillText(coachProfile.value.stageName || '裁教', width / 2, 180)

      if (qrImagePath) {
        ctx.drawImage(qrImagePath, width / 2 - 75, 200, 150, 150)

        // 在二维码中心绘制头像
        if (topAvatarPath) {
          const qrCenterX = width / 2
          const qrCenterY = 200 + 75 // 二维码顶部 + 一半高度
          const avatarSize = 28 // 头像大小（小一点）
          const avatarHalf = avatarSize / 2

          ctx.save()
          // 绘制白色正方形背景
          ctx.setFillStyle('#ffffff')
          ctx.fillRect(
            qrCenterX - avatarHalf - 2,
            qrCenterY - avatarHalf - 2,
            avatarSize + 4,
            avatarSize + 4
          )

          // 绘制正方形头像
          ctx.drawImage(
            topAvatarPath,
            qrCenterX - avatarHalf,
            qrCenterY - avatarHalf,
            avatarSize,
            avatarSize
          )
          ctx.restore()
        }
      }

      ctx.setFillStyle('#6b7280')
      ctx.setFontSize(12)
      ctx.setTextAlign('center')
      ctx.fillText('扫码查看教练信息', width / 2, 370)

      ctx.setFillStyle('#9ca3af')
      ctx.setFontSize(10)
      ctx.fillText('初球裁教平台', width / 2, 400)

      ctx.draw(false, () => {
        uni.canvasToTempFilePath({
          canvasId: 'composite-canvas',
          width: width,
          height: height,
          destWidth: width * 2,
          destHeight: height * 2,
          success: (res) => {
            uni.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                safeHideLoading()
                uni.showToast({
                  title: '海报已保存到相册',
                  icon: 'success'
                })
              },
              fail: (err) => {
                safeHideLoading()
                console.error('保存海报失败', err)
                handleSaveFail(err)
              }
            })
          },
          fail: (err) => {
            safeHideLoading()
            console.error('canvas 转图片失败', err)
            uni.showToast({
              title: '生成海报失败',
              icon: 'none'
            })
          }
        })
      })
    } catch (error) {
      safeHideLoading()
      console.error('生成海报出错:', error)
      uni.showToast({
        title: '生成海报失败',
        icon: 'none'
      })
    }
  }

  if (!hasMediaPermissionAgreed() && (isAndroid() || isHarmony())) {
    showMediaPermissionExplanation().then(() => {
      setMediaPermissionAgreed(true)
      doSave()
    }).catch(() => {
      // 用户拒绝
    })
  } else {
    doSave()
  }
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
  box-sizing: border-box;
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
  border: none;
}

.save-btn:active {
  transform: scale(0.97);
}
</style>