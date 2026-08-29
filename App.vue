<script setup>
import config from './config'
import { getAccessToken, getRefreshToken, getUserId } from '@/utils/auth'
import { useConfigStore, useUserStore } from '@/store'
import { onLaunch } from '@dcloudio/uni-app'
import { initPushService, syncPushForUser } from '@/utils/jpush'
import { shouldShowIosPrivacy, setPrivacyAgreedCallback } from '@/utils/privacy'
import wsManager from '@/utils/websocket'

onLaunch(() => {
  console.log('App Launch')
  setPrivacyAgreedCallback(continueAppInit)
  initApp()
})

// 初始化应用
function initApp() {
  // 初始化配置
  useConfigStore().setConfig(config)

  // #ifdef APP-PLUS
  // iOS 隐私协议
  if (shouldShowIosPrivacy()) {
    return
  }
  // #endif

  continueAppInit()
}

/** 应用核心初始化流程 */
function continueAppInit() {
  console.log('继续应用初始化')

  // #ifdef APP-PLUS
  initPushService()
  // #endif

  checkLogin()
}

// 检查登录状态并跳转
function checkLogin() {
  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()

  console.log('检查登录状态:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken
  })

  if (accessToken || refreshToken) {
    console.log('已登录，直接进入首页')

    // #ifdef APP-PLUS
    const userId = getUserId()
    if (userId) {
      syncPushForUser(userId)
    }
    // #endif

    // 已登录时连接 WebSocket，失败不影响主流程
    try {
      wsManager.connect()
    } catch (e) {
      console.warn('WebSocket 连接失败:', e)
    }

    // 初始化 store
    const userStore = useUserStore()

    // 直接跳首页
    uni.reLaunch({
      url: '/pages/work/index',
      success: () => {
        // 后台获取用户信息
        userStore.getInfo().catch(err => {
          console.log('后台获取用户信息失败:', err)
        })
      }
    })
  } else {
    console.log('未登录，停留在登录页')
    // 已经在登录页了，不需要做什么
  }
}
</script>

<style lang="scss">
@import '@/static/scss/index.scss';
</style>
