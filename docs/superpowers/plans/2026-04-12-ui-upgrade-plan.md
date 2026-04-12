# UI 升级实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为台球助教端应用进行整体 UI 升级，采用现代商务风格，统一视觉设计，优化交互体验

**Architecture:** 渐进式升级，先搭建设计系统，再逐个页面升级，保持功能不变，仅优化视觉表现

**Tech Stack:** uni-app + Vue 3 + SCSS + uni-ui + ColorUI

---

## 文件结构

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `uni.scss` | 修改 | 更新全局样式变量（颜色、圆角、阴影） |
| `static/scss/global.scss` | 修改 | 添加新的组件样式和动画关键帧 |
| `pages/login/index.vue` | 修改 | 升级登录页 UI |
| `pages/work/index.vue` | 修改 | 升级工作台 UI |
| `pages/order/index.vue` | 修改 | 升级订单列表页 UI |
| `pages/order/detail.vue` | 修改 | 升级订单详情页 UI |
| `pages/mine/index.vue` | 修改 | 升级个人中心页 UI |

---

## 实施任务

### Task 1: 更新全局样式变量 - uni.scss

**Files:**
- Modify: `/Users/mmm/Jt-code/cut-coach/uni.scss`

- [ ] **Step 1: 读取当前 uni.scss 文件**

先读取现有文件内容，了解当前变量定义。

- [ ] **Step 2: 添加设计系统变量**

在文件末尾添加以下变量：

```scss
// ========== UI 升级新增变量 ==========

// 主色调
$primary: #2F6BEE;
$primary-dark: #1E40AF;
$primary-light: #EFF6FF;

// 功能色
$success: #10B981;
$success-light: #ECFDF5;
$warning: #F59E0B;
$warning-light: #FFF7ED;
$danger: #F53F3F;
$danger-light: #FEF2F2;

// 文本色
$text-primary: #1E293B;
$text-secondary: #64748B;
$text-tertiary: #94A3B8;

// 边框与背景
$border-light: #F1F5F9;
$border: #E2E8F0;
$bg-page: #F8FBFF;
$bg-card: #FFFFFF;

// 圆角
$radius-sm: 8rpx;
$radius-base: 12rpx;
$radius-lg: 16rpx;
$radius-xl: 20rpx;

// 阴影
$shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
$shadow-base: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
$shadow-lg: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);

// 动画
$ease-out: cubic-bezier(0.21, 0.64, 0.29, 0.99);
$ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
$duration-fast: 0.2s;
$duration-base: 0.3s;
$duration-slow: 0.5s;
```

---

### Task 2: 更新全局样式 - global.scss

**Files:**
- Modify: `/Users/mmm/Jt-code/cut-coach/static/scss/global.scss`

- [ ] **Step 1: 读取当前 global.scss 文件**

先读取现有文件内容。

- [ ] **Step 2: 添加动画关键帧**

在文件末尾添加：

```scss
// ========== UI 升级新增样式 ==========

// 动画关键帧
@keyframes slideUpFadeIn {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes btnScale {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

// 通用工具类
.animate-slide-up {
  animation: slideUpFadeIn 0.4s cubic-bezier(0.21, 0.64, 0.29, 0.99) both;
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}
```

---

### Task 3: 升级登录页

**Files:**
- Modify: `/Users/mmm/Jt-code/cut-coach/pages/login/index.vue`

- [ ] **Step 1: 更新样式部分**

替换整个 `<style>` 标签内容为：

```scss
<style lang="scss" scoped>
page {
  background: linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%);
}

.normal-login-container {
  min-height: 100vh;
  padding: 0 60rpx;
  box-sizing: border-box;

  .logo-section {
    padding-top: 120rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 80rpx;

    .logo-box {
      width: 140rpx;
      height: 140rpx;
      background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
      border-radius: 36rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 30rpx;
      box-shadow: 0 8rpx 24rpx rgba(47, 107, 238, 0.1);

      .logo-img {
        width: 80rpx;
        height: 80rpx;
      }
    }

    .app-title {
      font-size: 48rpx;
      font-weight: bold;
      color: $text-primary;
    }

    .app-subtitle {
      font-size: 26rpx;
      color: $text-tertiary;
      margin-top: 10rpx;
    }
  }

  .login-tabs {
    display: flex;
    background: #fff;
    border: 1rpx solid $border-light;
    padding: 8rpx;
    border-radius: $radius-xl;
    margin-bottom: 40rpx;
    box-shadow: $shadow-sm;

    .tab-item {
      flex: 1;
      text-align: center;
      height: 80rpx;
      line-height: 80rpx;
      font-size: 28rpx;
      color: $text-secondary;
      border-radius: $radius-lg;
      transition: all $duration-base $ease-out;

      &.active {
        background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
        color: #fff;
        box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.3);
      }
    }
  }

  .input-item {
    background-color: $bg-card;
    height: 100rpx;
    border-radius: $radius-xl;
    margin-bottom: 30rpx;
    padding: 0 30rpx;
    box-shadow: $shadow-sm;
    border: 2rpx solid transparent;
    position: relative;
    transition: border-color $duration-fast, box-shadow $duration-fast;

    &:focus-within {
      border-color: $primary;
      box-shadow: 0 0 0 6rpx $primary-light;
    }

    .icon {
      font-size: 38rpx;
      color: $text-tertiary;
    }

    .input {
      flex: 1;
      padding-left: 20rpx;
      font-size: 28rpx;
      height: 100%;
      line-height: 100rpx;
      color: $text-primary;
    }

    .password-toggle {
      padding: 10rpx;

      .iconfont {
        font-size: 36rpx;
        color: $text-tertiary;
      }
    }

    .login-code-img {
      width: 160rpx;
      height: 60rpx;
      border-radius: $radius-sm;
    }

    .sms-code-btn {
      font-size: 24rpx;
      color: $primary;
      background: $primary-light;
      padding: 12rpx 24rpx;
      border-radius: $radius-base;
      white-space: nowrap;
      flex-shrink: 0;
      transition: all $duration-fast;

      &.disabled {
        color: $text-tertiary;
        background: $border-light;
      }
    }
  }

  .forget-pwd {
    text-align: right;
    color: $primary;
    font-size: 24rpx;
    margin-bottom: 40rpx;
  }

  .login-btn {
    height: 100rpx;
    background: linear-gradient(135deg, $primary 0%, $primary-dark 100%) !important;
    border-radius: $radius-xl;
    font-size: 32rpx;
    color: #fff;
    border: none;
    font-weight: 600;
    box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.3);
    transition: transform $duration-fast, box-shadow $duration-fast, opacity $duration-fast;

    &:active {
      transform: scale(0.97);
      box-shadow: 0 2rpx 6rpx rgba(47, 107, 238, 0.2);
    }

    &:disabled {
      background: #A5C3F0 !important;
      box-shadow: none;
    }
  }

  .xieyi-section {
    margin-top: 40rpx;
    font-size: 24rpx;

    .text-grey-dark {
      color: $text-secondary;
    }
  }

  .bottom-footer {
    position: fixed;
    bottom: 60rpx;
    left: 0;
    width: 100%;
    text-align: center;
    font-size: 26rpx;
    color: $text-tertiary;
  }
}
</style>
```

---

### Task 4: 升级工作台

**Files:**
- Modify: `/Users/mmm/Jt-code/cut-coach/pages/work/index.vue`

- [ ] **Step 1: 更新样式部分**

替换整个 `<style>` 标签内容为：

```scss
<style lang="scss" scoped>
:deep(.uni-button) {
  border: none;
  box-shadow: none;
  outline: none;
}
:deep(.uni-card) {
  margin: 0 !important;
  border-radius: $radius-xl !important;
  box-shadow: $shadow-base;
}
:deep(.uni-card .uni-card__header) {
  padding: 20rpx 24rpx !important;
  border-bottom: 1rpx solid $border-light;
  font-weight: bold;
  color: $text-primary;
}
:deep(.uni-card .uni-card__content) {
  padding: 24rpx !important;
}
:deep(.uni-section .uni-section__header) {
  padding: 0 4rpx 12rpx !important;
}

.workbench-wrapper {
  min-height: 100vh;
  background: $bg-page;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 20rpx 0;
  border-bottom: 1rpx solid $border-light;
  .status-label {
    font-size: 28rpx;
    font-weight: bold;
    color: $text-primary;
  }
}
.status-tag {
  margin-top: 20rpx;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
  .label-off, .label-on {
    font-size: 26rpx;
    color: $text-tertiary;
  }
  .active {
    color: $success;
    font-weight: bold;
  }
}

.custom-switch {
  width: 88rpx;
  height: 48rpx;
  border-radius: 24rpx;
  background: $border;
  position: relative;
  transition: all $duration-base $ease-out;
  flex-shrink: 0;
  cursor: pointer;

  .switch-knob {
    position: absolute;
    top: 4rpx;
    left: 4rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: #fff;
    transition: all $duration-base $ease-out;
    box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.1);
  }

  &.is-checked {
    background: $success;
    .switch-knob {
      left: calc(100% - 44rpx);
    }
  }

  &.is-disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

.empty-order {
  min-height: 320rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .empty-text {
    margin-top: 24rpx;
    font-size: 28rpx;
    color: $text-secondary;
  }
}

.pending-header, .order-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  .location {
    display: flex;
    align-items: center;
    gap: 6rpx;
    .location-text {
      font-size: 26rpx;
      color: $text-primary;
    }
  }
  .countdown {
    display: flex;
    align-items: center;
    gap: 6rpx;
    .time-text {
      font-size: 26rpx;
      color: $warning;
      font-weight: bold;
    }
  }
  .order-title {
    font-size: 30rpx;
    font-weight: bold;
    color: $text-primary;
  }
}

.order-info {
  margin-bottom: 24rpx;
  .order-name {
    font-size: 30rpx;
    font-weight: bold;
    display: block;
    margin-bottom: 8rpx;
    color: $text-primary;
  }
  .order-price {
    font-size: 36rpx;
    color: $primary;
    font-weight: bold;
  }
}

.order-detail-row {
  display: flex;
  padding: 8rpx 0;
  .detail-label {
    font-size: 24rpx;
    color: $text-tertiary;
    width: 160rpx;
    flex-shrink: 0;
  }
  .detail-value {
    font-size: 24rpx;
    color: $text-secondary;
    flex: 1;
  }
}

.btn-group {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
  .btn {
    height: 72rpx;
    line-height: 72rpx;
    font-size: 26rpx;
    border-radius: $radius-base;
    flex: 1;
    font-weight: 600;
    transition: transform $duration-fast;
    &:active {
      transform: scale(0.97);
    }
  }
  .btn-reject {
    background: $danger;
    color: #fff;
  }
  .btn-accept {
    background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
    color: #fff;
  }
  .btn-confirm-depart, .btn-arrive {
    background: $success;
    color: #fff;
  }
}

.status-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 20rpx;
  background: $success-light;
  border-radius: $radius-base;
  margin-top: 24rpx;
  .hint-text {
    font-size: 26rpx;
    color: $success;
  }
}

.nav-row {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
  .nav-btn, .call-btn {
    flex: 1;
    height: 72rpx;
    border-radius: $radius-base;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    font-size: 26rpx;
    padding: 0;
    margin: 0;
    font-weight: 500;
    transition: transform $duration-fast;
    &:active {
      transform: scale(0.97);
    }
  }
  .nav-btn {
    background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
    color: #fff;
  }
  .call-btn {
    background: $success-light;
    color: $success;
  }
}

.accepted-order {
  .order-info-header {
    margin-bottom: 16rpx;
  }
}

.serve-top {
  .left-time {
    font-size: 26rpx;
    color: $primary;
    font-weight: bold;
  }
}
.timer-box {
  text-align: center;
  padding: 32rpx 0;
  background: $bg-page;
  border-radius: $radius-base;
  margin: 24rpx 0;
  .big-time {
    font-size: 64rpx;
    font-weight: bold;
    color: $text-primary;
    display: block;
  }
  .time-desc {
    font-size: 24rpx;
    color: $text-tertiary;
    margin-top: 8rpx;
  }
}
.btn-end {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background: $danger;
  color: #fff;
  border-radius: $radius-base;
  font-size: 28rpx;
  font-weight: 600;
  transition: transform $duration-fast;
  &:active {
    transform: scale(0.97);
  }
}
.detail-box {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 16rpx;
  .shop-img {
    width: 120rpx;
    height: 120rpx;
    border-radius: $radius-base;
  }
  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    .shop-name {
      font-size: 28rpx;
      font-weight: bold;
      color: $text-primary;
    }
    .contact-row {
      display: flex;
      align-items: center;
      gap: 8rpx;
      font-size: 24rpx;
      color: $text-secondary;
      .call-btn {
        background: transparent;
        padding: 0;
        width: 32rpx;
        height: 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        margin: 0;
      }
    }
    .service-name {
      font-size: 26rpx;
      color: $text-secondary;
    }
    .service-price {
      font-size: 28rpx;
      color: $primary;
      font-weight: bold;
    }
    .tip-box {
      display: flex;
      align-items: center;
      gap: 4rpx;
      font-size: 22rpx;
      color: $warning;
      margin-top: 4rpx;
    }
  }
  .nav-btn {
    background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
    color: #fff;
    border-radius: $radius-sm;
    font-size: 24rpx;
    height: 60rpx;
    padding: 0 20rpx;
    line-height: 60rpx;
    margin: 0;
  }
}

.data-grid {
  display: flex;
  gap: 16rpx;
  margin-top: 12rpx;
}
.data-card {
  flex: 1;
  background: $bg-card;
  border-radius: $radius-xl;
  padding: 24rpx 16rpx;
  text-align: center;
  position: relative;
  border: 1rpx solid $border-light;
  transition: transform $duration-base $ease-out, box-shadow $duration-base $ease-out;

  &:active {
    transform: translateY(-4rpx);
    box-shadow: $shadow-lg;
  }

  .data-icon {
    width: 48rpx;
    height: 48rpx;
    border-radius: $radius-base;
    margin: 0 auto 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .data-value {
    font-size: 28rpx;
    font-weight: bold;
    display: block;
    margin-bottom: 8rpx;
    color: $text-primary;
  }
  .data-label {
    font-size: 24rpx;
    color: $text-tertiary;
  }
  .real-tag {
    transform: scale(0.75);
    position: absolute;
    top: 8rpx;
    right: 8rpx;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid $border-light;
}
.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: $text-primary;
}

.view-all-text {
  font-size: 26rpx;
  color: $primary;
  padding: 8rpx 0;
  &:active {
    opacity: 0.7;
  }
}

.history-tabs {
  margin: 20rpx 0;
}
.history-order-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.history-order-item {
  padding: 20rpx;
  background: $bg-page;
  border-radius: $radius-base;
  .order-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8rpx;
    .order-title {
      font-size: 28rpx;
      font-weight: 500;
      color: $text-primary;
    }
    .order-price {
      font-size: 28rpx;
      color: $primary;
      font-weight: bold;
    }
  }
  .order-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .order-time {
      font-size: 24rpx;
      color: $text-tertiary;
    }
  }
}
</style>
```

---

### Task 5: 升级订单列表页

**Files:**
- Modify: `/Users/mmm/Jt-code/cut-coach/pages/order/index.vue`

- [ ] **Step 1: 读取订单列表页文件**

- [ ] **Step 2: 应用统一的样式规范**

参考工作台的样式更新方式，应用相同的颜色、圆角、阴影变量。重点更新：
- 卡片圆角改为 `$radius-xl`
- 使用 `$shadow-base` 阴影
- 文本颜色使用 `$text-primary`、`$text-secondary`、`$text-tertiary`
- 按钮添加渐变和点击缩放效果

---

### Task 6: 升级订单详情页

**Files:**
- Modify: `/Users/mmm/Jt-code/cut-coach/pages/order/detail.vue`

- [ ] **Step 1: 读取订单详情页文件**

- [ ] **Step 2: 应用统一的样式规范**

参考登录页和工作台的样式更新方式。

---

### Task 7: 升级个人中心页

**Files:**
- Modify: `/Users/mmm/Jt-code/cut-coach/pages/mine/index.vue`

- [ ] **Step 1: 读取个人中心页文件**

- [ ] **Step 2: 应用统一的样式规范**

参考其他页面的样式更新方式。

---

### Task 8: 整体视觉检查

**Files:**
- 所有修改过的页面

- [ ] **Step 1: 启动开发服务器**

运行项目，检查各页面显示效果。

- [ ] **Step 2: 检查一致性**

验证以下内容在所有页面一致：
- 颜色使用正确
- 圆角大小统一
- 阴影效果适度
- 文字层级清晰
- 按钮交互反馈正常

- [ ] **Step 3: 多端验证**

检查 H5、小程序（如有条件）显示效果一致。

---

## 验收标准检查

- [ ] 所有页面使用统一的颜色系统
- [ ] 所有圆角、阴影符合规范
- [ ] 按钮有点击反馈动画
- [ ] 文字层级清晰，重要信息突出
- [ ] 整体视觉风格统一专业
- [ ] 功能未受影响，正常使用

---

**计划结束**