import { getAccessToken, getRefreshToken } from '@/utils/auth'

console.log('permission.js 加载')

// 登录页面
const loginPage = "/pages/login/index"

// 页面白名单
const whiteList = [
  '/pages/login/index',
  '/subpkg/common/webview/index',
  '/subpkg/common/agreement/index',
  '/subpkg/common/privacy/index',
]

// 检查是否有有效的认证信息
function hasValidAuth() {
  const token = getAccessToken()
  const refreshToken = getRefreshToken()
  return !!(token || refreshToken)
}

// 检查地址白名单
function checkWhite(url) {
  const path = url.split('?')[0]
  return whiteList.indexOf(path) !== -1
}

// 页面跳转验证拦截器
let list = ["navigateTo", "redirectTo", "reLaunch", "switchTab"]
list.forEach(item => {
  uni.addInterceptor(item, {
    invoke(to) {
      // console.log('页面跳转:', item, to.url)

      if (hasValidAuth()) {
        // 已登录状态
        if (to.url && to.url.includes(loginPage)) {
          // 已登录用户不让去登录页，跳首页
          // console.log('已登录，跳首页')
          uni.reLaunch({ url: '/pages/work/index' })
          return false
        }
        return true
      } else {
        // 未登录状态
        if (checkWhite(to.url)) {
          return true
        }
        // console.log('未登录，跳登录页')
        uni.reLaunch({ url: loginPage })
        return false
      }
    },
    fail(err) {
      console.log('页面跳转失败:', err)
    }
  })
})
