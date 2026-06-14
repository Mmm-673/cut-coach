# 初球裁教版 Bug修复设计文档

**日期**: 2026-05-18
**版本**: v1.0

---

## 1. 概述

本次修复共包含12个bug，按优先级分为三批进行修复。

---

## 2. Bug列表

### 第一批（高优先级）

#### BUG-001: 移除登录页硬编码测试账号
**问题**: 登录页硬编码了测试账号 `coachA001` / `123456`
**修复方案**:
- 清空 `pwdForm` 的初始值
- 移除验证码相关逻辑
- 简化登录页面代码

**文件**: `pages/login/index.vue`

#### BUG-002: 移除前端手续费计算逻辑
**问题**: 前端在计算提现手续费，但应该由后端计算
**修复方案**:
- 移除 `calculateFee` 函数
- 移除手续费显示
- 实际到账金额 = 提现金额

**文件**: `subpkg/mine/wallet/withdraw/index.vue`

#### BUG-003: 新增用户协议和隐私政策页面
**问题**: 缺少用户协议和隐私政策的本地页面
**修复方案**:
- 新建 `subpkg/common/agreement/index.vue` - 用户协议页面
- 新建 `subpkg/common/privacy/index.vue` - 隐私政策页面
- 使用 `textview` 方式展示静态内容
- 在 `pages.json` 中注册这两个页面

**新增文件**:
- `subpkg/common/agreement/index.vue`
- `subpkg/common/privacy/index.vue`

**修改文件**:
- `pages.json`

#### BUG-004: 修复登录页协议链接
**问题**: 登录页的协议链接跳转到外部 example.com
**修复方案**:
- 修改 `handleUserAgreement` 跳转到 `/subpkg/common/agreement/index`
- 修改 `handlePrivacy` 跳转到 `/subpkg/common/privacy/index`

**文件**: `pages/login/index.vue`

#### BUG-005: 全部分包跳转路径检查与更新
**问题**: 需要检查所有分包跳转路径是否正确
**修复方案**:
- 全局搜索所有 `uni.navigateTo`、`uni.redirectTo`、`uni.reLaunch`、`uni.switchTab`
- 验证所有跳转路径是否在 `pages.json` 中已注册
- 修正任何错误的路径

**检查范围**:
- `pages/` 目录
- `subpkg/` 目录

#### BUG-012: 更新权限白名单路径
**问题**: 新增的协议页面需要添加到权限白名单
**修复方案**:
- 在 `permission.js` 的 `whiteList` 中添加新页面路径

**文件**: `permission.js`

---

### 第二批（中优先级）

#### BUG-006: 改进报告异常交互逻辑
**问题**: 当前报告异常的交互不够友好
**修复方案**:
- 验证用户输入不能为空
- 验证输入长度不超过500字
- 提供更友好的提示

**文件**: `subpkg/order/detail.vue`、`pages/work/index.vue`

#### BUG-007: 订单列表改为服务端过滤
**问题**: 订单列表当前是前端过滤，需要改为服务端过滤
**修复方案**:
- 修改 `getOrderPage` API调用，传递状态参数
- 移除前端过滤逻辑

**文件**: 需要查看订单列表页

#### BUG-008: 补充个人中心完整菜单
**问题**: 个人中心缺少部分菜单项
**修复方案**:
- 添加"个人信息"菜单项（包含查看信息、修改头像、修改密码）
- 添加"常见问题"菜单项
- 添加"关于我们"菜单项

**文件**: `pages/mine/index.vue`

#### BUG-009: 全部提现优化
**问题**: 全部提现不应该扣除手续费
**修复方案**:
- 确认全部提现逻辑已正确（根据BUG-002的修复，手续费已经移除）

**文件**: `subpkg/mine/wallet/withdraw/index.vue`

---

### 第三批（低优先级）

#### BUG-010: 优化硬编码联系电话
**问题**: 联系电话是硬编码的
**修复方案**:
- 从后端接口获取联系电话
- 或者配置到全局配置文件

**文件**: 需要搜索联系电话的位置

#### BUG-011: 改进错误提示文案
**问题**: 部分错误提示文案不够友好
**修复方案**:
- 检查所有错误提示
- 优化文案使其更友好、更易理解

---

## 3. 技术方案

### 3.1 新增协议页面结构
```vue
<template>
  <view class="agreement-wrapper">
    <view class="content">
      <text class="title">用户协议</text>
      <view class="text-content">
        <!-- 静态协议内容 -->
      </view>
    </view>
  </view>
</template>
```

### 3.2 权限白名单更新
```javascript
const whiteList = [
  '/pages/login/index', 
  '/pages/register', 
  '/subpkg/common/webview/index',
  '/subpkg/common/agreement/index',  // 新增
  '/subpkg/common/privacy/index',     // 新增
]
```

---

## 4. 测试计划

### 第一批测试
1. 登录页面测试 - 确认没有硬编码账号，验证码逻辑已移除
2. 提现页面测试 - 确认没有手续费计算
3. 协议页面测试 - 确认可以正常打开和浏览
4. 权限测试 - 确认未登录状态可以访问协议页面

### 第二批测试
1. 报告异常测试 - 验证表单验证逻辑
2. 订单列表测试 - 验证服务端过滤
3. 个人中心测试 - 验证所有菜单可用

### 第三批测试
1. 联系电话测试
2. 错误提示测试

---

## 5. 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|-----|------|------|---------|
| 路径修改导致跳转失败 | 高 | 中 | 充分测试所有跳转路径 |
| 移除验证码可能影响安全性 | 中 | 低 | 确认后端已经不需要验证码 |

---

## 6. 回滚方案

如果出现问题，可以通过 git reset 回滚到修复前的版本。

