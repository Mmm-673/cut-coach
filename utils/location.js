import { regeocode } from '@/api/billiard/amap'
import constant from '@/utils/constant'
import { locationPermissionMessages } from '@/utils/permission-messages'

/**
 * 统一的定位工具模块
 * 封装 uni.getLocation + 逆地址解析 + 权限处理
 */

// 定位状态
let isLocating = false

import { isIOS, isAndroid, isHarmony } from '@/utils/platform'

/**
 * 检查用户是否已同意定位权限说明
 */
export const hasLocationPermissionAgreed = () => {
  const agreed = uni.getStorageSync(constant.locationPermissionAgreed)
  return !!agreed
}

/**
 * 设置用户同意定位权限说明
 */
export const setLocationPermissionAgreed = (agreed = true) => {
  uni.setStorageSync(constant.locationPermissionAgreed, agreed)
}

/**
 * 显示定位权限说明弹框
 */
export const showLocationPermissionExplanation = () => {
  return new Promise((resolve, reject) => {
    uni.showModal({
      title: locationPermissionMessages.title,
      content: locationPermissionMessages.explanation,
      confirmText: '同意',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          setLocationPermissionAgreed(true)
          resolve(true)
        } else {
          reject(new Error('用户拒绝定位权限说明'))
        }
      },
      fail: () => {
        reject(new Error('弹框显示失败'))
      }
    })
  })
}

/**
 * 打开应用设置页面（兼容 iOS、Android、鸿蒙）
 */
export const openAppSetting = () => {
  // #ifdef APP-PLUS
  const systemInfo = uni.getSystemInfoSync()

  if (isIOS()) {
    plus.runtime.openURL(plus.runtime.appid ? 'app-settings:' : 'prefs:root=LOCATION_SERVICES')
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
  } else {
    try {
      uni.openSetting({ fail: () => uni.showToast({ title: '打开设置失败', icon: 'none' }) })
    } catch (e) {
      uni.openSetting({ fail: () => uni.showToast({ title: '打开设置失败', icon: 'none' }) })
    }
  }
  // #endif
}

/**
 * 显示定位权限引导弹窗
 */
export const showPermissionModal = ({
                                      title = locationPermissionMessages.guide.title,
                                      content = locationPermissionMessages.guide.content,
                                      onSuccess
                                    } = {}) => {
  // #ifdef MP-WEIXIN
  uni.showModal({
    title,
    content,
    confirmText: '去开启',
    success: (res) => {
      if (res.confirm) {
        uni.openSetting({
          success: (settingRes) => {
            if (settingRes.authSetting['scope.userLocation']) {
              onSuccess && onSuccess()
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
    confirmText: '去开启',
    success: (res) => {
      if (res.confirm) {
        openAppSetting()
      }
    }
  })
  // #endif

}

/**
 * 获取定位 + 逆地址解析
 * @param {Object} options
 * @param {Boolean} options.needRegeocode - 是否需要逆地址解析（默认 true）
 * @param {String} options.type - 定位坐标系类型（默认 gcj02，因为已配置高德）
 * @returns {Promise}
 */
export const getLocation = ({
                              needRegeocode = false,
                              type = 'gcj02',
                              showExplanation = true // 是否显示权限说明弹框，默认显示
                            } = {}) => {
  return new Promise((resolve, reject) => {
    if (isLocating) {
      reject(new Error('正在定位中，请稍候'))
      return
    }

    // 检查是否需要显示权限说明弹框
    if (showExplanation && !hasLocationPermissionAgreed()) {
      showLocationPermissionExplanation().then(() => {
        // 用户同意后，继续执行定位
        isLocating = true
        _doGetLocation()
      }).catch((err) => {
        // 用户拒绝或弹框显示失败，直接拒绝
        reject(err)
      })
    } else {
      // 不需要显示弹框或用户已同意，直接执行定位
      isLocating = true
      _doGetLocation()
    }

    function _doGetLocation() {
      uni.getLocation({
        type,
        altitude: false,
        success: async (res) => {
          const location = {
            longitude: res.longitude,
            latitude: res.latitude
          }

          try {
            if (needRegeocode) {
              const geoRes = await regeocode(location)
              resolve({
                ...location,
                regeocodeData: geoRes.data
              })
            } else {
              resolve(location)
            }
          } catch (e) {
            resolve(location)
          } finally {
            isLocating = false
          }
        },
        fail: (err) => {
          isLocating = false

          // 微信小程序错误码处理
          let errorMsg = err.errMsg || ''
          if (errorMsg.includes('auth deny') || errorMsg.includes('authorize') || errorMsg.includes('denied') ||
              (err.errCode === 101000006)) {
            reject(new Error('permission_denied'))
          } else {
            reject(err)
          }
        }
      })
    }
  })
}

/**
 * 从逆地址解析数据中提取城市
 */
export const extractCity = (regeocodeData) => {
  if (!regeocodeData) return ''
  let city = regeocodeData.city
  if (city === '[]') city = null
  if (Array.isArray(city)) city = city.length > 0 ? city[0] : null
  return city || regeocodeData.province || ''
}

/**
 * 从逆地址解析数据中提取街道地址
 */
export const extractStreet = (regeocodeData) => {
  if (!regeocodeData) return ''
  return regeocodeData.street || regeocodeData.township || regeocodeData.district || ''
}

/**
 * 格式化距离显示
 */
export const formatDistance = (distance) => {
  if (distance === null || distance === undefined || distance === '') return ''
  if (typeof distance === 'number') {
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
  }
  return distance
}
