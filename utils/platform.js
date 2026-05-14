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
 * 获取位置（多端兼容）
 * @param {Object} options 配置项
 * @param {string} options.type 坐标类型 'wgs84' | 'gcj02'，默认 'gcj02'
 * @param {boolean} options.altitude 是否需要高度信息，默认 false
 * @param {boolean} options.highAccuracy 是否高精度定位，默认 true
 * @param {number} options.timeout 超时时间(ms)，默认 10000
 * @returns {Promise<Object>} 位置信息
 */
export function getLocation(options = {}) {
  const {
    type = 'gcj02',
    altitude = false,
    highAccuracy = true,
    timeout = 15000
  } = options

  return new Promise((resolve, reject) => {
    // 先使用 uni.authorize 请求权限（兼容各平台）
    console.log('开始请求位置权限...')

    uni.authorize({
      scope: 'scope.userLocation',
      success: () => {
        console.log('uni.authorize 授权成功')
        doGetLocation()
      },
      fail: (err) => {
        console.log('uni.authorize 失败，尝试平台特定方式', err)
        // 如果 uni.authorize 失败，使用平台特定方式
        // #ifdef APP-PLUS
        requestLocationPermission().then(() => {
          doGetLocation()
        }).catch((err) => {
          reject(err)
        })
        // #endif

        // #ifndef APP-PLUS
        // 非 APP 端，直接尝试获取位置
        doGetLocation()
        // #endif
      }
    })

    function doGetLocation() {
      console.log('开始获取位置...')
      uni.getLocation({
        type,
        altitude,
        isHighAccuracy: highAccuracy,
        highAccuracyExpireTime: timeout,
        success: (res) => {
          console.log('获取位置成功', res)
          resolve({
            longitude: res.longitude,
            latitude: res.latitude,
            altitude: res.altitude,
            accuracy: res.accuracy,
            speed: res.speed,
            verticalAccuracy: res.verticalAccuracy,
            horizontalAccuracy: res.horizontalAccuracy,
            type
          })
        },
        fail: (err) => {
          console.error('获取位置失败', err)
          // 构建友好的错误信息
          let errorMsg = '获取位置失败'
          if (err.errMsg) {
            if (err.errMsg.includes('auth deny') || err.errMsg.includes('auth denied') || err.errMsg.includes('权限')) {
              errorMsg = '位置权限被拒绝，请在设置中开启位置权限'
            } else if (err.errMsg.includes('timeout')) {
              errorMsg = '获取位置超时，请检查网络和GPS设置'
            } else {
              errorMsg = err.errMsg
            }
          }
          reject({
            ...err,
            message: errorMsg
          })
        }
      })
    }
  })
}

/**
 * 检查Android权限是否已授予
 */
function checkAndroidPermission() {
  // #ifdef APP-PLUS
  try {
    const main = plus.android.runtimeMainActivity()
    const Context = plus.android.importClass('android.content.Context')
    const ActivityCompat = plus.android.importClass('androidx.core.app.ActivityCompat')
    const PackageManager = plus.android.importClass('android.content.pm.PackageManager')

    const fineLocationPermission = 'android.permission.ACCESS_FINE_LOCATION'
    const coarseLocationPermission = 'android.permission.ACCESS_COARSE_LOCATION'

    const fineResult = ActivityCompat.checkSelfPermission(main, fineLocationPermission)
    const coarseResult = ActivityCompat.checkSelfPermission(main, coarseLocationPermission)

    const granted = fineResult === PackageManager.PERMISSION_GRANTED || coarseResult === PackageManager.PERMISSION_GRANTED
    console.log('Android权限检查结果:', granted)
    return granted
  } catch (e) {
    console.error('检查Android权限失败', e)
    return false
  }
  // #endif
  return false
}

/**
 * 请求位置权限（仅APP端）
 * @returns {Promise<boolean>}
 */
export function requestLocationPermission() {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    const platform = getPlatform()
    console.log('当前平台:', platform)

    if (platform === 'android') {
      // Android：先检查是否已有权限
      if (checkAndroidPermission()) {
        console.log('已有位置权限')
        resolve(true)
        return
      }

      // 没有权限，请求权限
      console.log('请求位置权限...')
      plus.android.requestPermissions(
        ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_COARSE_LOCATION'],
        (e) => {
          console.log('权限请求回调:', e)
          if (e.code === 0) {
            // 检查是否用户授予了权限
            setTimeout(() => {
              if (checkAndroidPermission()) {
                resolve(true)
              } else {
                reject({ message: '位置权限被拒绝，请在设置中开启位置权限' })
              }
            }, 300)
          } else {
            reject({ message: '位置权限请求失败' })
          }
        },
        (e) => {
          console.error('权限请求错误:', e)
          reject({ message: '位置权限请求被拒绝，请在设置中开启位置权限' })
        }
      )
    } else if (platform === 'ios') {
      // iOS 直接获取，系统会自动弹权限框
      console.log('iOS平台，直接解析')
      resolve(true)
    } else if (platform === 'harmony') {
      // 鸿蒙权限请求
      try {
        const context = plus.android.importClass('ohos.app.ability.Ability')
        const permission = plus.android.importClass('ohos.security.permission.Permission')
        // 鸿蒙权限处理简化版，具体根据鸿蒙API调整
        resolve(true)
      } catch (e) {
        resolve(true)
      }
    } else {
      resolve(true)
    }
    // #endif

    // #ifndef APP-PLUS
    resolve(true)
    // #endif
  })
}

/**
 * 打开地图导航（多端兼容）
 * @param {Object} options 导航参数
 * @param {number} options.latitude 纬度
 * @param {number} options.longitude 经度
 * @param {string} options.name 目的地名称
 * @param {string} options.address 目的地地址
 * @param {string} options.mode 导航方式 'driving' | 'walking' | 'transit'，默认 'driving'
 * @param {boolean} options.isNewPage 小程序端是否新开全屏页面，默认 true（不覆盖原页面）
 */
export function openMapNavigation(options) {
  const {
    latitude, longitude, name, address,
    mode = 'driving',
    isNewPage = true // 新增：默认开启小程序新开页面
  } = options

  if (!latitude || !longitude) {
    uni.showToast({
      title: '地址信息有误',
      icon: 'none'
    })
    return
  }

  // 微信小程序：新开自定义全屏地图页，不覆盖原页面
  // #ifdef MP-WEIXIN
  // if (isNewPage) {
  //   // 跳转到自定义地图导航页，传参数
  //   // 注意：uni.navigateTo 会自动处理URL编码，不需要手动 encodeURIComponent
  //   uni.navigateTo({
  //     url: `/pages/map/navigation?latitude=${latitude}&longitude=${longitude}&name=${name || '目的地'}&address=${address || ''}`
  //   })
  //   return
  // }
  // // 不开启新页面就走原来的半屏逻辑
  // else {
    uni.openLocation({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      name: name || '目的地',
      address: address || '',
      scale: 18,
      success: () => console.log('打开地图成功'),
      fail: (err) => {
        uni.showToast({
          title: '打开地图失败：' + (err.errMsg || ''),
          icon: 'none'
        })
      }
    })
    return
  // }
  // #endif

  // H5 打开高德地图网页版
  // #ifdef H5
  const modeMap = { driving: 'car', walking: 'foot', transit: 'bus' }
  const url = `https://uri.amap.com/navigation?to=${longitude},${latitude},${encodeURIComponent(name || '目的地')}&mode=${modeMap[mode] || 'car'}`
  window.open(url, '_blank')
  return
  // #endif

  // APP端检测已安装的地图应用
  // #ifdef APP-PLUS
  uni.showLoading({ title: '检测地图应用中...' })

  const mapApps = []

  // 检测高德地图
  const hasAmap = isIOS()
      ? plus.runtime.isApplicationExist({ action: 'iosamap://' })
      : plus.runtime.isApplicationExist({ pname: 'com.autonavi.minimap' })

  // 检测百度地图
  const hasBaidumap = isIOS()
      ? plus.runtime.isApplicationExist({ action: 'baidumap://' })
      : plus.runtime.isApplicationExist({ pname: 'com.baidu.BaiduMap' })

  // 检测腾讯地图
  const hasTencentmap = isIOS()
      ? plus.runtime.isApplicationExist({ action: 'qqmap://' })
      : plus.runtime.isApplicationExist({ pname: 'com.tencent.map' })

  uni.hideLoading()

  if (hasAmap) mapApps.push({ name: '高德地图', value: 'amap' })
  if (hasBaidumap) mapApps.push({ name: '百度地图', value: 'baidumap' })
  if (hasTencentmap) mapApps.push({ name: '腾讯地图', value: 'tencentmap' })

  // 如果没有安装地图应用，提示用户
  if (mapApps.length === 0) {
    uni.showModal({
      title: '提示',
      content: '您未安装地图应用，请先安装高德、百度或腾讯地图',
      showCancel: false
    })
    return
  }

  // 如果只有一个地图应用，直接打开
  if (mapApps.length === 1) {
    launchMapApp(mapApps[0].value, { latitude, longitude, name, address, mode })
    return
  }

  // 多个地图应用，让用户选择
  uni.showActionSheet({
    itemList: mapApps.map(item => item.name),
    success: (res) => {
      launchMapApp(mapApps[res.tapIndex].value, { latitude, longitude, name, address, mode })
    }
  })
  // #endif
}

/**
 * 启动指定地图应用
 */
function launchMapApp(appType, options) {
  const { latitude, longitude, name, address, mode } = options
  const destName = encodeURIComponent(name || '目的地')
  const destAddress = encodeURIComponent(address || '')

  // #ifdef APP-PLUS
  let url = ''

  if (appType === 'amap') {
    // 高德地图
    if (isIOS()) {
      const modeMap = { driving: 0, walking: 2, transit: 1 }
      url = `iosamap://path?sourceApplication=${encodeURIComponent('cut-coach')}&daddr=${latitude},${longitude}&dev=0&t=${modeMap[mode] || 0}`
    } else {
      const modeMap = { driving: 0, walking: 2, transit: 1 }
      url = `amapuri://route/plan/?dlat=${latitude}&dlon=${longitude}&dname=${destName}&dev=0&t=${modeMap[mode] || 0}`
    }
  } else if (appType === 'baidumap') {
    // 百度地图 - 坐标需要转换
    const [bdLat, bdLon] = gcj02ToBd09(parseFloat(latitude), parseFloat(longitude))
    const modeMap = { driving: 'driving', walking: 'walking', transit: 'transit' }
    if (isIOS()) {
      url = `baidumap://map/direction?origin=我的位置&destination=latlng:${bdLat},${bdLon}|name:${destName}&mode=${modeMap[mode] || 'driving'}&src=cut-coach`
    } else {
      url = `baidumap://map/direction?origin=我的位置&destination=latlng:${bdLat},${bdLon}|name:${destName}&mode=${modeMap[mode] || 'driving'}&src=cut-coach`
    }
  } else if (appType === 'tencentmap') {
    // 腾讯地图
    const [qqLat, qqLon] = gcj02ToQq09(parseFloat(latitude), parseFloat(longitude))
    const modeMap = { driving: 'drive', walking: 'walk', transit: 'bus' }
    if (isIOS()) {
      url = `qqmap://map/routeplan?type=${modeMap[mode] || 'drive'}&to=${destName}&tocoord=${qqLat},${qqLon}&referer=cut-coach`
    } else {
      url = `qqmap://map/routeplan?type=${modeMap[mode] || 'drive'}&to=${destName}&tocoord=${qqLat},${qqLon}&referer=cut-coach`
    }
  }

  if (url) {
    plus.runtime.openURL(url, (err) => {
      uni.showToast({
        title: '打开地图失败',
        icon: 'none'
      })
    })
  }
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
 * 坐标转换：GCJ02 转 QQ09(腾讯)
 */
export function gcj02ToQq09(lat, lon) {
  // 腾讯地图使用 GCJ02，不需要转换
  return [lat, lon]
}

/**
 * 拨打电话（多端兼容）
 * @param {string} phoneNumber 电话号码
 */
export function makePhoneCall(phoneNumber) {
  if (!phoneNumber) {
    uni.showToast({
      title: '电话号码为空',
      icon: 'none'
    })
    return
  }

  // #ifdef APP-PLUS
  if (isHarmony()) {
    // 鸿蒙系统特殊处理
    try {
      plus.runtime.openURL(`tel:${phoneNumber}`)
    } catch (e) {
      uni.showToast({
        title: '拨号失败',
        icon: 'none'
      })
    }
    return
  }
  // #endif

  // 通用方式
  uni.makePhoneCall({
    phoneNumber: phoneNumber,
    fail: () => {
      uni.showToast({
        title: '拨号失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 显示位置权限设置引导
 */
export function showLocationPermissionGuide() {
  uni.showModal({
    title: '需要位置权限',
    content: '请在设置中开启位置权限，以便正常使用该功能',
    confirmText: '去设置',
    success: (res) => {
      if (res.confirm) {
        openPermissionSettings()
      }
    }
  })
}

/**
 * 打开应用权限设置页面
 */
export function openPermissionSettings() {
  // #ifdef MP-WEIXIN
  // 微信小程序：打开小程序设置页面
  uni.openSetting({
    success: (res) => {
      console.log('打开设置成功', res)
    },
    fail: (err) => {
      console.error('打开设置失败', err)
      uni.showToast({
        title: '请在小程序设置中开启权限',
        icon: 'none'
      })
    }
  })
  // #endif

  // #ifdef APP-PLUS
  if (isIOS()) {
    // iOS 打开应用设置
    plus.runtime.openURL('app-settings://')
  } else if (isAndroid()) {
    // Android 打开应用详情设置
    try {
      const Intent = plus.android.importClass('android.content.Intent')
      const Settings = plus.android.importClass('android.provider.Settings')
      const Uri = plus.android.importClass('android.net.Uri')
      const main = plus.android.runtimeMainActivity()
      const intent = new Intent()
      intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
      const uri = Uri.fromParts('package', main.getPackageName(), null)
      intent.setData(uri)
      main.startActivity(intent)
    } catch (e) {
      uni.showToast({
        title: '请手动打开设置',
        icon: 'none'
      })
    }
  } else if (isHarmony()) {
    // 鸿蒙打开设置
    try {
      // 鸿蒙设置页面跳转
      uni.showToast({
        title: '请在设置中开启权限',
        icon: 'none'
      })
    } catch (e) {
      uni.showToast({
        title: '请手动打开设置',
        icon: 'none'
      })
    }
  }
  // #endif

  // #ifdef H5
  // H5 端：提示用户在浏览器设置中开启权限
  uni.showToast({
    title: '请在浏览器设置中开启位置权限',
    icon: 'none',
    duration: 2000
  })
  // #endif
}

export default {
  getPlatform,
  isIOS,
  isAndroid,
  isHarmony,
  isMpWeixin,
  isH5,
  getLocation,
  requestLocationPermission,
  openMapNavigation,
  gcj02ToBd09,
  gcj02ToQq09,
  makePhoneCall,
  showLocationPermissionGuide,
  openPermissionSettings
}
