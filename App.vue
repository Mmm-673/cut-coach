<script setup>
import config from './config'
import { getToken, getUserId } from '@/utils/auth'
import { useConfigStore, useUserStore } from '@/store'
import { getCurrentInstance } from 'vue'
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { initPushService, syncPushForUser, retryPushSyncIfNeeded } from '@/utils/jpush'
import { shouldShowIosPrivacy, setPrivacyAgreedCallback } from '@/utils/privacy'


const { proxy } = getCurrentInstance()

onLaunch(() => {
  setPrivacyAgreedCallback(continueAppInit)
  initApp()
})


onShow(() => {
  // #ifdef APP-PLUS
  if (shouldShowIosPrivacy()) {
    return
  }
  retryPushSyncIfNeeded()
  // #endif
})

// 初始化应用
function initApp() {
  // 本地配置不涉隐私，需尽早初始化，避免登录页渲染时报错
  initConfig()

  // #ifdef APP-PLUS
  setStatusBarHeight()

  // iOS 需先同意隐私协议，弹窗挂载在登录页，此处仅阻断后续初始化
  if (shouldShowIosPrivacy()) {
    return
  }
  // #endif

  continueAppInit()
}

/** 应用核心初始化流程 */
function continueAppInit() {
  // #ifdef APP-PLUS
  initPushService()
  // #endif

  checkLoginAndRestore()
}

function initConfig() {
  useConfigStore().setConfig(config)
}

async function checkLoginAndRestore() {
  const token = getToken()
  if (!token) {
    proxy.$tab.reLaunch('/pages/login/index')
    return
  }

  // #ifdef APP-PLUS
  const userId = getUserId()
  if (userId) {
    syncPushForUser(userId)
  }
  // #endif

  // 有 token，尝试恢复用户信息
  try {
    const userStore = useUserStore()
    // 先从本地存储恢复基本信息(store 初始化时已经做了)
    // 再从服务端获取最新用户信息，验证 token 是否有效
    await userStore.getInfo()
    // 验证成功，进入首页
    proxy.$tab.reLaunch('/pages/work/index')
  } catch (error) {
    console.warn('恢复登录状态失败，需要重新登录:', error)
    // token 无效或过期，跳转登录页
    proxy.$tab.reLaunch('/pages/login/index')
  }
}
</script>

<style lang="scss">
@import '@/static/scss/index.scss'
</style>
