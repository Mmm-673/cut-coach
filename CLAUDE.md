# 初球裁教版

> 面向台球专业教练、裁教从业者打造。在线接收用户陪练预约订单，自主接单、管理服务日程、查看收益明细。平台统一合规结算、订单管理与客服协作，助力台球从业者线上接单，灵活增收，高效开展台球教学陪练服务。

---

## 项目概述

**项目名称**：初球裁教版（初球裁教版）

**技术架构**：UniApp + Vue 3 + Pinia + ColorUI

**多平台支持**：
- iOS（原生 App）
- Android（原生 App）
- 鸿蒙（原生 App）
- 微信小程序
- H5

**开发工具**：HBuilderX

---

## 技术栈

### 核心框架
- **UniApp**：跨平台应用框架
- **Vue 3**：Composition API（`<script setup>`）
- **Pinia**：状态管理

### UI 组件库
- **ColorUI**：主要样式库
- **UniUI**：UniApp 官方组件库
- **Uni 组件**：uni-card、uni-section、uni-tag、uni-icons 等

### 样式
- **SCSS**：样式预处理

---

## 项目结构

```
cut-coach/
├── api/                          # API 请求模块
│   ├── billiard/
│   │   ├── coach.js            # 教练相关 API
│   │   ├── order.js          # 订单相关 API
│   │   └── wallet.js         # 钱包相关 API
│   ├── login.js               # 登录认证 API
│   └── system/
│       ├── dict/
│       │   └── data.js
│       │   └── type.js
│       └── user.js
│
├── pages/                        # 页面路由
│   ├── login/                  # 登录页
│   │   └── index.vue
│   ├── register/              # 注册页
│   │   └── index.vue
│   ├── work/                  # 工作台（核心订单处理）
│   │   └── index.vue
│   ├── order/                # 订单模块
│   │   ├── index.vue        # 订单列表
│   │   └── detail.vue       # 订单详情
│   ├── mine/                 # 个人中心
│   │   ├── index.vue        # 个人中心首页
│   │   ├── info/           # 个人信息
│   │   │   ├── index.vue
│   │   │   └── edit.vue
│   │   ├── wallet/         # 钱包
│   │   │   ├── index.vue        # 钱包首页
│   │   │   ├── withdraw/          # 提现
│   │   │   ├── withdraw-record/ # 提现记录
│   │   │   ├── deduct/         # 扣款记录
│   │   │   └── appeal/         # 扣款申诉
│   │   ├── avatar/       # 修改头像
│   │   ├── pwd/       # 修改密码
│   │   ├── setting/   # 设置
│   │   ├── evaluate/ # 我的评价
│   │   ├── help/     # 常见问题
│   │   └── about/   # 关于我们
│   ├── map/                   # 地图导航
│   │   └── navigation.vue
│   ├── common/               # 通用页面
│   │   ├── webview/
│   │   │   └── index.vue
│   │   └── textview/
│   │       └── index.vue
│   └── index.vue           # 启动页
│
├── store/                       # Pinia 状态管理
│   ├── index.js
│   └── modules/
│       ├── user.js            # 用户状态
│       ├── config.js         # 配置状态
│       └── dict.js         # 字典状态
│
├── utils/                      # 工具函数
│   ├── platform.js          # 多平台兼容性（核心）
│   ├── request.js          # 请求拦截器（带 Token 刷新
│   ├── auth.js           # 认证工具
│   ├── common.js          # 通用工具
│   ├── dict.js         # 字典工具
│   ├── errorCode.js    # 错误码
│   ├── permission.js     # 权限工具
│   ├── storage.js       # 存储工具
│   ├── validate.js   # 验证工具
│   └── upload.js      # 上传工具
│
├── plugins/                     # 插件
│   ├── index.js
│   ├── auth.js
│   ├── modal.js
│   └── tab.js
│
├── static/                     # 静态资源
│   ├── scss/              # 样式文件
│   │   ├── index.scss       # 样式入口
│   │   ├── global.scss    # 全局样式/变量
│   │   └── colorui.css   # ColorUI 样式
│   ├── font/             # 字体图标
│   │   ├── iconfont.css
│   │   └── iconfont.ttf
│   ├── images/           # 图片
│   │   ├── banner/
│   │   ├── tabbar/
│   │   └── profile.jpg
│   └── index.html       # H5 模板
│
├── App.vue                   # 根组件
├── main.js                  # 入口文件
├── pages.json               # 路由/导航栏/TabBar 配置
├── manifest.json           # 应用配置
├── config.js             # 全局配置（API 地址等）
├── permission.js         # 权限控制
└── index.html
```

---

## 核心模块

### 1. 工作台模块 (pages/work/index.vue)

**核心功能**：
- 工作状态切换（上线/下线）
- 免费出行开关
- 待接单订单处理
- 已接单服务流程
- 教学中计时
- 今日数据看板
- 历史订单列表

**订单状态流转**：
```
idle (空闲) → pending (待接单) → accepted (已接单) → serving (教学中) → completed (已完成)
                ↓
              rejected (已拒绝)
```

**关键功能**：
- 每 5 秒轮询待接单列表
- 待接单倒计时（超时自动退回）
- 服务端计时（支持加钟）
- 多端地图导航
- 位置校验（到达球厅 200 米内打卡）
- 异常上报

### 2. 订单模块 (pages/order/)

**功能列表**：
- 订单列表（分页）
- 订单详情
- 订单状态展示

### 3. 个人中心模块 (pages/mine/)

**功能列表**：
- 个人信息管理
- 头像修改
- 密码修改
- 钱包管理
- 我的评价
- 常见问题
- 关于我们

### 4. 钱包模块 (pages/mine/wallet/)

**功能列表**：
- 可提现余额查询
- 提现申请
- 提现记录
- 扣款记录
- 扣款申诉

### 5. 登录模块 (pages/login/)

**支持登录方式**：
- 账号密码登录
- 手机验证码登录

---

## API 模块

### 基础配置

```javascript
// config.js
export default {
  baseUrl: 'http://114.67.69.228',
  appInfo: {
    name: 'ruoyi-app',
    version: '1.2.0'
  }
}
```

**请求特点**：
- 所有请求自动携带 tenant-id: '122'
- 自动 Token 刷新机制
- Token 快过期时（提前 5 分钟）自动刷新
- 错误码统一处理

### API 列表

#### 登录认证 (api/login.js)

| 方法 | 说明 |
|-----|------|
| `login(data)` | 账号密码登录 |
| `sendSmsCode(mobile)` | 发送短信验证码 |
| `smsLogin(data)` | 手机验证码登录 |
| `logout()` | 退出登录 |
| `refreshToken(refreshToken)` | 刷新 Token |
| `getInfo()` | 获取用户信息 |

#### 教练模块 (api/billiard/coach.js)

| 方法 | 说明 |
|-----|------|
| `updateWorkStatus(data)` | 切换工作状态（上线/下线）|
| `updateLocation(data)` | 更新教练位置 |
| `getCoachProfile()` | 获取教练个人信息 |
| `updateFreeTravel(data)` | 切换免费出行开关 |
| `getCoachDashboard()` | 获取教练看板数据 |
| `getWorkStatus()` | 查询当前工作状态 |

#### 订单模块 (api/billiard/order.js)

| 方法 | 说明 |
|-----|------|
| `getPendingOrders()` | 获取待接单列表 |
| `acceptOrder(data)` | 接单 |
| `rejectOrder(data)` | 拒单 |
| `confirmDeparture(data)` | 确认出发 |
| `arrive(data)` | 到达服务地址 |
| `startService(data)` | 开始教学 |
| `finishService(data)` | 结束教学 |
| `getOrderPage(params)` | 获取订单列表（分页）|
| `getInProgressOrder()` | 获取进行中订单详情 |
| `getOrderDetail(id)` | 获取订单详情 |
| `reportException(data)` | 报告异常 |

#### 计时器模块 (api/billiard/order.js)

| 方法 | 说明 |
|-----|------|
| `startTimer(data)` | 开始计时（服务端）|
| `endTimer(data)` | 结束计时（服务端）|
| `getTimerStatus(orderId)` | 查询计时状态 |

#### 钱包模块 (api/billiard/wallet.js)

| 方法 | 说明 |
|-----|------|
| `getWalletBalance()` | 查询可提现余额 |
| `getWithdrawalPage(params)` | 获取提现记录 |
| `createWithdrawal(data)` | 发起提现申请 |
| `getDeductionPage(params)` | 获取扣款记录 |
| `postDeductionAppeal(data)` | 提交扣款申诉 |

---

## Store 模块

### 1. 用户 Store (store/modules/user.js)

**状态**：
- `token`：访问令牌
- `id`：用户 ID
- `name`：用户昵称
- `avatar`：头像
- `roles`：角色列表
- `permissions`：权限列表

**方法**：
- `login(userInfo)`：账号密码登录
- `smsLogin(userInfo)`：短信登录
- `getInfo()`：获取用户信息
- `logOut()`：退出登录

### 2. 配置 Store (store/modules/config.js)

**状态**：
- `config`：全局配置对象

**方法**：
- `setConfig(val)`：设置配置

### 3. 字典 Store (store/modules/dict.js)

**状态**：
- `dict`：字典数组

**方法**：
- `getDict(key)`：获取字典
- `setDict(key, value)`：设置字典
- `removeDict(key)`：删除字典
- `cleanDict()`：清空字典

---

## 页面路由

### TabBar 页面 (pages.json)

| 路径 | 名称 | 图标 |
|-----|------|------|
| `pages/work/index` | 工作台 | work.png / work_.png |
| `pages/order/index` | 订单 | order.png / order_.png |
| `pages/mine/index` | 我的 | mine.png / mine_.png |

### 完整路由列表

| 路径 | 说明 |
|-----|------|
| `pages/login/index` | 登录页 |
| `pages/register` | 注册页 |
| `pages/index` | 启动页 |
| `pages/work/index` | 工作台（Tab）|
| `pages/order/index` | 订单列表（Tab）|
| `pages/order/detail` | 订单详情 |
| `pages/mine/index` | 我的（Tab）|
| `pages/mine/info/index` | 个人信息 |
| `pages/mine/info/edit` | 编辑信息 |
| `pages/mine/avatar/index` | 修改头像 |
| `pages/mine/pwd/index` | 修改密码 |
| `pages/mine/setting/index` | 设置 |
| `pages/mine/wallet/index` | 钱包 |
| `pages/mine/wallet/withdraw/index` | 提现 |
| `pages/mine/wallet/withdraw-record/index` | 提现记录 |
| `pages/mine/wallet/deduct/index` | 扣款记录 |
| `pages/mine/wallet/appeal/index` | 扣款申诉 |
| `pages/mine/evaluate/index` | 我的评价 |
| `pages/mine/help/index` | 常见问题 |
| `pages/mine/about/index` | 关于我们 |
| `pages/map/navigation` | 地图导航 |
| `pages/common/webview/index` | 内嵌网页 |
| `pages/common/textview/index` | 文本浏览 |

---

## 开发规范

### 1. 命名规范

- **组件**：PascalCase
- **文件**：kebab-case
- **变量/函数**：camelCase
- **常量**：UPPER_SNAKE_CASE
- **CSS 类**：kebab-case

### 2. 样式变量 (static/scss/global.scss)

**主题色**：
```scss
$primary: #2f6bff;         // 主色调
$primary-dark: #1a50d9;    // 主色深色
$success: #10b981;         // 成功色
$warning: #f59e0b;         // 警告色
$danger: #ef4444;           // 危险色
```

**文本色**：
```scss
$text-primary: #1f2937;   // 主文本
$text-secondary: #6b7280;  // 次要文本
$text-tertiary: #9ca3af; // 第三文本
```

**背景色**：
```scss
$bg-page: #f7f8fa;      // 页面背景
$bg-card: #ffffff;        // 卡片背景
```

**边框色**：
```scss
$border: #e5e7eb;
$border-light: #f3f4f6;
```

**圆角**：
```scss
$radius-sm: 8rpx;
$radius-base: 16rpx;
$radius-xl: 24rpx;
```

**阴影**：
```scss
$shadow-base: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
$shadow-lg: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
```

**动画**：
```scss
$duration-fast: 0.2s;
$duration-base: 0.3s;
$ease-out: cubic-bezier(0.21, 0.64, 0.29, 0.99);
```

### 3. 组件使用规范

**页面布局**：
```vue
<template>
  <view class="page-wrapper">
    <!-- 内容 -->
  </view>
</template>

<script setup>
// 引入依赖
</script>

<style lang="scss" scoped>
.page-wrapper {
  min-height: 100vh;
  background: $bg-page;
  padding: 32rpx;
}
</style>
```

**卡片使用**：
```vue
<uni-card title="标题" :is-shadow="true" :border="false">
  <!-- 内容 -->
</uni-card>
```

### 4. API 请求规范

```javascript
// 使用示例
import { getCoachProfile } from '@/api/billiard/coach'

// 调用
getCoachProfile().then(res => {
  if (res.code === 0 || res.code === 200) {
    // 成功处理
  }
}).catch(err => {
  // 错误处理
})
```

---

## 工具函数

### 平台兼容性工具 (utils/platform.js)

**关键方法**：

| 方法 | 说明 |
|-----|------|
| `getPlatform()` | 获取当前平台：ios / android / harmony / mp-weixin / h5 |
| `isIOS()` | 是否 iOS |
| `isAndroid()` | 是否 Android |
| `isHarmony()` | 是否鸿蒙 |
| `isMpWeixin()` | 是否微信小程序 |
| `isH5()` | 是否 H5 |
| `getLocation(options)` | 获取位置（带权限处理）|
| `openMapNavigation(options)` | 打开地图导航（自动检测已安装地图）|
| `makePhoneCall(phoneNumber)` | 拨打电话 |
| `showLocationPermissionGuide()` | 显示位置权限引导 |
| `openPermissionSettings()` | 打开应用权限设置 |
| `gcj02ToBd09(lat, lon)` | GCJ02 坐标转 BD09（百度）|
| `gcj02ToQq09(lat, lon)` | GCJ02 坐标转 QQ09（腾讯）|

**注意**：
- 后端使用 GCJ02 坐标系统（高德/腾讯）
- 百度地图需要转换为 BD09
- 微信小程序、高德地图直接使用 GCJ02

### 请求拦截器 (utils/request.js)

**功能**：
- 自动添加 tenant-id
- 自动添加 Authorization Token
- Token 过期自动刷新
- 请求队列管理（刷新期间请求排队）
- 统一错误处理
- 自动跳转登录

### 认证工具 (utils/auth.js)

**存储的 Key**：
- `Coach-Access-Token`：访问令牌
- `Coach-Refresh-Token`：刷新令牌
- `Coach-Expires-Time`：过期时间
- `Coach-User-Id`：用户 ID

---

## 配置文件

### pages.json

**全局样式**：
- 导航栏背景：`#ffffff`
- 导航栏文字：黑色
- 页面背景：`#f8fbff`

**TabBar 配置**：
- 颜色：`#707070`
- 选中颜色：`#2f6bff`
- 背景：`#ffffff`

### manifest.json

**Android 权限**：
- 相机
- 位置（精确/粗略）
- 网络状态
- 震动
- 存储
- 电话状态

**iOS 权限描述**：
- `NSCameraUsageDescription`：需要访问您的相机进行拍照
- `NSPhotoLibraryUsageDescription`：需要访问您的相册选择图片
- `NSPhotoLibraryAddUsageDescription`：需要保存图片到您的相册
- `NSLocationWhenInUseUsageDescription`：需要获取您的位置信息，为您提供导航服务
- `LSApplicationQueriesSchemes`：iosamap, baidumap（白名单）

**微信小程序**：
- AppID：wx9d61dfa34db27c6d
- 位置权限描述：您的位置信息将用于导航到服务地点
- requiredPrivateInfos：getLocation, chooseLocation

---

## 关键业务流程

### 1. 接单服务流程

```
1. 教练上线（必须获取位置权限）
   ↓
2. 上报位置到服务器
   ↓
3. 开启轮询（每 5 秒查询待接单列表）
   ↓
4. 收到待接单订单（显示倒计时）
   ↓
5. 接单/拒单
   ├─→ 接单：查询订单详情 → 确认出发
   │                  ↓
   │            到达服务地址
   │                  ↓
   │            开始教学（启动计时器）
   │                  ↓
   │            结束教学（停止计时器）
   │                  ↓
   │            订单完成
   │
   └─→ 拒单：填写原因 → 返回轮询
```

### 2. 计时器流程

```
1. 开始教学 → startTimer() → 服务端开始计时
   ↓
2. 每 30 秒轮询 getTimerStatus() 更新已用/剩余时间
   ↓
3. 结束教学 → endTimer() → 获取实际教学时长
   ↓
4. 调用 finishService() 完成订单
```

### 3. 位置权限流程

```
1. 用户点击上线
   ↓
2. 调用 uni.authorize 请求权限
   ↓
3. 成功 → 获取位置 → 上线
   ↓
4. 失败（拒绝）
   ├─→ APP 端 → 调用原生权限请求
   │
   └─→ 小程序/H5 → 提示用户手动开启
```

---

## 开发命令

**开发环境**：
- 使用 HBuilderX 打开项目
- 运行到：浏览器（H5）/ 微信开发者工具 / 真机

**HBuilderX 操作**：
- 运行 → 运行到浏览器 → Chrome
- 运行 → 运行到小程序模拟器 → 微信开发者工具
- 运行 → 运行到手机或模拟器 → 选择设备

---

## 注意事项

### 1. 坐标系统

- **后端**：GCJ02（高德/腾讯）
- **百度地图**：需要 GCJ02 → BD09 转换
- **高德/微信小程序**：直接使用 GCJ02

### 2. Token 管理

- 提前 5 分钟自动刷新 Token
- 刷新期间请求入队等待
- 刷新失败跳转登录页

### 3. 多端条件编译

使用 UniApp 条件编译：
```javascript
// #ifdef APP-PLUS
// APP 端代码
// #endif

// #ifdef MP-WEIXIN
// 微信小程序代码
// #endif

// #ifdef H5
// H5 代码
// #endif
```

### 4. 轮询管理

- 上线后开启轮询
- 收到订单后停止轮询
- 订单完成后重新开启轮询
- 组件卸载时清理所有定时器

---

## 相关文档

- [PLATFORM_GUIDE.md](./PLATFORM_GUIDE.md)：多平台适配指南
- [TEST_CHECKLIST.md](./TEST_CHECKLIST.md)：测试清单
- [coach-auth.md](./coach-auth.md)：认证相关文档
- [coach-api-docs.md](./coach-api-docs.md)：API 文档
