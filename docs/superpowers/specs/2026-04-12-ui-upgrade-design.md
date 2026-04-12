---
name: UI升级设计文档
description: 台球助教端应用UI整体升级统一设计方案 - 现代商务风
type: project
---

# 台球助教端 UI 升级设计文档

**日期：** 2026-04-12  
**设计风格：** 现代商务风  
**版本：** v1.0

---

## 一、设计概述

### 1.1 设计目标
- 统一整体视觉风格，提升专业感和可信赖度
- 优化交互体验，增加流畅的动画过渡
- 强化信息层级，让重要内容更突出
- 保持现有功能不变，仅优化视觉表现

### 1.2 设计原则
- **专业性：** 服务类应用需要建立用户信任感
- **一致性：** 组件样式、交互模式统一
- **渐进式：** 在现有基础上优化，不做颠覆性改变
- **性能优先：** 动画效果适度，不影响性能

---

## 二、设计系统

### 2.1 颜色系统

```scss
// ========== 主色调 ==========
// 保持现有品牌色，增加深浅变体
$primary: #2F6BEE;           // 主色 - 按钮、链接、重要状态
$primary-dark: #1E40AF;      // 主色深 - 按下状态
$primary-light: #EFF6FF;      // 主色浅 - 背景、选中状态

// ========== 功能色 ==========
$success: #10B981;            // 成功 - 在线状态、完成
$success-light: #ECFDF5;      // 成功背景
$warning: #F59E0B;            // 警告 - 倒计时、待处理
$warning-light: #FFF7ED;      // 警告背景
$danger: #F53F3F;             // 危险 - 拒绝、结束服务
$danger-light: #FEF2F2;       // 危险背景

// ========== 中性色 ==========
$text-primary: #1E293B;       // 主文本 - 标题、重要内容
$text-secondary: #64748B;     // 次文本 - 描述、辅助信息
$text-tertiary: #94A3B8;      // 辅助文本 - 时间、次要说明
$border-light: #F1F5F9;       // 浅边框 - 分割线
$border: #E2E8F0;              // 边框 - 卡片边框
$bg-page: #F8FBFF;            // 页面背景
$bg-card: #FFFFFF;             // 卡片背景
```

### 2.2 字体层级

```scss
$font-size-xs: 22rpx;  // 极小 - 标签、角标
$font-size-sm: 24rpx;  // 小 - 辅助信息、时间
$font-size-base: 28rpx; // 常规 - 正文
$font-size-lg: 30rpx;  // 大 - 卡片标题
$font-size-xl: 36rpx;  // 特大 - 页面标题
$font-size-2xl: 48rpx; // 超大 - 数据展示
```

### 2.3 圆角与阴影

```scss
// ========== 圆角 ==========
$radius-sm: 8rpx;      // 小 - 标签、角标
$radius-base: 12rpx;   // 常规 - 按钮、输入框
$radius-lg: 16rpx;     // 大 - 小组件
$radius-xl: 20rpx;     // 特大 - 卡片

// ========== 阴影 ==========
$shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
$shadow-base: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
$shadow-lg: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
```

### 2.4 动画规范

```scss
// ========== 动画曲线 ==========
$ease-out: cubic-bezier(0.21, 0.64, 0.29, 0.99);      // 退场动画
$ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);          // 缓进缓出

// ========== 动画时长 ==========
$duration-fast: 0.2s;
$duration-base: 0.3s;
$duration-slow: 0.5s;

// ========== 关键帧动画 ==========

// 卡片入场：从下往上滑入 + 淡入
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

// 按钮点击缩放
@keyframes btnScale {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

// 脉冲动画（用于倒计时）
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

---

## 三、组件设计

### 3.1 按钮组件

**样式规范：**
```scss
.btn-primary {
  height: 100rpx;
  background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
  color: #fff;
  border-radius: $radius-xl;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  transition: transform $duration-fast $ease-out, 
              box-shadow $duration-fast $ease-out,
              opacity $duration-fast;
  box-shadow: 0 4rpx 12rpx rgba($primary, 0.3);
  
  &:active {
    transform: scale(0.97);
    box-shadow: 0 2rpx 6rpx rgba($primary, 0.2);
  }
  
  &:disabled {
    background: #A5C3F0;
    box-shadow: none;
  }
}

.btn-secondary {
  height: 72rpx;
  background: $primary-light;
  color: $primary;
  border-radius: $radius-base;
  font-size: 26rpx;
  border: none;
  transition: background $duration-fast;
  
  &:active {
    background: $primary;
    color: #fff;
  }
}
```

### 3.2 卡片组件

**样式规范：**
```scss
.card {
  background: $bg-card;
  border-radius: $radius-xl;
  box-shadow: $shadow-base;
  padding: 24rpx;
  transition: transform $duration-base $ease-out,
              box-shadow $duration-base $ease-out;
  
  &:hover {
    transform: translateY(-2rpx);
    box-shadow: $shadow-lg;
  }
}
```

### 3.3 输入框组件

**样式规范：**
```scss
.input-item {
  background: $bg-card;
  height: 100rpx;
  border-radius: $radius-xl;
  border: 2rpx solid transparent;
  padding: 0 30rpx;
  box-shadow: $shadow-sm;
  transition: border-color $duration-fast,
              box-shadow $duration-fast;
  
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
    color: $text-primary;
  }
}
```

### 3.4 数据卡片组件

**样式规范：**
```scss
.data-card {
  flex: 1;
  background: $bg-card;
  border-radius: $radius-xl;
  padding: 24rpx 16rpx;
  text-align: center;
  position: relative;
  border: 1rpx solid $border-light;
  transition: transform $duration-base $ease-out,
              box-shadow $duration-base $ease-out;
  
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
    color: $text-primary;
    display: block;
    margin-bottom: 8rpx;
  }
  
  .data-label {
    font-size: 24rpx;
    color: $text-tertiary;
  }
}
```

---

## 四、页面升级清单

### 4.1 页面列表

| 页面路径 | 页面名称 | 优先级 |
|---------|---------|--------|
| `pages/login/index.vue` | 登录页 | P0 |
| `pages/work/index.vue` | 工作台 | P0 |
| `pages/order/index.vue` | 订单列表 | P1 |
| `pages/order/detail.vue` | 订单详情 | P1 |
| `pages/mine/index.vue` | 个人中心 | P1 |
| `pages/mine/info/index.vue` | 个人信息 | P2 |
| `pages/mine/info/edit.vue` | 编辑资料 | P2 |

### 4.2 全局文件

| 文件路径 | 说明 |
|---------|------|
| `static/scss/index.scss` | 样式入口 - 添加新变量 |
| `static/scss/global.scss` | 全局样式 - 新增组件样式 |
| `uni.scss` | uni-app 变量 - 更新颜色值 |

---

## 五、实施步骤

### 阶段一：设计系统搭建
1. 更新 `uni.scss` - 定义新的颜色、圆角、阴影变量
2. 更新 `static/scss/global.scss` - 添加基础组件样式和动画

### 阶段二：核心页面升级
3. 升级登录页 - 优化输入框、按钮、Logo区域
4. 升级工作台 - 优化卡片、开关、数据展示、动画

### 阶段三：其他页面升级
5. 升级订单列表页
6. 升级订单详情页
7. 升级个人中心页

### 阶段四：回归测试
8. 整体视觉检查
9. 交互体验测试

---

## 六、注意事项

### 6.1 保持兼容
- 不改变现有组件结构，仅修改样式
- 不改变数据逻辑，保持功能不变
- 支持多端（H5、小程序、App）显示一致

### 6.2 性能考虑
- 动画使用 CSS transform 和 opacity，保证硬件加速
- 避免过度动画，仅在关键交互处使用
- 图片资源按需加载

### 6.3 渐进式升级
- 优先升级核心页面（登录、工作台）
- 次要页面后续跟进
- 每个页面完成后可单独验证

---

## 七、验收标准

- [ ] 所有页面使用统一的颜色系统
- [ ] 所有圆角、阴影符合规范
- [ ] 按钮有点击反馈动画
- [ ] 卡片有入场动画
- [ ] 输入框有 focus 状态高亮
- [ ] 文字层级清晰，重要信息突出
- [ ] 整体视觉风格统一专业
- [ ] 多端显示效果一致

---

**文档结束**
