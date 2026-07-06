/**
 * 多端兼容工具函数
 * 支持 iOS、Android、鸿蒙、微信小程序、H5
 * 注意：定位功能已迁移至 @/utils/location.js
 */

import { phonePermissionMessages } from '@/utils/permission-messages'

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
 * 检查用户是否已同意拨打电话权限说明
 */
export function hasPhonePermissionAgreed() {
  const agreed = uni.getStorageSync('phone_permission_agreed')
  return !!agreed
}

/**
 * 设置用户同意拨打电话权限说明
 */
export function setPhonePermissionAgreed(agreed = true) {
  uni.setStorageSync('phone_permission_agreed', agreed)
}

/**
 * 显示拨打电话权限说明弹框
 */
export function showPhonePermissionExplanation() {
  return new Promise((resolve, reject) => {
    uni.showModal({
      title: phonePermissionMessages.title,
      content: phonePermissionMessages.explanation,
      confirmText: '同意',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          setPhonePermissionAgreed(true)
          resolve(true)
        } else {
          reject(new Error('用户拒绝拨打电话权限说明'))
        }
      },
      fail: () => {
        reject(new Error('弹框显示失败'))
      }
    })
  })
}

/**
 * 请求拨打电话系统权限（仅 APP 端）
 */
function requestCallPhonePermission() {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    // iOS 不需要动态申请权限
    if (isIOS()) {
      resolve(true);
      return;
    }

    // Android 6.0+ 需要动态申请权限
    if (isAndroid() || isHarmony()) {
      plus.android.requestPermissions(
        ['android.permission.CALL_PHONE'],
        (e) => {
          if (e.code === 0) {
            // 权限申请成功
            resolve(true);
          } else {
            // 权限申请失败
            reject(new Error('权限申请失败'));
          }
        },
        (e) => {
          reject(e);
        }
      );
      return;
    }
    // #endif

    // 非 APP 端不需要权限
    resolve(true);
  });
}

/**
 * 请求相机系统权限（仅 APP 端）
 */
function requestCameraPermission() {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    if (isIOS()) {
      // iOS 获取相机权限
      const AVCaptureDevice = plus.ios.importClass('AVCaptureDevice');
      const authStatus = AVCaptureDevice.authorizationStatusForMediaType('vide');

      if (authStatus === 0 || authStatus === 3) { // NotDetermined 或 Authorized
        resolve(true);
      } else {
        reject(new Error('权限被拒绝'));
      }
      return;
    }

    // Android 6.0+ 需要动态申请权限
    if (isAndroid() || isHarmony()) {
      plus.android.requestPermissions(
        ['android.permission.CAMERA'],
        (e) => {
          if (e.code === 0) {
            // 权限申请成功
            resolve(true);
          } else {
            // 权限申请失败
            reject(new Error('相机权限申请失败'));
          }
        },
        (e) => {
          reject(e);
        }
      );
      return;
    }
    // #endif

    // 非 APP 端不需要权限
    resolve(true);
  });
}

/**
 * 请求相册系统权限（仅 APP 端）
 */
function requestStoragePermission() {
  const  title = '相册权限未开启'
  const content = '您未开启相册权限，将无法保存。是否前往开启？'

  // #ifdef MP-WEIXIN
  uni.showModal({
    title,
    content,
    confirmText: '去开启',
    success: (res) => {
      if (res.confirm) {
        uni.openSetting({
          success: (settingRes) => {
            if (settingRes.authSetting['scope.writePhotosAlbum'] || settingRes.authSetting['scope.album']) {
              // onSuccess && onSuccess()
            }
          },
          fail: () => uni.showToast({ title: '打开设置失败', icon: 'none' })
        })
      }
    }
  })
  // #endif

  // #ifdef APP-PLUS
  uni.showModal({
    title,
    content,
    confirmText: '前往系统设置',
    success: (res) => {
      if (res.confirm) {
        openAppSetting()
      }
    }
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

  // 3. iOS 平台直接拨打电话，不需要权限说明和系统权限请求
  if (isIOS()) {
    doMakePhoneCall(cleanPhone)
    return
  }

  // 4. 非 iOS 平台检查用户是否已同意拨打电话权限说明
  if (!hasPhonePermissionAgreed()) {
    showPhonePermissionExplanation().then(() => {
      setPhonePermissionAgreed(true);
      // 用户同意权限说明后，请求系统拨打电话权限
      return requestCallPhonePermission();
    }).then(() => {
      // 系统权限获取成功，执行拨打电话
      doMakePhoneCall(cleanPhone);
    }).catch((err) => {
      uni.showToast({
        title: phonePermissionMessages.callFailed,
        icon: 'none'
      })
    })
  } else {
    // 用户已同意权限说明，直接请求系统拨打电话权限
    requestCallPhonePermission().then(() => {
      doMakePhoneCall(cleanPhone);
    }).catch((err) => {
      uni.showToast({
        title: phonePermissionMessages.callFailed,
        icon: 'none'
      })
    })
  }
}

/**
 * 实际拨打电话的函数
 */
function doMakePhoneCall(phoneNumber) {
  // #ifdef APP-PLUS
  // 只有【打包成 Android / iOS App】时，才会执行这里
  plus.runtime.openURL(`tel:${phoneNumber}`);
  // #endif

  // #ifndef APP-PLUS
  // 只有【不是 App】时（微信小程序、H5、快应用）才执行这里
  uni.makePhoneCall({ phoneNumber: phoneNumber });
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


/**
 * 打开应用设置页面
 */
const openAppSetting = () => {
  // #ifdef APP-PLUS
  const systemInfo = uni.getSystemInfoSync()
  const platform = systemInfo.platform
  const osName = (systemInfo.osName || systemInfo.systemName || '').toLowerCase()
  const isHarmony = osName.includes('harmony')

  if (platform === 'ios') {
    plus.runtime.openURL(plus.runtime.appid ? 'app-settings:' : 'prefs:root=Privacy')
  } else if (platform === 'android' || isHarmony) {
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
  } else {
    uni.openSetting({ fail: () => uni.showToast({ title: '打开设置失败', icon: 'none' }) })
  }
  // #endif
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
  getLocation,
  openAppSetting
}

export {
  requestCameraPermission,
  requestStoragePermission
}
