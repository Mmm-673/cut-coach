# 球了么裁教端 - 13项问题修复设计文档

## 概述

本次修复涉及 13 个问题，分为严重、中等、轻微三个等级，目标是修复所有功能缺陷并移除若依框架残留内容。

---

## 问题清单与修复方案

### 🔴 严重问题

#### 1. 个人信息页 - 调错接口
**问题**：使用 `/system/user/profile`（若依接口），应使用教练专属接口
**修复方案**：
- 替换为 `getCoachProfile()` API
- 更新数据绑定字段以匹配教练数据结构
- 位置：`pages/mine/info/index.vue`

#### 2. 客服中心 - 显示若依占位内容
**问题**：显示若依框架默认内容
**修复方案**：
- 完全重写为静态页面
- 显示企业微信二维码
- 位置：`pages/mine/service/index.vue`（新建）

#### 3. 关于我们 - 应用名"若依移动端"
**问题**：显示若依模板数据
**修复方案**：
- 完全重写，移除所有若依引用
- 显示正确应用信息："初球裁教版"
- 位置：`pages/mine/about/index.vue`

#### 4. 我的页面 - 所有菜单项点击无响应
**问题**：导航路径错误
**修复方案**：
- 修复所有导航路径
- 验证页面跳转正常
- 位置：`pages/mine/index.vue`

#### 5. 忘记密码 - 功能缺失
**问题**：点击无响应
**修复方案**：
- 新建忘记密码页面
- 支持手机号+验证码重置密码
- 位置：`pages/forgot-password/index.vue`（新建）

#### 6. 待评价订单详情 - 无"去评价"按钮
**问题**：用户无法完成评价操作
**修复方案**：
- 添加"去评价"按钮
- 根据订单状态条件显示
- 位置：`pages/order/detail.vue`

---

### 🟠 中等问题

#### 7. 全局 - 接口错误无统一 toast 提示
**问题**：API 错误无用户友好提示
**修复方案**：
- 检查 `utils/request.js` 错误拦截器
- 确保所有错误显示 toast
- 位置：`utils/request.js`

#### 8. 订单列表 - 多条订单"预约时间"字段为空
**问题**：仅显示标签无值
**修复方案**：
- 增强时间格式化函数空值处理
- 显示友好占位文本
- 位置：`pages/order/index.vue`

#### 9. 订单详情 - 教学地点显示 Mock 测试数据
**问题**：显示 "Mock球厅-10"
**修复方案**：
- 绑定真实 API 字段
- 验证数据来源
- 位置：`pages/order/detail.vue`

#### 10. 我的页面 - 头像圆圈为空
**问题**：无默认占位图
**修复方案**：
- 使用 `uni-icons` 的 person 图标作为默认头像
- 位置：`pages/mine/index.vue`

#### 11. 提现页 - 余额为 0 时确认按钮置灰但无说明文字
**问题**：用户不知道为什么按钮不可用
**修复方案**：
- 添加黄色提示框说明余额不足
- 位置：`pages/mine/wallet/withdraw/index.vue`

---

### 🟡 轻微问题

#### 12. 登录页 - 两个 tab 共用同一个输入框
**问题**：切换时输入值互相污染
**修复方案**：
- 分离为 `pwdForm` 和 `smsForm` 两个独立对象
- 位置：`pages/login/index.vue`

#### 13. 登录页 - 空表单提交无提示
**问题**：未勾选协议也无拦截
**修复方案**：
- 添加完整表单验证
- 验证必填字段和协议勾选
- 位置：`pages/login/index.vue`

---

## 新增页面设计

### 客服中心页面 (`pages/mine/service/index.vue`)

**功能描述**：静态页面展示企业微信二维码

**布局**：
```
┌─────────────────────┐
│   客服中心           │
├─────────────────────┤
│                     │
│   [二维码图片]       │
│                     │
│   扫码添加企业微信   │
│   客服在线时间：     │
│   09:00 - 21:00     │
│                     │
└─────────────────────┘
```

**样式**：
- 使用现有设计规范（$primary、$radius-xl 等）
- 卡片式布局

---

### 忘记密码页面 (`pages/forgot-password/index.vue`)

**功能描述**：通过手机验证码重置密码

**流程**：
1. 输入手机号
2. 获取验证码（倒计时 60s）
3. 输入新密码
4. 确认新密码
5. 提交重置

**表单字段**：
- `mobile` - 手机号（必填）
- `code` - 验证码（必填）
- `newPassword` - 新密码（必填，6-20位）
- `confirmPassword` - 确认密码（必填，与新密码一致）

---

## 路由配置更新

**pages.json 新增路由**：
```json
{
  "path": "pages/forgot-password/index",
  "style": {
    "navigationBarTitleText": "忘记密码"
  }
}
```

---

## 全局配置更新

**config.js 更新**：
```javascript
appInfo: {
  name: '初球裁教版',  // 从 'ruoyi-app' 修改
  version: '1.2.0'
}
```

---

## 数据结构

### 评价列表 API 响应

```typescript
interface ReviewItem {
  reviewId: string
  userNickname: string
  userAvatar: string
  star: number  // 1-5
  content: string
  images: string[]
  tags: string[]
  createTime: string
}

interface ReviewPageResponse {
  code: number
  data: {
    list: ReviewItem[]
    total: number
    pageNo: number
    pageSize: number
  }
  msg: string
}
```

---

## 验收标准

1. **所有严重问题修复**：个人信息、客服、关于我们、导航、忘记密码、评价按钮
2. **所有若依引用移除**：应用名称、占位内容、API 调用
3. **新页面可用**：客服中心、忘记密码
4. **表单验证完整**：登录页、忘记密码页
5. **用户体验优化**：占位头像、提示文本、错误提示

---

## 修改文件清单

| 文件 | 操作 |
|------|------|
| `pages/mine/info/index.vue` | 修改 API 调用 |
| `pages/mine/service/index.vue` | 新建 |
| `pages/mine/about/index.vue` | 重写 |
| `pages/mine/index.vue` | 修复导航、添加默认头像 |
| `pages/forgot-password/index.vue` | 新建 |
| `pages/login/index.vue` | 分离表单、添加验证 |
| `pages/order/detail.vue` | 添加评价按钮、修复 Mock 数据 |
| `pages/order/index.vue` | 修复时间格式化 |
| `pages/mine/wallet/withdraw/index.vue` | 添加提示文本 |
| `pages.json` | 添加新路由 |
| `config.js` | 更新应用名称 |