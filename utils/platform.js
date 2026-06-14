/**
 * 多端兼容工具函数
 * 支持 iOS、Android、鸿蒙、微信小程序、H5
 * 注意：定位功能已迁移至 @/utils/location.js
 */

/**
 * 获取当前平台
 * @returns {string} 'ios' | 'android' | 'harmony' | 'mp-weixin' | 'h5' | 'unknown'
 */
export function getPlatform() {
  // #ifdef APP-PLUS
  try {
    // 使用 uni.getSystemInfoSync 获取平台信息，兼容性更好
    const systemInfo = uni.getSystemInfoSync()
    const platform = systemInfo.platform || ''

    // 检查是否是鸿蒙系统
    if (systemInfo.system && systemInfo.system.toLowerCase().indexOf('harmony') !== -1) {
      return 'harmony'
    }

    if (platform === 'ios') {
      return 'ios'
    }
    return 'android'
  } catch (e) {
    // 如果获取失败，降级尝试 navigator（H5 环境）
    try {
      if (typeof navigator !== 'undefined' && navigator.userAgent) {
        const ua = navigator.userAgent.toLowerCase()
        if (ua.indexOf('harmony') !== -1 || ua.indexOf('openharmony') !== -1) {
          return 'harmony'
        }
        if (ua.indexOf('iphone') !== -1 || ua.indexOf('ipad') !== -1) {
          return 'ios'
        }
      }
    } catch (e2) {
      // 静默失败
    }
    // 默认返回 android
    return 'android'
  }
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
    const aMapUrl = `iosamap://path?sourceApplication=${encodeURIComponent('初球裁教版')}&daddr=${lat},${lon}&dname=${encodeURIComponent(name)}&dev=0&t=${mode === 'driving' ? '0' : '2'}`
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
  } else if (isAndroid() || isHarmony()) {
    // Android 和鸿蒙使用相同的地图应用方案
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
 * 拨打电话（多端兼容健壮版）
 */
export function makePhoneCall(phoneNumber) {
  // 1. 判空处理
  if (!phoneNumber) {
    uni.showToast({ title: '电话号码为空', icon: 'none' })
    return
  }

  // 2. 强制转为字符串，并清除所有空格、换行符及回车
  const cleanPhone = String(phoneNumber).replace(/\s+/g, '')

  if (!cleanPhone) {
    uni.showToast({ title: '无效的电话号码', icon: 'none' })
    return
  }

  // 3. 调用多端拨打 API

  // #ifdef APP-PLUS
  // 只有【打包成 Android / iOS App】时，才会执行这里
  plus.runtime.openURL(`tel:${cleanPhone}`);
  // #endif

  // #ifndef APP-PLUS
  // 只有【不是 App】时（微信小程序、H5、快应用）才执行这里
  uni.makePhoneCall({ phoneNumber: cleanPhone });
  // #endif
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

// 兼容旧代码 - 登录页面还在用这些函数
export const openPermissionSettings = () => {
  // #ifdef APP-PLUS
  const systemInfo = uni.getSystemInfoSync()

  // 使用已有的平台检测函数
  if (isIOS()) {
    plus.runtime.openURL('app-settings:')
  } else if (isAndroid() || isHarmony()) {
    // Android 和鸿蒙使用相同的处理方式
    const main = plus.android.runtimeMainActivity()
    const Intent = plus.android.importClass('android.content.Intent')
    const Settings = plus.android.importClass('android.provider.Settings')
    const Uri = plus.android.importClass('android.net.Uri')
    const packageName = main.getPackageName()

    try {
      const intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
      const uri = Uri.fromParts('package', packageName, null)
      intent.setData(uri)
      main.startActivity(intent)
    } catch (e) {
      try {
        const intent = new Intent(Settings.ACTION_SETTINGS)
        main.startActivity(intent)
      } catch (e2) {
        uni.showToast({ title: '打开设置失败', icon: 'none' })
      }
    }
  }
  // #endif
}

export const showLocationPermissionGuide = () => {
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

export const getLocation = (options = {}) => {
  const { type = 'gcj02', altitude = false } = options

  return new Promise((resolve, reject) => {
    uni.getLocation({
      type,
      altitude: false,
      success: (res) => {
        resolve({
          longitude: res.longitude,
          latitude: res.latitude
        })
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

export default {
  getPlatform,
  isIOS,
  isAndroid,
  isHarmony,
  isMpWeixin,
  isH5,
  openMapNavigation,
  makePhoneCall,
  gcj02ToBd09,
  calculateDistance,
  isMockVenue,
  openPermissionSettings,
  showLocationPermissionGuide,
  getLocation
}
