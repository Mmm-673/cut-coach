# 多端兼容开发指南

## 概述

本项目已适配 iOS、Android、鸿蒙、微信小程序、H5 五个平台。

## 平台检测

使用 `utils/platform.js` 中的工具函数检测当前平台：

```javascript
import {
  getPlatform,
  isIOS,
  isAndroid,
  isHarmony,
  isMpWeixin,
  isH5
} from '@/utils/platform'

const platform = getPlatform() // 'ios' | 'android' | 'harmony' | 'mp-weixin' | 'h5'
```

## 已适配的功能

### 1. 位置获取 (`getLocation`)

多端兼容的位置获取，自动处理权限请求。

```javascript
import { getLocation } from '@/utils/platform'

try {
  const location = await getLocation({
    type: 'gcj02',           // 坐标类型：wgs84 | gcj02
    highAccuracy: true,       // 是否高精度
    timeout: 10000            // 超时时间(ms)
  })
  console.log(location.longitude, location.latitude)
} catch (err) {
  console.error(err.message)
  // err.message 包含友好的错误信息
}
```

**平台处理：**
- **iOS**: 系统自动弹权限框
- **Android**: 主动请求 `ACCESS_FINE_LOCATION` 和 `ACCESS_COARSE_LOCATION` 权限
- **鸿蒙**: 兼容鸿蒙权限系统
- **微信小程序**: 使用 uni.getLocation，需在 manifest.json 配置权限
- **H5**: 浏览器定位

### 2. 地图导航 (`openMapNavigation`)

自动检测设备上已安装的地图应用并调起导航。

```javascript
import { openMapNavigation } from '@/utils/platform'

openMapNavigation({
  latitude: 31.230416,
  longitude: 121.473701,
  name: 'XX台球厅',
  address: '上海市浦东新区XX路123号',
  mode: 'driving'  // driving | walking | transit
})
```

**支持的地图应用：**
- 高德地图 (iOS/Android/鸿蒙)
- 百度地图 (iOS/Android/鸿蒙)
- 腾讯地图 (iOS/Android/鸿蒙)
- 微信小程序内置地图
- H5 高德网页版

**坐标转换：**
- 自动 GCJ02 → BD09 (百度地图)
- GCJ02 直接使用 (高德/腾讯/微信)

### 3. 拨打电话 (`makePhoneCall`)

```javascript
import { makePhoneCall } from '@/utils/platform'

makePhoneCall('13800008888')
```

### 4. 权限引导 (`showLocationPermissionGuide`)

当用户拒绝权限时，引导用户去设置页面开启。

```javascript
import { showLocationPermissionGuide } from '@/utils/platform'

showLocationPermissionGuide()
```

**平台处理：**
- **iOS**: 打开 `app-settings://`
- **Android**: 打开应用详情设置页面
- **鸿蒙**: 引导手动打开设置
- **其他**: 提示手动操作

## 已适配的页面

### 1. `pages/login/index.vue`

- 登录成功后使用 `getLocation()` 获取位置
- 权限失败时显示友好提示和引导
- 无论位置获取成功/失败都能正常跳转

### 2. `pages/work/index.vue`

- 上线时使用 `getPlatformLocation()` 获取位置
- 导航使用 `openMapNavigation()` 支持多地图选择
- 打电话使用 `makePhoneCall()` 多端兼容
- 权限拒绝时显示 `showLocationPermissionGuide()`

## 条件编译说明

虽然使用了统一的工具函数，但内部仍使用 uni-app 条件编译处理平台差异：

```javascript
// #ifdef APP-PLUS
// APP 端特有代码
// #endif

// #ifdef MP-WEIXIN
// 微信小程序特有代码
// #endif

// #ifdef H5
// H5 特有代码
// #endif
```

## manifest.json 配置

确保以下权限已配置：

```json
{
  "mp-weixin": {
    "permission": {
      "scope.userLocation": {
        "desc": "您的位置信息将用于导航到服务地点"
      }
    },
    "requiredPrivateInfos": ["getLocation", "chooseLocation"]
  },
  "app-plus": {
    "modules": {
      "Location": {}
    },
    "distribute": {
      "android": {
        "permissions": [
          "<uses-permission android:name=\"android.permission.ACCESS_FINE_LOCATION\"/>",
          "<uses-permission android:name=\"android.permission.ACCESS_COARSE_LOCATION\"/>"
        ]
      },
      "ios": {
        "NSLocationWhenInUseUsageDescription": "需要获取您的位置信息，为您提供导航服务"
      }
    }
  }
}
```

## 测试清单

### iOS 测试
- [ ] 位置权限弹窗正常
- [ ] 位置获取成功
- [ ] 高德地图导航调起
- [ ] 百度地图导航调起
- [ ] 拨打电话正常

### Android 测试
- [ ] 位置权限请求正常
- [ ] 位置获取成功
- [ ] 高德地图导航调起
- [ ] 百度地图导航调起
- [ ] 拨打电话正常
- [ ] 权限拒绝后引导打开设置

### 鸿蒙测试
- [ ] 位置权限正常
- [ ] 位置获取成功
- [ ] 地图导航调起
- [ ] 拨打电话正常

### 微信小程序测试
- [ ] 位置授权弹窗正常
- [ ] 位置获取成功
- [ ] 内置地图打开正常
- [ ] 拨打电话正常

### H5 测试
- [ ] 浏览器定位正常
- [ ] 高德网页版打开正常

## 注意事项

1. **坐标系**: 后端统一使用 GCJ02 (火星坐标)
2. **权限**: APP端首次使用位置时，会先请求权限再获取位置
3. **降级处理**: 所有功能都有降级方案，权限/功能失败不会阻塞主流程
4. **超时**: 位置获取默认超时 10 秒，可根据需要调整
5. **地图检测**: APP端会自动检测已安装的地图，没有安装时提示用户
