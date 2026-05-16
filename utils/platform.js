/**
 * 多端兼容工具函数
 * 支持 iOS、Android、鸿蒙、微信小程序、H5
 */

/**
 * 获取当前平台
 * @returns {string} 'ios' | 'android' | 'harmony' | 'mp-weixin' | 'h5' | 'unknown'
 */
export function getPlatform() {
  // #ifdef APP-PLUS
  const ua = navigator.userAgent.toLowerCase()
  if (ua.indexOf('harmony') !== -1 || ua.indexOf('openharmony') !== -1) {
    return 'harmony'
  }
  if (ua.indexOf('iphone') !== -1 || ua.indexOf('ipad') !== -1) {
    return 'ios'
  }
  return 'android'
  // #endif

  // #ifdef MP-WEIXIN
  return 'mp-weixin'
  // #endif

  // #ifdef H5
  return 'h5'
  // #endif

  return 'unknown'
}

/**
 * 检查是否是 iOS 平台
 */
export function isIOS() {
  return getPlatform() === 'ios'
}

/**
 * 检查是否是 Android 平台
 */
export function isAndroid() {
  return getPlatform() === 'android'
}

/**
 * 检查是否是鸿蒙平台
 */
export function isHarmony() {
  return getPlatform() === 'harmony'
}

/**
 * 检查是否是微信小程序
 */
export function isMpWeixin() {
  return getPlatform() === 'mp-weixin'
}

/**
 * 检查是否是 H5
 */
export function isH5() {
  return getPlatform() === 'h5'
}

/**
 * 打开应用设置页面
 */
export function openPermissionSettings() {
  // #ifdef MP-WEIXIN
  uni.openSetting({
    success: (res) => {
      console.log('打开设置成功:', res)
    },
    fail: () => {
      uni.showToast({ title: '打开设置失败', icon: 'none' })
    }
  })
  // #endif

  // #ifdef APP-PLUS
  if (isIOS()) {
    plus.runtime.openURL('app-settings:')
  } else if (isAndroid()) {
    try {
      const Intent = plus.android.importClass('android.content.Intent')
      const Settings = plus.android.importClass('android.provider.Settings')
      const Uri = plus.android.importClass('android.net.Uri')
      const main = plus.android.runtimeMainActivity()
      const intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
      const uri = Uri.fromParts('package', main.getPackageName(), null)
      intent.setData(uri)
      main.startActivity(intent)
    } catch (e) {
      try {
        const Intent = plus.android.importClass('android.content.Intent')
        const Settings = plus.android.importClass('android.provider.Settings')
        const main = plus.android.runtimeMainActivity()
        const intent = new Intent(Settings.ACTION_SETTINGS)
        main.startActivity(intent)
      } catch (e2) {
        uni.showToast({ title: '打开设置失败', icon: 'none' })
      }
    }
  }
  // #endif

  // #ifdef H5
  uni.showModal({
    title: '定位权限未开启',
    content: '请在浏览器地址栏左侧点击锁形图标，允许本网站访问您的位置',
    showCancel: false
  })
  // #endif
}

/**
 * 显示权限引导弹窗
 */
export function showLocationPermissionGuide() {
  uni.showModal({
    title: '定位权限未开启',
    content: '您未开启定位权限，将无法使用相关功能。是否前往开启？',
    confirmText: '去开启',
    success: (res) => {
      if (res.confirm) {
        openPermissionSettings()
      }
    }
  })
}

/**
 * 获取位置（多端兼容）
 * @param {Object} options 配置项
 * @returns {Promise<Object>} 位置信息
 */
export const getLocation = (options = {}) => {
  const { type = 'gcj02', altitude = true } = options

  return new Promise((resolve, reject) => {
    console.log('开始获取位置...')

    // #ifdef APP-PLUS
    // App 端：使用原生高德定位，权限请求更可靠
    plus.geolocation.getCurrentPosition(
        (res) => {
          console.log('✅ 定位成功:', res)
          resolve({
            longitude: res.coords.longitude,
            latitude: res.coords.latitude,
            altitude: res.coords.altitude,
            accuracy: res.coords.accuracy,
            speed: res.coords.speed,
            type
          })
        },
        (err) => {
          console.error('❌ 定位失败:', err)
          // 如果是权限问题，引导用户去设置
          if (err.code === 2 || err.code === 3) {
            uni.showModal({
              title: '定位权限被拒绝',
              content: '需要您的位置信息才能接单，是否去设置？',
              confirmText: '去设置',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  openPermissionSettings()
                }
              }
            })
            reject({ ...err, message: '位置权限被拒绝' })
          } else {
            reject({ ...err, message: err.message || '获取位置失败' })
          }
        },
        { provider: 'amap', geocode: false }
    )
    // #endif

    // #ifndef APP-PLUS
    // 小程序/H5 端：用 uni.getLocation
    uni.getLocation({
      type,
      altitude,
      success: (res) => {
        console.log('✅ 定位成功:', res)
        resolve({
          longitude: res.longitude,
          latitude: res.latitude,
          altitude: res.altitude,
          accuracy: res.accuracy,
          speed: res.speed,
          type
        })
      },
      fail: (err) => {
        console.error('❌ 定位失败:', err)
        let errorMsg = '获取位置失败'
        if (err.errMsg) {
          if (err.errMsg.includes('auth deny') || err.errMsg.includes('auth denied') || err.errMsg.includes('权限')) {
            errorMsg = '位置权限被拒绝'
          } else if (err.errMsg.includes('timeout')) {
            errorMsg = '获取位置超时，请检查网络和GPS设置'
          } else {
            errorMsg = err.errMsg
          }
        }
        reject({ ...err, message: errorMsg })
      }
    })
    // #endif
  })
}

/**
 * 打开地图导航（多端兼容）
 */
export function openMapNavigation(options) {
  const { latitude, longitude, name = '目的地', address = '', mode = 'driving' } = options

  if (!latitude || !longitude) {
    uni.showToast({ title: '地址信息有误', icon: 'none' })
    return
  }

  // #ifdef APP-PLUS
  // App 端尝试调用系统地图应用
  const lat = parseFloat(latitude)
  const lon = parseFloat(longitude)

  if (isIOS()) {
    // iOS 先尝试高德地图，再尝试百度地图，最后用系统地图
    const aMapUrl = `iosamap://path?sourceApplication=${encodeURIComponent('球了么裁教')}&daddr=${lat},${lon}&dname=${encodeURIComponent(name)}&dev=0&t=${mode === 'driving' ? '0' : '2'}`
    const baiduUrl = `baidumap://map/direction?destination=name:${encodeURIComponent(name)}|latlng:${lat},${lon}&mode=${mode === 'driving' ? 'driving' : 'walking'}&coord_type=gcj02`

    plus.runtime.openURL(aMapUrl, (err) => {
      // 高德地图打不开，试百度
      plus.runtime.openURL(baiduUrl, (err2) => {
        // 都打不开，用系统地图
        uni.openLocation({
          latitude: lat,
          longitude: lon,
          name: name,
          address: address,
          scale: 18
        })
      })
    })
  } else if (isAndroid()) {
    // Android 同样尝试多个地图应用
    const aMapUrl = `amapuri://route/plan/?daddr=${lat},${lon}&dname=${encodeURIComponent(name)}&dev=0&t=${mode === 'driving' ? '0' : '2'}`
    const baiduUrl = `baidumap://map/direction?destination=name:${encodeURIComponent(name)}|latlng:${lat},${lon}&mode=${mode === 'driving' ? 'driving' : 'walking'}&coord_type=gcj02`

    plus.runtime.openURL(aMapUrl, (err) => {
      plus.runtime.openURL(baiduUrl, (err2) => {
        uni.openLocation({
          latitude: lat,
          longitude: lon,
          name: name,
          address: address,
          scale: 18
        })
      })
    })
  } else {
    // 其他系统用通用方案
    uni.openLocation({
      latitude: lat,
      longitude: lon,
      name: name,
      address: address,
      scale: 18
    })
  }
  // #endif

  // #ifndef APP-PLUS
  // 小程序和 H5 直接用 uni.openLocation
  uni.openLocation({
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    name: name,
    address: address,
    scale: 18
  })
  // #endif
}

/**
 * 拨打电话（多端兼容）
 */
export function makePhoneCall(phoneNumber) {
  if (!phoneNumber) {
    uni.showToast({ title: '电话号码为空', icon: 'none' })
    return
  }
  uni.makePhoneCall({ phoneNumber })
}

/**
 * 坐标转换：GCJ02(高德/微信) 转 BD09(百度)
 */
export function gcj02ToBd09(ggLat, ggLon) {
  const xPI = 3.14159265358979324 * 3000.0 / 180.0
  const z = Math.sqrt(ggLon * ggLon + ggLat * ggLat) + 0.00002 * Math.sin(ggLat * xPI)
  const theta = Math.atan2(ggLat, ggLon) + 0.000003 * Math.cos(ggLon * xPI)
  const bdLon = z * Math.cos(theta) + 0.0065
  const bdLat = z * Math.sin(theta) + 0.006
  return [bdLat, bdLon]
}

/**
 * 计算两点之间的距离（米）
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * 判断场馆数据是否为 Mock 测试数据
 */
export function isMockVenue(venueName, venueAddress) {
  if (!venueName || venueName === '-') return true
  if (/mock/i.test(venueName)) return true
  if (/mock/i.test(venueAddress || '')) return true
  return false
}

export default {
  getPlatform,
  isIOS,
  isAndroid,
  isHarmony,
  isMpWeixin,
  isH5,
  getLocation,
  openMapNavigation,
  makePhoneCall,
  showLocationPermissionGuide,
  openPermissionSettings,
  gcj02ToBd09,
  isMockVenue
}
