# 初球裁教版 Bug修复执行计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 分三批修复12个bug，从高优先级开始逐步完善应用

**Architecture:** 按优先级分批次修复，每批修复后验证，确保代码质量和稳定性

**Tech Stack:** UniApp + Vue 3 + Pinia

---

## 文件结构映射

| 文件 | 操作 | 说明 |
|-----|------|------|
| `pages/login/index.vue` | 修改 | BUG-001, BUG-004 |
| `subpkg/mine/wallet/withdraw/index.vue` | 修改 | BUG-002, BUG-009 |
| `subpkg/common/agreement/index.vue` | 新建 | BUG-003 |
| `subpkg/common/privacy/index.vue` | 新建 | BUG-003 |
| `pages.json` | 修改 | BUG-003 |
| `permission.js` | 修改 | BUG-012 |
| `subpkg/order/detail.vue` | 修改 | BUG-006 |
| `pages/work/index.vue` | 修改 | BUG-006 |
| `pages/order/index.vue` | 修改 | BUG-007 |
| `pages/mine/index.vue` | 修改 | BUG-008 |

---

## 第一批：高优先级修复

### Task 1: 移除登录页硬编码测试账号

**Files:**
- Modify: `pages/login/index.vue`

- [ ] **Step 1: 清空表单初始值**

修改 `pwdForm` 初始值：
```javascript
const pwdForm = ref({
  username: '',  // 原来是 'coachA001'
  password: '',  // 原来是 '123456'
  code: '',
  uuid: ''
})
```

- [ ] **Step 2: 移除图形验证码相关逻辑（保留短信验证码）**

删除或注释掉：
1. `captchaEnabled` ref
2. `codeUrl` ref
3. `getCode()` 函数
4. 模板中的图形验证码输入区域

简化后保留：
```javascript
const activeTab = ref('pwd')
const pwdForm = ref({
  username: '',
  password: ''
})
const smsForm = ref({
  mobile: '',
  smsCode: ''
})
```

删除模板中的图形验证码部分：
```vue
<!-- 删除这部分 -->
<view class="input-item flex align-center" v-if="captchaEnabled">
  <view class="iconfont icon-code icon"></view>
  <input v-model="pwdForm.code" type="number" class="input" placeholder="验证码" 
    :focus="focusIndex === 2" @focus="onInputFocus(2)" @blur="onInputBlur"
    confirm-type="done" @confirm="handlePwdLogin" />
  <view class="login-code-wrapper">
    <image :src="codeUrl" @click="getCode" class="login-code-img" mode="aspectFill"></image>
  </view>
</view>
```

- [ ] **Step 3: 简化登录逻辑**

修改 `handlePwdLogin`，移除验证码相关：
```javascript
async function handlePwdLogin() {
  if (!isAgreed.value) {
    return proxy.$modal.msgError("请先同意用户协议")
  }

  const { username, password } = pwdForm.value

  if (!username) {
    return proxy.$modal.msgError("请输入账号")
  }
  if (!password) {
    return proxy.$modal.msgError("请输入密码")
  }

  isLoggingIn.value = true
  proxy.$modal.loading("登录中...")

  try {
    await userStore.login({
      loginType: 'pwd',
      username,
      password
    })

    proxy.$modal.closeLoading()
    loginSuccess()
  } catch (err) {
    proxy.$modal.closeLoading()
    proxy.$modal.msgError(err?.msg || err || '登录失败，请重试')
  } finally {
    isLoggingIn.value = false
  }
}
```

- [ ] **Step 4: 移除 onMounted 中的 getCode 调用**
```javascript
onMounted(() => {
  // 删除 getCode()
  keyboardHeightListener = uni.onKeyboardHeightChange(onKeyboardHeightChange)
})
```

- [ ] **Step 5: 验证修改并提交**
```bash
git add pages/login/index.vue
git commit -m "fix: 移除登录页硬编码测试账号和验证码逻辑"
```

---

### Task 2: 移除前端手续费计算逻辑

**Files:**
- Modify: `subpkg/mine/wallet/withdraw/index.vue`

- [ ] **Step 1: 修改 calculateFee 函数**
```javascript
const calculateFee = () => {
  const amount = parseFloat(withdrawAmount.value || 0)
  if (amount < 100) {
    serviceFee.value = '0.00'
    actualAmount.value = '0.00'
    return
  }
  // 直接等于提现金额，不扣除手续费
  serviceFee.value = '0.00'
  actualAmount.value = amount.toFixed(2)
}
```

- [ ] **Step 2: 修改 handleAllWithdraw 函数**
```javascript
const handleAllWithdraw = () => {
  withdrawAmount.value = usableBalance.value
  calculateFee()
}
```

- [ ] **Step 3: 验证修改，确保显示正确**
- [ ] **Step 4: 提交更改**
```bash
git add subpkg/mine/wallet/withdraw/index.vue
git commit -m "fix: 移除前端手续费计算逻辑"
```

---

### Task 3: 新增用户协议页面

**Files:**
- Create: `subpkg/common/agreement/index.vue`

- [ ] **Step 1: 创建用户协议页面**
```vue
<template>
  <view class="agreement-wrapper">
    <view class="header">
      <uni-icons type="back" size="20" @click="goBack"></uni-icons>
      <text class="header-title">用户协议</text>
      <view class="placeholder"></view>
    </view>
    <scroll-view class="content" scroll-y>
      <view class="text-content">
        <text class="section-title">一、服务条款</text>
        <text class="paragraph">欢迎使用初球裁教版服务。在使用本服务前，请您仔细阅读以下条款。</text>
        
        <text class="section-title">二、用户资格</text>
        <text class="paragraph">您需要具备完全民事行为能力才能使用本服务。</text>
        
        <text class="section-title">三、服务内容</text>
        <text class="paragraph">本平台提供台球教练预约、教学管理、收益结算等服务。</text>
        
        <text class="section-title">四、用户行为规范</text>
        <text class="paragraph">您在使用本服务时，应遵守相关法律法规，不得从事违法活动。</text>
        
        <text class="section-title">五、隐私保护</text>
        <text class="paragraph">我们重视您的隐私保护，具体请参考隐私政策。</text>
        
        <text class="section-title">六、免责声明</text>
        <text class="paragraph">在法律允许的范围内，我们对服务不作任何明示或暗示的保证。</text>
        
        <text class="section-title">七、协议修改</text>
        <text class="paragraph">我们有权根据需要修改本协议，修改后的协议一经公布即生效。</text>
        
        <text class="section-title">八、争议解决</text>
        <text class="paragraph">如发生争议，双方应友好协商解决；协商不成的，可向平台所在地法院提起诉讼。</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.agreement-wrapper {
  min-height: 100vh;
  background: #f8fbff;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  padding-top: calc(30rpx + var(--status-bar-height));
  background: #fff;
  border-bottom: 1rpx solid #f3f4f6;
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
}

.placeholder {
  width: 40rpx;
}

.content {
  padding: 30rpx;
  height: calc(100vh - 100rpx);
}

.text-content {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 10rpx;
}

.paragraph {
  font-size: 28rpx;
  color: #6b7280;
  line-height: 1.8;
}
</style>
```

- [ ] **Step 2: 提交用户协议页面**
```bash
git add subpkg/common/agreement/index.vue
git commit -m "feat: 新增用户协议页面"
```

---

### Task 4: 新增隐私政策页面

**Files:**
- Create: `subpkg/common/privacy/index.vue`

- [ ] **Step 1: 创建隐私政策页面**
```vue
<template>
  <view class="privacy-wrapper">
    <view class="header">
      <uni-icons type="back" size="20" @click="goBack"></uni-icons>
      <text class="header-title">隐私政策</text>
      <view class="placeholder"></view>
    </view>
    <scroll-view class="content" scroll-y>
      <view class="text-content">
        <text class="section-title">一、隐私保护原则</text>
        <text class="paragraph">我们重视您的隐私保护，遵循合法、正当、必要的原则处理您的个人信息。</text>
        
        <text class="section-title">二、信息收集</text>
        <text class="paragraph">我们会收集您提供的注册信息、位置信息、订单信息等，以便为您提供服务。</text>
        
        <text class="section-title">三、信息使用</text>
        <text class="paragraph">我们会将收集的信息用于提供服务、安全保障、客户支持等用途。</text>
        
        <text class="section-title">四、信息保护</text>
        <text class="paragraph">我们会采取相应的安全措施保护您的个人信息安全。</text>
        
        <text class="section-title">五、信息共享</text>
        <text class="paragraph">未经您同意，我们不会向第三方共享您的个人信息，法律法规要求的情况除外。</text>
        
        <text class="section-title">六、您的权利</text>
        <text class="paragraph">您有权访问、更正、删除您的个人信息，以及撤回同意。</text>
        
        <text class="section-title">七、政策更新</text>
        <text class="paragraph">我们会适时更新本政策，更新后的政策一经公布即生效。</text>
        
        <text class="section-title">八、联系我们</text>
        <text class="paragraph">如有任何问题，请通过客服联系我们。</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.privacy-wrapper {
  min-height: 100vh;
  background: #f8fbff;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  padding-top: calc(30rpx + var(--status-bar-height));
  background: #fff;
  border-bottom: 1rpx solid #f3f4f6;
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
}

.placeholder {
  width: 40rpx;
}

.content {
  padding: 30rpx;
  height: calc(100vh - 100rpx);
}

.text-content {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 10rpx;
}

.paragraph {
  font-size: 28rpx;
  color: #6b7280;
  line-height: 1.8;
}
</style>
```

- [ ] **Step 2: 提交隐私政策页面**
```bash
git add subpkg/common/privacy/index.vue
git commit -m "feat: 新增隐私政策页面"
```

---

### Task 5: 更新 pages.json 注册新页面

**Files:**
- Modify: `pages.json`

- [ ] **Step 1: 在 subPackages 的 common 分包中添加新页面**
```json
{
  "root": "subpkg/common",
  "pages": [
    {
      "path": "webview/index",
      "style": {
        "navigationBarTitleText": "浏览网页"
      }
    },
    {
      "path": "textview/index",
      "style": {
        "navigationBarTitleText": "浏览文本"
      }
    },
    {
      "path": "agreement/index",
      "style": {
        "navigationBarTitleText": "用户协议",
        "navigationBarBackgroundColor": "#ffffff",
        "navigationBarTextStyle": "black"
      }
    },
    {
      "path": "privacy/index",
      "style": {
        "navigationBarTitleText": "隐私政策",
        "navigationBarBackgroundColor": "#ffffff",
        "navigationBarTextStyle": "black"
      }
    }
  ]
}
```

- [ ] **Step 2: 提交更改**
```bash
git add pages.json
git commit -m "feat: 注册用户协议和隐私政策页面"
```

---

### Task 6: 修复登录页协议链接

**Files:**
- Modify: `pages/login/index.vue`

- [ ] **Step 1: 修改 handleUserAgreement 和 handlePrivacy 函数**
```javascript
const handleUserAgreement = () => {
  uni.navigateTo({ url: '/subpkg/common/agreement/index' })
}

const handlePrivacy = () => {
  uni.navigateTo({ url: '/subpkg/common/privacy/index' })
}
```

- [ ] **Step 2: 提交更改**
```bash
git add pages/login/index.vue
git commit -m "fix: 修复登录页协议链接"
```

---

### Task 7: 更新权限白名单

**Files:**
- Modify: `permission.js`

- [ ] **Step 1: 更新 whiteList 数组（移除注册页面）**
```javascript
const whiteList = [
  '/pages/login/index', 
  '/subpkg/common/webview/index',
  '/subpkg/common/agreement/index',
  '/subpkg/common/privacy/index',
]
```

- [ ] **Step 2: 提交更改**
```bash
git add permission.js
git commit -m "fix: 更新权限白名单，添加协议页面"
```

---

### Task 8: 检查全部分包跳转路径

**Files:**
- Search: All `.vue` files

- [ ] **Step 1: 搜索所有跳转代码**
```bash
# 搜索导航相关代码
grep -r "navigateTo\|redirectTo\|reLaunch\|switchTab" --include="*.vue" .
```

- [ ] **Step 2: 检查每个跳转路径是否在 pages.json 中注册**
- [ ] **Step 3: 修正任何错误的路径**
- [ ] **Step 4: 提交修复（如有）**
```bash
git add <fixed-files>
git commit -m "fix: 修正分包跳转路径"
```

---

## 第二批：中优先级修复

### Task 9: 改进报告异常交互逻辑

**Files:**
- Modify: `subpkg/order/detail.vue`
- Modify: `pages/work/index.vue`

- [ ] **Step 1: 修改 detail.vue 中的 showReportException 函数**
```javascript
const showReportException = () => {
  const exceptionTypes = [
    { label: '联系不到客户', value: 1 },
    { label: '客户违规', value: 2 },
    { label: '其他', value: 3 }
  ]
  uni.showActionSheet({
    itemList: exceptionTypes.map(t => t.label),
    success: async (res) => {
      const type = exceptionTypes[res.tapIndex].value
      uni.showModal({
        title: '异常说明',
        editable: true,
        placeholderText: '请输入异常描述（500字以内）',
        success: async (modalRes) => {
          if (modalRes.confirm) {
            const content = modalRes.content?.trim()
            if (!content) {
              return uni.showToast({ title: '请输入异常描述', icon: 'none' })
            }
            if (content.length > 500) {
              return uni.showToast({ title: '描述不能超过500字', icon: 'none' })
            }
            try {
              await reportExceptionApi({
                orderId: orderId.value,
                exceptionType: type,
                reason: content
              })
              uni.showToast({ title: '已提交异常', icon: 'success' })
            } catch (err) {
              uni.showToast({ title: err?.msg || '提交失败', icon: 'none' })
            }
          }
        }
      })
    }
  })
}
```

- [ ] **Step 2: 检查并修改 work/index.vue 中的报告异常逻辑（如果存在）**
- [ ] **Step 3: 提交更改**
```bash
git add subpkg/order/detail.vue
git add pages/work/index.vue || true
git commit -m "fix: 改进报告异常交互逻辑"
```

---

### Task 10: 订单列表改为服务端过滤

**Files:**
- Modify: `pages/order/index.vue`
- Modify: `api/billiard/order.js`

- [ ] **Step 1: 先查看当前订单列表页的实现**
- [ ] **Step 2: 修改 API 调用，添加状态参数**
- [ ] **Step 3: 移除前端过滤逻辑**
- [ ] **Step 4: 提交更改**
```bash
git add pages/order/index.vue api/billiard/order.js
git commit -m "fix: 订单列表改为服务端过滤"
```

---

### Task 11: 补充个人中心完整菜单

**Files:**
- Modify: `pages/mine/index.vue`

- [ ] **Step 1: 查看当前个人中心页面结构**
- [ ] **Step 2: 添加个人信息菜单项**
```vue
<view class="menu-item" @click="navToInfo">
  <view class="menu-item-left">
    <view class="icon-box icon-blue">
      <uni-icons type="person" size="22" color="#fff"></uni-icons>
    </view>
    <view class="menu-text">个人信息</view>
  </view>
  <uni-icons type="right" size="18" color="#999"></uni-icons>
</view>
```

- [ ] **Step 3: 添加常见问题菜单项**
```vue
<view class="menu-item" @click="navToHelp">
  <view class="menu-item-left">
    <view class="icon-box icon-purple">
      <uni-icons type="help" size="22" color="#fff"></uni-icons>
    </view>
    <view class="menu-text">常见问题</view>
  </view>
  <uni-icons type="right" size="18" color="#999"></uni-icons>
</view>
```

- [ ] **Step 4: 添加关于我们菜单项**
```vue
<view class="menu-item" @click="navToAbout">
  <view class="menu-item-left">
    <view class="icon-box icon-gray">
      <uni-icons type="info" size="22" color="#fff"></uni-icons>
    </view>
    <view class="menu-text">关于我们</view>
  </view>
  <uni-icons type="right" size="18" color="#999"></uni-icons>
</view>
```

- [ ] **Step 5: 添加对应的跳转函数**
```javascript
const navToInfo = () => {
  uni.navigateTo({ url: '/subpkg/mine/info/index' })
}

const navToHelp = () => {
  uni.navigateTo({ url: '/subpkg/mine/help/index' })
}

const navToAbout = () => {
  uni.navigateTo({ url: '/subpkg/mine/about/index' })
}
```

- [ ] **Step 6: 提交更改**
```bash
git add pages/mine/index.vue
git commit -m "feat: 补充个人中心完整菜单"
```

---

### Task 12: 全部提现优化

**Files:**
- Verify: `subpkg/mine/wallet/withdraw/index.vue`

- [ ] **Step 1: 确认全部提现逻辑已正确（BUG-002已修复）**
- [ ] **Step 2: 验证全部提现按钮功能正常**
- [ ] **Step 3: 如有需要，提交优化**

---

## 第三批：低优先级优化

### Task 13: 优化硬编码联系电话

**Files:**
- Search: All files for contact phone numbers

- [ ] **Step 1: 搜索硬编码的联系电话**
```bash
grep -r "[0-9]\{3\}-[0-9]\{4\}-[0-9]\{4\}\|[0-9]\{11\}" --include="*.vue" --include="*.js" .
```

- [ ] **Step 2: 修改为从后端获取或使用配置**
- [ ] **Step 3: 提交更改**

---

### Task 14: 改进错误提示文案

**Files:**
- Search: All files for error messages

- [ ] **Step 1: 搜索所有错误提示文案**
- [ ] **Step 2: 优化不友好的文案**
- [ ] **Step 3: 提交更改**

---

## 计划自我审查

- ✅ 覆盖所有12个bug
- ✅ 无占位符内容
- ✅ 路径和代码准确
- ✅ 分批合理
- ✅ 提交粒度合适

